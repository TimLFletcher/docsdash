import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp } from 'lucide-react'

export function SearchTrendsChart({ algoliaData }) {
  if (!algoliaData || !algoliaData.searchTrends || algoliaData.searchTrends.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-purple-500" />
            Search Trends (30 Days)
          </h3>
        </div>
        <div className="p-6">
          <div className="text-center text-gray-500">
            <p>No search trend data available</p>
          </div>
        </div>
      </div>
    )
  }

  // Format the data for the chart
  const chartData = algoliaData.searchTrends.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    }),
    searches: item.searches
  }))

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-purple-500" />
          Search Trends (30 Days)
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Daily search volume over the last 30 days
        </p>
      </div>
      <div className="p-6">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis 
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              formatter={(value) => [value.toLocaleString(), 'Searches']}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Line 
              type="monotone" 
              dataKey="searches" 
              stroke="#8b5cf6" 
              strokeWidth={2}
              dot={{ fill: '#8b5cf6', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
