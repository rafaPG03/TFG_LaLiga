const pool = require('../config/db');

const toNumber = (valor) => {
  const n = Number(valor);
  return Number.isFinite(n) ? n : 0;
};

const getEquipoPorId = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('SELECT * FROM dim_equipo WHERE id_equipo = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener el equipo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const getEquipos = async (req, res) => {
  try {
    const result = await pool.query('SELECT id_equipo, nombre_equipo, logo FROM dim_equipo ORDER BY nombre_equipo');
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener los equipos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const getStatsEquipoPorId = async (req, res) => {
  const { id_equipo } = req.params;
  const { temporada } = req.query; 

  console.log("ID Equipo:", id_equipo); // Debería salir 529
  console.log("Temporada recibida:", temporada); // Debería salir 2019

  try {
    const query = `
      SELECT 
        j.nombre, 
        j.foto,
        h.* FROM h_jugador_temporada h
      JOIN dim_jugador j ON h.id_jugador = j.id_jugador
      WHERE h.id_equipo = $1 AND h.temporada = $2
      ORDER BY h.posicion DESC;
    `;

    const result = await pool.query(query, [id_equipo, temporada]);

    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: "No hay datos para esta temporada" });
    }

    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Error al obtener las estadísticas OLAP" });
  }
};

const getPartidosEquipoPorId = async (req, res) => {
  const { id_equipo } = req.params;
  const { temporada } = req.query;
  try {
    const query = `
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
      WHERE (p.id_local = $1 OR p.id_visitante = $1)
        AND p.temporada = $2
      ORDER BY t.anio, t.mes, t.dia;
    `;

    const result = await pool.query(query, [id_equipo, temporada]);

    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: "No hay datos para esta temporada" });
    }

    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Error al obtener los partidos del equipo" });
  }
};

const getPlantillaEquipoPorTemporada = async (req, res) => {
  const { id_equipo } = req.params;
  const { temporada } = req.query;

  if (!temporada) {
    return res.status(400).json({ error: 'La temporada es obligatoria' });
  }

  try {
    const query = `
      SELECT
        h.id_jugador,
        j.nombre,
        j.foto,
        h.posicion,
        h.titular,
        h.goles,
        h.asistencias,
        h.goles_concedidos,
        COALESCE(h.amarillas, 0) + COALESCE(h.rojas, 0) AS tarjetas_totales
      FROM h_jugador_temporada h
      JOIN dim_jugador j ON h.id_jugador = j.id_jugador
      WHERE h.id_equipo = $1 AND h.temporada = $2
      ORDER BY
        CASE h.posicion
          WHEN 'Portero' THEN 1
          WHEN 'Defensa' THEN 2
          WHEN 'Mediocentro' THEN 3
          WHEN 'Delantero' THEN 4
          ELSE 5
        END,
        j.nombre ASC;
    `;

    const result = await pool.query(query, [id_equipo, temporada]);

    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: 'No hay datos para esta temporada' });
    }

    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error al obtener la plantilla del equipo' });
  }
};

