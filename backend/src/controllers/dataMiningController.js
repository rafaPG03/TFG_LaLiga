const pool = require("../config/db");

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const toInteger = (value) => {
  const number = Number(value);
  return Number.isInteger(number) ? number : null;
};

const parseIds = (value) =>
  String(value || "")
    .split(",")
    .map((id) => toInteger(id))
    .filter((id) => id !== null);

const normalizarFila = (row) =>
  Object.fromEntries(
    Object.entries(row).map(([key, value]) => {
      if (
        value !== null &&
        [
          "puntuacion_forma",
          "tendencia",
          "variabilidad",
          "score_temporada",
          "score_reciente",
          "evolucion",
          "ataque",
          "creacion",
          "defensa",
          "porteros",
          "duelos",
          "regates",
          "campeon_pct",
          "champions_pct",
          "europa_pct",
          "media_tabla_pct",
          "descenso_pct",
          "score_recomendacion",
          "prob_victoria_local",
          "prob_empate",
          "prob_victoria_visitante",
          "goles_local_esperados",
          "goles_visitante_esperados",
          "probabilidad",
          "similitud",
        ].includes(key)
      ) {
        return [key, toNumber(value)];
      }

      return [key, value];
    }),
  );

const obtenerContextoTemporada = async (temporadaQuery) => {
  const result = await pool.query(`
    SELECT
      MAX(temporada)::integer AS temporada_actual,
      ARRAY_AGG(DISTINCT temporada ORDER BY temporada DESC) AS temporadas
    FROM h_equipo_temporada;
  `);

  const temporadaActual = toInteger(result.rows[0]?.temporada_actual);
  const temporadas = (result.rows[0]?.temporadas || [])
    .map(toInteger)
    .filter((temporada) => temporada !== null);
  const solicitada = toInteger(temporadaQuery);
  const temporada =
    solicitada && temporadas.includes(solicitada)
      ? solicitada
      : temporadaActual;

  return {
    temporada,
    temporada_actual: temporadaActual,
    temporadas,
    es_temporada_actual: temporada === temporadaActual,
  };
};

const crearMontecarloHistorico = (row) => {
  const posicion = toInteger(row.posicion);

  return {
    id_equipo: toInteger(row.id_equipo),
    equipo: row.nombre_equipo,
    codigo: row.codigo,
    logo: row.logo,
    posicion,
    campeon_pct: posicion === 1 ? 100 : 0,
    champions_pct: posicion >= 1 && posicion <= 4 ? 100 : 0,
    europa_pct: posicion >= 1 && posicion <= 7 ? 100 : 0,
    media_tabla_pct: posicion >= 8 && posicion <= 17 ? 100 : 0,
    descenso_pct: posicion >= 18 && posicion <= 20 ? 100 : 0,
  };
};

const obtenerMontecarlo = async (contexto, idsEquipo = []) => {
  const filtroIds = idsEquipo.length > 0;

  if (contexto.es_temporada_actual) {
    const result = await pool.query(
      `
        SELECT
          m.id_equipo,
          COALESCE(m.equipo, e.nombre_equipo) AS equipo,
          e.codigo,
          e.logo,
          m.campeon_pct,
          m.champions_pct,
          m.europa_pct,
          m.media_tabla_pct,
          m.descenso_pct
        FROM dm_simulacion_montecarlo m
        LEFT JOIN dim_equipo e ON e.id_equipo = m.id_equipo
        WHERE ($1::boolean = false OR m.id_equipo = ANY($2::integer[]))
        ORDER BY m.campeon_pct DESC, m.champions_pct DESC, m.id_equipo;
      `,
      [filtroIds, idsEquipo],
    );

    return result.rows.map(normalizarFila);
  }

  const result = await pool.query(
    `
      SELECT DISTINCT ON (h.id_equipo)
        h.id_equipo,
        e.nombre_equipo,
        e.codigo,
        e.logo,
        h.posicion
      FROM h_equipo_temporada h
      JOIN dim_equipo e ON e.id_equipo = h.id_equipo
      WHERE h.temporada = $1
        AND ($2::boolean = false OR h.id_equipo = ANY($3::integer[]))
      ORDER BY h.id_equipo, h.jornada DESC;
    `,
    [contexto.temporada, filtroIds, idsEquipo],
  );

  return result.rows
    .map(crearMontecarloHistorico)
    .sort((a, b) => (a.posicion || 99) - (b.posicion || 99));
};

