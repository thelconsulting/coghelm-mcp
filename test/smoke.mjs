import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { buildServer } from "../src/server.mjs";
const [a, b] = InMemoryTransport.createLinkedPair();
await buildServer().connect(a); const c = new Client({ name: "smoke", version: "1" }); await c.connect(b);
const { tools } = await c.listTools(); console.log(tools.map(t => t.name).join(", "));
for (const [n, args] of [["recommend_tools", { job: "board update", budget: "free" }], ["compare_tools", { slugs: ["otter", "fathom"] }], ["draft_1on1_agenda", {}], ["draft_board_update_outline", {}], ["playbook_preview", {}], ["get_offer", {}]]) {
  const r = await c.callTool({ name: n, arguments: args }); if (r.isError) throw new Error(n); console.log("ok", n);
}
process.exit(0);
