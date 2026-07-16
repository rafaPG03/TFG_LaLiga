--
-- PostgreSQL database dump
--

\restrict Hp2h3TzyeTHGT2Dm4Rmpc1Yf1u5ovlPf4H8CFORv5BCjpway5SRZug1HoSdTKIn

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

-- Started on 2026-07-06 18:39:30

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 260 (class 1255 OID 41753)
-- Name: actualizar_estadisticas_temporada(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.actualizar_estadisticas_temporada() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_temporada integer;
BEGIN
    -- 1. Obtener la temporada desde dim_partidos
    SELECT temporada INTO v_temporada 
    FROM public.dim_partidos 
    WHERE id_partido = NEW.id_partido;

    -- 2. Actualizar si ya existe el registro, o insertar si no (UPSERT)
    INSERT INTO public.h_jugador_temporada (
        id_jugador, id_equipo, temporada, posicion, partidos, minutos, 
        titular, goles, asistencias, tiros_totales, tiros_a_puerta, 
        pases_totales, pases_clave, precision_pases, entradas, bloqueos, 
        intercepciones, duelos_totales, duelos_ganados, faltas_sufridas, 
        faltas_cometidas, regates_intentados, regates_exito, regateado, 
        amarillas, rojas, penaltis_marcados, goles_concedidos, paradas, penaltis_parados
    )
    VALUES (
        NEW.id_jugador, NEW.id_equipo, v_temporada, NEW.posicion, 1, NEW.minutos,
        CASE WHEN NEW.sustituto = FALSE THEN 1 ELSE 0 END, 
        NEW.goles, NEW.asistencias, NEW.tiros_totales, NEW.tiros_a_puerta,
        NEW.pases_totales, NEW.pases_clave, NEW.precision_pases, NEW.entradas, NEW.bloqueos,
        NEW.intercepciones, NEW.duelos_totales, NEW.duelos_ganados, NEW.faltas_recibidas,
        NEW.faltas_cometidas, NEW.regates_intentados, NEW.regates, NEW.regateado,
        NEW.amarilla, NEW.roja, NEW.penaltis_marcados, NEW.goles_concedidos, NEW.paradas, NEW.penaltis_parados
    )
    ON CONFLICT (id_jugador, id_equipo, temporada) 
    DO UPDATE SET
        partidos = h_jugador_temporada.partidos + 1,
        minutos = h_jugador_temporada.minutos + EXCLUDED.minutos,
        titular = h_jugador_temporada.titular + EXCLUDED.titular,
        goles = h_jugador_temporada.goles + EXCLUDED.goles,
        asistencias = h_jugador_temporada.asistencias + EXCLUDED.asistencias,
        tiros_totales = h_jugador_temporada.tiros_totales + EXCLUDED.tiros_totales,
        tiros_a_puerta = h_jugador_temporada.tiros_a_puerta + EXCLUDED.tiros_a_puerta,
        pases_totales = h_jugador_temporada.pases_totales + EXCLUDED.pases_totales,
        pases_clave = h_jugador_temporada.pases_clave + EXCLUDED.pases_clave,
        entradas = h_jugador_temporada.entradas + EXCLUDED.entradas,
        bloqueos = h_jugador_temporada.bloqueos + EXCLUDED.bloqueos,
        intercepciones = h_jugador_temporada.intercepciones + EXCLUDED.intercepciones,
        duelos_totales = h_jugador_temporada.duelos_totales + EXCLUDED.duelos_totales,
        duelos_ganados = h_jugador_temporada.duelos_ganados + EXCLUDED.duelos_ganados,
        faltas_sufridas = h_jugador_temporada.faltas_sufridas + EXCLUDED.faltas_sufridas,
        faltas_cometidas = h_jugador_temporada.faltas_cometidas + EXCLUDED.faltas_cometidas,
        regates_intentados = h_jugador_temporada.regates_intentados + EXCLUDED.regates_intentados,
        regates_exito = h_jugador_temporada.regates_exito + EXCLUDED.regates_exito,
        regateado = h_jugador_temporada.regateado + EXCLUDED.regateado,
        amarillas = h_jugador_temporada.amarillas + EXCLUDED.amarillas,
        rojas = h_jugador_temporada.rojas + EXCLUDED.rojas,
        penaltis_marcados = h_jugador_temporada.penaltis_marcados + EXCLUDED.penaltis_marcados,
        goles_concedidos = h_jugador_temporada.goles_concedidos + EXCLUDED.goles_concedidos,
        paradas = h_jugador_temporada.paradas + EXCLUDED.paradas,
        penaltis_parados = h_jugador_temporada.penaltis_parados + EXCLUDED.penaltis_parados;

	UPDATE public.h_jugador_temporada
    SET nota_media = (
        SELECT AVG(h.nota)
        FROM public.h_jugador_partido h
        JOIN public.dim_partidos p ON h.id_partido = p.id_partido
        WHERE h.id_jugador = NEW.id_jugador 
          AND h.id_equipo = NEW.id_equipo 
          AND p.temporada = v_temporada
    )
    WHERE id_jugador = NEW.id_jugador 
      AND id_equipo = NEW.id_equipo 
      AND temporada = v_temporada;

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.actualizar_estadisticas_temporada() OWNER TO postgres;

--
-- TOC entry 262 (class 1255 OID 41752)
-- Name: fn_actualizar_dim_partido_desde_eventos(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_actualizar_dim_partido_desde_eventos() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_id_partido integer;
    v_local integer;
    v_visitante integer;
    v_goles_local integer := 0;
    v_goles_visitante integer := 0;
    v_ganador character varying(100) := NULL;
    v_nombre_local character varying(100);
    v_nombre_visitante character varying(100);
BEGIN
    v_id_partido := NEW.id_partido;

    SELECT d.id_local, d.id_visitante
      INTO v_local, v_visitante
      FROM public.dim_partidos d
     WHERE d.id_partido = v_id_partido;

    IF NOT FOUND THEN
        RETURN NEW;
    END IF;

    SELECT
        COALESCE(
            SUM(
                CASE
                    WHEN e.tipo = 'Gol'
                         AND (
                             (COALESCE(e.detalle, '') <> 'Gol en propia' AND e.id_equipo = v_local)
                             OR (COALESCE(e.detalle, '') = 'Gol en propia' AND e.id_equipo = v_visitante)
                         )
                    THEN 1
                    ELSE 0
                END
            ),
            0
        ) AS goles_local,
        COALESCE(
            SUM(
                CASE
                    WHEN e.tipo = 'Gol'
                         AND (
                             (COALESCE(e.detalle, '') <> 'Gol en propia' AND e.id_equipo = v_visitante)
                             OR (COALESCE(e.detalle, '') = 'Gol en propia' AND e.id_equipo = v_local)
                         )
                    THEN 1
                    ELSE 0
                END
            ),
            0
        ) AS goles_visitante
    INTO v_goles_local, v_goles_visitante
    FROM public.h_partido_eventos e
    WHERE e.id_partido = v_id_partido;

    SELECT nombre_equipo INTO v_nombre_local
    FROM public.dim_equipo
    WHERE id_equipo = v_local;

    SELECT nombre_equipo INTO v_nombre_visitante
    FROM public.dim_equipo
    WHERE id_equipo = v_visitante;

    IF v_goles_local > v_goles_visitante THEN
        v_ganador := COALESCE(v_nombre_local, v_local::text);
    ELSIF v_goles_visitante > v_goles_local THEN
        v_ganador := COALESCE(v_nombre_visitante, v_visitante::text);
    ELSE
        v_ganador := 'Empate';
    END IF;

    UPDATE public.dim_partidos
       SET goles_local = v_goles_local,
           goles_visitante = v_goles_visitante,
           ganador = v_ganador,
           status = 'Completado'
     WHERE id_partido = v_id_partido;

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.fn_actualizar_dim_partido_desde_eventos() OWNER TO postgres;

--
-- TOC entry 263 (class 1255 OID 41758)
-- Name: fn_recalcular_h_equipo_temporada_jornada(integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_recalcular_h_equipo_temporada_jornada(p_temporada integer, p_jornada integer) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    WITH partidos_hasta_jornada AS (
        SELECT
            d.id_partido,
            d.temporada,
            t.jornada,
            d.id_local,
            d.id_visitante,
            COALESCE(d.goles_local, 0) AS goles_local,
            COALESCE(d.goles_visitante, 0) AS goles_visitante
        FROM public.dim_partidos d
        JOIN public.dim_tiempo t
          ON t.id_tiempo = d.id_tiempo
        WHERE d.temporada = p_temporada
          AND t.jornada <= p_jornada
          AND d.status = 'Completado'
    ),
    equipos_temporada AS (
        SELECT DISTINCT id_local AS id_equipo
        FROM public.dim_partidos
        WHERE temporada = p_temporada
        UNION
        SELECT DISTINCT id_visitante AS id_equipo
        FROM public.dim_partidos
        WHERE temporada = p_temporada
    ),
    filas_local AS (
        SELECT
            p.id_local AS id_equipo,
            1 AS partidos_jugados,
            CASE WHEN p.goles_local > p.goles_visitante THEN 1 ELSE 0 END AS victorias,
            CASE WHEN p.goles_local = p.goles_visitante THEN 1 ELSE 0 END AS empates,
            CASE WHEN p.goles_local < p.goles_visitante THEN 1 ELSE 0 END AS derrotas,
            p.goles_local AS gf,
            p.goles_visitante AS gc,
            1 AS partidos_jugados_local,
            CASE WHEN p.goles_local > p.goles_visitante THEN 1 ELSE 0 END AS victorias_local,
            CASE WHEN p.goles_local = p.goles_visitante THEN 1 ELSE 0 END AS empates_local,
            CASE WHEN p.goles_local < p.goles_visitante THEN 1 ELSE 0 END AS derrotas_local,
            p.goles_local AS gf_local,
            p.goles_visitante AS gc_local,
            0 AS partidos_jugados_visitante,
            0 AS victorias_visitante,
            0 AS empates_visitante,
            0 AS derrotas_visitante,
            0 AS gf_visitante,
            0 AS gc_visitante,
            CASE
                WHEN p.goles_local > p.goles_visitante THEN 3
                WHEN p.goles_local = p.goles_visitante THEN 1
                ELSE 0
            END AS puntos
        FROM partidos_hasta_jornada p
    ),
    filas_visitante AS (
        SELECT
            p.id_visitante AS id_equipo,
            1 AS partidos_jugados,
            CASE WHEN p.goles_visitante > p.goles_local THEN 1 ELSE 0 END AS victorias,
            CASE WHEN p.goles_visitante = p.goles_local THEN 1 ELSE 0 END AS empates,
            CASE WHEN p.goles_visitante < p.goles_local THEN 1 ELSE 0 END AS derrotas,
            p.goles_visitante AS gf,
            p.goles_local AS gc,
            0 AS partidos_jugados_local,
            0 AS victorias_local,
            0 AS empates_local,
            0 AS derrotas_local,
            0 AS gf_local,
            0 AS gc_local,
            1 AS partidos_jugados_visitante,
            CASE WHEN p.goles_visitante > p.goles_local THEN 1 ELSE 0 END AS victorias_visitante,
            CASE WHEN p.goles_visitante = p.goles_local THEN 1 ELSE 0 END AS empates_visitante,
            CASE WHEN p.goles_visitante < p.goles_local THEN 1 ELSE 0 END AS derrotas_visitante,
            p.goles_visitante AS gf_visitante,
            p.goles_local AS gc_visitante,
            CASE
                WHEN p.goles_visitante > p.goles_local THEN 3
                WHEN p.goles_visitante = p.goles_local THEN 1
                ELSE 0
            END AS puntos
        FROM partidos_hasta_jornada p
    ),
    acumulado AS (
        SELECT * FROM filas_local
        UNION ALL
        SELECT * FROM filas_visitante
    ),
    stats_equipo AS (
        SELECT
            e.id_equipo,
            COALESCE(SUM(a.puntos), 0) AS puntos,
            COALESCE(SUM(a.partidos_jugados), 0) AS partidos_jugados,
            COALESCE(SUM(a.victorias), 0) AS victorias,
            COALESCE(SUM(a.empates), 0) AS empates,
            COALESCE(SUM(a.derrotas), 0) AS derrotas,
            COALESCE(SUM(a.gf), 0) AS gf,
            COALESCE(SUM(a.gc), 0) AS gc,
            COALESCE(SUM(a.partidos_jugados_local), 0) AS partidos_jugados_local,
            COALESCE(SUM(a.victorias_local), 0) AS victorias_local,
            COALESCE(SUM(a.empates_local), 0) AS empates_local,
            COALESCE(SUM(a.derrotas_local), 0) AS derrotas_local,
            COALESCE(SUM(a.gf_local), 0) AS gf_local,
            COALESCE(SUM(a.gc_local), 0) AS gc_local,
            COALESCE(SUM(a.partidos_jugados_visitante), 0) AS partidos_jugados_visitante,
            COALESCE(SUM(a.victorias_visitante), 0) AS victorias_visitante,
            COALESCE(SUM(a.empates_visitante), 0) AS empates_visitante,
            COALESCE(SUM(a.derrotas_visitante), 0) AS derrotas_visitante,
            COALESCE(SUM(a.gf_visitante), 0) AS gf_visitante,
            COALESCE(SUM(a.gc_visitante), 0) AS gc_visitante
        FROM equipos_temporada e
        LEFT JOIN acumulado a
          ON a.id_equipo = e.id_equipo
        GROUP BY e.id_equipo
    ),
    resultados_equipo AS (
        SELECT
            p.id_local AS id_equipo,
            p.jornada,
            p.id_partido,
            CASE
                WHEN p.goles_local > p.goles_visitante THEN 'W'
                WHEN p.goles_local = p.goles_visitante THEN 'D'
                ELSE 'L'
            END AS resultado
        FROM partidos_hasta_jornada p
        UNION ALL
        SELECT
            p.id_visitante AS id_equipo,
            p.jornada,
            p.id_partido,
            CASE
                WHEN p.goles_visitante > p.goles_local THEN 'W'
                WHEN p.goles_visitante = p.goles_local THEN 'D'
                ELSE 'L'
            END AS resultado
        FROM partidos_hasta_jornada p
    ),
    forma_top5 AS (
        SELECT
            r.id_equipo,
            STRING_AGG(r.resultado, '' ORDER BY r.jornada DESC, r.id_partido DESC) AS forma
        FROM (
            SELECT
                re.*,
                ROW_NUMBER() OVER (
                    PARTITION BY re.id_equipo
                    ORDER BY re.jornada DESC, re.id_partido DESC
                ) AS rn
            FROM resultados_equipo re
        ) r
        WHERE r.rn <= 5
        GROUP BY r.id_equipo
    ),
    clasificacion AS (
        SELECT
            s.id_equipo,
            p_temporada AS temporada,
            p_jornada AS jornada,
            ROW_NUMBER() OVER (
                ORDER BY s.puntos DESC, (s.gf - s.gc) DESC, s.gf DESC, s.id_equipo ASC
            ) AS posicion,
            de.nombre_equipo,
            s.puntos,
            (s.gf - s.gc) AS dg,
            COALESCE(f.forma, '') AS forma,
            s.partidos_jugados,
            s.victorias,
            s.empates,
            s.derrotas,
            s.gf,
            s.gc,
            s.partidos_jugados_local,
            s.victorias_local,
            s.empates_local,
            s.derrotas_local,
            s.gf_local,
            s.gc_local,
            s.partidos_jugados_visitante,
            s.victorias_visitante,
            s.empates_visitante,
            s.derrotas_visitante,
            s.gf_visitante,
            s.gc_visitante
        FROM stats_equipo s
        LEFT JOIN forma_top5 f
          ON f.id_equipo = s.id_equipo
        LEFT JOIN public.dim_equipo de
          ON de.id_equipo = s.id_equipo
    )
    INSERT INTO public.h_equipo_temporada (
        id_equipo,
        temporada,
        jornada,
        posicion,
        nombre_equipo,
        puntos,
        dg,
        forma,
        partidos_jugados,
        victorias,
        empates,
        derrotas,
        gf,
        gc,
        partidos_jugados_local,
        victorias_local,
        empates_local,
        derrotas_local,
        gf_local,
        gc_local,
        partidos_jugados_visitante,
        victorias_visitante,
        empates_visitante,
        derrotas_visitante,
        gf_visitante,
        gc_visitante
    )
    SELECT
        c.id_equipo,
        c.temporada,
        c.jornada,
        c.posicion,
        c.nombre_equipo,
        c.puntos,
        c.dg,
        c.forma,
        c.partidos_jugados,
        c.victorias,
        c.empates,
        c.derrotas,
        c.gf,
        c.gc,
        c.partidos_jugados_local,
        c.victorias_local,
        c.empates_local,
        c.derrotas_local,
        c.gf_local,
        c.gc_local,
        c.partidos_jugados_visitante,
        c.victorias_visitante,
        c.empates_visitante,
        c.derrotas_visitante,
        c.gf_visitante,
        c.gc_visitante
    FROM clasificacion c
    ON CONFLICT (id_equipo, temporada, jornada)
    DO UPDATE SET
        posicion = EXCLUDED.posicion,
        nombre_equipo = EXCLUDED.nombre_equipo,
        puntos = EXCLUDED.puntos,
        dg = EXCLUDED.dg,
        forma = EXCLUDED.forma,
        partidos_jugados = EXCLUDED.partidos_jugados,
        victorias = EXCLUDED.victorias,
        empates = EXCLUDED.empates,
        derrotas = EXCLUDED.derrotas,
        gf = EXCLUDED.gf,
        gc = EXCLUDED.gc,
        partidos_jugados_local = EXCLUDED.partidos_jugados_local,
        victorias_local = EXCLUDED.victorias_local,
        empates_local = EXCLUDED.empates_local,
        derrotas_local = EXCLUDED.derrotas_local,
        gf_local = EXCLUDED.gf_local,
        gc_local = EXCLUDED.gc_local,
        partidos_jugados_visitante = EXCLUDED.partidos_jugados_visitante,
        victorias_visitante = EXCLUDED.victorias_visitante,
        empates_visitante = EXCLUDED.empates_visitante,
        derrotas_visitante = EXCLUDED.derrotas_visitante,
        gf_visitante = EXCLUDED.gf_visitante,
        gc_visitante = EXCLUDED.gc_visitante;
END;
$$;


ALTER FUNCTION public.fn_recalcular_h_equipo_temporada_jornada(p_temporada integer, p_jornada integer) OWNER TO postgres;

--
-- TOC entry 264 (class 1255 OID 41760)
-- Name: fn_trigger_recalcular_h_equipo_temporada(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_trigger_recalcular_h_equipo_temporada() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_temporada integer;
    v_jornada integer;
    v_j integer;
BEGIN
    IF NEW.id_tiempo IS NULL OR NEW.temporada IS NULL THEN
        RETURN NEW;
    END IF;

    IF NEW.status <> 'Completado' THEN
        RETURN NEW;
    END IF;

    IF TG_OP = 'UPDATE'
       AND OLD.status = NEW.status
       AND COALESCE(OLD.goles_local, -9999) = COALESCE(NEW.goles_local, -9999)
       AND COALESCE(OLD.goles_visitante, -9999) = COALESCE(NEW.goles_visitante, -9999)
       AND COALESCE(OLD.ganador, '') = COALESCE(NEW.ganador, '') THEN
        RETURN NEW;
    END IF;

    v_temporada := NEW.temporada;

    SELECT t.jornada
      INTO v_jornada
      FROM public.dim_tiempo t
     WHERE t.id_tiempo = NEW.id_tiempo;

    IF v_jornada IS NULL THEN
        RETURN NEW;
    END IF;

    FOR v_j IN
        SELECT DISTINCT t2.jornada
        FROM public.dim_partidos d2
        JOIN public.dim_tiempo t2
          ON t2.id_tiempo = d2.id_tiempo
        WHERE d2.temporada = v_temporada
          AND t2.jornada >= v_jornada
        ORDER BY t2.jornada
    LOOP
        PERFORM public.fn_recalcular_h_equipo_temporada_jornada(v_temporada, v_j);
    END LOOP;

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.fn_trigger_recalcular_h_equipo_temporada() OWNER TO postgres;

--
-- TOC entry 261 (class 1255 OID 41755)
-- Name: restar_estadisticas_temporada(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.restar_estadisticas_temporada() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_temporada integer;
    v_partidos_restantes integer;
BEGIN
    -- 1. Identificar la temporada del partido que se está borrando (usamos OLD)
    SELECT temporada INTO v_temporada 
    FROM public.dim_partidos 
    WHERE id_partido = OLD.id_partido;

    -- 2. Restar los valores cuantitativos
    UPDATE public.h_jugador_temporada
    SET 
        partidos = partidos - 1,
        minutos = minutos - OLD.minutos,
        titular = titular - (CASE WHEN OLD.sustituto = FALSE THEN 1 ELSE 0 END),
        goles = goles - OLD.goles,
        asistencias = asistencias - OLD.asistencias,
        tiros_totales = tiros_totales - OLD.tiros_totales,
        tiros_a_puerta = tiros_a_puerta - OLD.tiros_a_puerta,
        pases_totales = pases_totales - OLD.pases_totales,
        pases_clave = pases_clave - OLD.pases_clave,
        entradas = entradas - OLD.entradas,
        bloqueos = bloqueos - OLD.bloqueos,
        intercepciones = intercepciones - OLD.intercepciones,
        duelos_totales = duelos_totales - OLD.duelos_totales,
        duelos_ganados = duelos_ganados - OLD.duelos_ganados,
        faltas_sufridas = faltas_sufridas - OLD.faltas_recibidas,
        faltas_cometidas = faltas_cometidas - OLD.faltas_cometidas,
        regates_intentados = regates_intentados - OLD.regates_intentados,
        regates_exito = regates_exito - OLD.regates,
        regateado = regateado - OLD.regateado,
        amarillas = amarillas - OLD.amarilla,
        rojas = rojas - OLD.roja,
        penaltis_marcados = penaltis_marcados - OLD.penaltis_marcados,
        goles_concedidos = goles_concedidos - OLD.goles_concedidos,
        paradas = paradas - OLD.paradas,
        penaltis_parados = penaltis_parados - OLD.penaltis_parados
    WHERE id_jugador = OLD.id_jugador 
      AND id_equipo = OLD.id_equipo 
      AND temporada = v_temporada;

    -- 3. RECALCULAR NOTA MEDIA (El campo calculado independiente)
    -- Lo hacemos después de restar para que tome el promedio de lo que queda en la tabla
    UPDATE public.h_jugador_temporada
    SET nota_media = (
        SELECT COALESCE(AVG(h.nota), 0) -- Si no quedan partidos, la nota es 0
        FROM public.h_jugador_partido h
        JOIN public.dim_partidos p ON h.id_partido = p.id_partido
        WHERE h.id_jugador = OLD.id_jugador 
          AND h.id_equipo = OLD.id_equipo 
          AND p.temporada = v_temporada
    )
    WHERE id_jugador = OLD.id_jugador 
      AND id_equipo = OLD.id_equipo 
      AND temporada = v_temporada
    RETURNING partidos INTO v_partidos_restantes;

    -- 4. LIMPIEZA: Si el jugador ya no tiene partidos en esa temporada, borramos la fila
    IF v_partidos_restantes <= 0 THEN
        DELETE FROM public.h_jugador_temporada 
        WHERE id_jugador = OLD.id_jugador 
          AND id_equipo = OLD.id_equipo 
          AND temporada = v_temporada;
    END IF;

    RETURN OLD;
END;
$$;


ALTER FUNCTION public.restar_estadisticas_temporada() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 227 (class 1259 OID 41535)
-- Name: dim_equipo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dim_equipo (
    id_equipo integer NOT NULL,
    nombre_equipo character varying(100) NOT NULL,
    codigo character varying(10),
    pais character varying(50),
    fundado_en integer,
    logo text,
    estadio character varying(100),
    direccion character varying(255),
    ciudad character varying(100),
    capacidad integer
);


ALTER TABLE public.dim_equipo OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 41542)
-- Name: dim_jugador; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dim_jugador (
    id_jugador integer NOT NULL,
    nombre character varying(100),
    nombre_completo character varying(200),
    edad integer,
    fecha_nacimiento date,
    lugar_nacimiento character varying(100),
    pais_nacimiento character varying(100),
    nacionalidad character varying(100),
    altura integer,
    peso integer,
    foto text
);


ALTER TABLE public.dim_jugador OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 41548)
-- Name: dim_partidos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dim_partidos (
    id_partido integer CONSTRAINT dim_partido_id_partido_not_null NOT NULL,
    id_tiempo integer,
    hora time without time zone,
    arbitro character varying(100),
    estadio character varying(100),
    temporada integer,
    id_local integer,
    id_visitante integer,
    ganador character varying(100),
    goles_local integer,
    goles_visitante integer,
    status character varying(50)
);


ALTER TABLE public.dim_partidos OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 41552)
-- Name: dim_tiempo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dim_tiempo (
    id_tiempo integer NOT NULL,
    anio integer,
    mes integer,
    nombre_mes character varying(20),
    dia integer,
    nombre_dia character varying(20),
    jornada integer
);


ALTER TABLE public.dim_tiempo OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 41556)
-- Name: dim_usuario; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dim_usuario (
    id_usuario integer NOT NULL,
    nombre_usuario character varying(50) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash text NOT NULL,
    fecha_registro timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.dim_usuario OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 41566)
-- Name: dim_usuario_id_usuario_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.dim_usuario_id_usuario_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.dim_usuario_id_usuario_seq OWNER TO postgres;

--
-- TOC entry 5195 (class 0 OID 0)
-- Dependencies: 232
-- Name: dim_usuario_id_usuario_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.dim_usuario_id_usuario_seq OWNED BY public.dim_usuario.id_usuario;


--
-- TOC entry 247 (class 1259 OID 49522)
-- Name: dm_estado_forma_equipos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dm_estado_forma_equipos (
    id_equipo integer NOT NULL,
    nombre_equipo character varying(150),
    puntuacion_forma numeric(5,2),
    estado character varying(50),
    tendencia numeric(6,2),
    variabilidad numeric(6,2)
);


ALTER TABLE public.dm_estado_forma_equipos OWNER TO postgres;

--
-- TOC entry 246 (class 1259 OID 49516)
-- Name: dm_estado_forma_jugadores; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dm_estado_forma_jugadores (
    id_jugador integer NOT NULL,
    nombre_jugador character varying(150),
    id_equipo integer,
    estado character varying(50),
    score_temporada numeric(6,2),
    score_reciente numeric(6,2),
    evolucion numeric(6,2)
);


ALTER TABLE public.dm_estado_forma_jugadores OWNER TO postgres;

--
-- TOC entry 245 (class 1259 OID 49508)
-- Name: dm_necesidades_plantilla; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dm_necesidades_plantilla (
    id_equipo integer NOT NULL,
    temporada integer NOT NULL,
    necesidad character varying(100) NOT NULL,
    motivo character varying(300)
);


ALTER TABLE public.dm_necesidades_plantilla OWNER TO postgres;

--
-- TOC entry 244 (class 1259 OID 49502)
-- Name: dm_prediccion_partidos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dm_prediccion_partidos (
    id_partido bigint NOT NULL,
    fecha date,
    id_local integer,
    nombre_local character varying(100),
    id_visitante integer,
    nombre_visitante character varying(100),
    prob_victoria_local numeric(5,2),
    prob_empate numeric(5,2),
    prob_victoria_visitante numeric(5,2),
    prediccion character varying(50)
);


ALTER TABLE public.dm_prediccion_partidos OWNER TO postgres;

--
-- TOC entry 243 (class 1259 OID 49494)
-- Name: dm_probables_goleadores; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dm_probables_goleadores (
    id_partido bigint NOT NULL,
    id_equipo integer NOT NULL,
    id_jugador integer NOT NULL,
    nombre_jugador character varying(150),
    probabilidad numeric(5,3)
);


ALTER TABLE public.dm_probables_goleadores OWNER TO postgres;

--
-- TOC entry 248 (class 1259 OID 49528)
-- Name: dm_similitud_jugadores; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dm_similitud_jugadores (
    id_jugador integer NOT NULL,
    temporada integer NOT NULL,
    nombre character varying(150),
    posicion character varying(50),
    cluster integer,
    id_similar1 integer,
    nombre_similar1 character varying(150),
    similitud1 numeric(8,4),
    id_similar2 integer,
    nombre_similar2 character varying(150),
    similitud2 numeric(8,4),
    id_similar3 integer,
    nombre_similar3 character varying(150),
    similitud3 numeric(8,4),
    id_similar4 integer,
    nombre_similar4 character varying(150),
    similitud4 numeric(8,4),
    id_similar5 integer,
    nombre_similar5 character varying(150),
    similitud5 numeric(8,4)
);


ALTER TABLE public.dm_similitud_jugadores OWNER TO postgres;

--
-- TOC entry 242 (class 1259 OID 49488)
-- Name: dm_simulacion_montecarlo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dm_simulacion_montecarlo (
    id_equipo integer NOT NULL,
    equipo character varying(150),
    campeon_pct numeric(5,2),
    champions_pct numeric(5,2),
    europa_pct numeric(5,2),
    media_tabla_pct numeric(5,2),
    descenso_pct numeric(5,2)
);


ALTER TABLE public.dm_simulacion_montecarlo OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 41567)
-- Name: h_equipo_partido; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.h_equipo_partido (
    id_partido integer NOT NULL,
    id_equipo integer NOT NULL,
    tiros_a_puerta integer,
    tiros_totales integer,
    tiros_en_area integer,
    tiros_fuera_area integer,
    faltas_cometidas integer,
    corners integer,
    fueras_de_juego integer,
    posesion integer,
    tarjetas_amarillas integer,
    tarjetas_rojas integer,
    paradas integer,
    pases_totales integer,
    pases_acertados integer,
    pct_pases_acertados numeric(5,2),
    goles_esperados numeric(5,2),
    df_goles_esperados numeric(5,2)
);


