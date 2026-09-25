/**
 * Build-time content ingestion.
 *
 * Reads every source study-notes HTML file, extracts structured chapter
 * data (title, sections, sanitized body), and writes:
 *   - content/chapters/<slug>.json  (one per chapter, full body)
 *   - content/manifest.json         (ordered index, no body — for nav/progress)
 *   - content/search-index.json     (flattened text for Fuse.js)
 *
 * Source layout has three shapes (see notes inline below); this script
 * normalizes all of them into one ChapterRecord shape.
 */
import fs from "node:fs";
import path from "node:path";
import * as cheerio from "cheerio";
import sanitizeHtml from "sanitize-html";

const ROOT = process.cwd();
const SOURCE_ROOT = path.join(ROOT, "source-content");
const OUTPUT_DIR = path.join(ROOT, "content");
const CHAPTERS_DIR = path.join(OUTPUT_DIR, "chapters");
const PUBLIC_DIR = path.join(ROOT, "public");

type Track = "core" | "foundation" | "professional";

interface DomainMeta {
  key: string;
  title: string;
}

interface SourceFile {
  filePath: string;
  track: Track;
  domain: DomainMeta;
}

interface SectionHeading {
  id: string;
  title: string;
  level: 2 | 3;
}

interface ChapterRecord {
  slug: string;
  chapterNumber: number;
  title: string;
  dek: string | null;
  track: Track;
  domain: DomainMeta;
  sections: SectionHeading[];
  bodyHtml: string;
  plainText: string;
  readingTime: number;
  wordCount: number;
}

// ---------------------------------------------------------------------------
// 1. Enumerate source files and their track/domain metadata
// ---------------------------------------------------------------------------

function domainFromFolderName(folderName: string): DomainMeta {
  // e.g. "Domain 1 - AGENTIC ARCHITECTURE & ORCHESTRATION" or
  // "Domain 2 CLAUDE MODELS, PROMPTING & CONTEXT ENGINEERING"
  const match = folderName.match(/^Domain\s+(\d+)\s*[-—]?\s*(.*)$/i);
  const title = (match ? match[2] : folderName).trim();
  return { key: slugify(title), title: toTitleCase(title) };
}

function listHtmlFiles(dir: string): string[] {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".html"))
    .map((e) => path.join(dir, e.name));
}

function collectSourceFiles(): SourceFile[] {
  const files: SourceFile[] = [];

  // Root-level loose chapters (Ch.1, and the bundled CCAR Study Guide).
  for (const filePath of listHtmlFiles(SOURCE_ROOT)) {
    const base = path.basename(filePath);
    if (base.startsWith("Ch.1 ")) {
      files.push({
        filePath,
        track: "core",
        domain: { key: "ecosystem-overview", title: "Ecosystem Overview" },
      });
    } else if (base === "CCAR Study Guide.html") {
      files.push({
        filePath,
        track: "core",
        domain: { key: "exam-strategy-roadmaps", title: "Exam Strategy & Roadmaps" },
      });
    }
  }

  const trackDirs: Array<{ dir: string; track: Track }> = [
    { dir: path.join(SOURCE_ROOT, "Claude Certified Architect - Foundation"), track: "foundation" },
    { dir: path.join(SOURCE_ROOT, "Claude Certified Architect - Professional"), track: "professional" },
  ];

  for (const { dir, track } of trackDirs) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    // Loose files directly under the track root (e.g. Ch.66 Sample Questions).
    for (const filePath of listHtmlFiles(dir)) {
      files.push({
        filePath,
        track,
        domain: { key: "sample-questions", title: "Sample Questions & Practice" },
      });
    }

    // Domain subfolders.
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const domain = domainFromFolderName(entry.name);
      const domainDir = path.join(dir, entry.name);
      for (const filePath of listHtmlFiles(domainDir)) {
        files.push({ filePath, track, domain });
      }
    }
  }

  return files;
}

// ---------------------------------------------------------------------------
// 2. Parse a single chapter out of a Cheerio root, starting at a heading node
// ---------------------------------------------------------------------------

const HEADING_RE = /^Chapter\s+(\d+)\s*[—:-]+\s*(.*)$/i;
const FILENAME_CHAPTER_RE = /^Ch\.(\d+)/i;
const LEADING_CHAPTER_PREFIX_RE = /^Chapter\s+\d+\s*[·—–:.-]*\s*/i;

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const ACRONYMS = new Set([
  "MCP", "API", "SDK", "CI/CD", "RAG", "AI", "CCAR", "CCAR-F", "CCAR-P", "AB",
]);

function toTitleCase(input: string): string {
  return input
    .toLowerCase()
    .replace(/\b[\w/-]+\b/g, (word) => {
      const upper = word.toUpperCase();
      if (ACRONYMS.has(upper)) return upper;
      return word.charAt(0).toUpperCase() + word.slice(1);
    });
}