const expandirSimilares = (row) => {
  if (!row) return [];

  return [1, 2, 3, 4, 5]
    .map((index) => ({
      id_jugador: toInteger(row[`id_similar${index}`]),
      nombre: row[`nombre_similar${index}`],
      similitud: toNumber(row[`similitud${index}`]),
    }))
    .filter((item) => item.id_jugador && item.nombre);
};

const getCatalogos = async (req, res) => {
  try {
    const contexto = await obtenerContextoTemporada(req.query.temporada);
    const equiposResult = await pool.query(
      `
        SELECT DISTINCT e.id_equipo, e.nombre_equipo, e.codigo, e.logo
        FROM h_equipo_temporada h
        JOIN dim_equipo e ON e.id_equipo = h.id_equipo
        WHERE h.temporada = $1
        ORDER BY e.nombre_equipo;
      `,
      [contexto.temporada],
    );

    return res.json({
      meta: contexto,
      equipos: equiposResult.rows,
    });
  } catch (error) {
    console.error("Error al cargar los catalogos de Data Mining:", error);
    return res
      .status(500)
      .json({ error: "No se pudieron cargar los filtros de analisis" });
  }
};

const getEquipos = async (req, res) => {
  const idEquipo = toInteger(req.query.id_equipo);

  try {
    const contexto = await obtenerContextoTemporada(req.query.temporada);
    const [rankingResult, necesidadesResult, montecarlo] = await Promise.all([
      pool.query(
        `
          SELECT
            e.id_equipo,
            e.nombre_equipo,
            e.codigo,
            e.logo,
            f.puntuacion_forma,
            f.estado,
            f.tendencia,
            f.variabilidad
          FROM (
            SELECT DISTINCT id_equipo
            FROM h_equipo_temporada
            WHERE temporada = $1
          ) base
          JOIN dim_equipo e ON e.id_equipo = base.id_equipo
          LEFT JOIN dm_forma_equipos f
            ON f.id_equipo = base.id_equipo
           AND f.temporada = $1
          ORDER BY f.puntuacion_forma DESC NULLS LAST, e.nombre_equipo;
        `,
        [contexto.temporada],
      ),
      idEquipo
        ? pool.query(
            `
              SELECT id_equipo, temporada, necesidad, motivo
              FROM dm_necesidades_plantilla
              WHERE id_equipo = $1 AND temporada = $2
              ORDER BY
                CASE WHEN necesidad ILIKE 'Sin necesidad%' THEN 2 ELSE 1 END,
                necesidad;
            `,
            [idEquipo, contexto.temporada],
          )
        : Promise.resolve({ rows: [] }),
      obtenerMontecarlo(contexto, idEquipo ? [idEquipo] : []),
    ]);

    let recomendaciones = [];
    if (idEquipo && contexto.es_temporada_actual) {
      const recomendacionesResult = await pool.query(
        `
          SELECT
            r.id_equipo,
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
          ORDER BY r.score_recomendacion DESC NULLS LAST, r.nombre_jugador;
        `,
        [idEquipo],
      );
      recomendaciones = recomendacionesResult.rows.map(normalizarFila);
    }

    const ranking = rankingResult.rows.map(normalizarFila);
    const equipo = idEquipo
      ? ranking.find((item) => Number(item.id_equipo) === idEquipo) || null
      : null;

    return res.json({
      meta: {
        ...contexto,
        montecarlo: contexto.es_temporada_actual
          ? "simulacion"
          : "resultado_final",
        recomendaciones: contexto.es_temporada_actual
          ? "actual"
          : "no_disponible",
      },
      ranking,
      montecarlo,
      equipo_seleccionado: equipo
        ? {
            ...equipo,
            montecarlo: montecarlo[0] || null,
            necesidades: necesidadesResult.rows,
            recomendaciones,
          }
        : null,
    });
  } catch (error) {
    console.error("Error al cargar el analisis de equipos:", error);
    return res
      .status(500)
      .json({ error: "No se pudo cargar el analisis de equipos" });
  }
};

