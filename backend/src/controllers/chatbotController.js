const { generarSQL } = require("../services/chatSQL");
const { generateNaturalAnswer } = require("../services/chatRespuesta");
const validateSQL = require("../utils/validatorSQL");
const { executeQuery } = require("../services/chatQuery");
const { normalizarHistorial } = require("../utils/historialChat");

const CHATBOT_TIMEOUT_MS = 10000;
const CHATBOT_TIMEOUT_CODE = "CHATBOT_TIMEOUT";
const CHATBOT_TIMEOUT_MESSAGE = "La consulta está tardando demasiado. Intenta indicar de forma más concreta el jugador, equipo, temporada o estadística que buscas.";

const createTimeoutError = () => {
  const error = new Error(CHATBOT_TIMEOUT_MESSAGE);
  error.statusCode = 504;
  error.code = CHATBOT_TIMEOUT_CODE;
  return error;
};

const logChatbotDebug = (payload) => {
  console.log("[CHATBOT_DEBUG]", JSON.stringify(payload, null, 2));
};

const contestarPregunta = async (req, res) => {
  const startedAt = Date.now();
  let pregunta = null;
  let sql = null;
  let historial = [];
  let timeoutId = null;
  const abortController = new AbortController();

  try {
    ({ pregunta } = req.body || {});

    if (typeof pregunta !== "string" || !pregunta.trim()) {
      return res.status(400).json({
        error: "La pregunta es obligatoria",
      });
    }

    pregunta = pregunta.trim();
    historial = normalizarHistorial(req.body?.historial);

    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        abortController.abort();
        reject(createTimeoutError());
      }, CHATBOT_TIMEOUT_MS);
    });

    const chatbotPromise = async () => {
      sql = await generarSQL(pregunta, historial, abortController.signal);

      validateSQL(sql);

      const rows = await executeQuery(sql, CHATBOT_TIMEOUT_MS);

      const respuesta = await generateNaturalAnswer({
        pregunta,
        sql,
        rows,
        historial,
        signal: abortController.signal,
      });

      return { rows, respuesta };
    };

    const { rows, respuesta } = await Promise.race([
      chatbotPromise(),
      timeoutPromise,
    ]);

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
    const finalError = abortController.signal.aborted
      && error.code !== CHATBOT_TIMEOUT_CODE
      ? createTimeoutError()
      : error;

    console.error("Error en /chat:", finalError);
    logChatbotDebug({
      ok: false,
      pregunta,
      historial_count: historial.length,
      sql,
      error: finalError.message,
      duration_ms: Date.now() - startedAt,
    });

    return res.status(finalError.statusCode || 500).json({
      code: finalError.code || "CHATBOT_ERROR",
      error: finalError.statusCode ? finalError.message : "Error generando SQL",
    });
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

module.exports = {
  contestarPregunta,
};
