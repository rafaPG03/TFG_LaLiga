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

const loginUsuario = async (req, res) => {
  const { email, password } = req.body; // El usuario puede enviar email o nombre_usuario

  try {
    // 1. Buscamos al usuario por email (o nombre_usuario)
    const query = 'SELECT * FROM dim_usuario WHERE email = $1 OR nombre_usuario = $1';
    const result = await pool.query(query, [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Datos incorrectos" });
    }

    const usuario = result.rows[0];

    // 2. Comparamos la contraseña escrita con el hash de la base de datos
    const passwordCorrecta = await bcrypt.compare(password, usuario.password_hash);

    if (!passwordCorrecta) {
      return res.status(401).json({ error: "Datos incorrectos" });
    }

    // 3. Si todo ok, devolvemos los datos (sin el hash)
    res.json({
      mensaje: "Login exitoso",
      usuario: {
        id: usuario.id_usuario,
        nombre: usuario.nombre_usuario,
        email: usuario.email
      }
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

module.exports = { registrarUsuario, loginUsuario };