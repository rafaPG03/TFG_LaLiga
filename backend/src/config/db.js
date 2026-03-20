const { Pool } = require('pg');

// Log para que veas en la consola si están llegando las variables (BORRAR DESPUÉS)
console.log("Conectando a DB con usuario:", process.env.DB_USER);

const pool = new Pool({
  user: String(process.env.DB_USER || ''),
  host: String(process.env.DB_HOST || ''),
  database: String(process.env.DB_NAME || ''),
  password: String(process.env.DB_PASSWORD || ''),
  port: process.env.DB_PORT,
});

module.exports = pool;