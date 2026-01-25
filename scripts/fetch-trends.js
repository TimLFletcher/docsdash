import googleTrends from 'google-trends-api'

export async function fetchTrendsData() {
  console.log('🔍 Fetching Google Trends data...')
  
  try {
    const keyword = 'couchbase'
    const endDate = new Date()
    const startDate = new Date()
    startDate.setFullYear(startDate.getFullYear() - 1) // Last 12 months

    // Fetch interest over time
    console.log('   📈 Fetching interest over time...')
    const interestOverTimeResponse = await googleTrends.interestOverTime({
      keyword: keyword,
      startTime: startDate,
      endTime: endDate,
      geo: 'US', // Focus on US market
      granularTimeResolution: true
    })

    const interestData = JSON.parse(interestOverTimeResponse)
    const timelineData = interestData.default.timelineData.map(item => ({
      date: item.time,
      value: item.value[0],
      formattedTime: item.formattedTime
    }))

    // Fetch related queries (top and rising)
    console.log('   🔍 Fetching related queries...')
    const relatedQueriesResponse = await googleTrends.relatedQueries({
      keyword: keyword,
      startTime: startDate,
      endTime: endDate,
      geo: 'US'
    })

    const queriesData = JSON.parse(relatedQueriesResponse)
    const topQueries = queriesData.default.rankedListList[0]?.rankedKeyword.map(item => ({
      query: item.query,
      value: item.formattedValue || item.traffic,
      hasData: item.hasData
    })) || []

    const risingQueries = queriesData.default.rankedListList[1]?.rankedKeyword.map(item => ({
      query: item.query,
      value: item.formattedValue || item.traffic,
      hasData: item.hasData
    })) || []

    // Fetch interest by region
    console.log('   🗺️  Fetching interest by region...')
    const interestByRegionResponse = await googleTrends.interestByRegion({
      keyword: keyword,
      startTime: startDate,
      endTime: endDate,
      geo: 'US',
      resolution: 'REGION'
    })

    const regionData = JSON.parse(interestByRegionResponse)
    const regionalInterest = regionData.default.geoMapData.map(item => ({
      region: item.geoName,
      value: item.value[0],
      hasData: item.hasData
    })).filter(item => item.hasData)

    console.log(`   ✅ Successfully fetched trends data for "${keyword}"`)
    console.log(`   📊 Timeline points: ${timelineData.length}`)
    console.log(`   🔍 Top queries: ${topQueries.length}`)
    console.log(`   📈 Rising queries: ${risingQueries.length}`)
    console.log(`   🗺️  Regions: ${regionalInterest.length}`)

    return {
      keyword,
      lastUpdated: new Date().toISOString(),
      interestOverTime: timelineData,
      topQueries: topQueries.slice(0, 10), // Top 10
      risingQueries: risingQueries.slice(0, 10), // Top 10 rising
      regionalInterest: regionalInterest,
      summary: {
        avgInterest: timelineData.reduce((sum, item) => sum + item.value, 0) / timelineData.length,
        peakInterest: Math.max(...timelineData.map(item => item.value)),
        currentInterest: timelineData[timelineData.length - 1]?.value || 0,
        trendDirection: timelineData.length > 1 
          ? (timelineData[timelineData.length - 1].value > timelineData[timelineData.length - 2].value ? 'up' : 'down')
          : 'stable'
      }
    }

  } catch (error) {
    console.error('❌ Error fetching Google Trends data:', error.message)
    
    // Return null to indicate complete failure - no fallback data
    console.log('   🚫 Google Trends data unavailable - tab will show error state')
    return null
  }
}
