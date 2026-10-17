# MCP registry submission checklist (prepared 2026-10-15; nothing submitted)

Pre-req for all: create the public GitHub repo `coghelm-mcp` from a **fresh `git init` of this folder only** (no history from the private repo). Run the secrets scan again before the first push.

## 1. Official MCP Registry: https://registry.modelcontextprotocol.io
- Docs: https://github.com/modelcontextprotocol/registry/tree/main/docs/modelcontextprotocol-io (quickstart.mdx, remote-servers.mdx, authentication.mdx). Checked 2026-10-15. Still in preview.
- File: `server.json` (validated against https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json). Remote-only, so no npm package is needed. `description` must be 100 characters or fewer (currently 95).
- Name `com.coghelm/coghelm` needs **domain auth** (pick one):
  - HTTP: `openssl genpkey -algorithm Ed25519 -out key.pem`, generate the `mcp-registry-auth` file, host it at `https://coghelm.com/.well-known/mcp-registry-auth`, then run `mcp-publisher login http --domain coghelm.com --private-key <hex>`.
  - DNS: add a TXT record on the apex `coghelm.com`, then run `mcp-publisher login dns ...`.
  - Alternative: GitHub auth with name `io.github.<user>/coghelm`.
- Publish: install `mcp-publisher` (GitHub releases), then run `mcp-publisher publish`. Each remote URL can be used by only one server name.
- Keep `key.pem` out of every repo (it's in .gitignore).

## 2. Smithery: https://smithery.ai
- Docs: https://smithery.ai/docs/build/publish. Checked 2026-10-15. (`/new` returns 404 to curl; it's a JS app route behind login.)
- URL publishing: requires a Smithery account. Go to smithery.ai/new, enter `https://coghelm.com/mcp`, and finish the flow. It needs streamable HTTP (we have it). It's public, so the scan is automatic.
- Scanner UA is `SmitheryBot/1.0`. Netlify doesn't block it. Optional: serve a static `/.well-known/mcp/server-card.json`.
- CLI alternative: `smithery mcp publish "https://coghelm.com/mcp" -n @<org>/coghelm`.

## 3. Glama: https://glama.ai/mcp/servers
- Docs: https://glama.ai/mcp/faq and https://glama.ai/blog/2025-07-08-what-is-glamajson. Add page: https://glama.ai/mcp/servers/add (200).
- Requires GitHub OAuth. The submitter needs write/admin access on the public repo. Provide the repo URL, name, and description.
- An org-owned repo needs `glama.json` with `maintainers` (template is here; fill in the GitHub username). Glama runs license/security/health checks, so the LICENSE file is included.
- Remote "Connector" listing is separate: https://glama.ai/mcp/connectors. Needs an HTTPS streamable-http URL plus domain verification (TXT `_glama-claim.coghelm.com` or a /.well-known file).
- Glama also re-ingests the official registry automatically.

## 4. mcp.so: https://mcp.so/submit
- Form: GitHub repository URL (required) and name. Free submission goes through review. The paid option is $39 (featured/dofollow), so **don't pay** unless approved. Support tickets go through the site.
- Probably requires sign-in to submit.

## 5. PulseMCP: https://www.pulsemcp.com/submit
- **Submissions paused** (page last updated September 3, 2026). PulseMCP says to publish to the Official MCP Registry, which it ingests automatically once it reopens. Action: do #1.