const getJugadores = async (req, res) => {
  const idJugador = toInteger(req.query.id_jugador);
  const idsFavoritos = parseIds(req.query.favoritos);

  try {
    const contexto = await obtenerContextoTemporada(req.query.temporada);
    const rankingPromise = contexto.es_temporada_actual
      ? pool.query(
          `
            SELECT
              f.id_jugador,
              COALESCE(f.nombre_jugador, j.nombre) AS nombre,
              j.foto,
              equipo.id_equipo,
              equipo.nombre_equipo,
              equipo.logo AS logo_equipo,
              f.estado,
              f.score_temporada,
              f.score_reciente,
              f.evolucion
            FROM dm_estado_forma_jugadores f
            LEFT JOIN dim_jugador j ON j.id_jugador = f.id_jugador
            LEFT JOIN LATERAL (
              SELECT ht.id_equipo, e.nombre_equipo, e.logo
              FROM h_jugador_temporada ht
              LEFT JOIN dim_equipo e ON e.id_equipo = ht.id_equipo
              WHERE ht.id_jugador = f.id_jugador AND ht.temporada = $1
              ORDER BY ht.partidos DESC NULLS LAST, ht.id_equipo
              LIMIT 1
            ) equipo ON true
            ORDER BY f.score_reciente DESC NULLS LAST, f.score_temporada DESC NULLS LAST
            LIMIT 40;
          `,
          [contexto.temporada],
        )
      : Promise.resolve({ rows: [] });

    const favoritosPromise = idsFavoritos.length
      ? pool.query(
          `
            SELECT
              j.id_jugador,
              j.nombre,
              j.foto,
              equipo.id_equipo,
              equipo.nombre_equipo,
              equipo.logo AS logo_equipo
            FROM dim_jugador j
            LEFT JOIN LATERAL (
              SELECT ht.id_equipo, e.nombre_equipo, e.logo
              FROM h_jugador_temporada ht
              LEFT JOIN dim_equipo e ON e.id_equipo = ht.id_equipo
              WHERE ht.id_jugador = j.id_jugador AND ht.temporada = $1
              ORDER BY ht.partidos DESC NULLS LAST, ht.id_equipo
              LIMIT 1
            ) equipo ON true
            WHERE j.id_jugador = ANY($2::integer[])
            ORDER BY j.nombre;
          `,
          [contexto.temporada, idsFavoritos],
        )
      : Promise.resolve({ rows: [] });

    const [rankingResult, favoritosResult] = await Promise.all([
      rankingPromise,
      favoritosPromise,
    ]);

    let detalle = null;
    if (idJugador) {
      const [jugadorResult, ratingResult, similitudResult, formaResult] =
        await Promise.all([
          pool.query(
            `
            SELECT
              j.id_jugador,
              j.nombre,
              j.foto,
              equipo.id_equipo,
              equipo.nombre_equipo,
              equipo.logo AS logo_equipo
            FROM dim_jugador j
            LEFT JOIN LATERAL (
              SELECT ht.id_equipo, e.nombre_equipo, e.logo
              FROM h_jugador_temporada ht
              LEFT JOIN dim_equipo e ON e.id_equipo = ht.id_equipo
              WHERE ht.id_jugador = j.id_jugador AND ht.temporada = $2
              ORDER BY ht.partidos DESC NULLS LAST, ht.id_equipo
              LIMIT 1
            ) equipo ON true
            WHERE j.id_jugador = $1;
          `,
            [idJugador, contexto.temporada],
          ),
          pool.query(
            `
            SELECT id_jugador, temporada, nombre, ataque, creacion, defensa, porteros, duelos, regates
            FROM dm_jugadores_ratings
            WHERE id_jugador = $1 AND temporada = $2;
          `,
            [idJugador, contexto.temporada],
          ),
          pool.query(
            `
            SELECT *
            FROM dm_similitud_jugadores
            WHERE id_jugador = $1 AND temporada = $2;
          `,
            [idJugador, contexto.temporada],
          ),
          contexto.es_temporada_actual
            ? pool.query(
                `
                SELECT estado, score_temporada, score_reciente, evolucion
                FROM dm_estado_forma_jugadores
                WHERE id_jugador = $1;
              `,
                [idJugador],
              )
            : Promise.resolve({ rows: [] }),
        ]);

      detalle = jugadorResult.rows[0]
        ? {
            ...jugadorResult.rows[0],
            forma: formaResult.rows[0]
              ? normalizarFila(formaResult.rows[0])
              : null,
            ratings: ratingResult.rows[0]
              ? normalizarFila(ratingResult.rows[0])
              : null,
            similares: expandirSimilares(similitudResult.rows[0]),
          }
        : null;
    }

    return res.json({
      meta: {
        ...contexto,
        forma_jugadores: contexto.es_temporada_actual
          ? "actual"
          : "no_disponible",
      },
      ranking: rankingResult.rows.map(normalizarFila),
      favoritos: favoritosResult.rows,
      jugador_seleccionado: detalle,
    });
  } catch (error) {
    console.error("Error al cargar el analisis de jugadores:", error);
    return res
      .status(500)
      .json({ error: "No se pudo cargar el analisis de jugadores" });
  }
};

