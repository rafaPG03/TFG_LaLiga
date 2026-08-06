/**
 * @swagger
 * /buscador:
 *   get:
 *     summary: Busca equipos y jugadores por texto
 *     tags: [Buscador]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *           example: messi
 *         description: Texto de busqueda.
 *     responses:
 *       200:
 *         description: Resultados de busqueda global.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SearchResult'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
const express = require('express');
const router = express.Router();
const buscadorController = require('../controllers/buscadorController');

// URL: http://localhost:3000/api/buscar?q=messi
router.get('/', buscadorController.buscarGlobal);

module.exports = router;
