import React from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

/**
 * Reusable metric card component for displaying key stats
 * 
 * @param {string} title - Card title
 * @param {string|number} value - Main metric value
 * @param {number} trend - Percentage change (positive = up, negative = down)
 * @param {string} subtitle - Optional subtitle text
 * @param {React.ReactNode} icon - Optional icon component
 */
export function MetricCard({ title, value, trend, subtitle, icon }) {
  const getTrendColor = () => {
    if (trend > 0) return 'text-green-600 bg-green-50'
    if (trend < 0) return 'text-red-600 bg-red-50'
    return 'text-slate-600 bg-slate-50'
  }

  const TrendIcon = trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{value}</p>
          {subtitle && (
            <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="p-3 bg-primary-50 rounded-lg text-primary-600">
            {icon}
          </div>
        )}
      </div>
      {trend !== undefined && (
        <div className="mt-4 flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${getTrendColor()}`}>
            <TrendIcon className="w-4 h-4" />
            {Math.abs(trend)}%
          </span>
          <span className="text-sm text-slate-500">vs last period</span>
        </div>
      )}
    </div>
  )
}
