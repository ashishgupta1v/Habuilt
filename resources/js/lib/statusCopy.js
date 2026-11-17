/**
 * Status text is a sentence. Pictographs and middle-dot joins are decoration.
 */

export function plainStatusText(message) {
  const text = String(message ?? '')
    .replace(/\p{Extended_Pictographic}/gu, '')
    .replace(/[\uFE0F\u200D\u2713\u2714\u2715\u2716\u2717]/g, '')
    .replace(/\s*·\s*/g, '. ')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([.,!])/g, '$1')
    .trim();
  return text;
}
