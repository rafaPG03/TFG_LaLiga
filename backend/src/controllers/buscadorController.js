const pool = require('../config/db');

const buscarGlobal = async (req, res) => {
    const { q } = req.query; // Capturamos lo que viene en ?q=...

    if (!q || q.length < 2) {
        return res.json([]);
    }

    try {
        // Usamos UNION ALL para combinar resultados de dos tablas distintas
        // ILIKE es para que no importe mayúsculas/minúsculas en Postgres
        const query = `
            (SELECT 
                id_jugador AS id, 
                nombre AS principal, 
                nacionalidad AS secundario, 
                foto AS imagen, 
                'jugador' AS tipo
             FROM dim_jugador
             WHERE nombre ILIKE $1
             LIMIT 5)
            UNION ALL
            (SELECT 
                id_equipo AS id, 
                nombre_equipo AS principal, 
                pais AS secundario, 
                logo AS imagen, 
                'equipo' AS tipo
             FROM dim_equipo
             WHERE nombre_equipo ILIKE $1
             LIMIT 5)
            ORDER BY principal ASC;
        `;

        // En Postgres, para usar LIKE con parámetros, concatenamos los %
        const values = [`%${q}%` || ''];
        const result = await pool.query(query, values);

        res.json(result.rows);
    } catch (err) {
        console.error("Error en búsqueda global:", err.message);
        res.status(500).json({ error: "Error interno del servidor al buscar" });
    }
};

module.exports = { buscarGlobal };