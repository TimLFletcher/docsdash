import React from 'react'
import { AlertTriangle, CloudOff } from 'lucide-react'

/**
 * Banner listing collectors that failed during the last data fetch.
 *
 * scripts/fetch-data.js records per-source failures in `data.errors` but the dashboard used to
 * ignore the field entirely, so an expired Jira token or a revoked GA key rendered as a wall of
 * zeros with a green workflow run. Anything that reaches this banner needs a look at the Actions
 * log — the numbers on the affected tab are stale or absent, not genuinely zero.
 */
export function CollectorErrorBanner({ errors = [] }) {
  if (errors.length === 0) return null

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
        <div>
          <h4 className="text-sm font-semibold text-red-800">
            {errors.length === 1 ? 'A data source failed to load' : `${errors.length} data sources failed to load`}
          </h4>
          <ul className="mt-1 space-y-0.5">
            {errors.map((error, i) => (
              <li key={i} className="text-sm text-red-700">
                {error}
              </li>
            ))}
          </ul>
          <p className="text-xs text-red-600 mt-2">
            Affected panels show no data rather than a real zero. Check the GitHub Actions log for
            the failing step.
          </p>
        </div>
      </div>
    </div>
  )
}

/**
 * Full-panel empty state for a tab whose data source returned nothing.
 *
 * Use this instead of rendering metric cards bound to a missing object — zeroed cards read as a
 * real measurement of zero, which is a different and much more misleading claim than "we could
 * not fetch this".
 */
export function DataUnavailable({ source, hint }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
      <CloudOff className="w-12 h-12 text-slate-300 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-slate-900 mb-2">{source} Data Unavailable</h3>
      <p className="text-sm text-slate-500 mb-1">
        The last data fetch could not retrieve {source} data, so nothing is shown here.
      </p>
      <p className="text-xs text-slate-400">
        {hint || 'Check the GitHub Actions log for the failing step, and verify the relevant secrets have not expired.'}
      </p>
    </div>
  )
}
