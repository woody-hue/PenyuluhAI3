const { GoogleGenerativeAI } = require('@google/generative-ai');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(200).json({ error: 'API Key Vercel belum dipasang (Variabel GEMINI_API_KEY kosong).' });
    }

    const { messages, topic } = req.body;
    
    if (!messages || messages.length === 0) {
      return res.status(200).json({ error: 'Pesan dari frontend kosong.' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    const lastMessage = messages[messages.length - 1].content;
    
    const formattedHistory = messages.slice(0, -1).map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content || ' ' }]
    }));
    
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      systemInstruction: `Anda adalah Penyuluh Agama Islam. Jawablah sesuai Al-Qur'an dan Sunnah dengan ramah. Topik saat ini: ${topic || 'Umum'}.`
    });

    const chat = model.startChat({ history: formattedHistory });
    const result = await chat.sendMessage(lastMessage);
    
    return res.status(200).json({ reply: result.response.text() });

  } catch (error) {
    console.error("ERROR BACKEND:", error);
    return res.status(200).json({ 
      error: `SYSTEM ERROR: ${error.message || 'Terjadi kesalahan tidak dikenal'}` 
    });
  }
};
