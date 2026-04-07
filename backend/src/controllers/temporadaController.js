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

const getClasificacion = async (req, res) => {
    try {
        const { anno, jornada } = req.query;

        let query = `
            SELECT *
            FROM h_equipo_temporada
            WHERE temporada = ${anno ? '$1' : '(SELECT MAX(temporada) FROM h_equipo_temporada)'}
              AND jornada = ${jornada ? (anno ? '$2' : '$1') : `(
                  SELECT MAX(jornada) 
                  FROM h_equipo_temporada 
                  WHERE temporada = ${anno ? '$1' : '(SELECT MAX(temporada) FROM h_equipo_temporada)'}
              )`}
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
        console.error('Error al obtener la clasificación:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
module.exports = { getClasificacion, getTemporadas };