const express = require('express');
const router = express.Router();
const equipoController = require('../controllers/equipoController');

router.get('/:id', equipoController.getEquipoPorId);
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

router.get('/', equipoController.getEquipos);
module.exports = router;