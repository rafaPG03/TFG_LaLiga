const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.get('/', async (req, res) => {
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
        p.id_partido, p.fecha_hora, p.goles_local, p.goles_visitante, p.ganador,
        eL.nombre_equipo AS equipo_local,
        eV.nombre_equipo AS equipo_visitante,
        t.jornada, t.nombre_dia
      FROM dim_partidos p
      JOIN dim_equipo eL ON p.id_local = eL.id_equipo
      JOIN dim_equipo eV ON p.id_visitante = eV.id_equipo
      JOIN dim_tiempo t ON p.id_tiempo = t.id_tiempo
      WHERE p.id_tiempo = $1
      ORDER BY p.fecha_hora ASC
    `;

    const result = await pool.query(query, [idTiempoBusqueda]);

    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Error al obtener partidos por fecha" });
  }
});

module.exports = router;