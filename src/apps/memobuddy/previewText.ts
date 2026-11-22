/** Preserve source text and spacing; annotation signs never count as words. */
export function previewSegments(text: string, visibleWords: number) {
 let word = 0;
 const partial = Number.isFinite(visibleWords);
 const result: { text: string; hidden: boolean; isWord: boolean }[] = [];
 for (const token of text.split(/(\s+|[\u06d6-\u06dc\u06dd\u06de\u06e9])/u).filter(Boolean)) {
  const isWord = /\p{L}/u.test(token);
  const annotation = /\S/u.test(token) && !isWord;
  if (isWord) word++;
  let value = token;
  // Combining stop signs attach to their preceding space. Mask that paint unit together.
  if (annotation && result.length && /^\s+$/u.test(result[result.length - 1].text)) value = result.pop()!.text + value;
  result.push({ text: value, hidden: annotation ? partial : isWord && word > visibleWords, isWord });
 }
 return result;
}
