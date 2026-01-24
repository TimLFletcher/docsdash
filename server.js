/**
 * Simple Express server for API endpoints during development
 * Handles the insights API endpoint
 */

import express from 'express'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import insightsHandler from './scripts/insights-api.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = 3001

// Middleware
app.use(express.json())

// CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') {
    res.sendStatus(200)
  } else {
    next()
  }
})

// Insights API endpoint
app.post('/api/insights', insightsHandler)

// Serve static files from public directory
app.use(express.static(join(__dirname, 'public')))

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`)
  console.log(`📊 Insights endpoint available at http://localhost:${PORT}/api/insights`)
})
