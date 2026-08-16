import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SESSION_KEY = "@tfg/session";
const AuthContext = createContext(null);

const normalizarUsuario = (usuario, token) => ({
  id: Number(usuario?.id ?? usuario?.id_usuario),
  nombre: usuario?.nombre ?? usuario?.nombre_usuario ?? "",
  email: usuario?.email ?? "",
  token,
});

export function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(null);
  const [cargandoSesion, setCargandoSesion] = useState(true);

  const cerrarSesion = useCallback(async () => {
    await AsyncStorage.removeItem(SESSION_KEY);
    setSesion(null);
  }, []);

  useEffect(() => {
    const restaurarSesion = async () => {
      try {
        const rawSesion = await AsyncStorage.getItem(SESSION_KEY);
        const sesionGuardada = rawSesion ? JSON.parse(rawSesion) : null;

        if (
          !sesionGuardada?.token ||
          !Number.isInteger(Number(sesionGuardada?.id))
        ) {
          await AsyncStorage.removeItem(SESSION_KEY);
          return;
        }

        const response = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/usuarios/${sesionGuardada.id}`,
          { headers: { Authorization: `Bearer ${sesionGuardada.token}` } },
        );

        if (response.status === 401 || response.status === 403) {
          await AsyncStorage.removeItem(SESSION_KEY);
          return;
        }

        if (response.ok) {
          const usuario = await response.json();
          const sesionActualizada = normalizarUsuario(
            usuario,
            sesionGuardada.token,
          );
          await AsyncStorage.setItem(
            SESSION_KEY,
            JSON.stringify(sesionActualizada),
          );
          setSesion(sesionActualizada);
          return;
        }

        setSesion(sesionGuardada);
      } catch (error) {
        try {
          const rawSesion = await AsyncStorage.getItem(SESSION_KEY);
          const sesionGuardada = rawSesion ? JSON.parse(rawSesion) : null;
          if (
            sesionGuardada?.token &&
            Number.isInteger(Number(sesionGuardada?.id))
          ) {
            setSesion(sesionGuardada);
          }
        } catch (storageError) {
          setSesion(null);
        }
      } finally {
        setCargandoSesion(false);
      }
    };

    restaurarSesion();
  }, []);

  const iniciarSesion = useCallback(async (usuario, token) => {
    const nuevaSesion = normalizarUsuario(usuario, token);

    if (!token || !Number.isInteger(nuevaSesion.id)) {
      throw new Error("El servidor no devolvio una sesion valida");
    }

    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(nuevaSesion));
    setSesion(nuevaSesion);
  }, []);

  const actualizarSesion = useCallback(
    async (datosUsuario) => {
      if (!sesion) {
        return;
      }

      const sesionActualizada = {
        ...sesion,
        nombre:
          datosUsuario?.nombre ?? datosUsuario?.nombre_usuario ?? sesion.nombre,
        email: datosUsuario?.email ?? sesion.email,
      };

      await AsyncStorage.setItem(
        SESSION_KEY,
        JSON.stringify(sesionActualizada),
      );
      setSesion(sesionActualizada);
    },
    [sesion],
  );

  const peticionAutenticada = useCallback(
    async (url, opciones = {}) => {
      if (!sesion?.token) {
        const error = new Error("No hay una sesion activa");
        error.code = "NO_SESSION";
        throw error;
      }

      const response = await fetch(url, {
        ...opciones,
        headers: {
          ...(opciones.headers || {}),
          Authorization: `Bearer ${sesion.token}`,
        },
      });

      if (response.status === 401) {
        await cerrarSesion();
      }

      return response;
    },
    [sesion?.token, cerrarSesion],
  );

  const value = useMemo(
    () => ({
      sesion,
      cargandoSesion,
      iniciarSesion,
      cerrarSesion,
      actualizarSesion,
      peticionAutenticada,
    }),
    [
      sesion,
      cargandoSesion,
      iniciarSesion,
      cerrarSesion,
      actualizarSesion,
      peticionAutenticada,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }

  return context;
}
