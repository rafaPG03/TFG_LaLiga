const pool = require('../config/db');

const getTemporadas = async (req, res) => {
    try {
        const result = await pool.query('SELECT DISTINCT temporada FROM dim_partidos ORDER BY temporada DESC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener las temporadas:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }   
};

module.exports = { getTemporadas };