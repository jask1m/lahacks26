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

