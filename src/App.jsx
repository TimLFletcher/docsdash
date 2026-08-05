import React, { useState, useEffect } from 'react'
import { Clock, Users, FileText, AlertTriangle, CheckCircle, TrendingUp, BookOpen, Eye, ArrowUpRight } from 'lucide-react'

// Components
import { MetricCard } from './components/MetricCard'
import { PageViewsChart } from './components/charts/PageViewsChart'
import { TopPagesTable } from './components/charts/TopPagesTable'
import { JiraLabelsChart } from './components/charts/JiraLabelsChart'
import { VelocityChart } from './components/charts/VelocityChart'
import { RecentIssuesTable } from './components/charts/RecentIssuesTable'
import { TrafficSourcesChart } from './components/charts/TrafficSourcesChart'
import { PathComparisonTable } from './components/charts/PathComparisonTable'
import { SDKComparisonTable } from './components/charts/SDKComparisonTable'
import { LLMInsights } from './components/LLMInsights'
import { PasswordProtection } from './components/PasswordProtection'
import { CollectorErrorBanner, DataUnavailable } from './components/DataStatus'
import { SEOSummary } from './components/charts/SEOSummary'
import { TrendsChart } from './components/charts/TrendsChart'
import { QueriesTable } from './components/charts/QueriesTable'
import { RegionalInterestChart } from './components/charts/RegionalInterestChart'
import { SearchMetricsCard } from './components/charts/SearchMetricsCard'
import { TopSearchesTable } from './components/charts/TopSearchesTable'
import { NoResultsTable } from './components/charts/NoResultsTable'
import { SearchTrendsChart } from './components/charts/SearchTrendsChart'

 const DEFAULT_ANALYTICS = {
   pageViews: {
     total: 0,
     trend: 0,
     daily: [],
   },
   userMetrics: {
     uniqueVisitors: 0,
     bounceRate: 0,
     avgSessionDuration: '0:00',
     avgSessionDurationTrend: 0,
   },
   topPages: [],
   topPagesByPath: [],
   searchTerms: [],
   trafficSources: [],
   pathComparison: [],
 }

 const DEFAULT_JIRA = {
   openIssues: {
     total: 0,
     byPriority: [],
   },
   monthlyOpened: 0,
   monthlyResolved: 0,
   burnRate: 0,
   burnRateTrend: 0,
   avgResolutionDays: 0,
   avgResolutionDaysTrend: 0,
   velocityTrend: [],
   recentIssues: [],
   topLabels: [],
   previousMonthOpened: 0,
   previousMonthResolved: 0,
   previousMonthBurnRate: 0,
   previousMonthAvgResolutionDays: 0,
   monthlyOpenedAV: 0,
   monthlyResolvedAV: 0,
   burnRateAV: 0,
   previousMonthOpenedAV: 0,
   previousMonthResolvedAV: 0,
   previousMonthBurnRateAV: 0,
   avgResolutionDaysAV: 0,
   previousMonthAvgResolutionDaysAV: 0,
 }

 const DEFAULT_TRENDS = {
   keyword: 'couchbase',
   lastUpdated: new Date().toISOString(),
   interestOverTime: [],
   topQueries: [],
   risingQueries: [],
   regionalInterest: [],
   summary: {
     avgInterest: 0,
     peakInterest: 0,
     currentInterest: 0,
     trendDirection: 'stable'
   }
 }

 const DEFAULT_INSIGHTS = {
   contentGaps: [],
   performanceNotes: [],
 }

