const fs = require("fs");
const path = require("path");
const { performance } = require("perf_hooks");

const DEFAULT_API_URL = "http://localhost:3000/api/chatbot";
const DEFAULT_DELAY_MS = 10000;
const DEFAULT_TIMEOUT_MS = 120000;
const MAX_HISTORY_MESSAGES = 12;
const MIN_SAFE_DELAY_MS = 10000;

const tests = [
  { id: 1, prompt: "¿Cuántos goles marcó Lionel Messi en la temporada 2015?" },
  { id: 2, prompt: "¿Qué equipo ganó más partidos en la temporada 2024?" },
  { id: 3, prompt: "Compara los goles y asistencias de Griezmann y Benzema en la temporada 2017." },
  { id: 4, prompt: "¿Cuáles fueron los 5 jugadores con mejor nota media en la temporada 2023?" },
  { id: 5, prompt: "¿Qué equipos tuvieron mejor diferencia de goles en la temporada 2022?" },
  { id: 6, prompt: "Dime los partidos que jugó el Real Madrid contra el Barcelona en la temporada 2021." },
  { id: 7, prompt: "¿Qué jugadores del Atlético de Madrid marcaron más goles en la temporada 2020?" },
  { id: 8, prompt: "¿Cuál fue la clasificación final de LaLiga en la temporada 2019?" },
  { id: 9, prompt: "¿Qué porteros hicieron más paradas en la temporada 2024?" },
  { id: 10, prompt: "¿Qué equipo tenía mejor estado de forma según los datos de minería de datos?" },
  { id: 11, session: "memoria-messi", prompt: "¿Cuántos goles marcó Messi en 2016?" },
  { id: 12, session: "memoria-messi", prompt: "¿Y en la temporada siguiente?" },
  { id: 13, session: "memoria-messi", prompt: "Compáralo con Cristiano Ronaldo en esa misma temporada." },
];

const getArgument = (name) => {
  const prefix = `--${name}=`;
  const argument = process.argv.find((value) => value.startsWith(prefix));
  return argument ? argument.slice(prefix.length) : null;
};

const parsePositiveNumber = (value, fallback, name) => {
  if (value == null) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`El argumento --${name} debe ser un número positivo`);
  }

  return parsed;
};

const wait = (milliseconds) => new Promise((resolve) => {
  setTimeout(resolve, milliseconds);
});

const percentile = (values, percentage) => {
  if (!values.length) {
    return null;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.ceil((percentage / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
};

const round = (value) => value == null ? null : Math.round(value);

const escapeCsv = (value) => {
  const text = value == null
    ? ""
    : typeof value === "string"
      ? value
      : JSON.stringify(value);

  return `"${text.replace(/"/g, '""')}"`;
};

const createSummary = (results, startedAt, finishedAt) => {
  const successfulResults = results.filter((result) => result.ok);
  const durations = successfulResults.map((result) => result.duration_ms);
  const average = durations.length
    ? durations.reduce((total, duration) => total + duration, 0) / durations.length
    : null;

  return {
    tests_total: results.length,
    tests_successful: successfulResults.length,
    tests_failed: results.length - successfulResults.length,
    success_rate_pct: results.length
      ? round((successfulResults.length / results.length) * 100)
      : 0,
    duration_min_ms: durations.length ? round(Math.min(...durations)) : null,
    duration_max_ms: durations.length ? round(Math.max(...durations)) : null,
    duration_average_ms: round(average),
    duration_median_ms: round(percentile(durations, 50)),
    duration_p95_ms: round(percentile(durations, 95)),
    benchmark_total_ms: finishedAt - startedAt,
  };
};

const toCsv = (results) => {
  const headers = [
    "id",
    "session",
    "question",
    "history_messages",
    "ok",
    "status",
    "duration_ms",
    "rows_count",
    "sql",
    "answer",
    "error",
  ];

  const rows = results.map((result) => [
    result.id,
    result.session,
    result.question,
    result.history_messages,
    result.ok,
    result.status,
    result.duration_ms,
    result.rows_count,
    result.sql,
    result.answer,
    result.error,
  ].map(escapeCsv).join(","));

  return [headers.join(","), ...rows].join("\n");
};

const saveResults = (results, config, startedAt) => {
  const finishedAt = Date.now();
  const summary = createSummary(results, startedAt, finishedAt);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outputDirectory = path.resolve(__dirname, "..", "performance-results");
  const baseName = `chatbot-${timestamp}`;
  const jsonPath = path.join(outputDirectory, `${baseName}.json`);
  const csvPath = path.join(outputDirectory, `${baseName}.csv`);

  fs.mkdirSync(outputDirectory, { recursive: true });
  fs.writeFileSync(jsonPath, JSON.stringify({ config, summary, results }, null, 2));
  fs.writeFileSync(csvPath, toCsv(results));

  return { jsonPath, csvPath, summary };
};

const runTest = async (test, history, apiUrl, timeoutMs) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const start = performance.now();

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pregunta: test.prompt, historial: history }),
      signal: controller.signal,
    });
    const rawBody = await response.text();
    const duration = performance.now() - start;
    let data = null;

    try {
      data = rawBody ? JSON.parse(rawBody) : {};
    } catch (error) {
      data = { error: `Respuesta no JSON: ${rawBody.slice(0, 300)}` };
    }

    return {
      id: test.id,
      session: test.session || "independiente",
      question: test.prompt,
      history_messages: history.length,
      ok: response.ok,
      status: response.status,
      duration_ms: round(duration),
      rows_count: Array.isArray(data?.resultado) ? data.resultado.length : 0,
      sql: data?.sql || "",
      answer: data?.respuesta || "",
      error: response.ok ? "" : data?.error || "Error desconocido",
    };
  } catch (error) {
    return {
      id: test.id,
      session: test.session || "independiente",
      question: test.prompt,
      history_messages: history.length,
      ok: false,
      status: 0,
      duration_ms: round(performance.now() - start),
      rows_count: 0,
      sql: "",
      answer: "",
      error: error.name === "AbortError"
        ? `Tiempo de espera agotado (${timeoutMs} ms)`
        : error.message,
    };
  } finally {
    clearTimeout(timeout);
  }
};

