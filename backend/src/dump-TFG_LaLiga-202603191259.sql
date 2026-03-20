--
-- PostgreSQL database dump
--

\restrict PiregmQmLTkzt84a2gmguTXPnrFFCP7xIuCDBsAWX7BVSbRRLQFMYQHSmj9xCaQ

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

-- Started on 2026-03-19 12:59:04

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 219 (class 1259 OID 32769)
-- Name: dim_equipo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dim_equipo (
    id_equipo integer NOT NULL,
    nombre_equipo character varying(100),
    codigo character varying(10),
    pais character varying(50),
    fundado_en integer,
    logo_url character varying(255),
    estadio character varying(100),
    direccion text,
    ciudad character varying(50),
    capacidad integer
);


ALTER TABLE public.dim_equipo OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 32777)
-- Name: dim_jugador; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dim_jugador (
    id_jugador integer NOT NULL,
    nombre character varying(100),
    edad integer,
    fecha_nacimiento date,
    lugar_nacimiento character varying(100),
    pais_nacimiento character varying(100),
    nacionalidad character varying(50),
    altura integer,
    peso integer,
    foto_url character varying(255)
);


ALTER TABLE public.dim_jugador OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 32791)
-- Name: dim_partidos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dim_partidos (
    id_partido integer NOT NULL,
    id_tiempo integer,
    fecha_hora time without time zone,
    arbitro character varying(100),
    estadio character varying(100),
    temporada integer,
    id_local integer,
    id_visitante integer,
    ganador character varying(50),
    goles_local integer,
    goles_visitante integer
);


ALTER TABLE public.dim_partidos OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 32785)
-- Name: dim_tiempo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dim_tiempo (
    id_tiempo integer NOT NULL,
    anio integer,
    mes integer,
    nombre_mes character varying(15),
    dia integer,
    nombre_dia character varying(15),
    jornada integer
);


ALTER TABLE public.dim_tiempo OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 32907)
-- Name: dim_usuario; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dim_usuario (
    id_usuario integer NOT NULL,
    nombre_usuario character varying(50) NOT NULL,
    email character varying(100) NOT NULL,
    password_hash text NOT NULL,
    fecha_registro timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.dim_usuario OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 32906)
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
-- TOC entry 5095 (class 0 OID 0)
-- Dependencies: 229
-- Name: dim_usuario_id_usuario_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.dim_usuario_id_usuario_seq OWNED BY public.dim_usuario.id_usuario;


--
-- TOC entry 225 (class 1259 OID 32837)
-- Name: h_equipo_partido; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.h_equipo_partido (
    id_partido integer NOT NULL,
    id_equipo integer NOT NULL,
    tiros_a_puerta integer,
    tiros_totales integer,
    tiros_en_area integer,
    tiros_fuera_area integer,
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
-- TOC entry 227 (class 1259 OID 32876)
-- Name: h_equipo_temporada; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.h_equipo_temporada (
    id_equipo integer NOT NULL,
    temporada integer NOT NULL,
    posicion integer,
    nombre_equipo character varying(50),
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
-- TOC entry 226 (class 1259 OID 32854)
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
    goles integer,
    asistencias integer,
    paradas integer,
    goles_concedidos integer,
    tiros_totales integer,
    tiros_a_puerta integer,
    pases_totales integer,
    pases_clave integer,
    precision_pases numeric(5,2),
    regates_intentados integer,
    regates integer,
    faltas_cometidas integer,
    faltas_recibidas integer,
    entradas integer,
    bloqueos integer,
    intercepciones integer,
    amarilla integer,
    roja integer,
    penaltis_parados integer
);


ALTER TABLE public.h_jugador_partido OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 32888)
-- Name: h_jugador_temporada; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.h_jugador_temporada (
    id_jugador integer NOT NULL,
    id_equipo integer NOT NULL,
    temporada integer NOT NULL,
    posicion character varying(20),
    partidos integer,
    minutos integer,
    titular integer,
    nota_media numeric(4,2),
    goles integer,
    asistencias integer,
    tiros_totales integer,
    tiros_a_puerta integer,
    pases_totales integer,
    pases_clave integer,
    precision_pases numeric(5,2),
    entradas integer,
    bloqueos integer,
    intercepciones integer,
    duelos_totales integer,
    duelos_ganados integer,
    faltas_sufridas integer,
    faltas_cometidas integer,
    regates_intentados integer,
    regates_exito integer,
    amarillas integer,
    rojas integer,
    penaltis_marcados integer,
    goles_concedidos integer,
    paradas integer,
    penaltis_parados integer
);


