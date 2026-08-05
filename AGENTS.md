# AGENTS.md — DocsDash

Guidance for AI agents and new contributors working in this repo. Read this before changing
collectors or dashboard shape.

## What this is

A React + Vite static dashboard for Couchbase documentation metrics. It aggregates Google
Analytics 4, Jira, Algolia search analytics, and Google Trends into a single JSON file at
build time, then renders it as a password-gated site on GitHub Pages. There is no runtime
backend in production.

### Which repository you are in — read this first

There are **two git repos on disk**, both pointing at `github.com/TimLFletcher/docsdash.git`:

| Path | Status |
|---|---|
| `C:\GitHub\DocsDash\DocsDash` | **The real repo.** Full history, clean tree, tracks everything. Work here. |
| `C:\GitHub\DocsDash` | A stale wrapper containing a single "Initial commit" from before most of the project existed. It also tracks *copies* of the project files, so it reports dozens of phantom modifications. |

Always confirm with `git rev-parse --show-toplevel` before any git operation — it must print
`C:/GitHub/DocsDash/DocsDash`. Committing or pushing from the outer repo would target the same
remote with a near-empty history. The outer repo is best deleted once someone confirms it holds
nothing unique; until then, leave it untouched.

## Architecture: two phases, one JSON file

**Phase 1 — build-time fetch.** `.github/workflows/fetch-and-deploy.yml` runs every 6 hours
(plus on push to `main` and manual dispatch):

1. `npm run fetch-data` → collectors run → writes `dashboard-data.json` to **both**
   `src/data/` and `public/data/`
2. Overwrites `src/config.js` with the `SITE_PASS` secret
3. `npm run build` → `dist/`
4. Deploys `dist/` via `peaceiris/actions-gh-pages`

**Phase 2 — runtime.** `src/App.jsx` does one cache-busted
`fetch('./data/dashboard-data.json')` and renders. No live API calls from the browser.

The consequence that matters: **`dashboard-data.json` is the entire contract between the
collectors and the UI.** Any change to a collector's return shape is a breaking change to the
frontend, and nothing currently validates that. See Planned Work #12.

## File map

| Path | Role |
|---|---|
| `scripts/fetch-data.js` | Orchestrator. Calls all four collectors, derives `insights`, writes the JSON. |
| `scripts/fetch-ga.js` | GA4 Data API. Page views (30d/90d), user metrics, traffic sources, per-doc-path and per-SDK-path breakdowns. |
| `scripts/fetch-jira.js` | Jira Cloud REST v3. Open issues, monthly opened/resolved, burn rate, resolution time, label breakdown. DOC and AV projects. |
| `scripts/fetch-algolia.js` | Algolia Analytics API. Top searches, no-result searches, counts, daily trend. |
| `scripts/fetch-trends.js` | `google-trends-api`. Interest-over-time and top/rising queries for 4 keyword categories. Falls back to mock data. |
| `scripts/insights-api.js` | OpenAI `gpt-4o` analyses (traffic, Jira, duplicate tickets). Doubles as the dev Express handler. |
| `server.js` | **Dev only.** Express on :3001 serving `POST /api/insights`. Vite proxies `/api` to it. Does not exist in production. |
| `src/App.jsx` | All routing, tab state, and layout. 7 tabs; DocsBot and GitHub are explicit placeholders. |
| `src/config.js` | Tracked file, overwritten in CI with the real password. Never commit a real value here. |
| `src/components/charts/` | ~20 Recharts components. Several are orphaned — see Known Dead Code. |

## Commands

```bash
npm install
```

```bash
npm run dev
```

```bash
npm run fetch-data
```

```bash
npm run server
```

`npm run dev` serves the UI on :5173 but needs `public/data/dashboard-data.json` to exist —
run `fetch-data` first, or the app shows its "Failed to Load Dashboard" state. `npm run server`
is only needed if you're working on the insights endpoint.

