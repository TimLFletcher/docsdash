import React from 'react'
import { ChartCard } from '../ChartCard'

/**
 * Table comparing metrics across different SDK documentation paths
 */
export function SDKComparisonTable({ data }) {
  if (!data || data.length === 0) {
    return (
      <ChartCard title="SDK Comparison" subtitle="Compare metrics across SDK documentation">
        <p className="text-sm text-slate-500 text-center py-8">No SDK data available</p>
      </ChartCard>
    )
  }

  const formatSDKName = (path) => {
    // Extract SDK name from path and format it nicely
    const sdkMap = {
      'dotnet-sdk': '.NET SDK',
      'efcore-provider': 'EF Core Provider',
      'c-sdk': 'C SDK',
      'cxx-sdk': 'C++ SDK',
      'go-sdk': 'Go SDK',
      'java-sdk': 'Java SDK',
      'quarkus-extension': 'Quarkus Extension',
      'kotlin-sdk': 'Kotlin SDK',
      'nodejs-sdk': 'Node.js SDK',
      'php-sdk': 'PHP SDK',
      'python-sdk': 'Python SDK',
      'ruby-sdk': 'Ruby SDK',
      'rust-sdk': 'Rust SDK',
      'scala-sdk': 'Scala SDK'
    }
    
    const pathKey = path.replace(/^\/|\/$/g, '') // Remove leading/trailing slashes
    return sdkMap[pathKey] || formatPath(path)
  }

  const formatPath = (path) => {
    return path.replace(/\//g, '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  return (
    <ChartCard 
      title="SDK Comparison" 
      subtitle="Metrics for each SDK documentation (Last 30 Days)"
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-slate-500 border-b border-slate-200">
              <th className="pb-3 font-medium">SDK</th>
              <th className="pb-3 font-medium text-right">Total Views</th>
              <th className="pb-3 font-medium text-right">Bounce Rate</th>
              <th className="pb-3 font-medium text-right">Avg. Session</th>
              <th className="pb-3 font-medium text-right">Traffic Balance</th>
            </tr>
          </thead>
          <tbody>
            {data.map((path, index) => (
              <tr 
                key={index}
                className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors"
              >
                <td className="py-3">
                  <div className="font-medium text-slate-900">
                    {formatSDKName(path.displayPath)}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {path.displayPath}
                  </div>
                </td>
                <td className="py-3 text-right">
                  <span className="font-medium text-slate-900">
                    {path.totalViews.toLocaleString()}
                  </span>
                </td>
                <td className="py-3 text-right">
                  <span className="font-medium text-slate-900">
                    {path.bounceRate}%
                  </span>
                </td>
                <td className="py-3 text-right">
                  <span className="font-medium text-slate-900">
                    {path.avgSessionDuration}
                  </span>
                </td>
                <td className="py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span className="text-xs text-slate-600">
                        {path.trafficBalance.direct}%
                      </span>
                    </div>
                    <span className="text-slate-300">|</span>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="text-xs text-slate-600">
                        {path.trafficBalance.search}%
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Direct / Search
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
