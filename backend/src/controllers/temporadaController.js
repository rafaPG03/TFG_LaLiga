const pool = require("../config/db");

const parseEntero = (valor) => {
  const n = Number(valor);
  return Number.isInteger(n) ? n : null;
};

const parseNumero = (valor, fallback = null) => {
  if (valor === null || valor === undefined || valor === "") {
    return fallback;
  }

  const n = Number(valor);
  return Number.isFinite(n) ? n : fallback;
};

const toIntOrNull = (valor) => {
  const n = parseNumero(valor, null);
  return n === null ? null : Math.trunc(n);
};

const RANKING_METRICAS = {
  nota_media: {
    label: "Nota media",
    grupo: "General",
    orden: "DESC",
    precision: 2,
    per90: false,
    expresion: "COALESCE(h.nota_media, 0)::numeric",
  },
  partidos: {
    label: "Partidos",
    grupo: "General",
    orden: "DESC",
    precision: 0,
    per90: true,
    expresion: "COALESCE(h.partidos, 0)::numeric",
  },
  minutos: {
    label: "Minutos",
    grupo: "General",
    orden: "DESC",
    precision: 0,
    per90: false,
    expresion: "COALESCE(h.minutos, 0)::numeric",
  },
  titular: {
    label: "Titularidades",
    grupo: "General",
    orden: "DESC",
    precision: 0,
    per90: true,
    expresion: "COALESCE(h.titular, 0)::numeric",
  },
  paradas: {
    label: "Paradas",
    grupo: "Porteria",
    orden: "DESC",
    precision: 0,
    per90: true,
    expresion: "COALESCE(h.paradas, 0)::numeric",
  },
  goles_concedidos: {
    label: "Goles concedidos",
    grupo: "Porteria",
    orden: "ASC",
    precision: 0,
    per90: true,
    expresion: "COALESCE(h.goles_concedidos, 0)::numeric",
  },
  penaltis_parados: {
    label: "Penaltis parados",
    grupo: "Porteria",
    orden: "DESC",
    precision: 0,
    per90: true,
    expresion: "COALESCE(h.penaltis_parados, 0)::numeric",
  },
  entradas: {
    label: "Entradas",
    grupo: "Defensa",
    orden: "DESC",
    precision: 0,
    per90: true,
    expresion: "COALESCE(h.entradas, 0)::numeric",
  },
  bloqueos: {
    label: "Bloqueos",
    grupo: "Defensa",
    orden: "DESC",
    precision: 0,
    per90: true,
    expresion: "COALESCE(h.bloqueos, 0)::numeric",
  },
  intercepciones: {
    label: "Intercepciones",
    grupo: "Defensa",
    orden: "DESC",
    precision: 0,
    per90: true,
    expresion: "COALESCE(h.intercepciones, 0)::numeric",
  },
  duelos_ganados: {
    label: "Duelos ganados",
    grupo: "Defensa",
    orden: "DESC",
    precision: 0,
    per90: true,
    expresion: "COALESCE(h.duelos_ganados, 0)::numeric",
  },
  duelos_totales: {
    label: "Duelos totales",
    grupo: "Defensa",
    orden: "DESC",
    precision: 0,
    per90: true,
    expresion: "COALESCE(h.duelos_totales, 0)::numeric",
  },
  faltas_cometidas: {
    label: "Faltas cometidas",
    grupo: "Defensa",
    orden: "ASC",
    precision: 0,
    per90: true,
    expresion: "COALESCE(h.faltas_cometidas, 0)::numeric",
  },
  regateado: {
    label: "Regateado",
    grupo: "Defensa",
    orden: "DESC",
    precision: 0,
    per90: true,
    expresion: "COALESCE(h.regateado, 0)::numeric",
  },
  amarillas: {
    label: "Amarillas",
    grupo: "Defensa",
    orden: "DESC",
    precision: 0,
    per90: true,
    expresion: "COALESCE(h.amarillas, 0)::numeric",
  },
  rojas: {
    label: "Rojas",
    grupo: "Defensa",
    orden: "DESC",
    precision: 0,
    per90: true,
    expresion: "COALESCE(h.rojas, 0)::numeric",
  },
  asistencias: {
    label: "Asistencias",
    grupo: "Creacion",
    orden: "DESC",
    precision: 0,
    per90: true,
    expresion: "COALESCE(h.asistencias, 0)::numeric",
  },
  pases_totales: {
    label: "Pases totales",
    grupo: "Creacion",
    orden: "DESC",
    precision: 0,
    per90: true,
    expresion: "COALESCE(h.pases_totales, 0)::numeric",
  },
  pases_clave: {
    label: "Pases clave",
    grupo: "Creacion",
    orden: "DESC",
    precision: 0,
    per90: true,
    expresion: "COALESCE(h.pases_clave, 0)::numeric",
  },
  precision_pases: {
    label: "Precision pases",
    grupo: "Creacion",
    orden: "DESC",
    precision: 0,
    per90: false,
    expresion: "COALESCE(h.precision_pases, 0)::numeric",
  },
  regates_intentados: {
    label: "Regates intentados",
    grupo: "Creacion",
    orden: "DESC",
    precision: 0,
    per90: true,
    expresion: "COALESCE(h.regates_intentados, 0)::numeric",
  },
  regates_exito: {
    label: "Regates exitosos",
    grupo: "Creacion",
    orden: "DESC",
    precision: 0,
    per90: true,
    expresion: "COALESCE(h.regates_exito, 0)::numeric",
  },
  goles: {
    label: "Goles",
    grupo: "Ataque",
    orden: "DESC",
    precision: 0,
    per90: true,
    expresion: "COALESCE(h.goles, 0)::numeric",
  },
  tiros_totales: {
    label: "Tiros totales",
    grupo: "Ataque",
    orden: "DESC",
    precision: 0,
    per90: true,
    expresion: "COALESCE(h.tiros_totales, 0)::numeric",
  },
  tiros_a_puerta: {
    label: "Tiros a puerta",
    grupo: "Ataque",
    orden: "DESC",
    precision: 0,
    per90: true,
    expresion: "COALESCE(h.tiros_a_puerta, 0)::numeric",
  },
  faltas_sufridas: {
    label: "Faltas sufridas",
    grupo: "Ataque",
    orden: "DESC",
    precision: 0,
    per90: true,
    expresion: "COALESCE(h.faltas_sufridas, 0)::numeric",
  },
  penaltis_marcados: {
    label: "Penaltis marcados",
    grupo: "Ataque",
    orden: "DESC",
    precision: 0,
    per90: true,
    expresion: "COALESCE(h.penaltis_marcados, 0)::numeric",
  },
};