There is **no lint, formatter, or test suite** yet (Planned Work #14).

## Deploying and testing — the real loop

**The dashboard is tested on GitHub Pages, not locally.** The owner pushes, the workflow fetches
fresh data and deploys, and the deployed site is what gets looked at. Design accordingly: anything
only observable in a local dev console is effectively invisible.

Consequences worth internalising:

- **Pushing a feature branch deploys nothing.** The workflow triggers on `schedule`,
  `workflow_dispatch`, and `push` to **`main` only**. To see a branch on Pages without merging it,
  run the workflow manually against that ref:

```bash
gh workflow run "Fetch Data and Deploy" --ref your-branch-name
```

  `actions/checkout@v4` checks out the triggering ref, so the branch's code is what gets built and
  published.

- **Every deploy regenerates the data.** `npm run fetch-data` runs before `npm run build`, so you
  can never deploy new code against the old JSON snapshot — collector and UI changes always land
  together. A collector that starts failing changes the deployed dashboard even with no UI edit.
- **Make failures self-reporting in the UI.** The Actions log is a second place to look, so prefer
  surfacing collector state on the page itself (`CollectorErrorBanner`, `DataUnavailable`, the
  Trends `dataSource` field). A silent fallback is far worse here than in a locally-tested app.
- **The password gate behaves differently locally.** CI overwrites `src/config.js` with the real
  `SITE_PASS`; a local production build leaves `SITE_PASSWORD` as `''`. Don't infer anything about
  the deployed gate from `npm run preview`.
- **Pages must serve from the `gh-pages` branch.** The workflow publishes there via
  `peaceiris/actions-gh-pages`. The README's instruction to set the Pages source to "GitHub
  Actions" is wrong and would break the deploy — leave the Pages setting alone.
- **`vite.config.js` hardcodes `base: '/docsdash/'`.** Verify production builds under that path
  (`npm run preview` → `http://localhost:4173/docsdash/`), not at the root.

### What to check on Pages after a collector change

1. Top of any tab — is `CollectorErrorBanner` naming a source that should have worked?
2. SEO tab footer — does it report live data, or name fabricated categories?
3. Jira tab — the velocity chart is expected to be **absent** until the Agile API is wired up.
4. Analytics tab — SDK figures are host-filtered as of this batch, so they read lower than the
   pre-filter numbers. That is a correction, not a regression.

## Permissions

Granted by the repo owner on 2026-08-05, scoped to this repository:

- **Full permission to run git commands.** No need to ask before `status`, `diff`, `log`,
  `add`, `branch`, `checkout`, `stash`, `commit`, or similar.
- **Full permission to read and edit all files** in the repo. No need to ask per-file.

Reaffirmed on 2026-08-05: **`git push` is included — do not ask for it.** Routine repo work
should never generate a permission prompt.

A few practices still apply, as habits rather than gates:

- **Still confirm before history rewrites** (`reset --hard`, `push --force`, `rebase` onto a
  shared branch, `branch -D`). These can destroy work that isn't recoverable from the remote.
- **Work on a branch, not `main`,** for anything beyond a trivial edit.
- **Never prefix git with `cd`.** `cd <dir> && git ...` trips a hook-safety guard and prompts
  every time, no matter what's allowlisted. Use `git -C <dir> ...` instead. Same for any tool:
  prefer absolute paths over changing directory.
- **Never commit secrets or live data.** `.env.local`, a real value in `src/config.js`, and
  `src/data/dashboard-data.json` / `public/data/dashboard-data.json` stay out of git — see
  Secrets and credentials below. Check `git status` before staging rather than using `git add -A`
  blindly.
- **Don't run the destructive-cleanup family** (`git clean -fdx`, `checkout -- .` over
  uncommitted work) without checking what would be lost first. Note that `node_modules/`,
  `dist/`, and `.env.local` are all gitignored, so a broad clean would take out real
  credentials.

Sensible defaults elsewhere are unchanged: `npm run fetch-data` hits live GA/Jira/Algolia/OpenAI
APIs and costs real tokens on the OpenAI call, so don't run it in a loop.

## Secrets and credentials

- `.env.local` exists on disk with **real credentials**. It is gitignored. Do not read it, print
  it, echo it into logs, or commit it. Use `.env.local.example` as the reference for variable names.
- GitHub Actions supplies the same variables from repo secrets: `GA_PROPERTY_ID`,
  `GOOGLE_SERVICE_ACCOUNT_KEY`, `JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`,
  `JIRA_PROJECT_KEY`, `OPENAI_API_KEY`, `ALGOLIA_APP_ID`, `ALGOLIA_ANALYTICS_API_KEY`,
  `ALGOLIA_INDEX_NAME`, `SITE_PASS`.
- Both `src/data/dashboard-data.json` and `public/data/dashboard-data.json` are gitignored.
  Don't add them to git — they contain a live snapshot of internal metrics.
- The password gate is **client-side only**: `SITE_PASS` ships inside the JS bundle and is
  compared in the browser, and the data JSON is fetchable without it. Treat the dashboard as
  effectively public when deciding what data to add to it.

## Invariants — don't break these

1. **Every GA4 query must filter `hostName = docs.couchbase.com`.** Use the `docsPathFilter(path)`
   helper in `fetch-ga.js` for path-scoped reports rather than hand-rolling the `andGroup`. An
   unscoped query silently includes every other host in the property, making its numbers
   incomparable to the panel beside it — that was a real bug in the three SDK queries.
