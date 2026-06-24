const pool = require('../config/db');

const buscarGlobal = async (req, res) => {
    const { q } = req.query; // Capturamos lo que viene en ?q=...
    const busqueda = (q || '').trim();

    if (!busqueda || busqueda.length < 2) {
        return res.json([]);
    }

    try {
        // Priorizamos coincidencia exacta, luego prefijo y despues coincidencia parcial.
        const query = `
            (SELECT 
                id_jugador AS id, 
                nombre AS principal, 
                nacionalidad AS secundario, 
                foto AS imagen, 
                'jugador' AS tipo,
                CASE
                    WHEN LOWER(nombre) = LOWER($1) THEN 0
                    WHEN LOWER(nombre) LIKE LOWER($1) || '%' THEN 1
                    WHEN LOWER(nombre) LIKE '%' || LOWER($1) || '%' THEN 2
                    ELSE 3
                END AS prioridad
             FROM dim_jugador
             WHERE LOWER(nombre) LIKE '%' || LOWER($1) || '%'
             ORDER BY prioridad ASC, nombre ASC
             LIMIT 5)
            UNION ALL
            (SELECT 
                id_equipo AS id, 
                nombre_equipo AS principal, 
                pais AS secundario, 
                logo AS imagen, 
                'equipo' AS tipo,
                CASE
                    WHEN LOWER(nombre_equipo) = LOWER($1) THEN 0
                    WHEN LOWER(nombre_equipo) LIKE LOWER($1) || '%' THEN 1
                    WHEN LOWER(nombre_equipo) LIKE '%' || LOWER($1) || '%' THEN 2
                    ELSE 3
                END AS prioridad
             FROM dim_equipo
             WHERE LOWER(nombre_equipo) LIKE '%' || LOWER($1) || '%'
             ORDER BY prioridad ASC, nombre_equipo ASC
             LIMIT 5)
            ORDER BY prioridad ASC, principal ASC;
        `;

        const values = [busqueda];
        const result = await pool.query(query, values);

        res.json(result.rows);
    } catch (err) {
        console.error("Error en búsqueda global:", err.message);
        res.status(500).json({ error: "Error interno del servidor al buscar" });
    }
};

module.exports = { buscarGlobal };