ALTER TABLE public.h_equipo_partido OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 41572)
-- Name: h_equipo_temporada; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.h_equipo_temporada (
    id_equipo integer NOT NULL,
    temporada integer NOT NULL,
    jornada integer NOT NULL,
    posicion integer,
    nombre_equipo character varying(100),
    puntos integer,
    dg integer,
    forma character varying(10),
    partidos_jugados integer,
    victorias integer,
    empates integer,
    derrotas integer,
    gf integer,
    gc integer,
    partidos_jugados_local integer,
    victorias_local integer,
    empates_local integer,
    derrotas_local integer,
    gf_local integer,
    gc_local integer,
    partidos_jugados_visitante integer,
    victorias_visitante integer,
    empates_visitante integer,
    derrotas_visitante integer,
    gf_visitante integer,
    gc_visitante integer
);


ALTER TABLE public.h_equipo_temporada OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 41578)
-- Name: h_jugador_partido; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.h_jugador_partido (
    id_partido integer NOT NULL,
    id_jugador integer NOT NULL,
    id_equipo integer,
    posicion character varying(10),
    minutos integer,
    nota numeric(4,2),
    capitan boolean,
    sustituto boolean,
    goles integer DEFAULT 0,
    penaltis_marcados integer DEFAULT 0,
    asistencias integer DEFAULT 0,
    paradas integer DEFAULT 0,
    goles_concedidos integer DEFAULT 0,
    tiros_totales integer DEFAULT 0,
    tiros_a_puerta integer DEFAULT 0,
    pases_totales integer DEFAULT 0,
    pases_clave integer DEFAULT 0,
    precision_pases integer DEFAULT 0,
    regates_intentados integer DEFAULT 0,
    regates integer DEFAULT 0,
    regateado integer DEFAULT 0,
    duelos_totales integer DEFAULT 0,
    duelos_ganados integer DEFAULT 0,
    faltas_cometidas integer DEFAULT 0,
    faltas_recibidas integer DEFAULT 0,
    entradas integer DEFAULT 0,
    bloqueos integer DEFAULT 0,
    intercepciones integer DEFAULT 0,
    amarilla integer DEFAULT 0,
    roja integer DEFAULT 0,
    penaltis_parados integer DEFAULT 0
);


