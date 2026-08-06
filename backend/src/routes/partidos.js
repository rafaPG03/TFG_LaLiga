/**
 * @swagger
 * /partidos:
 *   get:
 *     summary: Obtiene partidos por fecha o por temporada y jornada
 *     tags: [Partidos]
 *     parameters:
 *       - in: query
 *         name: fecha
 *         schema:
 *           type: string
 *           format: date
 *           example: 2024-10-26
 *         description: Fecha del partido. Alternativa a temporada y jornada.
 *       - $ref: '#/components/parameters/Temporada'
 *       - $ref: '#/components/parameters/Jornada'
 *     responses:
 *       200:
 *         description: Partidos encontrados.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Partido'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 * /partidos/jornadas:
 *   get:
 *     summary: Obtiene las jornadas disponibles de una temporada
 *     tags: [Partidos]
 *     parameters:
 *       - $ref: '#/components/parameters/Temporada'
 *     responses:
 *       200:
 *         description: Jornadas disponibles y jornada actual.
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 * /partidos/h2h/{id1}/{id2}:
 *   get:
 *     summary: Obtiene el historial de enfrentamientos entre dos equipos
 *     tags: [Partidos]
 *     parameters:
 *       - in: path
 *         name: id1
 *         required: true
 *         schema:
 *           type: integer
 *           example: 529
 *       - in: path
 *         name: id2
 *         required: true
 *         schema:
 *           type: integer
 *           example: 541
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 5
 *       - in: query
 *         name: id_partido_actual
 *         schema:
 *           type: integer
 *           example: 1035241
 *         description: Si se envia, solo devuelve enfrentamientos anteriores a ese partido.
 *     responses:
 *       200:
 *         description: Historial H2H.
 *       500:
 *         $ref: '#/components/responses/ServerError'
 * /partidos/{id_partido}/jugadores_destacados:
 *   get:
 *     summary: Obtiene jugadores destacados antes de un partido
 *     tags: [Partidos]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPartido'
 *     responses:
 *       200:
 *         description: Destacados del equipo local y visitante.
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 * /partidos/{id_partido}/estado_actual:
 *   get:
 *     summary: Obtiene la previa de clasificacion y forma de un partido
 *     tags: [Partidos]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPartido'
 *     responses:
 *       200:
 *         description: Estado previo de local y visitante.
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 * /partidos/{id_partido}/data_mining:
 *   get:
 *     summary: Obtiene prediccion, goles esperados y probables goleadores de un partido
 *     tags: [Partidos]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPartido'
 *     responses:
 *       200:
 *         description: Informacion predictiva del partido.
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 * /partidos/{id_partido}/info:
 *   get:
 *     summary: Obtiene informacion general de un partido
 *     tags: [Partidos]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPartido'
 *     responses:
 *       200:
 *         description: Informacion del partido.
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 * /partidos/{id_partido}/eventos:
 *   get:
 *     summary: Obtiene los eventos de un partido
 *     tags: [Partidos]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPartido'
 *     responses:
 *       200:
 *         description: Eventos ordenados por minuto.
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 * /partidos/{id_partido}/alineaciones:
 *   get:
 *     summary: Obtiene alineaciones de un partido
 *     tags: [Partidos]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPartido'
 *     responses:
 *       200:
 *         description: Jugadores alineados por equipo.
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 * /partidos/{id_partido}/stats_equipos:
 *   get:
 *     summary: Obtiene estadisticas de equipos en un partido
 *     tags: [Partidos]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPartido'
 *     responses:
 *       200:
 *         description: Estadisticas del local y visitante.
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 * /partidos/{id_partido}/stats_jugadores:
 *   get:
 *     summary: Obtiene estadisticas de jugadores en un partido
 *     tags: [Partidos]
 *     parameters:
 *       - $ref: '#/components/parameters/IdPartido'
 *     responses:
 *       200:
 *         description: Estadisticas individuales del partido.
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
const express = require('express');
const router = express.Router();
const partidoController = require('../controllers/partidoController');

/* Partidos por fecha */
router.get('/', partidoController.getPartidoFecha);
/* Jornadas disponibles para una temporada */
router.get('/jornadas', partidoController.getJornadasPorTemporada);
/* Historial de enfrentamientos entre dos equipos */
router.get('/h2h/:id1/:id2', partidoController.getPartidosEntreEquipos);
/* Jugadores destacados de un partido */
router.get('/:id_partido/jugadores_destacados', partidoController.getJugadoresDestacadosPartido);
/* Estado actual de equipo de un partido */
router.get('/:id_partido/estado_actual', partidoController.getEstadoActualPartido);
router.get('/:id_partido/data_mining', partidoController.getDataMiningPartido);
/* Información de un partido */
router.get('/:id_partido/info', partidoController.getInfoPartido);
/* Eventos de un partido */
router.get('/:id_partido/eventos', partidoController.getEventosPartido);
/* Alineaciones de un partido */
router.get('/:id_partido/alineaciones', partidoController.getAlineacionesPartido);
/* Stats equipos de un partido */
router.get('/:id_partido/stats_equipos', partidoController.getStatsEquipoPartido);
/* Stats jugadores de un partido */
router.get('/:id_partido/stats_jugadores', partidoController.getStatsJugadoresPartido);
module.exports = router;
