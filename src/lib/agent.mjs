// Template-based agent helpers (no LLM calls). Shared by the MCP server and REST API.
import D from "../../data/tools.json" with { type: "json" };
import J from "../../data/jobs.json" with { type: "json" };
import { toolOut, getJob, search, URL0 } from "./data.mjs";
const tool = s => D.tools.find(t => t.slug === s);
export const BUY = "https://buy.stripe.com/cNiaEX6PHesefN35Yrasg00";
// Stripe Payment Links accept client_reference_id (stored on the Checkout Session) and utm_* params (passed to the redirect URL).
export const buyUrl = (channel = "api") => { const c = String(channel).toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 40) || "api";
  return `${BUY}?client_reference_id=coghelm_agent_${c}&utm_source=coghelm&utm_medium=agent&utm_campaign=${c}`; };
// Tools with a well-known free plan or free tier (curated; vendors change plans, so always verify).
export const FREE = new Set("chatgpt claude gemini perplexity notebooklm grok microsoft-copilot otter fireflies fathom granola tldv read-ai fellow notion asana clickup linear miro canva gamma grammarly wordtune deepl zapier elicit consensus semantic-scholar researchrabbit krisp reclaim shortwave coda monday descript riverside adobe-podcast suno udio elevenlabs replit v0 bolt lovable github-copilot cursor julius pitch prezi rows hex auphonic moises".split(" "));
// Tools mainly sold to larger organizations (sales-led / enterprise pricing).
export const ENTERPRISE = new Set("hirevue paradox writer loopio tableau ashby gem metaview brighthire textio instrumentl jasper avoma".split(" "));
const priceNote = s => FREE.has(s) ? "Has a free plan or free tier (verify on vendor site)." : ENTERPRISE.has(s) ? "Mainly sold to larger organizations; expect sales-led pricing." : "Paid, usually with a trial (verify on vendor site).";
const withMeta = (s, why) => ({ ...toolOut(tool(s)), freePlan: FREE.has(s), enterpriseFocused: ENTERPRISE.has(s), pricingNote: priceNote(s), ...(why ? { why } : {}) });

