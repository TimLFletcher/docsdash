import React from 'react'
import { MousePointer, BarChart3 } from 'lucide-react'

export function CategoryClicksTable({ algoliaData }) {
  if (!algoliaData || !algoliaData.categoryClicks || algoliaData.categoryClicks.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <MousePointer className="h-5 w-5 mr-2 text-green-500" />
            Clicks by Site Category
          </h3>
        </div>
        <div className="p-6">
          <div className="text-center text-gray-500">
            <p>No category click data available</p>
          </div>
        </div>
      </div>
    )
  }

  // Sort by clicks (highest first)
  const sortedCategories = [...algoliaData.categoryClicks].sort((a, b) => b.clicks - a.clicks)
  const totalClicks = sortedCategories.reduce((sum, cat) => sum + cat.clicks, 0)

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <MousePointer className="h-5 w-5 mr-2 text-green-500" />
          Clicks by Site Category
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Search result clicks by documentation category
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Path
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Clicks
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Distribution
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedCategories.map((category, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <BarChart3 className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-900">
                      {category.category}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                    {category.path}
                  </code>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {category.clicks.toLocaleString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2 max-w-xs">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ 
                          width: `${totalClicks > 0 ? (category.clicks / totalClicks) * 100 : 0}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-900 min-w-fit">
                      {totalClicks > 0 ? ((category.clicks / totalClicks) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          <strong>Total Clicks:</strong> {totalClicks.toLocaleString()} across all categories
        </p>
      </div>
    </div>
  )
}
