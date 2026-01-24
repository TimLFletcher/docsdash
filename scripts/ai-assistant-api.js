/**
 * AI Assistant API endpoint
 * Handles chat requests using OpenAI API with server-side key
 */

import { callOpenAI } from './insights-api.js'

/**
 * Main API handler for AI assistant
 */
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { message, context } = req.body

    if (!message) {
      return res.status(400).json({ error: 'Message is required' })
    }

    // Use API key from environment variable
    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      return res.status(503).json({ 
        error: 'AI service unavailable - OpenAI API key not configured',
        message: 'Please set OPENAI_API_KEY environment variable in development'
      })
    }

    // Build the full prompt with context
    const fullPrompt = `${context}

User Question: ${message}

Please provide a helpful response based on the dashboard data above. Be specific and actionable.`

    // Call OpenAI API
    const response = await callOpenAI(apiKey, fullPrompt, {})

    res.status(200).json({
      success: true,
      message: response,
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error('AI Assistant API error:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    })
  }
}
