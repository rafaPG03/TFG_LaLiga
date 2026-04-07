const express = require('express');
const router = express.Router();
const temporadaController = require('../controllers/temporadaController');

router.get('/annos', temporadaController.getTemporadas);

router.get('/', temporadaController.getClasificacion);

module.exports = router;
