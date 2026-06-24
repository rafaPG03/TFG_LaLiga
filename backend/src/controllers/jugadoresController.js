const pool = require('../config/db');

const get20JugadoresMasPartidos = async (req, res) => {
    try {
        const query = `
            SELECT 
                j.id_jugador, 
                j.nombre, 
                j.foto,
                SUM(p.partidos) AS total_partidos
            FROM dim_jugador j
            JOIN h_jugador_temporada p ON j.id_jugador = p.id_jugador
            GROUP BY j.id_jugador, j.nombre, j.foto
            ORDER BY total_partidos DESC
            LIMIT 20
        `;

        const result = await pool.query(query);

        // 2. En Postgres (librería 'pg'), los datos están en result.rows
        res.json(result.rows);

    } catch (error) {
        console.error('Error al obtener los jugadores:', error);
        res.status(500).json({ 
            error: 'Error interno del servidor',
            message: error.message 
        });
    }
};

const getJugadores = async (req, res) => {
    try {
        const query = `
            SELECT 
                id_jugador, 
                nombre, 
                foto
            FROM dim_jugador
            ORDER BY nombre
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener los jugadores:', error);
        res.status(500).json({ 
            error: 'Error interno del servidor',
            message: error.message 
        });
    }
};

const getJugadorPorId = async (req, res) => {
    const { id_jugador } = req.params;
    try {
        const query = `
            SELECT
                id_jugador,
                nombre,
                foto
            FROM dim_jugador
            WHERE id_jugador = $1
        `;
        const result = await pool.query(query, [id_jugador]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Jugador no encontrado' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error al obtener el jugador:', error);
        res.status(500).json({ 
            error: 'Error interno del servidor',
            message: error.message 
        });
    }
};

const getInfoJugador = async (req, res) => {
    const { id_jugador } = req.params;
    try {
        const query = `
            SELECT 
    j.*,
    ultimo_p.id_equipo AS id_ultimo_equipo,
    ultimo_p.posicion ,
    e.nombre_equipo AS nombre_ultimo_equipo,
    e.logo AS logo_ultimo_equipo
FROM dim_jugador j
-- Buscamos el último registro de cada jugador usando una subconsulta correlacionada
LEFT JOIN LATERAL (
    SELECT h.id_partido, h.id_equipo, h.posicion
    FROM h_jugador_partido h
    JOIN dim_partidos p ON h.id_partido = p.id_partido
    WHERE h.id_jugador = j.id_jugador
    ORDER BY p.id_tiempo DESC, p.hora DESC
    LIMIT 1
) ultimo_p ON TRUE
-- Unimos con las dimensiones para sacar los nombres y logos
LEFT JOIN dim_partidos p ON ultimo_p.id_partido = p.id_partido
LEFT JOIN dim_equipo e ON ultimo_p.id_equipo = e.id_equipo
where j.id_jugador = $1`
        const result = await pool.query(query, [id_jugador]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Jugador no encontrado' });
        }
        res.json(result.rows[0]);

    } catch (error) {
        console.error('Error al obtener la información del jugador:', error);
        res.status(500).json({ 
            error: 'Error interno del servidor',
            message: error.message 
        });
    }
};

const getPartidosJugador = async (req, res) => {
    const { id_jugador } = req.params;
    const { temporada } = req.query; // Capturamos la temporada opcional de la URL (?temporada=2024)

    try {
        let query = `
SELECT 
    dp.id_partido, 
    dp.id_tiempo, 
    dp.temporada,
    dp.id_local, 
    dp.id_visitante,
    dl.nombre_equipo AS equipo_local,
    dl.logo AS logo_local,
    dv.nombre_equipo AS equipo_visitante,
    dv.logo AS logo_visitante,
    dp.goles_local, 
    dp.goles_visitante,
    dt.dia,
    dt.nombre_mes,
    dt.anio,
    TO_CHAR(MAKE_DATE(dt.anio, dt.mes, dt.dia), 'YYYY-MM-DD') AS fecha_iso,
    de.id_equipo as id_equipo_jugador,
    hjp.nota, 
    hjp.sustituto, 
    hjp.minutos,
    hjp.goles,           
    hjp.asistencias,     
    hjp.amarilla,        
    hjp.roja             
FROM h_jugador_partido hjp
JOIN dim_partidos dp ON dp.id_partido = hjp.id_partido
JOIN dim_tiempo dt ON dt.id_tiempo = dp.id_tiempo
JOIN dim_equipo de ON hjp.id_equipo = de.id_equipo
JOIN dim_equipo dl ON dl.id_equipo = dp.id_local
JOIN dim_equipo dv ON dv.id_equipo = dp.id_visitante
WHERE hjp.id_jugador = $1 AND dp.status = 'Completado'
        `;

        const queryParams = [id_jugador];

        // 1. Añadimos el filtro dinámico si el usuario envía la temporada
        if (temporada) {
            query += ` AND dp.temporada = $2`;
            queryParams.push(temporada);
        }

        query += ` ORDER BY dp.id_tiempo DESC`;

        const result = await pool.query(query, queryParams);
        res.json(result.rows);
        
    } catch (error) {
        console.error('Error al obtener los partidos del jugador:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: error.message
        });
    }
};

const getTrayectoriaJugador = async (req, res) => {
    const { id_jugador } = req.params;
    try {
        const query = `select hjt.id_jugador, hjt.id_equipo, hjt.temporada, hjt.partidos, hjt.nota_media, hjt.goles , hjt.asistencias, hjt.amarillas, hjt.rojas , hjt.goles_concedidos 
from h_jugador_temporada hjt 
where hjt.id_jugador = $1
order by HJT.temporada desc;
        `;
        const result = await pool.query(query, [id_jugador]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener la trayectoria del jugador:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: error.message
        });
    }
};

const getRatingsJugador = async (req, res) => {
    const { id_jugador } = req.params;
    const { temporada } = req.query; // Capturamos la temporada opcional de la URL (?temporada=2024)

    try {
        let temporadaSeleccionada = temporada;

        if (!temporadaSeleccionada) {
            const temporadaResult = await pool.query(
                `SELECT MAX(temporada) AS temporada
                 FROM h_jugadores_ratings
                 WHERE id_jugador = $1`,
                [id_jugador]
            );

            temporadaSeleccionada = temporadaResult.rows[0]?.temporada || null;

            if (!temporadaSeleccionada) {
                return res.json([]);
            }
        }

        const query = `
            WITH temporada_stats AS (
                SELECT
                    id_jugador,
                    temporada,
                    SUM(COALESCE(partidos, 0)) AS partidos,
                    SUM(COALESCE(minutos, 0)) AS minutos,
                    SUM(COALESCE(titular, 0)) AS titular,
                    ROUND(
                        (
                            SUM(COALESCE(nota_media, 0) * COALESCE(NULLIF(partidos, 0), 1))
                            / NULLIF(SUM(COALESCE(NULLIF(partidos, 0), 1)), 0)
                        )::numeric,
                        3
                    ) AS nota_media,
                    SUM(COALESCE(goles, 0)) AS goles,
                    SUM(COALESCE(asistencias, 0)) AS asistencias,
                    SUM(COALESCE(tiros_totales, 0)) AS tiros_totales,
                    SUM(COALESCE(tiros_a_puerta, 0)) AS tiros_a_puerta,
                    SUM(COALESCE(pases_totales, 0)) AS pases_totales,
                    SUM(COALESCE(pases_clave, 0)) AS pases_clave,
                    ROUND(AVG(precision_pases)::numeric, 0) AS precision_pases,
                    SUM(COALESCE(entradas, 0)) AS entradas,
                    SUM(COALESCE(bloqueos, 0)) AS bloqueos,
                    SUM(COALESCE(intercepciones, 0)) AS intercepciones,
                    SUM(COALESCE(duelos_totales, 0)) AS duelos_totales,
                    SUM(COALESCE(duelos_ganados, 0)) AS duelos_ganados,
                    SUM(COALESCE(faltas_sufridas, 0)) AS faltas_sufridas,
                    SUM(COALESCE(faltas_cometidas, 0)) AS faltas_cometidas,
                    SUM(COALESCE(regates_intentados, 0)) AS regates_intentados,
                    SUM(COALESCE(regates_exito, 0)) AS regates_exito,
                    SUM(COALESCE(regateado, 0)) AS regateado,
                    SUM(COALESCE(amarillas, 0)) AS amarillas,
                    SUM(COALESCE(rojas, 0)) AS rojas,
                    SUM(COALESCE(penaltis_marcados, 0)) AS penaltis_marcados,
                    SUM(COALESCE(goles_concedidos, 0)) AS goles_concedidos,
                    SUM(COALESCE(paradas, 0)) AS paradas,
                    SUM(COALESCE(penaltis_parados, 0)) AS penaltis_parados
                FROM h_jugador_temporada
                WHERE id_jugador = $1 AND temporada = $2
                GROUP BY id_jugador, temporada
            )
            SELECT
                r.*,
                ts.partidos,
                ts.minutos,
                ts.titular,
                ts.nota_media,
                ts.goles,
                ts.asistencias,
                ts.tiros_totales,
                ts.tiros_a_puerta,
                ts.pases_totales,
                ts.pases_clave,
                ts.precision_pases,
                ts.entradas,
                ts.bloqueos,
                ts.intercepciones,
                ts.duelos_totales,
                ts.duelos_ganados,
                ts.faltas_sufridas,
                ts.faltas_cometidas,
                ts.regates_intentados,
                ts.regates_exito,
                ts.regateado,
                ts.amarillas,
                ts.rojas,
                ts.penaltis_marcados,
                ts.goles_concedidos,
                ts.paradas,
                ts.penaltis_parados
            FROM h_jugadores_ratings r
            LEFT JOIN temporada_stats ts
              ON ts.id_jugador = r.id_jugador
             AND ts.temporada = r.temporada
            WHERE r.id_jugador = $1 AND r.temporada = $2
        `;
        const result = await pool.query(query, [id_jugador, temporadaSeleccionada]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener los ratings del jugador:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: error.message
        });
    }
};

const getActualidadJugador = async (req, res) => {
    const { id_jugador } = req.params;

    try {
        const ultimosPartidosQuery = `
            SELECT
                dp.id_partido,
                dp.id_tiempo,
                dp.temporada,
                dp.id_local,
                dp.id_visitante,
                dp.hora,
                dp.status,
                dl.nombre_equipo AS equipo_local,
                dl.logo AS logo_local,
                dv.nombre_equipo AS equipo_visitante,
                dv.logo AS logo_visitante,
                dp.goles_local,
                dp.goles_visitante,
                dt.dia,
                dt.nombre_mes,
                dt.anio,
                TO_CHAR(MAKE_DATE(dt.anio, dt.mes, dt.dia), 'YYYY-MM-DD') AS fecha_iso,
                hjp.id_equipo AS id_equipo_jugador,
                hjp.nota,
                hjp.minutos
            FROM h_jugador_partido hjp
            JOIN dim_partidos dp ON dp.id_partido = hjp.id_partido
            JOIN dim_tiempo dt ON dt.id_tiempo = dp.id_tiempo
            JOIN dim_equipo dl ON dl.id_equipo = dp.id_local
            JOIN dim_equipo dv ON dv.id_equipo = dp.id_visitante
            WHERE hjp.id_jugador = $1
              AND dp.status = 'Completado'
              AND hjp.minutos > 1
            ORDER BY dp.id_tiempo DESC, dp.hora DESC
            LIMIT 5
        `;

        const equipoActualQuery = `
            SELECT hjp.id_equipo
            FROM h_jugador_partido hjp
            JOIN dim_partidos dp ON dp.id_partido = hjp.id_partido
            WHERE hjp.id_jugador = $1
            ORDER BY dp.id_tiempo DESC, dp.hora DESC
            LIMIT 1
        `;

        const ultimosPartidosResult = await pool.query(ultimosPartidosQuery, [id_jugador]);
        const equipoActualResult = await pool.query(equipoActualQuery, [id_jugador]);

        const idEquipoActual = equipoActualResult.rows[0]?.id_equipo || null;

        let proximoPartido = null;
        if (idEquipoActual) {
            const proximoPartidoQuery = `
                SELECT
                    dp.id_partido,
                    dp.id_tiempo,
                    dp.temporada,
                    dp.id_local,
                    dp.id_visitante,
                    dp.hora,
                    dp.status,
                    dl.nombre_equipo AS equipo_local,
                    dl.logo AS logo_local,
                    dv.nombre_equipo AS equipo_visitante,
                    dv.logo AS logo_visitante,
                    dt.dia,
                    dt.nombre_mes,
                    dt.anio,
                    TO_CHAR(MAKE_DATE(dt.anio, dt.mes, dt.dia), 'YYYY-MM-DD') AS fecha_iso
                FROM dim_partidos dp
                JOIN dim_tiempo dt ON dt.id_tiempo = dp.id_tiempo
                JOIN dim_equipo dl ON dl.id_equipo = dp.id_local
                JOIN dim_equipo dv ON dv.id_equipo = dp.id_visitante
                WHERE dp.status <> 'Completado'
                  AND MAKE_DATE(dt.anio, dt.mes, dt.dia) >= CURRENT_DATE
                  AND (dp.id_local = $1 OR dp.id_visitante = $1)
                ORDER BY dt.anio ASC, dt.mes ASC, dt.dia ASC, dp.hora ASC
                LIMIT 1
            `;

            const proximoPartidoResult = await pool.query(proximoPartidoQuery, [idEquipoActual]);
            proximoPartido = proximoPartidoResult.rows[0] || null;
        }

        res.json({
            id_equipo_actual: idEquipoActual,
            ultimos_partidos: ultimosPartidosResult.rows,
            proximo_partido: proximoPartido,
        });
    } catch (error) {
        console.error('Error al obtener la actualidad del jugador:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: error.message,
        });
    }
};

const getRendimientoActualJugador = async (req, res) => {
    const { id_jugador } = req.params;

    try {
        const query = `
            SELECT *
            FROM h_jugador_temporada
            WHERE id_jugador = $1
            ORDER BY temporada DESC
            LIMIT 1
        `;

        const result = await pool.query(query, [id_jugador]);
        res.json(result.rows[0] || null);
    } catch (error) {
        console.error('Error al obtener el rendimiento actual:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: error.message,
        });
    }
};

const getTrayectoriaPorEquipo = async (req, res) => {
    const { id_jugador } = req.params;

    try {
        const query = `
            SELECT
                hjt.id_equipo,
                e.nombre_equipo,
                e.logo,
                COALESCE(SUM(hjt.partidos), 0) AS partidos,
                COALESCE(SUM(hjt.goles), 0) AS goles,
                ROUND(AVG(hjt.nota_media)::numeric, 2) AS rating,
                COUNT(DISTINCT hjt.temporada) AS temporadas
            FROM h_jugador_temporada hjt
            LEFT JOIN dim_equipo e ON e.id_equipo = hjt.id_equipo
            WHERE hjt.id_jugador = $1
            GROUP BY hjt.id_equipo, e.nombre_equipo, e.logo
        `;

        const result = await pool.query(query, [id_jugador]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener la trayectoria por equipo:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: error.message,
        });
    }
};

const getMejoresPartidosJugador = async (req, res) => {
    const { id_jugador } = req.params;

    try {
        const query = `
            SELECT
                dp.id_partido,
                dp.id_tiempo,
                dp.temporada,
                dp.id_local,
                dp.id_visitante,
                dl.nombre_equipo AS equipo_local,
                dl.logo AS logo_local,
                dv.nombre_equipo AS equipo_visitante,
                dv.logo AS logo_visitante,
                dp.goles_local,
                dp.goles_visitante,
                dt.dia,
                dt.nombre_mes,
                dt.anio,
                TO_CHAR(MAKE_DATE(dt.anio, dt.mes, dt.dia), 'YYYY-MM-DD') AS fecha_iso,
                hjp.id_equipo AS id_equipo_jugador,
                hjp.nota,
                hjp.minutos
            FROM h_jugador_partido hjp
            JOIN dim_partidos dp ON dp.id_partido = hjp.id_partido
            JOIN dim_tiempo dt ON dt.id_tiempo = dp.id_tiempo
            JOIN dim_equipo dl ON dl.id_equipo = dp.id_local
            JOIN dim_equipo dv ON dv.id_equipo = dp.id_visitante
            WHERE hjp.id_jugador = $1
              AND dp.status = 'Completado'
              AND hjp.minutos > 1
            ORDER BY hjp.nota DESC NULLS LAST, dp.id_tiempo DESC, dp.hora DESC
            LIMIT 5
        `;

        const result = await pool.query(query, [id_jugador]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener los mejores partidos:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: error.message,
        });
    }
};

const getMejoresCompanerosJugador = async (req, res) => {
    const { id_jugador } = req.params;

    try {
        const query = `
            SELECT
                j2.id_jugador,
                j2.nombre,
                j2.foto,
                COUNT(*) AS partidos_juntos
            FROM h_jugador_partido hjp
            JOIN h_jugador_partido hjp2
              ON hjp.id_partido = hjp2.id_partido
             AND hjp.id_equipo = hjp2.id_equipo
             AND hjp2.id_jugador <> hjp.id_jugador
            JOIN dim_partidos dp ON dp.id_partido = hjp.id_partido
            JOIN dim_jugador j2 ON j2.id_jugador = hjp2.id_jugador
            WHERE hjp.id_jugador = $1
              AND dp.status = 'Completado'
              AND hjp.minutos > 1
              AND hjp2.minutos > 1
            GROUP BY j2.id_jugador, j2.nombre, j2.foto
            ORDER BY partidos_juntos DESC
            LIMIT 15
        `;

        const result = await pool.query(query, [id_jugador]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener los mejores companeros:', error);
        res.status(500).json({
            error: 'Error interno del servidor',
            message: error.message,
        });
    }
};

module.exports = {
    get20JugadoresMasPartidos,
    getJugadores,
    getJugadorPorId,
    getInfoJugador,
    getPartidosJugador,
    getTrayectoriaJugador,
    getRatingsJugador,
    getActualidadJugador,
    getRendimientoActualJugador,
    getTrayectoriaPorEquipo,
    getMejoresPartidosJugador,
    getMejoresCompanerosJugador
};
