/**
 * Algolia Analytics Data Fetcher for DocsDash
 * 
 * Fetches search analytics data from Algolia Analytics API
 * 
 * Required Environment Variables:
 * - ALGOLIA_APP_ID: Algolia Application ID
 * - ALGOLIA_ANALYTICS_API_KEY: Algolia Analytics API Key
 * - ALGOLIA_INDEX_NAME: Name of the docs index
 */

import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Try to load .env.local first (for local development)
try {
  config({ path: join(__dirname, '../.env.local') })
} catch (error) {
  // .env.local doesn't exist, will use environment variables (GitHub Actions)
}

// Check if we have credentials
const hasAlgoliaCredentials = process.env.ALGOLIA_APP_ID && 
                              process.env.ALGOLIA_ANALYTICS_API_KEY && 
                              process.env.ALGOLIA_INDEX_NAME

// Site path categories matching GA metrics
const siteCategories = [
  { name: 'Cloud', path: '/cloud/' },
  { name: 'Analytics', path: '/analytics/' },
  { name: 'AI', path: '/ai/' },
  { name: 'Server', path: '/server/' },
  { name: 'Operator', path: '/operator/' },
  { name: 'Enterprise Analytics', path: '/enterprise-analytics/' },
  { name: 'Couchbase Lite', path: '/couchbase-lite/' },
  { name: 'Sync Gateway', path: '/sync-gateway/' },
  { name: 'Couchbase Edge Server', path: '/couchbase-edge-server/' },
  { name: '.NET SDK', path: '/dotnet-sdk/' },
  { name: 'EF Core Provider', path: '/efcore-provider/' },
  { name: 'C SDK', path: '/c-sdk/' },
  { name: 'C++ SDK', path: '/cxx-sdk/' },
  { name: 'Go SDK', path: '/go-sdk/' },
  { name: 'Java SDK', path: '/java-sdk/' },
  { name: 'Quarkus Extension', path: '/quarkus-extension/' },
  { name: 'Kotlin SDK', path: '/kotlin-sdk/' },
  { name: 'Node.js SDK', path: '/nodejs-sdk/' },
  { name: 'PHP SDK', path: '/php-sdk/' },
  { name: 'Python SDK', path: '/python-sdk/' },
  { name: 'Ruby SDK', path: '/ruby-sdk/' },
  { name: 'Rust SDK', path: '/rust-sdk/' },
  { name: 'Scala SDK', path: '/scala-sdk/' }
]

/**
 * Helper function to make authenticated requests to Algolia Analytics API
 */
