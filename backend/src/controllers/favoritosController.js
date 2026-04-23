const pool = require('../config/db');

const TIPOS_VALIDOS = {
  equipo: 'id_equipo',
  jugador: 'id_jugador',
};

const normalizarTipo = (tipo = '') => String(tipo).trim().toLowerCase();

const toggleFavorito = async (req, res) => {
  const { id_usuario, id_favorito, tipo } = req.body;
  const tipoNormalizado = normalizarTipo(tipo);

  if (!id_usuario || !id_favorito || !TIPOS_VALIDOS[tipoNormalizado]) {
    return res.status(400).json({
      error: "Debes enviar id_usuario, id_favorito y tipo ('equipo' o 'jugador')",
    });
  }

  const idUsuarioNum = Number(id_usuario);
  const idFavoritoNum = Number(id_favorito);

  if (!Number.isInteger(idUsuarioNum) || !Number.isInteger(idFavoritoNum)) {
    return res.status(400).json({ error: 'id_usuario e id_favorito deben ser enteros' });
  }

  const columna = TIPOS_VALIDOS[tipoNormalizado];

  try {
    const existeQuery = `
      SELECT id_favorito
      FROM h_usuario_favoritos
      WHERE id_usuario = $1
        AND ${columna} = $2
      LIMIT 1;
    `;

    const existe = await pool.query(existeQuery, [idUsuarioNum, idFavoritoNum]);

    if (existe.rows.length > 0) {
      await pool.query('DELETE FROM h_usuario_favoritos WHERE id_favorito = $1', [
        existe.rows[0].id_favorito,
      ]);

      return res.json({
        success: true,
        action: 'unfavorite',
        id_usuario: idUsuarioNum,
        id_favorito: idFavoritoNum,
        tipo: tipoNormalizado,
      });
    }

    const insertQuery = `
      INSERT INTO h_usuario_favoritos (id_usuario, ${columna})
      VALUES ($1, $2)
      RETURNING id_favorito;
    `;

    const inserted = await pool.query(insertQuery, [idUsuarioNum, idFavoritoNum]);

    return res.status(201).json({
      success: true,
      action: 'favorite',
      id_usuario: idUsuarioNum,
      id_favorito: idFavoritoNum,
      tipo: tipoNormalizado,
      favorito_id: inserted.rows[0].id_favorito,
    });
  } catch (error) {
    console.error('Error al alternar favorito:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const getFavoritosUsuario = async (req, res) => {
  const idUsuarioNum = Number(req.params.id_usuario);

  if (!Number.isInteger(idUsuarioNum)) {
    return res.status(400).json({ error: 'id_usuario inválido' });
  }

  try {
    const query = `
      SELECT id_equipo, id_jugador
      FROM h_usuario_favoritos
      WHERE id_usuario = $1;
    `;

    const result = await pool.query(query, [idUsuarioNum]);

    const equiposFav = result.rows
      .map((row) => row.id_equipo)
      .filter((id) => Number.isInteger(id));

    const jugadoresFav = result.rows
      .map((row) => row.id_jugador)
      .filter((id) => Number.isInteger(id));

    return res.json({ equiposFav, jugadoresFav });
  } catch (error) {
    console.error('Error al obtener favoritos:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = {
  toggleFavorito,
  getFavoritosUsuario,
};
