const pool = require('../config/db');
const bcrypt = require('bcrypt'); // 1. Importar bcrypt

const registrarUsuario = async (req, res) => {
  const { nombre_usuario, email, password } = req.body;

  try {
    // 2. Encriptar la contraseña (el número 10 es el nivel de seguridad)
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const query = `
      INSERT INTO dim_usuario (nombre_usuario, email, password_hash)
      VALUES ($1, $2, $3)
      RETURNING id_usuario, nombre_usuario, email;
    `;

    // 3. Guardamos el HASH, no la contraseña real
    const nuevoUsuario = await pool.query(query, [nombre_usuario, email, passwordHash]);

    res.status(201).json({
      mensaje: "Usuario creado con éxito",
      usuario: nuevoUsuario.rows[0]
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Error al registrar usuario" });
  }
};

module.exports = { registrarUsuario };