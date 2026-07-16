const { generarSQL } = require("../services/chatSQL");
const { generateNaturalAnswer } = require("../services/chatRespuesta");
const validateSQL = require("../utils/validatorSQL");
const { executeQuery } = require("../services/chatQuery");

const logChatbotDebug = (payload) => {
  console.log("[CHATBOT_DEBUG]", JSON.stringify(payload, null, 2));
};

const contestarPregunta = async (req, res) => {
  const startedAt = Date.now();
  let pregunta = null;
  let sql = null;

  try {
    ({ pregunta } = req.body || {});

    if (!pregunta) {
      return res.status(400).json({
        error: "La pregunta es obligatoria",
      });
    }

    sql = await generarSQL(pregunta);

    validateSQL(sql);

    const rows = await executeQuery(sql);

    const respuesta = await generateNaturalAnswer({
      pregunta,
      sql,
      rows,
    });

    logChatbotDebug({
      ok: true,
      pregunta,
      sql,
      rows_count: rows.length,
      rows_preview: rows.slice(0, 10),
      respuesta,
      duration_ms: Date.now() - startedAt,
    });

    return res.json({
      pregunta,
      respuesta,
      sql,
      resultado: rows,
    });
  } catch (error) {
    console.error("Error en /chat:", error);
    logChatbotDebug({
      ok: false,
      pregunta,
      sql,
      error: error.message,
      duration_ms: Date.now() - startedAt,
    });

    return res.status(500).json({
      error: "Error generando SQL",
    });
  }
};

module.exports = {
  contestarPregunta,
};
