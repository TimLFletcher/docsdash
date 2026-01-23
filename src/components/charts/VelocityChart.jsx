import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { ChartCard } from '../ChartCard'

/**
 * Bar chart showing sprint velocity (planned vs completed)
 */
export function VelocityChart({ data }) {
  return (
    <ChartCard 
      title="Sprint Velocity" 
      subtitle="Planned vs completed issues per sprint"
    >
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis 
              dataKey="sprint" 
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
            />
            <YAxis 
              tick={{ fontSize: 12, fill: '#64748b' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
            />
            <Legend 
              verticalAlign="top" 
              align="right"
              wrapperStyle={{ paddingBottom: '10px' }}
            />
            <Bar 
              dataKey="planned" 
              fill="#94a3b8" 
              radius={[4, 4, 0, 0]} 
              name="Planned"
            />
            <Bar 
              dataKey="completed" 
              fill="#3b82f6" 
              radius={[4, 4, 0, 0]} 
              name="Completed"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}
