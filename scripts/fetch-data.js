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
