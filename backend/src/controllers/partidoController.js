const pool = require('../config/db');

const getPartidoFecha = async (req, res) => {
  try {
    const { fecha, temporada, jornada } = req.query;

    if (temporada || jornada) {
      if (!temporada || !jornada) {
        return res.status(400).json({
          error: 'Debes proporcionar temporada y jornada para este filtro',
        });
      }

      const temporadaBusqueda = Number(temporada);
      const jornadaBusqueda = Number(jornada);

      if (!Number.isInteger(temporadaBusqueda) || !Number.isInteger(jornadaBusqueda)) {
        return res.status(400).json({
          error: 'La temporada y la jornada deben ser números enteros',
        });
      }

      const queryPorJornada = `
        SELECT
          p.id_partido,
          p.id_local,
          p.id_visitante,
          p.hora,
          p.goles_local,
          p.goles_visitante,
          eL.nombre_equipo AS equipo_local,
          eV.nombre_equipo AS equipo_visitante,
          eL.logo AS logo_local,
          eV.logo AS logo_visitante,
          t.anio,
          t.mes,
          t.nombre_mes,
          t.dia,
          t.jornada,
          TO_CHAR(MAKE_DATE(t.anio, t.mes, t.dia), 'YYYY-MM-DD') AS fecha_iso
        FROM dim_partidos p
        JOIN dim_equipo eL ON p.id_local = eL.id_equipo
        JOIN dim_equipo eV ON p.id_visitante = eV.id_equipo
        JOIN dim_tiempo t ON p.id_tiempo = t.id_tiempo
        WHERE p.temporada = $1
          AND t.jornada = $2
        ORDER BY t.id_tiempo ASC, p.hora ASC
      `;

      const result = await pool.query(queryPorJornada, [temporadaBusqueda, jornadaBusqueda]);
      return res.json(result.rows);
    }

    if (!fecha) {
      return res.status(400).json({
        error: 'Debes proporcionar una fecha en formato YYYY-MM-DD o temporada y jornada',
      });
    }

    const idTiempoBusqueda = parseInt(fecha.replace(/-/g, ''), 10);

    const queryPorFecha = `
      SELECT
        p.id_partido,
        p.id_local,
        p.id_visitante,
        p.hora,
        p.goles_local,
        p.goles_visitante,
        eL.nombre_equipo AS equipo_local,
        eV.nombre_equipo AS equipo_visitante,
        eL.logo AS logo_local,
        eV.logo AS logo_visitante,
        t.anio,
        t.mes,
        t.nombre_mes,
        t.dia,
        t.jornada,
        TO_CHAR(MAKE_DATE(t.anio, t.mes, t.dia), 'YYYY-MM-DD') AS fecha_iso
      FROM dim_partidos p
      JOIN dim_equipo eL ON p.id_local = eL.id_equipo
      JOIN dim_equipo eV ON p.id_visitante = eV.id_equipo
      JOIN dim_tiempo t ON p.id_tiempo = t.id_tiempo
      WHERE p.id_tiempo = $1
      ORDER BY p.hora ASC
    `;

    const result = await pool.query(queryPorFecha, [idTiempoBusqueda]);
    return res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Error al obtener partidos por fecha" });
  }
};

