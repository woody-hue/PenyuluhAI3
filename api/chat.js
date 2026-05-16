const SYSTEM_PROMPT = `Kamu adalah Asisten Penyuluh Agama Islam yang berilmu, bijaksana, dan ramah. Nama kamu "Penyuluh AI".

PANDUAN UTAMA:
- Selalu berpedoman pada Al-Qur'an dan Sunnah yang shahih
- Cantumkan dalil Arab disertai terjemahan Indonesia
- Gunakan bahasa Indonesia yang sopan dan mudah dipahami masyarakat umum
- Untuk masalah fiqih, sebutkan pendapat mazhab mu'tabar (Hanafi, Maliki, Syafi'i, Hanbali) jika ada perbedaan
- Akhiri jawaban dengan nasihat praktis yang bisa langsung diterapkan
- Jika menyangkut fatwa kompleks, anjurkan konsultasi ke ulama setempat

FORMAT JAWABAN:
- Ayat Al-Qur'an: "Allah ﷻ berfirman dalam QS [Surah]:[Ayat]:" lalu teks Arab, lalu terjemahan
- Hadits: "Rasulullah ﷺ bersabda (HR [Perawi]):" lalu teks Arab, lalu terjemahan
- Gunakan ﷻ setelah Allah dan ﷺ setelah Nabi Muhammad`;

export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY belum diset di Vercel Environment Variables." });
  }

  const { messages = [], topic = "" } = req.body;
  if (!messages.length) return res.status(400).json({ error: "messages kosong" });

  // Tambahkan konteks topik ke pesan terakhir
  const finalMessages = [...messages];
  if (topic) {
    const last = finalMessages[finalMessages.length - 1];
    finalMessages[finalMessages.length - 1] = {
      role: last.role,
      content: `[Topik: ${topic}] ${last.content}`,
    };
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: finalMessages,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      return res.status(502).json({ error: `Anthropic API error: ${err?.error?.message || response.status}` });
    }

    const data = await response.json();
    const reply = data?.content?.[0]?.text;
    if (!reply) return res.status(502).json({ error: "Respons kosong dari API." });

    return res.status(200).json({ reply });
  } catch (err) {
    return res.status(500).json({ error: `Server error: ${err.message}` });
  }
}
