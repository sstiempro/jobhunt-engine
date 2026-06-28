// Target companies polled directly via their OFFICIAL public ATS endpoints.
// ToS-safe "no scraping" path: each ATS publishes a company's open roles as JSON.
//
// EVERY slug below was PROBED LIVE 2026-06-29 and returned real jobs (count in comment).
// Companies with no public ATS (Mistral, Perplexity, Cursor/Anysphere, Kraken, Chainalysis,
// Wintermute, most quant HFTs) are intentionally omitted — add only verified slugs.
//
// To add one: open their careers page.
//   boards.greenhouse.io/<slug>  ·  jobs.lever.co/<slug>  ·  jobs.ashbyhq.com/<slug>
// then probe:  curl -s https://boards-api.greenhouse.io/v1/boards/<slug>/jobs | head

export type Ats = "greenhouse" | "lever" | "ashby";

export interface Target {
  company: string;
  ats: Ats;
  slug: string;
  tag?: "ai" | "crypto" | "fintech" | "data" | "fde";
}

export const WATCHLIST: Target[] = [
  // --- AI labs / AI-native ---
  { company: "OpenAI", ats: "ashby", slug: "openai", tag: "ai" },          // 719
  { company: "Anthropic", ats: "greenhouse", slug: "anthropic", tag: "ai" }, // 398
  { company: "ElevenLabs", ats: "ashby", slug: "elevenlabs", tag: "ai" },  // 149
  { company: "Harvey", ats: "ashby", slug: "harvey", tag: "ai" },          // 300
  { company: "Sierra", ats: "ashby", slug: "sierra", tag: "ai" },          // 142
  { company: "Cohere", ats: "ashby", slug: "cohere", tag: "ai" },          // 130
  { company: "Writer", ats: "ashby", slug: "writer", tag: "ai" },          // 50
  { company: "Weaviate", ats: "ashby", slug: "weaviate", tag: "ai" },      // 3
  { company: "Linear", ats: "ashby", slug: "linear", tag: "ai" },          // 23
  { company: "Together AI", ats: "greenhouse", slug: "togetherai", tag: "ai" }, // 59
  { company: "Fireworks AI", ats: "greenhouse", slug: "fireworksai", tag: "ai" }, // 33
  { company: "Imbue", ats: "greenhouse", slug: "imbue", tag: "ai" },       // 3

  // --- FDE-heavy / applied AI / data ---
  { company: "Palantir", ats: "lever", slug: "palantir", tag: "fde" },     // 244 (FDE pioneer)
  { company: "Databricks", ats: "greenhouse", slug: "databricks", tag: "data" }, // 771
  { company: "Scale AI", ats: "greenhouse", slug: "scaleai", tag: "ai" },  // 177
  { company: "Discord", ats: "greenhouse", slug: "discord", tag: "ai" },   // 65

  // --- fintech (FDE + applied AI + full-stack) ---
  { company: "Stripe", ats: "greenhouse", slug: "stripe", tag: "fintech" }, // 491
  { company: "Brex", ats: "greenhouse", slug: "brex", tag: "fintech" },    // 249
  { company: "Ramp", ats: "ashby", slug: "ramp", tag: "fintech" },         // 118
  { company: "Plaid", ats: "ashby", slug: "plaid", tag: "fintech" },       // 106
  { company: "Mercury", ats: "greenhouse", slug: "mercury", tag: "fintech" }, // 52

  // --- crypto / web3 (your TRADEZYX + ROOT Protocol wheelhouse) ---
  { company: "Ripple", ats: "greenhouse", slug: "ripple", tag: "crypto" }, // 162 (XRP)
  { company: "Coinbase", ats: "greenhouse", slug: "coinbase", tag: "crypto" }, // 127
  { company: "Fireblocks", ats: "greenhouse", slug: "fireblocks", tag: "crypto" }, // 65
  { company: "Gemini", ats: "greenhouse", slug: "gemini", tag: "crypto" }, // 23
  { company: "FalconX", ats: "greenhouse", slug: "falconx", tag: "crypto" }, // 19 (crypto prime/quant)
  { company: "ConsenSys", ats: "greenhouse", slug: "consensys", tag: "crypto" }, // 10
  { company: "Uniswap Labs", ats: "ashby", slug: "uniswap", tag: "crypto" }, // 10
  { company: "Gauntlet", ats: "lever", slug: "gauntlet", tag: "crypto" },  // 6 (crypto quant/risk)
  { company: "OpenSea", ats: "ashby", slug: "opensea", tag: "crypto" },    // 4
];