ALTER TABLE public.h_jugador_partido OWNER TO postgres;

--
-- TOC entry 236 (class 1259 OID 41606)
-- Name: h_jugador_temporada; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.h_jugador_temporada (
    id_jugador integer NOT NULL,
    id_equipo integer NOT NULL,
    temporada integer NOT NULL,
    posicion character varying(50),
    partidos integer,
    minutos integer,
    titular integer,
    nota_media numeric(5,3),
    goles integer,
    asistencias integer,
    tiros_totales integer,
    tiros_a_puerta integer,
    pases_totales integer,
    pases_clave integer,
    precision_pases integer,
    entradas integer,
    bloqueos integer,
    intercepciones integer,
    duelos_totales integer,
    duelos_ganados integer,
    faltas_sufridas integer,
    faltas_cometidas integer,
    regates_intentados integer,
    regates_exito integer,
    regateado integer,
    amarillas integer,
    rojas integer,
    penaltis_marcados integer,
    goles_concedidos integer,
    paradas integer,
    penaltis_parados integer
);


ALTER TABLE public.h_jugador_temporada OWNER TO postgres;

--
-- TOC entry 241 (class 1259 OID 41795)
-- Name: h_jugadores_ratings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.h_jugadores_ratings (
    id_jugador integer NOT NULL,
    temporada integer NOT NULL,
    nombre text,
    ataque double precision,
    creacion double precision,
    defensa double precision,
    porteros double precision,
    duelos double precision,
    regates double precision,
    percentil_ataque double precision,
    percentil_creacion double precision,
    percentil_defensa double precision,
    percentil_porteros double precision,
    percentil_duelos double precision,
    percentil_regates double precision
);


