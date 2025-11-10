// Esto se ejecuta en el servidor, no en el navegador.
// Vercel/Netlify lo ejecutarán cuando llames a /api/generateProfiles

export default async function handler(req, res) {
  // 1. Solo permitir solicitudes POST
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

  // 4. Definir el System Prompt y el Schema
  const systemPrompt = `Eres un generador de perfiles para PsyConnect. Basado en las necesidades del usuario, crea un array de 2 o 3 perfiles de especialistas *ficticios*. Adhiérete estrictamente al esquema JSON proporcionado.
El usuario ha proporcionado varias respuestas (razón, severidad, formato, estilo, etc.).
Tu tarea más importante es que la 'matchReason' (razón del match) sea un desglose detallado que conecte *múltiples* de estas respuestas con el perfil del especialista. Sé específico.
Ejemplo: 'Como buscas terapia online (formato) para una ansiedad que te afecta severamente (severidad) y prefieres un enfoque práctico (estilo), la Dra. Luna es ideal por su experiencia en TCC para trastornos de ansiedad en modalidad virtual.'`;
                
  const jsonSchema = {
      "type": "ARRAY",
      "items": {
          "type": "OBJECT",
          "properties": {
              "name": { "type": "STRING", "description": "Nombre ficticio (Ej. Dra. Isabel Luna)" },
              "specialty": { "type": "STRING", "description": "Especialidad principal (Ej. Terapia Cognitivo-Conductual)" },
              "description": { "type": "STRING", "description": "Breve descripción (Ej. 10 años de experiencia en ansiedad...)" },
              "matchReason": { "type": "STRING", "description": "Razón personalizada y detallada de por qué es un buen match, conectando múltiples respuestas del usuario." }
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
