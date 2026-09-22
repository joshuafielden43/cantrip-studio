/**
 * Still Have It — local PG filter (Writer FILTER-POLICY Rev 4, stubs closed 2026-09-13)
 * Curated block + allowlist. Bundled; no CDN. Not a safety certification.
 */
import {
  DataSet,
  pattern,
  RegExpMatcher,
  englishRecommendedBlacklistMatcherTransformers,
  englishRecommendedWhitelistMatcherTransformers,
  remapCharactersTransformer
} from "obscenity";

const BLOCK = [
  "fuck", "shit", "asshole", "bitch", "bastard", "dickhead", "motherfucker",
  "cock", "pussy", "cunt", "dick", "blowjob", "handjob", "anal", "cum", "tit",
  "nigger", "nigga", "faggot", "fag", "retard", "tranny", "kike", "spastic",
  "wetback", "chink"
];

/** Identity / place / substring allow — NOT dick (handled by special-case). */
const ALLOW = [
  "gay", "lesbian", "bisexual", "trans", "transgender", "queer", "asexual",
  "black", "asian", "latino", "latina", "hispanic", "jewish", "muslim",
  "gayle", "cockburn", "scunthorpe",
  "class", "classic", "classify", "assist", "assistant", "assume",
  "bass", "passionate", "passage", "cocktail", "document", "therapist",
  "analysis", "analyst", "title", "attitude", "retardant", "shirt", "shiitake",
  "constitution", "circumstance",
  "finish", "finished", "finishing"
];

const MIN_COLLAPSE_STEMS = [
  ["fuck", /f[\s.\-_*+]+u[\s.\-_*+]+c[\s.\-_*+]+k/i],
  ["shit", /s[\s.\-_*+]+h[\s.\-_*+]+i[\s.\-_*+]+t/i],
  ["cunt", /c[\s.\-_*+]+u[\s.\-_*+]+n[\s.\-_*+]+t/i]
];
const FUCK_EVASIONS = new Set(["fuck", "fck", "fuk", "fuc"]);

const ds = new DataSet();
for (const word of BLOCK) {
  ds.addPhrase((p) => {
    let b = p.setMetadata({ id: word }).addPattern(pattern`${word}`);
    if (word === "fuck") b = b.addPattern(pattern`f?ck`);
    if (word === "shit") b = b.addWhitelistedTerm("shirt").addWhitelistedTerm("shiitake").addWhitelistedTerm("finish").addWhitelistedTerm("finished").addWhitelistedTerm("finishing");
    if (word === "cock") b = b.addWhitelistedTerm("cocktail").addWhitelistedTerm("cockburn");
    if (word === "anal") b = b.addWhitelistedTerm("analysis").addWhitelistedTerm("analyst");
    if (word === "tit") b = b.addWhitelistedTerm("title").addWhitelistedTerm("attitude").addWhitelistedTerm("constitution");
    if (word === "cum") b = b.addWhitelistedTerm("document").addWhitelistedTerm("circumstance");
    if (word === "retard") b = b.addWhitelistedTerm("retardant");
    // dick: NO whitelistedTerm("dick") — case-blind allow would unlock lowercase sexual use
    return b;
  });
}

const built = ds.build();
const matcher = new RegExpMatcher({
  blacklistedTerms: built.blacklistedTerms,
  whitelistedTerms: [...new Set([...(built.whitelistedTerms || []), ...ALLOW])],
  blacklistMatcherTransformers: [
    remapCharactersTransformer({ "@": "a", "4": "a", "0": "o", "1": "i", "3": "e", $: "s", "!": "i" }),
    ...englishRecommendedBlacklistMatcherTransformers
  ],
  whitelistMatcherTransformers: englishRecommendedWhitelistMatcherTransformers
});

function collapseSeparators(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[\s.\-_*+]+/g, "");
}

/**
 * Spaced/punctuated swears only (Writer closed 2026-09-13).
 * Collapse matches when the original has separators between letters
 * (e.g. "s h i t", "f.u.c.k", "f*ck") — NOT when normal words collapse into a stem
 * ("finish it" → "finishit" must NOT hit "shit").
 */
function collapseBlockMatches(text) {
  const original = String(text || "");
  const hits = [];
  for (const [stem, spacedStem] of MIN_COLLAPSE_STEMS) {
    if (!spacedStem.test(original)) {
      // fuck leet with * as separator already covered; also f*ck via f[sep]*ck pattern above
      if (stem === "fuck" && /f\s*[\s.\-_*+]+\s*u?\s*[\s.\-_*+]*\s*c\s*[\s.\-_*+]+\s*k/i.test(original)) {
        hits.push({ start: 0, end: original.length, id: "fuck" });
      }
      continue;
    }
    hits.push({ start: 0, end: original.length, id: stem });
  }
  return hits;
}

/**
 * Dick allowlist (closed): pass Dick / Dick's / Dicks / DICK; block lowercase dick/dicks;
 * dickhead any case always blocks. If matcher is case-blind, keep only when span starts with D or is DICK.
 */
function isAllowedDickSpan(text, start, end) {
  const span = String(text || "").slice(start, end);
  if (/^dickhead$/i.test(span.replace(/[\s\-]+/g, ""))) return false;
  if (span === "DICK") return true;
  if (span.length && span[0] === "D") return true;
  return false;
}

/**
 * @param {string} text
 * @returns {{ ok: boolean, matches: Array<{ start: number, end: number, id?: string }> }}
 */
export function checkInvitation(text) {
  const input = String(text || "");
  const collapseHits = collapseBlockMatches(input);

  const raw = matcher.getAllMatches(input, true);
  const matches = [];
  for (const m of raw) {
    const start = m.startIndex;
    const end = m.endIndex + 1;
    const span = input.slice(start, end);
    const id = m.termId != null ? String(m.termId) : "";
    const lower = span.toLowerCase();
    // dickhead always blocks
    if (/dickhead/i.test(span) || id === "dickhead") {
      matches.push({ start, end, id: "dickhead" });
      continue;
    }
    // dick special-case
    if (id === "dick" || /^dicks?$/i.test(span)) {
      if (isAllowedDickSpan(input, start, end)) continue;
      matches.push({ start, end, id: "dick" });
      continue;
    }
    matches.push({ start, end, id });
  }

  // Merge collapse hits if not already covered by a fuck/shit/cunt match
  for (const h of collapseHits) {
    const already = matches.some((m) => m.id === h.id);
    if (!already) matches.push(h);
  }

  return { ok: matches.length === 0, matches };
}

export function hasMatch(text) {
  return !checkInvitation(text).ok;
}

export const FILTER_MESSAGE = "Keep it friendly—please change this wording.";
export const FILTER_META = {
  package: "obscenity",
  source: "Writer FILTER-POLICY Rev 4 curated (stubs closed 2026-09-13)",
  note: "spaced swears only (not finish→shit); Dick name special-case; finish* allowlisted"
};

if (typeof window !== "undefined") {
  window.SHIFilter = { checkInvitation, hasMatch, FILTER_MESSAGE, FILTER_META };
}