export function recommendTools({ job, budget = "any", team_size, limit = 5 }) {
  const q = String(job || "").trim();
  const STOP = new Set("a an the for to of and or my our with in on how do i we best ai tool tools write writing run running make making use".split(" "));
  const words = q.toLowerCase().replace(/[^a-z0-9: -]/g, " ").split(/\s+/).filter(w => w.length > 2 && !STOP.has(w));
  const overlap = j => { const t = `${j.slug} ${j.title} ${j.short}`.toLowerCase(); return words.filter(w => t.includes(w) || t.includes(w.replace(/s$/, ""))).length; };
  const g = J.find(j => j.slug === q) || J.map(j => [overlap(j), j]).filter(x => x[0] > 0).sort((a, b) => b[0] - a[0])[0]?.[1] || J.map(j => [search(q, { type: "jobs", limit: 10 }).jobs.findIndex(x => x.slug === j.slug), j]).filter(x => x[0] >= 0).sort((a, b) => a[0] - b[0])[0]?.[1];
  let cands = g ? [[g.top, `Coghelm top pick for ${g.short.toLowerCase()}: ${g.topWhy}`], ...g.alts.map(s => [s, `Alternative in the Coghelm guide '${g.title}'.`])] : [];
  for (const t of search(q, { type: "tools", limit: 20 }).tools) if (!cands.some(c => c[0] === t.slug)) cands.push([t.slug, `Matches '${q}' in the Coghelm directory.`]);
  if (!cands.length) for (const w of words) for (const t of search(w, { type: "tools", limit: 5 }).tools) if (!cands.some(c => c[0] === t.slug)) cands.push([t.slug, `Matches '${w}'.`]);
  const notes = [];
  if (budget === "free") { const before = cands.length; cands = cands.filter(c => FREE.has(c[0])); if (cands.length < before) notes.push("Removed tools without a known free plan."); }
  const n = +team_size || 0;
  if (n && n <= 10) { cands.sort((a, b) => ENTERPRISE.has(a[0]) - ENTERPRISE.has(b[0])); notes.push("Small team: enterprise-focused tools ranked last."); }
  if (budget === "low") cands.sort((a, b) => FREE.has(b[0]) - FREE.has(a[0]));
  const recs = cands.slice(0, Math.max(1, Math.min(+limit || 5, 10))).map(([s, why]) => withMeta(s, why));
  return { job: q, matchedGuide: g ? { slug: g.slug, title: g.title, coghelmUrl: `${URL0}/jobs/${g.slug}/`, howTo: g.how } : null,
    constraints: { budget, team_size: n || undefined }, recommendations: recs, notes,
    disclaimer: "Pricing flags are curated by Coghelm and can go stale; confirm on each vendor's site.",
    ...(recs.length ? {} : { hint: `No match. Try list_jobs or search_tools, or see ${URL0}/` }) };
}
export function compareTools({ slugs }) {
  const found = [], missing = [];
  for (const s of slugs) tool(s) ? found.push(s) : missing.push(s);
  return { compared: found.map(s => ({ ...withMeta(s), recommendedIn: J.filter(j => j.top === s || j.alts.includes(s)).map(j => ({ guide: j.title, role: j.top === s ? "top pick" : "alternative", coghelmUrl: `${URL0}/jobs/${j.slug}/` })) })),
    sameCategory: new Set(found.map(s => tool(s).category)).size === 1, missing, ...(missing.length ? { hint: "Unknown slugs; use search_tools to find the right slug." } : {}) };
}
const list = a => (Array.isArray(a) ? a : a ? String(a).split(/\n|;/) : []).map(x => String(x).trim()).filter(Boolean);
export function draft1on1Agenda({ report_role, meeting_minutes = 30, carryovers, topics, wins, concerns, goals } = {}) {
  const m = Math.max(15, Math.min(+meeting_minutes || 30, 90)), u = t => Math.max(2, Math.round(m * t));
  const sec = [
    [`Their topics first (${u(.35)} min)`, ["Ask: what's top of mind for you this week?", ...list(topics).map(t => `They flagged: ${t}`)]],
    [`Follow-ups from last time (${u(.15)} min)`, list(carryovers).length ? list(carryovers) : ["Review commitments both of you made last 1:1."]],
    [`Wins and recognition (${u(.1)} min)`, list(wins).length ? list(wins).map(w => `Recognize: ${w}`) : ["Name one specific thing that went well."]],
    [`Blockers and support (${u(.15)} min)`, list(concerns).length ? list(concerns).map(c => `Discuss: ${c} (ask, don't diagnose)`) : ["Ask: what's slowing you down, and what can I unblock?"]],
    [`Growth and goals (${u(.15)} min)`, list(goals).length ? list(goals) : ["Pick one growth topic: skills, scope, career direction, or feedback in both directions."]],
    [`Commitments (${u(.1)} min)`, ["Each of you names next steps with an owner and date.", "Agree what goes on next week's agenda."]],
  ];
  const md = `# 1:1 agenda${report_role ? ` with ${report_role}` : ""} (${m} min)\n\n` + sec.map(([h, b]) => `## ${h}\n${b.map(x => `- ${x}`).join("\n")}`).join("\n\n") +
    `\n\n---\nTips: share the agenda ahead so they can add items; ask consent before recording; skip AI capture for sensitive topics (pay, health, conflict).`;
  return { agenda_markdown: md, guide: `${URL0}/jobs/running-1-1s/`, related_tools: ["granola", "fellow", "fathom", "claude"].map(s => withMeta(s)), more: "Full prompts and templates for 1:1s are in the Leader's AI Playbook (see get_offer)." };
}
export function draftBoardUpdateOutline({ org_type, period = "quarterly", audience = "board", headline, metrics, wins, misses, risks, asks } = {}) {
  const ph = (a, d) => (list(a).length ? list(a) : [d]).map(x => `- ${x}`).join("\n");
  const md = `# ${String(period).replace(/^./, c => c.toUpperCase())} update to the ${audience}${org_type ? ` (${org_type})` : ""}\n\n` +
    `## 1. Headline\n- ${headline || "[One sentence: the single most important thing they should know.]"}\n\n` +
    `## 2. Asks and decisions needed\n${ph(asks, "[What you need from them, with a decision date. Put this near the top.]")}\n\n` +
    `## 3. Numbers vs. plan\n${ph(metrics, "[3-5 key metrics: actual vs. plan vs. last period. Don't round or estimate.]")}\n\n` +
    `## 4. Wins\n${ph(wins, "[2-3 wins tied to strategy, with evidence.]")}\n\n` +
    `## 5. Misses and what we're changing\n${ph(misses, "[Be direct about misses and the fix.]")}\n\n` +
    `## 6. Risks\n${ph(risks, "[Top risks with likelihood, impact, and mitigation owner.]")}\n\n` +
    `## 7. Looking ahead\n- [Priorities for next period and what would change the plan.]\n\n---\nTips: lead with bad news and asks; use only real figures; have someone (or an AI assistant) play the skeptical board member before sending.`;
  return { outline_markdown: md, guide: `${URL0}/jobs/writing-a-board-update/`, related_tools: ["claude", "chatgpt", "gamma", "notebooklm"].map(s => withMeta(s)), more: "The Leader's AI Playbook has a full board-update chapter with prompts (see get_offer)." };
}
export const TOC = ["How to use AI as a leader", "1. Running 1:1s", "2. Hiring an engineer", "3. Writing a board or exec update", "4. Planning a quarter or OKRs", "5. Running better meetings", "6. Giving feedback and performance reviews", "7. Onboarding a new hire", "8. Researching a market or competitor", "9. Making a strategy deck", "10. Managing your inbox and calendar", "Your 30-day adoption plan", "Appendix A: Tool index", "Appendix B: Prompt patterns cheat sheet"];
export function getOffer(channel = "api") {
  return { "@context": "https://schema.org", "@type": "Product", name: "The Leader's AI Playbook", sku: "leaders-ai-playbook-v1",
    description: "A 37-page PDF for leaders: 10 jobs, 40 copy-paste prompts, templates, and a 30-day AI adoption plan.",
    brand: { "@type": "Brand", name: "Coghelm" }, url: `${URL0}/playbook/`,
    offers: { "@type": "Offer", price: "29.00", priceCurrency: "USD", availability: "https://schema.org/InStock", url: buyUrl(channel),
      seller: { "@type": "Organization", name: "Thel Consulting" },
      hasMerchantReturnPolicy: { "@type": "MerchantReturnPolicy", returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow", merchantReturnDays: 30, returnFees: "https://schema.org/FreeReturn", refundType: "https://schema.org/FullRefund", url: `${URL0}/terms/#refunds` } },
    summary: { price: 29, currency: "USD", billing: "one-time payment", format: "digital PDF (37 pages, v1.0, October 2026), instant download after checkout",
      refund: "30-day no-questions-asked full refund", termsUrl: `${URL0}/terms/`, supportEmail: "ai@thelconsulting.com", salesPage: `${URL0}/playbook/`, buyUrl: buyUrl(channel), checkout: "Stripe" },
    agentNote: "Share buyUrl with the human; purchases require the human to complete Stripe checkout. Do not attempt to purchase autonomously." };
}
export function playbookPreview(channel = "api") {
  return { title: "The Leader's AI Playbook", tableOfContents: TOC,
    eachChapter: ["Outcome: what 'done well' looks like", "Tool stack: one main pick plus alternatives", "Workflow steps with human parts marked", "3-5 copy-paste prompts", "A plain-text template", "Common mistakes and fixes"],
    samplePrompts: [
      { chapter: "1. Running 1:1s", title: "Turn rough notes into a clean summary", prompt: "I'm a manager. Below are my rough notes from a 1:1 with [REPORT ROLE, no name needed].\nTurn them into a short summary with three sections:\n1) What we discussed (one line per topic)\n2) Commitments: mine and theirs, each with an owner and a date if I gave one\n3) Open questions to raise next time\nRules: Use only what is in my notes. Do not invent dates, owners, or details.\nIf an owner or date is unclear, mark it \"[unclear]\" instead of guessing.\nKeep it under 200 words, plain language.\nNOTES:\n[PASTE NOTES]" },
      { chapter: "3. Writing a board or exec update", title: "The skeptical board member", prompt: "Act as an experienced, skeptical board member reading this update.\nList the three questions you would most likely ask, the weakest claim in the\nupdate, and anything that sounds like spin. Be blunt. Then tell me what\ninformation would answer each question. Don't make up the answers.\n[PASTE DRAFT]" }],
    offer: getOffer(channel).summary };
}
