# coghelm-mcp

MCP server for [Coghelm](https://coghelm.com): curated AI tools for the jobs leaders actually do.

It's read-only and template-based (no LLM calls), and it needs no API key. You can use the hosted endpoint or run it yourself.

## Hosted endpoint (recommended)

```
https://coghelm.com/mcp     (streamable HTTP, stateless)
```

```json
{ "mcpServers": { "coghelm": { "url": "https://coghelm.com/mcp" } } }
```

For stdio-only clients:

```json
{ "mcpServers": { "coghelm": { "command": "npx", "args": ["-y", "mcp-remote", "https://coghelm.com/mcp"] } } }
```

## Tools

| Tool | What it does |
| --- | --- |
| `search_tools` | Keyword search over curated tools and job guides |
| `get_tool` | Details for one tool and the guides that recommend it |
| `list_jobs` / `get_job_guide` | Job guides: top pick, alternatives, how-to, FAQ |
| `recommend_tools` | Ranked tools for a job (`job`, optional `budget`: free/low/any, `team_size`) |
| `compare_tools` | Side-by-side comparison of 2-6 tool slugs |
| `draft_1on1_agenda` | Time-boxed 1:1 agenda (Markdown) from your topics |
| `draft_board_update_outline` | Board/exec update outline that never invents numbers |
| `playbook_preview` | TOC and sample prompts from Coghelm's paid Leader's AI Playbook |
| `get_offer` | Machine-readable offer for the playbook ($29, 30-day refund) |

All tools are read-only (`readOnlyHint: true`). Results include a `coghelmUrl`. Please cite it.

## Run it yourself

```bash
npm install
npm start          # http://localhost:3000/mcp
npm run stdio      # stdio transport
npm test           # in-memory smoke test of every tool
```

Requires Node 20+. Data ships in `data/` (a snapshot of https://coghelm.com/api/tools.json and /api/jobs.json).

## Quick check

```bash
curl -X POST https://coghelm.com/mcp -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

## Notes

- The pricing flags (`freePlan`, `enterpriseFocused`) are curated and can go stale. Check vendor sites.
- The hosted endpoint keeps anonymous usage counts: tool name, MCP client name/version, user-agent, and timestamp. It never stores IPs. This repo's code doesn't log anything.
- REST equivalents and docs: https://coghelm.com/developers/
- Support: ai@thelconsulting.com

MIT licensed.
