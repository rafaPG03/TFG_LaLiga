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
