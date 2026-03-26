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
    const result = await pool.query('SELECT id_equipo, nombre_equipo, logo_url FROM dim_equipo ORDER BY nombre_equipo');
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener los equipos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = { getEquipoPorId, getEquipos };