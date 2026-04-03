const express = require('express');
const router = express.Router();
const buscadorController = require('../controllers/buscadorController');

// URL: http://localhost:3000/api/buscar?q=messi
router.get('/', buscadorController.buscarGlobal);

module.exports = router;