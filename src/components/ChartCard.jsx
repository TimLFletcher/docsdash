import React from 'react'

/**
 * Wrapper component for charts with consistent styling
 * 
 * @param {string} title - Chart title
 * @param {string} subtitle - Optional subtitle
 * @param {React.ReactNode} children - Chart content
 * @param {React.ReactNode} actions - Optional action buttons
 * @param {string} className - Additional CSS classes
 */
export function ChartCard({ title, subtitle, children, actions, className = '' }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 p-6 ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          {subtitle && (
            <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex gap-2">
            {actions}
          </div>
        )}
      </div>
      <div className="w-full">
        {children}
      </div>
    </div>
  )
}
