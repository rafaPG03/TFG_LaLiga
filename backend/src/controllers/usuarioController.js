const pool = require('../config/db');
const bcrypt = require('bcrypt'); // 1. Importar bcrypt
const jwt = require('jsonwebtoken');

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

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET no esta configurado');
      return res.status(500).json({ error: 'Autenticacion no configurada en el servidor' });
    }

    const token = jwt.sign({}, process.env.JWT_SECRET, {
      algorithm: 'HS256',
      subject: String(usuario.id_usuario),
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

    // 3. Si todo ok, devolvemos los datos (sin el hash) y el token JWT
    res.json({
      mensaje: "Login exitoso",
      token,
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

const getUsuarioPorId = async (req, res) => {
  const { id } = req.params;

  try {
    const query = `
      SELECT id_usuario, nombre_usuario, email 
      FROM dim_usuario 
      WHERE id_usuario = $1
    `;
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Error al obtener perfil" });
  }
};

const actualizarUsuario = async (req, res) => {
  const { id } = req.params;
  const { nombre_usuario, email } = req.body;

  if (!nombre_usuario || !email) {
    return res.status(400).json({ error: 'Nombre de usuario y email son obligatorios' });
  }

  try {
    const query = `
      UPDATE dim_usuario
      SET nombre_usuario = $1, email = $2
      WHERE id_usuario = $3
      RETURNING id_usuario, nombre_usuario, email
    `;
    const result = await pool.query(query, [nombre_usuario, email, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Nombre de usuario o email ya existe' });
    }

    console.error(err.message);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
};

const cambiarPassword = async (req, res) => {
  const { id } = req.params;
  const { password_actual, password_nueva } = req.body;
  const regexPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

  if (!password_actual || !password_nueva) {
    return res.status(400).json({ error: 'La contrasena actual y la nueva son obligatorias' });
  }

  if (!regexPassword.test(password_nueva)) {
    return res.status(400).json({
      error: 'La nueva contrasena debe tener al menos 8 caracteres, una mayuscula, una minuscula y un numero',
    });
  }

  try {
    const result = await pool.query(
      'SELECT id_usuario, password_hash FROM dim_usuario WHERE id_usuario = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const usuario = result.rows[0];
    const passwordCorrecta = await bcrypt.compare(password_actual, usuario.password_hash);

    if (!passwordCorrecta) {
      return res.status(401).json({ error: 'La contrasena actual no es correcta' });
    }

    const mismaPassword = await bcrypt.compare(password_nueva, usuario.password_hash);

    if (mismaPassword) {
      return res.status(400).json({ error: 'La nueva contrasena debe ser distinta a la actual' });
    }

    const saltRounds = 10;
    const nuevoHash = await bcrypt.hash(password_nueva, saltRounds);

    await pool.query(
      'UPDATE dim_usuario SET password_hash = $1 WHERE id_usuario = $2',
      [nuevoHash, id]
    );

    res.json({ mensaje: 'Contrasena actualizada correctamente' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error al cambiar la contrasena' });
  }
};

const eliminarUsuario = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM dim_usuario WHERE id_usuario = $1 RETURNING id_usuario',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ mensaje: 'Cuenta eliminada correctamente' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Error al eliminar la cuenta' });
  }
};

module.exports = {
  registrarUsuario,
  loginUsuario,
  getUsuarioPorId,
  actualizarUsuario,
  cambiarPassword,
  eliminarUsuario,
};
