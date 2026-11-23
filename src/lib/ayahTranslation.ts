const translations = new Map<string, string>();

export function cachedAyahTranslation(key: string) {
  return translations.get(key);
}

export async function getAyahTranslation(key: string, signal: AbortSignal) {
  const cached = cachedAyahTranslation(key);
  if (cached) return cached;
  const response = await fetch("https://api.alquran.cloud/v1/ayah/" + key + "/en.sahih", { signal });
  if (!response.ok) throw new Error("Translation unavailable");
  const payload = await response.json();
  const text = payload?.data?.text;
  if (typeof text !== "string" || !text.trim()) throw new Error("Translation unavailable");
  translations.set(key, text);
  return text;
}
