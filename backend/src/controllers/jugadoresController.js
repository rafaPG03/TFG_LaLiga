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


module.exports = {
    get20JugadoresMasPartidos,
    getJugadores,
    getJugadorPorId
};