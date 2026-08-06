function validateSQL(sql) {
  const cleanSQL = sql.trim().toUpperCase();
  const startsWithReadOnlyQuery = cleanSQL.startsWith("SELECT") || cleanSQL.startsWith("WITH");

  if (!startsWithReadOnlyQuery || cleanSQL.includes("OK")) {
    throw new Error("Solo se permiten consultas SELECT o WITH de solo lectura");
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

  const forbiddenDialect = [
    "GROUP_CONCAT",
    "SEPARATOR",
    "IFNULL",
    "DATE_FORMAT"
  ];

  for (const word of forbiddenWords) {
    if (cleanSQL.includes(word)) {
      throw new Error(`Palabra prohibida detectada: ${word}`);
    }
  }

  for (const word of forbiddenDialect) {
    if (cleanSQL.includes(word)) {
      throw new Error(`Sintaxis no compatible con PostgreSQL detectada: ${word}`);
    }
  }

  return true;
}

module.exports = validateSQL;
