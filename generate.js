export default async function handler(req, res) {
  // 1. Solo permitir solicitudes POST (buenas prácticas)
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  // 2. Obtener el 'userPrompt' que envió el frontend
  const { userPrompt } = req.body;

  if (!userPrompt) {
    return res.status(400).json({ message: 'userPrompt es requerido' });
  }

  // 3. Obtener la API Key de forma SEGURA (Variables de Entorno)
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    return res.status(500).json({ message: 'API Key no configurada en el servidor' });
  }

  const genAIApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`;

  // 4. Definir el System Prompt y el Schema (igual que antes)
  const systemPrompt = `Eres un generador de perfiles para PsyConnect... [Tu prompt de sistema completo aquí] ...`;
  const jsonSchema = {
    "type": "ARRAY",
    "items": {
      "type": "OBJECT",
      "properties": {
        "name": { "type": "STRING" },
        "specialty": { "type": "STRING" },
        "description": { "type": "STRING" },
        "matchReason": { "type": "STRING" }
      },
      "required": ["name", "specialty", "description", "matchReason"]
    }
  };

  const payload = {
    contents: [{ parts: [{ text: userPrompt }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: jsonSchema
    }
  };

  // 5. Llamar a la API de Gemini (desde el servidor)
  try {
    const apiResponse = await fetch(genAIApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!apiResponse.ok) {
      // Si Gemini da error, pasarlo al frontend
      const errorText = await apiResponse.text();
      return res.status(apiResponse.status).json({ message: `Error de Gemini: ${errorText}` });
    }

    const data = await apiResponse.json();

    // 6. Enviar la respuesta exitosa de vuelta al frontend
    res.status(200).json(data);

  } catch (error) {
    res.status(500).json({ message: `Error interno del servidor: ${error.message}` });
  }
}
