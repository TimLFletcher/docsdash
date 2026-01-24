import React, { useState } from 'react'
import { Loader2, RefreshCw, TrendingUp, AlertTriangle, Copy } from 'lucide-react'

export function LLMInsights({ dashboardData }) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [expandedSections, setExpandedSections] = useState({
    traffic: false,
    jira: false,
    duplicates: false,
  })

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
  }

  const regenerateInsights = async () => {
    setIsRefreshing(true)
    setError(null)

    try {
      const response = await fetch('/api/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analysisTypes: ['traffic', 'jira', 'duplicates'],
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP ${response.status}`)
      }

      const data = await response.json()
      
      // Update the dashboard data with new insights
      // This would typically be handled by a state management system
      // For now, we'll just show a success message
      console.log('Insights regenerated:', data.results)
      
      // Trigger a page refresh to show new data
      window.location.reload()
      
    } catch (err) {
      setError(err.message || 'Failed to regenerate insights')
    } finally {
      setIsRefreshing(false)
    }
  }

  const renderMarkdown = (content) => {
    if (!content) return null

    // Process the content line by line with better bold handling
    const lines = content.split('\n')
    const elements = []
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      
      if (line.startsWith('## ')) {
        elements.push(<h3 key={i} className="text-lg font-semibold text-slate-900 mt-4 mb-2">{line.slice(3)}</h3>)
      } else if (line.startsWith('### ')) {
        elements.push(<h4 key={i} className="text-md font-medium text-slate-800 mt-3 mb-1">{line.slice(4)}</h4>)
      } else if (line.startsWith('- ')) {
        elements.push(<li key={i} className="ml-4 text-sm text-slate-600">{line.slice(2)}</li>)
      } else if (line.trim() === '') {
        elements.push(<br key={i} />)
      } else {
        // Handle bold text within the line
        const processedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-slate-700">$1</strong>')
        elements.push(
          <p key={i} className="text-sm text-slate-600 mt-1" dangerouslySetInnerHTML={{ __html: processedLine }} />
        )
      }
    }
    
    return elements
  }

  // Get AI insights from dashboard data
  const aiInsights = dashboardData?.insights?.aiInsights

  return (
    <div className="space-y-6">
      {/* Header with Regenerate Button */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary-600" />
              AI-Powered Insights
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Automated analysis of your documentation metrics
            </p>
          </div>
          <button
            onClick={regenerateInsights}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isRefreshing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Regenerating...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Regenerate
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-red-800">Error</h4>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* AI Insights Display */}
      {aiInsights ? (
        <div className="space-y-6">
          {/* Traffic Trends */}
          {aiInsights.traffic && (
            <div key="traffic-insights" className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <button
                onClick={() => toggleSection('traffic')}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  Web Traffic Trends
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      copyToClipboard(aiInsights.traffic)
                    }}
                    className="p-1 hover:bg-slate-100 rounded"
                    title="Copy to clipboard"
                  >
                    <Copy className="w-4 h-4 text-slate-500" />
                  </button>
                  <span className="text-sm text-slate-500">
                    {expandedSections.traffic ? '▼' : '▶'}
                  </span>
                </div>
              </button>
              {expandedSections.traffic && (
                <div key="traffic-content" className="px-6 pb-6">
                  <div className="prose prose-sm max-w-none">
                    {renderMarkdown(aiInsights.traffic)}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Jira Trends */}
          {aiInsights.jira && (
            <div key="jira-insights" className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <button
                onClick={() => toggleSection('jira')}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Jira Activity Analysis
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      copyToClipboard(aiInsights.jira)
                    }}
                    className="p-1 hover:bg-slate-100 rounded"
                    title="Copy to clipboard"
                  >
                    <Copy className="w-4 h-4 text-slate-500" />
                  </button>
                  <span className="text-sm text-slate-500">
                    {expandedSections.jira ? '▼' : '▶'}
                  </span>
                </div>
              </button>
              {expandedSections.jira && (
                <div key="jira-content" className="px-6 pb-6">
                  <div className="prose prose-sm max-w-none">
                    {renderMarkdown(aiInsights.jira)}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Duplicate Detection */}
          {aiInsights.duplicates && (
            <div key="duplicates-insights" className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <button
                onClick={() => toggleSection('duplicates')}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  Potential Duplicates (Last 30 Days)
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      copyToClipboard(aiInsights.duplicates)
                    }}
                    className="p-1 hover:bg-slate-100 rounded"
                    title="Copy to clipboard"
                  >
                    <Copy className="w-4 h-4 text-slate-500" />
                  </button>
                  <span className="text-sm text-slate-500">
                    {expandedSections.duplicates ? '▼' : '▶'}
                  </span>
                </div>
              </button>
              {expandedSections.duplicates && (
                <div key="duplicates-content" className="px-6 pb-6">
                  <div className="prose prose-sm max-w-none">
                    {renderMarkdown(aiInsights.duplicates)}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Last Updated */}
          <div key="last-updated" className="text-center text-xs text-slate-500">
            Insights generated on {dashboardData?.lastUpdated ? new Date(dashboardData.lastUpdated).toLocaleString() : new Date().toLocaleString()}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No AI Insights Available</h3>
          <p className="text-sm text-slate-500 mb-4">
            AI insights are generated during data fetching. Configure your OPENAI_API_KEY secret to enable this feature.
          </p>
          <button
            onClick={regenerateInsights}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isRefreshing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <TrendingUp className="w-4 h-4" />
                Generate Insights
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
