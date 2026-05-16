import { GoogleGenerativeAI } from '@google/generative-ai';

// Inisialisasi Gemini menggunakan API Key dari Environment Variable Vercel
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  // Hanya menerima metode POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { messages, topic } = req.body;

    if (!messages || messages.length === 0) {
      return res.status(400).json({ error: 'Pesan tidak boleh kosong.' });
    }

    // Format riwayat percakapan agar sesuai dengan standar Gemini API
    // Gemini menggunakan role 'user' dan 'model'
    const formattedHistory = messages.slice(0, -1).map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));
    
    const lastMessage = messages[messages.length - 1].content;

    // Gunakan Gemini 1.5 Flash untuk respons yang cepat dan ringan
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      systemInstruction: `Anda adalah Asisten Penyuluh Agama Islam yang berdedikasi. Berikan jawaban yang menyejukkan, komprehensif, berdasarkan Al-Qur'an dan As-Sunnah. Gunakan bahasa Indonesia yang santun, terstruktur, dan mudah dipahami masyarakat luas, sejalan dengan fungsi bimbingan dan penyuluhan. Jika ditanya soal fiqih, berikan pandangan yang moderat dan sebutkan mazhab jika perlu. Topik diskusi saat ini: ${topic || 'Umum'}.`
    });

    const chat = model.startChat({
      history: formattedHistory,
    });

    const result = await chat.sendMessage(lastMessage);
    const response = await result.response;
    const text = response.text();

    // Kirim balasan kembali ke frontend HTML
    res.status(200).json({ reply: text });

  } catch (error) {
    console.error('AI Processing Error:', error);
    res.status(500).json({ 
      error: 'Mohon maaf, sistem sedang sibuk atau API Key belum dikonfigurasi. Silakan coba beberapa saat lagi.' 
    });
  }
}
