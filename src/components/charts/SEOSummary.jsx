import React from 'react'
import { TrendingUp, TrendingDown, Minus, Search, BarChart3, Activity } from 'lucide-react'

export function SEOSummary({ data }) {
  if (!data) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-slate-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const getTrendIcon = (direction) => {
    switch (direction) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-600" />
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-600" />
      default:
        return <Minus className="w-4 h-4 text-slate-400" />
    }
  }

  const getTrendColor = (direction) => {
    switch (direction) {
      case 'up':
        return 'text-green-600'
      case 'down':
        return 'text-red-600'
      default:
        return 'text-slate-600'
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Current Interest - Couchbase */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-2">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Search className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex items-center gap-1">
            {getTrendIcon(data.summary?.trendDirection)}
          </div>
        </div>
        <div className="text-2xl font-bold text-slate-900">
          {data.summary?.currentInterest || 0}
        </div>
        <div className="text-sm text-slate-600">Couchbase Interest</div>
        <div className={`text-xs mt-1 ${getTrendColor(data.summary?.trendDirection)}`}>
          {data.summary?.trendDirection === 'up' ? 'Rising' : 
           data.summary?.trendDirection === 'down' ? 'Declining' : 'Stable'}
        </div>
      </div>

      {/* Peak Interest */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-2">
          <div className="p-2 bg-purple-100 rounded-lg">
            <BarChart3 className="w-5 h-5 text-purple-600" />
          </div>
        </div>
        <div className="text-2xl font-bold text-slate-900">
          {data.summary?.peakInterest || 0}
        </div>
        <div className="text-sm text-slate-600">Peak Interest</div>
        <div className="text-xs mt-1 text-slate-500">
          Last 12 months
        </div>
      </div>

      {/* Average Interest */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-2">
          <div className="p-2 bg-amber-100 rounded-lg">
            <TrendingUp className="w-5 h-5 text-amber-600" />
          </div>
        </div>
        <div className="text-2xl font-bold text-slate-900">
          {Math.round(data.summary?.avgInterest || 0)}
        </div>
        <div className="text-sm text-slate-600">Average Interest</div>
        <div className="text-xs mt-1 text-slate-500">
          12-month average
        </div>
      </div>

      {/* Comparison Metric */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-2">
          <div className="p-2 bg-green-100 rounded-lg">
            <Activity className="w-5 h-5 text-green-600" />
          </div>
        </div>
        <div className="text-2xl font-bold text-slate-900">
          4
        </div>
        <div className="text-sm text-slate-600">Database Categories</div>
        <div className="text-xs mt-1 text-slate-500">
          Worldwide trends
        </div>
      </div>
    </div>
  )
}
