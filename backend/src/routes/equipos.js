/**
 * @swagger
 * /equipos:
 *   get:
 *     summary: Lista todos los equipos
 *     tags: [Equipos]
 *     responses:
 *       200:
 *         description: Listado de equipos.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Equipo'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 * /equipos/{id}:
 *   get:
 *     summary: Obtiene un equipo por ID
 *     tags: [Equipos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 529
 *     responses:
 *       200:
 *         description: Equipo encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Equipo'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 * /equipos/analisis/stats/{id_equipo}:
 *   get:
 *     summary: Obtiene estadisticas OLAP de jugadores de un equipo por temporada
 *     tags: [Equipos]
 *     parameters:
 *       - $ref: '#/components/parameters/IdEquipo'
 *       - $ref: '#/components/parameters/Temporada'
 *     responses:
 *       200:
 *         description: Estadisticas de jugadores del equipo.
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 * /equipos/dashboard/{id_equipo}:
 *   get:
 *     summary: Obtiene el dashboard completo de un equipo
 *     tags: [Equipos]
 *     parameters:
 *       - $ref: '#/components/parameters/IdEquipo'
 *       - $ref: '#/components/parameters/Temporada'
 *     responses:
 *       200:
 *         description: Datos agregados para el dashboard del equipo.
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 * /equipos/info/{id_equipo}:
 *   get:
 *     summary: Obtiene el resumen principal de un equipo
 *     tags: [Equipos]
 *     parameters:
 *       - $ref: '#/components/parameters/IdEquipo'
 *     responses:
 *       200:
 *         description: Informacion de perfil, clasificacion, partidos y destacados.
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 * /equipos/plantilla/{id_equipo}:
 *   get:
 *     summary: Obtiene la plantilla de un equipo en una temporada
 *     tags: [Equipos]
 *     parameters:
 *       - $ref: '#/components/parameters/IdEquipo'
 *       - $ref: '#/components/parameters/Temporada'
 *     responses:
 *       200:
 *         description: Plantilla del equipo.
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 * /equipos/partidos/{id_equipo}:
 *   get:
 *     summary: Obtiene los partidos de un equipo por temporada
 *     tags: [Equipos]
 *     parameters:
 *       - $ref: '#/components/parameters/IdEquipo'
 *       - $ref: '#/components/parameters/Temporada'
 *     responses:
 *       200:
 *         description: Partidos del equipo.
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 * /equipos/trayectoria/{id_equipo}:
 *   get:
 *     summary: Obtiene la trayectoria historica de un equipo
 *     tags: [Equipos]
 *     parameters:
 *       - $ref: '#/components/parameters/IdEquipo'
 *     responses:
 *       200:
 *         description: Trayectoria del equipo por temporadas.
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
const express = require('express');
const router = express.Router();
const equipoController = require('../controllers/equipoController');

router.get('/analisis/stats/:id_equipo', equipoController.getStatsEquipoPorId);
router.get('/dashboard/:id_equipo', equipoController.getDashboardEquipo);
router.get('/info/:id_equipo', equipoController.getInfoEquipo);
router.get('/plantilla/:id_equipo', equipoController.getPlantillaEquipoPorTemporada);
router.get('/partidos/:id_equipo', equipoController.getPartidosEquipoPorId);
router.get('/trayectoria/:id_equipo', equipoController.getTrayectoriaEquipoPorTemporada);
// Rutas normales
router.get('/:id', equipoController.getEquipoPorId);
router.get('/', equipoController.getEquipos);
/* RESPUESTA
{
    "id_equipo": 543,
    "nombre_equipo": "Real Betis",
    "codigo": "BET",
    "pais": "Spain",
    "fundado_en": 1907,
    "logo_url": "https://media.api-sports.io/football/teams/543.png",
    "estadio": "Estadio Benito Villamarín",
    "direccion": "Avenida de Heliópolis",
    "ciudad": "Sevilla",
    "capacidad": 60721
}
*/ 
module.exports = router;
