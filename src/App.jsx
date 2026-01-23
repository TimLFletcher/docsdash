import React, { useState, useEffect } from 'react'
import { 
  BookOpen, 
  Eye, 
  Users, 
  Clock, 
  ArrowUpRight,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  TrendingUp
} from 'lucide-react'

// Components
import { MetricCard } from './components/MetricCard'
import { PageViewsChart } from './components/charts/PageViewsChart'
import { TopPagesTable } from './components/charts/TopPagesTable'
import { JiraPriorityChart } from './components/charts/JiraPriorityChart'
import { JiraLabelsChart } from './components/charts/JiraLabelsChart'
import { VelocityChart } from './components/charts/VelocityChart'
import { RecentIssuesTable } from './components/charts/RecentIssuesTable'
import { TrafficSourcesChart } from './components/charts/TrafficSourcesChart'
import { PathComparisonTable } from './components/charts/PathComparisonTable'
import { AIAssistant } from './components/AIAssistant'
import { PasswordProtection } from './components/PasswordProtection'

// Sample data - this will be replaced by GitHub Actions fetched data
import sampleData from './data/sample-data.json'

function App() {
  const [data, setData] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const loadData = async (showRefreshing = false) => {
    if (showRefreshing) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }

    try {
      // Add cache-busting query parameter to force fresh fetch
      const cacheBuster = new Date().getTime()
      const response = await fetch(`./data/dashboard-data.json?t=${cacheBuster}`)
      if (response.ok) {
        const liveData = await response.json()
        setData(liveData)
      } else {
        // Fall back to sample data
        setData(sampleData)
      }
    } catch (error) {
      // Fall back to sample data
      setData(sampleData)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleRefresh = () => {
    loadData(true)
  }

  if (isLoading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const { analytics, jira, insights } = data

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'jira', label: 'Jira' },
    { id: 'insights', label: 'Insights' },
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
                <span className="text-sm text-slate-500">
                  Last updated: {new Date(data.lastUpdated).toLocaleString()}
                </span>
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Refresh data"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Refreshing...' : 'Refresh'}
                </button>
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
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Page Views"
                value={analytics.pageViews.total.toLocaleString()}
                trend={analytics.pageViews.trend}
                icon={<Eye className="w-6 h-6" />}
              />
              <MetricCard
                title="Unique Visitors"
                value={analytics.userMetrics.uniqueVisitors.toLocaleString()}
                subtitle={`${analytics.userMetrics.returningVisitors}% returning`}
                icon={<Users className="w-6 h-6" />}
              />
              <MetricCard
                title="Avg. Session"
                value={analytics.userMetrics.avgSessionDuration}
                subtitle={`${analytics.userMetrics.bounceRate}% bounce rate`}
                icon={<Clock className="w-6 h-6" />}
              />
              <MetricCard
                title="Open Issues"
                value={jira.openIssues.total}
                subtitle={`${jira.openIssues.byPriority.find(p => p.priority === 'Critical')?.count || 0} critical`}
                icon={<AlertTriangle className="w-6 h-6" />}
              />
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PageViewsChart data={analytics.pageViews.daily} />
              <TopPagesTable data={analytics.topPagesByPath || []} />
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <JiraLabelsChart data={jira.topLabels || []} />
            </div>

            {/* Quick Insights */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-6 text-white">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Quick Insights
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {insights.contentGaps.slice(0, 3).map((gap, i) => (
                  <div key={i} className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <p className="text-sm">{gap}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Page Views"
                value={analytics.pageViews.total.toLocaleString()}
                trend={analytics.pageViews.trend}
                icon={<Eye className="w-6 h-6" />}
              />
              <MetricCard
                title="Unique Visitors"
                value={analytics.userMetrics.uniqueVisitors.toLocaleString()}
                icon={<Users className="w-6 h-6" />}
              />
              <MetricCard
                title="Bounce Rate"
                value={`${analytics.userMetrics.bounceRate}%`}
                icon={<ArrowUpRight className="w-6 h-6" />}
              />
              <MetricCard
                title="Avg. Session"
                value={analytics.userMetrics.avgSessionDuration}
                icon={<Clock className="w-6 h-6" />}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="lg:col-span-1">
                <TopPagesTable data={analytics.topPagesByPath || []} />
              </div>
              <div className="space-y-6">
                <TrafficSourcesChart data={analytics.trafficSources} />
                <PageViewsChart data={analytics.pageViews.daily} />
              </div>
            </div>

            <PathComparisonTable data={analytics.pathComparison || []} />
          </div>
        )}

        {/* Jira Tab */}
        {activeTab === 'jira' && (
          <div className="space-y-8">
            {/* Current Month (Last 30 Days) */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Current Month (Last 30 Days)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                  title="Monthly Opened"
                  docValue={jira.monthlyOpened || 0}
                  avValue={jira.monthlyOpenedAV || 0}
                  icon={<ArrowUpRight className="w-6 h-6" />}
                />
                <MetricCard
                  title="Monthly Resolved"
                  docValue={jira.monthlyResolved || 0}
                  avValue={jira.monthlyResolvedAV || 0}
                  icon={<CheckCircle className="w-6 h-6" />}
                />
                <MetricCard
                  title="Burn Rate"
                  docValue={parseFloat(jira.burnRate || 0).toFixed(2)}
                  avValue={parseFloat(jira.burnRateAV || 0).toFixed(2)}
                  icon={<TrendingUp className="w-6 h-6" />}
                />
                <MetricCard
                  title="Avg. Resolution"
                  docValue={Math.round(jira.avgResolutionDays || 0)}
                  avValue={Math.round(jira.avgResolutionDaysAV || 0)}
                  subtitle="days"
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
                  docValue={jira.previousMonthOpened || 0}
                  avValue={jira.previousMonthOpenedAV || 0}
                  icon={<ArrowUpRight className="w-6 h-6" />}
                />
                <MetricCard
                  title="Previous Month Resolved"
                  docValue={jira.previousMonthResolved || 0}
                  avValue={jira.previousMonthResolvedAV || 0}
                  icon={<CheckCircle className="w-6 h-6" />}
                />
                <MetricCard
                  title="Previous Month Burn Rate"
                  docValue={parseFloat(jira.previousMonthBurnRate || 0).toFixed(2)}
                  avValue={parseFloat(jira.previousMonthBurnRateAV || 0).toFixed(2)}
                  icon={<TrendingUp className="w-6 h-6" />}
                />
                <MetricCard
                  title="Previous Month Avg. Resolution"
                  docValue={Math.round(jira.previousMonthAvgResolutionDays || 0)}
                  avValue={Math.round(jira.previousMonthAvgResolutionDaysAV || 0)}
                  subtitle="days"
                  icon={<Clock className="w-6 h-6" />}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <JiraLabelsChart data={jira.topLabels || []} />
              <VelocityChart data={jira.velocityTrend} />
            </div>

            <RecentIssuesTable data={jira.recentIssues} />
          </div>
        )}

        {/* Insights Tab */}
        {activeTab === 'insights' && (
          <div className="space-y-8">
            {/* Content Gaps */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Content Gaps
              </h3>
              <p className="text-sm text-slate-500 mb-4">
                Search terms that return no results - users are looking for content that doesn't exist yet.
              </p>
              <div className="space-y-3">
                {insights.contentGaps.map((gap, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                    <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center text-amber-700 font-semibold text-sm">
                      {i + 1}
                    </div>
                    <p className="text-sm text-amber-800">{gap}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance Notes */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary-500" />
                Performance Notes
              </h3>
              <p className="text-sm text-slate-500 mb-4">
                Observations and recommendations based on current metrics.
              </p>
              <div className="space-y-3">
                {insights.performanceNotes.map((note, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-primary-50 border border-primary-100 rounded-lg">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-semibold text-sm flex-shrink-0">
                      {i + 1}
                    </div>
                    <p className="text-sm text-primary-800">{note}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Velocity Analysis */}
            <VelocityChart data={jira.velocityTrend} />
          </div>
        )}
      </main>

        {/* AI Assistant */}
        <AIAssistant dashboardData={data} />
      </div>
    </PasswordProtection>
  )
}

export default App
