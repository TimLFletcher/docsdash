import React from 'react'
import { Search, TrendingUp, TrendingDown, FileText } from 'lucide-react'

export function TopSearchesTable({ algoliaData }) {
  if (!algoliaData || !algoliaData.topSearches || algoliaData.topSearches.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Search className="h-5 w-5 mr-2 text-blue-500" />
            Top Search Queries
          </h3>
        </div>
        <div className="p-6">
          <div className="text-center text-gray-500">
            <p>No search data available</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <Search className="h-5 w-5 mr-2 text-blue-500" />
          Top Search Queries
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Top 20 most popular searches (30 days)
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Query
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Searches
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Results Found
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Results/Search
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {algoliaData.topSearches.map((search, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {search.query}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {search.count.toLocaleString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="text-sm text-gray-900">
                      {search.avgResults.toLocaleString()}
                    </span>
                    {search.avgResults > 5000 && (
                      <FileText className="h-4 w-4 text-green-500 ml-2" />
                    )}
                    {search.avgResults < 100 && (
                      <TrendingDown className="h-4 w-4 text-orange-500 ml-2" />
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ 
                          width: `${Math.min((search.resultsPerSearch / 100) * 100, 100)}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-900">
                      {search.resultsPerSearch}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
