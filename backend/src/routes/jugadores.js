const express = require('express');
const router = express.Router();
const jugadoresController = require('../controllers/jugadoresController');

router.get('/mas-partidos', jugadoresController.get20JugadoresMasPartidos);
router.get('/', jugadoresController.getJugadores);

module.exports = router;