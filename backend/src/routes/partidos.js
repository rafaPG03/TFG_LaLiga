const express = require('express');
const router = express.Router();
const partidoController = require('../controllers/partidoController');

router.get('/', partidoController.getPartidoFecha);

module.exports = router;