const main = async () => {
  const dryRun = process.argv.includes("--dry-run");
  const apiUrl = getArgument("url") || process.env.CHATBOT_API_URL || DEFAULT_API_URL;
  const delayMs = parsePositiveNumber(
    getArgument("delay-ms"),
    DEFAULT_DELAY_MS,
    "delay-ms"
  );
  const timeoutMs = parsePositiveNumber(
    getArgument("timeout-ms"),
    DEFAULT_TIMEOUT_MS,
    "timeout-ms"
  );

  if (delayMs < MIN_SAFE_DELAY_MS) {
    throw new Error(
      `La pausa mínima segura es ${MIN_SAFE_DELAY_MS} ms porque cada pregunta realiza dos llamadas a Gemini`
    );
  }

  if (dryRun) {
    console.log(JSON.stringify({ apiUrl, delayMs, timeoutMs, tests }, null, 2));
    return;
  }

  const config = {
    api_url: apiUrl,
    delay_ms: delayMs,
    timeout_ms: timeoutMs,
    tests: tests.length,
    memory_session: "memoria-messi",
  };
  const histories = new Map();
  const results = [];
  const startedAt = Date.now();

  console.log(`Iniciando ${tests.length} pruebas contra ${apiUrl}`);
  console.log(`Espera entre preguntas: ${delayMs} ms`);

  for (let index = 0; index < tests.length; index += 1) {
    const test = tests[index];
    const history = test.session ? histories.get(test.session) || [] : [];

    console.log(`[${index + 1}/${tests.length}] ${test.prompt}`);
    const result = await runTest(test, history, apiUrl, timeoutMs);
    results.push(result);

    console.log(
      `  ${result.ok ? "OK" : "ERROR"} | ${result.duration_ms} ms | `
      + `${result.rows_count} filas | historial: ${result.history_messages}`
    );

    if (test.session && result.ok && result.answer) {
      const updatedHistory = [
        ...history,
        { role: "user", text: test.prompt },
        { role: "assistant", text: result.answer },
      ].slice(-MAX_HISTORY_MESSAGES);
      histories.set(test.session, updatedHistory);
    }

    const isLastTest = index === tests.length - 1;
    if (!isLastTest) {
      await wait(delayMs);
    }
  }

  const output = saveResults(results, config, startedAt);

  console.log("Resumen:");
  console.log(JSON.stringify(output.summary, null, 2));
  console.log(`JSON: ${output.jsonPath}`);
  console.log(`CSV: ${output.csvPath}`);
};

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