function ensureUniqueId(base: string, used: Set<string>): string {
  let id = base || "section";
  let n = 2;
  while (used.has(id)) {
    id = `${base}-${n++}`;
  }
  used.add(id);
  return id;
}

/**
 * Build the wrapper div holding one chapter's full content:
 *  - Single-chapter files: the entire content container's innerHTML (the
 *    container is either <main> or <div class="main">). Using the whole
 *    container — rather than walking siblings from the title node — is what
 *    makes this robust to the "title wrapped in a <header>" layout (Ch.1),
 *    where the title's own siblings don't include the rest of the chapter.
 *  - The bundled study guide: siblings between this chapter's <h2> heading
 *    and the next one (or end of document), via cheerio's nextUntil/nextAll.
 */
function buildContentWrapper(
  $: cheerio.CheerioAPI,
  titleNode: cheerio.Cheerio<any>,
  stopBefore: cheerio.Cheerio<any> | null,
  isMultiChapterFile: boolean
): cheerio.Cheerio<any> {
  if (isMultiChapterFile) {
    const nodes = stopBefore ? titleNode.nextUntil(stopBefore as any) : titleNode.nextAll();
    return $("<div></div>").append(nodes.clone());
  }
  // Source files use at least four different top-level layouts (nav+main,
  // aside+div.main, header+flat sections, header.hero+section), with no
  // single container selector common to all of them. <body> always holds
  // 100% of the content though, so grab that wholesale and let
  // extractChapterBody strip the chrome (header/nav/aside) afterward.
  void titleNode;
  return $("<div></div>").html($("body").first().clone().html() || "");
}

/**
 * Given a wrapper containing one chapter's full markup, strip the
 * title/subtitle/badge elements that our own UI re-renders, collect section
 * headings, and return a sanitized HTML string + plain text + section list.
 */
function extractChapterBody(
  $: cheerio.CheerioAPI,
  wrapper: cheerio.Cheerio<any>
): { bodyHtml: string; plainText: string; sections: SectionHeading[]; dek: string | null } {
  // Drop the leading title block: the title node itself, plus an adjacent
  // subtitle/eyebrow paragraph that our chapter header re-renders. Captured
  // before the header/nav/aside strip below, since on most layouts this
  // text lives inside the <header> that's about to be removed wholesale.
  const dekEl = wrapper
    .find("p.chapter-subtitle, p.subtitle, p.sub, p.eyebrow, header p")
    .first();
  const dek = dekEl.length ? dekEl.text().trim() : null;

  // Every layout puts pure navigational/masthead chrome in one of these —
  // sidebar TOC, in-body "Table of Contents" blocks, or the title/eyebrow
  // wrapper — none of which the new UI should render (it builds its own).
  wrapper.find("header, nav, aside").remove();
  // Flat layouts with no <header> wrapper (title/badge/subtitle as direct
  // siblings of the real content) still need explicit cleanup.
  wrapper.find("h1").first().remove();
  wrapper.find("span.chapter-badge").first().remove();
  dekEl.remove();
  wrapper.find("a.back-top, a.top-link, span.backtop, .back-to-top").remove();
  // The bundled study-guide chapters use h2#chNN as their title; remove it too.
  const h2Title = wrapper.find("h2").first();
  if (h2Title.length && HEADING_RE.test(h2Title.text().trim())) {
    h2Title.remove();
  }

  // Strip anything with no rendering purpose in the new UI.
  wrapper.find("script, style").remove();

  // Removing nav/header can leave now-empty wrapper divs behind; drop them.
  for (let pass = 0; pass < 2; pass++) {
    wrapper.find("div, section").each((_, el) => {
      const $el = $(el);
      if ($el.children().length === 0 && $el.text().trim() === "") $el.remove();
    });
  }

  // Build the TOC from remaining h2/h3, assigning stable ids as we go.
  const usedIds = new Set<string>();
  const sections: SectionHeading[] = [];
  wrapper.find("h2, h3").each((_, el) => {
    const $el = $(el);
    const level = el.tagName.toLowerCase() === "h2" ? 2 : 3;
    const text = $el.clone().find(".section-num").remove().end().text().trim();
    if (!text) return;
    const existingId = $el.attr("id");
    const id = existingId || ensureUniqueId(slugify(text), usedIds);
    if (!existingId) usedIds.add(id);
    $el.attr("id", id);
    sections.push({ id, title: text, level });
  });

  const rawHtml = wrapper.html() || "";
  const bodyHtml = sanitizeChapterHtml(rawHtml);
  const plainText = wrapper.text().replace(/\s+/g, " ").trim();

  return { bodyHtml, plainText, sections, dek };
}

function sanitizeChapterHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "div", "span", "p", "br", "hr",
      "h2", "h3", "h4", "h5", "h6",
      "strong", "em", "b", "i", "u", "sub", "sup", "mark",
      "ul", "ol", "li",
      "table", "thead", "tbody", "tr", "th", "td",
      "pre", "code",
      "a", "img",
      "svg", "g", "path", "rect", "circle", "ellipse", "line", "polyline",
      "polygon", "text", "tspan", "defs", "marker", "linearGradient",
      "radialGradient", "stop", "title",
    ],
    allowedAttributes: {
      "*": ["class", "id", "style"],
      a: ["href", "target", "rel"],
      img: ["src", "alt", "width", "height"],
      svg: ["viewBox", "xmlns", "width", "height", "style"],
      path: ["d", "fill", "stroke", "stroke-width", "stroke-dasharray", "marker-end", "marker-start"],
      rect: ["x", "y", "width", "height", "rx", "ry", "fill", "stroke", "stroke-width"],
      circle: ["cx", "cy", "r", "fill", "stroke", "stroke-width"],
      ellipse: ["cx", "cy", "rx", "ry", "fill", "stroke", "stroke-width"],
      line: ["x1", "y1", "x2", "y2", "stroke", "stroke-width", "stroke-dasharray", "marker-end"],
      polyline: ["points", "fill", "stroke", "stroke-width"],
      polygon: ["points", "fill", "stroke", "stroke-width"],
      text: ["x", "y", "fill", "font-size", "font-weight", "font-family", "text-anchor", "letter-spacing", "font-style"],
      tspan: ["x", "y", "dx", "dy"],
      marker: ["id", "markerWidth", "markerHeight", "markerUnits", "refX", "refY", "orient"],
      linearGradient: ["id", "x1", "y1", "x2", "y2"],
      radialGradient: ["id", "cx", "cy", "r"],
      stop: ["offset", "stop-color", "stop-opacity"],
      g: ["fill", "stroke", "transform"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowVulnerableTags: false,
    parser: { lowerCaseAttributeNames: false },
  });
}

// ---------------------------------------------------------------------------
// 3. Per-file chapter extraction (handles the single- and multi-chapter cases)
// ---------------------------------------------------------------------------

/**
 * Chapter-number/title source of truth differs by layout:
 *  - Bundled study guide: multiple <h2 id="chNN">Chapter NN — Title</h2>
 *    boundaries inside one file — consistently formatted, so parse in place.
 *  - Every other file: one chapter per file, and the source templates are
 *    NOT consistent about repeating "Chapter N" inside the <h1> (it's
 *    sometimes only in a sibling badge/nav element, sometimes absent
 *    entirely). The filename ("Ch.7 — ...") is the one reliable place the
 *    chapter number always appears, so it's used as the source of truth;
 *    the <h1> (with any "Chapter N" prefix stripped) supplies the title.
 */
function cleanHeadingText(node: cheerio.Cheerio<any>): string {
  const clone = node.clone();
  clone.find("br").replaceWith(" ");
  clone.find(".badge, .section-num").remove();
  let text = clone.text().replace(/\s+/g, " ").trim();
  text = text.replace(LEADING_CHAPTER_PREFIX_RE, "").trim();
  // Normalize "Scenario N <title>" / "Scenario N — <title>" to "Scenario N: <title>".
  text = text.replace(/^(Scenario\s+\d+)\s*[·—–:-]*\s*/i, "$1: ");
  return text;
}

function parseFile(source: SourceFile): ChapterRecord[] {
  const html = fs.readFileSync(source.filePath, "utf-8");
  const $ = cheerio.load(html);
  $("script, style").remove();

  // Only the bundled study guide's real chapter-boundary headings use
  // id="chNN". Several single-chapter files also contain an in-content
  // recap heading worded like "Chapter 15 — 20-Point Cheat Sheet" (no id) —
  // matching on id keeps those from being mistaken for chapter boundaries.
  const h2Chapters = $("h2").filter(
    (_, el) =>
      /^ch\d+$/i.test($(el).attr("id") || "") &&
      HEADING_RE.test($(el).text().trim()) &&
      $(el).closest("nav, aside, header").length === 0
  );

  const records: ChapterRecord[] = [];

  if (h2Chapters.length > 0) {
    const titleNodes = h2Chapters.toArray().map((el) => $(el));
    for (let i = 0; i < titleNodes.length; i++) {
      const titleNode = titleNodes[i];
      const rawTitle = titleNode.clone().find(".badge, .section-num").remove().end().text().trim();
      const match = rawTitle.match(HEADING_RE);
      if (!match) {
        throw new Error(`Could not parse chapter heading "${rawTitle}" in ${source.filePath}`);
      }
      const chapterNumber = Number(match[1]);
      const title = match[2].trim();
      const stopBefore = i + 1 < titleNodes.length ? titleNodes[i + 1] : null;
      const wrapper = buildContentWrapper($, titleNode, stopBefore, true);
      records.push(buildChapterRecord($, wrapper, chapterNumber, title, source));
    }
    return records;
  }

  const filenameMatch = path.basename(source.filePath).match(FILENAME_CHAPTER_RE);
  if (!filenameMatch) {
    throw new Error(`Could not determine chapter number from filename: ${source.filePath}`);
  }
  const chapterNumber = Number(filenameMatch[1]);
  const titleNode = findSingleChapterTitle($);
  const title = cleanHeadingText(titleNode);
  if (!title) {
    throw new Error(`Empty chapter title parsed from ${source.filePath}`);
  }
  const wrapper = buildContentWrapper($, titleNode, null, false);
  records.push(buildChapterRecord($, wrapper, chapterNumber, title, source));
  return records;
}

