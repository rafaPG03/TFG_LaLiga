const express = require('express');
const router = express.Router();
const pool = require('../config/db'); // Tu conexión a Postgres

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM dim_equipo ORDER BY nombre_equipo ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error en el servidor");
  }
});

module.exports = router;