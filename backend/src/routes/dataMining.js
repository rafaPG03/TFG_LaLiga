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
