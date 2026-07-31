import { useCallback, useEffect, useState } from "react";

export default function useConsultaDataMining(ruta, activa = true) {
  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(activa);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);

  const recargar = useCallback(() => setVersion((valor) => valor + 1), []);

  useEffect(() => {
    if (!activa || !ruta) {
      setCargando(false);
      return undefined;
    }

    const controller = new AbortController();
    let montado = true;

    const consultar = async () => {
      setCargando(true);
      setError("");

      try {
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}${ruta}`,
          {
            signal: controller.signal,
          },
        );
        const body = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            body?.error || "La API no pudo completar la consulta",
          );
        }

        if (montado) setData(body);
      } catch (consultaError) {
        if (consultaError.name !== "AbortError" && montado) {
          setError(
            consultaError.message || "No se pudo conectar con el servidor",
          );
        }
      } finally {
        if (montado) setCargando(false);
      }
    };

    consultar();

    return () => {
      montado = false;
      controller.abort();
    };
  }, [ruta, activa, version]);

  return { data, cargando, error, recargar };
}
