const MAX_HISTORIAL_MENSAJES = 12;
const MAX_TEXTO_MENSAJE = 2000;
const ROLES_PERMITIDOS = new Set(["user", "assistant"]);

const crearErrorValidacion = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
};

const normalizarHistorial = (historial) => {
  if (historial == null) {
    return [];
  }

  if (!Array.isArray(historial)) {
    throw crearErrorValidacion("El historial debe ser un array");
  }

  const historialNormalizado = historial.map((mensaje) => {
    if (!mensaje || typeof mensaje !== "object" || Array.isArray(mensaje)) {
      throw crearErrorValidacion("Cada mensaje del historial debe ser un objeto");
    }

    if (!ROLES_PERMITIDOS.has(mensaje.role)) {
      throw crearErrorValidacion("El historial contiene un role no permitido");
    }

    if (typeof mensaje.text !== "string" || !mensaje.text.trim()) {
      throw crearErrorValidacion("Cada mensaje del historial debe contener texto");
    }

    return {
      role: mensaje.role,
      text: mensaje.text.trim().slice(0, MAX_TEXTO_MENSAJE),
    };
  });

  return historialNormalizado.slice(-MAX_HISTORIAL_MENSAJES);
};

module.exports = {
  normalizarHistorial,
};
