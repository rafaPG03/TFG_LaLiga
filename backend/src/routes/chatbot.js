/**
 * @swagger
 * /chatbot:
 *   post:
 *     summary: Responde una pregunta en lenguaje natural sobre los datos de LaLiga
 *     tags: [Chatbot]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChatbotRequest'
 *     responses:
 *       200:
 *         description: Respuesta generada, SQL usado y resultado de la consulta.
 *         content:
 *           application/json:
 *             example:
 *               pregunta: Que equipo tiene mas puntos en la temporada 2024?
 *               respuesta: El equipo con mas puntos es...
 *               sql: SELECT ...
 *               resultado: []
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
const express = require("express");
const router = express.Router();
const chatbotController = require("../controllers/chatbotController");

router.post("/", chatbotController.contestarPregunta);

module.exports = router;
