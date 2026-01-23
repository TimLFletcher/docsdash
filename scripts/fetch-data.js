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
