// Generates a self-contained Leadboard HTML from the DB — your one-click work queue.
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { all } from "./store.ts";
import { DATA_DIR } from "./store.ts";
import type { DB } from "./types.ts";

export function buildDashboard(db: DB): string {
  const rows = all(db)
    .filter((o) => (o.fitScore ?? 0) > 0)
    .sort((a, b) => (b.fitScore ?? 0) - (a.fitScore ?? 0));

  const payload = rows.map((o) => ({
    id: o.id, company: o.company, role: o.role, url: o.url, source: o.source,
    location: o.location || "", remote: !!o.remote, comp: o.comp || "",
    fit: o.fitScore ?? 0, lead: o.leadProject || "", hook: o.hook || "",
    gaps: o.gaps || [], stack: o.stack || [], status: o.status,
    letter: o.letter || "", opener: o.opener || "",
    contact: o.contact || "", contactEmail: o.contactEmail || "", contactNote: o.contactNote || "",
  }));

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Jobhunt Leadboard — ${rows.length} roles</title>
<style>
:root{--ink:#071111;--cream:#f4ecdd;--copper:#bc7740;--amber:#f5ba77;--sky:#8ac3df;--line:#22332f}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--ink);color:var(--cream);font:14px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;padding:22px}
h1{font:600 24px/1.1 "Cormorant Garamond",Georgia,serif;color:var(--amber)}
.sub{color:#9fb0ab;font-size:12px;margin:4px 0 16px}
.bar{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:16px;position:sticky;top:0;background:var(--ink);padding:8px 0;z-index:5;border-bottom:1px solid var(--line)}
input,select{background:#0d1a18;color:var(--cream);border:1px solid var(--line);border-radius:7px;padding:7px 10px;font-size:13px}
input[type=range]{padding:0}
.card{border:1px solid var(--line);border-radius:11px;padding:14px 16px;margin-bottom:11px;background:#0a1614}
.head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}
.co{font:600 17px/1.2 "Cormorant Garamond",Georgia,serif;color:var(--cream)}
.role{color:var(--amber);font-size:13px;margin-top:1px}
.fit{font:700 20px/1 "Cormorant Garamond",serif;border-radius:8px;padding:6px 10px;min-width:48px;text-align:center}
.meta{color:#9fb0ab;font-size:12px;margin:7px 0}
.hook{color:#cdbfa6;font-size:12.5px;font-style:italic;margin:6px 0;border-left:2px solid var(--copper);padding-left:9px}
.tags{display:flex;gap:5px;flex-wrap:wrap;margin:7px 0}
.tag{background:#13241f;border:1px solid var(--line);color:#9fc7bd;font-size:10.5px;border-radius:20px;padding:2px 9px}
.gap{background:#2a1c10;border-color:#5a3c1e;color:var(--amber)}
.lead{color:var(--sky);font-size:11.5px;margin:4px 0}
.actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;align-items:center}
button,a.btn{background:var(--copper);color:#1a0f04;border:none;border-radius:7px;padding:7px 13px;font-size:12px;font-weight:600;cursor:pointer;text-decoration:none;display:inline-block}
a.btn.ghost,button.ghost{background:transparent;border:1px solid var(--copper);color:var(--amber)}
.src{font-size:10.5px;color:#6f817c;text-transform:uppercase;letter-spacing:.5px}
.count{color:#9fb0ab;font-size:12px;margin-left:auto}
</style></head><body>
<h1>Jobhunt Leadboard</h1>
<div class="sub">${rows.length} roles · generated ${new Date().toLocaleString()} · sorted by fit · the machine found them; you press send. Status is saved in this browser.</div>
<div class="bar">
  <input id="q" placeholder="search company / role / stack…" style="flex:1;min-width:200px">
  <label style="font-size:12px;color:#9fb0ab">min fit <b id="mv">60</b></label>
  <input type="range" id="min" min="0" max="100" value="60">
  <select id="src"><option value="">all sources</option></select>
  <select id="st"><option value="">all status</option><option>sourced</option><option>drafted</option><option>applied</option><option>sent</option><option>replied</option><option>screen</option><option>interview</option><option>offer</option><option>closed</option></select>
  <span class="count" id="cnt"></span>
</div>
<div id="list"></div>
<script>
const DATA = ${JSON.stringify(payload)};
const LS = "jobhunt-status";
const saved = JSON.parse(localStorage.getItem(LS) || "{}");
DATA.forEach(d => { if (saved[d.id]) d.status = saved[d.id]; });
const fitColor = f => f>=80?"background:#1d3a2a;color:#7fe0a8":f>=65?"background:#33361a;color:#e0d57f":f>=50?"background:#3a2a1a;color:#f5ba77":"background:#2a1414;color:#e08a8a";
const el = document.getElementById.bind(document);
const srcSel = el("src"); [...new Set(DATA.map(d=>d.source))].sort().forEach(s=>{const o=document.createElement("option");o.value=s;o.textContent=s;srcSel.appendChild(o);});
function setStatus(id,v){saved[id]=v;localStorage.setItem(LS,JSON.stringify(saved));}
function copyField(id,field,btn){const r=DATA.find(x=>x.id===id);if(!r)return;navigator.clipboard.writeText(r[field]||"");const o=btn.textContent;btn.textContent="copied ✓";setTimeout(()=>btn.textContent=o,1200);}
function render(){
  const q=el("q").value.toLowerCase(), min=+el("min").value, src=el("src").value, st=el("st").value;
  el("mv").textContent=min;
  const rows=DATA.filter(d=>d.fit>=min)
    .filter(d=>!src||d.source===src)
    .filter(d=>!st||d.status===st)
    .filter(d=>!q||(d.company+" "+d.role+" "+d.stack.join(" ")).toLowerCase().includes(q));
  el("cnt").textContent=rows.length+" shown";
  el("list").innerHTML=rows.map(d=>\`
   <div class="card">
    <div class="head">
      <div><div class="co">\${d.company}</div><div class="role">\${d.role}</div>
        <div class="meta">\${d.location||""} \${d.remote?"· 🌎 remote":""} \${d.comp?("· "+d.comp):""} · <span class="src">\${d.source}</span></div></div>
      <div class="fit" style="\${fitColor(d.fit)}">\${d.fit}</div>
    </div>
    \${d.lead?\`<div class="lead">▶ lead with: \${d.lead}</div>\`:""}
    \${d.hook?\`<div class="hook">\${d.hook}</div>\`:""}
    \${(d.contactEmail||d.contact||d.contactNote)?\`<div class="meta">👤 \${d.contact||""} \${d.contactEmail?("· <b style=\\"color:#7fe0a8\\">"+d.contactEmail+"</b>"):""} \${d.contactNote?("· "+d.contactNote):""}</div>\`:""}
    <div class="tags">\${d.stack.map(s=>\`<span class="tag">\${s}</span>\`).join("")}\${d.gaps.map(g=>\`<span class="tag gap">⚠ \${g}</span>\`).join("")}</div>
    <div class="actions">
      <a class="btn" href="\${d.url}" target="_blank" rel="noopener">Open ↗</a>
      \${d.contactEmail?\`<a class="btn" href="mailto:\${d.contactEmail}?subject=\${encodeURIComponent('Self-taught AI engineer — built it, can show you')}&body=\${encodeURIComponent(d.opener)}">Email ↗</a>\`:""}
      <button class="ghost" onclick="copyField('\${d.id}','letter',this)">Copy letter</button>
      <button class="ghost" onclick="copyField('\${d.id}','opener',this)">Copy opener</button>
      <select onchange="setStatus('\${d.id}',this.value)">
        \${["sourced","drafted","applied","sent","replied","screen","interview","offer","closed"].map(s=>\`<option \${d.status===s?"selected":""}>\${s}</option>\`).join("")}
      </select>
    </div>
   </div>\`).join("");
}
["q","min","src","st"].forEach(i=>el(i).addEventListener("input",render));
render();
</script></body></html>`;

  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  const out = join(DATA_DIR, "dashboard.html");
  writeFileSync(out, html);
  return out;
}