ALTER TABLE public.h_jugador_temporada OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 32813)
-- Name: h_partidos_eventos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.h_partidos_eventos (
    id_evento integer NOT NULL,
    id_partido integer,
    minuto integer,
    extra integer,
    id_equipo integer,
    id_jugador integer,
    id_asistente_o_sale integer,
    tipo character varying(50),
    detalle character varying(100),
    comentarios text
);


ALTER TABLE public.h_partidos_eventos OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 32812)
-- Name: h_partidos_eventos_id_evento_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.h_partidos_eventos_id_evento_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.h_partidos_eventos_id_evento_seq OWNER TO postgres;

--
-- TOC entry 5096 (class 0 OID 0)
-- Dependencies: 223
-- Name: h_partidos_eventos_id_evento_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.h_partidos_eventos_id_evento_seq OWNED BY public.h_partidos_eventos.id_evento;


--
-- TOC entry 231 (class 1259 OID 32924)
-- Name: h_usuario_favoritos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.h_usuario_favoritos (
    id_usuario integer NOT NULL,
    id_equipo integer NOT NULL,
    id_jugador integer NOT NULL
);


ALTER TABLE public.h_usuario_favoritos OWNER TO postgres;

--
-- TOC entry 4898 (class 2604 OID 32910)
-- Name: dim_usuario id_usuario; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dim_usuario ALTER COLUMN id_usuario SET DEFAULT nextval('public.dim_usuario_id_usuario_seq'::regclass);


--
-- TOC entry 4897 (class 2604 OID 32816)
-- Name: h_partidos_eventos id_evento; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.h_partidos_eventos ALTER COLUMN id_evento SET DEFAULT nextval('public.h_partidos_eventos_id_evento_seq'::regclass);


--
-- TOC entry 4901 (class 2606 OID 32776)
-- Name: dim_equipo dim_equipo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dim_equipo
    ADD CONSTRAINT dim_equipo_pkey PRIMARY KEY (id_equipo);


--
-- TOC entry 4903 (class 2606 OID 32784)
-- Name: dim_jugador dim_jugador_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dim_jugador
    ADD CONSTRAINT dim_jugador_pkey PRIMARY KEY (id_jugador);


--
-- TOC entry 4907 (class 2606 OID 32796)
-- Name: dim_partidos dim_partidos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dim_partidos
    ADD CONSTRAINT dim_partidos_pkey PRIMARY KEY (id_partido);


--
-- TOC entry 4905 (class 2606 OID 32790)
-- Name: dim_tiempo dim_tiempo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dim_tiempo
    ADD CONSTRAINT dim_tiempo_pkey PRIMARY KEY (id_tiempo);


--
-- TOC entry 4919 (class 2606 OID 32923)
-- Name: dim_usuario dim_usuario_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dim_usuario
    ADD CONSTRAINT dim_usuario_email_key UNIQUE (email);


--
-- TOC entry 4921 (class 2606 OID 32921)
-- Name: dim_usuario dim_usuario_nombre_usuario_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dim_usuario
    ADD CONSTRAINT dim_usuario_nombre_usuario_key UNIQUE (nombre_usuario);


