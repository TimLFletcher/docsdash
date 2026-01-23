import React, { useState, useRef, useEffect } from 'react'
import { MessageSquare, Send, Settings, X, Loader2, Sparkles, Key, Trash2 } from 'lucide-react'

/**
 * AI Assistant component that uses OpenAI to provide insights
 * User provides their own API key (stored in localStorage)
 */
export function AIAssistant({ dashboardData }) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const messagesEndRef = useRef(null)

  useEffect(() => {
    const savedKey = localStorage.getItem('openai_api_key')
    if (savedKey) {
      setApiKey(savedKey)
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const saveApiKey = () => {
    localStorage.setItem('openai_api_key', apiKey)
    setShowSettings(false)
  }

  const clearApiKey = () => {
    localStorage.removeItem('openai_api_key')
    setApiKey('')
  }

  const buildContext = () => {
    const { analytics, jira, insights } = dashboardData

    return `You are a documentation metrics analyst. Here's the current data:

## Google Analytics Summary
- Total Page Views: ${analytics.pageViews.total.toLocaleString()} (${analytics.pageViews.trend > 0 ? '+' : ''}${analytics.pageViews.trend}% trend)
- Unique Visitors: ${analytics.userMetrics.uniqueVisitors.toLocaleString()}
- Bounce Rate: ${analytics.userMetrics.bounceRate}%
- Avg Session Duration: ${analytics.userMetrics.avgSessionDuration}

## Top Pages
${analytics.topPages.slice(0, 5).map(p => `- ${p.page}: ${p.views.toLocaleString()} views, ${p.avgTime} avg time`).join('\n')}

## Search Terms (Content Gaps shown with *)
${analytics.searchTerms.map(s => `- "${s.term}": ${s.count} searches${!s.resultsFound ? ' *NO RESULTS*' : ''}`).join('\n')}

## Jira Summary
- Open Issues: ${jira.openIssues.total} (${jira.openIssues.byPriority.find(p => p.priority === 'Critical')?.count || 0} critical, ${jira.openIssues.byPriority.find(p => p.priority === 'High')?.count || 0} high)
- Issues Created This Week: ${jira.issuesCreatedThisWeek}
- Issues Closed This Week: ${jira.issuesClosedThisWeek}
- Avg Resolution Time: ${jira.avgResolutionDays} days

## Recent Velocity
${jira.velocityTrend.slice(-3).map(v => `- ${v.sprint}: ${v.completed}/${v.planned} completed`).join('\n')}

## Known Content Gaps
${insights.contentGaps.join('\n- ')}

## Performance Notes
${insights.performanceNotes.join('\n- ')}

Based on this data, provide actionable insights and recommendations. Be specific and prioritize high-impact suggestions. Keep responses concise but helpful.`
  }

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return
    if (!apiKey) {
      setShowSettings(true)
      return
    }

    const userMessage = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: buildContext() },
            ...messages,
            userMessage,
          ],
          max_tokens: 1000,
          temperature: 0.7,
        }),
      })

      if (!response.ok) {
        throw new Error(response.status === 401 ? 'Invalid API key' : 'API request failed')
      }

      const data = await response.json()
      const assistantMessage = {
        role: 'assistant',
        content: data.choices[0].message.content,
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error: ${error.message}. Please check your API key and try again.`,
        isError: true,
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const quickPrompts = [
    "What are the top 3 priorities for improving our docs?",
    "Analyze the content gaps and suggest solutions",
    "How can we reduce the bounce rate?",
    "What does the sprint velocity tell us?",
  ]

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-primary-600 text-white p-4 rounded-full shadow-lg hover:bg-primary-700 transition-colors z-50 flex items-center gap-2"
      >
        <Sparkles className="w-6 h-6" />
        <span className="hidden sm:inline font-medium">AI Insights</span>
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 max-w-[calc(100vw-3rem)] bg-white rounded-xl shadow-2xl border border-slate-200 z-50 flex flex-col max-h-[600px]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary-600" />
          <h3 className="font-semibold text-slate-900">AI Assistant</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            title="API Settings"
          >
            <Key className="w-4 h-4 text-slate-500" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="p-4 bg-slate-50 border-b border-slate-100">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            OpenAI API Key
          </label>
          <div className="flex gap-2">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button
              onClick={saveApiKey}
              className="px-3 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700"
            >
              Save
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
          <p className="text-xs text-slate-500 mt-2">
            Your API key is stored locally in your browser.
          </p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[200px]">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500 mb-4">
              Ask me anything about your documentation metrics!
            </p>
            <div className="space-y-2">
              {quickPrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => setInput(prompt)}
                  className="block w-full text-left text-sm px-3 py-2 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] px-4 py-2 rounded-xl text-sm ${
                msg.role === 'user'
                  ? 'bg-primary-600 text-white'
                  : msg.isError
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 px-4 py-2 rounded-xl">
              <Loader2 className="w-5 h-5 text-slate-500 animate-spin" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-100">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask about your metrics..."
            className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