const getJornadasPorTemporada = async (req, res) => {
  const { temporada } = req.query;

  if (!temporada) {
    return res.status(400).json({
      error: 'Debes proporcionar una temporada',
    });
  }

  const temporadaBusqueda = Number(temporada);

  if (!Number.isInteger(temporadaBusqueda)) {
    return res.status(400).json({
      error: 'La temporada debe ser un número entero',
    });
  }

  try {
    const query = `
      SELECT DISTINCT t.jornada
      FROM dim_partidos p
      JOIN dim_tiempo t ON p.id_tiempo = t.id_tiempo
      WHERE p.temporada = $1
      ORDER BY t.jornada ASC
    `;

    const queryJornadaActual = `
      SELECT MAX(t.jornada) AS jornada_actual
      FROM dim_partidos p
      JOIN dim_tiempo t ON p.id_tiempo = t.id_tiempo
      WHERE p.temporada = $1
        AND p.status = 'Completado'
    `;

    const [resultJornadas, resultJornadaActual] = await Promise.all([
      pool.query(query, [temporadaBusqueda]),
      pool.query(queryJornadaActual, [temporadaBusqueda]),
    ]);

    res.json({
      jornadas: resultJornadas.rows,
      jornada_actual: resultJornadaActual.rows[0]?.jornada_actual ?? null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener jornadas por temporada' });
  }
};

const getPartidosEntreEquipos = async (req, res) => {
  const { id1, id2 } = req.params;
  const { limit, id_partido_actual } = req.query; // El ID ahora es opcional

  try {
    let query = `
      SELECT 
          p.id_partido, p.id_local, p.id_visitante, p.goles_local, p.goles_visitante, p.temporada, p.ganador, 
          el.nombre_equipo AS equipo_local, ev.nombre_equipo AS equipo_visitante,
          el.logo AS logo_local, ev.logo AS logo_visitante,
          t.anio, t.nombre_mes, t.dia, t.jornada, t.id_tiempo
      FROM dim_partidos p
      JOIN dim_tiempo t ON p.id_tiempo = t.id_tiempo
      JOIN dim_equipo el ON p.id_local = el.id_equipo
      JOIN dim_equipo ev ON p.id_visitante = ev.id_equipo
      WHERE (
          (p.id_local = $1 AND p.id_visitante = $2)
          OR (p.id_local = $2 AND p.id_visitante = $1)
      ) 
      AND p.status = 'Completado'
    `;

    const params = [id1, id2];

    // SI existe id_partido_actual, añadimos la restricción de tiempo
    if (id_partido_actual) {
      query += ` AND p.id_tiempo < (SELECT id_tiempo FROM dim_partidos WHERE id_partido = $3) `;
      params.push(id_partido_actual);
    }

    query += ` ORDER BY t.id_tiempo DESC `;

    if (limit) {
      query += ` LIMIT ${parseInt(limit)}`;
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("Error en H2H:", err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const getJugadoresDestacadosPartido = async (req, res) => {
    const { id_partido } = req.params;
  const partidoId = Number(id_partido);

  if (!Number.isInteger(partidoId)) {
    return res.status(400).json({ error: "id_partido inválido" });
  }

    try {
        // 1. Primero obtenemos los datos del partido para saber IDs de equipos y temporada
        const partidoInfo = await pool.query(
          'SELECT id_local, id_visitante, temporada FROM dim_partidos WHERE id_partido = $1',
      [partidoId]
        );

        if (partidoInfo.rows.length === 0) return res.status(404).json({mensaje: "Partido no encontrado"});

        const { id_local, id_visitante, temporada } = partidoInfo.rows[0];

        const queryDestacados = `
        WITH stats_acumuladas AS (
            SELECT 
                h.id_jugador,
                h.id_equipo,
                SUM(COALESCE(h.goles, 0) + COALESCE(h.asistencias, 0)) as ga,
                SUM(COALESCE(h.minutos, 0)) as minutos,
                AVG(COALESCE(h.nota, 0)) as rating
            FROM h_jugador_partido h
            JOIN dim_partidos p ON h.id_partido = p.id_partido
            WHERE p.temporada = $3 
              AND p.id_tiempo < (SELECT id_tiempo FROM dim_partidos WHERE id_partido = $4)
              AND h.id_equipo IN ($1, $2)
            GROUP BY h.id_jugador, h.id_equipo
        ),
        lideres AS (
            -- LOCAL
            (SELECT j.id_jugador, j.nombre, j.foto, s.ga AS valor, 'G+A' AS categoria, 'local' AS tipo_equipo
            FROM stats_acumuladas s JOIN dim_jugador j ON s.id_jugador = j.id_jugador
            WHERE s.id_equipo = $1 ORDER BY s.ga DESC LIMIT 1)
            UNION ALL
            (SELECT j.id_jugador, j.nombre, j.foto, s.minutos AS valor, 'Minutos' AS categoria, 'local' AS tipo_equipo
            FROM stats_acumuladas s JOIN dim_jugador j ON s.id_jugador = j.id_jugador
            WHERE s.id_equipo = $1 ORDER BY s.minutos DESC LIMIT 1)
            UNION ALL
            (SELECT j.id_jugador, j.nombre, j.foto, s.rating AS valor, 'Rating' AS categoria, 'local' AS tipo_equipo
            FROM stats_acumuladas s JOIN dim_jugador j ON s.id_jugador = j.id_jugador
            WHERE s.id_equipo = $1 ORDER BY s.rating DESC LIMIT 1)
            
            UNION ALL
            
            -- VISITANTE
            (SELECT j.id_jugador, j.nombre, j.foto, s.ga AS valor, 'G+A' AS categoria, 'visitante' AS tipo_equipo
            FROM stats_acumuladas s JOIN dim_jugador j ON s.id_jugador = j.id_jugador
            WHERE s.id_equipo = $2 ORDER BY s.ga DESC LIMIT 1)
            UNION ALL
            (SELECT j.id_jugador, j.nombre, j.foto, s.minutos AS valor, 'Minutos' AS categoria, 'visitante' AS tipo_equipo
            FROM stats_acumuladas s JOIN dim_jugador j ON s.id_jugador = j.id_jugador
            WHERE s.id_equipo = $2 ORDER BY s.minutos DESC LIMIT 1)
            UNION ALL
            (SELECT j.id_jugador, j.nombre, j.foto, s.rating AS valor, 'Rating' AS categoria, 'visitante' AS tipo_equipo
            FROM stats_acumuladas s JOIN dim_jugador j ON s.id_jugador = j.id_jugador
            WHERE s.id_equipo = $2 ORDER BY s.rating DESC LIMIT 1)
        )
        SELECT * FROM lideres;
        `;
        const { rows } = await pool.query(queryDestacados, [id_local, id_visitante, temporada, partidoId]);

        res.json({
            local: rows.filter(r => r.tipo_equipo === 'local'),
            visitante: rows.filter(r => r.tipo_equipo === 'visitante')
        });

    } catch (err) {
        res.status(500).json({ error: "Error en el servidor" });
    }
};

const getEstadoActualPartido = async (req, res) => {
  const { id_partido } = req.params;
  const partidoId = Number(id_partido);

    if (!Number.isInteger(partidoId)) {
        return res.status(400).json({ error: "id_partido inválido" });
    }

    try {
        const query = `
      SELECT 
          p.id_partido, p.temporada, t.jornada AS jornada_partido,
          -- Datos del Local
          hl.posicion AS local_posicion, hl.puntos AS local_puntos, hl.forma AS local_forma,
          hl.victorias AS local_victorias, hl.empates AS local_empates, hl.derrotas AS local_derrotas,
          hl.jornada AS jornada_datos_local,
          -- Datos del Visitante
          hv.posicion AS visitante_posicion, hv.puntos AS visitante_puntos, hv.forma AS visitante_forma,
          hv.victorias AS visitante_victorias, hv.empates AS visitante_empates, hv.derrotas AS visitante_derrotas,
          hv.jornada AS jornada_datos_visitante
      FROM dim_partidos p
      JOIN dim_tiempo t ON p.id_tiempo = t.id_tiempo
      -- JOIN para el LOCAL: Busca la jornada actual o la máxima anterior disponible
      LEFT JOIN h_equipo_temporada hl ON 
          hl.id_equipo = p.id_local AND 
          hl.temporada = p.temporada AND 
          hl.jornada = (
              SELECT MAX(jornada) 
              FROM h_equipo_temporada 
              WHERE id_equipo = p.id_local 
                AND temporada = p.temporada 
                AND jornada < t.jornada -- Importante: '<' para ver cómo llegan al partido
          )
      -- JOIN para el VISITANTE: Misma lógica
      LEFT JOIN h_equipo_temporada hv ON 
          hv.id_equipo = p.id_visitante AND 
          hv.temporada = p.temporada AND 
          hv.jornada = (
              SELECT MAX(jornada) 
              FROM h_equipo_temporada 
              WHERE id_equipo = p.id_visitante 
                AND temporada = p.temporada 
                AND jornada < t.jornada
          )
      WHERE p.id_partido = $1;
        `;

        const result = await pool.query(query, [partidoId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Partido no encontrado" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error al obtener previa por ID de partido" });
    }
};

const getInfoPartido = async (req, res) => {
  const { id_partido } = req.params;
  const partidoId = Number(id_partido);

  if (!Number.isInteger(partidoId)) {
    return res.status(400).json({ error: "id_partido inválido" });
  }

  try{
    const query = `SELECT 
    p.id_partido, p.hora, p.goles_local, p.goles_visitante, p.arbitro, p.estadio, p.ganador,
    t.dia, t.nombre_mes, t.anio, t.jornada,
    el.id_equipo AS id_local,
    ev.id_equipo AS id_visitante,
    el.nombre_equipo AS equipo_local,
    ev.nombre_equipo AS equipo_visitante,
    el.logo AS logo_local,
    ev.logo AS logo_visitante
    FROM dim_partidos p
    JOIN dim_tiempo t ON p.id_tiempo = t.id_tiempo
    JOIN dim_equipo el ON p.id_local = el.id_equipo
    JOIN dim_equipo ev ON p.id_visitante = ev.id_equipo
    WHERE p.id_partido = $1`;
    const result = await pool.query(query, [partidoId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Partido no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener información del partido" });
  }
};

const getEventosPartido = async (req, res) => {
  const { id_partido } = req.params;
  const partidoId = Number(id_partido);
  
  if (!Number.isInteger(partidoId)) {
    return res.status(400).json({ error: "id_partido inválido" });
  }

  try {
    const query = `
      SELECT 
    e.id_evento,
    e.minuto,
    e.extra,
    e.id_equipo,
    e.id_jugador,
    e.id_asistente_o_sale,
    e.tipo,    -- 'Gol', 'Tarjeta', 'Sustitución'
    e.detalle, -- 'Penalti', 'Amarilla', 'Roja'
    e.comentarios,
    -- Jugador principal
    j1.nombre AS nombre_jugador,
    j1.foto AS foto_jugador,
    -- Jugador secundario (asistente o el que sale del campo)
    j2.nombre AS nombre_secundario,
    j2.foto AS foto_secundario
FROM h_partido_eventos e
LEFT JOIN dim_jugador j1 ON e.id_jugador = j1.id_jugador
LEFT JOIN dim_jugador j2 ON e.id_asistente_o_sale = j2.id_jugador
WHERE e.id_partido = $1
ORDER BY e.minuto ASC, e.extra ASC, e.id_evento ASC;
    `;
    const result = await pool.query(query, [partidoId]);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener eventos del partido" });
  }
};

const getAlineacionesPartido = async (req, res) => {
  const { id_partido } = req.params;
  const partidoId = Number(id_partido);

  if (!Number.isInteger(partidoId)) {
    return res.status(400).json({ error: "id_partido inválido" });
  }

  try {
    const query = `
      SELECT 
    h.id_partido,
    h.id_equipo,
    h.id_jugador,
    j.nombre,
    j.foto,
    h.posicion,
    h.minutos,
    h.nota,
    h.capitan,
    h.sustituto, -- TRUE si empezó en el banquillo, FALSE si fue titular
    e.nombre_equipo,
    e.logo AS logo_equipo
FROM h_jugador_partido h
JOIN dim_jugador j ON h.id_jugador = j.id_jugador
JOIN dim_equipo e ON h.id_equipo = e.id_equipo
WHERE h.id_partido = $1
ORDER BY 
    h.id_equipo, 
    h.sustituto ASC, -- Primero los titulares (false), luego suplentes (true)
    CASE 
        WHEN h.posicion = 'P' THEN 1
        WHEN h.posicion = 'DF' THEN 2
        WHEN h.posicion = 'M' THEN 3
        WHEN h.posicion = 'DL' THEN 4
        ELSE 5 
    END;
    `;
    const result = await pool.query(query, [partidoId]);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener alineaciones del partido" });
  }
};

const getStatsEquipoPartido = async (req, res) => {
  const { id_partido } = req.params;
  const partidoId = Number(id_partido);

  if (!Number.isInteger(partidoId)) {
    return res.status(400).json({ error: "id_partido inválido" });
  }

  try {
    const query = `
      SELECT 
    h.id_equipo,
    e.nombre_equipo,
    e.logo,
    h.posesion,
    h.tiros_totales,
    h.tiros_a_puerta,
    h.pases_totales,
    h.pases_acertados,
    h.pct_pases_acertados,
    h.faltas_cometidas,
    h.corners,
    h.fueras_de_juego,
    h.tarjetas_amarillas,
    h.tarjetas_rojas,
    h.goles_esperados,
    h.df_goles_esperados,
    -- Calculamos la precisión de tiro sobre la marcha si es necesario
    CASE WHEN h.tiros_totales > 0 
         THEN ROUND((h.tiros_a_puerta::numeric / h.tiros_totales::numeric) * 100, 1) 
         ELSE 0 END as precision_tiro
FROM h_equipo_partido h
JOIN dim_equipo e ON h.id_equipo = e.id_equipo
WHERE h.id_partido = $1
ORDER BY (CASE WHEN h.id_equipo = (SELECT id_local FROM dim_partidos WHERE id_partido = $1) THEN 1 ELSE 2 END)
    `;
    const result = await pool.query(query, [partidoId]);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener estadísticas del equipo en el partido" });
  } 
};

const getStatsJugadoresPartido = async (req, res) => {
  const { id_partido } = req.params;
  const partidoId = Number(id_partido);
  
  try {
    const query = `
    SELECT 
    -- Información del Jugador
    j.id_jugador,
    j.nombre,
    j.foto,
    
    -- Datos de rendimiento en el partido
    h.id_equipo,
    h.posicion,
    h.minutos,
    h.nota,
    h.capitan,
    h.sustituto,
    h.goles,
    h.asistencias,
    h.tiros_totales,
    h.tiros_a_puerta,
    h.pases_totales,
    h.pases_clave,
    h.precision_pases,
    h.regates_intentados,
    h.regates,
    h.regateado,
    h.duelos_totales,
    h.duelos_ganados,
    h.faltas_cometidas,
    h.faltas_recibidas,
    h.entradas,
    h.bloqueos,
    h.intercepciones,
    h.amarilla,
    h.roja,
    
    -- Datos específicos para porteros (solo tendrán valor si posicion = 'P')
    h.paradas,
    h.goles_concedidos,
    
    -- Nombre del equipo para agrupar fácilmente
    e.nombre_equipo
    
    FROM h_jugador_partido h
    JOIN dim_jugador j ON h.id_jugador = j.id_jugador
    JOIN dim_equipo e ON h.id_equipo = e.id_equipo
    WHERE h.id_partido = $1  -- Aquí pasas el ID del partido
    ORDER BY 
    h.id_equipo,       -- Agrupamos por equipo
    h.sustituto ASC,   -- Primero titulares (false), luego suplentes (true)
    CASE               -- Orden por posición en el campo
        WHEN h.posicion = 'P' THEN 1
        WHEN h.posicion = 'DF' THEN 2
        WHEN h.posicion = 'M' THEN 3
        WHEN h.posicion = 'DL' THEN 4
        ELSE 5 
    END,
    h.minutos DESC;    -- En suplentes, los que más jugaron primero`
    const result = await pool.query(query, [partidoId]);

    res.json(result.rows);
  }
    catch (err) { 
    console.error(err);
    res.status(500).json({ error: "Error al obtener estadísticas de jugadores en el partido" });
  }
};




module.exports = { getPartidoFecha, getJornadasPorTemporada, getPartidosEntreEquipos, getJugadoresDestacadosPartido, getEstadoActualPartido, getInfoPartido, getEventosPartido, getAlineacionesPartido, getStatsEquipoPartido, getStatsJugadoresPartido };
