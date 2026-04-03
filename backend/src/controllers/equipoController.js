const pool = require('../config/db');

const getEquipoPorId = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('SELECT * FROM dim_equipo WHERE id_equipo = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener el equipo:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const getEquipos = async (req, res) => {
  try {
    const result = await pool.query('SELECT id_equipo, nombre_equipo, logo FROM dim_equipo ORDER BY nombre_equipo');
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener los equipos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const getStatsEquipoPorId = async (req, res) => {
  const { id_equipo } = req.params;
  const { temporada } = req.query; 

  console.log("ID Equipo:", id_equipo); // Debería salir 529
  console.log("Temporada recibida:", temporada); // Debería salir 2019

  try {
    const query = `
      SELECT 
        j.nombre, 
        j.foto,
        h.* FROM h_jugador_temporada h
      JOIN dim_jugador j ON h.id_jugador = j.id_jugador
      WHERE h.id_equipo = $1 AND h.temporada = $2
      ORDER BY h.posicion DESC;
    `;

    const result = await pool.query(query, [id_equipo, temporada]);

    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: "No hay datos para esta temporada" });
    }

    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Error al obtener las estadísticas OLAP" });
  }
};


module.exports = { getEquipoPorId, getEquipos, getStatsEquipoPorId };