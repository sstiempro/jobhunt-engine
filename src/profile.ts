// Thomas Tyler Hill — the candidate profile the scorer matches roles against.
// Edit the weights/keywords here to retune what the engine considers a good fit.

export const IDENTITY = {
  name: "Thomas Tyler Hill",
  email: "thomas@sstiem.com",
  portfolio: "https://portfolio.sstiem.com",
  linkedin: "https://linkedin.com/in/tyler-hill-ai",
  location: "Austin, TX (remote or relocation)",
};

// Tech he is STRONG in — JD mentions here lift fit hard.
export const STRONG = [
  "typescript", "javascript", "node", "node.js", "react", "next.js", "nextjs",
  "express", "postgres", "postgresql", "redis", "docker", "websocket",
  "microservice", "full stack", "full-stack", "fullstack", "cloudflare",
  "tailwind", "three.js", "webgl", "rest api", "distributed",
];

// AI / agentic — his headline strength.
export const AI = [
  "llm", "large language model", "ai engineer", "applied ai", "agent", "agentic",
  "multi-agent", "rag", "retrieval", "embedding", "vector", "prompt", "openai",
  "anthropic", "claude", "multimodal", "whisper", "speech-to-text", "tts",
  "voice agent", "stable diffusion", "diffusion", "fine-tun", "generative",
];

// Crypto / quant — his deep niche.
export const QUANT = [
  "quant", "trading", "backtest", "market data", "market-microstructure",
  "microstructure", "crypto", "web3", "blockchain", "defi", "xrp", "xrpl",
  "solidity", "ethereum", "solana", "exchange", "order book", "funding rate",
  "systematic",
];

// Role titles that are a bullseye for him.
export const ROLE_BOOST = [
  "forward deployed", "forward-deployed", "fde", "solutions engineer",
  "applied ai", "ai engineer", "founding engineer", "full stack",
  "software engineer", "quant", "developer", "machine learning",
  "automation engineer", "platform engineer",
];

// Titles that mean "not an IC eng role for him" — push these DOWN.
export const TITLE_PENALTY = [
  "account executive", "sales development", "sdr", "recruiter", "talent",
  "marketing", "designer", "ux researcher", "customer success",
  "support", "manager", "director", "vp ", "head of", "chief",
  "accountant", "controller", "counsel", "attorney", "intern",
];

// Languages/skills he'd need to ramp on — flag as honest gaps (small penalty).
export const GAP_SIGNALS: { kw: string[]; label: string }[] = [
  { kw: ["rust"], label: "wants Rust (he ramps fast; TS-strong)" },
  { kw: ["golang", " go ", "go developer"], label: "wants Go" },
  { kw: ["c++", "cpp"], label: "wants C++" },
  { kw: ["kubernetes", "k8s"], label: "wants k8s depth" },
  { kw: ["phd", "ph.d"], label: "prefers PhD (he's self-taught + shipping)" },
  { kw: ["security clearance", "ts/sci", "clearance required"], label: "needs clearance" },
];

// Which flagship to headline, by what the role is about.
export function leadProjectFor(text: string): string {
  const t = text.toLowerCase();
  if (/forward deployed|forward-deployed|solutions engineer|deploy with customer|customer-facing/.test(t))
    return "Agent OS (governance/approvals) + LeadEngine (customer-facing AI)";
  if (QUANT.some((k) => t.includes(k))) return "TRADEZYX (41-service quant research platform)";
  if (/lead|crm|outbound|growth|gtm|sales eng|automation/.test(t)) return "LeadEngine (autonomous lead-intelligence)";
  if (AI.some((k) => t.includes(k))) return "Agent OS (AI-agent operating system)";
  return "TRADEZYX + Agent OS (full-spectrum builder)";
}

// Stack tags to surface on each opportunity card.
export const STACK_TAGS = [
  ...new Set([...STRONG, ...AI, ...QUANT, "python", "go", "rust", "kubernetes", "aws", "gcp"]),
];
