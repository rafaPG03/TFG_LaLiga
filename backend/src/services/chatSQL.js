const ai = require("../config/gemini");
const SQL_CONTEXT = require("../prompts/promptChatBot");

async function generarSQL(pregunta) {
  const prompt = `
${SQL_CONTEXT}

Pregunta del usuario:
${pregunta}
`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  return response.text.trim();
}

module.exports = {
  generarSQL,
};