const MYQURAN_BASE = "https://api.myquran.com/v2";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  // Ambil subpath dari query: /api/quran?path=quran/surah/1
  const subpath = req.query.path;
  if (!subpath) return res.status(400).json({ error: "Parameter 'path' diperlukan" });

  const url = `${MYQURAN_BASE}/${subpath}`;

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "PenyuluhAI/1.0" },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `myQuran API error: ${response.status}` });
    }

    const data = await response.json();
    // Cache 5 menit untuk data statis seperti daftar surah
    res.setHeader("Cache-Control", "public, max-age=300");
    return res.status(200).json(data);
  } catch (err) {
    if (err.name === "TimeoutError") {
      return res.status(504).json({ error: "myQuran API timeout. Coba lagi." });
    }
    return res.status(503).json({ error: `Tidak dapat terhubung ke myQuran API: ${err.message}` });
  }
}
