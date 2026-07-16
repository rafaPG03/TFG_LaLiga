const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuarioController');

router.post('/registro', usuariosController.registrarUsuario);
router.post('/login', usuariosController.loginUsuario);
router.put('/:id/password', usuariosController.cambiarPassword);
router.get('/:id', usuariosController.getUsuarioPorId);
router.put('/:id', usuariosController.actualizarUsuario);

module.exports = router;
