const express = require('express');
const router = express.Router();
const partidoController = require('../controllers/partidoController');

router.get('/', partidoController.getPartidoFecha);
router.get('/h2h/:id1/:id2', partidoController.getPartidosEntreEquipos);
/**
 * [
    {
        "id_partido": 1391110,
        "fecha_hora": "16:00:00",
        "temporada": 2025,
        "goles_local": 0,
        "goles_visitante": 0,
        "equipo_local": "Atletico Madrid",
        "equipo_visitante": "Barcelona",
        "logo_local": "https://media.api-sports.io/football/teams/530.png",
        "logo_visitante": "https://media.api-sports.io/football/teams/529.png",
        "anio": 2026,
        "nombre_mes": "Abril",
        "dia": 5,
        "jornada": 30
    },
    {
        "id_partido": 1391000,
        "fecha_hora": "20:00:00",
        "temporada": 2025,
        "goles_local": 3,
        "goles_visitante": 1,
        "equipo_local": "Barcelona",
        "equipo_visitante": "Atletico Madrid",
        "logo_local": "https://media.api-sports.io/football/teams/529.png",
        "logo_visitante": "https://media.api-sports.io/football/teams/530.png",
        "anio": 2025,
        "nombre_mes": "Diciembre",
        "dia": 2,
        "jornada": 19
    },
 */

module.exports = router;