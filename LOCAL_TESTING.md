# Local Testing Setup

This allows you to test the actual data fetching mechanism locally with real credentials.

## Quick Setup

1. **Copy the template:**
   ```bash
   cp .env.local.example .env.local
   ```

2. **Edit .env.local with your real credentials:**
   ```env
   # Google Analytics 4
   GA_PROPERTY_ID=your-actual-ga4-property-id
   GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project",...}

   # JIRA
   JIRA_BASE_URL=https://your-domain.atlassian.net
   JIRA_USERNAME=your-email@company.com
   JIRA_API_TOKEN=your-actual-jira-api-token

   # OpenAI (optional)
   OPENAI_API_KEY=your-openai-api-key

   # Site Password
   SITE_PASS=docsdash2024
   ```

3. **Test the fetch:**
   ```bash
   npm run fetch-data
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

## How It Works

- **Local Development**: Uses credentials from `.env.local` file
- **GitHub Actions**: Uses credentials from GitHub secrets
- **No Sample Data**: Tests actual API calls and data fetching
- **Secure**: `.env.local` is ignored by git and won't be committed

## Files

- `.env.local.example` - Template with placeholder values
- `.env.local` - Your actual credentials (create this, don't commit)
- Scripts automatically load `.env.local` if it exists

## Notes

- The `.env.local` file is in `.gitignore` so it won't be committed
- If `.env.local` doesn't exist, scripts fall back to environment variables
- This tests the exact same fetch mechanism used in production
