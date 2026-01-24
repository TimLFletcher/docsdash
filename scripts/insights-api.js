/**
 * LLM-powered insights API endpoint
 * Generates analysis using OpenAI API for dashboard data
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Fetches dashboard data from the public data directory
 */
async function getDashboardData() {
  const dataPath = path.join(__dirname, '..', 'public', 'data', 'dashboard-data.json')
  
  try {
    const data = await fs.promises.readFile(dataPath, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error reading dashboard data:', error)
    return null
  }
}

/**
 * Calls OpenAI API with structured prompt
 */
export async function callOpenAI(apiKey, prompt, data) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a data analyst specializing in documentation metrics and Jira analytics. Provide concise, actionable insights. Use markdown formatting with clear sections and bullet points.'
        },
        {
          role: 'user',
          content: prompt + '\n\nData:\n' + JSON.stringify(data, null, 2)
        }
      ],
      max_tokens: 1000,
      temperature: 0.3,
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
  }

  const result = await response.json()
  return result.choices[0].message.content
}

/**
 * Analyzes web traffic trends
 */
export async function analyzeTrafficTrends(apiKey, data) {
  const prompt = `
Analyze the following web traffic data and provide insights on:
1. Overall traffic trends (increasing/decreasing/stable)
2. Notable patterns in user behavior
3. Top performing pages and why they might be doing well
4. Areas for improvement based on bounce rates and session duration
5. Any anomalies or concerning patterns

Focus on actionable insights that would help improve documentation effectiveness.
`

  return await callOpenAI(apiKey, prompt, {
    pageViews: data.analytics?.pageViews,
    userMetrics: data.analytics?.userMetrics,
    topPages: data.analytics?.topPages?.slice(0, 10),
    topPagesByPath: data.analytics?.topPagesByPath?.slice(0, 10),
    searchTerms: data.analytics?.searchTerms?.slice(0, 15),
    trafficSources: data.analytics?.trafficSources,
  })
}

/**
 * Analyzes Jira ticket trends
 */
export async function analyzeJiraTrends(apiKey, data) {
  const prompt = `
Analyze the following Jira data and provide insights on:
1. Ticket creation vs resolution trends (are we keeping up?)
2. Velocity patterns and sprint health
3. Resolution time trends (improving/worsening?)
4. Burn rate analysis and sustainability
5. Priority distribution and any critical issues needing attention
6. Overall team capacity and workload balance

Provide specific recommendations for improving process efficiency.
`

  return await callOpenAI(apiKey, prompt, {
    openIssues: data.jira?.openIssues,
    recentIssues: data.jira?.recentIssues,
    velocityTrend: data.jira?.velocityTrend,
    avgResolutionDays: data.jira?.avgResolutionDays,
    monthlyOpened: data.jira?.monthlyOpened,
    monthlyResolved: data.jira?.monthlyResolved,
    previousMonthOpened: data.jira?.previousMonthOpened,
    previousMonthResolved: data.jira?.previousMonthResolved,
    burnRate: data.jira?.burnRate,
    previousMonthBurnRate: data.jira?.previousMonthBurnRate,
  })
}

/**
 * Detects potential duplicate tickets from last 30 days
 */
export async function detectDuplicates(apiKey, data) {
  const prompt = `
Review these recent Jira tickets from the last 30 days and identify potential duplicates. Look for:
1. Similar titles or summaries
2. Same issue type and priority
3. Similar components or labels
4. Tickets that might describe the same underlying problem

For each potential duplicate group, explain why they might be duplicates and suggest which one to keep active.
Only flag clear duplicates - avoid false positives. If no duplicates are found, state that clearly.

Format your response with clear duplicate groups and reasoning.
`

  // Get recent issues from the last 30 days
  const recentIssues = data.jira?.recentIssues?.filter(issue => {
    const createdDate = new Date(issue.created)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    return createdDate >= thirtyDaysAgo
  }) || []

  return await callOpenAI(apiKey, prompt, {
    recentIssues: recentIssues,
  })
}

/**
 * Main API handler for insights generation
 */
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { analysisTypes = ['traffic', 'jira', 'duplicates'] } = req.body

    // Use API key from environment variable (server-side) or from request (development)
    const apiKey = process.env.OPENAI_API_KEY || req.body.apiKey

    if (!apiKey) {
      return res.status(400).json({ error: 'OpenAI API key is required' })
    }

    // Get dashboard data
    const dashboardData = await getDashboardData()
    if (!dashboardData) {
      return res.status(500).json({ error: 'Failed to load dashboard data' })
    }

    const results = {}

    // Run requested analyses in parallel
    const analyses = []

    if (analysisTypes.includes('traffic')) {
      analyses.push(
        analyzeTrafficTrends(apiKey, dashboardData)
          .then(result => { results.traffic = result })
          .catch(error => { results.traffic = `Error: ${error.message}` })
      )
    }

    if (analysisTypes.includes('jira')) {
      analyses.push(
        analyzeJiraTrends(apiKey, dashboardData)
          .then(result => { results.jira = result })
          .catch(error => { results.jira = `Error: ${error.message}` })
      )
    }

    if (analysisTypes.includes('duplicates')) {
      analyses.push(
        detectDuplicates(apiKey, dashboardData)
          .then(result => { results.duplicates = result })
          .catch(error => { results.duplicates = `Error: ${error.message}` })
      )
    }

    await Promise.all(analyses)

    res.status(200).json({
      success: true,
      results,
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error('Insights API error:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    })
  }
}