const getTrayectoriaEquipoPorTemporada = async (req, res) => {
  const { id_equipo } = req.params;

  try {
    const query = `
      SELECT
        h.temporada,
        e.nombre_equipo,
        h.posicion,
        h.puntos,
        h.victorias,
        h.empates,
        h.derrotas,
        h.dg,
        mvp.id_jugador AS mvp_id_jugador,
        mvp.nombre AS mvp_nombre,
        mvp.nota_media AS mvp_rating,
        mvp.partidos AS mvp_partidos,
        goleador.id_jugador AS goleador_id_jugador,
        goleador.nombre AS goleador_nombre,
        goleador.goles AS goleador_goles,
        minutos.id_jugador AS minutos_id_jugador,
        minutos.nombre AS minutos_nombre,
        minutos.minutos AS minutos_minutos,
        mejor_partido.id_partido AS mejor_partido_id_partido,
        mejor_partido.nota_media AS mejor_partido_rating
      FROM (
        SELECT DISTINCT ON (temporada)
          id_equipo,
          temporada,
          posicion,
          puntos,
          victorias,
          empates,
          derrotas,
          dg,
          jornada
        FROM h_equipo_temporada
        WHERE id_equipo = $1
        ORDER BY temporada, jornada DESC
      ) h
      JOIN dim_equipo e ON h.id_equipo = e.id_equipo
      LEFT JOIN LATERAL (
        SELECT
          j.id_jugador,
          j.nombre,
          hjs.nota_media,
          hjs.partidos
        FROM h_jugador_temporada hjs
        JOIN dim_jugador j ON hjs.id_jugador = j.id_jugador
        WHERE hjs.id_equipo = h.id_equipo
          AND hjs.temporada = h.temporada
          AND hjs.partidos > 20
          AND hjs.nota_media IS NOT NULL
        ORDER BY hjs.nota_media DESC, hjs.partidos DESC
        LIMIT 1
      ) mvp ON true
      LEFT JOIN LATERAL (
        SELECT
          j.id_jugador,
          j.nombre,
          hjs.goles
        FROM h_jugador_temporada hjs
        JOIN dim_jugador j ON hjs.id_jugador = j.id_jugador
        WHERE hjs.id_equipo = h.id_equipo
          AND hjs.temporada = h.temporada
          AND hjs.goles IS NOT NULL
        ORDER BY hjs.goles DESC, hjs.partidos DESC
        LIMIT 1
      ) goleador ON true
      LEFT JOIN LATERAL (
        SELECT
          j.id_jugador,
          j.nombre,
          hjs.minutos
        FROM h_jugador_temporada hjs
        JOIN dim_jugador j ON hjs.id_jugador = j.id_jugador
        WHERE hjs.id_equipo = h.id_equipo
          AND hjs.temporada = h.temporada
          AND hjs.minutos IS NOT NULL
        ORDER BY hjs.minutos DESC, hjs.partidos DESC
        LIMIT 1
      ) minutos ON true
      LEFT JOIN LATERAL (
        SELECT
          hjp.id_partido,
          AVG(hjp.nota) AS nota_media
        FROM h_jugador_partido hjp
        JOIN dim_partidos p ON hjp.id_partido = p.id_partido
        WHERE hjp.id_equipo = h.id_equipo
          AND p.temporada = h.temporada
          AND hjp.nota > 0.1
        GROUP BY hjp.id_partido
        ORDER BY AVG(hjp.nota) DESC
        LIMIT 1
      ) mejor_partido ON true
      ORDER BY h.temporada DESC;
    `;

    const result = await pool.query(query, [id_equipo]);

    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: 'No hay datos para este equipo' });
    }

    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error al obtener la trayectoria del equipo' });
  }
};

