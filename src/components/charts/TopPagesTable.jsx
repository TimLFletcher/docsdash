import React from 'react'
import { ChartCard } from '../ChartCard'
import { FileText, Clock } from 'lucide-react'

/**
 * Table showing top documentation pages by views
 */
export function TopPagesTable({ data }) {
  const maxViews = Math.max(...data.map(p => p.views))

  return (
    <ChartCard 
      title="Top Pages" 
      subtitle="Most visited documentation pages"
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-slate-500 border-b border-slate-100">
              <th className="pb-3 font-medium">Page</th>
              <th className="pb-3 font-medium text-right">Views</th>
              <th className="pb-3 font-medium text-right">Avg. Time</th>
            </tr>
          </thead>
          <tbody>
            {data.map((page, index) => (
              <tr 
                key={page.page} 
                className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors"
              >
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-700 truncate max-w-xs">
                      {page.page}
                    </span>
                  </div>
                  <div className="mt-1.5 w-full bg-slate-100 rounded-full h-1.5">
                    <div 
                      className="bg-primary-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${(page.views / maxViews) * 100}%` }}
                    />
                  </div>
                </td>
                <td className="py-3 text-right">
                  <span className="text-sm font-semibold text-slate-900">
                    {page.views.toLocaleString()}
                  </span>
                </td>
                <td className="py-3 text-right">
                  <div className="flex items-center justify-end gap-1 text-sm text-slate-500">
                    <Clock className="w-3 h-3" />
                    {page.avgTime}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ChartCard>
  )
}
