import React, { useState, useRef, useEffect } from 'react'
import { MessageSquare, Send, Settings, X, Loader2, Sparkles } from 'lucide-react'

/**
 * AI Assistant component that uses OpenAI to provide insights
 * Uses server-side API key for security
 */
export function AIAssistant({ dashboardData }) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const buildContext = () => {
    const analytics = dashboardData?.analytics || {
      pageViews: { total: 0, trend: 0 },
      userMetrics: { uniqueVisitors: 0, bounceRate: 0, avgSessionDuration: '0:00' },
      topPages: [],
      searchTerms: [],
    }
    const jira = dashboardData?.jira || {
      openIssues: { total: 0, byPriority: [] },
      monthlyOpened: 0,
      monthlyResolved: 0,
      burnRate: 0,
      avgResolutionDays: 0,
      velocityTrend: [],
    }
    const insights = dashboardData?.insights || { contentGaps: [], performanceNotes: [] }

    return `You are a documentation metrics analyst. Here's the current data:

## Google Analytics Summary
- Total Page Views: ${analytics.pageViews.total.toLocaleString()} (${analytics.pageViews.trend > 0 ? '+' : ''}${analytics.pageViews.trend}% trend)
- Unique Visitors: ${analytics.userMetrics.uniqueVisitors.toLocaleString()}
- Bounce Rate: ${analytics.userMetrics.bounceRate}%
- Avg Session Duration: ${analytics.userMetrics.avgSessionDuration}

## Top Pages
${(analytics.topPages || []).slice(0, 5).map(p => `- ${p.page}: ${p.views.toLocaleString()} views, ${p.avgTime} avg time`).join('\n')}

## Search Terms (Content Gaps shown with *)
${(analytics.searchTerms || []).map(s => `- "${s.term}": ${s.count} searches${!s.resultsFound ? ' *NO RESULTS*' : ''}`).join('\n')}

## Jira Summary
- Open Issues: ${jira.openIssues.total} (${jira.openIssues.byPriority.find(p => p.priority === 'Critical')?.count || 0} critical, ${jira.openIssues.byPriority.find(p => p.priority === 'High')?.count || 0} high)
- Monthly Opened: ${jira.monthlyOpened}
- Monthly Resolved: ${jira.monthlyResolved}
- Burn Rate: ${jira.burnRate}
- Avg Resolution Time: ${jira.avgResolutionDays} days

## Recent Velocity
${(jira.velocityTrend || []).slice(-3).map(v => `- ${v.sprint}: ${v.completed}/${v.planned} completed`).join('\n')}

## Known Content Gaps
${(insights.contentGaps || []).join('\n- ')}

## Performance Notes
${(insights.performanceNotes || []).join('\n- ')}

Based on this data, provide actionable insights and recommendations. Be specific and prioritize high-impact suggestions. Keep responses concise but helpful.`
  }

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // Check if we have pre-generated AI insights from the build process
      const aiInsights = dashboardData?.insights?.aiInsights
      
      if (aiInsights) {
        // Use pre-generated insights to provide context-aware responses
        const context = buildContext()
        
        // Simple rule-based responses based on the input and available data
        let response = ''
        
        if (input.toLowerCase().includes('traffic') || input.toLowerCase().includes('analytics')) {
          response = aiInsights.traffic || "I don't have specific traffic insights available right now. The analytics data shows current metrics in the dashboard."
        } else if (input.toLowerCase().includes('jira') || input.toLowerCase().includes('ticket')) {
          response = aiInsights.jira || "I don't have specific Jira insights available right now. The Jira data shows current ticket metrics in the dashboard."
        } else if (input.toLowerCase().includes('duplicate')) {
          response = aiInsights.duplicates || "I don't have duplicate analysis available right now. Check the Insights tab for the latest duplicate detection results."
        } else {
          // General response based on available data
          response = `Based on the dashboard data I can see:

${context}

For more specific insights, check the Insights tab which contains detailed AI analysis of your metrics. The insights are generated during each data fetch and provide actionable recommendations for improving your documentation.

Is there something specific about the metrics you'd like me to explain further?`
        }
        
        const assistantMessage = {
          role: 'assistant',
          content: response,
        }
        setMessages(prev => [...prev, assistantMessage])
      } else {
        // No AI insights available - provide helpful message
        const assistantMessage = {
          role: 'assistant',
          content: `I can help you understand your dashboard data, but AI-powered insights aren't currently available. 

Here's what I can tell you from your current metrics:

${buildContext()}

For detailed AI analysis, make sure the OPENAI_API_KEY secret is configured in your GitHub repository. The insights are generated during scheduled data fetches and appear in the Insights tab.

What specific aspect of your metrics would you like to understand better?`,
        }
        setMessages(prev => [...prev, assistantMessage])
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error: ${error.message}. I can still help you understand your dashboard data based on the available metrics.`,
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
        <button
          onClick={() => setIsOpen(false)}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <X className="w-4 h-4 text-slate-500" />
        </button>
      </div>

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
        <p className="text-xs text-slate-500 mt-2">
          Powered by pre-generated AI insights • Uses data from scheduled analysis
        </p>
      </div>
    </div>
  )
}
