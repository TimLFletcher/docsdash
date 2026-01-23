/**
 * Fetch Jira Data
 * 
 * Uses the Jira REST API to fetch:
 * - Open issues by priority
 * - Recent issues
 * - Sprint velocity
 * - Monthly metrics (opened, resolved, burn rate, resolution time)
 * - AV project documentation ticket metrics
 * 
 * Required Environment Variables:
 * - JIRA_BASE_URL: Your Jira instance URL (e.g., https://your-org.atlassian.net)
 * - JIRA_EMAIL: Jira account email
 * - JIRA_API_TOKEN: Jira API token
 * - JIRA_PROJECT_KEY: Jira project key (e.g., DOC)
 */

// Check if we're in a CI environment with real credentials
const hasJiraCredentials = process.env.JIRA_BASE_URL && process.env.JIRA_EMAIL && process.env.JIRA_API_TOKEN

export async function fetchJiraData() {
  if (!hasJiraCredentials) {
    console.log('⚠️  No Jira credentials found, using sample data')
    return null
  }

  console.log('🎫 Fetching Jira data...')

  try {
    const baseUrl = process.env.JIRA_BASE_URL
    const email = process.env.JIRA_EMAIL
    const apiToken = process.env.JIRA_API_TOKEN
    
    console.log(`   Using Jira base URL: ${baseUrl}`)
    
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
          jql: `project = DOC AND status IN ("In Progress", "In Review", Reopened, Open)`,
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
          jql: `project = DOC AND status IN ("In Progress", "In Review", Reopened, Open)`,
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
          jql: `project = DOC AND status IN ("In Progress", "In Review", Reopened, Open) ORDER BY created DESC`,
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
    console.log(`   ✅ Found ${monthlyOpenedData.count || 0} DOC issues opened in last 30 days`)

    // Fetch AV monthly opened count (last 30 days)
    const avMonthlyOpenedResponse = await fetch(
      `${baseUrl}/rest/api/3/search/jql`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          jql: `project = AV AND type IN ("Documentation", "Documentation Sub-Task") AND created >= -30d`,
        }),
      }
    )
    
    if (!avMonthlyOpenedResponse.ok) {
      const errorText = await avMonthlyOpenedResponse.text()
      throw new Error(`Jira API error (${avMonthlyOpenedResponse.status}): ${errorText}`)
    }
    
    const avMonthlyOpenedData = await avMonthlyOpenedResponse.json()
    console.log(`   ✅ Found ${avMonthlyOpenedData.total || 0} AV issues opened in last 30 days`)

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
    console.log(`   ✅ Found ${monthlyResolvedData.count || 0} DOC issues resolved in last 30 days`)

    // Fetch AV monthly resolved count
    const avMonthlyResolvedResponse = await fetch(
      `${baseUrl}/rest/api/3/search/jql`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          jql: `project = AV AND type IN ("Documentation", "Documentation Sub-Task") AND resolved >= -30d`,
        }),
      }
    )
    
    if (!avMonthlyResolvedResponse.ok) {
      const errorText = await avMonthlyResolvedResponse.text()
      throw new Error(`Jira API error (${avMonthlyResolvedResponse.status}): ${errorText}`)
    }
    
    const avMonthlyResolvedData = await avMonthlyResolvedResponse.json()
    console.log(`   ✅ Found ${avMonthlyResolvedData.total || 0} AV issues resolved in last 30 days`)

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
    console.log(`   ✅ Found ${previousMonthOpenedData.count || 0} DOC issues opened in previous month`)

    // Fetch AV previous month opened count (60-30 days ago)
    const avPreviousMonthOpenedResponse = await fetch(
      `${baseUrl}/rest/api/3/search/jql`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          jql: `project = AV AND type IN ("Documentation", "Documentation Sub-Task") AND created >= -60d AND created <= -30d`,
        }),
      }
    )
    
    if (!avPreviousMonthOpenedResponse.ok) {
      const errorText = await avPreviousMonthOpenedResponse.text()
      throw new Error(`Jira API error (${avPreviousMonthOpenedResponse.status}): ${errorText}`)
    }
    
    const avPreviousMonthOpenedData = await avPreviousMonthOpenedResponse.json()
    console.log(`   ✅ Found ${avPreviousMonthOpenedData.total || 0} AV issues opened in previous month`)

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
    console.log(`   ✅ Found ${previousMonthResolvedData.count || 0} DOC issues resolved in previous month`)

    // Fetch AV previous month resolved count (60-30 days ago)
    const avPreviousMonthResolvedResponse = await fetch(
      `${baseUrl}/rest/api/3/search/jql`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          jql: `project = AV AND type IN ("Documentation", "Documentation Sub-Task") AND resolved >= -60d AND resolved <= -30d`,
        }),
      }
    )
    
    if (!avPreviousMonthResolvedResponse.ok) {
      const errorText = await avPreviousMonthResolvedResponse.text()
      throw new Error(`Jira API error (${avPreviousMonthResolvedResponse.status}): ${errorText}`)
    }
    
    const avPreviousMonthResolvedData = await avPreviousMonthResolvedResponse.json()
    console.log(`   ✅ Found ${avPreviousMonthResolvedData.total || 0} AV issues resolved in previous month`)

    // Fetch resolved issues for previous month to calculate average resolution time
    const previousMonthResolvedIssuesResponse = await fetch(
      `${baseUrl}/rest/api/3/search/jql`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          jql: `project = DOC AND resolved >= -60d AND resolved <= -30d AND resolutiondate IS NOT NULL`,
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
      console.log(`   ✅ Calculated DOC previous month avg resolution time: ${previousMonthAvgResolutionDays.toFixed(2)} days`)
    }

    // Fetch AV resolved issues for previous month to calculate average resolution time
    const avPreviousMonthResolvedIssuesResponse = await fetch(
      `${baseUrl}/rest/api/3/search/jql`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          jql: `project = AV AND type IN ("Documentation", "Documentation Sub-Task") AND resolved >= -60d AND resolved <= -30d AND resolutiondate IS NOT NULL`,
          fields: ['created', 'resolutiondate'],
        }),
      }
    )
    
    let avPreviousMonthAvgResolutionDays = 0
    if (avPreviousMonthResolvedIssuesResponse.ok) {
      const avPreviousMonthResolvedIssuesData = await avPreviousMonthResolvedIssuesResponse.json()
      const avPreviousMonthResolutionTimes = avPreviousMonthResolvedIssuesData.issues
        ?.filter(issue => issue.fields.created && issue.fields.resolutiondate)
        .map(issue => {
          const created = new Date(issue.fields.created)
          const resolved = new Date(issue.fields.resolutiondate)
          return (resolved - created) / (1000 * 60 * 60 * 24) // Convert to days
        }) || []
      
      if (avPreviousMonthResolutionTimes.length > 0) {
        avPreviousMonthAvgResolutionDays = avPreviousMonthResolutionTimes.reduce((sum, days) => sum + days, 0) / avPreviousMonthResolutionTimes.length
      }
      console.log(`   ✅ Calculated AV previous month avg resolution time: ${avPreviousMonthAvgResolutionDays.toFixed(2)} days`)
    }

    // Calculate previous month burn rate
    const previousMonthOpened = previousMonthOpenedData.count || 0
    const previousMonthResolved = previousMonthResolvedData.count || 0
    const previousMonthBurnRate = previousMonthResolved > 0 ? (previousMonthOpened / previousMonthResolved).toFixed(2) : '0.00'

    // Fetch labels data - 3 categories: No Labels, Totoro, Other Labels
    const noLabelsResponse = await fetch(
      `${baseUrl}/rest/api/3/search/approximate-count`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          jql: `project = "Couchbase Documentation" AND status IN ("In Progress", "In Review", Open) AND labels IS EMPTY`,
        }),
      }
    )
    
    if (!noLabelsResponse.ok) {
      const errorText = await noLabelsResponse.text()
      throw new Error(`Jira API error (${noLabelsResponse.status}): ${errorText}`)
    }
    
    const noLabelsData = await noLabelsResponse.json()
    const noLabelsCount = noLabelsData.count || 0
    console.log(`   ✅ Found ${noLabelsCount} issues with no labels`)

    const totoroLabelsResponse = await fetch(
      `${baseUrl}/rest/api/3/search/approximate-count`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          jql: `project = "Couchbase Documentation" AND status IN ("In Progress", "In Review", Open) AND labels IN (totoro-planned, Totoro)`,
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

    const otherLabelsResponse = await fetch(
      `${baseUrl}/rest/api/3/search/approximate-count`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          jql: `project = "Couchbase Documentation" AND status IN ("In Progress", "In Review", Open) AND labels NOT IN (totoro-planned, Totoro)`,
        }),
      }
    )
    
    if (!otherLabelsResponse.ok) {
      const errorText = await otherLabelsResponse.text()
      throw new Error(`Jira API error (${otherLabelsResponse.status}): ${errorText}`)
    }
    
    const otherLabelsData = await otherLabelsResponse.json()
    const otherLabelsCount = otherLabelsData.count || 0
    console.log(`   ✅ Found ${otherLabelsCount} issues with other labels`)

    // Create labels chart data
    const topLabels = [
      {
        label: 'No Labels',
        count: noLabelsCount,
        color: '#6b7280',
      },
      {
        label: 'Totoro',
        count: totoroCount,
        color: '#ef4444',
      },
      {
        label: 'Other Labels',
        count: otherLabelsCount,
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
      console.log(`   ✅ Calculated DOC avg resolution time: ${avgResolutionDays.toFixed(2)} days`)
    }

    // Fetch AV resolved issues to calculate average resolution time (last 30 days)
    const avResolvedIssuesResponse = await fetch(
      `${baseUrl}/rest/api/3/search/jql`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          jql: `project = AV AND type IN ("Documentation", "Documentation Sub-Task") AND resolved >= -30d AND resolutiondate IS NOT NULL`,
          fields: ['created', 'resolutiondate'],
        }),
      }
    )
    
    let avAvgResolutionDays = 0
    if (avResolvedIssuesResponse.ok) {
      const avResolvedIssuesData = await avResolvedIssuesResponse.json()
      const avResolutionTimes = avResolvedIssuesData.issues
        ?.filter(issue => issue.fields.created && issue.fields.resolutiondate)
        .map(issue => {
          const created = new Date(issue.fields.created)
          const resolved = new Date(issue.fields.resolutiondate)
          return (resolved - created) / (1000 * 60 * 60 * 24) // Convert to days
        }) || []
      
      if (avResolutionTimes.length > 0) {
        avAvgResolutionDays = avResolutionTimes.reduce((sum, days) => sum + days, 0) / avResolutionTimes.length
      }
      console.log(`   ✅ Calculated AV avg resolution time: ${avAvgResolutionDays.toFixed(2)} days`)
    }

    // Calculate DOC burn rate (opened/resolved)
    const monthlyOpened = monthlyOpenedData.count || 0
    const monthlyResolved = monthlyResolvedData.count || 0
    const burnRate = monthlyResolved > 0 ? (monthlyOpened / monthlyResolved).toFixed(2) : '0.00'

    // Calculate AV burn rate
    const avMonthlyOpened = avMonthlyOpenedData.total || 0
    const avMonthlyResolved = avMonthlyResolvedData.total || 0
    const avBurnRate = avMonthlyResolved > 0 ? (avMonthlyOpened / avMonthlyResolved).toFixed(2) : '0.00'

    // Calculate AV previous month burn rate
    const avPreviousMonthOpened = avPreviousMonthOpenedData.total || 0
    const avPreviousMonthResolved = avPreviousMonthResolvedData.total || 0
    const avPreviousMonthBurnRate = avPreviousMonthResolved > 0 ? (avPreviousMonthOpened / avPreviousMonthResolved).toFixed(2) : '0.00'

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
      // AV project metrics
      monthlyOpenedAV: avMonthlyOpened,
      monthlyResolvedAV: avMonthlyResolved,
      burnRateAV: parseFloat(avBurnRate),
      previousMonthOpenedAV: avPreviousMonthOpened,
      previousMonthResolvedAV: avPreviousMonthResolved,
      previousMonthBurnRateAV: parseFloat(avPreviousMonthBurnRate),
      avgResolutionDaysAV: parseFloat(avAvgResolutionDays.toFixed(2)),
      previousMonthAvgResolutionDaysAV: parseFloat(avPreviousMonthAvgResolutionDays.toFixed(2)),
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
