import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export function TrendsChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Interest Over Time</h3>
        <div className="h-64 flex items-center justify-center text-slate-500">
          No trends data available
        </div>
      </div>
    )
  }

  // Format the data for the chart
  const chartData = data.map(item => {
    // Handle Unix timestamp (convert to milliseconds)
    const timestamp = item.date.includes('.') ? parseFloat(item.date) * 1000 : parseInt(item.date)
    const date = new Date(timestamp)
    const isValidDate = !isNaN(date.getTime())
    
    return {
      date: isValidDate 
        ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : 'Invalid Date',
      nosql: item.nosql || 0,
      documentorienteddatabase: item.documentorienteddatabase || 0,
      clouddatabase: item.clouddatabase || 0,
      couchbaseserver: item.couchbaseserver || 0,
      fullDate: item.formattedTime || item.date,
      timestamp: isValidDate ? date.getTime() : 0
    }
  }).filter(item => item.timestamp > 0) // Filter out invalid dates

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 lg:col-span-2">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Database Trends - Worldwide</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              dataKey="date" 
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="#64748b"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              domain={[0, 'dataMax']}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '8px 12px'
              }}
              formatter={(value, name) => [
                value, 
                name === 'nosql' ? 'NoSQL' :
                name === 'documentorienteddatabase' ? 'Document-oriented Database' :
                name === 'clouddatabase' ? 'Cloud Database' :
                name === 'couchbaseserver' ? 'Couchbase Server' : name
              ]}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="nosql" 
              stroke="#3b82f6" 
              strokeWidth={2}
              name="NoSQL"
              dot={false}
              activeDot={{
                r: 4,
                fill: '#3b82f6',
                stroke: 'white',
                strokeWidth: 2
              }}
            />
            <Line 
              type="monotone" 
              dataKey="documentorienteddatabase" 
              stroke="#10b981" 
              strokeWidth={2}
              name="Document-oriented Database"
              dot={false}
              activeDot={{
                r: 4,
                fill: '#10b981',
                stroke: 'white',
                strokeWidth: 2
              }}
            />
            <Line 
              type="monotone" 
              dataKey="clouddatabase" 
              stroke="#f59e0b" 
              strokeWidth={2}
              name="Cloud Database"
              dot={false}
              activeDot={{
                r: 4,
                fill: '#f59e0b',
                stroke: 'white',
                strokeWidth: 2
              }}
            />
            <Line 
              type="monotone" 
              dataKey="couchbaseserver" 
              stroke="#ef4444" 
              strokeWidth={2}
              name="Couchbase Server"
              dot={false}
              activeDot={{
                r: 4,
                fill: '#ef4444',
                stroke: 'white',
                strokeWidth: 2
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
