const pool = require('../config/db');

const getPartidoFecha = async (req, res) => {
      try {
    // 1. Recibimos la fecha en formato YYYY-MM-DD
    const fechaOriginal = req.query.fecha; // Ej: "2015-08-22"
    
    if (!fechaOriginal) {
      return res.status(400).json({ error: "Debes proporcionar una fecha en formato YYYY-MM-DD" });
    }

    // 2. Convertimos "2015-08-22" a número 20150822 para que coincida con id_tiempo
    const idTiempoBusqueda = parseInt(fechaOriginal.replace(/-/g, ''));

    // 3. Consulta con JOINs para traer nombres de equipos y datos de la jornada
    const query = `
      SELECT 
        p.id_partido, p.hora, p.goles_local, p.goles_visitante,
        eL.nombre_equipo AS equipo_local,
        eV.nombre_equipo AS equipo_visitante,
        eL.logo AS logo_local,
        eV.logo AS logo_visitante
      FROM dim_partidos p
      JOIN dim_equipo eL ON p.id_local = eL.id_equipo
      JOIN dim_equipo eV ON p.id_visitante = eV.id_equipo
      JOIN dim_tiempo t ON p.id_tiempo = t.id_tiempo
      WHERE p.id_tiempo = $1
      ORDER BY p.hora ASC
    `;

    const result = await pool.query(query, [idTiempoBusqueda]);

    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Error al obtener partidos por fecha" });
  }
};

const getPartidosEntreEquipos = async (req, res) => {
  const { id1, id2 } = req.params;
  const { limit, id_partido_actual } = req.query; // El ID ahora es opcional

  try {
    let query = `
      SELECT 
          p.id_partido, p.goles_local, p.goles_visitante, p.temporada, p.ganador, 
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
              WITH lideres AS (
                -- LÍDERES EQUIPO LOCAL
                (SELECT j.nombre, j.foto, (h.goles + h.asistencias) AS valor, 'G+A' AS categoria, 'local' AS tipo_equipo
                FROM h_jugador_temporada h
                JOIN dim_jugador j ON h.id_jugador = j.id_jugador
                WHERE h.id_equipo = $1 AND h.temporada = $3
                ORDER BY (h.goles + h.asistencias) DESC LIMIT 1)
                UNION ALL
                (SELECT j.nombre, j.foto, h.partidos AS valor, 'Partidos' AS categoria, 'local' AS tipo_equipo
                FROM h_jugador_temporada h
                JOIN dim_jugador j ON h.id_jugador = j.id_jugador
                WHERE h.id_equipo = $1 AND h.temporada = $3
                ORDER BY h.partidos DESC LIMIT 1)
                UNION ALL
                (SELECT j.nombre, j.foto, h.nota_media AS valor, 'Rating' AS categoria, 'local' AS tipo_equipo
                FROM h_jugador_temporada h
                JOIN dim_jugador j ON h.id_jugador = j.id_jugador
                WHERE h.id_equipo = $1 AND h.temporada = $3
                ORDER BY h.nota_media DESC LIMIT 1)

                UNION ALL

                -- LÍDERES EQUIPO VISITANTE
                (SELECT j.nombre, j.foto, (h.goles + h.asistencias) AS valor, 'G+A' AS categoria, 'visitante' AS tipo_equipo
                FROM h_jugador_temporada h
                JOIN dim_jugador j ON h.id_jugador = j.id_jugador
                WHERE h.id_equipo = $2 AND h.temporada = $3
                ORDER BY (h.goles + h.asistencias) DESC LIMIT 1)
                UNION ALL
                (SELECT j.nombre, j.foto, h.partidos AS valor, 'Partidos' AS categoria, 'visitante' AS tipo_equipo
                FROM h_jugador_temporada h
                JOIN dim_jugador j ON h.id_jugador = j.id_jugador
                WHERE h.id_equipo = $2 AND h.temporada = $3
                ORDER BY h.partidos DESC LIMIT 1)
                UNION ALL
                (SELECT j.nombre, j.foto, h.nota_media AS valor, 'Rating' AS categoria, 'visitante' AS tipo_equipo
                FROM h_jugador_temporada h
                JOIN dim_jugador j ON h.id_jugador = j.id_jugador
                WHERE h.id_equipo = $2 AND h.temporada = $3
                ORDER BY h.nota_media DESC LIMIT 1)
              )
              SELECT * FROM lideres;
            `;
        const { rows } = await pool.query(queryDestacados, [id_local, id_visitante, temporada]);

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


module.exports = { getPartidoFecha, getPartidosEntreEquipos, getJugadoresDestacadosPartido, getEstadoActualPartido, getInfoPartido, getEventosPartido };
