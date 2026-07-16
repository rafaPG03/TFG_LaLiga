import argparse
import json
import os
import sys
from pathlib import Path

import numpy as np
import pandas as pd
import psycopg2


RUTA_RAIZ = Path(__file__).resolve().parents[2]
RUTA_DM = RUTA_RAIZ / "DATA_MINING" / "DSA_DM"
RUTA_PREDICCIONES = RUTA_DM / "predicciones_partidos_incompletos.csv"
RUTA_SALIDA = RUTA_DM / "simulacion_montecarlo_laliga_resultados.csv"

TEMPORADA_ACTUAL = 2025
DESEMPATE_DG = True
DESEMPATE_ALEATORIO = False

N_SIMULACIONES = 10000
SEMILLA_ALEATORIA = 42


def leer_argumentos() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Simula la liga leyendo la tabla actual desde PostgreSQL"
    )
    parser.add_argument("--db-host", default=os.getenv("PGHOST", "localhost"))
    parser.add_argument("--db-port", default=os.getenv("PGPORT", "5432"))
    parser.add_argument("--db-name", default=os.getenv("PGDATABASE", "TFG_BDLaLiga"))
    parser.add_argument("--db-user", default=os.getenv("PGUSER", "postgres"))
    parser.add_argument("--db-password", default=os.getenv("PGPASSWORD", "betico18"))
    parser.add_argument("--predicciones", default=str(RUTA_PREDICCIONES))
    parser.add_argument("--output", default=str(RUTA_SALIDA))
    parser.add_argument(
        "--input-json",
        default=None,
        help="Ruta a un JSON de simulacion manual. Usa '-' para leer desde stdin.",
    )
    parser.add_argument(
        "--output-json",
        default=None,
        help="Ruta opcional donde escribir la respuesta JSON.",
    )
    parser.add_argument(
        "--stdout-json",
        action="store_true",
        help="Escribe la respuesta JSON por stdout para integracion con Node.",
    )
    return parser.parse_args()


def leer_tabla(conexion, consulta: str) -> pd.DataFrame:
    return pd.read_sql_query(consulta, conexion)


def cargar_predicciones(ruta_predicciones: Path) -> pd.DataFrame:
    predicciones = pd.read_csv(ruta_predicciones)
    return normalizar_predicciones(predicciones)


def normalizar_predicciones(predicciones: pd.DataFrame) -> pd.DataFrame:
    columnas_probabilidad = ["prob_victoria_local", "prob_empate", "prob_victoria_visitante"]

    columnas_requeridas = {"id_local", "id_visitante", *columnas_probabilidad}
    columnas_faltantes = columnas_requeridas - set(predicciones.columns)
    if columnas_faltantes:
        raise ValueError(
            "Faltan columnas en predicciones: "
            + ", ".join(sorted(columnas_faltantes))
        )

    if predicciones[columnas_probabilidad].max().max() > 1.0:
        predicciones[columnas_probabilidad] = predicciones[columnas_probabilidad] / 100.0

    predicciones[columnas_probabilidad] = predicciones[columnas_probabilidad].div(
        predicciones[columnas_probabilidad].sum(axis=1), axis=0
    )
    return predicciones


def cargar_clasificacion(argumentos: argparse.Namespace) -> pd.DataFrame:
    conexion = psycopg2.connect(
        host=argumentos.db_host,
        port=argumentos.db_port,
        dbname=argumentos.db_name,
        user=argumentos.db_user,
        password=argumentos.db_password,
    )

    try:
        clasificacion = leer_tabla(
            conexion,
            """
            SELECT
                id_equipo,
                nombre_equipo,
                temporada,
                jornada,
                puntos,
                dg
            FROM public.h_equipo_temporada
            """,
        )
    finally:
        conexion.close()

    return clasificacion


def leer_json_entrada(ruta_entrada: str) -> dict:
    if ruta_entrada == "-":
        contenido = sys.stdin.read()
    else:
        contenido = Path(ruta_entrada).read_text(encoding="utf-8")

    if not contenido.strip():
        raise ValueError("El JSON de entrada esta vacio.")

    return json.loads(contenido)


