// Fallback for local development
// This file is overwritten during build with the actual SITE_PASSWORD from GitHub secrets
export const SITE_PASSWORD = process.env.NODE_ENV === 'development' ? 'docsdash2024' : ''
