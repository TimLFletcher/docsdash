import React, { useState, useEffect } from 'react'
import { Lock } from 'lucide-react'

const PASSWORD_KEY = 'docsdash_auth'
const CORRECT_PASSWORD = 'docsdash2024' // Change this to your desired password

export function PasswordProtection({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // Check if user is already authenticated
    const authStatus = localStorage.getItem(PASSWORD_KEY)
    if (authStatus === 'authenticated') {
      setIsAuthenticated(true)
    }
    setIsChecking(false)
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (password === CORRECT_PASSWORD) {
      localStorage.setItem(PASSWORD_KEY, 'authenticated')
      setIsAuthenticated(true)
    } else {
      setError('Incorrect password. Please try again.')
      setPassword('')
    }
  }

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Lock className="w-8 h-8 text-primary-600 mx-auto mb-4 animate-pulse" />
          <p className="text-slate-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-full max-w-md mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8">
            <div className="text-center mb-6">
              <div className="inline-flex p-3 bg-primary-100 rounded-full mb-4">
                <Lock className="w-8 h-8 text-primary-600" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">DocsDash</h1>
              <p className="text-slate-600">Please enter the password to access the dashboard</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setError('')
                  }}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
                  placeholder="Enter password"
                  autoFocus
                />
                {error && (
                  <p className="mt-2 text-sm text-red-600">{error}</p>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                Access Dashboard
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return children
}
