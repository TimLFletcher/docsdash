/**
 * Data Fetching Script for DocsDash
 * 
 * This script fetches data from Google Analytics 4 and Jira,
 * then generates a JSON file that the dashboard consumes.
 * 
 * It's designed to run in GitHub Actions with secrets for authentication.
 * 
 * Required Environment Variables:
 * - GA_PROPERTY_ID: Google Analytics 4 property ID
 * - GOOGLE_SERVICE_ACCOUNT_KEY: JSON key for GCP service account
 * - JIRA_BASE_URL: Your Jira instance URL (e.g., https://your-org.atlassian.net)
 * - JIRA_EMAIL: Jira account email
 * - JIRA_API_TOKEN: Jira API token
 * - JIRA_PROJECT_KEY: Jira project key (e.g., DOC)
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Check if we're in a CI environment with real credentials
const hasGACredentials = process.env.GA_PROPERTY_ID && process.env.GOOGLE_SERVICE_ACCOUNT_KEY
const hasJiraCredentials = process.env.JIRA_BASE_URL && process.env.JIRA_EMAIL && process.env.JIRA_API_TOKEN

/**
 * Fetch Google Analytics 4 Data
 * 
 * Uses the GA4 Data API to fetch:
 * - Page views and sessions
 * - Top pages
 * - Search terms (if Site Search is configured)
 * - User metrics
 */
