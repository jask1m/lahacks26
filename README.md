## Summary
Making UI testing easy.
  
Define reusable test flows, watch agents execute them, and inspect exactly where a run passed or failed.

The core idea is to combine the speed and flexibility of automated AI testing with the reliability and visibility of a structured testing framework.

## Problem We Solve
Existing UI testing tools are either too manual and brittle or too opaque when AI agents are involved.

Teams want to test real user UI workflows without writing every test entirely in code and without blindly trusting an autonomous black-box agent.

## Workflow
Add a URL, create UI test workflows in a visual interface or from natural language, and run those workflows through an agent-backed browser session.

The system shows the exact flow, execution progress, and failure points so tests are reusable, debuggable, and understandable. There are many cusotmizable options such as branching workflows, reusable test templates, and execution modes.

## Dev Setup

First, add API keys to .local.env located in root dir
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
ANTHROPIC_API_KEY=
BROWSERBASE_API_KEY=
BROWSERBASE_PROJECT_ID=
```
Then download packages and run app
```
npm i
npm run dev
```

## MCP Server (use TesterArmy from your coding agent)

In addition to the web app, TesterArmy ships an [MCP](https://modelcontextprotocol.io/) server (`mcp/`) that exposes the same UI-testing capabilities to coding agents like Claude Code, Cursor, and Windsurf. It runs locally as a standalone Node process — no Next.js, Supabase, or DB required (state lives in `~/.tester-army/`).

### How it works
The server exposes two tools that mirror the web app's **propose → review → run** flow:

- `propose_tests({ url, intent, count?, name? })` — generates a suite of distinct draft tests for the given URL and intent, persisted under a shared `suiteId`. The agent renders the steps to you and invites edits.
- `run_tests({ suiteId, tests?, timeoutMsPerTest? })` — runs every test in the suite in its own fresh Browserbase session. Returns per-test pass/fail, a durable `recordingUrl` (session replay), and on failure a structured `{ repro, cause, fix }` report. Pass `tests` to apply your edits before running.

The host application's approval prompt on `run_tests` is the single confirmation gate — you can reply with edits before approving, or say "run it as-is."

### Add it to an agent
Build the server once:
```
cd mcp
npm i
npm run build
```

Then register it. **Claude Code:**
```
claude mcp add tester-army -- node /absolute/path/to/lahacks26/mcp/dist/index.js
```

**Cursor / Windsurf** (add to `~/.cursor/mcp.json` or your IDE's equivalent):
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

Then in your agent: *"Use tester-army to propose 3 tests covering the homepage of https://example.com."* See `mcp/README.md` for full details, limitations, and state layout.
