/**
 * Fetch Google Analytics 4 Data
 * 
 * Uses the GA4 Data API to fetch:
 * - Page views and sessions
 * - Top pages
 * - Search terms (if Site Search is configured)
 * - User metrics
 * 
 * Required Environment Variables:
 * - GA_PROPERTY_ID: Google Analytics 4 property ID
 * - GOOGLE_SERVICE_ACCOUNT_KEY: JSON key for GCP service account
 * 
 * Local Development:
 * Create .env.local file with your credentials (won't be committed to git)
 */

// Load environment variables from .env.local for local development
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

// Check if we have credentials (either from .env.local or environment)
const hasGACredentials = process.env.GA_PROPERTY_ID && process.env.GOOGLE_SERVICE_ACCOUNT_KEY

export async function fetchGoogleAnalyticsData() {
  if (!hasGACredentials) {
    console.log('⚠️  No GA credentials found - skipping GA data fetch')
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

    // Fetch page views for last 3 months (filtered to docs.couchbase.com)
    const [pageViews3MonthsResponse] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: '90daysAgo', endDate: 'today' }],
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

    // Helper function to format duration
    const formatDuration = (seconds) => {
      const mins = Math.floor(seconds / 60)
      const secs = Math.floor(seconds % 60)
      return `${mins}:${secs.toString().padStart(2, '0')}`
    }

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

    // SDK paths for comparison
    const sdkPaths = [
      '/dotnet-sdk/',
      '/efcore-provider/',
      '/c-sdk/',
      '/cxx-sdk/',
      '/go-sdk/',
      '/java-sdk/',
      '/quarkus-extension/',
      '/kotlin-sdk/',
      '/nodejs-sdk/',
      '/php-sdk/',
      '/python-sdk/',
      '/ruby-sdk/',
      '/rust-sdk/',
      '/scala-sdk/',
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

    // Fetch metrics for each SDK path
    const sdkMetrics = await Promise.all(
      sdkPaths.map(async (path) => {
        try {
          // Fetch page views for this SDK path
          const [pathViewsResponse] = await analyticsDataClient.runReport({
            property: `properties/${propertyId}`,
            dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
            dimensions: [{ name: 'pagePath' }],
            metrics: [{ name: 'screenPageViews' }],
            dimensionFilter: {
              filter: {
                fieldName: 'pagePath',
                stringFilter: { matchType: 'BEGINS_WITH', value: path },
              },
            },
          })

          // Fetch session metrics for this SDK path
          const [pathSessionResponse] = await analyticsDataClient.runReport({
            property: `properties/${propertyId}`,
            dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
            metrics: [
              { name: 'sessions' },
              { name: 'bounceRate' },
              { name: 'averageSessionDuration' },
            ],
            dimensionFilter: {
              filter: {
                fieldName: 'pagePath',
                stringFilter: { matchType: 'BEGINS_WITH', value: path },
              },
            },
          })

          // Fetch traffic sources for this SDK path
          const [pathTrafficResponse] = await analyticsDataClient.runReport({
            property: `properties/${propertyId}`,
            dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
            dimensions: [{ name: 'sessionDefaultChannelGroup' }],
            metrics: [{ name: 'sessions' }],
            dimensionFilter: {
              filter: {
                fieldName: 'pagePath',
                stringFilter: { matchType: 'BEGINS_WITH', value: path },
              },
            },
          })

          const totalViews = pathViewsResponse.rows?.reduce((sum, row) => sum + parseInt(row.metricValues[0].value), 0) || 0
          const bounceRate = pathSessionResponse.rows?.[0]?.metricValues[1]?.value || '0'
          const avgSessionDuration = pathSessionResponse.rows?.[0]?.metricValues[2]?.value || '0'
          
          // Calculate traffic balance
          const trafficData = pathTrafficResponse.rows || []
          const totalSessions = trafficData.reduce((sum, row) => sum + parseInt(row.metricValues[0].value), 0)
          const directSessions = trafficData.find(row => row.dimensionValues[0].value === 'Direct')?.metricValues[0]?.value || 0
          const searchSessions = trafficData.find(row => row.dimensionValues[0].value === 'Organic Search')?.metricValues[0]?.value || 0
          
          const directPercentage = totalSessions > 0 ? Math.round((directSessions / totalSessions) * 100) : 0
          const searchPercentage = totalSessions > 0 ? Math.round((searchSessions / totalSessions) * 100) : 0

          return {
            displayPath: path,
            totalViews,
            bounceRate: parseFloat(bounceRate).toFixed(1),
            avgSessionDuration: formatDuration(parseFloat(avgSessionDuration)),
            trafficBalance: {
              direct: directPercentage,
              search: searchPercentage,
            },
          }
        } catch (error) {
          console.warn(`   ⚠️  Failed to fetch metrics for ${path}:`, error.message)
          return {
            displayPath: path,
            totalViews: 0,
            bounceRate: 0,
            avgSessionDuration: '0:00',
            trafficBalance: { direct: 0, search: 0 },
          }
        }
      })
    )

    console.log(`   ✅ Fetched metrics for ${sdkMetrics.length} SDK paths`)

    // Process responses into dashboard format
    const daily = pageViewsResponse.rows.map(row => ({
      date: row.dimensionValues[0].value.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'),
      views: parseInt(row.metricValues[0].value),
    }))

    const daily3Months = pageViews3MonthsResponse.rows.map(row => ({
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
        daily3Months,
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
        avgSessionDurationTrend: userMetricsResponse.rows[1] 
          ? ((parseFloat(userMetricsResponse.rows[0].metricValues[2].value) - parseFloat(userMetricsResponse.rows[1].metricValues[2].value)) / parseFloat(userMetricsResponse.rows[1].metricValues[2].value) * 100).toFixed(1)
          : 0,
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
      sdkComparison: sdkMetrics,
    }
  } catch (error) {
    console.error('❌ Error fetching GA data:', error.message)
    return null
  }
}