def cargar_datos_desde_json(payload: dict) -> tuple[pd.DataFrame, pd.DataFrame, int | None]:
    temporada = payload.get("temporada")
    equipos_payload = payload.get("equipos") or payload.get("clasificacion")
    predicciones_payload = payload.get("predicciones")

    if not isinstance(equipos_payload, list) or not equipos_payload:
        raise ValueError("El JSON debe incluir 'equipos' o 'clasificacion' con datos.")

    if not isinstance(predicciones_payload, list) or not predicciones_payload:
        raise ValueError("El JSON debe incluir 'predicciones' con partidos pendientes.")

    equipos = pd.DataFrame(equipos_payload).copy()
    if "nombre_equipo" not in equipos.columns and "equipo" in equipos.columns:
        equipos["nombre_equipo"] = equipos["equipo"]

    columnas_equipos = {"id_equipo", "nombre_equipo", "puntos", "dg"}
    columnas_faltantes = columnas_equipos - set(equipos.columns)
    if columnas_faltantes:
        raise ValueError(
            "Faltan columnas en equipos/clasificacion: "
            + ", ".join(sorted(columnas_faltantes))
        )

    equipos = equipos[["id_equipo", "nombre_equipo", "puntos", "dg"]].copy()
    equipos["id_equipo"] = pd.to_numeric(equipos["id_equipo"], errors="raise").astype(int)
    equipos["puntos"] = pd.to_numeric(equipos["puntos"], errors="raise")
    equipos["dg"] = pd.to_numeric(equipos["dg"], errors="raise")
    equipos = equipos.drop_duplicates("id_equipo").sort_values("id_equipo").reset_index(drop=True)

    predicciones = pd.DataFrame(predicciones_payload).copy()
    predicciones = normalizar_predicciones(predicciones)

    return equipos, predicciones, temporada


def preparar_estado_inicial(clasificacion: pd.DataFrame) -> pd.DataFrame:
    clasificacion_temporada = clasificacion[clasificacion["temporada"] == TEMPORADA_ACTUAL].copy()
    if clasificacion_temporada.empty:
        raise ValueError("No hay datos en la tabla para la temporada indicada.")

    ultima_jornada = clasificacion_temporada["jornada"].max()
    tabla_actual = clasificacion_temporada[clasificacion_temporada["jornada"] == ultima_jornada].copy()

    equipos = tabla_actual[["id_equipo", "nombre_equipo", "puntos", "dg"]].drop_duplicates("id_equipo")
    return equipos.sort_values("id_equipo").reset_index(drop=True)