ALTER TABLE public.h_jugadores_ratings OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 41612)
-- Name: h_partido_eventos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.h_partido_eventos (
    id_evento integer NOT NULL,
    id_partido integer,
    minuto integer,
    extra integer DEFAULT 0,
    id_equipo integer,
    id_jugador integer,
    id_asistente_o_sale integer,
    tipo character varying(50),
    detalle character varying(100),
    comentarios text
);


ALTER TABLE public.h_partido_eventos OWNER TO postgres;

--
-- TOC entry 238 (class 1259 OID 41619)
-- Name: h_partido_eventos_id_evento_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.h_partido_eventos_id_evento_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.h_partido_eventos_id_evento_seq OWNER TO postgres;

--
-- TOC entry 5196 (class 0 OID 0)
-- Dependencies: 238
-- Name: h_partido_eventos_id_evento_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.h_partido_eventos_id_evento_seq OWNED BY public.h_partido_eventos.id_evento;


--
-- TOC entry 239 (class 1259 OID 41620)
-- Name: h_usuario_favoritos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.h_usuario_favoritos (
    id_favorito integer NOT NULL,
    id_usuario integer NOT NULL,
    id_equipo integer,
    id_jugador integer,
    fecha_agregado timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_favorito_not_empty CHECK (((id_equipo IS NOT NULL) OR (id_jugador IS NOT NULL)))
);


