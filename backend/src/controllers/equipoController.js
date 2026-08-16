const pool = require("../config/db");

const toNumber = (valor) => {
  const n = Number(valor);
  return Number.isFinite(n) ? n : 0;
};

const getEquipoPorId = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "SELECT * FROM dim_equipo WHERE id_equipo = $1",
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Equipo no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al obtener el equipo:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const getEquipos = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id_equipo, nombre_equipo, logo FROM dim_equipo ORDER BY nombre_equipo",
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener los equipos:", error);
    res.status(500).json({ error: "Error interno del servidor" });
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
      return res
        .status(404)
        .json({ mensaje: "No hay datos para esta temporada" });
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
      return res
        .status(404)
        .json({ mensaje: "No hay datos para esta temporada" });
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
    return res.status(400).json({ error: "La temporada es obligatoria" });
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
      return res
        .status(404)
        .json({ mensaje: "No hay datos para esta temporada" });
    }

    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Error al obtener la plantilla del equipo" });
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
      return res.status(404).json({ mensaje: "No hay datos para este equipo" });
    }

    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res
      .status(500)
      .json({ error: "Error al obtener la trayectoria del equipo" });
  }
};

const getInfoEquipo = async (req, res) => {
  const { id_equipo } = req.params;

  try {
    const equipoResult = await pool.query(
      "SELECT * FROM dim_equipo WHERE id_equipo = $1",
      [id_equipo],
    );

    if (equipoResult.rows.length === 0) {
      return res.status(404).json({ error: "Equipo no encontrado" });
    }

    const temporadaResult = await pool.query(
      "SELECT MAX(temporada) AS temporada FROM h_equipo_temporada WHERE id_equipo = $1",
      [id_equipo],
    );
    const temporada = Number(temporadaResult.rows[0]?.temporada) || null;

    let jornada = null;
    if (temporada) {
      const jornadaResult = await pool.query(
        "SELECT MAX(jornada) AS jornada FROM h_equipo_temporada WHERE temporada = $1",
        [temporada],
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
        [temporada, jornada],
      );
      clasificacion = clasificacionResult.rows;
    }

    const idxEquipo = clasificacion.findIndex(
      (row) => Number(row.id_equipo) === Number(id_equipo),
    );
    const equipoActual = idxEquipo >= 0 ? clasificacion[idxEquipo] : null;
    const equipoArriba = idxEquipo > 0 ? clasificacion[idxEquipo - 1] : null;
    const equipoAbajo =
      idxEquipo >= 0 && idxEquipo < clasificacion.length - 1
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
      diferencia_arriba:
        equipoArriba && equipoActual
          ? Number(equipoArriba.puntos || 0) - Number(equipoActual.puntos || 0)
          : null,
      diferencia_abajo:
        equipoAbajo && equipoActual
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
      [id_equipo],
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
      [id_equipo],
    );
    const proximoPartido = proximoPartidoResult.rows[0] || null;

    let destacados = { minutos: null, goles: null, rating: null };
    if (temporada) {
      const partidosEquipo = toNumber(clasificacionInfo.partidos_jugados);
      const minPartidosDestacados =
        partidosEquipo > 0 ? Math.ceil(partidosEquipo * 0.5) : 0;
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
          [id_equipo, temporada, minPartidosDestacados],
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
          [id_equipo, temporada, minPartidosDestacados],
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
          [id_equipo, temporada, minPartidosDestacados],
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
      [id_equipo],
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
    console.error("Error al obtener el resumen del equipo:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

const getDashboardEquipo = async (req, res) => {
  const { id_equipo } = req.params;
  const temporadaQuery = Number(req.query.temporada);
  const temporadaSolicitada = Number.isInteger(temporadaQuery)
    ? temporadaQuery
    : null;

  try {
    const equipoResult = await pool.query(
      "SELECT * FROM dim_equipo WHERE id_equipo = $1",
      [id_equipo],
    );

    if (equipoResult.rows.length === 0) {
      return res.status(404).json({ error: "Equipo no encontrado" });
    }

    let temporada = temporadaSolicitada;
    if (!temporada) {
      const temporadaResult = await pool.query(
        "SELECT MAX(temporada) AS temporada FROM h_equipo_temporada WHERE id_equipo = $1",
        [id_equipo],
      );
      temporada = Number(temporadaResult.rows[0]?.temporada) || null;
    }

    if (!temporada) {
      return res
        .status(404)
        .json({ error: "No hay datos de temporada para este equipo" });
    }

    const ultimaTemporadaResult = await pool.query(
      "SELECT MAX(temporada) AS temporada FROM h_equipo_temporada",
    );
    const ultimaTemporada = toNumber(ultimaTemporadaResult.rows[0]?.temporada);
    const esUltimaTemporada = temporada === ultimaTemporada;

    const [
      temporadasResult,
      lineaResult,
      ratingsResult,
      radarResult,
      jugadoresResult,
      jugadoresPartidoResult,
      partidosResult,
      proximoPartidoResult,
      referenciasResult,
      necesidadesResult,
      recomendacionesResult,
      formaDmResult,
      montecarloResult,
    ] = await Promise.all([
      pool.query(
        `
          SELECT DISTINCT temporada
          FROM h_equipo_temporada
          WHERE id_equipo = $1
          ORDER BY temporada DESC;
        `,
        [id_equipo],
      ),
      pool.query(
        `
          SELECT
            jornada,
            posicion,
            puntos,
            dg,
            gf,
            gc,
            forma,
            partidos_jugados,
            victorias,
            empates,
            derrotas
          FROM h_equipo_temporada
          WHERE id_equipo = $1
            AND temporada = $2
          ORDER BY jornada ASC;
        `,
        [id_equipo, temporada],
      ),
      pool.query(
        `
          SELECT
            p.id_partido,
            t.jornada,
            AVG(h.nota) AS nota_media_equipo,
            rival.nombre_equipo AS rival,
            rival.logo AS rival_logo
          FROM h_jugador_partido h
          JOIN dim_partidos p ON h.id_partido = p.id_partido
          JOIN dim_tiempo t ON p.id_tiempo = t.id_tiempo
          LEFT JOIN dim_equipo rival
            ON rival.id_equipo = CASE
              WHEN p.id_local = $1 THEN p.id_visitante
              ELSE p.id_local
            END
          WHERE h.id_equipo = $1
            AND p.temporada = $2
            AND (p.id_local = $1 OR p.id_visitante = $1)
            AND p.status = 'Completado'
            AND h.nota > 1
          GROUP BY p.id_partido, t.jornada, rival.nombre_equipo, rival.logo
          ORDER BY t.jornada ASC, p.id_partido ASC;
        `,
        [id_equipo, temporada],
      ),
      pool.query(
        `
          WITH base AS (
            SELECT
              r.ataque,
              r.creacion,
              r.defensa,
              r.porteros,
              r.duelos,
              r.regates,
              CASE
                WHEN UPPER(TRIM(COALESCE(h.posicion, ''))) IN ('P', 'POR', 'PORTERO') THEN 'POR'
                WHEN UPPER(TRIM(COALESCE(h.posicion, ''))) IN ('DF', 'DEF', 'DEFENSA') THEN 'DEF'
                WHEN UPPER(TRIM(COALESCE(h.posicion, ''))) IN ('M', 'MC', 'MED', 'MEDIO', 'MEDIOCENTRO') THEN 'MED'
                WHEN UPPER(TRIM(COALESCE(h.posicion, ''))) IN ('DL', 'DEL', 'DELANTERO') THEN 'DEL'
                ELSE NULL
              END AS posicion_codigo
            FROM dm_jugadores_ratings r
            JOIN h_jugador_temporada h
              ON h.id_jugador = r.id_jugador
             AND h.temporada = r.temporada
             AND h.id_equipo = $1
            WHERE r.temporada = $2
          ),
          medias AS (
            SELECT
              AVG(COALESCE(defensa, 0)) FILTER (WHERE posicion_codigo = 'DEF') AS defensa_def,
              AVG(COALESCE(defensa, 0)) FILTER (WHERE posicion_codigo = 'MED') AS defensa_med,
              AVG(COALESCE(porteros, 0)) FILTER (WHERE posicion_codigo = 'POR') AS porteros_por,
              AVG(COALESCE(creacion, 0)) FILTER (WHERE posicion_codigo = 'MED') AS creacion_med,
              AVG(COALESCE(creacion, 0)) FILTER (WHERE posicion_codigo = 'DEL') AS creacion_del,
              AVG(COALESCE(ataque, 0)) FILTER (WHERE posicion_codigo = 'DEL') AS ataque_del,
              AVG(COALESCE(ataque, 0)) FILTER (WHERE posicion_codigo = 'MED') AS ataque_med,
              AVG(COALESCE(duelos, 0)) FILTER (WHERE posicion_codigo IS DISTINCT FROM 'POR') AS duelos_campo,
              AVG(COALESCE(regates, 0)) FILTER (WHERE posicion_codigo = 'DEL') AS regates_del,
              AVG(COALESCE(regates, 0)) FILTER (WHERE posicion_codigo = 'MED') AS regates_med
            FROM base
          )
          SELECT
            (COALESCE(ataque_del, 0) * 0.75) + (COALESCE(ataque_med, 0) * 0.25) AS ataque,
            (COALESCE(creacion_med, 0) * 0.60) + (COALESCE(creacion_del, 0) * 0.40) AS creacion,
            (COALESCE(defensa_def, 0) * 0.75) + (COALESCE(defensa_med, 0) * 0.25) AS defensa,
            COALESCE(porteros_por, 0) AS porteros,
            COALESCE(duelos_campo, 0) AS duelos,
            (COALESCE(regates_del, 0) * 0.50) + (COALESCE(regates_med, 0) * 0.50) AS regates
          FROM medias;
        `,
        [id_equipo, temporada],
      ),
      pool.query(
        `
          SELECT
            h.id_jugador,
            h.id_equipo,
            j.nombre,
            j.foto,
            h.posicion,
            h.partidos,
            h.minutos,
            h.titular,
            h.nota_media,
            h.goles,
            h.asistencias,
            h.tiros_totales,
            h.tiros_a_puerta,
            h.pases_totales,
            h.pases_clave,
            h.precision_pases,
            h.entradas,
            h.bloqueos,
            h.intercepciones,
            h.duelos_totales,
            h.duelos_ganados,
            h.regates_intentados,
            h.regates_exito,
            h.goles_concedidos,
            h.paradas,
            h.penaltis_parados,
            r.ataque,
            r.creacion,
            r.defensa,
            r.porteros,
            r.duelos,
            r.regates
          FROM h_jugador_temporada h
          LEFT JOIN dim_jugador j ON j.id_jugador = h.id_jugador
          LEFT JOIN dm_jugadores_ratings r
            ON r.id_jugador = h.id_jugador
           AND r.temporada = h.temporada
          WHERE h.id_equipo = $1
            AND h.temporada = $2
            AND EXISTS (
              SELECT 1
              FROM h_jugador_partido hp
              JOIN dim_partidos partido_real
                ON partido_real.id_partido = hp.id_partido
              WHERE hp.id_jugador = h.id_jugador
                AND hp.id_equipo = h.id_equipo
                AND partido_real.temporada = h.temporada
                AND (
                  partido_real.id_local = h.id_equipo
                  OR partido_real.id_visitante = h.id_equipo
                )
                AND partido_real.status = 'Completado'
            )
          ORDER BY COALESCE(h.minutos, 0) DESC, COALESCE(h.nota_media, 0) DESC, COALESCE(h.goles, 0) DESC, j.nombre ASC;
        `,
        [id_equipo, temporada],
      ),
      pool.query(
        `
          SELECT
            h.id_partido,
            h.id_jugador,
            t.jornada,
            h.nota,
            h.goles,
            h.minutos,
            rival.nombre_equipo AS rival,
            rival.logo AS rival_logo
          FROM h_jugador_partido h
          JOIN dim_partidos p ON p.id_partido = h.id_partido
          JOIN dim_tiempo t ON t.id_tiempo = p.id_tiempo
          LEFT JOIN dim_equipo rival
            ON rival.id_equipo = CASE
              WHEN p.id_local = $1 THEN p.id_visitante
              ELSE p.id_local
            END
          WHERE h.id_equipo = $1
            AND p.temporada = $2
            AND (p.id_local = $1 OR p.id_visitante = $1)
            AND p.status = 'Completado'
          ORDER BY t.jornada ASC, p.id_partido ASC, h.id_jugador ASC;
        `,
        [id_equipo, temporada],
      ),
      pool.query(
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
            e_visitante.logo AS logo_visitante,
            CASE
              WHEN p.id_local = $1 THEN 'LOCAL'
              ELSE 'VISITANTE'
            END AS condicion,
            CASE
              WHEN p.id_local = $1 THEN p.id_visitante
              ELSE p.id_local
            END AS id_rival,
            CASE
              WHEN p.id_local = $1 THEN e_visitante.nombre_equipo
              ELSE e_local.nombre_equipo
            END AS rival_nombre,
            CASE
              WHEN p.id_local = $1 THEN e_visitante.logo
              ELSE e_local.logo
            END AS rival_logo,
            CASE
              WHEN p.id_local = $1 THEN p.goles_local
              ELSE p.goles_visitante
            END AS goles_equipo,
            CASE
              WHEN p.id_local = $1 THEN p.goles_visitante
              ELSE p.goles_local
            END AS goles_rival,
            op.posicion AS posicion_rival
          FROM dim_partidos p
          JOIN dim_tiempo t ON p.id_tiempo = t.id_tiempo
          JOIN dim_equipo e_local ON p.id_local = e_local.id_equipo
          JOIN dim_equipo e_visitante ON p.id_visitante = e_visitante.id_equipo
          LEFT JOIN h_equipo_temporada op
            ON op.id_equipo = CASE
              WHEN p.id_local = $1 THEN p.id_visitante
              ELSE p.id_local
            END
           AND op.temporada = $2
           AND op.jornada = t.jornada
          WHERE p.temporada = $2
            AND (p.id_local = $1 OR p.id_visitante = $1)
            AND p.status = 'Completado'
          ORDER BY t.jornada ASC, p.hora ASC, p.id_partido ASC;
        `,
        [id_equipo, temporada],
      ),
      pool.query(
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
            AND p.temporada = $2
            AND p.status IS DISTINCT FROM 'Completado'
          ORDER BY t.jornada ASC, p.hora ASC
          LIMIT 1;
        `,
        [id_equipo, temporada],
      ),
      pool.query(
        `
          SELECT
            MAX(COALESCE(ataque, 0)) AS max_ataque,
            MAX(COALESCE(creacion, 0)) AS max_creacion,
            MAX(COALESCE(defensa, 0)) AS max_defensa,
            MAX(COALESCE(porteros, 0)) AS max_porteros,
            MAX(COALESCE(duelos, 0)) AS max_duelos,
            MAX(COALESCE(regates, 0)) AS max_regates
          FROM dm_jugadores_ratings
          WHERE temporada = $1;
        `,
        [temporada],
      ),
      pool.query(
        `
          SELECT
            id_equipo,
            temporada,
            necesidad,
            motivo
          FROM dm_necesidades_plantilla
          WHERE id_equipo = $1
            AND temporada = $2
          ORDER BY
            CASE
              WHEN necesidad ILIKE 'Sin necesidad%' THEN 2
              ELSE 1
            END,
            necesidad ASC;
        `,
        [id_equipo, temporada],
      ),
      esUltimaTemporada
        ? pool.query(
            `
              SELECT
                r.id_equipo,
                r.nombre_equipo,
                r.necesidad,
                r.id_jugador,
                r.nombre_jugador,
                r.id_equipo_actual,
                r.equipo_actual,
                r.score_recomendacion,
                r.motivo,
                j.foto,
                e.logo AS logo_equipo_actual
              FROM dm_recomendacion_fichajes r
              LEFT JOIN dim_jugador j ON j.id_jugador = r.id_jugador
              LEFT JOIN dim_equipo e ON e.id_equipo = r.id_equipo_actual
              WHERE r.id_equipo = $1
              ORDER BY r.necesidad ASC, r.score_recomendacion DESC NULLS LAST, r.nombre_jugador ASC;
            `,
            [id_equipo],
          )
        : Promise.resolve({ rows: [] }),
      pool.query(
        `
          SELECT
            temporada,
            id_equipo,
            nombre_equipo,
            puntuacion_forma,
            estado,
            tendencia,
            variabilidad
          FROM dm_forma_equipos
          WHERE id_equipo = $1
            AND temporada = $2;
        `,
        [id_equipo, temporada],
      ),
      esUltimaTemporada
        ? pool.query(
            `
              SELECT
                id_equipo,
                equipo,
                campeon_pct,
                champions_pct,
                europa_pct,
                media_tabla_pct,
                descenso_pct
              FROM dm_simulacion_montecarlo
              WHERE id_equipo = $1;
            `,
            [id_equipo],
          )
        : Promise.resolve({ rows: [] }),
    ]);

    const linea = lineaResult.rows || [];
    const ratingsLinea = ratingsResult.rows || [];
    const radar = radarResult.rows[0] || {};
    const jugadores = jugadoresResult.rows || [];
    const jugadoresPartido = jugadoresPartidoResult.rows || [];
    const partidos = partidosResult.rows || [];
    const proximoPartido = proximoPartidoResult.rows[0] || null;
    const referencias = referenciasResult.rows[0] || {};
    const temporadasDisponibles = (temporadasResult.rows || [])
      .map((fila) => toNumber(fila.temporada))
      .filter((valor) => Number.isFinite(valor));
    const ultimaFila = linea[linea.length - 1] || null;

    const partidosCompletados = partidos.map((partido) => {
      const golesEquipo = toNumber(partido.goles_equipo);
      const golesRival = toNumber(partido.goles_rival);
      const resultado =
        golesEquipo > golesRival ? "V" : golesEquipo < golesRival ? "D" : "E";

      return {
        ...partido,
        goles_equipo: golesEquipo,
        goles_rival: golesRival,
        resultado,
        puntos: resultado === "V" ? 3 : resultado === "E" ? 1 : 0,
        posicion_rival: Number.isFinite(Number(partido.posicion_rival))
          ? Number(partido.posicion_rival)
          : null,
      };
    });

    const ultimosPartidos = [...partidosCompletados].slice(-5).reverse();
    const jornadaMaxima = partidosCompletados.reduce(
      (max, partido) => Math.max(max, toNumber(partido.jornada)),
      0,
    );

    const resumenLocalVisitante = partidosCompletados.reduce(
      (acc, partido) => {
        const clave = partido.condicion === "LOCAL" ? "local" : "visitante";
        acc[clave].partidos += 1;
        acc[clave].gf += partido.goles_equipo;
        acc[clave].gc += partido.goles_rival;
        acc[clave].puntos += partido.puntos;
        acc[clave].victorias += partido.resultado === "V" ? 1 : 0;
        acc[clave].empates += partido.resultado === "E" ? 1 : 0;
        acc[clave].derrotas += partido.resultado === "D" ? 1 : 0;
        return acc;
      },
      {
        local: {
          partidos: 0,
          gf: 0,
          gc: 0,
          puntos: 0,
          victorias: 0,
          empates: 0,
          derrotas: 0,
        },
        visitante: {
          partidos: 0,
          gf: 0,
          gc: 0,
          puntos: 0,
          victorias: 0,
          empates: 0,
          derrotas: 0,
        },
      },
    );

    const bandasMapa = {
      "Top 6": { victorias: 0, empates: 0, derrotas: 0, partidos: 0 },
      "7-17": { victorias: 0, empates: 0, derrotas: 0, partidos: 0 },
      Descenso: { victorias: 0, empates: 0, derrotas: 0, partidos: 0 },
    };

    partidosCompletados.forEach((partido) => {
      const posicionRival = Number(partido.posicion_rival);
      const banda =
        Number.isFinite(posicionRival) && posicionRival <= 6
          ? "Top 6"
          : Number.isFinite(posicionRival) && posicionRival <= 17
            ? "7-17"
            : "Descenso";

      bandasMapa[banda].partidos += 1;
      if (partido.resultado === "V") bandasMapa[banda].victorias += 1;
      if (partido.resultado === "E") bandasMapa[banda].empates += 1;
      if (partido.resultado === "D") bandasMapa[banda].derrotas += 1;
    });

    const bandas = Object.entries(bandasMapa).map(([banda, valores]) => ({
      banda,
      ...valores,
    }));

    const clasificacionActual = ultimaFila
      ? {
          temporada,
          jornada: ultimaFila.jornada,
          posicion: ultimaFila.posicion,
          puntos: ultimaFila.puntos,
          dg: ultimaFila.dg,
          gf: ultimaFila.gf,
          gc: ultimaFila.gc,
          forma: ultimaFila.forma,
          partidos_jugados: ultimaFila.partidos_jugados,
          victorias: ultimaFila.victorias,
          empates: ultimaFila.empates,
          derrotas: ultimaFila.derrotas,
        }
      : null;

    const posicionFinal = toNumber(clasificacionActual?.posicion);
    const montecarloHistorico =
      !esUltimaTemporada && posicionFinal
        ? {
            id_equipo: Number(id_equipo),
            equipo: equipoResult.rows[0]?.nombre_equipo || null,
            campeon_pct: posicionFinal === 1 ? 100 : 0,
            champions_pct: posicionFinal >= 1 && posicionFinal <= 4 ? 100 : 0,
            europa_pct: posicionFinal >= 1 && posicionFinal <= 7 ? 100 : 0,
            media_tabla_pct:
              posicionFinal >= 8 && posicionFinal <= 17 ? 100 : 0,
            descenso_pct: posicionFinal >= 18 && posicionFinal <= 20 ? 100 : 0,
          }
        : null;

    res.json({
      temporada,
      jornada_maxima: jornadaMaxima || null,
      temporadas_disponibles: temporadasDisponibles,
      equipo: equipoResult.rows[0],
      clasificacion_actual: clasificacionActual,
      proximo_partido: proximoPartido,
      posicion_linea: linea.map((fila) => ({
        jornada: toNumber(fila.jornada),
        posicion: toNumber(fila.posicion),
        puntos: toNumber(fila.puntos),
        dg: toNumber(fila.dg),
        gf: toNumber(fila.gf),
        gc: toNumber(fila.gc),
        forma: fila.forma || "",
      })),
      media_ratings_partido: ratingsLinea.map((fila) => ({
        id_partido: toNumber(fila.id_partido),
        jornada: toNumber(fila.jornada),
        nota_media_equipo: parseFloat(fila.nota_media_equipo) || 0,
        rival: fila.rival || null,
        rival_logo: fila.rival_logo || null,
      })),
      jugadores,
      jugadores_partido: jugadoresPartido.map((fila) => ({
        id_partido: toNumber(fila.id_partido),
        id_jugador: toNumber(fila.id_jugador),
        jornada: toNumber(fila.jornada),
        nota: parseFloat(fila.nota) || 0,
        goles: toNumber(fila.goles),
        minutos: toNumber(fila.minutos),
        rival: fila.rival || null,
        rival_logo: fila.rival_logo || null,
      })),
      ultimos_partidos: ultimosPartidos,
      resumen_local_visitante: resumenLocalVisitante,
      bandas,
      forma_dm: formaDmResult.rows[0] || null,
      montecarlo: montecarloResult.rows[0] || montecarloHistorico,
      fichajes: {
        es_ultima_temporada: esUltimaTemporada,
        necesidades: necesidadesResult.rows || [],
        recomendaciones: recomendacionesResult.rows || [],
      },
      radar_referencias: {
        max_ataque: toNumber(referencias.max_ataque) || 1,
        max_creacion: toNumber(referencias.max_creacion) || 1,
        max_defensa: toNumber(referencias.max_defensa) || 1,
        max_porteros: toNumber(referencias.max_porteros) || 1,
        max_duelos: toNumber(referencias.max_duelos) || 1,
        max_regates: toNumber(referencias.max_regates) || 1,
      },
      radar_equipo: {
        ataque: parseFloat(radar.ataque) || 0,
        creacion: parseFloat(radar.creacion) || 0,
        defensa: parseFloat(radar.defensa) || 0,
        porteros: parseFloat(radar.porteros) || 0,
        duelos: parseFloat(radar.duelos) || 0,
        regates: parseFloat(radar.regates) || 0,
      },
    });
  } catch (error) {
    console.error("Error al obtener el dashboard del equipo:", error);
    res.status(500).json({ error: "Error interno del servidor" });
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
  getDashboardEquipo,
};
