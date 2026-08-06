/**
 * @swagger
 * /data-mining/catalogos:
 *   get:
 *     summary: Obtiene catalogos de filtros para Data Mining
 *     tags: [Data Mining]
 *     parameters:
 *       - $ref: '#/components/parameters/Temporada'
 *     responses:
 *       200:
 *         description: Temporadas disponibles y equipos de la temporada.
 *       500:
 *         $ref: '#/components/responses/ServerError'
 * /data-mining/favoritos/{id_usuario}:
 *   get:
 *     summary: Obtiene analisis predictivo de los favoritos de un usuario
 *     tags: [Data Mining]
 *     parameters:
 *       - $ref: '#/components/parameters/IdUsuario'
 *       - $ref: '#/components/parameters/Temporada'
 *     responses:
 *       200:
 *         description: Analisis de equipos y jugadores favoritos.
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 * /data-mining/equipos:
 *   get:
 *     summary: Obtiene ranking, Montecarlo y recomendaciones de equipos
 *     tags: [Data Mining]
 *     parameters:
 *       - $ref: '#/components/parameters/Temporada'
 *       - in: query
 *         name: id_equipo
 *         schema:
 *           type: integer
 *           example: 529
 *         description: Si se envia, incluye detalle del equipo seleccionado.
 *     responses:
 *       200:
 *         description: Analisis de equipos.
 *       500:
 *         $ref: '#/components/responses/ServerError'
 * /data-mining/jugadores/buscar:
 *   get:
 *     summary: Busca jugadores para el modulo de Data Mining
 *     tags: [Data Mining]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *           example: messi
 *       - $ref: '#/components/parameters/Temporada'
 *     responses:
 *       200:
 *         description: Jugadores encontrados.
 *       500:
 *         $ref: '#/components/responses/ServerError'
 * /data-mining/jugadores:
 *   get:
 *     summary: Obtiene ranking, favoritos y detalle predictivo de jugadores
 *     tags: [Data Mining]
 *     parameters:
 *       - $ref: '#/components/parameters/Temporada'
 *       - in: query
 *         name: id_jugador
 *         schema:
 *           type: integer
 *           example: 276
 *         description: Si se envia, incluye detalle del jugador seleccionado.
 *       - in: query
 *         name: favoritos
 *         schema:
 *           type: string
 *           example: 276,302,415
 *         description: Lista de IDs de jugadores favoritos separada por comas.
 *     responses:
 *       200:
 *         description: Analisis de jugadores.
 *       500:
 *         $ref: '#/components/responses/ServerError'
 * /data-mining/predicciones:
 *   get:
 *     summary: Obtiene predicciones de partidos pendientes
 *     tags: [Data Mining]
 *     parameters:
 *       - $ref: '#/components/parameters/Temporada'
 *     responses:
 *       200:
 *         description: Predicciones, goles esperados y probables goleadores.
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
const express = require("express");
const dataMiningController = require("../controllers/dataMiningController");

const router = express.Router();

router.get("/catalogos", dataMiningController.getCatalogos);
router.get("/favoritos/:id_usuario", dataMiningController.getFavoritos);
router.get("/equipos", dataMiningController.getEquipos);
router.get("/jugadores/buscar", dataMiningController.buscarJugadores);
router.get("/jugadores", dataMiningController.getJugadores);
router.get("/predicciones", dataMiningController.getPredicciones);

module.exports = router;
