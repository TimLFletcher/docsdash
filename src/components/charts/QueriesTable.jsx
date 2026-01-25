import React from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export function QueriesTable({ title, data, type = 'top' }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">{title}</h3>
        <div className="text-center text-slate-500 py-8">
          No query data available
        </div>
      </div>
    )
  }

  const getTrendIcon = (value) => {
    if (type === 'rising') {
      return <TrendingUp className="w-4 h-4 text-green-600" />
    }
    // For top queries, we could analyze if it's trending up/down based on value
    return <TrendingUp className="w-4 h-4 text-blue-600" />
  }

  const formatValue = (value) => {
    if (typeof value === 'string' && value.includes('+')) {
      return value // Already formatted (e.g., "Breakout", "+450%")
    }
    if (typeof value === 'number') {
      return value.toLocaleString()
    }
    return value
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-3 px-2 text-sm font-medium text-slate-700">Query</th>
              <th className="text-right py-3 px-2 text-sm font-medium text-slate-700">Interest</th>
              <th className="text-center py-3 px-2 text-sm font-medium text-slate-700">Trend</th>
            </tr>
          </thead>
          <tbody>
            {data.map((query, index) => (
              <tr key={index} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="py-3 px-2">
                  <div className="font-medium text-slate-900 text-sm">
                    {query.query}
                  </div>
                </td>
                <td className="py-3 px-2 text-right">
                  <div className="text-sm text-slate-600">
                    {formatValue(query.value)}
                  </div>
                </td>
                <td className="py-3 px-2 text-center">
                  <div className="flex items-center justify-center">
                    {getTrendIcon(query.value)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.length === 0 && (
        <div className="text-center text-slate-500 py-8">
          No {type.toLowerCase()} queries found
        </div>
      )}
    </div>
  )
}
