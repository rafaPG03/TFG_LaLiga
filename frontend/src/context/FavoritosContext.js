import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_KEY = '@tfg/session';
const FavoritosContext = createContext(null);

export function FavoritosProvider({ children }) {
  const [idUsuario, setIdUsuario] = useState(null);
  const [equiposFav, setEquiposFav] = useState([]);
  const [jugadoresFav, setJugadoresFav] = useState([]);
  const [loadingFavoritos, setLoadingFavoritos] = useState(true);

  const refreshSession = useCallback(async () => {
    try {
      const rawSesion = await AsyncStorage.getItem(SESSION_KEY);
      if (!rawSesion) {
        setIdUsuario(null);
        return;
      }

      const sesion = JSON.parse(rawSesion);
      setIdUsuario(Number(sesion?.id) || null);
    } catch (error) {
      setIdUsuario(null);
    }
  }, []);

  const cargarFavoritos = useCallback(async (usuarioId) => {
    if (!usuarioId) {
      setEquiposFav([]);
      setJugadoresFav([]);
      setLoadingFavoritos(false);
      return;
    }

    setLoadingFavoritos(true);

    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/favoritos/${usuarioId}`);
      if (!response.ok) {
        throw new Error('No se pudieron cargar los favoritos');
      }

      const data = await response.json();
      setEquiposFav(Array.isArray(data?.equiposFav) ? data.equiposFav : []);
      setJugadoresFav(Array.isArray(data?.jugadoresFav) ? data.jugadoresFav : []);
    } catch (error) {
      setEquiposFav([]);
      setJugadoresFav([]);
    } finally {
      setLoadingFavoritos(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    cargarFavoritos(idUsuario);
  }, [idUsuario, cargarFavoritos]);

  const isFavorite = useCallback(
    (id, tipo) => {
      const idNum = Number(id);
      if (!Number.isInteger(idNum)) {
        return false;
      }

      if (tipo === 'equipo') {
        return equiposFav.includes(idNum);
      }

      if (tipo === 'jugador') {
        return jugadoresFav.includes(idNum);
      }

      return false;
    },
    [equiposFav, jugadoresFav]
  );

  const toggleFav = useCallback(
    async (id, tipo) => {
      const idNum = Number(id);
      if (!idUsuario || !Number.isInteger(idNum) || !['equipo', 'jugador'].includes(tipo)) {
        return false;
      }

      const eraFavorito = tipo === 'equipo' ? equiposFav.includes(idNum) : jugadoresFav.includes(idNum);

      if (tipo === 'equipo') {
        setEquiposFav((prev) =>
          eraFavorito ? prev.filter((favId) => favId !== idNum) : [...prev, idNum]
        );
      } else {
        setJugadoresFav((prev) =>
          eraFavorito ? prev.filter((favId) => favId !== idNum) : [...prev, idNum]
        );
      }

      try {
        const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/favoritos/toggle`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id_usuario: idUsuario,
            id_favorito: idNum,
            tipo,
          }),
        });

        if (!response.ok) {
          throw new Error('No se pudo actualizar favorito');
        }

        return true;
      } catch (error) {
        if (tipo === 'equipo') {
          setEquiposFav((prev) =>
            eraFavorito ? [...prev, idNum] : prev.filter((favId) => favId !== idNum)
          );
        } else {
          setJugadoresFav((prev) =>
            eraFavorito ? [...prev, idNum] : prev.filter((favId) => favId !== idNum)
          );
        }

        return false;
      }
    },
    [idUsuario, equiposFav, jugadoresFav]
  );

  const value = useMemo(
    () => ({
      idUsuario,
      equiposFav,
      jugadoresFav,
      loadingFavoritos,
      isFavorite,
      toggleFav,
      refreshSession,
      recargarFavoritos: () => cargarFavoritos(idUsuario),
    }),
    [idUsuario, equiposFav, jugadoresFav, loadingFavoritos, isFavorite, toggleFav, refreshSession, cargarFavoritos]
  );

  return <FavoritosContext.Provider value={value}>{children}</FavoritosContext.Provider>;
}

export function useFavoritos() {
  const context = useContext(FavoritosContext);

  if (!context) {
    throw new Error('useFavoritos debe usarse dentro de FavoritosProvider');
  }

  return context;
}
