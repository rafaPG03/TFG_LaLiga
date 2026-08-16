const { generarSQL } = require("../services/chatSQL");
const { generateNaturalAnswer } = require("../services/chatRespuesta");
const validateSQL = require("../utils/validatorSQL");
const { executeQuery } = require("../services/chatQuery");
const { normalizarHistorial } = require("../utils/historialChat");

const logChatbotDebug = (payload) => {
  console.log("[CHATBOT_DEBUG]", JSON.stringify(payload, null, 2));
};

const contestarPregunta = async (req, res) => {
  const startedAt = Date.now();
  let pregunta = null;
  let sql = null;
  let historial = [];

  try {
    ({ pregunta } = req.body || {});

    if (typeof pregunta !== "string" || !pregunta.trim()) {
      return res.status(400).json({
        error: "La pregunta es obligatoria",
      });
    }

    pregunta = pregunta.trim();
    historial = normalizarHistorial(req.body?.historial);

    sql = await generarSQL(pregunta, historial);

    validateSQL(sql);

    const rows = await executeQuery(sql);

    const respuesta = await generateNaturalAnswer({
      pregunta,
      sql,
      rows,
      historial,
    });

    logChatbotDebug({
      ok: true,
      pregunta,
      historial_count: historial.length,
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
      historial_count: historial.length,
      sql,
      error: error.message,
      duration_ms: Date.now() - startedAt,
    });

    return res.status(error.statusCode || 500).json({
      error: error.statusCode ? error.message : "Error generando SQL",
    });
  }
};

module.exports = {
  contestarPregunta,
};
