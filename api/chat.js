// Esto se ejecuta en el servidor, no en el navegador.
// Vercel/Netlify lo ejecutarán cuando llames a /api/chat

export default async function handler(req, res) {
  // 1. Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  // 2. Obtener la consulta del usuario
  const { userQuery } = req.body;
  if (!userQuery) {
    return res.status(400).json({ message: 'userQuery es requerido' });
  }

  // 3. Obtener la API Key SEGURA
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    return res.status(500).json({ message: 'API Key no configurada en el servidor' });
  }

  const genAIApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`;

  // 4. Definir el System Prompt del Chatbot
  const systemPrompt = `Eres un asistente virtual para un sitio web llamado "PsyConnect".
Tu única función es responder preguntas sobre el servicio que ofrece PsyConnect.
Reglas estrictas:
1.  **Qué es PsyConnect:** Es un servicio gratuito que conecta a usuarios con psicólogos. El usuario llena un cuestionario y la IA le muestra perfiles de especialistas compatibles. Es un "puente" o "conector", no una clínica.
2.  **Qué NO eres:** NO eres un psicólogo, terapeuta, ni médico. NO puedes dar consejos de salud mental, diagnósticos, opiniones sobre sentimientos, ni apoyo emocional.
3.  **Cómo manejar solicitudes de ayuda:** Si un usuario te pide ayuda psicológica, te dice que se siente mal, o te pregunta sobre terapia, DEBES RECHAZARLO AMABLEMENTE. Responde algo como: "Entiendo. Sin embargo, no soy un profesional de la salud mental y no puedo darte consejos. Mi única función es explicarte cómo PsyConnect puede ayudarte a *encontrar* un especialista. Si deseas comenzar, puedes llenar el cuestionario. Si estás en una crisis, por favor contacta a los servicios de emergencia de tu localidad."
4.  **Costo:** El servicio de PsyConnect (el cuestionario y la conexión) es gratuito. Los honorarios de cada psicólogo son aparte y se acuerdan con ellos.
5.  **Sé breve:** Responde en 2-3 frases cortas. Mantén un tono amable y profesional.`;

  const payload = {
      contents: [{ parts: [{ text: userQuery }] }],
      systemInstruction: {
          parts: [{ text: systemPrompt }]
      },
  };

  // 5. Llamar a la API de Gemini
  try {
    const apiResponse = await fetch(genAIApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      return res.status(apiResponse.status).json({ message: `Error de Gemini: ${errorText}` });
    }

    const data = await apiResponse.json();
    // 6. Enviar respuesta al frontend
    res.status(200).json(data);

  } catch (error) {
    res.status(500).json({ message: `Error interno del servidor: ${error.message}` });
  }
}
