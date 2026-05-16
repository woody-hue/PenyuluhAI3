import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    // Memanggil API Key dari Vercel Environment Variables
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API Key belum dipasang di setelan Vercel.' });
    }

    const { messages, topic } = req.body;
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Format riwayat chat
    const formattedHistory = messages.slice(0, -1).map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));
    
    const lastMessage = messages[messages.length - 1].content;
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      systemInstruction: `Anda adalah Penyuluh Agama Islam. Jawablah sesuai Al-Qur'an dan Sunnah dengan ramah. Topik saat ini: ${topic || 'Umum'}.`
    });

    const chat = model.startChat({ history: formattedHistory });
    const result = await chat.sendMessage(lastMessage);
    
    res.status(200).json({ reply: result.response.text() });

  } catch (error) {
    res.status(500).json({ error: 'Gagal merespons. Pastikan API Key valid.' });
  }
}