ALTER TABLE public.h_usuario_favoritos OWNER TO postgres;

--
-- TOC entry 240 (class 1259 OID 41627)
-- Name: h_usuario_favoritos_id_favorito_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.h_usuario_favoritos_id_favorito_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.h_usuario_favoritos_id_favorito_seq OWNER TO postgres;

--
-- TOC entry 5197 (class 0 OID 0)
-- Dependencies: 240
-- Name: h_usuario_favoritos_id_favorito_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.h_usuario_favoritos_id_favorito_seq OWNED BY public.h_usuario_favoritos.id_favorito;


--
-- TOC entry 4943 (class 2604 OID 41628)
-- Name: dim_usuario id_usuario; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dim_usuario ALTER COLUMN id_usuario SET DEFAULT nextval('public.dim_usuario_id_usuario_seq'::regclass);


--
-- TOC entry 4968 (class 2604 OID 41629)
-- Name: h_partido_eventos id_evento; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.h_partido_eventos ALTER COLUMN id_evento SET DEFAULT nextval('public.h_partido_eventos_id_evento_seq'::regclass);


--
-- TOC entry 4970 (class 2604 OID 41630)
-- Name: h_usuario_favoritos id_favorito; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.h_usuario_favoritos ALTER COLUMN id_favorito SET DEFAULT nextval('public.h_usuario_favoritos_id_favorito_seq'::regclass);