def simular_liga(predicciones: pd.DataFrame, equipos: pd.DataFrame) -> pd.DataFrame:
    ids_equipos = equipos["id_equipo"].to_numpy()
    nombres_equipos = equipos["nombre_equipo"].to_numpy()
    puntos_base = equipos["puntos"].to_numpy(dtype=float)
    dg_base = equipos["dg"].to_numpy(dtype=float)

    predicciones = predicciones[
        predicciones["id_local"].isin(ids_equipos)
        & predicciones["id_visitante"].isin(ids_equipos)
    ].copy()

    id_a_indice = {id_equipo: indice for indice, id_equipo in enumerate(ids_equipos)}
    indices_local = predicciones["id_local"].map(id_a_indice).to_numpy()
    indices_visitante = predicciones["id_visitante"].map(id_a_indice).to_numpy()

    prob_local = predicciones["prob_victoria_local"].to_numpy()
    prob_empate = predicciones["prob_empate"].to_numpy()

    n_partidos = len(predicciones)
    if n_partidos == 0:
        raise ValueError("No hay partidos pendientes tras filtrar por equipos.")

    generador = np.random.default_rng(SEMILLA_ALEATORIA)
    n_equipos = len(ids_equipos)

    contador_campeon = np.zeros(n_equipos, dtype=int)
    contador_champions = np.zeros(n_equipos, dtype=int)
    contador_europa = np.zeros(n_equipos, dtype=int)
    contador_mediatabla = np.zeros(n_equipos, dtype=int)
    contador_descenso = np.zeros(n_equipos, dtype=int)

    for _ in range(N_SIMULACIONES):
        puntos = puntos_base.copy()
        dg = dg_base.copy()

        aleatorios = generador.random(n_partidos)
        victoria_local = aleatorios < prob_local
        empate = (aleatorios >= prob_local) & (aleatorios < (prob_local + prob_empate))
        victoria_visitante = ~victoria_local & ~empate

        np.add.at(puntos, indices_local[victoria_local], 3)
        np.add.at(puntos, indices_visitante[victoria_visitante], 3)
        np.add.at(puntos, indices_local[empate], 1)
        np.add.at(puntos, indices_visitante[empate], 1)

        if DESEMPATE_DG:
            np.add.at(dg, indices_local[victoria_local], 1)
            np.add.at(dg, indices_visitante[victoria_local], -1)
            np.add.at(dg, indices_visitante[victoria_visitante], 1)
            np.add.at(dg, indices_local[victoria_visitante], -1)

        if DESEMPATE_ALEATORIO:
            clave_desempate = generador.random(n_equipos)
        else:
            clave_desempate = nombres_equipos

        orden = np.lexsort((clave_desempate, -dg, -puntos))
        posiciones = np.empty(n_equipos, dtype=int)
        posiciones[orden] = np.arange(1, n_equipos + 1)

        contador_campeon += posiciones == 1
        contador_champions += posiciones <= 4
        contador_europa += (posiciones >= 5) & (posiciones <= 7)
        contador_mediatabla += (posiciones >= 8) & (posiciones <= 17)
        contador_descenso += posiciones >= 18

    return pd.DataFrame(
        {
            "id_equipo": ids_equipos,
            "equipo": nombres_equipos,
            "campeon_%": 100 * contador_campeon / N_SIMULACIONES,
            "champions_%": 100 * contador_champions / N_SIMULACIONES,
            "europa_%": 100 * contador_europa / N_SIMULACIONES,
            "media_tabla_%": 100 * contador_mediatabla / N_SIMULACIONES,
            "descenso_%": 100 * contador_descenso / N_SIMULACIONES,
        }
    ).sort_values(["campeon_%", "champions_%", "europa_%"], ascending=False)


def resultados_a_json(
    resultados: pd.DataFrame,
    temporada: int | None,
    n_simulaciones: int,
) -> dict:
    columnas_json = {
        "campeon_%": "campeon_pct",
        "champions_%": "champions_pct",
        "europa_%": "europa_pct",
        "media_tabla_%": "media_tabla_pct",
        "descenso_%": "descenso_pct",
    }

    salida = resultados.rename(columns=columnas_json).copy()
    for columna in columnas_json.values():
        salida[columna] = salida[columna].round(3)

    return {
        "temporada": temporada,
        "n_simulaciones": n_simulaciones,
        "montecarlo": salida.to_dict(orient="records"),
    }


def main() -> None:
    argumentos = leer_argumentos()
    temporada = TEMPORADA_ACTUAL

    if argumentos.input_json:
        payload = leer_json_entrada(argumentos.input_json)
        equipos, predicciones, temporada_payload = cargar_datos_desde_json(payload)
        temporada = temporada_payload if temporada_payload is not None else TEMPORADA_ACTUAL
    else:
        predicciones = cargar_predicciones(Path(argumentos.predicciones))
        clasificacion = cargar_clasificacion(argumentos)
        equipos = preparar_estado_inicial(clasificacion)

    resultados = simular_liga(predicciones, equipos)

    if argumentos.stdout_json or argumentos.output_json:
        respuesta_json = resultados_a_json(resultados, temporada, N_SIMULACIONES)
        contenido_json = json.dumps(respuesta_json, ensure_ascii=False, indent=2)

        if argumentos.stdout_json:
            print(contenido_json)

        if argumentos.output_json:
            archivo_json = Path(argumentos.output_json)
            archivo_json.parent.mkdir(parents=True, exist_ok=True)
            archivo_json.write_text(contenido_json + "\n", encoding="utf-8")
    else:
        print(resultados.to_string(index=False))

    archivo_salida = Path(argumentos.output)
    archivo_salida.parent.mkdir(parents=True, exist_ok=True)
    resultados.to_csv(archivo_salida, index=False)


if __name__ == "__main__":
    main()