2. **Never disable TLS verification globally.** Because ES imports are hoisted, a module-scope
   `NODE_TLS_REJECT_UNAUTHORIZED = '0'` applies to *every* collector's requests, including the
   ones carrying the GA service-account key, Jira token, OpenAI key, and Algolia key.
   `fetch-trends.js` did exactly this; it now uses a scoped `https.Agent` passed as the
   per-request `agent` option. Do not reintroduce the global form.
3. **Collectors fail soft, individually.** Each returns `null` when credentials are absent or
   the API errors; `fetch-data.js` only hard-fails when all four return nothing. Preserve that.
   A new collector should never be able to break the whole run.
4. **Don't ship placeholder data as if it were real.** If a metric can't be fetched yet, omit it
   from the JSON (or emit an empty array) and let the UI hide the panel. Never hardcode a
   plausible-looking number: `velocityTrend`, `returningVisitors`, and `deviceBreakdown` all did
   this, and the velocity chart rendered five invented sprints as a real measurement for months.
   Prefer `—` over `0` for a missing value in the UI — zero asserts a measurement, a dash
   doesn't. `App.jsx` has an `UNAVAILABLE` const for this.
5. **Push shape changes through both writers.** `fetch-data.js` writes the JSON twice
   (`src/data/` and `public/data/`). Keep them identical.
