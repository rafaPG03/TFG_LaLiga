const express = require('express');
const router = express.Router();

// Importamos los archivos de rutas específicas
const equiposRoutes = require('./equipos');
const partidosRoutes = require('./partidos');
const UsuariosRoutes = require('./usuarios');
const jugadoresRoutes = require('./jugadores'); 
const temporadasRoutes = require('./temporadas');

// Definimos los prefijos para cada recurso
router.use('/equipos', equiposRoutes);
router.use('/partidos', partidosRoutes);
router.use('/usuarios', UsuariosRoutes);
router.use('/temporadas', temporadasRoutes);
router.use('/jugadores', jugadoresRoutes);

module.exports = router;