--
-- TOC entry 4923 (class 2606 OID 32919)
-- Name: dim_usuario dim_usuario_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dim_usuario
    ADD CONSTRAINT dim_usuario_pkey PRIMARY KEY (id_usuario);


--
-- TOC entry 4911 (class 2606 OID 32843)
-- Name: h_equipo_partido h_equipo_partido_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.h_equipo_partido
    ADD CONSTRAINT h_equipo_partido_pkey PRIMARY KEY (id_partido, id_equipo);


--
-- TOC entry 4915 (class 2606 OID 32882)
-- Name: h_equipo_temporada h_equipo_temporada_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.h_equipo_temporada
    ADD CONSTRAINT h_equipo_temporada_pkey PRIMARY KEY (id_equipo, temporada);


--
-- TOC entry 4913 (class 2606 OID 32860)
-- Name: h_jugador_partido h_jugador_partido_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.h_jugador_partido
    ADD CONSTRAINT h_jugador_partido_pkey PRIMARY KEY (id_partido, id_jugador);


--
-- TOC entry 4917 (class 2606 OID 32895)
-- Name: h_jugador_temporada h_jugador_temporada_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.h_jugador_temporada
    ADD CONSTRAINT h_jugador_temporada_pkey PRIMARY KEY (id_jugador, id_equipo, temporada);


--
-- TOC entry 4909 (class 2606 OID 32821)
-- Name: h_partidos_eventos h_partidos_eventos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.h_partidos_eventos
    ADD CONSTRAINT h_partidos_eventos_pkey PRIMARY KEY (id_evento);


--
-- TOC entry 4925 (class 2606 OID 32931)
-- Name: h_usuario_favoritos h_usuario_favoritos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.h_usuario_favoritos
    ADD CONSTRAINT h_usuario_favoritos_pkey PRIMARY KEY (id_usuario, id_equipo, id_jugador);


--
-- TOC entry 4926 (class 2606 OID 32802)
-- Name: dim_partidos dim_partidos_id_local_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dim_partidos
    ADD CONSTRAINT dim_partidos_id_local_fkey FOREIGN KEY (id_local) REFERENCES public.dim_equipo(id_equipo);


--
-- TOC entry 4927 (class 2606 OID 32797)
-- Name: dim_partidos dim_partidos_id_tiempo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dim_partidos
    ADD CONSTRAINT dim_partidos_id_tiempo_fkey FOREIGN KEY (id_tiempo) REFERENCES public.dim_tiempo(id_tiempo);


--
-- TOC entry 4928 (class 2606 OID 32807)
-- Name: dim_partidos dim_partidos_id_visitante_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dim_partidos
    ADD CONSTRAINT dim_partidos_id_visitante_fkey FOREIGN KEY (id_visitante) REFERENCES public.dim_equipo(id_equipo);


--
-- TOC entry 4932 (class 2606 OID 32849)
-- Name: h_equipo_partido h_equipo_partido_id_equipo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.h_equipo_partido
    ADD CONSTRAINT h_equipo_partido_id_equipo_fkey FOREIGN KEY (id_equipo) REFERENCES public.dim_equipo(id_equipo);


--
-- TOC entry 4933 (class 2606 OID 32844)
-- Name: h_equipo_partido h_equipo_partido_id_partido_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.h_equipo_partido
    ADD CONSTRAINT h_equipo_partido_id_partido_fkey FOREIGN KEY (id_partido) REFERENCES public.dim_partidos(id_partido);


--
-- TOC entry 4937 (class 2606 OID 32883)
-- Name: h_equipo_temporada h_equipo_temporada_id_equipo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.h_equipo_temporada
    ADD CONSTRAINT h_equipo_temporada_id_equipo_fkey FOREIGN KEY (id_equipo) REFERENCES public.dim_equipo(id_equipo);


--
-- TOC entry 4934 (class 2606 OID 32871)
-- Name: h_jugador_partido h_jugador_partido_id_equipo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.h_jugador_partido
    ADD CONSTRAINT h_jugador_partido_id_equipo_fkey FOREIGN KEY (id_equipo) REFERENCES public.dim_equipo(id_equipo);


