import React from 'react'
import { ChartCard } from '../ChartCard'
import { FileText, Clock, Folder } from 'lucide-react'

/**
 * Table showing top 5 pages from each documentation path
 */
export function TopPagesTable({ data }) {
  if (!data || data.length === 0) {
    return (
      <ChartCard title="Top Pages by Path" subtitle="Top 5 pages from each documentation section">
        <p className="text-sm text-slate-500 text-center py-8">No page data available</p>
      </ChartCard>
    )
  }

  // Calculate max views across all pages for progress bars
  const allPages = data.flatMap(path => path.pages)
  const maxViews = allPages.length > 0 ? Math.max(...allPages.map(p => p.views)) : 1

  const formatPath = (path) => {
    return path.replace(/\//g, '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  return (
    <ChartCard 
      title="Top Pages by Path" 
      subtitle="Top 5 pages from each documentation section (Last 30 Days)"
    >
      <div className="space-y-6">
        {data.map((pathData, pathIndex) => {
          if (!pathData.pages || pathData.pages.length === 0) return null
          
          return (
            <div key={pathIndex} className="border-b border-slate-100 last:border-0 pb-6 last:pb-0">
              <div className="flex items-center gap-2 mb-3">
                <Folder className="w-4 h-4 text-primary-600" />
                <h4 className="text-sm font-semibold text-slate-900">
                  {formatPath(pathData.displayPath)}
                </h4>
                <span className="text-xs text-slate-500">
                  ({pathData.displayPath})
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
                      <th className="pb-2 font-medium">Page</th>
                      <th className="pb-2 font-medium text-right">Views</th>
                      <th className="pb-2 font-medium text-right">Avg. Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pathData.pages.map((page, pageIndex) => (
                      <tr 
                        key={pageIndex}
                        className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors"
                      >
                        <td className="py-2">
                          <div className="flex items-center gap-2">
                            <FileText className="w-3 h-3 text-slate-400" />
                            <span className="text-xs font-medium text-slate-700 truncate max-w-xs">
                              {page.page}
                            </span>
                          </div>
                          <div className="mt-1 w-full bg-slate-100 rounded-full h-1">
                            <div 
                              className="bg-primary-500 h-1 rounded-full transition-all"
                              style={{ width: `${(page.views / maxViews) * 100}%` }}
                            />
                          </div>
                        </td>
                        <td className="py-2 text-right">
                          <span className="text-xs font-semibold text-slate-900">
                            {page.views.toLocaleString()}
                          </span>
                        </td>
                        <td className="py-2 text-right">
                          <div className="flex items-center justify-end gap-1 text-xs text-slate-500">
                            <Clock className="w-3 h-3" />
                            {page.avgTime}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })}
      </div>
    </ChartCard>
  )
}
