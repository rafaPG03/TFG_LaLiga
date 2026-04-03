const pool = require('../config/db');

const getPartidoFecha = async (req, res) => {
      try {
    // 1. Recibimos la fecha en formato YYYY-MM-DD
    const fechaOriginal = req.query.fecha; // Ej: "2015-08-22"
    
    if (!fechaOriginal) {
      return res.status(400).json({ error: "Debes proporcionar una fecha en formato YYYY-MM-DD" });
    }

    // 2. Convertimos "2015-08-22" a número 20150822 para que coincida con id_tiempo
    const idTiempoBusqueda = parseInt(fechaOriginal.replace(/-/g, ''));

    // 3. Consulta con JOINs para traer nombres de equipos y datos de la jornada
    const query = `
      SELECT 
        p.id_partido, p.hora, p.goles_local, p.goles_visitante,
        eL.nombre_equipo AS equipo_local,
        eV.nombre_equipo AS equipo_visitante,
        eL.logo AS logo_local,
        eV.logo AS logo_visitante
      FROM dim_partidos p
      JOIN dim_equipo eL ON p.id_local = eL.id_equipo
      JOIN dim_equipo eV ON p.id_visitante = eV.id_equipo
      JOIN dim_tiempo t ON p.id_tiempo = t.id_tiempo
      WHERE p.id_tiempo = $1
      ORDER BY p.hora ASC
    `;

    const result = await pool.query(query, [idTiempoBusqueda]);

    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Error al obtener partidos por fecha" });
  }
};

const getPartidosEntreEquipos = async (req, res) => {
const { id1, id2 } = req.params;

  // Validación básica: que los IDs sean números y no iguales
  if (id1 === id2) {
    return res.status(400).json({ error: 'No puedes comparar un equipo consigo mismo' });
  }

  try {
    const query = `
SELECT 
    p.id_partido, 
    p.hora, 
    p.temporada,
    p.goles_local, 
    p.goles_visitante,
    el.nombre_equipo AS equipo_local,
    ev.nombre_equipo AS equipo_visitante,
    el.logo AS logo_local,
    ev.logo AS logo_visitante,
    t.anio,
    t.nombre_mes,
    t.dia,
    t.jornada
FROM dim_partidos p
JOIN dim_tiempo t ON p.id_tiempo = t.id_tiempo
JOIN dim_equipo el ON p.id_local = el.id_equipo
JOIN dim_equipo ev ON p.id_visitante = ev.id_equipo
WHERE (p.id_local = $1 AND p.id_visitante = $2)
   OR (p.id_local = $2 AND p.id_visitante = $1)
ORDER BY t.anio DESC, t.mes DESC, t.dia DESC;
    `;

    const result = await pool.query(query, [id1, id2]);
    
    // Si no hay partidos, devolvemos un array vacío pero con status 200
    res.json(result.rows);
  } catch (err) {
    console.error("Error en H2H:", err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};


    
module.exports = { getPartidoFecha, getPartidosEntreEquipos };
