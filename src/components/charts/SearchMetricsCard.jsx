import React from 'react'
import { Search, TrendingUp, AlertTriangle, BarChart3 } from 'lucide-react'

export function SearchMetricsCard({ algoliaData }) {
  if (!algoliaData) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-gray-500">
          <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
          <p>No search data available</p>
        </div>
      </div>
    )
  }

  const { searchMetrics, noResultsPercentage } = algoliaData

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Searches</p>
            <p className="text-2xl font-bold text-gray-900">
              {searchMetrics.totalSearches.toLocaleString()}
            </p>
          </div>
          <Search className="h-8 w-8 text-blue-500" />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Avg Searches/Day</p>
            <p className="text-2xl font-bold text-gray-900">
              {searchMetrics.avgSearchesPerDay.toLocaleString()}
            </p>
          </div>
          <BarChart3 className="h-8 w-8 text-green-500" />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">No Results Rate</p>
            <p className="text-2xl font-bold text-gray-900">
              {noResultsPercentage}%
            </p>
          </div>
          <AlertTriangle className="h-8 w-8 text-orange-500" />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Peak Day</p>
            <p className="text-2xl font-bold text-gray-900">
              {searchMetrics.peakDay.toLocaleString()}
            </p>
          </div>
          <TrendingUp className="h-8 w-8 text-purple-500" />
        </div>
      </div>
    </div>
  )
}
