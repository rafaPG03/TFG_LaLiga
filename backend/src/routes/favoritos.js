const express = require('express');
const router = express.Router();
const favoritosController = require('../controllers/favoritosController');

router.post('/toggle', favoritosController.toggleFavorito);
router.get('/:id_usuario', favoritosController.getFavoritosUsuario);

module.exports = router;
