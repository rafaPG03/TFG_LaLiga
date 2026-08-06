/**
 * @swagger
 * /jugadores:
 *   get:
 *     summary: Lista todos los jugadores
 *     tags: [Jugadores]
 *     responses:
 *       200:
 *         description: Listado de jugadores.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Jugador'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 * /jugadores/mas-partidos:
 *   get:
 *     summary: Obtiene los 20 jugadores con mas partidos
 *     tags: [Jugadores]
 *     responses:
 *       200:
 *         description: Ranking de jugadores por partidos disputados.
 *       500:
 *         $ref: '#/components/responses/ServerError'
 * /jugadores/{id_jugador}:
 *   get:
 *     summary: Obtiene un jugador por ID
 *     tags: [Jugadores]
 *     parameters:
 *       - $ref: '#/components/parameters/IdJugador'
 *     responses:
 *       200:
 *         description: Jugador encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Jugador'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 * /jugadores/{id_jugador}/ratings:
 *   get:
 *     summary: Obtiene ratings y metricas agregadas de un jugador
 *     tags: [Jugadores]
 *     parameters:
 *       - $ref: '#/components/parameters/IdJugador'
 *       - $ref: '#/components/parameters/Temporada'
 *     responses:
 *       200:
 *         description: Ratings del jugador para la temporada indicada o la ultima disponible.
 *       500:
 *         $ref: '#/components/responses/ServerError'
 * /jugadores/{id_jugador}/actualidad:
 *   get:
 *     summary: Obtiene actualidad, ultimos partidos y proximo partido del jugador
 *     tags: [Jugadores]
 *     parameters:
 *       - $ref: '#/components/parameters/IdJugador'
 *     responses:
 *       200:
 *         description: Datos de actualidad del jugador.
 *       500:
 *         $ref: '#/components/responses/ServerError'
 * /jugadores/{id_jugador}/rendimiento:
 *   get:
 *     summary: Obtiene el rendimiento mas reciente del jugador
 *     tags: [Jugadores]
 *     parameters:
 *       - $ref: '#/components/parameters/IdJugador'
 *     responses:
 *       200:
 *         description: Ultimo registro de rendimiento del jugador.
 *       500:
 *         $ref: '#/components/responses/ServerError'
 * /jugadores/{id_jugador}/trayectoria-equipos:
 *   get:
 *     summary: Obtiene la trayectoria agrupada por equipos de un jugador
 *     tags: [Jugadores]
 *     parameters:
 *       - $ref: '#/components/parameters/IdJugador'
 *     responses:
 *       200:
 *         description: Trayectoria del jugador agrupada por equipo.
 *       500:
 *         $ref: '#/components/responses/ServerError'
 * /jugadores/{id_jugador}/mejores-partidos:
 *   get:
 *     summary: Obtiene los mejores partidos de un jugador
 *     tags: [Jugadores]
 *     parameters:
 *       - $ref: '#/components/parameters/IdJugador'
 *     responses:
 *       200:
 *         description: Top de partidos del jugador por nota.
 *       500:
 *         $ref: '#/components/responses/ServerError'
 * /jugadores/{id_jugador}/mejores-companeros:
 *   get:
 *     summary: Obtiene los companeros con mas partidos junto al jugador
 *     tags: [Jugadores]
 *     parameters:
 *       - $ref: '#/components/parameters/IdJugador'
 *     responses:
 *       200:
 *         description: Companeros mas frecuentes del jugador.
 *       500:
 *         $ref: '#/components/responses/ServerError'
 * /jugadores/info/{id_jugador}:
 *   get:
 *     summary: Obtiene informacion ampliada de un jugador
 *     tags: [Jugadores]
 *     parameters:
 *       - $ref: '#/components/parameters/IdJugador'
 *     responses:
 *       200:
 *         description: Perfil ampliado del jugador y ultimo equipo.
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 * /jugadores/partidos/{id_jugador}:
 *   get:
 *     summary: Obtiene partidos disputados por un jugador
 *     tags: [Jugadores]
 *     parameters:
 *       - $ref: '#/components/parameters/IdJugador'
 *       - $ref: '#/components/parameters/Temporada'
 *     responses:
 *       200:
 *         description: Partidos del jugador, opcionalmente filtrados por temporada.
 *       500:
 *         $ref: '#/components/responses/ServerError'
 * /jugadores/trayectoria/{id_jugador}:
 *   get:
 *     summary: Obtiene trayectoria por temporadas de un jugador
 *     tags: [Jugadores]
 *     parameters:
 *       - $ref: '#/components/parameters/IdJugador'
 *     responses:
 *       200:
 *         description: Registros historicos del jugador por temporada.
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
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
