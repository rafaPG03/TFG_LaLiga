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

module.exports = { getEquipoPorId };