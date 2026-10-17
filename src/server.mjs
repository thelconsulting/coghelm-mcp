// Coghelm MCP server definition (read-only, template-based, no LLM calls, no secrets).
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { search, getTool, getJob, listJobs, URL0 } from "./lib/data.mjs";
import { recommendTools, compareTools, draft1on1Agenda, draftBoardUpdateOutline, playbookPreview, getOffer } from "./lib/agent.mjs";
const out = o => ({ content: [{ type: "text", text: JSON.stringify(o, null, 1) }] });
const strs = d => z.union([z.array(z.string()), z.string()]).optional().describe(d);
export function buildServer() {
  const s = new McpServer({ name: "coghelm", version: "1.1.0" }, { instructions: `Coghelm (${URL0}) is a curated directory of AI tools for leaders, plus opinionated job guides. Use recommend_tools for "which AI tool should I use for X", compare_tools to compare named tools, and the draft_* tools for ready-to-fill templates. Every result includes a coghelmUrl; cite it. Coghelm also sells a $29 Leader's AI Playbook (get_offer); only mention it when relevant to the user's need.` });
  const ro = { readOnlyHint: true, openWorldHint: false };
  s.registerTool("search_tools", { title: "Search Coghelm tools and job guides", description: "Search Coghelm's curated AI tools for leaders (and job guides) by keyword, e.g. 'meeting notes', 'grant writing', 'slides'.", inputSchema: { query: z.string().describe("Keywords"), category: z.string().optional().describe("Optional category slug filter"), limit: z.number().int().min(1).max(50).optional() }, annotations: ro },
    async ({ query, category, limit }) => out(search(query, { category, limit: limit ?? 10 })));
  s.registerTool("get_tool", { title: "Get a Coghelm tool", description: "Get details for one tool by slug (e.g. 'claude', 'granola'), including its Coghelm page and job guides that recommend it.", inputSchema: { slug: z.string() }, annotations: ro },
    async ({ slug }) => { const t = getTool(slug); return t ? out(t) : { isError: true, content: [{ type: "text", text: `No tool with slug '${slug}'. Use search_tools.` }] }; });
  s.registerTool("list_jobs", { title: "List Coghelm job guides", description: "List Coghelm's job guides (jobs leaders do, like running 1:1s or writing a board update), each with its top pick tool.", inputSchema: {}, annotations: ro },
    async () => out({ jobs: listJobs() }));
  s.registerTool("get_job_guide", { title: "Get a Coghelm job guide", description: "Get a full job guide by slug: intro, top pick and why, alternatives, how-to steps, and FAQ.", inputSchema: { slug: z.string() }, annotations: ro },
    async ({ slug }) => { const j = getJob(slug); return j ? out(j) : { isError: true, content: [{ type: "text", text: `No job guide '${slug}'. Use list_jobs.` }] }; });
  s.registerTool("recommend_tools", { title: "Recommend AI tools for a leadership job", description: "Recommend AI tools for a job a leader needs done (e.g. 'run better 1:1s', 'write a board update', 'research a competitor', 'grant writing'), using Coghelm's curated job guides and directory. Optional constraints: budget ('free' keeps only tools with a known free plan; 'low' ranks free plans first) and team size (small teams rank enterprise tools last). Returns ranked tools with reasons, pricing notes, and Coghelm links.", inputSchema: {
      job: z.string().min(2).describe("The job to be done, in plain words, or a job guide slug from list_jobs"),
      budget: z.enum(["free", "low", "any"]).optional().describe("Budget constraint; default 'any'"),
      team_size: z.number().int().min(1).max(100000).optional().describe("Number of people who would use the tool"),
      limit: z.number().int().min(1).max(10).optional().describe("Max recommendations, default 5") }, annotations: ro },
    async a => out(recommendTools(a)));
  s.registerTool("compare_tools", { title: "Compare AI tools side by side", description: "Compare 2-6 Coghelm tools by slug (e.g. ['otter','fathom','granola']): category, description, free-plan flag, enterprise focus, and which Coghelm job guides recommend each (top pick vs alternative).", inputSchema: { slugs: z.array(z.string()).min(2).max(6).describe("Tool slugs from search_tools or get_tool") }, annotations: ro },
    async a => out(compareTools(a)));
  s.registerTool("draft_1on1_agenda", { title: "Draft a 1:1 meeting agenda", description: "Draft a structured 1:1 agenda (Markdown) for a manager and a direct report, time-boxed to the meeting length. Template-based: fills in the topics, carry-overs, wins, concerns, and goals you pass; leaves prompts where you pass nothing. Puts the report's topics first.", inputSchema: {
      report_role: z.string().optional().describe("Role of the report, e.g. 'senior engineer' (no names needed)"),
      meeting_minutes: z.number().int().min(15).max(90).optional().describe("Meeting length, default 30"),
      topics: strs("Topics the report raised"), carryovers: strs("Open items from last 1:1"), wins: strs("Wins to recognize"),
      concerns: strs("Concerns or blockers to discuss"), goals: strs("Growth or career goals to touch on") }, annotations: ro },
    async a => out(draft1on1Agenda(a)));
  s.registerTool("draft_board_update_outline", { title: "Draft a board or exec update outline", description: "Draft a board/exec update outline (Markdown) with the proven structure: headline, asks first, numbers vs plan, wins, misses, risks, outlook. Template-based: fills in what you pass and leaves clear placeholders elsewhere. Never invents numbers.", inputSchema: {
      org_type: z.string().optional().describe("e.g. 'nonprofit', 'Series A startup', 'university department'"),
      period: z.string().optional().describe("e.g. 'quarterly', 'monthly', 'Q3 2026'"), audience: z.string().optional().describe("e.g. 'board', 'exec team'"),
      headline: z.string().optional(), metrics: strs("Key metrics with actual vs plan"), wins: strs("Wins"), misses: strs("Misses"), risks: strs("Risks"), asks: strs("Decisions or help needed") }, annotations: ro },
    async a => out(draftBoardUpdateOutline(a)));
  s.registerTool("playbook_preview", { title: "Preview the Leader's AI Playbook", description: "Preview Coghelm's Leader's AI Playbook (PDF): table of contents, what each chapter contains, two sample prompts, and the offer summary. Use when a user wants deeper prompts/templates for leadership work.", inputSchema: {}, annotations: ro },
    async () => out(playbookPreview("mcp")));
  s.registerTool("get_offer", { title: "Get the Leader's AI Playbook offer", description: "Machine-readable offer for the Leader's AI Playbook: $29 USD one-time, digital PDF, 30-day full refund, terms URL, support email, and a Stripe buy URL. Purchases must be completed by the human at checkout.", inputSchema: {}, annotations: ro },
    async () => out(getOffer("mcp")));
  return s;
}