--
-- TOC entry 4974 (class 2606 OID 41632)
-- Name: dim_equipo dim_equipo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dim_equipo
    ADD CONSTRAINT dim_equipo_pkey PRIMARY KEY (id_equipo);


--
-- TOC entry 4976 (class 2606 OID 41634)
-- Name: dim_jugador dim_jugador_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dim_jugador
    ADD CONSTRAINT dim_jugador_pkey PRIMARY KEY (id_jugador);


--
-- TOC entry 4978 (class 2606 OID 41636)
-- Name: dim_partidos dim_partido_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dim_partidos
    ADD CONSTRAINT dim_partido_pkey PRIMARY KEY (id_partido);


--
-- TOC entry 4982 (class 2606 OID 41638)
-- Name: dim_tiempo dim_tiempo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dim_tiempo
    ADD CONSTRAINT dim_tiempo_pkey PRIMARY KEY (id_tiempo);


--
-- TOC entry 4984 (class 2606 OID 41640)
-- Name: dim_usuario dim_usuario_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dim_usuario
    ADD CONSTRAINT dim_usuario_email_key UNIQUE (email);


--
-- TOC entry 4986 (class 2606 OID 41642)
-- Name: dim_usuario dim_usuario_nombre_usuario_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dim_usuario
    ADD CONSTRAINT dim_usuario_nombre_usuario_key UNIQUE (nombre_usuario);


