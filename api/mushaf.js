// Vercel server function: credentials remain on the server.
let tokenCache;
async function accessToken(id, secret, authBase, scope) {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60000) return tokenCache.value;
  const response = await fetch(authBase + '/oauth2/token', {
    method: 'POST',
    headers: { Authorization: 'Basic ' + Buffer.from(id + ':' + secret).toString('base64'), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'client_credentials', scope }),
  });
  if (!response.ok) throw new Error('Token request failed');
  const data = await response.json();
  if (!data.access_token || !Number.isFinite(Number(data.expires_in))) throw new Error('Invalid token response');
  tokenCache = { value: data.access_token, expiresAt: Date.now() + Number(data.expires_in) * 1000 };
  return tokenCache.value;
}
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const { page, ayah } = req.query;
  const validPage = typeof page === 'string' && /^\d{1,3}$/.test(page) && Number(page) >= 1 && Number(page) <= 604;
  const validAyah = typeof ayah === 'string' && /^(?:[1-9]|[1-9]\d|1[01]\d):[1-9]\d{0,2}$/.test(ayah) && Number(ayah.split(':')[0]) <= 114;
  if (Boolean(validPage) === Boolean(validAyah) || (page && !validPage) || (ayah && !validAyah)) return res.status(400).json({ error: 'Invalid page or ayah' });
  const id = process.env.QF_CLIENT_ID, secret = process.env.QF_CLIENT_SECRET;
  if (!id || !secret) return res.status(503).json({ error: 'Quran content service is not configured' });
  const env = process.env.QF_ENV || 'prelive';
  if (!['prelive', 'production'].includes(env)) return res.status(503).json({ error: 'Invalid Quran content environment' });
  const auth = env === 'production' ? 'https://oauth2.quran.foundation' : 'https://prelive-oauth2.quran.foundation';
  const api = env === 'production' ? 'https://apis.quran.foundation' : 'https://apis-prelive.quran.foundation';
  try {
    const token = await accessToken(id, secret, auth, process.env.QF_CONTENT_SCOPE || 'content.quran.read');
    const path = validPage ? 'by_page/' + page : 'by_key/' + encodeURIComponent(ayah);
    const params = new URLSearchParams({ mushaf: '1', words: 'true', word_fields: 'code_v2,line_number,page_number', per_page: '50' });
    const response = await fetch(api + '/content/api/v4/verses/' + path + '?' + params, { headers: { 'x-auth-token': token, 'x-client-id': id } });
    if (!response.ok) return res.status(response.status === 404 ? 404 : 502).json({ error: 'Quran content unavailable' });
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=3600');
    return res.status(200).json(await response.json());
  } catch { return res.status(502).json({ error: 'Quran content unavailable' }); }
}
