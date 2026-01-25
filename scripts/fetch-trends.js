import googleTrends from 'google-trends-api'

// Disable SSL verification for this module (temporary workaround)
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0'

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

    console.log('   📊 Parsing interest over time response...')
    const interestData = JSON.parse(interestOverTimeResponse)
    console.log('   📊 Interest data keys:', Object.keys(interestData))
    console.log('   📊 Default keys:', interestData.default ? Object.keys(interestData.default) : 'No default key')
    
    if (!interestData.default) {
      console.log('   📊 Full response structure:', JSON.stringify(interestData, null, 2))
      throw new Error('Invalid response structure: missing default')
    }
    
    if (!interestData.default.timelineData) {
      console.log('   📊 Default content:', JSON.stringify(interestData.default, null, 2))
      throw new Error('Invalid response structure: missing default.timelineData')
    }
    
    console.log('   📊 Timeline data sample:', interestData.default.timelineData[0])
    
    const timelineData = interestData.default.timelineData.map(item => ({
      date: item.time,
      value: item.value ? item.value[0] : 0,
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

    console.log('   📊 Parsing related queries response...')
    const queriesData = JSON.parse(relatedQueriesResponse)
    console.log('   📊 Queries data keys:', Object.keys(queriesData))
    console.log('   📊 Has default:', !!queriesData.default)
    console.log('   📊 Has rankedListList:', !!queriesData.default?.rankedListList)
    
    if (!queriesData.default || !queriesData.default.rankedList) {
      console.log('   📊 Full response structure:', JSON.stringify(queriesData, null, 2).substring(0, 500) + '...')
      throw new Error('Invalid queries response structure')
    }
    
    // The structure is: rankedList[0].rankedKeyword is an array
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

    console.log(`   ✅ Parsed ${topQueries.length} top queries and ${risingQueries.length} rising queries`)

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
