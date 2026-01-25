# DocsDash

A modern, extensible dashboard for technical documentation metrics. Pulls data from Google Analytics and Jira, visualizes key metrics, and provides AI-powered insights.

![Dashboard Preview](https://via.placeholder.com/800x400?text=DocsDash+Preview)

## Features

- **Google Analytics Integration**: Page views, top pages, search terms, traffic sources
- **Jira Integration**: Open issues, priority breakdown, sprint velocity
- **AI Assistant**: ChatGPT-powered insights and recommendations
- **Content Gap Detection**: Identifies searches with no results
- **Fully Static Deployment**: Runs on GitHub Pages with zero server costs
- **Extensible**: Easy to add new charts and data sources

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

The dashboard will run at `http://localhost:5173` with sample data.

### Deploy to GitHub Pages

1. **Create a new GitHub repository**

2. **Push this code to the repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```

3. **Configure GitHub Pages**
   - Go to Settings → Pages
   - Source: "GitHub Actions"

4. **Add secrets** (Settings → Secrets → Actions):
   - See [Configuration](#configuration) section below

5. **Update `vite.config.js`**
   - Change `base` to match your repository name:
   ```js
   base: process.env.NODE_ENV === 'production' ? '/YOUR_REPO_NAME/' : '/',
   ```

6. **Trigger the workflow**
   - Push a commit or manually trigger via Actions tab

## Configuration

### Required GitHub Secrets

#### Google Analytics

| Secret | Description |
|--------|-------------|
| `GA_PROPERTY_ID` | Your GA4 property ID (e.g., `123456789`) |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | Service account JSON key (entire JSON content) |
| `OPENAI_API_KEY` | OpenAI API key for AI insights (optional) |
| `SITE_PASS` | Password to protect access to the dashboard (required) |

**Setting up Google Analytics:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use existing)
3. Enable the "Google Analytics Data API"
4. Create a Service Account:
   - Go to IAM & Admin → Service Accounts
   - Create a new service account
   - Download the JSON key
5. Add the service account email to your GA4 property:
   - GA4 Admin → Property Access Management
   - Add the service account email with "Viewer" role
6. Add the entire JSON key content as `GOOGLE_SERVICE_ACCOUNT_KEY` secret
7. Add your property ID as `GA_PROPERTY_ID` secret

#### Site Password

| Secret | Description |
|--------|-------------|
| `SITE_PASS` | Password to protect access to the dashboard (required) |

**Setting up Site Password:**

1. Choose a secure password for your dashboard
2. Add the password as `SITE_PASS` secret in GitHub
3. The password will be injected during build and used to protect access
4. For local development, the default password is `docsdash2024`

#### Jira

| Secret | Description |
|--------|-------------|
| `JIRA_BASE_URL` | Your Jira instance (e.g., `https://your-org.atlassian.net`) |
| `JIRA_EMAIL` | Your Atlassian account email |
| `JIRA_API_TOKEN` | Jira API token |
| `JIRA_PROJECT_KEY` | Project key (e.g., `DOC`) |

**Setting up Jira:**

1. Go to [Atlassian API Tokens](https://id.atlassian.com/manage-profile/security/api-tokens)
2. Create a new API token
3. Add secrets to GitHub

### Custom JQL Queries

Edit `scripts/fetch-data.js` to customize the JQL queries. The default queries are:

```javascript
// Open issues
`project=${projectKey} AND status != Done ORDER BY priority DESC`

// Recent issues
`project=${projectKey} ORDER BY created DESC`

// Created this week
`project=${projectKey} AND created >= -7d`
```

## Adding New Charts

The dashboard is built with modular, reusable components. Here's how to add a new chart:

### 1. Create the Chart Component

```jsx
// src/components/charts/MyNewChart.jsx
import React from 'react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts'
import { ChartCard } from '../ChartCard'

export function MyNewChart({ data }) {
  return (
    <ChartCard title="My New Chart" subtitle="Description here">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="name" />
            <YAxis />
            <Bar dataKey="value" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}
```

### 2. Add to App.jsx

```jsx
import { MyNewChart } from './components/charts/MyNewChart'

// In the render:
<MyNewChart data={data.myNewData} />
```

### 3. Update Data Structure

Add the new data to `src/data/sample-data.json` and update `scripts/fetch-data.js` to fetch the real data.

## Available Chart Components

| Component | Description |
|-----------|-------------|
| `MetricCard` | Single metric with trend indicator |
| `ChartCard` | Wrapper with title/subtitle for any chart |
| `PageViewsChart` | Area chart for time-series data |
| `TopPagesTable` | Table with progress bars |
| `SearchTermsChart` | Horizontal bar chart with color coding |
| `JiraPriorityChart` | Donut chart |
| `VelocityChart` | Grouped bar chart |
| `RecentIssuesTable` | Table with status badges |
| `TrafficSourcesChart` | Pie chart |

## AI Assistant

The AI assistant uses OpenAI's API to provide insights. Users provide their own API key, which is stored in their browser's localStorage (never sent to your servers).

### Customizing the AI Context

Edit the `buildContext()` function in `src/components/AIAssistant.jsx` to change what data is sent to the AI.

### Using a Different LLM

Replace the OpenAI API call with any other provider (Anthropic, Google, etc.) by modifying the `sendMessage()` function.

## Data Refresh Schedule

The GitHub Action runs every 6 hours by default. To change this, edit `.github/workflows/fetch-and-deploy.yml`:

```yaml
schedule:
  - cron: '0 */6 * * *'  # Every 6 hours
  # - cron: '0 0 * * *'   # Daily at midnight
  # - cron: '0 * * * *'   # Every hour
```

## Project Structure

```
docsdash/
├── .github/
│   └── workflows/
│       └── fetch-and-deploy.yml    # CI/CD pipeline
├── public/
│   └── favicon.svg
├── scripts/
│   └── fetch-data.js               # Data fetching script
├── src/
│   ├── components/
│   │   ├── charts/                 # Chart components
│   │   ├── AIAssistant.jsx         # LLM integration
│   │   ├── ChartCard.jsx           # Chart wrapper
│   │   └── MetricCard.jsx          # Metric display
│   ├── data/
│   │   └── sample-data.json        # Sample/fallback data
│   ├── App.jsx                     # Main app
│   ├── index.css                   # Tailwind imports
│   └── main.jsx                    # Entry point
├── index.html
├── package.json
├── tailwind.config.js
└── vite.config.js
```

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Recharts** - Charts
- **Lucide React** - Icons
- **GitHub Actions** - CI/CD and data fetching

## Troubleshooting

### Data not updating

1. Check GitHub Actions logs for errors
2. Verify all secrets are correctly set
3. Ensure GA service account has access to the property
4. Check Jira API token hasn't expired

### Charts not rendering

1. Check browser console for errors
2. Verify data structure matches expected format
3. Ensure Recharts is properly imported

### AI Assistant not working

1. Verify OpenAI API key is correct
2. Check browser console for CORS or API errors
3. Ensure you have API credits remaining

## License

MIT