const buscarJugadores = async (req, res) => {
  const termino = String(req.query.q || "").trim();
  if (termino.length < 2) {
    return res.json([]);
  }

  try {
    const contexto = await obtenerContextoTemporada(req.query.temporada);
    const result = await pool.query(
      `
        SELECT
          j.id_jugador,
          j.nombre,
          j.foto,
          equipo.id_equipo,
          equipo.nombre_equipo,
          equipo.logo AS logo_equipo
        FROM dim_jugador j
        JOIN LATERAL (
          SELECT ht.id_equipo, e.nombre_equipo, e.logo
          FROM h_jugador_temporada ht
          LEFT JOIN dim_equipo e ON e.id_equipo = ht.id_equipo
          WHERE ht.id_jugador = j.id_jugador AND ht.temporada = $1
          ORDER BY ht.partidos DESC NULLS LAST, ht.id_equipo
          LIMIT 1
        ) equipo ON true
        WHERE j.nombre ILIKE $2 OR j.nombre_completo ILIKE $2
        ORDER BY j.nombre
        LIMIT 20;
      `,
      [contexto.temporada, `%${termino}%`],
    );

    return res.json(result.rows);
  } catch (error) {
    console.error("Error al buscar jugadores para Data Mining:", error);
    return res.status(500).json({ error: "No se pudo completar la busqueda" });
  }
};

const getPredicciones = async (req, res) => {
  try {
    const contexto = await obtenerContextoTemporada(req.query.temporada);
    const partidosResult = await pool.query(
      `
        SELECT
          p.id_partido,
          p.temporada,
          p.id_local,
          local.nombre_equipo AS equipo_local,
          local.codigo AS codigo_local,
          local.logo AS logo_local,
          p.id_visitante,
          visitante.nombre_equipo AS equipo_visitante,
          visitante.codigo AS codigo_visitante,
          visitante.logo AS logo_visitante,
          p.hora,
          p.status,
          t.jornada,
          TO_CHAR(MAKE_DATE(t.anio, t.mes, t.dia), 'YYYY-MM-DD') AS fecha,
          pred.prob_victoria_local,
          pred.prob_empate,
          pred.prob_victoria_visitante,
          pred.prediccion,
          goles.goles_local_esperados,
          goles.goles_visitante_esperados,
          goles.resultado_estimado,
          goles.marcador_estimado
        FROM dm_prediccion_partidos pred
        JOIN dim_partidos p ON p.id_partido = pred.id_partido
        LEFT JOIN dim_tiempo t ON t.id_tiempo = p.id_tiempo
        LEFT JOIN dim_equipo local ON local.id_equipo = p.id_local
        LEFT JOIN dim_equipo visitante ON visitante.id_equipo = p.id_visitante
        LEFT JOIN dm_golesesperados_partidos goles ON goles.id_partido = p.id_partido
        WHERE p.temporada = $1
          AND COALESCE(p.status, '') <> 'Completado'
        ORDER BY t.anio, t.mes, t.dia, p.hora, p.id_partido
        LIMIT 40;
      `,
      [contexto.temporada],
    );

    const idsPartido = partidosResult.rows.map((row) => Number(row.id_partido));
    const goleadoresResult = idsPartido.length
      ? await pool.query(
          `
            SELECT
              g.id_partido,
              g.id_equipo,
              g.id_jugador,
              g.nombre_jugador,
              g.probabilidad,
              j.foto,
              e.nombre_equipo
            FROM dm_probables_goleadores g
            LEFT JOIN dim_jugador j ON j.id_jugador = g.id_jugador
            LEFT JOIN dim_equipo e ON e.id_equipo = g.id_equipo
            WHERE g.id_partido = ANY($1::bigint[])
            ORDER BY g.id_partido, g.id_equipo, g.probabilidad DESC NULLS LAST;
          `,
          [idsPartido],
        )
      : { rows: [] };

    const goleadoresPorPartido = goleadoresResult.rows.reduce((acc, row) => {
      const key = String(row.id_partido);
      if (!acc[key]) acc[key] = [];
      acc[key].push(normalizarFila(row));
      return acc;
    }, {});

    const partidos = partidosResult.rows.map((row) => ({
      ...normalizarFila(row),
      probables_goleadores: goleadoresPorPartido[String(row.id_partido)] || [],
    }));

    return res.json({ meta: contexto, partidos });
  } catch (error) {
    console.error("Error al cargar las predicciones:", error);
    return res
      .status(500)
      .json({ error: "No se pudieron cargar las predicciones" });
  }
};