async function fetchGoogleAnalyticsData() {
  if (!hasGACredentials) {
    console.log('⚠️  No GA credentials found, using sample data')
    return null
  }

  console.log('📊 Fetching Google Analytics data...')

  try {
    // Dynamic import for GA4 client (only needed in production)
    const { BetaAnalyticsDataClient } = await import('@google-analytics/data')
    
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY)
    const analyticsDataClient = new BetaAnalyticsDataClient({ credentials })
    
    const propertyId = process.env.GA_PROPERTY_ID

    // Fetch page views for last 7 days (filtered to docs.couchbase.com)
    const [pageViewsResponse] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'date' }],
      metrics: [{ name: 'screenPageViews' }],
      dimensionFilter: {
        filter: {
          fieldName: 'hostName',
          stringFilter: { matchType: 'EXACT', value: 'docs.couchbase.com' },
        },
      },
      orderBys: [{ dimension: { dimensionName: 'date' } }],
    })

    // Fetch top pages (filtered to docs.couchbase.com)
    const [topPagesResponse] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [
        { name: 'screenPageViews' },
        { name: 'averageSessionDuration' },
      ],
      dimensionFilter: {
        filter: {
          fieldName: 'hostName',
          stringFilter: { matchType: 'EXACT', value: 'docs.couchbase.com' },
        },
      },
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 10,
    })

    // Fetch search terms (requires Site Search to be configured, filtered to docs.couchbase.com)
    const [searchTermsResponse] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'searchTerm' }],
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: {
        andGroup: {
          expressions: [
            {
              filter: {
                fieldName: 'hostName',
                stringFilter: { matchType: 'EXACT', value: 'docs.couchbase.com' },
              },
            },
            {
              filter: {
                fieldName: 'searchTerm',
                stringFilter: { matchType: 'FULL_REGEXP', value: '.+' },
              },
            },
          ],
        },
      },
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      limit: 10,
    })

    // Fetch user metrics (filtered to docs.couchbase.com)
    const [userMetricsResponse] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        { startDate: '30daysAgo', endDate: 'today' },
        { startDate: '60daysAgo', endDate: '31daysAgo' },
      ],
      metrics: [
        { name: 'totalUsers' },
        { name: 'activeUsers' },
        { name: 'averageSessionDuration' },
        { name: 'bounceRate' },
        { name: 'screenPageViews' },
      ],
      dimensionFilter: {
        filter: {
          fieldName: 'hostName',
          stringFilter: { matchType: 'EXACT', value: 'docs.couchbase.com' },
        },
      },
    })

    // Fetch traffic sources (filtered to docs.couchbase.com)
    const [trafficSourcesResponse] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'sessionDefaultChannelGroup' }],
      metrics: [{ name: 'sessions' }],
      dimensionFilter: {
        filter: {
          fieldName: 'hostName',
          stringFilter: { matchType: 'EXACT', value: 'docs.couchbase.com' },
        },
      },
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 5,
    })

    // Process responses into dashboard format
    const daily = pageViewsResponse.rows.map(row => ({
      date: row.dimensionValues[0].value.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'),
      views: parseInt(row.metricValues[0].value),
    }))

    const totalViews = daily.reduce((sum, d) => sum + d.views, 0)
    const currentPeriodViews = parseInt(userMetricsResponse.rows[0].metricValues[4].value)
    const previousPeriodViews = userMetricsResponse.rows[1] 
      ? parseInt(userMetricsResponse.rows[1].metricValues[4].value)
      : currentPeriodViews
    const trend = previousPeriodViews > 0 
      ? ((currentPeriodViews - previousPeriodViews) / previousPeriodViews * 100).toFixed(1)
      : 0

    const formatDuration = (seconds) => {
      const mins = Math.floor(seconds / 60)
      const secs = Math.floor(seconds % 60)
      return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    return {
      pageViews: {
        total: totalViews,
        trend: parseFloat(trend),
        daily,
      },
      topPages: topPagesResponse.rows.map(row => ({
        page: row.dimensionValues[0].value,
        views: parseInt(row.metricValues[0].value),
        avgTime: formatDuration(parseFloat(row.metricValues[1].value)),
      })),
      searchTerms: searchTermsResponse.rows?.map(row => ({
        term: row.dimensionValues[0].value,
        count: parseInt(row.metricValues[0].value),
        resultsFound: true, // You'll need custom logic to track this
      })) || [],
      userMetrics: {
        uniqueVisitors: parseInt(userMetricsResponse.rows[0].metricValues[0].value),
        avgSessionDuration: formatDuration(parseFloat(userMetricsResponse.rows[0].metricValues[2].value)),
        bounceRate: parseFloat(userMetricsResponse.rows[0].metricValues[3].value).toFixed(1),
        returningVisitors: 42.5, // Requires additional query
      },
      trafficSources: trafficSourcesResponse.rows.map((row, i) => {
        const totalSessions = trafficSourcesResponse.rows.reduce(
          (sum, r) => sum + parseInt(r.metricValues[0].value), 0
        )
        const sessions = parseInt(row.metricValues[0].value)
        return {
          source: row.dimensionValues[0].value,
          sessions,
          percentage: Math.round((sessions / totalSessions) * 100),
        }
      }),
      deviceBreakdown: [
        { device: 'Desktop', percentage: 72 },
        { device: 'Mobile', percentage: 22 },
        { device: 'Tablet', percentage: 6 },
      ], // Requires additional query
    }
  } catch (error) {
    console.error('❌ Error fetching GA data:', error.message)
    return null
  }
}

/**
 * Fetch Jira Data
 * 
 * Uses the Jira REST API to fetch:
 * - Open issues by priority
 * - Recent issues
 * - Sprint velocity
 */