async function fetchAnalyticsData(endpoint, params = {}) {
  const baseUrl = 'https://analytics.algolia.com'
  const url = new URL(`${baseUrl}/2${endpoint}`)
  
  // Add query parameters
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined) {
      url.searchParams.append(key, params[key])
    }
  })

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'X-Algolia-Application-Id': process.env.ALGOLIA_APP_ID,
      'X-Algolia-API-Key': process.env.ALGOLIA_ANALYTICS_API_KEY,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error(`Algolia Analytics API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

/**
 * Fetch top search queries
 */
async function fetchTopSearches(indexName, limit = 20) {
  try {
    const data = await fetchAnalyticsData('/searches', {
      index: indexName,
      limit: limit,
      startDate: '30', // Last 30 days
      endDate: '1'      // Until yesterday
    })

    return data.searches?.map(search => ({
      query: search.search,
      count: search.count,
      avgClicks: search.avgClicks || 0,
      clickThroughRate: search.clickThroughRate || 0
    })) || []
  } catch (error) {
    console.error('   ⚠️  Error fetching top searches:', error.message)
    return []
  }
}

/**
 * Fetch top no-result searches
 */
async function fetchNoResultSearches(indexName, limit = 20) {
  try {
    const data = await fetchAnalyticsData('/searches/noResults', {
      index: indexName,
      limit: limit,
      startDate: '30', // Last 30 days
      endDate: '1'      // Until yesterday
    })

    return data.searches?.map(search => ({
      query: search.search,
      count: search.count
    })) || []
  } catch (error) {
    console.error('   ⚠️  Error fetching no-result searches:', error.message)
    return []
  }
}

/**
 * Fetch overall search metrics
 */
async function fetchSearchMetrics(indexName) {
  try {
    const data = await fetchAnalyticsData('/searches/count', {
      index: indexName,
      startDate: '30', // Last 30 days
      endDate: '1'      // Until yesterday
    })

    return {
      totalSearches: data.count || 0,
      avgClicksPerSearch: data.avgClicksPerSearch || 0,
      clickThroughRate: data.clickThroughRate || 0,
      avgResultsPerSearch: data.avgResultsPerSearch || 0
    }
  } catch (error) {
    console.error('   ⚠️  Error fetching search metrics:', error.message)
    return {
      totalSearches: 0,
      avgClicksPerSearch: 0,
      clickThroughRate: 0,
      avgResultsPerSearch: 0
    }
  }
}

/**
 * Fetch search trends over time
 */
async function fetchSearchTrends(indexName) {
  try {
    const data = await fetchAnalyticsData('/searches/count', {
      index: indexName,
      startDate: '30', // Last 30 days
      endDate: '1',      // Until yesterday
      granularity: 'daily'
    })

    return data.counts?.map(item => ({
      date: item.date,
      searches: item.count
    })) || []
  } catch (error) {
    console.error('   ⚠️  Error fetching search trends:', error.message)
    return []
  }
}

/**
 * Fetch click counts by site category
 */
async function fetchClicksByCategory(indexName) {
  const categoryClicks = []

  for (const category of siteCategories) {
    try {
      // For each category, we'll search for queries that include the category path
      // This is a simplified approach - Algolia Analytics API doesn't directly support
      // filtering by result URL, so we'll use popular searches that might lead to these paths
      const data = await fetchAnalyticsData('/searches/clickPositions', {
        index: indexName,
        startDate: '30',
        endDate: '1',
        limit: 100
      })

      // Filter clicks that match our category paths
      const categoryClickCount = data.positions?.filter(pos => 
        pos.position && pos.position.url && pos.position.url.includes(category.path)
      ).reduce((sum, pos) => sum + pos.clicks, 0) || 0

      categoryClicks.push({
        category: category.name,
        path: category.path,
        clicks: categoryClickCount
      })
    } catch (error) {
      console.error(`   ⚠️  Error fetching clicks for ${category.name}:`, error.message)
      categoryClicks.push({
        category: category.name,
        path: category.path,
        clicks: 0
      })
    }
  }

  return categoryClicks
}

/**
 * Main function to fetch all Algolia analytics data
 */
export async function fetchAlgoliaData() {
  if (!hasAlgoliaCredentials) {
    console.log('⚠️  No Algolia credentials found - skipping Algolia data fetch')
    return null
  }

  console.log('🔍 Fetching Algolia search analytics data...')

  try {
    const indexName = process.env.ALGOLIA_INDEX_NAME

    // Fetch all data in parallel where possible
    const [
      topSearches,
      noResultSearches,
      searchMetrics,
      searchTrends,
      categoryClicks
    ] = await Promise.all([
      fetchTopSearches(indexName),
      fetchNoResultSearches(indexName),
      fetchSearchMetrics(indexName),
      fetchSearchTrends(indexName),
      fetchClicksByCategory(indexName)
    ])

    // Calculate no results percentage
    const totalNoResults = noResultSearches.reduce((sum, search) => sum + search.count, 0)
    const noResultsPercentage = searchMetrics.totalSearches > 0 
      ? (totalNoResults / searchMetrics.totalSearches * 100).toFixed(1)
      : 0

    console.log(`   ✅ Fetched ${topSearches.length} top searches`)
    console.log(`   ✅ Fetched ${noResultSearches.length} no-result searches`)
    console.log(`   ✅ Fetched search metrics: ${searchMetrics.totalSearches} total searches`)
    console.log(`   ✅ Fetched ${searchTrends.length} days of trend data`)
    console.log(`   ✅ Fetched click data for ${categoryClicks.length} categories`)
    console.log(`   📊 No results rate: ${noResultsPercentage}%`)

    return {
      topSearches,
      noResultSearches,
      searchMetrics,
      searchTrends,
      categoryClicks,
      noResultsPercentage: parseFloat(noResultsPercentage),
      lastUpdated: new Date().toISOString()
    }
  } catch (error) {
    console.error('❌ Error fetching Algolia data:', error.message)
    return null
  }
}
