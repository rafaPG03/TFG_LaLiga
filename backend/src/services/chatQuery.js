const pool = require("../config/db");

async function executeQuery(sql) {
  const result = await pool.query(sql);

  return result.rows;
}

module.exports = {
  executeQuery
};