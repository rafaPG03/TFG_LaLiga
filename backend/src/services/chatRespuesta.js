const ai = require("../config/gemini");

async function generateNaturalAnswer({ pregunta, sql, rows }) {
  const prompt = `
Eres un asistente especializado en estadísticas de fútbol.

Tu tarea es responder al usuario en español de forma clara, breve y natural usando SOLO los datos proporcionados.

REGLAS:
- No inventes datos.
- No menciones SQL.
- No digas "según la consulta".
- Si el resultado está vacío, responde que no hay datos suficientes.
- Si hay un único valor, explica directamente el resultado.
- Si hay varios jugadores o equipos, resume los datos de forma comparativa.
- Responde en menos de 100 palabras.
- Usa un tono claro, útil y natural.

Pregunta del usuario:
${pregunta}

SQL ejecutado:
${sql}

Resultado obtenido en JSON:
${JSON.stringify(rows, null, 2)}
`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  return response.text.trim();
}

module.exports = {
  generateNaturalAnswer,
};