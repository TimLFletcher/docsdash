import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export function RegionalInterestChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Interest by Region</h3>
        <div className="h-64 flex items-center justify-center text-slate-500">
          No regional data available
        </div>
      </div>
    )
  }

  // Sort by interest value and take top 10
  const sortedData = data
    .sort((a, b) => b.value - a.value)
    .slice(0, 10)
    .map(item => ({
      region: item.region.length > 15 ? item.region.substring(0, 15) + '...' : item.region,
      fullRegion: item.region,
      value: item.value
    }))

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Interest by Region (Top 10)</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sortedData} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              type="number"
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              type="category"
              dataKey="region"
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              width={80}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '8px 12px'
              }}
              formatter={(value) => [`${value}`, 'Interest']}
              labelFormatter={(label) => `Region: ${label}`}
            />
            <Bar 
              dataKey="value" 
              fill="#10b981" 
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
