import React from 'react'
import { ChartCard } from '../ChartCard'
import { ExternalLink } from 'lucide-react'

/**
 * Table showing recent Jira issues
 */
export function RecentIssuesTable({ data, jiraBaseUrl = 'https://jira.issues.couchbase.com/browse' }) {
  const getPriorityColor = (priority) => {
    switch (priority.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-700'
      case 'high': return 'bg-orange-100 text-orange-700'
      case 'medium': return 'bg-yellow-100 text-yellow-700'
      case 'low': return 'bg-green-100 text-green-700'
      default: return 'bg-slate-100 text-slate-700'
    }
  }

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'to do': return 'bg-slate-100 text-slate-700'
      case 'in progress': return 'bg-blue-100 text-blue-700'
      case 'in review': return 'bg-purple-100 text-purple-700'
      case 'done': return 'bg-green-100 text-green-700'
      default: return 'bg-slate-100 text-slate-700'
    }
  }

  return (
    <ChartCard 
      title="Recent Issues" 
      subtitle="Latest documentation tickets from Jira"
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-slate-500 border-b border-slate-100">
              <th className="pb-3 font-medium">Issue</th>
              <th className="pb-3 font-medium">Priority</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3 font-medium text-right">Created</th>
            </tr>
          </thead>
          <tbody>
            {data.map((issue) => (
              <tr 
                key={issue.key} 
                className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors"
              >
                <td className="py-3">
                  <div className="flex items-start gap-2">
                    <a 
                      href={`${jiraBaseUrl}/${issue.key}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline flex items-center gap-1"
                    >
                      {issue.key}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <p className="text-sm text-slate-600 mt-1 line-clamp-1">
                    {issue.summary}
                  </p>
                </td>
                <td className="py-3">
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(issue.priority)}`}>
                    {issue.priority}
                  </span>
                </td>
                <td className="py-3">
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(issue.status)}`}>
                    {issue.status}
                  </span>
                </td>
                <td className="py-3 text-right text-sm text-slate-500">
                  {new Date(issue.created).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ChartCard>
  )
}
