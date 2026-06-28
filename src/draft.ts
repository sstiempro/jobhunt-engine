// Tailored draft generator — letter + a short personalized opener, from his real templates.
// Keyless/deterministic; the top picks are meant to be skimmed and lightly polished, not sent blind.
import { IDENTITY, QUANT } from "./profile.ts";
import type { Opportunity } from "./types.ts";

function isQuant(o: Opportunity): boolean {
  const t = `${o.role} ${o.jd}`.toLowerCase();
  return QUANT.some((k) => t.includes(k));
}
function isFDE(o: Opportunity): boolean {
  return /forward deployed|forward-deployed|solutions engineer|customer/i.test(`${o.role} ${o.jd}`);
}

export function draft(o: Opportunity): Opportunity {
  const co = o.company;
  const hookLine = o.hook
    ? `What caught my eye: "${o.hook}" — that's squarely what I've been building.`
    : `Your ${o.role} role lines up closely with what I build.`;
  const gapLine =
    o.gaps && o.gaps.length
      ? `\n\nStraight about one gap: the post ${o.gaps[0]}. I'm strongest in TypeScript/Node; the methodology transfers and I ramp fast on a new language.`
      : "";

  let body: string;
  if (isQuant(o)) {
    body =
`I built a 41-microservice market-analytics and systematic-trading research platform from scratch — keyless ingestion of public exchange data, a 27M-row Postgres store, a Redis bus, and a backtest/forward-test harness with research-grade validation: walk-forward, Deflated Sharpe, phase-randomization null tests, and block-bootstrap Monte Carlo. I designed it to *reject* overfit edges — most candidates fail their null test, and catching that is the point. I also shipped ROOT Protocol (authenticated creator assets on the XRP Ledger).`;
  } else if (isFDE(o)) {
    body =
`Forward-deployed engineering is build + ship + talk to the customer — already how I work, just for my own clients. I founded SSTIEM and delivered ~20 live products end to end, including an AI-agent operating system (agent mesh, provider lanes, and an explicit approval/governance layer so autonomous agents act under auditable rules) and autonomous lead-intelligence software in production. I came up in technical sales, so I translate "agents, integrations, orchestration" into outcomes a buyer says yes to.`;
  } else {
    body =
`I design, build, ship, and operate AI-orchestrated systems end to end — solo. Over three years I've built a connected ecosystem of production systems: a 41-microservice quant research platform (~100k lines of TypeScript, 27M-row Postgres, live 24/7), an AI-agent operating system with its own governance layer, and lead-intelligence SaaS. Self-taught by shipping; I validate honestly with real statistical tests instead of demo-ware.`;
  }

  o.letter =
`Hi ${co} team,

${hookLine}

${body}${gapLine}

Everything is live and clickable: ${IDENTITY.portfolio} — I lead with ${o.leadProject} for a role like this. I'd love 20 minutes to walk through whatever's most relevant.

Thanks,
${IDENTITY.name} · ${IDENTITY.email} · ${IDENTITY.location}
${IDENTITY.linkedin}`;

  o.opener =
`Hi — I'm a self-taught AI/quant engineer (founder @ SSTIEM). Saw ${co}'s ${o.role}; it's a strong match for what I build (a 41-service quant platform + an AI-agent OS, all solo). Work's at ${IDENTITY.portfolio} if useful — would love to connect.`;

  if (o.status === "sourced") o.status = "drafted";
  return o;
}