--
-- TOC entry 4988 (class 2606 OID 41644)
-- Name: dim_usuario dim_usuario_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dim_usuario
    ADD CONSTRAINT dim_usuario_pkey PRIMARY KEY (id_usuario);


--
-- TOC entry 5019 (class 2606 OID 49527)
-- Name: dm_estado_forma_equipos dm_estado_forma_equipos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dm_estado_forma_equipos
    ADD CONSTRAINT dm_estado_forma_equipos_pkey PRIMARY KEY (id_equipo);


--
-- TOC entry 5017 (class 2606 OID 49521)
-- Name: dm_estado_forma_jugadores dm_estado_forma_jugadores_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dm_estado_forma_jugadores
    ADD CONSTRAINT dm_estado_forma_jugadores_pkey PRIMARY KEY (id_jugador);


--
-- TOC entry 5015 (class 2606 OID 49551)
-- Name: dm_necesidades_plantilla dm_necesidades_plantilla_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dm_necesidades_plantilla
    ADD CONSTRAINT dm_necesidades_plantilla_pkey PRIMARY KEY (id_equipo, temporada, necesidad);


--
-- TOC entry 5013 (class 2606 OID 49507)
-- Name: dm_prediccion_partidos dm_prediccion_partidos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dm_prediccion_partidos
    ADD CONSTRAINT dm_prediccion_partidos_pkey PRIMARY KEY (id_partido);


--
-- TOC entry 5011 (class 2606 OID 49501)
-- Name: dm_probables_goleadores dm_probables_goleadores_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dm_probables_goleadores
    ADD CONSTRAINT dm_probables_goleadores_pkey PRIMARY KEY (id_partido, id_jugador);


--
-- TOC entry 5021 (class 2606 OID 49536)
-- Name: dm_similitud_jugadores dm_similitud_jugadores_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dm_similitud_jugadores
    ADD CONSTRAINT dm_similitud_jugadores_pkey PRIMARY KEY (id_jugador, temporada);


--
-- TOC entry 5009 (class 2606 OID 49493)
-- Name: dm_simulacion_montecarlo dm_simulacion_montecarlo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dm_simulacion_montecarlo
    ADD CONSTRAINT dm_simulacion_montecarlo_pkey PRIMARY KEY (id_equipo);


--
-- TOC entry 4991 (class 2606 OID 41646)
-- Name: h_equipo_partido h_equipo_partido_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.h_equipo_partido
    ADD CONSTRAINT h_equipo_partido_pkey PRIMARY KEY (id_partido, id_equipo);


--
-- TOC entry 4993 (class 2606 OID 41648)
-- Name: h_equipo_temporada h_equipo_temporada_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.h_equipo_temporada
    ADD CONSTRAINT h_equipo_temporada_pkey PRIMARY KEY (id_equipo, temporada, jornada);


--
-- TOC entry 4995 (class 2606 OID 41650)
-- Name: h_jugador_partido h_jugador_partido_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.h_jugador_partido
    ADD CONSTRAINT h_jugador_partido_pkey PRIMARY KEY (id_partido, id_jugador);


--
-- TOC entry 4997 (class 2606 OID 41652)
-- Name: h_jugador_temporada h_jugador_temporada_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.h_jugador_temporada
    ADD CONSTRAINT h_jugador_temporada_pkey PRIMARY KEY (id_jugador, id_equipo, temporada);


--
-- TOC entry 5007 (class 2606 OID 41803)
-- Name: h_jugadores_ratings h_jugadores_ratings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.h_jugadores_ratings
    ADD CONSTRAINT h_jugadores_ratings_pkey PRIMARY KEY (id_jugador, temporada);


--
-- TOC entry 4999 (class 2606 OID 41654)
-- Name: h_partido_eventos h_partido_eventos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.h_partido_eventos
    ADD CONSTRAINT h_partido_eventos_pkey PRIMARY KEY (id_evento);


--
-- TOC entry 5002 (class 2606 OID 41656)
-- Name: h_usuario_favoritos h_usuario_favoritos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.h_usuario_favoritos
    ADD CONSTRAINT h_usuario_favoritos_pkey PRIMARY KEY (id_favorito);


--
-- TOC entry 5000 (class 1259 OID 41657)
-- Name: idx_eventos_partido; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_eventos_partido ON public.h_partido_eventos USING btree (id_partido);


--
-- TOC entry 5003 (class 1259 OID 41658)
-- Name: idx_favoritos_equipo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_favoritos_equipo ON public.h_usuario_favoritos USING btree (id_equipo) WHERE (id_equipo IS NOT NULL);


--
-- TOC entry 5004 (class 1259 OID 41659)
-- Name: idx_favoritos_jugador; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_favoritos_jugador ON public.h_usuario_favoritos USING btree (id_jugador) WHERE (id_jugador IS NOT NULL);


--
-- TOC entry 5005 (class 1259 OID 41660)
-- Name: idx_favoritos_usuario; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_favoritos_usuario ON public.h_usuario_favoritos USING btree (id_usuario);


--
-- TOC entry 4979 (class 1259 OID 41661)
-- Name: idx_partido_equipos; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_partido_equipos ON public.dim_partidos USING btree (id_local, id_visitante);


--
-- TOC entry 4980 (class 1259 OID 41662)
-- Name: idx_partido_tiempo; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_partido_tiempo ON public.dim_partidos USING btree (id_tiempo);


--
-- TOC entry 4989 (class 1259 OID 41663)
-- Name: idx_usuario_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_usuario_email ON public.dim_usuario USING btree (email);


--
-- TOC entry 5042 (class 2620 OID 41757)
-- Name: h_partido_eventos trg_actualizar_dim_partido_desde_eventos; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_actualizar_dim_partido_desde_eventos AFTER INSERT ON public.h_partido_eventos FOR EACH ROW EXECUTE FUNCTION public.fn_actualizar_dim_partido_desde_eventos();


--
-- TOC entry 5040 (class 2620 OID 41754)
-- Name: h_jugador_partido trg_actualizar_temporada; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_actualizar_temporada AFTER INSERT ON public.h_jugador_partido FOR EACH ROW EXECUTE FUNCTION public.actualizar_estadisticas_temporada();


