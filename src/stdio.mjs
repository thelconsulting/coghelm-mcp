#!/usr/bin/env node
// Local stdio transport: npx coghelm-mcp  (or node src/stdio.mjs)
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { buildServer } from "./server.mjs";
await buildServer().connect(new StdioServerTransport());
