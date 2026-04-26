# tester-army-mcp

An MCP (Model Context Protocol) server that exposes [TesterArmy](../README.md)'s UI testing capabilities — generate workflows, run them in Browserbase, get structured failure reports — to coding agents like Claude Code, Cursor, and Windsurf.

This server is an **alternative entry point** to the TesterArmy web app. It runs entirely locally as a standalone Node process; it does **not** require the Next.js app, Supabase, or any database. State lives in `~/.tester-army/state.json`.

## What you can do

The MCP exposes just two tools, mirroring the web app's **propose → review → run** flow:

| Tool | What it does |
|------|------|
| `propose_tests({ url, intent, count?, name? })` | Reuse-or-create a project for `url`, ask Claude to design a series of `count` distinct tests (default 3) covering the `intent`, persist them as drafts under a shared `suiteId`, and return them for the user to review and edit. |
| `run_tests({ suiteId, tests?, timeoutMsPerTest? })` | Execute every test in the approved suite, each in its own fresh Browserbase session. Returns per-test pass/fail, a durable `recordingUrl` (Browserbase session replay), and a structured `failure` report (`repro`, `cause`, `fix`) on failure. Pass `tests` to apply user edits before running. |

### Typical flow

1. Agent calls `propose_tests({ url: "https://example.com", intent: "verify the contact page works end to end" })`.
2. Agent surfaces the proposed `tests` array to the user. The user reviews and edits steps as desired.
3. Once the user approves, the agent calls `run_tests({ suiteId, tests: [...overrides] })` with any per-test edits.
4. Agent surfaces each result's `recordingUrl` plus, on failure, the structured `failure.{ repro, cause, fix }` report:
   - **(a) what + repro** — `failure.repro` (ordered reproduction steps).
   - **(b) cause** — `failure.cause` (concise explanation of why it failed).
   - **(c) fix** — `failure.fix` (concise explanation of how to fix it).

Every test gets its own Browserbase session, so each result has its own durable recording link. `liveViewUrl` is also returned but is short-lived and usually expired by the time the call returns — prefer `recordingUrl`.

## Requirements

- Node.js **20+**
- An [Anthropic API key](https://console.anthropic.com/) — `ANTHROPIC_API_KEY`
- A [Browserbase](https://www.browserbase.com/) account — `BROWSERBASE_API_KEY` and `BROWSERBASE_PROJECT_ID`

## Install (from this repo)

```bash
cd mcp
npm install
npm run build
```

This produces a single bundled file at `mcp/dist/index.js`.

> Once published to npm you'll be able to run it via `npx tester-army-mcp` instead.

## Hook it up to your coding agent

### Claude Code

```bash
claude mcp add tester-army -- node /absolute/path/to/lahacks26/mcp/dist/index.js
```

Then set the env vars in your shell or in `~/.config/claude/mcp.json`.

### Cursor / Windsurf

Add to your MCP config (e.g. `~/.cursor/mcp.json` or your IDE's equivalent):

```json
{
  "mcpServers": {
    "tester-army": {
      "command": "node",
      "args": ["/absolute/path/to/lahacks26/mcp/dist/index.js"],
      "env": {
        "ANTHROPIC_API_KEY": "sk-ant-...",
        "BROWSERBASE_API_KEY": "bb_...",
        "BROWSERBASE_PROJECT_ID": "..."
      }
    }
  }
}
```

## Try it

In your agent, say something like:

> Use tester-army to propose 3 tests covering the homepage of `https://example.com`. Show me the steps before you run anything.

The agent will call `propose_tests`, surface the suite for your review, wait for your approval/edits, then call `run_tests` and report each test's `recordingUrl` plus any structured `failure` report.

## Where state lives

```
~/.tester-army/
  state.json              # projects, tests, runs
  runs/<runId>/
    step-0.png            # screenshots, one per step
    step-1.png
    ...
```

You can override the location with the `TESTER_ARMY_STATE_DIR` env var.

To wipe everything: `rm -rf ~/.tester-army`.

## Known limitations (MVP)

- **No auth-gated tests.** If `propose_tests` produces an `auth` step in any test, that test will fail gracefully when `run_tests` reaches it (other tests in the suite continue). Use the Next.js dashboard for auth-gated flows, or edit the auth step out of the suite before approving.
- **Browserbase only.** Localhost/local-Chromium execution is not implemented in the MCP server.
- **No streaming.** `run_tests` blocks until every test in the suite reaches a terminal state and returns a single aggregate result. Default timeout: 5 minutes per test.
- **Local state only.** Tests created via the MCP server do not appear in the TesterArmy web dashboard, and vice versa. The two surfaces are independent at the data layer.
- **No multi-tenant auth.** Assumes a single trusted local user.

## Relationship to the web app

This MCP package lives inside the TesterArmy repo and **imports the same pure modules** the web app uses for prompt construction, action compilation, executor logic, and failure analysis (via a tsconfig path alias to `../src/lib/*`). Bug fixes in those modules benefit both surfaces automatically. The web app is otherwise untouched — it continues to read/write its own Supabase data and run via its own `engine.ts`.

## Development

```bash
npm run typecheck   # tsc --noEmit
npm run build       # bundle to dist/index.js via esbuild
npm start           # node dist/index.js (talks MCP over stdio)
```
