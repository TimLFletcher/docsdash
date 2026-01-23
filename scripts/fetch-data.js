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

    // Fetch top 5 pages for each documentation path
    const documentationPaths = [
      '/cloud/',
      '/analytics/',
      '/ai/',
      '/server/',
      '/operator/',
      '/enterprise-analytics/',
      '/couchbase-lite/',
      '/sync-gateway/',
      '/couchbase-edge-server/',
    ]

    const topPagesByPath = await Promise.all(
      documentationPaths.map(async (path) => {
        try {
          const [pathPagesResponse] = await analyticsDataClient.runReport({
            property: `properties/${propertyId}`,
            dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
            dimensions: [{ name: 'pagePath' }],
            metrics: [
              { name: 'screenPageViews' },
              { name: 'averageSessionDuration' },
            ],
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
                      fieldName: 'pagePath',
                      stringFilter: { matchType: 'BEGINS_WITH', value: path },
                    },
                  },
                ],
              },
            },
            orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
            limit: 5,
          })

          return {
            path: path.replace(/\//g, '').replace(/-/g, ' ') || 'root',
            displayPath: path,
            pages: pathPagesResponse.rows?.map(row => ({
              page: row.dimensionValues[0].value,
              views: parseInt(row.metricValues[0].value),
              avgTime: formatDuration(parseFloat(row.metricValues[1].value)),
            })) || [],
          }
        } catch (error) {
          console.error(`   ⚠️  Error fetching top pages for path ${path}:`, error.message)
          return {
            path: path.replace(/\//g, '').replace(/-/g, ' ') || 'root',
            displayPath: path,
            pages: [],
          }
        }
      })
    )

    console.log(`   ✅ Fetched top pages for ${topPagesByPath.length} documentation paths`)

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

    // Helper function to format duration
    const formatDuration = (seconds) => {
      const mins = Math.floor(seconds / 60)
      const secs = Math.floor(seconds % 60)
      return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    // Fetch metrics for each documentation path (reuse paths array)
    const pathMetrics = await Promise.all(
      documentationPaths.map(async (path) => {
        try {
          // Fetch page views for this path
          const [pathViewsResponse] = await analyticsDataClient.runReport({
            property: `properties/${propertyId}`,
            dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
            dimensions: [{ name: 'pagePath' }],
            metrics: [{ name: 'screenPageViews' }],
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
                      fieldName: 'pagePath',
                      stringFilter: { matchType: 'BEGINS_WITH', value: path },
                    },
                  },
                ],
              },
            },
          })

          // Fetch session metrics for this path
          const [pathSessionResponse] = await analyticsDataClient.runReport({
            property: `properties/${propertyId}`,
            dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
            metrics: [
              { name: 'sessions' },
              { name: 'bounceRate' },
              { name: 'averageSessionDuration' },
            ],
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
                      fieldName: 'pagePath',
                      stringFilter: { matchType: 'BEGINS_WITH', value: path },
                    },
                  },
                ],
              },
            },
          })

          // Fetch traffic sources for this path
          const [pathTrafficResponse] = await analyticsDataClient.runReport({
            property: `properties/${propertyId}`,
            dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
            dimensions: [{ name: 'sessionDefaultChannelGroup' }],
            metrics: [{ name: 'sessions' }],
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
                      fieldName: 'pagePath',
                      stringFilter: { matchType: 'BEGINS_WITH', value: path },
                    },
                  },
                ],
              },
            },
          })

          // Calculate totals
          const totalViews = pathViewsResponse.rows?.reduce(
            (sum, row) => sum + parseInt(row.metricValues[0].value),
            0
          ) || 0

          const bounceRate = pathSessionResponse.rows?.[0]
            ? parseFloat(pathSessionResponse.rows[0].metricValues[1].value)
            : 0

          const avgSessionDuration = pathSessionResponse.rows?.[0]
            ? parseFloat(pathSessionResponse.rows[0].metricValues[2].value)
            : 0

          // Calculate traffic balance (direct vs search)
          const trafficRows = pathTrafficResponse.rows || []
          const directSessions = trafficRows
            .filter(row => row.dimensionValues[0].value === 'Direct')
            .reduce((sum, row) => sum + parseInt(row.metricValues[0].value), 0)
          
          const searchSessions = trafficRows
            .filter(row => row.dimensionValues[0].value === 'Organic Search')
            .reduce((sum, row) => sum + parseInt(row.metricValues[0].value), 0)
          
          const totalSessions = trafficRows.reduce(
            (sum, row) => sum + parseInt(row.metricValues[0].value),
            0
          )

          const directPercentage = totalSessions > 0
            ? Math.round((directSessions / totalSessions) * 100)
            : 0
          const searchPercentage = totalSessions > 0
            ? Math.round((searchSessions / totalSessions) * 100)
            : 0

          return {
            path: path.replace(/\//g, '').replace(/-/g, ' ') || 'root',
            displayPath: path,
            totalViews,
            bounceRate: bounceRate.toFixed(1),
            avgSessionDuration: formatDuration(avgSessionDuration),
            trafficBalance: {
              direct: directPercentage,
              search: searchPercentage,
            },
          }
        } catch (error) {
          console.error(`   ⚠️  Error fetching metrics for path ${path}:`, error.message)
          return {
            path: path.replace(/\//g, '').replace(/-/g, ' ') || 'root',
            displayPath: path,
            totalViews: 0,
            bounceRate: '0.0',
            avgSessionDuration: '0:00',
            trafficBalance: {
              direct: 0,
              search: 0,
            },
          }
        }
      })
    )

    console.log(`   ✅ Fetched metrics for ${pathMetrics.length} documentation paths`)

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

    return {
      pageViews: {
        total: totalViews,
        trend: parseFloat(trend),
        daily,
      },
      topPagesByPath: topPagesByPath,
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
      pathComparison: pathMetrics,
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
      'Accept-Language': 'en', // Force English responses
    }

    // Fetch open issues using new /search/jql endpoint
    // Using status IN filter to match only active statuses
    const openIssuesResponse = await fetch(
      `${baseUrl}/rest/api/3/search/jql`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          jql: `project=${projectKey} AND status IN ("In Progress", "In Review", Reopened, Open) ORDER BY priority DESC`,
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
          jql: `project=${projectKey} AND status IN ("In Progress", "In Review", Reopened, Open)`,
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
          jql: `project=${projectKey} AND status IN ("In Progress", "In Review", Reopened, Open) ORDER BY created DESC`,
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

    // Fetch monthly opened count (last 30 days)
    const monthlyOpenedResponse = await fetch(
      `${baseUrl}/rest/api/3/search/approximate-count`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          jql: `project = DOC AND created >= -30d`,
        }),
      }
    )
    
    if (!monthlyOpenedResponse.ok) {
      const errorText = await monthlyOpenedResponse.text()
      throw new Error(`Jira API error (${monthlyOpenedResponse.status}): ${errorText}`)
    }
    
    const monthlyOpenedData = await monthlyOpenedResponse.json()
    console.log(`   ✅ Found ${monthlyOpenedData.count || 0} issues opened in last 30 days`)

    // Fetch monthly resolved count
    const monthlyResolvedResponse = await fetch(
      `${baseUrl}/rest/api/3/search/approximate-count`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          jql: `project = DOC AND resolved >= -30d`,
        }),
      }
    )
    
    if (!monthlyResolvedResponse.ok) {
      const errorText = await monthlyResolvedResponse.text()
      throw new Error(`Jira API error (${monthlyResolvedResponse.status}): ${errorText}`)
    }
    
    const monthlyResolvedData = await monthlyResolvedResponse.json()
    console.log(`   ✅ Found ${monthlyResolvedData.count || 0} issues resolved in last 30 days`)

    // Fetch previous month opened count (60-30 days ago)
    const previousMonthOpenedResponse = await fetch(
      `${baseUrl}/rest/api/3/search/approximate-count`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          jql: `project = DOC AND created >= -60d AND created <= -30d`,
        }),
      }
    )
    
    if (!previousMonthOpenedResponse.ok) {
      const errorText = await previousMonthOpenedResponse.text()
      throw new Error(`Jira API error (${previousMonthOpenedResponse.status}): ${errorText}`)
    }
    
    const previousMonthOpenedData = await previousMonthOpenedResponse.json()
    console.log(`   ✅ Found ${previousMonthOpenedData.count || 0} issues opened in previous month`)

    // Fetch previous month resolved count (60-30 days ago)
    const previousMonthResolvedResponse = await fetch(
      `${baseUrl}/rest/api/3/search/approximate-count`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          jql: `project = DOC AND resolved >= -60d AND resolved <= -30d`,
        }),
      }
    )
    
    if (!previousMonthResolvedResponse.ok) {
      const errorText = await previousMonthResolvedResponse.text()
      throw new Error(`Jira API error (${previousMonthResolvedResponse.status}): ${errorText}`)
    }
    
    const previousMonthResolvedData = await previousMonthResolvedResponse.json()
    console.log(`   ✅ Found ${previousMonthResolvedData.count || 0} issues resolved in previous month`)

    // Fetch resolved issues for previous month to calculate average resolution time
    const previousMonthResolvedIssuesResponse = await fetch(
      `${baseUrl}/rest/api/3/search/jql`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          jql: `project = DOC AND resolved >= -60d AND resolved <= -30d AND resolutiondate IS NOT NULL`,
          maxResults: 100,
          fields: ['created', 'resolutiondate'],
        }),
      }
    )
    
    let previousMonthAvgResolutionDays = 0
    if (previousMonthResolvedIssuesResponse.ok) {
      const previousMonthResolvedIssuesData = await previousMonthResolvedIssuesResponse.json()
      const previousMonthResolutionTimes = previousMonthResolvedIssuesData.issues
        ?.filter(issue => issue.fields.created && issue.fields.resolutiondate)
        .map(issue => {
          const created = new Date(issue.fields.created)
          const resolved = new Date(issue.fields.resolutiondate)
          return (resolved - created) / (1000 * 60 * 60 * 24) // Convert to days
        }) || []
      
      if (previousMonthResolutionTimes.length > 0) {
        previousMonthAvgResolutionDays = previousMonthResolutionTimes.reduce((sum, days) => sum + days, 0) / previousMonthResolutionTimes.length
      }
      console.log(`   ✅ Calculated previous month avg resolution time: ${previousMonthAvgResolutionDays.toFixed(2)} days`)
    }

    // Calculate previous month burn rate
    const previousMonthOpened = previousMonthOpenedData.count || 0
    const previousMonthResolved = previousMonthResolvedData.count || 0
    const previousMonthBurnRate = previousMonthResolved > 0 ? (previousMonthOpened / previousMonthResolved).toFixed(2) : '0.00'

    // Fetch labels data - Totoro vs Non-Totoro
    const totoroLabelsResponse = await fetch(
      `${baseUrl}/rest/api/3/search/approximate-count`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          jql: `project = "Couchbase Documentation" AND labels IN (totoro-planned, Totoro) AND status IN ("In Progress", "In Review", Open)`,
        }),
      }
    )
    
    if (!totoroLabelsResponse.ok) {
      const errorText = await totoroLabelsResponse.text()
      throw new Error(`Jira API error (${totoroLabelsResponse.status}): ${errorText}`)
    }
    
    const totoroLabelsData = await totoroLabelsResponse.json()
    const totoroCount = totoroLabelsData.count || 0
    console.log(`   ✅ Found ${totoroCount} Totoro issues`)

    const nonTotoroLabelsResponse = await fetch(
      `${baseUrl}/rest/api/3/search/approximate-count`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          jql: `project = "Couchbase Documentation" AND status IN ("In Progress", "In Review", Open) AND (labels NOT IN (Totoro, totoro-planned) OR labels IS EMPTY)`,
        }),
      }
    )
    
    if (!nonTotoroLabelsResponse.ok) {
      const errorText = await nonTotoroLabelsResponse.text()
      throw new Error(`Jira API error (${nonTotoroLabelsResponse.status}): ${errorText}`)
    }
    
    const nonTotoroLabelsData = await nonTotoroLabelsResponse.json()
    const nonTotoroCount = nonTotoroLabelsData.count || 0
    console.log(`   ✅ Found ${nonTotoroCount} Non-Totoro issues`)

    // Create labels chart data
    const topLabels = [
      {
        label: 'Totoro',
        count: totoroCount,
        color: '#ef4444',
      },
      {
        label: 'Non-Totoro',
        count: nonTotoroCount,
        color: '#3b82f6',
      },
    ]

    // Fetch resolved issues to calculate average resolution time (last 30 days)
    const resolvedIssuesResponse = await fetch(
      `${baseUrl}/rest/api/3/search/jql`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          jql: `project = DOC AND resolved >= -30d AND resolutiondate IS NOT NULL`,
          maxResults: 100,
          fields: ['created', 'resolutiondate'],
        }),
      }
    )
    
    let avgResolutionDays = 0
    if (resolvedIssuesResponse.ok) {
      const resolvedIssuesData = await resolvedIssuesResponse.json()
      const resolutionTimes = resolvedIssuesData.issues
        ?.filter(issue => issue.fields.created && issue.fields.resolutiondate)
        .map(issue => {
          const created = new Date(issue.fields.created)
          const resolved = new Date(issue.fields.resolutiondate)
          return (resolved - created) / (1000 * 60 * 60 * 24) // Convert to days
        }) || []
      
      if (resolutionTimes.length > 0) {
        avgResolutionDays = resolutionTimes.reduce((sum, days) => sum + days, 0) / resolutionTimes.length
      }
      console.log(`   ✅ Calculated avg resolution time: ${avgResolutionDays.toFixed(2)} days`)
    }

    // Calculate burn rate (opened/resolved)
    const monthlyOpened = monthlyOpenedData.count || 0
    const monthlyResolved = monthlyResolvedData.count || 0
    const burnRate = monthlyResolved > 0 ? (monthlyOpened / monthlyResolved).toFixed(2) : '0.00'

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
      avgResolutionDays: parseFloat(avgResolutionDays.toFixed(2)),
      issuesClosedThisWeek: closedThisWeekData.count || 0,
      issuesCreatedThisWeek: createdThisWeekData.count || 0,
      monthlyOpened: monthlyOpened,
      monthlyResolved: monthlyResolved,
      burnRate: parseFloat(burnRate),
      previousMonthOpened: previousMonthOpened,
      previousMonthResolved: previousMonthResolved,
      previousMonthBurnRate: parseFloat(previousMonthBurnRate),
      previousMonthAvgResolutionDays: parseFloat(previousMonthAvgResolutionDays.toFixed(2)),
      topLabels: topLabels,
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
