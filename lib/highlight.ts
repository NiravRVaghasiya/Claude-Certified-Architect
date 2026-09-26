/* ===========================================================================
   Code highlighting
   ---------------------------------------------------------------------------
   Dependency-free tokenizer for the chapter code blocks.

   Two facts about the source notes drive the design:

   1. The HTML carries no language metadata — across all 70 chapters there is
      not a single `language-*` class or `data-lang` attribute on a <pre>/<code>.
      So the language has to be inferred from the code itself.
   2. Roughly half of the 332 blocks already ship their own token spans (`kw`,
      `str`, `code-keyword`, `tok-k`, …) from the source. Those are mapped onto
      this palette in chapter-prose.css and must never be re-tokenized; the
      caller (components/chapter/chapter-body.tsx) skips any <pre> that already
      contains a classed element.

   Safety: `highlight` never concatenates raw input. Every text slice — token
   bodies included — goes through `escapeHtml` before it reaches the output, so
   the only markup in the result is the <span> wrappers written below.

   Cost: one linear pass per block, with a size cap. Token classes are the
   `.cb-*` set already defined in app/globals.css.
   =========================================================================== */

export type Language = "json" | "yaml" | "bash" | "python" | "typescript" | "text";

/** Badge text for the code-block chrome. `text` deliberately has none. */
export const LANGUAGE_LABEL: Record<Language, string> = {
  json: "json",
  yaml: "yaml",
  bash: "shell",
  python: "python",
  typescript: "ts",
  text: "",
};

/** Above this size a block is a data dump or ASCII art; not worth a pass. */
export const MAX_HIGHLIGHT_CHARS = 20_000;

/** Only the first few KB are needed to tell what a block is. */
const DETECT_WINDOW = 4_000;

function escapeHtml(value: string): string {
  return value.replace(/[&<>"]/g, (ch) =>
    ch === "&" ? "&amp;" : ch === "<" ? "&lt;" : ch === ">" ? "&gt;" : "&quot;"
  );
}

function span(cls: string, text: string): string {
  return `<span class="${cls}">${escapeHtml(text)}</span>`;
}

interface Rule {
  /** Sticky (`y`) so it can only match exactly at the cursor. */
  re: RegExp;
  cls: string;
  /** Try only at the start of a line (avoids lookbehind, which Safari lacks). */
  bol?: boolean;
  /** Regex captures `(plain prefix)(token)`; only group 2 is wrapped. */
  lead?: boolean;
}

/* --- Rule sets ------------------------------------------------------------
   Order matters: comments and strings first so their contents are never
   re-scanned, keywords before the generic identifier/call rules. */

const JSON_RULES: Rule[] = [
  { re: /\/\/[^\n]*/y, cls: "cb-cmt" },
  { re: /\/\*[\s\S]*?\*\//y, cls: "cb-cmt" },
  // A quoted string followed by `:` is a property name, not a value.
  { re: /"(?:[^"\\\n]|\\.)*"(?=\s*:)/y, cls: "cb-prop" },
  { re: /"(?:[^"\\\n]|\\.)*"/y, cls: "cb-str" },
  { re: /\b(?:true|false|null)\b/y, cls: "cb-bool" },
  { re: /-?\b\d+(?:\.\d+)?(?:[eE][-+]?\d+)?\b/y, cls: "cb-num" },
  { re: /[{}[\],]/y, cls: "cb-punc" },
  { re: /:/y, cls: "cb-op" },
];

const YAML_RULES: Rule[] = [
  { re: /#[^\n]*/y, cls: "cb-cmt" },
  { re: /---|\.\.\./y, cls: "cb-punc", bol: true },
  { re: /"(?:[^"\\\n]|\\.)*"/y, cls: "cb-str" },
  { re: /'(?:[^'\n]|'')*'/y, cls: "cb-str" },
  { re: /([ \t]*(?:-[ \t]+)*)([A-Za-z_][\w.\-/ ]*)(?=:(?:\s|$))/y, cls: "cb-prop", bol: true, lead: true },
  // Only the unambiguous literals: `yes`/`no`/`on`/`off` are too common in the
  // prose that these notes mix into markdown-with-frontmatter blocks.
  { re: /\b(?:true|false|null)\b/y, cls: "cb-bool" },
  // Anchors, aliases and merge keys.
  { re: /[&*][\w-]+|<</y, cls: "cb-kw" },
  { re: /-?\b\d+(?:\.\d+)?\b/y, cls: "cb-num" },
  { re: /[[\]{},]/y, cls: "cb-punc" },
  { re: /[:|>]/y, cls: "cb-op" },
];

