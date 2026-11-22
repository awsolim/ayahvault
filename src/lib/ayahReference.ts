export function parseAyahReference(query: string, counts: number[]): string | null {
 const normalized = query.replace(/[٠-٩]/g, c => String(c.charCodeAt(0) - 1632)).trim();
 const match = /^(\d{1,3})\s*:\s*(\d{1,3})$/.exec(normalized);
 if (!match) return null;
 const surah = Number(match[1]), ayah = Number(match[2]);
 return surah >= 1 && surah <= counts.length && ayah >= 1 && ayah <= counts[surah - 1] ? surah + ':' + ayah : null;
}
