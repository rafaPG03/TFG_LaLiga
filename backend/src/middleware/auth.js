const jwt = require("jsonwebtoken");

const obtenerJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET no esta configurado");
  }

  return process.env.JWT_SECRET;
};

const verificarToken = (req, res, next) => {
  const authorization = req.headers.authorization || "";
  const [tipo, token] = authorization.split(" ");

  if (tipo !== "Bearer" || !token) {
    return res.status(401).json({ error: "Token de autenticacion requerido" });
  }

  try {
    const payload = jwt.verify(token, obtenerJwtSecret(), {
      algorithms: ["HS256"],
    });
    const idUsuario = Number(payload.sub);

    if (!Number.isInteger(idUsuario)) {
      return res.status(401).json({ error: "Token de autenticacion invalido" });
    }

    req.usuario = { id: idUsuario };
    return next();
  } catch (error) {
    if (error.message === "JWT_SECRET no esta configurado") {
      console.error(error.message);
      return res
        .status(500)
        .json({ error: "Autenticacion no configurada en el servidor" });
    }

    return res.status(401).json({ error: "Token invalido o caducado" });
  }
};

const autorizarMismoUsuario = (origen, campo) => (req, res, next) => {
  const idSolicitado = Number(req[origen]?.[campo]);

  if (!Number.isInteger(idSolicitado)) {
    return res.status(400).json({ error: "ID de usuario invalido" });
  }

  if (idSolicitado !== req.usuario.id) {
    return res
      .status(403)
      .json({ error: "No puedes acceder a los datos de otro usuario" });
  }

  return next();
};

module.exports = {
  verificarToken,
  autorizarMismoUsuario,
};