const MIN_MINUTOS_POR90 = 450;
const MIN_PARTIDOS_POR90 = 5;

const RANKING_POSICIONES = {
  POR: ["P", "POR", "PORTERO"],
  DF: ["DF", "DEF", "DEFENSA"],
  MED: ["M", "MED", "MEDIOCENTRO"],
  DEL: ["DL", "DEL", "DELANTERO"],
};

const getRankingsTemporada = async (req, res) => {
  try {
    const temporada = parseEntero(req.query.temporada);
    const atributo = String(req.query.atributo || "nota_media").toLowerCase();
    const modo = String(req.query.modo || "total").toLowerCase();
    const posicion = String(req.query.posicion || "TODAS").toUpperCase();

    if (!temporada) {
      return res
        .status(400)
        .json({ error: "Debes proporcionar una temporada" });
    }

    const metric = RANKING_METRICAS[atributo];

    if (!metric) {
      return res.status(400).json({ error: "Atributo de ranking invalido" });
    }

    const posicionValores =
      posicion === "TODAS" ? null : RANKING_POSICIONES[posicion];

    if (posicion !== "TODAS" && !posicionValores) {
      return res.status(400).json({ error: "Posicion de ranking invalida" });
    }

    const expresionValor =
      modo === "por90" && metric.per90
        ? `ROUND((COALESCE(base.valor_base, 0)::numeric * 90) / NULLIF(COALESCE(base.minutos, 0), 0), 2)`
        : "base.valor_base";

    const query = `
            WITH base AS (
                SELECT
                    h.id_jugador,
                    j.nombre,
                    j.foto,
                    h.id_equipo,
                    e.nombre_equipo,
                    e.logo,
                    h.posicion,
                    CASE
                        WHEN UPPER(TRIM(COALESCE(h.posicion, ''))) IN ('P', 'POR', 'PORTERO') THEN 'POR'
                        WHEN UPPER(TRIM(COALESCE(h.posicion, ''))) IN ('DF', 'DEF', 'DEFENSA') THEN 'DF'
                        WHEN UPPER(TRIM(COALESCE(h.posicion, ''))) IN ('M', 'MED', 'MEDIOCENTRO') THEN 'MED'
                        WHEN UPPER(TRIM(COALESCE(h.posicion, ''))) IN ('DL', 'DEL', 'DELANTERO') THEN 'DEL'
                        ELSE NULL
                    END AS posicion_codigo,
                    h.partidos,
                    h.minutos,
                    ${metric.expresion} AS valor_base
                FROM h_jugador_temporada h
                JOIN dim_jugador j ON h.id_jugador = j.id_jugador
                LEFT JOIN dim_equipo e ON h.id_equipo = e.id_equipo
                WHERE h.temporada = $1
            )
            SELECT
                base.id_jugador,
                base.nombre,
                base.foto,
                base.id_equipo,
                base.nombre_equipo,
                base.logo,
                base.posicion,
                base.posicion_codigo,
                base.partidos,
                base.minutos,
                ${expresionValor} AS valor
            FROM base
            WHERE ($2::text IS NULL OR base.posicion_codigo = $2)
              AND (
                $3::boolean = FALSE
                OR (
                  COALESCE(base.minutos, 0) >= $4
                  AND COALESCE(base.partidos, 0) >= $5
                )
              )
            ORDER BY valor ${metric.orden} NULLS LAST, base.partidos DESC NULLS LAST, base.minutos DESC NULLS LAST, base.nombre ASC
            LIMIT 25
        `;

    const result = await pool.query(query, [
      temporada,
      posicionValores ? posicion : null,
      modo === "por90",
      MIN_MINUTOS_POR90,
      MIN_PARTIDOS_POR90,
    ]);

    res.json({
      temporada,
      atributo,
      modo,
      posicion: posicionValores ? posicion : "TODAS",
      metadatos: {
        atributo_label: metric.label,
        grupo: metric.grupo,
      },
      rankings: result.rows || [],
    });
  } catch (error) {
    console.error("Error al obtener rankings de temporada:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const getGraficosTemporada = async (req, res) => {
  try {
    const temporada = parseEntero(req.query.temporada);

    if (!temporada) {
      return res
        .status(400)
        .json({ error: "Debes proporcionar una temporada" });
    }

    const queryEquipos = `
            WITH ultimos_equipos AS (
                SELECT DISTINCT ON (h.id_equipo)
                    h.id_equipo,
                    h.jornada,
                    h.posicion,
                    h.puntos,
                    h.dg,
                    h.partidos_jugados,
                    h.gf,
                    h.gc,
                    h.nombre_equipo
                FROM h_equipo_temporada h
                WHERE h.temporada = $1
                ORDER BY h.id_equipo, h.jornada DESC
            ),
            equipos_anterior AS (
                SELECT DISTINCT ON (h.id_equipo)
                    h.id_equipo,
                    h.puntos AS puntos_ano_pasado
                FROM h_equipo_temporada h
                WHERE h.temporada = $2
                ORDER BY h.id_equipo, h.jornada DESC
            )
            SELECT
                u.id_equipo,
                COALESCE(u.nombre_equipo, e.nombre_equipo) AS nombre,
                e.logo,
                u.gf AS goles_favor,
                u.gc AS goles_contra,
                u.puntos,
                COALESCE(a.puntos_ano_pasado, 0) AS puntos_ano_pasado,
                u.partidos_jugados,
                u.jornada
            FROM ultimos_equipos u
            LEFT JOIN equipos_anterior a ON a.id_equipo = u.id_equipo
            LEFT JOIN dim_equipo e ON e.id_equipo = u.id_equipo
            ORDER BY COALESCE(u.puntos, 0) DESC, COALESCE(u.gf, 0) DESC, COALESCE(u.gc, 0) ASC, nombre ASC
        `;

    const queryJugadores = `
            SELECT
                h.id_jugador,
                h.id_equipo,
                j.nombre,
                h.posicion,
                h.partidos,
                h.minutos,
                h.nota_media,
                h.goles,
                h.asistencias,
                h.tiros_totales,
                h.pases_totales,
                h.pases_clave,
                h.precision_pases,
                h.entradas,
                h.bloqueos,
                h.intercepciones
            FROM h_jugador_temporada h
            LEFT JOIN dim_jugador j ON j.id_jugador = h.id_jugador
            WHERE h.temporada = $1
            ORDER BY COALESCE(h.minutos, 0) DESC, COALESCE(h.nota_media, 0) DESC, COALESCE(h.goles, 0) DESC, COALESCE(j.nombre, '') ASC
        `;

    const queryPartidosTotales = `
            SELECT COUNT(*) AS partidos_totales_liga
            FROM dim_partidos p
            WHERE p.temporada = $1
              AND p.status = 'Completado'
        `;

    const [equiposRes, jugadoresRes, partidosRes] = await Promise.all([
      pool.query(queryEquipos, [temporada, temporada - 1]),
      pool.query(queryJugadores, [temporada]),
      pool.query(queryPartidosTotales, [temporada]),
    ]);

    const equipos = (equiposRes.rows || []).map((equipo) => ({
      id_equipo: toIntOrNull(equipo.id_equipo),
      nombre: equipo.nombre ?? "",
      logo: equipo.logo ?? null,
      goles_favor: toIntOrNull(equipo.goles_favor) ?? 0,
      goles_contra: toIntOrNull(equipo.goles_contra) ?? 0,
      puntos: toIntOrNull(equipo.puntos) ?? 0,
      puntos_ano_pasado: toIntOrNull(equipo.puntos_ano_pasado) ?? 0,
      partidos_jugados: toIntOrNull(equipo.partidos_jugados) ?? 0,
      jornada: toIntOrNull(equipo.jornada) ?? null,
    }));

    const jugadores = (jugadoresRes.rows || []).map((jugador) => ({
      id_jugador: toIntOrNull(jugador.id_jugador),
      id_equipo: toIntOrNull(jugador.id_equipo),
      nombre: jugador.nombre ?? "",
      posicion: jugador.posicion ?? "",
      partidos: toIntOrNull(jugador.partidos) ?? 0,
      minutos: toIntOrNull(jugador.minutos) ?? 0,
      nota_media: parseNumero(jugador.nota_media, 0),
      goles: toIntOrNull(jugador.goles) ?? 0,
      asistencias: toIntOrNull(jugador.asistencias) ?? 0,
      tiros_totales: toIntOrNull(jugador.tiros_totales) ?? 0,
      pases_totales: toIntOrNull(jugador.pases_totales) ?? 0,
      pases_clave: toIntOrNull(jugador.pases_clave) ?? 0,
      precision_pases: toIntOrNull(jugador.precision_pases) ?? 0,
      entradas: toIntOrNull(jugador.entradas) ?? 0,
      bloqueos: toIntOrNull(jugador.bloqueos) ?? 0,
      intercepciones: toIntOrNull(jugador.intercepciones) ?? 0,
    }));

    const jornadaMaxima = equipos.reduce(
      (max, equipo) => Math.max(max, equipo.jornada ?? 0),
      0,
    );

    res.json({
      temporada,
      jornada_maxima: jornadaMaxima || null,
      partidos_totales_liga:
        toIntOrNull(partidosRes.rows[0]?.partidos_totales_liga) ?? 0,
      equipos,
      jugadores,
    });
  } catch (error) {
    console.error("Error al obtener los graficos de temporada:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const getTemporadas = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT DISTINCT temporada FROM dim_partidos ORDER BY temporada DESC",
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener las temporadas:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const getClasificacion = async (req, res) => {
  try {
    const { anno, jornada } = req.query;

    let query = `
            SELECT *
            FROM h_equipo_temporada
            WHERE temporada = ${anno ? "$1" : "(SELECT MAX(temporada) FROM h_equipo_temporada)"}
              AND jornada = ${
                jornada
                  ? anno
                    ? "$2"
                    : "$1"
                  : `(
                  SELECT MAX(jornada) 
                  FROM h_equipo_temporada 
                  WHERE temporada = ${anno ? "$1" : "(SELECT MAX(temporada) FROM h_equipo_temporada)"}
              )`
              }
            ORDER BY posicion ASC
        `;

    // Gestionamos los parámetros que enviamos a la consulta
    let params = [];
    if (anno && jornada) {
      params = [anno, jornada];
    } else if (anno) {
      params = [anno];
    } else if (jornada) {
      params = [jornada];
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener la clasificación:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const getMontecarloTemporada = async (req, res) => {
  try {
    const temporadaSolicitada = parseEntero(req.query.temporada);

    const temporadaActualResult = await pool.query(
      "SELECT MAX(temporada) AS temporada FROM h_equipo_temporada",
    );
    const temporadaActual = toIntOrNull(
      temporadaActualResult.rows[0]?.temporada,
    );
    const temporada = temporadaSolicitada ?? temporadaActual;

    if (!temporada) {
      return res
        .status(400)
        .json({ error: "Debes proporcionar una temporada" });
    }

    const esTemporadaActual = temporada === temporadaActual;

    if (esTemporadaActual) {
      const queryActual = `
        WITH ultima_clasificacion AS (
          SELECT DISTINCT ON (h.id_equipo)
            h.id_equipo,
            h.nombre_equipo,
            h.posicion,
            h.temporada,
            h.jornada
          FROM h_equipo_temporada h
          WHERE h.temporada = $1
          ORDER BY h.id_equipo, h.jornada DESC
        )
        SELECT
          c.id_equipo,
          COALESCE(m.equipo, e.nombre_equipo, c.nombre_equipo) AS nombre_equipo,
          e.codigo,
          e.logo,
          c.posicion,
          COALESCE(m.campeon_pct, 0)::numeric AS campeon_pct,
          COALESCE(m.champions_pct, 0)::numeric AS champions_pct,
          COALESCE(m.europa_pct, 0)::numeric AS europa_pct,
          COALESCE(m.media_tabla_pct, 0)::numeric AS media_tabla_pct,
          COALESCE(m.descenso_pct, 0)::numeric AS descenso_pct
        FROM ultima_clasificacion c
        LEFT JOIN dm_simulacion_montecarlo m ON m.id_equipo = c.id_equipo
        LEFT JOIN dim_equipo e ON e.id_equipo = c.id_equipo
        ORDER BY c.posicion ASC;
      `;

      const result = await pool.query(queryActual, [temporada]);

      return res.json({
        temporada,
        temporada_actual: temporadaActual,
        es_temporada_actual: true,
        montecarlo: result.rows || [],
      });
    }

    const queryHistorica = `
      WITH ultima_jornada AS (
        SELECT MAX(jornada) AS jornada
        FROM h_equipo_temporada
        WHERE temporada = $1
      )
      SELECT
        h.id_equipo,
        COALESCE(e.nombre_equipo, h.nombre_equipo) AS nombre_equipo,
        e.codigo,
        e.logo,
        h.posicion,
        CASE WHEN h.posicion = 1 THEN 100 ELSE 0 END::numeric AS campeon_pct,
        CASE WHEN h.posicion BETWEEN 1 AND 4 THEN 100 ELSE 0 END::numeric AS champions_pct,
        CASE WHEN h.posicion BETWEEN 1 AND 7 THEN 100 ELSE 0 END::numeric AS europa_pct,
        CASE WHEN h.posicion BETWEEN 8 AND 17 THEN 100 ELSE 0 END::numeric AS media_tabla_pct,
        CASE WHEN h.posicion BETWEEN 18 AND 20 THEN 100 ELSE 0 END::numeric AS descenso_pct
      FROM h_equipo_temporada h
      JOIN ultima_jornada uj ON uj.jornada = h.jornada
      LEFT JOIN dim_equipo e ON e.id_equipo = h.id_equipo
      WHERE h.temporada = $1
      ORDER BY h.posicion ASC;
    `;

    const result = await pool.query(queryHistorica, [temporada]);

    res.json({
      temporada,
      temporada_actual: temporadaActual,
      es_temporada_actual: false,
      montecarlo: result.rows || [],
    });
  } catch (error) {
    console.error("Error al obtener la simulacion Montecarlo:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const getPartidosSimulacionJornada = async (req, res) => {
  try {
    const jornadaSolicitada = parseEntero(req.query.jornada);

    if (!jornadaSolicitada) {
      return res.status(400).json({ error: "Debes proporcionar una jornada" });
    }

    const temporadaActualResult = await pool.query(
      "SELECT MAX(temporada) AS temporada FROM dim_partidos",
    );
    const temporadaActual = toIntOrNull(
      temporadaActualResult.rows[0]?.temporada,
    );

    if (!temporadaActual) {
      return res
        .status(404)
        .json({ error: "No hay temporada actual disponible" });
    }

    const partidos = await obtenerPartidosSimulacion(
      temporadaActual,
      jornadaSolicitada,
    );

    res.json({
      temporada: temporadaActual,
      jornada: jornadaSolicitada,
      partidos,
    });
  } catch (error) {
    console.error("Error al obtener partidos de simulacion:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const obtenerPartidosSimulacion = async (temporada, jornada) => {
  const query = `
    SELECT
      p.id_partido,
      p.id_local,
      p.id_visitante,
      p.goles_local,
      p.goles_visitante,
      p.status,
      p.hora,
      t.jornada,
      t.anio,
      t.mes,
      t.dia,
      TO_CHAR(MAKE_DATE(t.anio, t.mes, t.dia), 'YYYY-MM-DD') AS fecha_iso,
      el.nombre_equipo AS equipo_local,
      el.codigo AS codigo_local,
      el.logo AS logo_local,
      ev.nombre_equipo AS equipo_visitante,
      ev.codigo AS codigo_visitante,
      ev.logo AS logo_visitante
    FROM dim_partidos p
    JOIN dim_tiempo t ON p.id_tiempo = t.id_tiempo
    JOIN dim_equipo el ON p.id_local = el.id_equipo
    JOIN dim_equipo ev ON p.id_visitante = ev.id_equipo
    WHERE p.temporada = $1
      AND t.jornada = $2
    ORDER BY t.anio ASC, t.mes ASC, t.dia ASC, p.hora ASC, p.id_partido ASC;
  `;

  const result = await pool.query(query, [temporada, jornada]);
  return result.rows || [];
};

const getSimulacionTemporadaInicial = async (_req, res) => {
  try {
    const temporadaActualResult = await pool.query(
      "SELECT MAX(temporada) AS temporada FROM dim_partidos",
    );
    const temporadaActual = toIntOrNull(
      temporadaActualResult.rows[0]?.temporada,
    );

    if (!temporadaActual) {
      return res
        .status(404)
        .json({ error: "No hay temporada actual disponible" });
    }

    const queryJornadas = `
      SELECT DISTINCT t.jornada
      FROM dim_partidos p
      JOIN dim_tiempo t ON p.id_tiempo = t.id_tiempo
      WHERE p.temporada = $1
      ORDER BY t.jornada ASC;
    `;

    const queryJornadaActual = `
      SELECT COALESCE(
        (
          SELECT MIN(t.jornada)
          FROM dim_partidos p
          JOIN dim_tiempo t ON p.id_tiempo = t.id_tiempo
          WHERE p.temporada = $1
            AND COALESCE(p.status, '') <> 'Completado'
        ),
        (
          SELECT MAX(t.jornada)
          FROM dim_partidos p
          JOIN dim_tiempo t ON p.id_tiempo = t.id_tiempo
          WHERE p.temporada = $1
        )
      ) AS jornada_actual;
    `;

    const queryClasificacion = `
      WITH ultima_jornada AS (
        SELECT MAX(jornada) AS jornada
        FROM h_equipo_temporada
        WHERE temporada = $1
      )
      SELECT
        h.id_equipo,
        COALESCE(e.nombre_equipo, h.nombre_equipo) AS nombre_equipo,
        e.codigo,
        e.logo,
        h.posicion,
        h.puntos,
        h.partidos_jugados,
        h.victorias,
        h.empates,
        h.derrotas,
        h.gf,
        h.gc,
        h.dg
      FROM h_equipo_temporada h
      JOIN ultima_jornada uj ON uj.jornada = h.jornada
      LEFT JOIN dim_equipo e ON e.id_equipo = h.id_equipo
      WHERE h.temporada = $1
      ORDER BY h.posicion ASC;
    `;

    const queryMontecarlo = `
      WITH ultima_clasificacion AS (
        SELECT DISTINCT ON (h.id_equipo)
          h.id_equipo,
          h.nombre_equipo,
          h.posicion,
          h.temporada,
          h.jornada
        FROM h_equipo_temporada h
        WHERE h.temporada = $1
        ORDER BY h.id_equipo, h.jornada DESC
      )
      SELECT
        c.id_equipo,
        COALESCE(m.equipo, e.nombre_equipo, c.nombre_equipo) AS nombre_equipo,
        e.codigo,
        e.logo,
        c.posicion,
        COALESCE(m.campeon_pct, 0)::numeric AS campeon_pct,
        COALESCE(m.champions_pct, 0)::numeric AS champions_pct,
        COALESCE(m.europa_pct, 0)::numeric AS europa_pct,
        COALESCE(m.media_tabla_pct, 0)::numeric AS media_tabla_pct,
        COALESCE(m.descenso_pct, 0)::numeric AS descenso_pct
      FROM ultima_clasificacion c
      LEFT JOIN dm_simulacion_montecarlo m ON m.id_equipo = c.id_equipo
      LEFT JOIN dim_equipo e ON e.id_equipo = c.id_equipo
      ORDER BY c.posicion ASC;
    `;

    const [jornadasRes, jornadaActualRes, clasificacionRes, montecarloRes] =
      await Promise.all([
        pool.query(queryJornadas, [temporadaActual]),
        pool.query(queryJornadaActual, [temporadaActual]),
        pool.query(queryClasificacion, [temporadaActual]),
        pool.query(queryMontecarlo, [temporadaActual]),
      ]);

    const jornadas = (jornadasRes.rows || [])
      .map((row) => toIntOrNull(row.jornada))
      .filter((jornada) => jornada !== null);
    const jornadaActual =
      toIntOrNull(jornadaActualRes.rows[0]?.jornada_actual) ??
      jornadas[jornadas.length - 1] ??
      null;
    const partidos = jornadaActual
      ? await obtenerPartidosSimulacion(temporadaActual, jornadaActual)
      : [];

    res.json({
      temporada: temporadaActual,
      jornada_actual: jornadaActual,
      jornadas,
      partidos,
      clasificacion: clasificacionRes.rows || [],
      montecarlo: montecarloRes.rows || [],
    });
  } catch (error) {
    console.error("Error al obtener datos iniciales de simulacion:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const getResumenTemporada = async (req, res) => {
  try {
    const temporada = parseEntero(req.query.temporada);

    if (!temporada) {
      return res
        .status(400)
        .json({ error: "Debes proporcionar una temporada" });
    }

    const queryTotales = `
            SELECT
                COUNT(*) FILTER (WHERE p.status = 'Completado') AS partidos_jugados,
                COALESCE(SUM(
                    CASE
                        WHEN p.status = 'Completado' THEN COALESCE(p.goles_local, 0) + COALESCE(p.goles_visitante, 0)
                        ELSE 0
                    END
                ), 0) AS goles_total
            FROM dim_partidos p
            WHERE p.temporada = $1
        `;

    const queryTarjetas = `
            SELECT
                COALESCE(SUM(COALESCE(h.amarilla, 0)), 0) AS amarillas_total,
                COALESCE(SUM(COALESCE(h.roja, 0)), 0) AS rojas_total
            FROM h_jugador_partido h
            JOIN dim_partidos p ON h.id_partido = p.id_partido
            WHERE p.temporada = $1
              AND p.status = 'Completado'
        `;

    const queryMejores = `
            WITH partidos AS (
                SELECT
                    p.id_partido,
                    p.id_local,
                    p.id_visitante,
                    t.anio,
                    t.mes,
                    t.dia,
                    t.nombre_mes,
                    t.jornada,
                    p.goles_local,
                    p.goles_visitante,
                    p.status,
                    p.hora,
                    e_local.nombre_equipo AS equipo_local,
                    e_local.logo AS logo_local,
                    e_visitante.nombre_equipo AS equipo_visitante,
                    e_visitante.logo AS logo_visitante,
                    COALESCE(p.goles_local, 0) + COALESCE(p.goles_visitante, 0) AS total_goles
                FROM dim_partidos p
                JOIN dim_tiempo t ON p.id_tiempo = t.id_tiempo
                JOIN dim_equipo e_local ON p.id_local = e_local.id_equipo
                JOIN dim_equipo e_visitante ON p.id_visitante = e_visitante.id_equipo
                WHERE p.temporada = $1
                  AND p.status = 'Completado'
            )
            SELECT *
            FROM partidos
            WHERE total_goles = (SELECT MAX(total_goles) FROM partidos)
            ORDER BY anio DESC, mes DESC, dia DESC, hora DESC
        `;

    const [totalesRes, tarjetasRes, mejoresRes] = await Promise.all([
      pool.query(queryTotales, [temporada]),
      pool.query(queryTarjetas, [temporada]),
      pool.query(queryMejores, [temporada]),
    ]);

    const totales = totalesRes.rows[0] || {
      partidos_jugados: 0,
      goles_total: 0,
    };
    const tarjetas = tarjetasRes.rows[0] || {
      amarillas_total: 0,
      rojas_total: 0,
    };

    res.json({
      temporada,
      resumen: {
        partidos_jugados: Number(totales.partidos_jugados) || 0,
        goles_total: Number(totales.goles_total) || 0,
        amarillas_total: Number(tarjetas.amarillas_total) || 0,
        rojas_total: Number(tarjetas.rojas_total) || 0,
      },
      mejores_partidos: mejoresRes.rows || [],
    });
  } catch (error) {
    console.error("Error al obtener el resumen de temporada:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const getDestacadosTemporada = async (req, res) => {
  try {
    const temporada = parseEntero(req.query.temporada);

    if (!temporada) {
      return res
        .status(400)
        .json({ error: "Debes proporcionar una temporada" });
    }

    const queryGoleador = `
            SELECT
                h.id_jugador,
                j.nombre,
                j.foto,
                h.goles,
                h.id_equipo,
                e.nombre_equipo,
                e.logo
            FROM h_jugador_temporada h
            JOIN dim_jugador j ON h.id_jugador = j.id_jugador
            LEFT JOIN dim_equipo e ON h.id_equipo = e.id_equipo
            WHERE h.temporada = $1
            ORDER BY h.goles DESC NULLS LAST, h.partidos DESC NULLS LAST
            LIMIT 1
        `;

    const queryPortero = `
            WITH total_jornadas AS (
                SELECT MAX(t.jornada) AS total_jornadas
                FROM dim_partidos p
                JOIN dim_tiempo t ON p.id_tiempo = t.id_tiempo
                WHERE p.temporada = $1
            ),
            candidatos AS (
                SELECT
                    h.id_jugador,
                    j.nombre,
                    j.foto,
                    h.partidos,
                    h.minutos,
                    COALESCE(h.goles_concedidos, 0) AS goles_concedidos,
                    h.id_equipo,
                    e.nombre_equipo,
                    e.logo,
                    (COALESCE(h.goles_concedidos, 0)::numeric / NULLIF(h.partidos, 0)) AS goles_por_partido
                FROM h_jugador_temporada h
                JOIN dim_jugador j ON h.id_jugador = j.id_jugador
                LEFT JOIN dim_equipo e ON h.id_equipo = e.id_equipo
                WHERE h.temporada = $1
                  AND h.posicion ILIKE '%portero%'
                  AND COALESCE(h.minutos, 0) > 1
                  AND h.partidos > COALESCE((SELECT total_jornadas FROM total_jornadas), 0) / 2.0
            )
            SELECT *
            FROM candidatos
            WHERE goles_por_partido IS NOT NULL
            ORDER BY goles_por_partido ASC, partidos DESC
            LIMIT 1
        `;

    const queryAmarillas = `
            SELECT
                h.id_jugador,
                j.nombre,
                j.foto,
                h.amarillas,
                h.id_equipo,
                e.nombre_equipo,
                e.logo
            FROM h_jugador_temporada h
            JOIN dim_jugador j ON h.id_jugador = j.id_jugador
            LEFT JOIN dim_equipo e ON h.id_equipo = e.id_equipo
            WHERE h.temporada = $1
            ORDER BY h.amarillas DESC NULLS LAST, h.partidos DESC NULLS LAST
            LIMIT 1
        `;

    const queryRojas = `
            SELECT
                h.id_jugador,
                j.nombre,
                j.foto,
                h.rojas,
                h.id_equipo,
                e.nombre_equipo,
                e.logo
            FROM h_jugador_temporada h
            JOIN dim_jugador j ON h.id_jugador = j.id_jugador
            LEFT JOIN dim_equipo e ON h.id_equipo = e.id_equipo
            WHERE h.temporada = $1
            ORDER BY h.rojas DESC NULLS LAST, h.partidos DESC NULLS LAST
            LIMIT 1
        `;

    const [goleadorRes, porteroRes, amarillasRes, rojasRes] = await Promise.all(
      [
        pool.query(queryGoleador, [temporada]),
        pool.query(queryPortero, [temporada]),
        pool.query(queryAmarillas, [temporada]),
        pool.query(queryRojas, [temporada]),
      ],
    );

    res.json({
      goleador: goleadorRes.rows[0] || null,
      portero: porteroRes.rows[0] || null,
      amarillas: amarillasRes.rows[0] || null,
      rojas: rojasRes.rows[0] || null,
    });
  } catch (error) {
    console.error("Error al obtener jugadores destacados:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const getMvpsJornada = async (req, res) => {
  try {
    const temporada = parseEntero(req.query.temporada);
    const jornada = parseEntero(req.query.jornada);

    if (!temporada) {
      return res
        .status(400)
        .json({ error: "Debes proporcionar una temporada" });
    }

    if (!jornada) {
      return res.status(400).json({ error: "Debes proporcionar una jornada" });
    }

    const query = `
            WITH candidatos AS (
                SELECT
                    CASE
                        WHEN h.posicion ILIKE '%P%' THEN 'Portero'
                        WHEN h.posicion ILIKE '%DF%' THEN 'Defensa'
                        WHEN h.posicion ILIKE '%M%' OR h.posicion ILIKE '%mid%' THEN 'Mediocentro'
                        WHEN h.posicion ILIKE '%DL%' OR h.posicion ILIKE '%forward%' OR h.posicion ILIKE '%striker%' THEN 'Delantero'
                        ELSE NULL
                    END AS rol,
                    h.id_jugador,
                    j.nombre,
                    j.foto,
                    h.nota,
                    h.minutos,
                    h.id_equipo,
                    e.nombre_equipo,
                    e.logo,
                    p.id_partido
                FROM h_jugador_partido h
                JOIN dim_partidos p ON h.id_partido = p.id_partido
                JOIN dim_tiempo t ON p.id_tiempo = t.id_tiempo
                JOIN dim_jugador j ON h.id_jugador = j.id_jugador
                LEFT JOIN dim_equipo e ON h.id_equipo = e.id_equipo
                WHERE p.temporada = $1
                  AND t.jornada = $2
                  AND p.status = 'Completado'
                  AND h.nota IS NOT NULL
                  AND h.nota > 0.1
            ),
            seleccion AS (
                SELECT DISTINCT ON (rol)
                    rol,
                    id_jugador,
                    nombre,
                    foto,
                    nota,
                    minutos,
                    id_equipo,
                    nombre_equipo,
                    logo,
                    id_partido
                FROM candidatos
                WHERE rol IS NOT NULL
                ORDER BY rol, nota DESC, minutos DESC
            )
            SELECT * FROM seleccion
        `;

    const result = await pool.query(query, [temporada, jornada]);

    res.json({
      temporada,
      jornada,
      mvps: result.rows || [],
    });
  } catch (error) {
    console.error("Error al obtener los MVPs de la jornada:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const getUltimaJornadaTemporada = async (req, res) => {
  try {
    const temporada = parseEntero(req.query.temporada);

    if (!temporada) {
      return res
        .status(400)
        .json({ error: "Debes proporcionar una temporada" });
    }

    const queryJornada = `
            SELECT MAX(t.jornada) AS jornada
            FROM dim_partidos p
            JOIN dim_tiempo t ON p.id_tiempo = t.id_tiempo
            WHERE p.temporada = $1
              AND p.status = 'Completado'
        `;

    const jornadaRes = await pool.query(queryJornada, [temporada]);
    const jornada = jornadaRes.rows[0]?.jornada || null;

    if (!jornada) {
      return res.json({ temporada, jornada: null, partidos: [] });
    }

    const queryPartidos = `
            SELECT
                p.id_partido,
                p.id_local,
                p.id_visitante,
                t.anio,
                t.mes,
                t.dia,
                t.nombre_mes,
                t.jornada,
                p.goles_local,
                p.goles_visitante,
                p.status,
                p.hora,
                e_local.nombre_equipo AS equipo_local,
                e_local.logo AS logo_local,
                e_visitante.nombre_equipo AS equipo_visitante,
                e_visitante.logo AS logo_visitante
            FROM dim_partidos p
            JOIN dim_tiempo t ON p.id_tiempo = t.id_tiempo
            JOIN dim_equipo e_local ON p.id_local = e_local.id_equipo
            JOIN dim_equipo e_visitante ON p.id_visitante = e_visitante.id_equipo
            WHERE p.temporada = $1
              AND t.jornada = $2
            ORDER BY t.anio, t.mes, t.dia, p.hora
        `;

    const partidosRes = await pool.query(queryPartidos, [temporada, jornada]);

    res.json({ temporada, jornada, partidos: partidosRes.rows || [] });
  } catch (error) {
    console.error("Error al obtener la ultima jornada:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const getProximaJornadaTemporada = async (req, res) => {
  try {
    const temporada = parseEntero(req.query.temporada);

    if (!temporada) {
      return res
        .status(400)
        .json({ error: "Debes proporcionar una temporada" });
    }

    const queryPartidos = `
            SELECT
                p.id_partido,
                p.id_local,
                p.id_visitante,
                t.anio,
                t.mes,
                t.dia,
                t.nombre_mes,
                t.jornada,
                p.goles_local,
                p.goles_visitante,
                p.status,
                p.hora,
                e_local.nombre_equipo AS equipo_local,
                e_local.logo AS logo_local,
                e_visitante.nombre_equipo AS equipo_visitante,
                e_visitante.logo AS logo_visitante
            FROM dim_partidos p
            JOIN dim_tiempo t ON p.id_tiempo = t.id_tiempo
            JOIN dim_equipo e_local ON p.id_local = e_local.id_equipo
            JOIN dim_equipo e_visitante ON p.id_visitante = e_visitante.id_equipo
            WHERE p.temporada = $1
              AND p.status <> 'Completado'
            ORDER BY t.anio, t.mes, t.dia, p.hora
            LIMIT 10
        `;

    const partidosRes = await pool.query(queryPartidos, [temporada]);

    res.json({ temporada, partidos: partidosRes.rows || [] });
  } catch (error) {
    console.error("Error al obtener los proximos partidos:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const getAscensosDescensos = async (req, res) => {
  try {
    const temporada = parseEntero(req.query.temporada);

    if (!temporada) {
      return res
        .status(400)
        .json({ error: "Debes proporcionar una temporada" });
    }

    const temporadaAnterior = temporada - 1;

    const queryAscendidos = `
            WITH actuales AS (
                SELECT DISTINCT id_equipo
                FROM h_equipo_temporada
                WHERE temporada = $1
            ),
            anteriores AS (
                SELECT DISTINCT id_equipo
                FROM h_equipo_temporada
                WHERE temporada = $2
            )
            SELECT e.id_equipo, e.nombre_equipo, e.logo
            FROM actuales a
            LEFT JOIN anteriores b ON a.id_equipo = b.id_equipo
            JOIN dim_equipo e ON a.id_equipo = e.id_equipo
            WHERE b.id_equipo IS NULL
            ORDER BY e.nombre_equipo ASC
        `;

    const queryDescendidos = `
            WITH actuales AS (
                SELECT DISTINCT id_equipo
                FROM h_equipo_temporada
                WHERE temporada = $1
            ),
            anteriores AS (
                SELECT DISTINCT id_equipo
                FROM h_equipo_temporada
                WHERE temporada = $2
            )
            SELECT e.id_equipo, e.nombre_equipo, e.logo
            FROM anteriores b
            LEFT JOIN actuales a ON b.id_equipo = a.id_equipo
            JOIN dim_equipo e ON b.id_equipo = e.id_equipo
            WHERE a.id_equipo IS NULL
            ORDER BY e.nombre_equipo ASC
        `;

    const [ascendidosRes, descendidosRes] = await Promise.all([
      pool.query(queryAscendidos, [temporada, temporadaAnterior]),
      pool.query(queryDescendidos, [temporada, temporadaAnterior]),
    ]);

    res.json({
      temporada,
      temporada_anterior: temporadaAnterior,
      ascendidos: ascendidosRes.rows || [],
      descendidos: descendidosRes.rows || [],
    });
  } catch (error) {
    console.error("Error al obtener ascensos y descensos:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
const getPartidosTemporada = async (req, res) => {
  try {
    const { temporada, jornada } = req.query;

    if (!temporada) {
      return res
        .status(400)
        .json({ error: "Debes proporcionar una temporada" });
    }

    const temporadaBusqueda = Number(temporada);
    const jornadaBusqueda = jornada ? Number(jornada) : null;

    if (!Number.isInteger(temporadaBusqueda)) {
      return res
        .status(400)
        .json({ error: "La temporada debe ser un numero entero" });
    }

    if (jornada && !Number.isInteger(jornadaBusqueda)) {
      return res
        .status(400)
        .json({ error: "La jornada debe ser un numero entero" });
    }

    let query = `
            SELECT
                p.id_partido,
                p.id_local,
                p.id_visitante,
                t.anio,
                t.mes,
                t.dia,
                t.nombre_mes,
                t.jornada,
                p.goles_local,
                p.goles_visitante,
                p.status,
                p.hora,
                e_local.nombre_equipo AS equipo_local,
                e_local.logo AS logo_local,
                e_visitante.nombre_equipo AS equipo_visitante,
                e_visitante.logo AS logo_visitante
            FROM dim_partidos p
            JOIN dim_tiempo t ON p.id_tiempo = t.id_tiempo
            JOIN dim_equipo e_local ON p.id_local = e_local.id_equipo
            JOIN dim_equipo e_visitante ON p.id_visitante = e_visitante.id_equipo
            WHERE p.temporada = $1
        `;

    const params = [temporadaBusqueda];

    if (jornadaBusqueda !== null) {
      query += " AND t.jornada = $2";
      params.push(jornadaBusqueda);
    }

    query += " ORDER BY t.anio, t.mes, t.dia, p.hora;";

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener los partidos por temporada:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const getEquiposTemporada = async (req, res) => {
  try {
    const { temporada } = req.query;

    if (!temporada) {
      return res
        .status(400)
        .json({ error: "Debes proporcionar una temporada" });
    }

    const temporadaBusqueda = Number(temporada);

    if (!Number.isInteger(temporadaBusqueda)) {
      return res
        .status(400)
        .json({ error: "La temporada debe ser un numero entero" });
    }

    const query = `
            SELECT DISTINCT
                e.id_equipo,
                e.nombre_equipo,
                e.logo
            FROM h_equipo_temporada h
            JOIN dim_equipo e ON h.id_equipo = e.id_equipo
            WHERE h.temporada = $1
            ORDER BY e.nombre_equipo ASC
        `;

    const result = await pool.query(query, [temporadaBusqueda]);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener los equipos por temporada:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

module.exports = {
  getClasificacion,
  getTemporadas,
  getMontecarloTemporada,
  getSimulacionTemporadaInicial,
  getPartidosSimulacionJornada,
  getGraficosTemporada,
  getPartidosTemporada,
  getEquiposTemporada,
  getResumenTemporada,
  getDestacadosTemporada,
  getRankingsTemporada,
  getMvpsJornada,
  getUltimaJornadaTemporada,
  getProximaJornadaTemporada,
  getAscensosDescensos,
};
