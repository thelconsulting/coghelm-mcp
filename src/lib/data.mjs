import D from "../../data/tools.json" with { type: "json" };
import J from "../../data/jobs.json" with { type: "json" };
export const site = D.site, URL0 = D.site.url;
const cat = s => D.categories.find(c => c.slug === s);
const tool = s => D.tools.find(t => t.slug === s);
export const toolOut = t => ({ name: t.name, slug: t.slug, url: t.url, category: t.category, categoryName: cat(t.category)?.name, description: t.desc, added: t.added, coghelmUrl: `${URL0}/tools/${t.slug}/` });
export const jobSummary = j => ({ slug: j.slug, title: j.title, topPick: tool(j.top).name, coghelmUrl: `${URL0}/jobs/${j.slug}/` });
export const jobOut = j => ({ slug: j.slug, title: j.title, coghelmUrl: `${URL0}/jobs/${j.slug}/`, intro: j.intro,
  topPick: { ...toolOut(tool(j.top)), why: j.topWhy }, alternatives: j.alts.map(s => toolOut(tool(s))),
  howTo: j.how, faq: j.faq.map(([question, answer]) => ({ question, answer })) });
export const getTool = s => { const t = tool(s); return t && { ...toolOut(t), jobGuides: J.filter(j => j.top === s || j.alts.includes(s)).map(jobSummary) }; };
export const getJob = s => { const j = J.find(x => x.slug === s); return j && jobOut(j); };
export const listJobs = () => J.map(jobSummary);
export function search(q = "", { type = "all", category, limit = 20 } = {}) {
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  const score = txt => { txt = txt.toLowerCase(); let s = 0; for (const w of terms) { if (!txt.includes(w)) return 0; s += txt.split(w).length - 1; } return s || (terms.length ? 0 : 1); };
  limit = Math.max(1, Math.min(+limit || 20, 100));
  const tools = type === "jobs" ? [] : D.tools.filter(t => !category || t.category === category)
    .map(t => [score(`${t.name} ${t.name} ${t.slug} ${t.desc} ${cat(t.category)?.name}`), t]).filter(x => x[0] > 0).sort((a, b) => b[0] - a[0]).slice(0, limit).map(x => toolOut(x[1]));
  const jobs = type === "tools" ? [] : J.map(j => [score(`${j.title} ${j.title} ${j.short} ${j.intro} ${j.how.join(" ")} ${[j.top, ...j.alts].map(s => tool(s).name).join(" ")}`), j])
    .filter(x => x[0] > 0).sort((a, b) => b[0] - a[0]).slice(0, limit).map(x => jobSummary(x[1]));
  return { query: q, tools, jobs };
}
export const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Accept, Authorization, Mcp-Session-Id, Mcp-Protocol-Version, Last-Event-ID", "Access-Control-Expose-Headers": "Mcp-Session-Id, Mcp-Protocol-Version" };
export const json = (body, status = 200) => new Response(JSON.stringify(body, null, 1), { status, headers: { ...CORS, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=300" } });
