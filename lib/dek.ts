/**
 * 26 of the 70 chapters inherit the guide's own `<meta name="description">` as
 * their dek ("Claude Certified Architect — Foundations & Professional | …"),
 * because that is what the source note's head contained. Repeating one sentence
 * under 26 different titles — and in a grid where several cards sit side by side —
 * says nothing, so those are treated as absent.
 *
 * Used everywhere a dek is displayed (chapter header, chapter cards, search
 * rows) so the same chapter never has a summary in one place and not another.
 * The dek is still emitted as the page's meta description, where it belongs.
 */
const BOILERPLATE = /^claude certified architect\b/i;

export function chapterDek(dek: string | null | undefined): string | null {
  if (!dek) return null;
  const trimmed = dek.trim();
  if (trimmed.length === 0 || BOILERPLATE.test(trimmed)) return null;
  return trimmed;
}
