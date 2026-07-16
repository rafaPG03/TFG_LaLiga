function validateSQL(sql) {
  const cleanSQL = sql.trim().toUpperCase();

  if (!cleanSQL.startsWith("SELECT") || cleanSQL.includes("OK")) {
    throw new Error("Solo se permiten consultas SELECT");
  }

  const forbiddenWords = [
    "INSERT",
    "UPDATE",
    "DELETE",
    "DROP",
    "ALTER",
    "TRUNCATE",
    "CREATE",
    "GRANT",
    "REVOKE"
  ];

  for (const word of forbiddenWords) {
    if (cleanSQL.includes(word)) {
      throw new Error(`Palabra prohibida detectada: ${word}`);
    }
  }

  return true;
}

module.exports = validateSQL;