const getFavoritos = async (req, res) => {
  const idUsuario = toInteger(req.params.id_usuario);
  if (!idUsuario) {
    return res.status(400).json({ error: "El usuario no es valido" });
  }

  try {
    const contexto = await obtenerContextoTemporada(req.query.temporada);
    const favoritosResult = await pool.query(
      `
        SELECT id_equipo, id_jugador
        FROM h_usuario_favoritos
        WHERE id_usuario = $1;
      `,
      [idUsuario],
    );

    const idsEquipo = favoritosResult.rows
      .map((row) => toInteger(row.id_equipo))
      .filter((id) => id !== null);
    const idsJugador = favoritosResult.rows
      .map((row) => toInteger(row.id_jugador))
      .filter((id) => id !== null);

    const [
      equiposResult,
      necesidadesResult,
      montecarlo,
      jugadoresResult,
      similitudesResult,
    ] = await Promise.all([
      idsEquipo.length
        ? pool.query(
            `
                SELECT
                  e.id_equipo,
                  e.nombre_equipo,
                  e.codigo,
                  e.logo,
                  f.puntuacion_forma,
                  f.estado,
                  f.tendencia,
                  f.variabilidad
                FROM dim_equipo e
                LEFT JOIN dm_forma_equipos f
                  ON f.id_equipo = e.id_equipo
                 AND f.temporada = $2
                WHERE e.id_equipo = ANY($1::integer[])
                ORDER BY e.nombre_equipo;
              `,
            [idsEquipo, contexto.temporada],
          )
        : Promise.resolve({ rows: [] }),
      idsEquipo.length
        ? pool.query(
            `
                SELECT DISTINCT ON (id_equipo)
                  id_equipo, necesidad, motivo
                FROM dm_necesidades_plantilla
                WHERE id_equipo = ANY($1::integer[]) AND temporada = $2
                ORDER BY
                  id_equipo,
                  CASE WHEN necesidad ILIKE 'Sin necesidad%' THEN 2 ELSE 1 END,
                  necesidad;
              `,
            [idsEquipo, contexto.temporada],
          )
        : Promise.resolve({ rows: [] }),
      obtenerMontecarlo(contexto, idsEquipo),
      idsJugador.length
        ? pool.query(
            `
                SELECT
                  j.id_jugador,
                  j.nombre,
                  j.foto,
                  equipo.id_equipo,
                  equipo.nombre_equipo,
                  equipo.logo AS logo_equipo,
                  forma.estado,
                  forma.score_temporada,
                  forma.score_reciente,
                  forma.evolucion,
                  rating.ataque,
                  rating.creacion,
                  rating.defensa,
                  rating.porteros,
                  rating.duelos,
                  rating.regates
                FROM dim_jugador j
                LEFT JOIN LATERAL (
                  SELECT ht.id_equipo, e.nombre_equipo, e.logo
                  FROM h_jugador_temporada ht
                  LEFT JOIN dim_equipo e ON e.id_equipo = ht.id_equipo
                  WHERE ht.id_jugador = j.id_jugador AND ht.temporada = $2
                  ORDER BY ht.partidos DESC NULLS LAST, ht.id_equipo
                  LIMIT 1
                ) equipo ON true
                LEFT JOIN dm_jugadores_ratings rating
                  ON rating.id_jugador = j.id_jugador
                 AND rating.temporada = $2
                LEFT JOIN dm_estado_forma_jugadores forma
                  ON forma.id_jugador = j.id_jugador
                 AND $3::boolean = true
                WHERE j.id_jugador = ANY($1::integer[])
                ORDER BY j.nombre;
              `,
            [idsJugador, contexto.temporada, contexto.es_temporada_actual],
          )
        : Promise.resolve({ rows: [] }),
      idsJugador.length
        ? pool.query(
            `
                SELECT *
                FROM dm_similitud_jugadores
                WHERE id_jugador = ANY($1::integer[]) AND temporada = $2;
              `,
            [idsJugador, contexto.temporada],
          )
        : Promise.resolve({ rows: [] }),
    ]);

    const necesidadesMap = new Map(
      necesidadesResult.rows.map((row) => [Number(row.id_equipo), row]),
    );
    const montecarloMap = new Map(
      montecarlo.map((row) => [Number(row.id_equipo), row]),
    );
    const similitudesMap = new Map(
      similitudesResult.rows.map((row) => [
        Number(row.id_jugador),
        expandirSimilares(row),
      ]),
    );

    const prediccionesResult = idsEquipo.length
      ? await pool.query(
          `
            SELECT
              p.id_partido,
              p.id_local,
              local.nombre_equipo AS equipo_local,
              p.id_visitante,
              visitante.nombre_equipo AS equipo_visitante,
              TO_CHAR(MAKE_DATE(t.anio, t.mes, t.dia), 'YYYY-MM-DD') AS fecha,
              pred.prob_victoria_local,
              pred.prob_empate,
              pred.prob_victoria_visitante,
              pred.prediccion
            FROM dm_prediccion_partidos pred
            JOIN dim_partidos p ON p.id_partido = pred.id_partido
            LEFT JOIN dim_tiempo t ON t.id_tiempo = p.id_tiempo
            LEFT JOIN dim_equipo local ON local.id_equipo = p.id_local
            LEFT JOIN dim_equipo visitante ON visitante.id_equipo = p.id_visitante
            WHERE p.temporada = $2
              AND COALESCE(p.status, '') <> 'Completado'
              AND (p.id_local = ANY($1::integer[]) OR p.id_visitante = ANY($1::integer[]))
            ORDER BY t.anio, t.mes, t.dia, p.hora;
          `,
          [idsEquipo, contexto.temporada],
        )
      : { rows: [] };

    const proximaPrediccionMap = new Map();
    prediccionesResult.rows.forEach((partido) => {
      [Number(partido.id_local), Number(partido.id_visitante)].forEach((id) => {
        if (idsEquipo.includes(id) && !proximaPrediccionMap.has(id)) {
          proximaPrediccionMap.set(id, normalizarFila(partido));
        }
      });
    });

    return res.json({
      meta: contexto,
      equipos: equiposResult.rows.map((row) => ({
        ...normalizarFila(row),
        necesidad_principal: necesidadesMap.get(Number(row.id_equipo)) || null,
        montecarlo: montecarloMap.get(Number(row.id_equipo)) || null,
        proxima_prediccion:
          proximaPrediccionMap.get(Number(row.id_equipo)) || null,
      })),
      jugadores: jugadoresResult.rows.map((row) => ({
        ...normalizarFila(row),
        similares: similitudesMap.get(Number(row.id_jugador)) || [],
      })),
    });
  } catch (error) {
    console.error("Error al cargar los favoritos de Data Mining:", error);
    return res
      .status(500)
      .json({ error: "No se pudo cargar el analisis de favoritos" });
  }
};

module.exports = {
  getCatalogos,
  getEquipos,
  getJugadores,
  buscarJugadores,
  getPredicciones,
  getFavoritos,
};
