import googleTrends from 'google-trends-api'

// Disable SSL verification for this module (temporary workaround)
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0'

async function fetchTrendsForKeyword(keyword) {
  console.log(`   🔍 Fetching trends for "${keyword}"...`)
  
  const endDate = new Date()
  const startDate = new Date()
  startDate.setFullYear(startDate.getFullYear() - 1) // Last 12 months

  // Fetch interest over time
  const interestOverTimeResponse = await googleTrends.interestOverTime({
    keyword: keyword,
    startTime: startDate,
    endTime: endDate,
    geo: 'US',
    granularTimeResolution: true
  })

  const interestData = JSON.parse(interestOverTimeResponse)
  const timelineData = interestData.default.timelineData.map(item => ({
    date: item.time,
    value: item.value ? item.value[0] : 0,
    formattedTime: item.formattedTime
  }))

  // Fetch related queries (top and rising)
  const relatedQueriesResponse = await googleTrends.relatedQueries({
    keyword: keyword,
    startTime: startDate,
    endTime: endDate,
    geo: 'US'
  })

  const queriesData = JSON.parse(relatedQueriesResponse)
  
  const topQueries = queriesData.default.rankedList[0]?.rankedKeyword?.map(item => ({
    query: item.query,
    value: item.formattedValue || item.traffic,
    hasData: item.hasData
  })).slice(0, 10) || []

  const risingQueries = queriesData.default.rankedList[1]?.rankedKeyword?.map(item => ({
    query: item.query,
    value: item.formattedValue || item.traffic,
    hasData: item.hasData
  })).slice(0, 10) || []

  console.log(`   ✅ Fetched ${timelineData.length} timeline points, ${topQueries.length} top queries, ${risingQueries.length} rising queries`)

  return {
    keyword,
    timelineData,
    topQueries,
    risingQueries,
    summary: {
      avgInterest: timelineData.reduce((sum, item) => sum + item.value, 0) / timelineData.length,
      peakInterest: Math.max(...timelineData.map(item => item.value)),
      currentInterest: timelineData[timelineData.length - 1]?.value || 0,
      trendDirection: timelineData.length > 1 
        ? (timelineData[timelineData.length - 1].value > timelineData[timelineData.length - 2].value ? 'up' : 'down')
        : 'stable'
    }
  }
}

export async function fetchTrendsData() {
  console.log('🔍 Fetching Google Trends data...')
  
  try {
    // Fetch data for both keywords
    const [couchbaseData, couchbaseServerData] = await Promise.all([
      fetchTrendsForKeyword('couchbase'),
      fetchTrendsForKeyword('couchbase server')
    ])

    // Combine timeline data for comparison
    const combinedTimeline = couchbaseData.timelineData.map((item, index) => ({
      date: item.date,
      formattedTime: item.formattedTime,
      couchbase: item.value,
      couchbaseServer: couchbaseServerData.timelineData[index]?.value || 0
    }))

    console.log(`   ✅ Successfully fetched trends data for both keywords`)
    console.log(`   📊 Combined timeline points: ${combinedTimeline.length}`)

    return {
      lastUpdated: new Date().toISOString(),
      couchbase: {
        keyword: couchbaseData.keyword,
        topQueries: couchbaseData.topQueries,
        risingQueries: couchbaseData.risingQueries,
        summary: couchbaseData.summary
      },
      couchbaseServer: {
        keyword: couchbaseServerData.keyword,
        topQueries: couchbaseServerData.topQueries,
        risingQueries: couchbaseServerData.risingQueries,
        summary: couchbaseServerData.summary
      },
      interestOverTime: combinedTimeline,
      summary: {
        avgInterest: couchbaseData.summary.avgInterest,
        peakInterest: couchbaseData.summary.peakInterest,
        currentInterest: couchbaseData.summary.currentInterest,
        trendDirection: couchbaseData.summary.trendDirection
      }
    }

  } catch (error) {
    console.error('❌ Error fetching Google Trends data:', error.message)
    
    // Return null to indicate complete failure - no fallback data
    console.log('   🚫 Google Trends data unavailable - tab will show error state')
    return null
  }
}
