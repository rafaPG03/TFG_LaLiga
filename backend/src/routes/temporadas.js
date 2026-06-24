const express = require('express');
const router = express.Router();
const temporadaController = require('../controllers/temporadaController');

router.get('/annos', temporadaController.getTemporadas);
router.get('/partidos', temporadaController.getPartidosTemporada);
router.get('/equipos', temporadaController.getEquiposTemporada);
router.get('/graficos', temporadaController.getGraficosTemporada);
router.get('/info', temporadaController.getResumenTemporada);
router.get('/destacados', temporadaController.getDestacadosTemporada);
router.get('/rankings', temporadaController.getRankingsTemporada);
router.get('/mvps', temporadaController.getMvpsJornada);
router.get('/jornada/ultima', temporadaController.getUltimaJornadaTemporada);
router.get('/jornada/proxima', temporadaController.getProximaJornadaTemporada);
router.get('/ascensos-descensos', temporadaController.getAscensosDescensos);

router.get('/', temporadaController.getClasificacion);

module.exports = router;