--
-- TOC entry 5039 (class 2620 OID 41761)
-- Name: dim_partidos trg_recalcular_h_equipo_temporada; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_recalcular_h_equipo_temporada AFTER UPDATE OF status, goles_local, goles_visitante, ganador ON public.dim_partidos FOR EACH ROW EXECUTE FUNCTION public.fn_trigger_recalcular_h_equipo_temporada();


--
-- TOC entry 5041 (class 2620 OID 41756)
-- Name: h_jugador_partido trg_restar_temporada; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_restar_temporada AFTER DELETE ON public.h_jugador_partido FOR EACH ROW EXECUTE FUNCTION public.restar_estadisticas_temporada();


--
-- TOC entry 5022 (class 2606 OID 41664)
-- Name: dim_partidos dim_partido_id_local_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dim_partidos
    ADD CONSTRAINT dim_partido_id_local_fkey FOREIGN KEY (id_local) REFERENCES public.dim_equipo(id_equipo);


--
-- TOC entry 5023 (class 2606 OID 41669)
-- Name: dim_partidos dim_partido_id_tiempo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dim_partidos
    ADD CONSTRAINT dim_partido_id_tiempo_fkey FOREIGN KEY (id_tiempo) REFERENCES public.dim_tiempo(id_tiempo);


--
-- TOC entry 5024 (class 2606 OID 41674)
-- Name: dim_partidos dim_partido_id_visitante_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dim_partidos
    ADD CONSTRAINT dim_partido_id_visitante_fkey FOREIGN KEY (id_visitante) REFERENCES public.dim_equipo(id_equipo);


--
-- TOC entry 5025 (class 2606 OID 41679)
-- Name: h_equipo_partido h_equipo_partido_id_equipo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.h_equipo_partido
    ADD CONSTRAINT h_equipo_partido_id_equipo_fkey FOREIGN KEY (id_equipo) REFERENCES public.dim_equipo(id_equipo);


--
-- TOC entry 5026 (class 2606 OID 41684)
-- Name: h_equipo_partido h_equipo_partido_id_partido_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.h_equipo_partido
    ADD CONSTRAINT h_equipo_partido_id_partido_fkey FOREIGN KEY (id_partido) REFERENCES public.dim_partidos(id_partido);


--
-- TOC entry 5027 (class 2606 OID 41689)
-- Name: h_equipo_temporada h_equipo_temporada_id_equipo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.h_equipo_temporada
    ADD CONSTRAINT h_equipo_temporada_id_equipo_fkey FOREIGN KEY (id_equipo) REFERENCES public.dim_equipo(id_equipo);


--
-- TOC entry 5028 (class 2606 OID 41694)
-- Name: h_jugador_partido h_jugador_partido_id_equipo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.h_jugador_partido
    ADD CONSTRAINT h_jugador_partido_id_equipo_fkey FOREIGN KEY (id_equipo) REFERENCES public.dim_equipo(id_equipo);


--
-- TOC entry 5029 (class 2606 OID 41699)
-- Name: h_jugador_partido h_jugador_partido_id_jugador_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.h_jugador_partido
    ADD CONSTRAINT h_jugador_partido_id_jugador_fkey FOREIGN KEY (id_jugador) REFERENCES public.dim_jugador(id_jugador);


--
-- TOC entry 5030 (class 2606 OID 41704)
-- Name: h_jugador_partido h_jugador_partido_id_partido_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.h_jugador_partido
    ADD CONSTRAINT h_jugador_partido_id_partido_fkey FOREIGN KEY (id_partido) REFERENCES public.dim_partidos(id_partido);


--
-- TOC entry 5031 (class 2606 OID 41709)
-- Name: h_jugador_temporada h_jugador_temporada_id_equipo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.h_jugador_temporada
    ADD CONSTRAINT h_jugador_temporada_id_equipo_fkey FOREIGN KEY (id_equipo) REFERENCES public.dim_equipo(id_equipo);


--
-- TOC entry 5032 (class 2606 OID 41714)
-- Name: h_jugador_temporada h_jugador_temporada_id_jugador_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.h_jugador_temporada
    ADD CONSTRAINT h_jugador_temporada_id_jugador_fkey FOREIGN KEY (id_jugador) REFERENCES public.dim_jugador(id_jugador);


--
-- TOC entry 5033 (class 2606 OID 41719)
-- Name: h_partido_eventos h_partido_eventos_id_equipo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.h_partido_eventos
    ADD CONSTRAINT h_partido_eventos_id_equipo_fkey FOREIGN KEY (id_equipo) REFERENCES public.dim_equipo(id_equipo);


--
-- TOC entry 5034 (class 2606 OID 41724)
-- Name: h_partido_eventos h_partido_eventos_id_jugador_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.h_partido_eventos
    ADD CONSTRAINT h_partido_eventos_id_jugador_fkey FOREIGN KEY (id_jugador) REFERENCES public.dim_jugador(id_jugador);


--
-- TOC entry 5035 (class 2606 OID 41729)
-- Name: h_partido_eventos h_partido_eventos_id_partido_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.h_partido_eventos
    ADD CONSTRAINT h_partido_eventos_id_partido_fkey FOREIGN KEY (id_partido) REFERENCES public.dim_partidos(id_partido);


--
-- TOC entry 5036 (class 2606 OID 41734)
-- Name: h_usuario_favoritos h_usuario_favoritos_id_equipo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.h_usuario_favoritos
    ADD CONSTRAINT h_usuario_favoritos_id_equipo_fkey FOREIGN KEY (id_equipo) REFERENCES public.dim_equipo(id_equipo) ON DELETE CASCADE;


--
-- TOC entry 5037 (class 2606 OID 41739)
-- Name: h_usuario_favoritos h_usuario_favoritos_id_jugador_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.h_usuario_favoritos
    ADD CONSTRAINT h_usuario_favoritos_id_jugador_fkey FOREIGN KEY (id_jugador) REFERENCES public.dim_jugador(id_jugador) ON DELETE CASCADE;


--
-- TOC entry 5038 (class 2606 OID 41744)
-- Name: h_usuario_favoritos h_usuario_favoritos_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.h_usuario_favoritos
    ADD CONSTRAINT h_usuario_favoritos_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.dim_usuario(id_usuario) ON DELETE CASCADE;


-- Completed on 2026-07-06 18:39:30

--
-- PostgreSQL database dump complete
--

\unrestrict Hp2h3TzyeTHGT2Dm4Rmpc1Yf1u5ovlPf4H8CFORv5BCjpway5SRZug1HoSdTKIn