function App() {
  const [data, setData] = useState(null)
  const [activeTab, setActiveTab] = useState('insights')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Add cache-busting query parameter to force fresh fetch
      const cacheBuster = new Date().getTime()
      const response = await fetch(`./data/dashboard-data.json?t=${cacheBuster}`)
      if (response.ok) {
        const liveData = await response.json()
        setData(liveData)
      } else {
        throw new Error(`Failed to load data: ${response.status} ${response.statusText}`)
      }
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data')
      setData(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Clock className="w-8 h-8 text-primary-600 animate-pulse mx-auto mb-4" />
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertTriangle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Failed to Load Dashboard</h2>
          <p className="text-slate-600 mb-4">{error || 'No data available'}</p>
          <p className="text-sm text-slate-500">
            Data refreshes automatically every 6 hours
          </p>
        </div>
      </div>
    )
  }

  const analytics = data.analytics || DEFAULT_ANALYTICS
  const jira = data.jira || DEFAULT_JIRA
  const trends = data.trends // Can be null
  const insights = data.insights || DEFAULT_INSIGHTS
  const lastUpdated = data.lastUpdated || new Date().toISOString()

  // Collector-level failures reported by scripts/fetch-data.js. Without this, a source that
  // failed to fetch is indistinguishable from a source that genuinely returned zero.
  //
  // fetch-data.js only records `errors` for the two required sources, so derive the optional
  // ones from a null payload to keep the banner complete.
  const collectorErrors = [
    ...(data.errors || []),
    ...(data.trends ? [] : ['Google Trends data unavailable (SEO tab)']),
    ...(data.algolia ? [] : ['Algolia search analytics unavailable (Search tab)']),
  ]

  const hasAnalytics = Boolean(data.analytics)
  const hasJira = Boolean(data.jira)

  // Placeholder for a metric whose source failed. Rendering 0 instead would assert a real
  // measurement of zero, which is a stronger and quite different claim than "unknown".
  const UNAVAILABLE = '—'

  // Sprint velocity is only available once the Jira Agile board API is wired up. Hide the chart
  // entirely rather than rendering an empty or invented one.
  const hasVelocityData = (jira.velocityTrend?.length ?? 0) > 0

  const tabs = [
    { id: 'insights', label: 'Insights' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'jira', label: 'Jira' },
    { id: 'seo', label: 'SEO' },
    { id: 'docsbot', label: 'DocsBot' },
    { id: 'search', label: 'Search' },
    { id: 'github', label: 'GitHub' },
  ]

  return (
    <PasswordProtection>
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <BookOpen className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">DocsDash</h1>
                  <p className="text-xs text-slate-500">Documentation Metrics</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm font-medium text-slate-700">
                    Auto-updates every 6 hours
                  </div>
                  <div className="text-xs text-slate-500">
                    Last updated: {new Date(lastUpdated).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'text-primary-600 border-primary-600'
                    : 'text-slate-500 border-transparent hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CollectorErrorBanner errors={collectorErrors} />

        {/* Insights Tab (merged Overview + Insights) */}
        {activeTab === 'insights' && (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Page Views (Last 30 Days)"
                value={hasAnalytics ? analytics.pageViews.total.toLocaleString() : UNAVAILABLE}
                trend={hasAnalytics ? analytics.pageViews.trend : undefined}
                icon={<Eye className="w-6 h-6" />}
              />
              <MetricCard
                title="Avg. Session (Last 30 Days)"
                value={hasAnalytics ? analytics.userMetrics.avgSessionDuration : UNAVAILABLE}
                trend={hasAnalytics ? parseFloat(analytics.userMetrics.avgSessionDurationTrend || 0) : undefined}
                icon={<Clock className="w-6 h-6" />}
              />
              <MetricCard
                title="Jira Burn Rate"
                value={hasJira ? parseFloat(jira.burnRate || 0).toFixed(2) : UNAVAILABLE}
                trend={hasJira ? parseFloat(jira.burnRateTrend || 0) : undefined}
                icon={<TrendingUp className="w-6 h-6" />}
              />
              <MetricCard
                title="Avg Resolution (Days)"
                value={hasJira ? Math.round(jira.avgResolutionDays || 0) : UNAVAILABLE}
                trend={hasJira ? parseFloat(jira.avgResolutionDaysTrend || 0) : undefined}
                icon={<Clock className="w-6 h-6" />}
              />
            </div>

            {/* LLM-Powered Insights */}
            <LLMInsights dashboardData={data} />
          </div>
        )}

        {/* SEO Tab */}
        {activeTab === 'seo' && (
          <div className="space-y-8">
            {trends ? (
              <>
                {/* SEO Summary Metrics */}
                <SEOSummary data={trends} />

                {/* Full-width Trends Chart */}
                <TrendsChart data={trends.interestOverTime} />

                {/* Queries Tables - 4x2 Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <QueriesTable 
                    title="Top Queries - NoSQL" 
                    data={trends.categories.nosql?.topQueries || []} 
                    type="top" 
                  />
                  <QueriesTable 
                    title="Rising Queries - NoSQL" 
                    data={trends.categories.nosql?.risingQueries || []} 
                    type="rising" 
                  />
                  <QueriesTable 
                    title="Top Queries - Document-oriented Database" 
                    data={trends.categories.documentorienteddatabase?.topQueries || []} 
                    type="top" 
                  />
                  <QueriesTable 
                    title="Rising Queries - Document-oriented Database" 
                    data={trends.categories.documentorienteddatabase?.risingQueries || []} 
                    type="rising" 
                  />
                  <QueriesTable 
                    title="Top Queries - Cloud Database" 
                    data={trends.categories.clouddatabase?.topQueries || []} 
                    type="top" 
                  />
                  <QueriesTable 
                    title="Rising Queries - Cloud Database" 
                    data={trends.categories.clouddatabase?.risingQueries || []} 
                    type="rising" 
                  />
                  <QueriesTable 
                    title="Top Queries - Couchbase Server" 
                    data={trends.categories.couchbaseserver?.topQueries || []} 
                    type="top" 
                  />
                  <QueriesTable 
                    title="Rising Queries - Couchbase Server" 
                    data={trends.categories.couchbaseserver?.risingQueries || []} 
                    type="rising" 
                  />
                </div>

                {/* Last Updated */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                  <div className="flex items-center justify-center gap-2 text-amber-800 mb-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">Sample Data Display</span>
                  </div>
                  <p className="text-sm text-amber-700 mb-1">
                    This is sample data demonstrating the dashboard functionality.
                  </p>
                  <p className="text-xs text-amber-600">
                    Real Google Trends data will be displayed when the API becomes available.
                  </p>
                  <div className="text-xs text-slate-500 mt-2">
                    Generated: {new Date(trends.lastUpdated).toLocaleString()}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                <div className="text-red-600 mb-4">
                  <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">SEO Data Unavailable</h3>
                <p className="text-sm text-slate-500 mb-4">
                  Google Trends data could not be retrieved. This may be due to API limitations or network issues.
                </p>
                <p className="text-xs text-slate-400">
                  Check the GitHub Actions logs for more details.
                </p>
              </div>
            )}
          </div>
        )}

        {/* DocsBot Tab - Placeholder */}
        {activeTab === 'docsbot' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">DocsBot</h3>
            <p className="text-sm text-slate-500">Coming soon - AI-powered documentation assistant</p>
          </div>
        )}

        {/* GitHub Tab - Placeholder */}
        {activeTab === 'github' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">GitHub</h3>
            <p className="text-sm text-slate-500">Coming soon - Repository insights and activity</p>
          </div>
        )}

        {/* Search Tab */}
        {activeTab === 'search' && (
          <div className="space-y-8">
            {/* Search Metrics */}
            <SearchMetricsCard algoliaData={data.algolia} />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Top Searches */}
              <TopSearchesTable algoliaData={data.algolia} />
              
              {/* No Results Searches */}
              <NoResultsTable algoliaData={data.algolia} />
            </div>
            
            {/* Search Trends */}
            <SearchTrendsChart algoliaData={data.algolia} />
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && !hasAnalytics && (
          <DataUnavailable
            source="Google Analytics"
            hint="Verify GA_PROPERTY_ID and GOOGLE_SERVICE_ACCOUNT_KEY, and that the service account still has Viewer access to the GA4 property."
          />
        )}
        {activeTab === 'analytics' && hasAnalytics && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Page Views (Last 30 Days)"
                value={analytics.pageViews.total.toLocaleString()}
                trend={analytics.pageViews.trend}
                icon={<Eye className="w-6 h-6" />}
              />
              <MetricCard
                title="Unique Visitors (Last 30 Days)"
                value={analytics.userMetrics.uniqueVisitors.toLocaleString()}
                icon={<Users className="w-6 h-6" />}
              />
              <MetricCard
                title="Bounce Rate (Last 30 Days)"
                value={`${analytics.userMetrics.bounceRate}%`}
                icon={<ArrowUpRight className="w-6 h-6" />}
              />
              <MetricCard
                title="Avg. Session (Last 30 Days)"
                value={analytics.userMetrics.avgSessionDuration}
                icon={<Clock className="w-6 h-6" />}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TopPagesTable data={analytics.topPagesByPath || []} />
              <div className="space-y-6">
                <TrafficSourcesChart data={analytics.trafficSources} />
                <PageViewsChart data={analytics.pageViews} />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PathComparisonTable data={analytics.pathComparison || []} />
              <SDKComparisonTable data={analytics.sdkComparison || []} />
            </div>
          </div>
        )}

        {/* Jira Tab */}
        {activeTab === 'jira' && !hasJira && (
          <DataUnavailable
            source="Jira"
            hint="Verify JIRA_BASE_URL, JIRA_EMAIL, and JIRA_API_TOKEN — Atlassian API tokens expire and are a common cause of this."
          />
        )}
        {activeTab === 'jira' && hasJira && (
          <div className="space-y-8">
            {/* Current Month (Last 30 Days) */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Current Month (Last 30 Days)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                  title="Monthly Opened"
                  value={jira.monthlyOpened || 0}
                  icon={<ArrowUpRight className="w-6 h-6" />}
                />
                <MetricCard
                  title="Monthly Resolved"
                  value={jira.monthlyResolved || 0}
                  icon={<CheckCircle className="w-6 h-6" />}
                />
                <MetricCard
                  title="Burn Rate"
                  value={parseFloat(jira.burnRate || 0).toFixed(2)}
                  icon={<TrendingUp className="w-6 h-6" />}
                />
                <MetricCard
                  title="Avg. Resolution (Days)"
                  value={Math.round(jira.avgResolutionDays || 0)}
                  icon={<Clock className="w-6 h-6" />}
                />
              </div>
            </div>

            {/* Previous Month (60-30 Days Ago) */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Previous Month (60-30 Days Ago)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                  title="Previous Month Opened"
                  value={jira.previousMonthOpened || 0}
                  icon={<ArrowUpRight className="w-6 h-6" />}
                />
                <MetricCard
                  title="Previous Month Resolved"
                  value={jira.previousMonthResolved || 0}
                  icon={<CheckCircle className="w-6 h-6" />}
                />
                <MetricCard
                  title="Previous Month Burn Rate"
                  value={parseFloat(jira.previousMonthBurnRate || 0).toFixed(2)}
                  icon={<TrendingUp className="w-6 h-6" />}
                />
                <MetricCard
                  title="Previous Month Avg. Resolution (Days)"
                  value={Math.round(jira.previousMonthAvgResolutionDays || 0)}
                  icon={<Clock className="w-6 h-6" />}
                />
              </div>
            </div>

            <div className={`grid grid-cols-1 gap-6 ${hasVelocityData ? 'lg:grid-cols-2' : ''}`}>
              <JiraLabelsChart data={jira.topLabels || []} />
              {hasVelocityData && <VelocityChart data={jira.velocityTrend} />}
            </div>

            <RecentIssuesTable data={jira.recentIssues} />
          </div>
        )}

      </main>
      </div>
    </PasswordProtection>
  )
}

export default App
