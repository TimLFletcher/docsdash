import React, { useState } from 'react'
import { Loader2, Key, Trash2, TrendingUp, AlertTriangle, Copy, RefreshCw } from 'lucide-react'

export function LLMInsights() {
  const [apiKey, setApiKey] = useState('')
  const [insights, setInsights] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [expandedSections, setExpandedSections] = useState({
    traffic: true,
    jira: true,
    duplicates: true,
  })

  // Load API key from localStorage on mount
  React.useEffect(() => {
    const savedKey = localStorage.getItem('openai_insights_key')
    if (savedKey) {
      setApiKey(savedKey)
    }
  }, [])

  const saveApiKey = () => {
    localStorage.setItem('openai_insights_key', apiKey)
  }

  const clearApiKey = () => {
    localStorage.removeItem('openai_insights_key')
    setApiKey('')
  }

  const generateInsights = async () => {
    if (!apiKey.trim()) {
      setError('Please provide an OpenAI API key')
      return
    }

    setIsLoading(true)
    setError(null)
    setInsights(null)

    try {
      const response = await fetch('/api/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: apiKey.trim(),
          analysisTypes: ['traffic', 'jira', 'duplicates'],
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP ${response.status}`)
      }

      const data = await response.json()
      setInsights(data.results)
      saveApiKey()
    } catch (err) {
      setError(err.message || 'Failed to generate insights')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
  }

  const renderMarkdown = (content) => {
    if (!content) return null

    // Simple markdown rendering (basic support)
    return content.split('\n').map((line, index) => {
      if (line.startsWith('## ')) {
        return <h3 key={index} className="text-lg font-semibold text-slate-900 mt-4 mb-2">{line.slice(3)}</h3>
      } else if (line.startsWith('### ')) {
        return <h4 key={index} className="text-md font-medium text-slate-800 mt-3 mb-1">{line.slice(4)}</h4>
      } else if (line.startsWith('- ')) {
        return <li key={index} className="ml-4 text-sm text-slate-600">{line.slice(2)}</li>
      } else if (line.startsWith('**') && line.endsWith('**')) {
        return <p key={index} className="text-sm font-medium text-slate-700 mt-2">{line.slice(2, -2)}</p>
      } else if (line.trim() === '') {
        return <br key={index} />
      } else {
        return <p key={index} className="text-sm text-slate-600 mt-1">{line}</p>
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* API Key Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Key className="w-5 h-5 text-primary-600" />
          OpenAI API Configuration
        </h3>
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button
              onClick={generateInsights}
              disabled={isLoading || !apiKey.trim()}
              className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4" />
                  Generate Insights
                </>
              )}
            </button>
            {apiKey && (
              <button
                onClick={clearApiKey}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                title="Clear key"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Your API key is stored locally in your browser and used only for generating insights.
          </p>
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

      {/* Insights Display */}
      {insights && (
        <div className="space-y-6">
          {/* Traffic Trends */}
          {insights.traffic && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
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
                      copyToClipboard(insights.traffic)
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
                <div className="px-6 pb-6">
                  <div className="prose prose-sm max-w-none">
                    {renderMarkdown(insights.traffic)}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Jira Trends */}
          {insights.jira && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
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
                      copyToClipboard(insights.jira)
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
                <div className="px-6 pb-6">
                  <div className="prose prose-sm max-w-none">
                    {renderMarkdown(insights.jira)}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Duplicate Detection */}
          {insights.duplicates && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
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
                      copyToClipboard(insights.duplicates)
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
                <div className="px-6 pb-6">
                  <div className="prose prose-sm max-w-none">
                    {renderMarkdown(insights.duplicates)}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Last Updated */}
          <div className="text-center text-xs text-slate-500">
            Insights generated on {new Date().toLocaleString()}
          </div>
        </div>
      )}
    </div>
  )
}