--
-- TOC entry 4935 (class 2606 OID 32866)
-- Name: h_jugador_partido h_jugador_partido_id_jugador_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.h_jugador_partido
    ADD CONSTRAINT h_jugador_partido_id_jugador_fkey FOREIGN KEY (id_jugador) REFERENCES public.dim_jugador(id_jugador);


--
-- TOC entry 4936 (class 2606 OID 32861)
-- Name: h_jugador_partido h_jugador_partido_id_partido_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.h_jugador_partido
    ADD CONSTRAINT h_jugador_partido_id_partido_fkey FOREIGN KEY (id_partido) REFERENCES public.dim_partidos(id_partido);


--
-- TOC entry 4938 (class 2606 OID 32901)
-- Name: h_jugador_temporada h_jugador_temporada_id_equipo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.h_jugador_temporada
    ADD CONSTRAINT h_jugador_temporada_id_equipo_fkey FOREIGN KEY (id_equipo) REFERENCES public.dim_equipo(id_equipo);


--
-- TOC entry 4939 (class 2606 OID 32896)
-- Name: h_jugador_temporada h_jugador_temporada_id_jugador_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.h_jugador_temporada
    ADD CONSTRAINT h_jugador_temporada_id_jugador_fkey FOREIGN KEY (id_jugador) REFERENCES public.dim_jugador(id_jugador);


--
-- TOC entry 4929 (class 2606 OID 32827)
-- Name: h_partidos_eventos h_partidos_eventos_id_equipo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.h_partidos_eventos
    ADD CONSTRAINT h_partidos_eventos_id_equipo_fkey FOREIGN KEY (id_equipo) REFERENCES public.dim_equipo(id_equipo);


--
-- TOC entry 4930 (class 2606 OID 32832)
-- Name: h_partidos_eventos h_partidos_eventos_id_jugador_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.h_partidos_eventos
    ADD CONSTRAINT h_partidos_eventos_id_jugador_fkey FOREIGN KEY (id_jugador) REFERENCES public.dim_jugador(id_jugador);


--
-- TOC entry 4931 (class 2606 OID 32822)
-- Name: h_partidos_eventos h_partidos_eventos_id_partido_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.h_partidos_eventos
    ADD CONSTRAINT h_partidos_eventos_id_partido_fkey FOREIGN KEY (id_partido) REFERENCES public.dim_partidos(id_partido);


--
-- TOC entry 4940 (class 2606 OID 32937)
-- Name: h_usuario_favoritos h_usuario_favoritos_id_equipo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.h_usuario_favoritos
    ADD CONSTRAINT h_usuario_favoritos_id_equipo_fkey FOREIGN KEY (id_equipo) REFERENCES public.dim_equipo(id_equipo);


--
-- TOC entry 4941 (class 2606 OID 32942)
-- Name: h_usuario_favoritos h_usuario_favoritos_id_jugador_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.h_usuario_favoritos
    ADD CONSTRAINT h_usuario_favoritos_id_jugador_fkey FOREIGN KEY (id_jugador) REFERENCES public.dim_jugador(id_jugador);


--
-- TOC entry 4942 (class 2606 OID 32932)
-- Name: h_usuario_favoritos h_usuario_favoritos_id_usuario_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.h_usuario_favoritos
    ADD CONSTRAINT h_usuario_favoritos_id_usuario_fkey FOREIGN KEY (id_usuario) REFERENCES public.dim_usuario(id_usuario) ON DELETE CASCADE;


-- Completed on 2026-03-19 12:59:05

--
-- PostgreSQL database dump complete
--

\unrestrict PiregmQmLTkzt84a2gmguTXPnrFFCP7xIuCDBsAWX7BVSbRRLQFMYQHSmj9xCaQ

