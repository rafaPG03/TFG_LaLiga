const pool = require("../config/db");

async function executeQuery(sql, timeoutMs) {
  const result = await pool.query({
    text: sql,
    query_timeout: timeoutMs,
  });

  return result.rows;
}

module.exports = {
  executeQuery
};