async function fetchJiraData() {
  if (!hasJiraCredentials) {
    console.log('⚠️  No Jira credentials found, using sample data')
    return null
  }

  console.log('🎫 Fetching Jira data...')

  try {
    const baseUrl = process.env.JIRA_BASE_URL
    const email = process.env.JIRA_EMAIL
    const apiToken = process.env.JIRA_API_TOKEN
    const projectKey = process.env.JIRA_PROJECT_KEY || 'DOC'
    
    console.log(`   Using Jira base URL: ${baseUrl}`)
    console.log(`   Using project key: ${projectKey}`)
    
    const auth = Buffer.from(`${email}:${apiToken}`).toString('base64')
    const headers = {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    }

    // Fetch open issues using new /search/jql endpoint
    const openIssuesResponse = await fetch(
      `${baseUrl}/rest/api/3/search/jql`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          jql: `project=${projectKey} AND status != Done ORDER BY priority DESC`,
          maxResults: 100,
          fields: ['summary', 'priority', 'status', 'created'],
        }),
      }
    )
    
    if (!openIssuesResponse.ok) {
      const errorText = await openIssuesResponse.text()
      throw new Error(`Jira API error (${openIssuesResponse.status}): ${errorText}`)
    }
    
    const openIssuesData = await openIssuesResponse.json()
    const openIssuesCount = openIssuesData.issues?.length || 0
    console.log(`   ✅ Fetched ${openIssuesCount} open issues`)

    // Get total count of open issues using approximate-count endpoint
    const openIssuesCountResponse = await fetch(
      `${baseUrl}/rest/api/3/search/approximate-count`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          jql: `project=${projectKey} AND status != Done`,
        }),
      }
    )
    
    if (!openIssuesCountResponse.ok) {
      const errorText = await openIssuesCountResponse.text()
      throw new Error(`Jira API error (${openIssuesCountResponse.status}): ${errorText}`)
    }
    
    const openIssuesCountData = await openIssuesCountResponse.json()
    const totalOpenIssues = openIssuesCountData.count || openIssuesCount

    // Count by priority
    const priorityCounts = {}
    const priorityColors = {
      'Highest': '#ef4444',
      'High': '#f97316',
      'Medium': '#eab308',
      'Low': '#22c55e',
      'Lowest': '#6b7280',
    }

    openIssuesData.issues?.forEach(issue => {
      const priority = issue.fields.priority?.name || 'Medium'
      priorityCounts[priority] = (priorityCounts[priority] || 0) + 1
    })

    // Fetch recent issues using new /search/jql endpoint
    const recentIssuesResponse = await fetch(
      `${baseUrl}/rest/api/3/search/jql`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          jql: `project=${projectKey} ORDER BY created DESC`,
          maxResults: 5,
          fields: ['summary', 'priority', 'status', 'created'],
        }),
      }
    )
    
    if (!recentIssuesResponse.ok) {
      const errorText = await recentIssuesResponse.text()
      throw new Error(`Jira API error (${recentIssuesResponse.status}): ${errorText}`)
    }
    
    const recentIssuesData = await recentIssuesResponse.json()
    console.log(`   ✅ Fetched ${recentIssuesData.issues?.length || 0} recent issues`)

    // Fetch issues created this week using approximate-count endpoint
    const createdThisWeekResponse = await fetch(
      `${baseUrl}/rest/api/3/search/approximate-count`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          jql: `project=${projectKey} AND created >= -7d`,
        }),
      }
    )
    
    if (!createdThisWeekResponse.ok) {
      const errorText = await createdThisWeekResponse.text()
      throw new Error(`Jira API error (${createdThisWeekResponse.status}): ${errorText}`)
    }
    
    const createdThisWeekData = await createdThisWeekResponse.json()
    console.log(`   ✅ Found ${createdThisWeekData.count || 0} issues created this week`)

    // Fetch issues closed this week using approximate-count endpoint
    const closedThisWeekResponse = await fetch(
      `${baseUrl}/rest/api/3/search/approximate-count`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          jql: `project=${projectKey} AND status = Done AND updated >= -7d`,
        }),
      }
    )
    
    if (!closedThisWeekResponse.ok) {
      const errorText = await closedThisWeekResponse.text()
      throw new Error(`Jira API error (${closedThisWeekResponse.status}): ${errorText}`)
    }
    
    const closedThisWeekData = await closedThisWeekResponse.json()
    console.log(`   ✅ Found ${closedThisWeekData.count || 0} issues closed this week`)

    return {
      openIssues: {
        total: totalOpenIssues,
        byPriority: Object.entries(priorityCounts).map(([priority, count]) => ({
          priority: priority === 'Highest' ? 'Critical' : priority,
          count,
          color: priorityColors[priority] || '#6b7280',
        })),
      },
      recentIssues: recentIssuesData.issues?.map(issue => ({
        key: issue.key,
        summary: issue.fields.summary,
        priority: issue.fields.priority?.name === 'Highest' ? 'Critical' : issue.fields.priority?.name || 'Medium',
        status: issue.fields.status?.name || 'To Do',
        created: issue.fields.created.split('T')[0],
      })) || [],
      velocityTrend: [
        // This would require fetching sprint data from Jira Software
        // Placeholder data - implement with your sprint board
        { sprint: 'Sprint 18', completed: 12, planned: 15 },
        { sprint: 'Sprint 19', completed: 14, planned: 14 },
        { sprint: 'Sprint 20', completed: 11, planned: 16 },
        { sprint: 'Sprint 21', completed: 15, planned: 15 },
        { sprint: 'Sprint 22', completed: 8, planned: 14 },
      ],
      issuesByType: [],
      avgResolutionDays: 4.2,
      issuesClosedThisWeek: closedThisWeekData.count || 0,
      issuesCreatedThisWeek: createdThisWeekData.count || 0,
    }
  } catch (error) {
    console.error('❌ Error fetching Jira data:', error.message)
    console.error('   Stack:', error.stack)
    if (error.response) {
      console.error('   Response status:', error.response.status)
      console.error('   Response body:', error.response.body)
    }
    return null
  }
}

