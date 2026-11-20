export function isValidSelectionRange(mode: 'surah' | 'juz', start: string, end: string) {
  const max = mode === 'surah' ? 114 : 30;
  return [start, end].every(value => /^\d+$/.test(value) && Number(value) >= 1 && Number(value) <= max);
}
