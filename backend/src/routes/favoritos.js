/**
 * @swagger
 * /favoritos/toggle:
 *   post:
 *     summary: Marca o desmarca un equipo o jugador como favorito
 *     tags: [Favoritos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FavoritoToggleRequest'
 *     responses:
 *       200:
 *         description: Favorito eliminado.
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               action: unfavorite
 *               id_usuario: 1
 *               id_favorito: 529
 *               tipo: equipo
 *       201:
 *         description: Favorito anadido.
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 * /favoritos/{id_usuario}:
 *   get:
 *     summary: Obtiene los favoritos de un usuario
 *     tags: [Favoritos]
 *     parameters:
 *       - $ref: '#/components/parameters/IdUsuario'
 *     responses:
 *       200:
 *         description: IDs de equipos y jugadores favoritos.
 *         content:
 *           application/json:
 *             example:
 *               equiposFav: [529, 541]
 *               jugadoresFav: [276]
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
const express = require('express');
const router = express.Router();
const favoritosController = require('../controllers/favoritosController');

router.post('/toggle', favoritosController.toggleFavorito);
router.get('/:id_usuario', favoritosController.getFavoritosUsuario);

module.exports = router;
