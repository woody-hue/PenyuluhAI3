const Anthropic = require('@anthropic-ai/sdk');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    // Kita gunakan nama variabel baru untuk Claude
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(200).json({ error: 'API Key Vercel belum dipasang (Variabel ANTHROPIC_API_KEY kosong).' });
    }

    const { messages, topic } = req.body;
    
    if (!messages || messages.length === 0) {
      return res.status(200).json({ error: 'Pesan dari frontend kosong.' });
    }

    const anthropic = new Anthropic({
      apiKey: apiKey,
    });
    
    // Format riwayat chat (Claude menggunakan role 'user' dan 'assistant')
    const formattedMessages = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: msg.content || ' '
    }));
    
    // Instruksi sistem dipisah khusus untuk Claude
    const systemPrompt = `Anda adalah Penyuluh Agama Islam. Jawablah sesuai Al-Qur'an dan Sunnah dengan ramah dan menyejukkan. Topik saat ini: ${topic || 'Umum'}.`;

    // Memanggil API Claude
    const response = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 1500,
      system: systemPrompt,
      messages: formattedMessages
    });
    
    return res.status(200).json({ reply: response.content[0].text });

  } catch (error) {
    console.error("ERROR BACKEND CLAUDE:", error);
    return res.status(200).json({ 
      error: `SYSTEM ERROR: ${error.message || 'Terjadi kesalahan tidak dikenal'}` 
    });
  }
};
