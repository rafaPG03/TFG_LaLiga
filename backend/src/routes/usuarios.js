/**
 * @swagger
 * /usuarios/registro:
 *   post:
 *     summary: Registra un nuevo usuario
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegistroUsuarioRequest'
 *     responses:
 *       201:
 *         description: Usuario creado correctamente.
 *         content:
 *           application/json:
 *             example:
 *               mensaje: Usuario creado con exito
 *               usuario:
 *                 id_usuario: 1
 *                 nombre_usuario: rafa
 *                 email: rafa@example.com
 *       500:
 *         $ref: '#/components/responses/ServerError'
 * /usuarios/login:
 *   post:
 *     summary: Inicia sesion con email o nombre de usuario
 *     tags: [Usuarios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login correcto.
 *         content:
 *           application/json:
 *             example:
 *               mensaje: Login exitoso
 *               token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *               usuario:
 *                 id: 1
 *                 nombre: rafa
 *                 email: rafa@example.com
 *       401:
 *         description: Datos incorrectos.
 *       500:
 *         $ref: '#/components/responses/ServerError'
 * /usuarios/{id}:
 *   get:
 *     summary: Obtiene un usuario por ID
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *     responses:
 *       200:
 *         description: Usuario encontrado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Usuario'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *   put:
 *     summary: Actualiza los datos de perfil de un usuario
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ActualizarUsuarioRequest'
 *     responses:
 *       200:
 *         description: Usuario actualizado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Usuario'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         description: Nombre de usuario o email ya existente.
 *       500:
 *         $ref: '#/components/responses/ServerError'
 * /usuarios/{id}/password:
 *   put:
 *     summary: Cambia la contrasena de un usuario
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CambiarPasswordRequest'
 *     responses:
 *       200:
 *         description: Contrasena actualizada correctamente.
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         description: La contrasena actual no es correcta.
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuarioController');
const { verificarToken, autorizarMismoUsuario } = require('../middleware/auth');

router.post('/registro', usuariosController.registrarUsuario);
router.post('/login', usuariosController.loginUsuario);
router.put(
  '/:id/password',
  verificarToken,
  autorizarMismoUsuario('params', 'id'),
  usuariosController.cambiarPassword
);
router.get(
  '/:id',
  verificarToken,
  autorizarMismoUsuario('params', 'id'),
  usuariosController.getUsuarioPorId
);
router.put(
  '/:id',
  verificarToken,
  autorizarMismoUsuario('params', 'id'),
  usuariosController.actualizarUsuario
);

module.exports = router;
