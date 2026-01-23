import React from 'react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts'
import { ChartCard } from '../ChartCard'

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316']

/**
 * Pie chart showing traffic sources breakdown
 */
export function TrafficSourcesChart({ data }) {
  return (
    <ChartCard 
      title="Traffic Sources" 
      subtitle="Where visitors come from"
    >
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={80}
              innerRadius={50}
              dataKey="sessions"
              paddingAngle={2}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
              formatter={(value) => [value.toLocaleString(), 'Sessions']}
            />
            <Legend 
              verticalAlign="bottom"
              formatter={(value, entry) => (
                <span className="text-sm text-slate-600">
                  {entry.payload.source} ({entry.payload.percentage}%)
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}
