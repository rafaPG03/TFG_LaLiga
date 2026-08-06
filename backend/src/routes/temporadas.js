/**
 * @swagger
 * /temporadas:
 *   get:
 *     summary: Obtiene la clasificacion de una temporada y jornada
 *     tags: [Temporadas]
 *     parameters:
 *       - in: query
 *         name: anno
 *         schema:
 *           type: integer
 *           example: 2024
 *         description: Temporada. Si no se envia, usa la ultima disponible.
 *       - $ref: '#/components/parameters/Jornada'
 *     responses:
 *       200:
 *         description: Clasificacion ordenada por posicion.
 *       500:
 *         $ref: '#/components/responses/ServerError'
 * /temporadas/annos:
 *   get:
 *     summary: Lista las temporadas disponibles
 *     tags: [Temporadas]
 *     responses:
 *       200:
 *         description: Temporadas disponibles.
 *       500:
 *         $ref: '#/components/responses/ServerError'
 * /temporadas/partidos:
 *   get:
 *     summary: Obtiene partidos de una temporada, opcionalmente por jornada
 *     tags: [Temporadas]
 *     parameters:
 *       - $ref: '#/components/parameters/Temporada'
 *       - $ref: '#/components/parameters/Jornada'
 *     responses:
 *       200:
 *         description: Partidos de la temporada.
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 * /temporadas/equipos:
 *   get:
 *     summary: Obtiene equipos participantes en una temporada
 *     tags: [Temporadas]
 *     parameters:
 *       - $ref: '#/components/parameters/Temporada'
 *     responses:
 *       200:
 *         description: Equipos de la temporada.
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 * /temporadas/graficos:
 *   get:
 *     summary: Obtiene datos para graficos de temporada
 *     tags: [Temporadas]
 *     parameters:
 *       - $ref: '#/components/parameters/Temporada'
 *     responses:
 *       200:
 *         description: Datos agregados de equipos, jugadores y partidos.
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 * /temporadas/montecarlo:
 *   get:
 *     summary: Obtiene la simulacion Montecarlo o resultado historico de una temporada
 *     tags: [Temporadas]
 *     parameters:
 *       - $ref: '#/components/parameters/Temporada'
 *     responses:
 *       200:
 *         description: Probabilidades por equipo.
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 * /temporadas/simulacion/inicial:
 *   get:
 *     summary: Obtiene datos iniciales para la simulacion de temporada
 *     tags: [Temporadas]
 *     responses:
 *       200:
 *         description: Temporada actual, jornadas, partidos, clasificacion y Montecarlo.
 *       500:
 *         $ref: '#/components/responses/ServerError'
 * /temporadas/simulacion/partidos:
 *   get:
 *     summary: Obtiene partidos de una jornada para simulacion
 *     tags: [Temporadas]
 *     parameters:
 *       - $ref: '#/components/parameters/Jornada'
 *       - $ref: '#/components/parameters/Temporada'
 *     responses:
 *       200:
 *         description: Partidos simulables de la jornada.
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 * /temporadas/simulacion/montecarlo:
 *   post:
 *     summary: Calcula una simulacion Montecarlo manual
 *     tags: [Temporadas]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MontecarloSimulacionRequest'
 *     responses:
 *       200:
 *         description: Resultado de la simulacion manual.
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 * /temporadas/info:
 *   get:
 *     summary: Obtiene el resumen general de una temporada
 *     tags: [Temporadas]
 *     parameters:
 *       - $ref: '#/components/parameters/Temporada'
 *     responses:
 *       200:
 *         description: Resumen de partidos, goles, tarjetas y mejores partidos.
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 * /temporadas/destacados:
 *   get:
 *     summary: Obtiene jugadores destacados de una temporada
 *     tags: [Temporadas]
 *     parameters:
 *       - $ref: '#/components/parameters/Temporada'
 *     responses:
 *       200:
 *         description: Goleador, portero, jugador con mas amarillas y jugador con mas rojas.
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 * /temporadas/rankings:
 *   get:
 *     summary: Obtiene rankings de jugadores por metrica
 *     tags: [Temporadas]
 *     parameters:
 *       - $ref: '#/components/parameters/Temporada'
 *       - in: query
 *         name: atributo
 *         schema:
 *           type: string
 *           example: nota_media
 *         description: Metrica del ranking.
 *       - in: query
 *         name: modo
 *         schema:
 *           type: string
 *           enum: [total, por90]
 *           example: total
 *       - in: query
 *         name: posicion
 *         schema:
 *           type: string
 *           enum: [TODAS, POR, DF, MED, DEL]
 *           example: TODAS
 *     responses:
 *       200:
 *         description: Ranking de jugadores para la metrica indicada.
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 * /temporadas/mvps:
 *   get:
 *     summary: Obtiene MVPs por posicion de una jornada
 *     tags: [Temporadas]
 *     parameters:
 *       - $ref: '#/components/parameters/Temporada'
 *       - $ref: '#/components/parameters/Jornada'
 *     responses:
 *       200:
 *         description: MVPs de la jornada.
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 * /temporadas/jornada/ultima:
 *   get:
 *     summary: Obtiene la ultima jornada completada de una temporada
 *     tags: [Temporadas]
 *     parameters:
 *       - $ref: '#/components/parameters/Temporada'
 *     responses:
 *       200:
 *         description: Jornada y partidos de la ultima jornada completada.
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 * /temporadas/jornada/proxima:
 *   get:
 *     summary: Obtiene proximos partidos de una temporada
 *     tags: [Temporadas]
 *     parameters:
 *       - $ref: '#/components/parameters/Temporada'
 *     responses:
 *       200:
 *         description: Proximos partidos pendientes.
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 * /temporadas/ascensos-descensos:
 *   get:
 *     summary: Obtiene equipos ascendidos y descendidos respecto a la temporada anterior
 *     tags: [Temporadas]
 *     parameters:
 *       - $ref: '#/components/parameters/Temporada'
 *     responses:
 *       200:
 *         description: Equipos ascendidos y descendidos.
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
const express = require('express');
const router = express.Router();
const temporadaController = require('../controllers/temporadaController');

router.get('/annos', temporadaController.getTemporadas);
router.get('/partidos', temporadaController.getPartidosTemporada);
router.get('/equipos', temporadaController.getEquiposTemporada);
router.get('/graficos', temporadaController.getGraficosTemporada);
router.get('/montecarlo', temporadaController.getMontecarloTemporada);
router.get('/simulacion/inicial', temporadaController.getSimulacionTemporadaInicial);
router.get('/simulacion/partidos', temporadaController.getPartidosSimulacionJornada);
router.post('/simulacion/montecarlo', temporadaController.getMontecarloSimulacionManual);
router.get('/info', temporadaController.getResumenTemporada);
router.get('/destacados', temporadaController.getDestacadosTemporada);
router.get('/rankings', temporadaController.getRankingsTemporada);
router.get('/mvps', temporadaController.getMvpsJornada);
router.get('/jornada/ultima', temporadaController.getUltimaJornadaTemporada);
router.get('/jornada/proxima', temporadaController.getProximaJornadaTemporada);
router.get('/ascensos-descensos', temporadaController.getAscensosDescensos);

router.get('/', temporadaController.getClasificacion);

module.exports = router;