function buildChapterRecord(
  $: cheerio.CheerioAPI,
  wrapper: cheerio.Cheerio<any>,
  chapterNumber: number,
  title: string,
  source: SourceFile
): ChapterRecord {
  const { bodyHtml, plainText, sections, dek } = extractChapterBody($, wrapper);
  const wordCount = plainText.split(/\s+/).filter(Boolean).length;

  return {
    slug: `${chapterNumber}-${slugify(title)}`,
    chapterNumber,
    title,
    dek,
    track: source.track,
    domain: source.domain,
    sections,
    bodyHtml,
    plainText,
    readingTime: Math.max(1, Math.ceil(wordCount / 200)),
    wordCount,
  };
}

/** Locate the chapter's <h1> in either of the two single-chapter layouts. */
function findSingleChapterTitle($: cheerio.CheerioAPI): cheerio.Cheerio<any> {
  const h1 = $("main h1, div.main h1, body > h1").first();
  if (h1.length) return h1;
  const anyH1 = $("h1").first();
  if (anyH1.length) return anyH1;
  throw new Error("No <h1> chapter title found");
}

// ---------------------------------------------------------------------------
// 4. Run
// ---------------------------------------------------------------------------

function main() {
  fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(CHAPTERS_DIR, { recursive: true });
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });

  const sourceFiles = collectSourceFiles();
  const chapters: ChapterRecord[] = [];
  for (const source of sourceFiles) {
    chapters.push(...parseFile(source));
  }

  chapters.sort((a, b) => a.chapterNumber - b.chapterNumber);

  // Integrity check: every chapter 1..N present exactly once.
  const seen = new Map<number, number>();
  for (const c of chapters) seen.set(c.chapterNumber, (seen.get(c.chapterNumber) ?? 0) + 1);
  const maxChapter = Math.max(...seen.keys());
  const missing: number[] = [];
  const duplicated: number[] = [];
  for (let n = 1; n <= maxChapter; n++) {
    const count = seen.get(n) ?? 0;
    if (count === 0) missing.push(n);
    if (count > 1) duplicated.push(n);
  }
  if (missing.length || duplicated.length) {
    throw new Error(
      `Chapter integrity check failed. Missing: [${missing.join(", ")}]. Duplicated: [${duplicated.join(", ")}].`
    );
  }

  for (const chapter of chapters) {
    fs.writeFileSync(
      path.join(CHAPTERS_DIR, `${chapter.slug}.json`),
      JSON.stringify(chapter, null, 2)
    );
  }

  const manifest = chapters.map(({ bodyHtml, plainText, ...rest }) => rest);
  fs.writeFileSync(path.join(OUTPUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2));

  const searchIndex = chapters.map((c) => ({
    slug: c.slug,
    chapterNumber: c.chapterNumber,
    title: c.title,
    dek: c.dek,
    track: c.track,
    domain: c.domain.title,
    sections: c.sections.map((s) => s.title),
    excerpt: c.plainText.slice(0, 4000),
  }));
  // Written to public/ (not content/) so the command palette can fetch it
  // client-side as a static asset; regenerated by prebuild, never committed.
  fs.writeFileSync(path.join(PUBLIC_DIR, "search-index.json"), JSON.stringify(searchIndex));

  // ---- Summary ----
  const byDomain = new Map<string, number>();
  for (const c of chapters) {
    const key = `${c.track} · ${c.domain.title}`;
    byDomain.set(key, (byDomain.get(key) ?? 0) + 1);
  }
  console.log(`\nIngested ${chapters.length} chapters (1–${maxChapter}) from ${sourceFiles.length} source files.\n`);
  for (const [key, count] of [...byDomain.entries()].sort()) {
    console.log(`  ${count.toString().padStart(2)}  ${key}`);
  }
  console.log(`\nWrote content/manifest.json, public/search-index.json, and ${chapters.length} chapter files.\n`);
}

main();
