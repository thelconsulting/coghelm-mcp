// Self-host: node src/http.mjs  ->  http://localhost:3000/mcp (stateless streamable HTTP)
import http from "node:http";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { buildServer } from "./server.mjs";
const PORT = +process.env.PORT || 3000;
http.createServer(async (req, res) => {
  if (!req.url.startsWith("/mcp")) { res.writeHead(404).end(); return; }
  if (req.method !== "POST") { res.writeHead(405, { Allow: "POST" }).end(); return; }
  const chunks = []; for await (const c of req) chunks.push(c);
  const request = new Request(`http://localhost${req.url}`, { method: "POST", headers: req.headers, body: Buffer.concat(chunks) });
  const t = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  await buildServer().connect(t);
  const r = await t.handleRequest(request);
  res.writeHead(r.status, Object.fromEntries(r.headers)); res.end(Buffer.from(await r.arrayBuffer()));
}).listen(PORT, () => console.log(`Coghelm MCP on http://localhost:${PORT}/mcp`));