6. **No browser-side API calls in production paths.** Anything needing a server belongs in the
   build-time fetch. `/api/insights` works in dev only, and the Regenerate button is broken in
   production because of it (Planned Work #9).

## Conventions

- ESM throughout (`"type": "module"`). Use `import`, and derive `__dirname` via
  `fileURLToPath(import.meta.url)` as the existing scripts do.
- Collectors export one async `fetchXData()` that returns a plain object or `null`. Keep all
  network access inside `scripts/`; components receive data as props only.
- Chart components are named exports wrapped in `ChartCard`, and take a single `data` prop.
- Tailwind utility classes inline; `primary-*` is the brand color from `tailwind.config.js`.
- Collector logging uses emoji prefixes (`📊` fetch start, `✅` success, `⚠️` soft failure,
  `❌` hard failure). Match it — the Actions log is the primary debugging surface.
- Trend values are percentage deltas vs. the prior period, formatted with `.toFixed(1)`.
  Durations are `m:ss` strings via the local `formatDuration` helper.

## Known dead code and traps

Do not build on these; they're slated for removal or completion:

- **AV Jira metrics** — 8 fields and ~6 extra API calls per run, never rendered. `MetricCard`
  documents an `avValue` prop for a dual display that was never built.
- **`openIssues`** (with priority breakdown) is fetched and never rendered. `JiraPriorityChart`,
  `SearchTermsChart`, and `SearchTermsTable` are orphaned files. `RegionalInterestChart` is
  imported in `App.jsx` but never used.
- **`generateInsights()`** in `fetch-data.js` always produces empty output: `contentGaps` filters
  on `!term.resultsFound`, but GA hardcodes `resultsFound: true`; `performanceNotes` reads
  `analytics.topPages`, which GA no longer returns (it returns `topPagesByPath`). Neither field
  is rendered anywhere. Algolia's `noResultSearches` is the real content-gap signal.
- **Debug queries** — the `DEBUG AV` and `DISCOVER` blocks in `fetch-jira.js` exist only to
  print to the console and cost two extra Jira calls per run.
- **`src/data/sample-data.json`** does not exist. The README still describes it as a fallback;
  the app now hard-fails on missing data instead.
- **`vite.config.js`** hardcodes `base: '/docsdash/'` for production. The Pages repo name must
  match.
- **`LLMInsights.jsx` nests a `<button>` inside a `<button>`** (the copy-to-clipboard control
  inside the section toggle), which React flags as invalid DOM nesting on every render. Harmless
  today but it's a real defect — the inner button's click only works because of
  `stopPropagation`. Fix by making the outer element a `div` with a click handler.
- **`dist/` exists on disk, is gitignored, and holds a stale build.** Don't read it to understand
  current behaviour — it predates recent source changes.

## Planned work

Ordered. Items 11–13 make further features cheap to add.

### Done — correctness and trust (branch `fix/correctness-batch-1`)

1. ~~**Remove the process-wide TLS bypass.**~~ `fetch-trends.js` now builds a scoped
   `https.Agent({ rejectUnauthorized: false })` and passes it as the per-request `agent` option
   to `interestOverTime` and `relatedQueries`. No global env mutation. See Invariant 2.
2. ~~**Stop rendering fabricated numbers.**~~ `velocityTrend` now returns `[]` (App.jsx hides
   `VelocityChart` and drops the grid to one column when empty); `returningVisitors` and
   `deviceBreakdown` are removed from the GA payload, each with a comment explaining why no
   placeholder was substituted. The real queries remain unwritten — see Remaining below.
3. ~~**Add the `hostName` filter to the three SDK queries.**~~ Replaced with a shared
   `docsPathFilter(path)` helper in `fetch-ga.js`, now used by all three.
4. ~~**Surface `data.errors` in the UI.**~~ New `src/components/DataStatus.jsx` exports
   `CollectorErrorBanner` (listed at the top of every tab; supplements `data.errors` with derived
   entries for null `trends`/`algolia`) and `DataUnavailable` (full-panel empty state on the
   Analytics and Jira tabs). Insights-tab metric cards render `UNAVAILABLE` (`—`) with no trend
   badge when their source is missing.

Also folded in: the duplicate `topLabels` key in `App.jsx`'s `DEFAULT_JIRA` and the duplicate
`avgResolutionDays` key in `fetch-jira.js`'s return object. The production build is now free of
esbuild warnings.

**Not yet verified against live APIs.** These changes were validated with `npm run build`,
`node --check`, and a browser pass against a doctored fixture (sources nulled, velocity emptied).
`npm run fetch-data` has not been run, so the Trends scoped-agent path is unproven against the
real endpoint, and the SDK numbers will shift once the host filter takes effect. The deployed
dashboard keeps showing the fake velocity chart until the next successful fetch.

### Remaining

5. **Write the deferred GA/Jira queries** that items 2 removed placeholders for: sprint velocity
   via `/rest/agile/1.0`, `returningVisitors` via a newVsReturning query, `deviceBreakdown` via
   `deviceCategory`. Optional — the UI degrades cleanly without them.
6. **Decide what the password gate is.** Accept it as a speed bump, or move to real auth
   (Cloudflare Access in front of Pages, or a private repo with org-restricted Pages). Decide
   before adding more data sources, since each one raises the stakes.

### Fix soon

7. **Make Algolia dates rolling.** All four functions hardcode `2025-12-27`→`2026-01-25`
   (`fetch-algolia.js:69` et al), so the Search tab has shown January data for months.
8. **Fix the SEO tab.** Remove the unconditional "Sample Data Display" banner — or make it
   conditional on actually being mock data — and guard `trends.categories.*`, which currently
   throws if `categories` is missing.
9. **Rebuild content-gap detection on Algolia `noResultSearches`,** or delete
   `generateInsights()`. See Known Dead Code.
10. **Hide or re-home the Regenerate button.** `LLMInsights.jsx:29` POSTs to `/api/insights`,
    which 404s in production. Fix the nested-`<button>` DOM warning in the same pass.
11. **Fix the Jira `.env.local` path.** `fetch-jira.js:31` loads `scripts/.env.local` instead of
    `../.env.local`; it only works because `fetch-ga.js` imports first and loads the file as a
    side effect.

### Cleanup (fold into whichever batch touches the file)

- Delete the AV metrics, or finish the dual display.
- Render `openIssues`, or drop the query and the orphaned chart components.
- Remove the `DEBUG AV` / `DISCOVER` Jira queries.
- Rewrite the README: it documents a removed `sample-data.json` fallback, omits Algolia and
  Trends entirely, and its component table doesn't match the tree.
- Consider deleting the stale outer repo at `C:\GitHub\DocsDash` once confirmed redundant.

### Foundation before more features

12. **Extract a GA `runReport` helper.** `fetch-ga.js` is still ~80% repeated `dimensionFilter`
    boilerplate with the host filter hand-rolled nine times. `docsPathFilter()` (added in item 3)
    is the first step; finish the job with a helper taking `{dimensions, metrics, path,
    dateRange}` so "add a path or metric" becomes a one-liner.
13. **Define the data contract once.** `App.jsx`'s `DEFAULT_ANALYTICS` / `DEFAULT_JIRA` are a
    hand-maintained mirror of the collector output and have already drifted (`topPages`,
    `searchTerms`, `openIssues` declared but unused; `sdkComparison` used but undeclared). Move
    to a shared schema module and add a validation step at the end of `fetch-data.js` that
    fails the build on shape mismatch.
14. **Add ESLint and a PR CI check.** No lint, formatter, or tests today, and the only workflow
    both fetches and deploys. Minimum: an ESLint job plus a `fetch-data` schema smoke test that
    runs on PRs without deploying.
