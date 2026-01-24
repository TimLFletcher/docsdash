import React from 'react'
import { ChartCard } from '../ChartCard'
import { Search, AlertCircle, TrendingUp } from 'lucide-react'

/**
 * Table showing top search terms and their performance
 */
export function SearchTermsTable({ data }) {
  if (!data || data.length === 0) {
    return (
      <ChartCard title="Top Search Terms" subtitle="How users find our documentation">
        <p className="text-sm text-slate-500 text-center py-8">No search data available</p>
      </ChartCard>
    )
  }

  // Sort by search count, highest first
  const sortedTerms = [...data].sort((a, b) => b.count - a.count).slice(0, 20)

  return (
    <ChartCard title="Top Search Terms" subtitle="How users find our documentation (Last 30 Days)">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
              <th className="pb-3 font-medium">Search Term</th>
              <th className="pb-3 font-medium text-right">Searches</th>
              <th className="pb-3 font-medium text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {sortedTerms.map((term, index) => (
              <tr 
                key={index}
                className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors"
              >
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-900">
                      {term.term}
                    </span>
                  </div>
                </td>
                <td className="py-3 text-right">
                  <span className="text-sm font-semibold text-slate-900">
                    {term.count.toLocaleString()}
                  </span>
                </td>
                <td className="py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    {term.resultsFound === false ? (
                      <>
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                        <span className="text-xs font-medium text-amber-600">No Results</span>
                      </>
                    ) : (
                      <>
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="text-xs font-medium text-green-600">Found</span>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {sortedTerms.some(term => term.resultsFound === false) && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
            <div className="text-xs text-amber-800">
              <strong>Content Gap Alert:</strong> Some search terms returned no results. 
              Consider creating content for these topics to improve user experience.
            </div>
          </div>
        </div>
      )}
    </ChartCard>
  )
}
