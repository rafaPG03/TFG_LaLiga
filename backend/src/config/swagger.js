const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TFG LaLiga API',
      version: '1.0.0',
      description:
        'Documentacion de la API REST del backend de la aplicacion TFG LaLiga.',
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Servidor local',
      },
    ],
    tags: [
      { name: 'Equipos', description: 'Informacion, plantillas y analisis de equipos' },
      { name: 'Partidos', description: 'Partidos, jornadas, eventos y estadisticas' },
      { name: 'Usuarios', description: 'Registro, login y perfil de usuario' },
      { name: 'Jugadores', description: 'Informacion, trayectoria y rendimiento de jugadores' },
      { name: 'Temporadas', description: 'Clasificacion, resumenes, rankings y simulaciones' },
      { name: 'Favoritos', description: 'Gestion de equipos y jugadores favoritos' },
      { name: 'Buscador', description: 'Busqueda global de jugadores y equipos' },
      { name: 'Data Mining', description: 'Analisis predictivo y recomendaciones' },
      { name: 'Chatbot', description: 'Consultas en lenguaje natural sobre la base de datos' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      parameters: {
        Temporada: {
          in: 'query',
          name: 'temporada',
          schema: { type: 'integer', example: 2024 },
          description: 'Temporada a consultar.',
        },
        Jornada: {
          in: 'query',
          name: 'jornada',
          schema: { type: 'integer', example: 12 },
          description: 'Jornada de la temporada.',
        },
        IdEquipo: {
          in: 'path',
          name: 'id_equipo',
          required: true,
          schema: { type: 'integer', example: 529 },
          description: 'Identificador del equipo.',
        },
        IdJugador: {
          in: 'path',
          name: 'id_jugador',
          required: true,
          schema: { type: 'integer', example: 276 },
          description: 'Identificador del jugador.',
        },
        IdPartido: {
          in: 'path',
          name: 'id_partido',
          required: true,
          schema: { type: 'integer', example: 1035241 },
          description: 'Identificador del partido.',
        },
        IdUsuario: {
          in: 'path',
          name: 'id_usuario',
          required: true,
          schema: { type: 'integer', example: 1 },
          description: 'Identificador del usuario.',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Error interno del servidor' },
          },
        },
        Mensaje: {
          type: 'object',
          properties: {
            mensaje: { type: 'string', example: 'Operacion realizada correctamente' },
          },
        },
        Equipo: {
          type: 'object',
          properties: {
            id_equipo: { type: 'integer', example: 529 },
            nombre_equipo: { type: 'string', example: 'FC Barcelona' },
            codigo: { type: 'string', example: 'BAR' },
            pais: { type: 'string', example: 'Spain' },
            fundado_en: { type: 'integer', example: 1899 },
            logo: { type: 'string', example: 'https://media.api-sports.io/football/teams/529.png' },
            estadio: { type: 'string', example: 'Camp Nou' },
            ciudad: { type: 'string', example: 'Barcelona' },
            capacidad: { type: 'integer', example: 99354 },
          },
        },
        Jugador: {
          type: 'object',
          properties: {
            id_jugador: { type: 'integer', example: 276 },
            nombre: { type: 'string', example: 'Lionel Messi' },
            foto: { type: 'string', example: 'https://media.api-sports.io/football/players/276.png' },
            nacionalidad: { type: 'string', example: 'Argentina' },
          },
        },
        Partido: {
          type: 'object',
          properties: {
            id_partido: { type: 'integer', example: 1035241 },
            id_local: { type: 'integer', example: 529 },
            id_visitante: { type: 'integer', example: 541 },
            equipo_local: { type: 'string', example: 'FC Barcelona' },
            equipo_visitante: { type: 'string', example: 'Real Madrid' },
            goles_local: { type: 'integer', nullable: true, example: 2 },
            goles_visitante: { type: 'integer', nullable: true, example: 1 },
            temporada: { type: 'integer', example: 2024 },
            jornada: { type: 'integer', example: 10 },
            status: { type: 'string', example: 'Completado' },
            hora: { type: 'string', example: '21:00' },
          },
        },
        Usuario: {
          type: 'object',
          properties: {
            id_usuario: { type: 'integer', example: 1 },
            nombre_usuario: { type: 'string', example: 'rafa' },
            email: { type: 'string', format: 'email', example: 'rafa@example.com' },
          },
        },
        RegistroUsuarioRequest: {
          type: 'object',
          required: ['nombre_usuario', 'email', 'password'],
          properties: {
            nombre_usuario: { type: 'string', example: 'rafa' },
            email: { type: 'string', format: 'email', example: 'rafa@example.com' },
            password: { type: 'string', format: 'password', example: 'Password123' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              description: 'Email o nombre de usuario.',
              example: 'rafa@example.com',
            },
            password: { type: 'string', format: 'password', example: 'Password123' },
          },
        },
        ActualizarUsuarioRequest: {
          type: 'object',
          required: ['nombre_usuario', 'email'],
          properties: {
            nombre_usuario: { type: 'string', example: 'rafa_actualizado' },
            email: { type: 'string', format: 'email', example: 'rafa2@example.com' },
          },
        },
        CambiarPasswordRequest: {
          type: 'object',
          required: ['password_actual', 'password_nueva'],
          properties: {
            password_actual: { type: 'string', format: 'password', example: 'Password123' },
            password_nueva: { type: 'string', format: 'password', example: 'NuevaPassword123' },
          },
        },
        FavoritoToggleRequest: {
          type: 'object',
          required: ['id_usuario', 'id_favorito', 'tipo'],
          properties: {
            id_usuario: { type: 'integer', example: 1 },
            id_favorito: { type: 'integer', example: 529 },
            tipo: { type: 'string', enum: ['equipo', 'jugador'], example: 'equipo' },
          },
        },
        ChatbotRequest: {
          type: 'object',
          required: ['pregunta'],
          properties: {
            pregunta: {
              type: 'string',
              example: 'Que equipo tiene mas puntos en la temporada 2024?',
            },
          },
        },
        MontecarloSimulacionRequest: {
          type: 'object',
          properties: {
            temporada: { type: 'integer', example: 2024 },
            clasificacion: {
              type: 'array',
              items: { type: 'object', additionalProperties: true },
            },
            partidos_simulados: {
              type: 'array',
              items: { type: 'object', additionalProperties: true },
            },
          },
        },
        SearchResult: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 529 },
            principal: { type: 'string', example: 'FC Barcelona' },
            secundario: { type: 'string', example: 'Spain' },
            imagen: { type: 'string', nullable: true },
            tipo: { type: 'string', enum: ['equipo', 'jugador'], example: 'equipo' },
          },
        },
        MetaTemporada: {
          type: 'object',
          properties: {
            temporada: { type: 'integer', example: 2024 },
            temporada_actual: { type: 'integer', example: 2024 },
            temporadas: {
              type: 'array',
              items: { type: 'integer' },
              example: [2024, 2023, 2022],
            },
            es_temporada_actual: { type: 'boolean', example: true },
          },
        },
      },
      responses: {
        BadRequest: {
          description: 'Solicitud incorrecta.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
        NotFound: {
          description: 'Recurso no encontrado.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
        ServerError: {
          description: 'Error interno del servidor.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
};

module.exports = swaggerJSDoc(options);