const BASH_RULES: Rule[] = [
  { re: /#[^\n]*/y, cls: "cb-cmt" },
  { re: /'[^'\n]*'/y, cls: "cb-str" },
  { re: /"(?:[^"\\\n]|\\.)*"/y, cls: "cb-str" },
  // The command at the head of a line, with an optional `$ ` prompt.
  { re: /([ \t]*(?:\$ )?)([A-Za-z][\w.+-]*)(?=[ \t\n]|$)/y, cls: "cb-fn", bol: true, lead: true },
  { re: /\$\{[^}\n]*\}|\$[A-Za-z_]\w*/y, cls: "cb-prop" },
  {
    re: /\b(?:if|then|else|elif|fi|for|while|until|do|done|case|esac|in|function|return|export|local|source|set|trap)\b/y,
    cls: "cb-kw",
  },
  { re: /([ \t])(--?[A-Za-z][\w-]*)/y, cls: "cb-op", lead: true },
  { re: /\b\d+(?:\.\d+)*\b/y, cls: "cb-num" },
  { re: /&&|\|\||[|;><=]/y, cls: "cb-op" },
];

const PYTHON_RULES: Rule[] = [
  { re: /#[^\n]*/y, cls: "cb-cmt" },
  { re: /[rbfuRBFU]{0,2}(?:"""[\s\S]*?"""|'''[\s\S]*?''')/y, cls: "cb-str" },
  { re: /[rbfuRBFU]{0,2}(?:"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*')/y, cls: "cb-str" },
  { re: /@[A-Za-z_][\w.]*/y, cls: "cb-fn" },
  { re: /\b(?:None|True|False)\b/y, cls: "cb-bool" },
  {
    re: /\b(?:def|class|return|if|elif|else|for|while|break|continue|pass|import|from|as|with|try|except|finally|raise|yield|lambda|global|nonlocal|assert|async|await|del|not|and|or|is|in)\b/y,
    cls: "cb-kw",
  },
  { re: /\b[A-Za-z_]\w*(?=\s*\()/y, cls: "cb-fn" },
  { re: /\b(?:0[xX][0-9a-fA-F]+|\d+(?:\.\d+)?(?:[eE][-+]?\d+)?)\b/y, cls: "cb-num" },
  { re: /->|\*\*|[+\-*/%=<>!]=?/y, cls: "cb-op" },
  { re: /[(){}[\],:.]/y, cls: "cb-punc" },
];

const TYPESCRIPT_RULES: Rule[] = [
  { re: /\/\/[^\n]*/y, cls: "cb-cmt" },
  { re: /\/\*[\s\S]*?\*\//y, cls: "cb-cmt" },
  { re: /`(?:[^`\\]|\\[\s\S])*`/y, cls: "cb-str" },
  { re: /"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/y, cls: "cb-str" },
  { re: /\b(?:true|false|null|undefined|NaN)\b/y, cls: "cb-bool" },
  {
    re: /\b(?:const|let|var|function|return|if|else|for|while|do|break|continue|switch|case|default|class|extends|implements|interface|type|enum|import|export|from|as|async|await|new|try|catch|finally|throw|typeof|instanceof|in|of|delete|void|yield|public|private|protected|readonly|static|satisfies|keyof|this|super)\b/y,
    cls: "cb-kw",
  },
  { re: /\b[A-Za-z_$][\w$]*(?=\s*\()/y, cls: "cb-fn" },
  { re: /(\.)([A-Za-z_$][\w$]*)/y, cls: "cb-prop", lead: true },
  { re: /\b[A-Za-z_$][\w$]*(?=\s*:)/y, cls: "cb-prop" },
  { re: /\b(?:0[xX][0-9a-fA-F]+|\d+(?:\.\d+)?(?:[eE][-+]?\d+)?)\b/y, cls: "cb-num" },
  { re: /=>|===|!==|[+\-*/%=<>!?|&]+/y, cls: "cb-op" },
  { re: /[(){}[\],;:.]/y, cls: "cb-punc" },
];

const RULES: Record<Language, Rule[] | null> = {
  json: JSON_RULES,
  yaml: YAML_RULES,
  bash: BASH_RULES,
  python: PYTHON_RULES,
  typescript: TYPESCRIPT_RULES,
  text: null,
};

/**
 * Wraps tokens of `code` in `.cb-*` spans and returns HTML.
 *
 * Returns escaped-but-unhighlighted text for `text`, for oversized blocks, and
 * for anything the rules don't recognise — so it is always safe to render.
 */
export function highlight(code: string, lang: Language): string {
  const rules = RULES[lang];
  if (!rules || code.length > MAX_HIGHLIGHT_CHARS) return escapeHtml(code);

  let out = "";
  let plainFrom = 0;
  let i = 0;
  let bol = true;

  while (i < code.length) {
    let matched = 0;

    for (const rule of rules) {
      if (rule.bol && !bol) continue;
      rule.re.lastIndex = i;
      const m = rule.re.exec(code);
      if (!m || m[0].length === 0) continue;

      const prefix = rule.lead ? m[1] ?? "" : "";
      const token = rule.lead ? m[2] ?? "" : m[0];
      if (token.length === 0) continue;

      out += escapeHtml(code.slice(plainFrom, i)) + escapeHtml(prefix) + span(rule.cls, token);
      matched = m[0].length;
      break;
    }

    if (matched > 0) {
      i += matched;
      plainFrom = i;
    } else {
      i += 1;
    }
    bol = code[i - 1] === "\n";
  }

  return out + escapeHtml(code.slice(plainFrom));
}

/* --- Detection ------------------------------------------------------------ */

/** Box-drawing (U+2500–U+257F) and block (U+2580–U+259F) glyphs — diagram art. */
const BOX_DRAWING = /[─-╿▀-▟]/g;

type CodeLanguage = Exclude<Language, "text">;

/** Weighted signals; the language with the highest total wins. */
const SIGNALS: Array<[CodeLanguage, RegExp, number]> = [
  ["json", /^\s*[{[]/, 2],
  ["json", /"[^"\n]*"\s*:/, 3],
  ["yaml", /^---\s*$/m, 4],
  ["yaml", /^[ \t]*[\w.-]+:(?:[ \t]+\S|[ \t]*$)/m, 2],
  ["yaml", /^[ \t]*-[ \t]+\S/m, 2],
  ["bash", /^[ \t]*\$ \S/m, 4],
  ["bash", /^#!\s*\/\S*(?:ba|z|d)?sh\b/m, 5],
  [
    "bash",
    /^[ \t]*(?:npm|npx|yarn|pnpm|bun|git|cd|ls|mkdir|rm|cp|mv|cat|echo|export|curl|wget|pip3?|node|claude|docker|kubectl|aws|brew|sudo|chmod|touch|grep|sed|awk|make|tree|open)\b/m,
    3,
  ],
  ["bash", /[ \t]--[a-z][\w-]*/, 1],
  ["python", /^[ \t]*(?:def|class)[ \t]+\w+/m, 4],
  ["python", /^[ \t]*(?:import|from)[ \t]+[\w.]+/m, 2],
  ["python", /\b(?:elif|None|True|False|self)\b/, 2],
  ["python", /\bprint\(/, 2],
  ["python", /^[ \t]*(?:@\w|"""|async def\b)/m, 2],
  ["typescript", /\b(?:const|let|function|interface|type|enum)\b/, 2],
  ["typescript", /=>/, 2],
  ["typescript", /\b(?:import|export)\b[^\n]*\bfrom\b/, 3],
  ["typescript", /\b(?:await|async|new)\b/, 1],
  ["typescript", /;[ \t]*$/m, 1],
];

/** Ties break toward the more specific format. */
const PRIORITY: CodeLanguage[] = ["json", "yaml", "python", "typescript", "bash"];

/** Below this the signals are too weak to trust — leave the block unstyled. */
const MIN_SCORE = 3;

/**
 * Guesses a block's language from its shape. Deliberately conservative: an
 * unrecognised or diagram-like block resolves to `text`, which renders as-is.
 */
export function detectLanguage(code: string): Language {
  const head = code.length > DETECT_WINDOW ? code.slice(0, DETECT_WINDOW) : code;
  const trimmed = head.trim();
  if (trimmed.length === 0) return "text";

  // Tree/flow diagrams drawn with box characters are not code.
  const art = head.match(BOX_DRAWING);
  if (art && art.length >= 3) return "text";

  // Unambiguous: an object/array literal with quoted keys.
  if (/^[{[]/.test(trimmed) && /"[^"\n]*"\s*:/.test(trimmed)) return "json";

  const scores = new Map<CodeLanguage, number>();
  for (const [lang, re, weight] of SIGNALS) {
    if (re.test(head)) scores.set(lang, (scores.get(lang) ?? 0) + weight);
  }

  let best: CodeLanguage | null = null;
  let bestScore = 0;
  for (const lang of PRIORITY) {
    const score = scores.get(lang) ?? 0;
    if (score > bestScore) {
      best = lang;
      bestScore = score;
    }
  }

  return best && bestScore >= MIN_SCORE ? best : "text";
}
