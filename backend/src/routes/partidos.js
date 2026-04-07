const express = require('express');
const router = express.Router();
const partidoController = require('../controllers/partidoController');

/* Partidos por fecha */
router.get('/', partidoController.getPartidoFecha);
/* Historial de enfrentamientos entre dos equipos */
router.get('/h2h/:id1/:id2', partidoController.getPartidosEntreEquipos);
/* Jugadores destacados de un partido */
router.get('/:id_partido/jugadores_destacados', partidoController.getJugadoresDestacadosPartido);
/* Estado actual de equipo de un partido */
router.get('/:id_partido/estado_actual', partidoController.getEstadoActualPartido);
/* Información de un partido */
router.get('/:id_partido/info', partidoController.getInfoPartido);
/* Eventos de un partido */
router.get('/:id_partido/eventos', partidoController.getEventosPartido);
module.exports = router;