/**
 * Generate insights based on the data
 */
function generateInsights(analytics, jira) {
  const insights = {
    contentGaps: [],
    performanceNotes: [],
  }

  // Find content gaps from search terms
  if (analytics?.searchTerms) {
    analytics.searchTerms
      .filter(term => !term.resultsFound)
      .slice(0, 5)
      .forEach(term => {
        insights.contentGaps.push(
          `"${term.term}" (${term.count} searches, no results)`
        )
      })
  }

  // Generate performance notes
  if (analytics?.topPages) {
    const highTimePages = analytics.topPages
      .filter(p => {
        const [mins] = p.avgTime.split(':').map(Number)
        return mins >= 5
      })
    
    if (highTimePages.length > 0) {
      insights.performanceNotes.push(
        `${highTimePages[0].page} has high avg. time (${highTimePages[0].avgTime}) - users may be struggling`
      )
    }
  }

  if (analytics?.userMetrics?.bounceRate > 40) {
    insights.performanceNotes.push(
      `Bounce rate is ${analytics.userMetrics.bounceRate}% - consider improving page introductions`
    )
  }

  if (jira?.issuesCreatedThisWeek > jira?.issuesClosedThisWeek) {
    insights.performanceNotes.push(
      `Issue backlog growing: ${jira.issuesCreatedThisWeek} created vs ${jira.issuesClosedThisWeek} closed this week`
    )
  }

  return insights
}

/**
 * Load sample data as fallback
 */
function loadSampleData() {
  const samplePath = path.join(__dirname, '..', 'src', 'data', 'sample-data.json')
  return JSON.parse(fs.readFileSync(samplePath, 'utf-8'))
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting data fetch...\n')

  const sampleData = loadSampleData()
  
  // Fetch real data or use sample data
  const analyticsData = await fetchGoogleAnalyticsData() || sampleData.analytics
  const jiraData = await fetchJiraData() || sampleData.jira
  const insights = generateInsights(analyticsData, jiraData)

  // Combine into dashboard data
  const dashboardData = {
    lastUpdated: new Date().toISOString(),
    analytics: analyticsData,
    jira: jiraData,
    insights: insights.contentGaps.length > 0 ? insights : sampleData.insights,
  }

  // Ensure output directory exists
  const outputDir = path.join(__dirname, '..', 'dist', 'data')
  const srcDataDir = path.join(__dirname, '..', 'src', 'data')
  
  // Write to src/data for development
  fs.writeFileSync(
    path.join(srcDataDir, 'dashboard-data.json'),
    JSON.stringify(dashboardData, null, 2)
  )
  console.log('✅ Written to src/data/dashboard-data.json')

  // Also write to public/data if dist exists (for build)
  const publicDir = path.join(__dirname, '..', 'public', 'data')
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true })
  }
  fs.writeFileSync(
    path.join(publicDir, 'dashboard-data.json'),
    JSON.stringify(dashboardData, null, 2)
  )
  console.log('✅ Written to public/data/dashboard-data.json')

  console.log('\n✨ Data fetch complete!')
}

main().catch(console.error)