const getInfoEquipo = async (req, res) => {
  const { id_equipo } = req.params;

  try {
    const equipoResult = await pool.query('SELECT * FROM dim_equipo WHERE id_equipo = $1', [id_equipo]);

    if (equipoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }

    const temporadaResult = await pool.query(
      'SELECT MAX(temporada) AS temporada FROM h_equipo_temporada WHERE id_equipo = $1',
      [id_equipo]
    );
    const temporada = Number(temporadaResult.rows[0]?.temporada) || null;

    let jornada = null;
    if (temporada) {
      const jornadaResult = await pool.query(
        'SELECT MAX(jornada) AS jornada FROM h_equipo_temporada WHERE temporada = $1',
        [temporada]
      );
      jornada = Number(jornadaResult.rows[0]?.jornada) || null;
    }

    let clasificacion = [];
    if (temporada && jornada) {
      const clasificacionResult = await pool.query(
        `
          SELECT
            h.id_equipo,
            h.posicion,
            h.puntos,
            h.dg,
            h.gf,
            h.gc,
            h.partidos_jugados,
            e.nombre_equipo,
            e.logo
          FROM h_equipo_temporada h
          JOIN dim_equipo e ON h.id_equipo = e.id_equipo
          WHERE h.temporada = $1 AND h.jornada = $2
          ORDER BY h.posicion ASC;
        `,
        [temporada, jornada]
      );
      clasificacion = clasificacionResult.rows;
    }

    const idxEquipo = clasificacion.findIndex((row) => Number(row.id_equipo) === Number(id_equipo));
    const equipoActual = idxEquipo >= 0 ? clasificacion[idxEquipo] : null;
    const equipoArriba = idxEquipo > 0 ? clasificacion[idxEquipo - 1] : null;
    const equipoAbajo = idxEquipo >= 0 && idxEquipo < clasificacion.length - 1
      ? clasificacion[idxEquipo + 1]
      : null;

    const clasificacionInfo = {
      temporada,
      jornada,
      posicion: equipoActual?.posicion ?? null,
      puntos: equipoActual?.puntos ?? null,
      partidos_jugados: equipoActual?.partidos_jugados ?? null,
      equipo_actual: equipoActual
        ? {
          id_equipo: equipoActual.id_equipo,
          nombre_equipo: equipoActual.nombre_equipo,
          logo: equipoActual.logo,
        }
        : null,
      equipo_arriba: equipoArriba
        ? {
          id_equipo: equipoArriba.id_equipo,
          nombre_equipo: equipoArriba.nombre_equipo,
          logo: equipoArriba.logo,
          puntos: equipoArriba.puntos,
        }
        : null,
      equipo_abajo: equipoAbajo
        ? {
          id_equipo: equipoAbajo.id_equipo,
          nombre_equipo: equipoAbajo.nombre_equipo,
          logo: equipoAbajo.logo,
          puntos: equipoAbajo.puntos,
        }
        : null,
      diferencia_arriba: equipoArriba && equipoActual
        ? Number(equipoArriba.puntos || 0) - Number(equipoActual.puntos || 0)
        : null,
      diferencia_abajo: equipoAbajo && equipoActual
        ? Number(equipoActual.puntos || 0) - Number(equipoAbajo.puntos || 0)
        : null,
    };

    const partidosResult = await pool.query(
      `
        SELECT
          p.id_partido,
          p.id_local,
          p.id_visitante,
          p.goles_local,
          p.goles_visitante,
          p.status,
          p.hora,
          t.anio,
          t.mes,
          t.dia,
          t.jornada,
          e_local.nombre_equipo AS equipo_local,
          e_local.logo AS logo_local,
          e_visitante.nombre_equipo AS equipo_visitante,
          e_visitante.logo AS logo_visitante
        FROM dim_partidos p
        JOIN dim_tiempo t ON p.id_tiempo = t.id_tiempo
        JOIN dim_equipo e_local ON p.id_local = e_local.id_equipo
        JOIN dim_equipo e_visitante ON p.id_visitante = e_visitante.id_equipo
        WHERE (p.id_local = $1 OR p.id_visitante = $1)
          AND p.status = 'Completado'
        ORDER BY t.anio DESC, t.mes DESC, t.dia DESC, p.hora DESC
        LIMIT 5;
      `,
      [id_equipo]
    );
    const proximosPartidos = partidosResult.rows;

    const proximoPartidoResult = await pool.query(
      `
        SELECT
          p.id_partido,
          p.id_local,
          p.id_visitante,
          p.goles_local,
          p.goles_visitante,
          p.status,
          p.hora,
          t.anio,
          t.mes,
          t.dia,
          t.jornada,
          e_local.nombre_equipo AS equipo_local,
          e_local.logo AS logo_local,
          e_visitante.nombre_equipo AS equipo_visitante,
          e_visitante.logo AS logo_visitante
        FROM dim_partidos p
        JOIN dim_tiempo t ON p.id_tiempo = t.id_tiempo
        JOIN dim_equipo e_local ON p.id_local = e_local.id_equipo
        JOIN dim_equipo e_visitante ON p.id_visitante = e_visitante.id_equipo
        WHERE (p.id_local = $1 OR p.id_visitante = $1)
          AND p.status IS DISTINCT FROM 'Completado'
        ORDER BY t.anio, t.mes, t.dia, p.hora
        LIMIT 1;
      `,
      [id_equipo]
    );
    const proximoPartido = proximoPartidoResult.rows[0] || null;

    let destacados = { minutos: null, goles: null, rating: null };
    if (temporada) {
      const partidosEquipo = toNumber(clasificacionInfo.partidos_jugados);
      const minPartidosDestacados = partidosEquipo > 0 ? Math.ceil(partidosEquipo * 0.5) : 0;
      const [minutosResult, golesResult, ratingResult] = await Promise.all([
        pool.query(
          `
            SELECT j.id_jugador, j.nombre, j.foto, h.minutos
            FROM h_jugador_temporada h
            JOIN dim_jugador j ON h.id_jugador = j.id_jugador
            WHERE h.id_equipo = $1
              AND h.temporada = $2
              AND h.minutos IS NOT NULL
              AND h.partidos >= $3
            ORDER BY h.minutos DESC, h.partidos DESC
            LIMIT 1;
          `,
          [id_equipo, temporada, minPartidosDestacados]
        ),
        pool.query(
          `
            SELECT j.id_jugador, j.nombre, j.foto, h.goles
            FROM h_jugador_temporada h
            JOIN dim_jugador j ON h.id_jugador = j.id_jugador
            WHERE h.id_equipo = $1
              AND h.temporada = $2
              AND h.goles IS NOT NULL
              AND h.partidos >= $3
            ORDER BY h.goles DESC, h.partidos DESC
            LIMIT 1;
          `,
          [id_equipo, temporada, minPartidosDestacados]
        ),
        pool.query(
          `
            SELECT j.id_jugador, j.nombre, j.foto, h.nota_media
            FROM h_jugador_temporada h
            JOIN dim_jugador j ON h.id_jugador = j.id_jugador
            WHERE h.id_equipo = $1
              AND h.temporada = $2
              AND h.nota_media IS NOT NULL
              AND h.partidos >= $3
            ORDER BY h.nota_media DESC, h.partidos DESC
            LIMIT 1;
          `,
          [id_equipo, temporada, minPartidosDestacados]
        ),
      ]);

      destacados = {
        minutos: minutosResult.rows[0] || null,
        goles: golesResult.rows[0] || null,
        rating: ratingResult.rows[0] || null,
      };
    }

    const historicosResult = await pool.query(
      `
        SELECT
          j.id_jugador,
          j.nombre,
          j.foto,
          AVG(h.nota_media) AS rating_medio,
          SUM(h.partidos) AS partidos_total
        FROM h_jugador_temporada h
        JOIN dim_jugador j ON h.id_jugador = j.id_jugador
        WHERE h.id_equipo = $1 AND h.nota_media IS NOT NULL
        GROUP BY j.id_jugador, j.nombre, j.foto
        HAVING SUM(h.partidos) > 15
        ORDER BY AVG(h.nota_media) DESC, SUM(h.partidos) DESC
        LIMIT 5;
      `,
      [id_equipo]
    );

    res.json({
      equipo: equipoResult.rows[0],
      temporada,
      clasificacion: clasificacionInfo,
      proximo_partido: proximoPartido,
      proximos_partidos: proximosPartidos,
      destacados,
      historicos: historicosResult.rows,
    });
  } catch (error) {
    console.error('Error al obtener el resumen del equipo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};



module.exports = {
  getEquipoPorId,
  getEquipos,
  getStatsEquipoPorId,
  getPartidosEquipoPorId,
  getPlantillaEquipoPorTemporada,
  getTrayectoriaEquipoPorTemporada,
  getInfoEquipo,
};