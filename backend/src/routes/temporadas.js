const express = require('express');
const router = express.Router();
const temporadaController = require('../controllers/temporadaController');

router.get('/', temporadaController.getTemporadas);

module.exports = router;
