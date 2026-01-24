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
import { fetchGoogleAnalyticsData } from './fetch-ga.js'
import { fetchJiraData } from './fetch-jira.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

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

  return insights
}

// Fetch insights using OpenAI
async function fetchAIInsights(analyticsData, jiraData) {
  console.log('🧠 Fetching AI-powered insights...')
  
  if (!process.env.OPENAI_API_KEY) {
    console.log('⚠️  OPENAI_API_KEY not found, skipping AI insights generation')
    return null
  }

  try {
    // Import the insights functions directly
    const { analyzeTrafficTrends, analyzeJiraTrends, detectDuplicates } = await import('./insights-api.js')
    
    // Create dashboard data object
    const dashboardData = {
      analytics: analyticsData,
      jira: jiraData
    }

    const results = {}

    // Run analyses in parallel
    const analyses = []

    analyses.push(
      analyzeTrafficTrends(process.env.OPENAI_API_KEY, dashboardData)
        .then(result => { results.traffic = result })
        .catch(error => { 
          console.log('⚠️  Traffic analysis failed:', error.message)
          results.traffic = null 
        })
    )

    analyses.push(
      analyzeJiraTrends(process.env.OPENAI_API_KEY, dashboardData)
        .then(result => { results.jira = result })
        .catch(error => { 
          console.log('⚠️  Jira analysis failed:', error.message)
          results.jira = null 
        })
    )

    analyses.push(
      detectDuplicates(process.env.OPENAI_API_KEY, dashboardData)
        .then(result => { results.duplicates = result })
        .catch(error => { 
          console.log('⚠️  Duplicate detection failed:', error.message)
          results.duplicates = null 
        })
    )

    await Promise.all(analyses)

    console.log('   ✅ AI insights generated successfully')
    return results

  } catch (error) {
    console.error('❌ Error fetching AI insights:', error.message)
    return null
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting data fetch...\n')

  const errors = []
  
  // Fetch real data - no fallback
  const analyticsData = await fetchGoogleAnalyticsData()
  if (!analyticsData) {
    errors.push('Failed to fetch Google Analytics data')
  }

  const jiraData = await fetchJiraData()
  if (!jiraData) {
    errors.push('Failed to fetch Jira data')
  }

  // If both failed, exit with error
  if (!analyticsData && !jiraData) {
    console.error('\n❌ Failed to fetch any data:')
    errors.forEach(e => console.error(`   - ${e}`))
    process.exit(1)
  }

  // Log warnings for partial failures
  if (errors.length > 0) {
    console.warn('\n⚠️  Some data sources failed:')
    errors.forEach(e => console.warn(`   - ${e}`))
  }

  const insights = generateInsights(analyticsData, jiraData)
  
  // Fetch AI insights if OpenAI API key is available
  const aiInsights = await fetchAIInsights(analyticsData, jiraData)
  if (aiInsights) {
    insights.aiInsights = aiInsights
  }

  // Combine into dashboard data
  const dashboardData = {
    lastUpdated: new Date().toISOString(),
    analytics: analyticsData || null,
    jira: jiraData || null,
    insights: insights,
    errors: errors.length > 0 ? errors : undefined,
  }

  // Ensure output directory exists
  const srcDataDir = path.join(__dirname, '..', 'src', 'data')
  if (!fs.existsSync(srcDataDir)) {
    fs.mkdirSync(srcDataDir, { recursive: true })
  }
  
  // Write to src/data for development
  fs.writeFileSync(
    path.join(srcDataDir, 'dashboard-data.json'),
    JSON.stringify(dashboardData, null, 2)
  )
  console.log('✅ Written to src/data/dashboard-data.json')

  // Also write to public/data for build
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

main().catch(error => {
  console.error('❌ Fatal error:', error.message)
  process.exit(1)
})
