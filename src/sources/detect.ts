import { STACK_TAGS } from "../profile.ts";

// Pull recognizable tech tags out of a JD/title blob.
export function detectStack(text: string): string[] {
  const t = " " + text.toLowerCase() + " ";
  const found = new Set<string>();
  for (const tag of STACK_TAGS) {
    const needle = tag.includes(".") || tag.includes(" ") ? tag : ` ${tag}`;
    if (t.includes(needle.toLowerCase())) found.add(tag);
  }
  return [...found].slice(0, 12);
}

export function looksRemote(text: string): boolean {
  return /\bremote\b|work from home|wfh|distributed team|anywhere/i.test(text);
}
