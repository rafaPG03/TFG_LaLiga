const express = require('express');
const router = express.Router();
const jugadoresController = require('../controllers/jugadoresController');

router.get('/mas-partidos', jugadoresController.get20JugadoresMasPartidos);
router.get('/:id_jugador', jugadoresController.getJugadorPorId);
router.get('/:id_jugador/ratings', jugadoresController.getRatingsJugador);
router.get('/:id_jugador/actualidad', jugadoresController.getActualidadJugador);
router.get('/:id_jugador/rendimiento', jugadoresController.getRendimientoActualJugador);
router.get('/:id_jugador/trayectoria-equipos', jugadoresController.getTrayectoriaPorEquipo);
router.get('/:id_jugador/mejores-partidos', jugadoresController.getMejoresPartidosJugador);
router.get('/:id_jugador/mejores-companeros', jugadoresController.getMejoresCompanerosJugador);
router.get('/info/:id_jugador', jugadoresController.getInfoJugador);
router.get('/partidos/:id_jugador', jugadoresController.getPartidosJugador);
router.get('/trayectoria/:id_jugador', jugadoresController.getTrayectoriaJugador);
router.get('/', jugadoresController.getJugadores);

module.exports = router;