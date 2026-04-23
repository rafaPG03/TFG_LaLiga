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
        const query = `select hjt.*
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


module.exports = {
    get20JugadoresMasPartidos,
    getJugadores,
    getJugadorPorId,
    getInfoJugador,
    getPartidosJugador,
    getTrayectoriaJugador
};
