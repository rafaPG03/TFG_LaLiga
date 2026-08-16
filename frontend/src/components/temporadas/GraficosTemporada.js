import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Circle, G, Image as SvgImage } from "react-native-svg";
import {
  VictoryAxis,
  VictoryBar,
  VictoryChart,
  VictoryLabel,
  VictoryLine,
  VictoryScatter,
  VictoryStack,
} from "victory-native";
import { useTheme } from "../../theme/ThemeContext";

const TODOS = "TODOS";
const CHART_HEIGHT = 260;
const MINUTOS_RENDIMIENTO = 1250;
const COLORS = {
  red: "#e20613",
  blue: "#1f6fa7",
  sky: "#d9eaf7",
  gold: "#f2b705",
  green: "#168a4a",
  orange: "#d97a1f",
  text: "#0f2743",
  muted: "#5a7189",
  border: "#d9e5f0",
  background: "#f4f8fc",
  card: "#ffffff",
};

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const formatNumber = (value, decimals = 0) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return "-";
  return decimals > 0 ? number.toFixed(decimals) : String(Math.round(number));
};

const normalizeText = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();

const normalizePosition = (position) => {
  const value = normalizeText(position);

  if (["P", "POR", "PORTERO"].includes(value)) return "POR";
  if (["DF", "DEF", "DEFENSA"].includes(value)) return "DEF";
  if (["M", "MC", "MED", "MEDIO", "MEDIOCENTRO"].includes(value)) return "MED";
  if (["DL", "DEL", "DELANTERO"].includes(value)) return "DEL";
  return value;
};

const truncateLabel = (value, max = 10) => {
  const text = String(value || "-");
  return text.length > max ? `${text.slice(0, max - 1)}.` : text;
};

const splitNameLabel = (value) => {
  const parts = String(value || "-")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length <= 1) return parts[0] || "-";
  return `${parts[0]}\n${parts[parts.length - 1]}`;
};

const getInitials = (value) => {
  const parts = String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "-";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ""}${parts[parts.length - 1][0] || ""}`.toUpperCase();
};

const getLeader = (players, metric) => {
  const candidates = Array.isArray(players) ? players : [];
  if (candidates.length === 0) return null;

  return candidates.reduce((best, player) => {
    if (!best) return player;
    return toNumber(player?.[metric]) > toNumber(best?.[metric])
      ? player
      : best;
  }, null);
};

const getTopByMetric = (items, metric, limit = 3, order = "desc") => {
  const multiplier = order === "asc" ? 1 : -1;
  return [...items]
    .sort((a, b) => {
      const diff = toNumber(a?.[metric]) - toNumber(b?.[metric]);
      return diff === 0 ? 0 : diff * multiplier;
    })
    .slice(0, limit);
};

const getMaxValue = (items, key, fallback = 1) => {
  const max = Math.max(...items.map((item) => toNumber(item?.[key])), fallback);
  return Number.isFinite(max) && max > 0 ? max : fallback;
};

const uniqueById = (items, idKey) => {
  const seen = new Set();
  return items.filter((item) => {
    const id = item?.[idKey];
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
};

const TeamLogoLabel = ({ x, y, datum, selectedEquipoId }) => {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;

  const isSelected = String(datum?.id_equipo) === String(selectedEquipoId);
  const isDimmed = selectedEquipoId !== TODOS && !isSelected;
  const size = isSelected ? 18 : 12;
  const radius = size / 2;
  const logo = datum?.logo ? { uri: datum.logo } : null;
  const centerY = y - (isSelected ? 18 : 14);

  return (
    <G opacity={isDimmed ? 0.28 : 0.95}>
      {logo ? (
        <SvgImage
          x={x - radius}
          y={centerY - radius}
          width={size}
          height={size}
          href={logo}
          preserveAspectRatio="xMidYMid meet"
        />
      ) : (
        <Circle
          cx={x}
          cy={centerY}
          r={radius}
          fill={isSelected ? COLORS.gold : COLORS.blue}
        />
      )}
    </G>
  );
};

const ChartShell = ({ width, height, children }) => (
  <View style={[styles.chartBox, { width, height }]}>
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {children}
    </Svg>
  </View>
);

export default function GraficosTemporada({ temporada }) {
  const { colors, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const axisStyle = useMemo(
    () => ({
      axis: { stroke: colors.border },
      axisLabel: { fill: colors.textMuted, fontSize: 11, padding: 32 },
      tickLabels: { fill: colors.textMuted, fontSize: 10 },
      grid: { stroke: colors.border, strokeWidth: 1 },
    }),
    [colors],
  );
  const defensiveAxisStyle = useMemo(
    () => ({
      ...axisStyle,
      tickLabels: {
        fill: colors.textMuted,
        fontSize: 8,
        lineHeight: 9,
      },
    }),
    [axisStyle, colors],
  );
  const temporadaBase = Number.isFinite(Number(temporada))
    ? Number(temporada)
    : null;
  const screenWidth = Number.isFinite(Number(width)) ? Number(width) : 360;
  const chartWidth = Math.max(280, Math.min(screenWidth - 32, 720));

  const [data, setData] = useState({
    equipos: [],
    jugadores: [],
    partidos_totales_liga: 0,
    jornada_maxima: null,
  });
  const [selectedEquipoId, setSelectedEquipoId] = useState(TODOS);
  const [selectorVisible, setSelectorVisible] = useState(false);
  const [performanceDetailsVisible, setPerformanceDetailsVisible] =
    useState(false);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargarDatos = useCallback(async () => {
    if (!temporadaBase) {
      setError("Temporada no disponible");
      setData({
        equipos: [],
        jugadores: [],
        partidos_totales_liga: 0,
        jornada_maxima: null,
      });
      setCargando(false);
      return;
    }

    try {
      setCargando(true);
      setError("");

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/temporadas/graficos?temporada=${temporadaBase}`,
      );

      if (!response.ok) {
        throw new Error("No se pudieron cargar los graficos");
      }

      const payload = await response.json();

      setData({
        equipos: Array.isArray(payload?.equipos) ? payload.equipos : [],
        jugadores: Array.isArray(payload?.jugadores) ? payload.jugadores : [],
        partidos_totales_liga: toNumber(payload?.partidos_totales_liga),
        jornada_maxima: payload?.jornada_maxima ?? null,
      });
      setSelectedEquipoId(TODOS);
    } catch (_e) {
      setError("No se pudieron cargar los graficos de temporada");
      setData({
        equipos: [],
        jugadores: [],
        partidos_totales_liga: 0,
        jornada_maxima: null,
      });
    } finally {
      setCargando(false);
    }
  }, [temporadaBase]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const equipos = useMemo(
    () =>
      data.equipos.map((equipo) => ({
        ...equipo,
        id_equipo: toNumber(equipo.id_equipo),
        goles_favor: toNumber(equipo.goles_favor),
        goles_contra: toNumber(equipo.goles_contra),
        puntos: toNumber(equipo.puntos),
        puntos_ano_pasado: toNumber(equipo.puntos_ano_pasado),
        partidos_jugados: toNumber(equipo.partidos_jugados),
      })),
    [data.equipos],
  );

  const jugadores = useMemo(
    () =>
      data.jugadores.map((jugador) => ({
        ...jugador,
        id_jugador: toNumber(jugador.id_jugador),
        id_equipo: toNumber(jugador.id_equipo),
        posicion_codigo: normalizePosition(jugador.posicion),
        partidos: toNumber(jugador.partidos),
        minutos: toNumber(jugador.minutos),
        nota_media: toNumber(jugador.nota_media),
        goles: toNumber(jugador.goles),
        asistencias: toNumber(jugador.asistencias),
        tiros_totales: toNumber(jugador.tiros_totales),
        pases_totales: toNumber(jugador.pases_totales),
        pases_clave: toNumber(jugador.pases_clave),
        precision_pases: toNumber(jugador.precision_pases),
        entradas: toNumber(jugador.entradas),
        bloqueos: toNumber(jugador.bloqueos),
        intercepciones: toNumber(jugador.intercepciones),
      })),
    [data.jugadores],
  );

  const selectedEquipo = useMemo(
    () =>
      equipos.find(
        (equipo) => String(equipo.id_equipo) === String(selectedEquipoId),
      ) ?? null,
    [equipos, selectedEquipoId],
  );

  const equiposContexto = useMemo(() => {
    if (selectedEquipoId === TODOS) return equipos;
    return equipos.filter(
      (equipo) => String(equipo.id_equipo) === String(selectedEquipoId),
    );
  }, [equipos, selectedEquipoId]);

  const jugadoresContexto = useMemo(() => {
    if (selectedEquipoId === TODOS) return jugadores;
    return jugadores.filter(
      (jugador) => String(jugador.id_equipo) === String(selectedEquipoId),
    );
  }, [jugadores, selectedEquipoId]);

  const minPartidosJugador = useMemo(() => {
    const partidosTemporada = Math.max(
      ...equipos.map((equipo) => equipo.partidos_jugados),
      toNumber(data.jornada_maxima),
      0,
    );

    return Math.max(1, Math.ceil(partidosTemporada * 0.25));
  }, [equipos, data.jornada_maxima]);

  const jugadoresElegibles = useMemo(
    () => jugadores.filter((jugador) => jugador.partidos >= minPartidosJugador),
    [jugadores, minPartidosJugador],
  );

  const jugadoresContextoElegibles = useMemo(
    () =>
      jugadoresContexto.filter(
        (jugador) => jugador.partidos >= minPartidosJugador,
      ),
    [jugadoresContexto, minPartidosJugador],
  );

  const kpis = useMemo(() => {
    const golesTotales = equiposContexto.reduce(
      (total, equipo) => total + equipo.goles_favor,
      0,
    );
    const partidos =
      selectedEquipoId === TODOS
        ? data.partidos_totales_liga ||
          equipos.reduce(
            (total, equipo) => total + equipo.partidos_jugados,
            0,
          ) / 2
        : toNumber(selectedEquipo?.partidos_jugados);
    const maxGoleador = getLeader(jugadoresContextoElegibles, "goles");
    const mvp = getLeader(jugadoresContextoElegibles, "nota_media");

    return [
      {
        label: "Goles totales",
        value: formatNumber(golesTotales),
        icon: "football-outline",
      },
      {
        label: "Goles / partido",
        value: partidos > 0 ? formatNumber(golesTotales / partidos, 2) : "-",
        icon: "analytics-outline",
      },
      {
        label: "Maximo goleador",
        value: maxGoleador?.nombre || "-",
        meta: maxGoleador ? `${maxGoleador.goles} goles` : "",
        icon: "flame-outline",
      },
      {
        label: "MVP temporada",
        value: mvp?.nombre || "-",
        meta: mvp ? `${formatNumber(mvp.nota_media, 2)} media` : "",
        icon: "star-outline",
      },
    ];
  }, [
    equipos,
    equiposContexto,
    jugadoresContextoElegibles,
    selectedEquipo,
    selectedEquipoId,
    data.partidos_totales_liga,
  ]);

  const rendimientoEquipos = useMemo(
    () =>
      equiposContexto.map((equipo) => ({
        ...equipo,
        diferencia_puntos: equipo.puntos - equipo.puntos_ano_pasado,
      })),
    [equiposContexto],
  );

  const mediocentros = useMemo(
    () =>
      jugadoresContextoElegibles.filter(
        (jugador) => jugador.posicion_codigo === "MED",
      ),
    [jugadoresContextoElegibles],
  );

  const lideresMediocentro = useMemo(
    () => [
      {
        label: "Precision pase",
        player: getLeader(mediocentros, "precision_pases"),
        metric: "precision_pases",
        suffix: "%",
      },
      {
        label: "Asistencias",
        player: getLeader(mediocentros, "asistencias"),
        metric: "asistencias",
        suffix: "",
      },
      {
        label: "Pases clave",
        player: getLeader(mediocentros, "pases_clave"),
        metric: "pases_clave",
        suffix: "",
      },
    ],
    [mediocentros],
  );

  const scatterEquipos = useMemo(
    () =>
      equipos.map((equipo) => ({
        ...equipo,
        x: equipo.goles_favor,
        y: equipo.goles_contra,
      })),
    [equipos],
  );

  const mediasEquipo = useMemo(() => {
    const cantidad = equipos.length || 1;
    return {
      golesFavor:
        equipos.reduce((total, equipo) => total + equipo.goles_favor, 0) /
        cantidad,
      golesContra:
        equipos.reduce((total, equipo) => total + equipo.goles_contra, 0) /
        cantidad,
    };
  }, [equipos]);

  const jugadoresRendimiento = useMemo(() => {
    const candidatos = jugadoresContextoElegibles.filter(
      (jugador) => jugador.nota_media > 0,
    );

    const jugadoresConMuchosMinutos = candidatos.filter(
      (jugador) => jugador.minutos >= MINUTOS_RENDIMIENTO,
    );
    const jugadoresConMenosMinutos = candidatos.filter(
      (jugador) => jugador.minutos < MINUTOS_RENDIMIENTO,
    );

    const mejoresMuchosMinutos = [...jugadoresConMuchosMinutos]
      .sort((a, b) => b.nota_media - a.nota_media)
      .slice(0, 10)
      .map((jugador) => ({
        ...jugador,
        grupo_rendimiento: "mejores_muchos_minutos",
      }));
    const mejoresMenosMinutos = [...jugadoresConMenosMinutos]
      .sort((a, b) => b.nota_media - a.nota_media)
      .slice(0, 10)
      .map((jugador) => ({
        ...jugador,
        grupo_rendimiento: "mejores_menos_minutos",
      }));
    const peoresMuchosMinutos = [...jugadoresConMuchosMinutos]
      .sort((a, b) => a.nota_media - b.nota_media)
      .slice(0, 10)
      .map((jugador) => ({
        ...jugador,
        grupo_rendimiento: "peores_muchos_minutos",
      }));

    return [
      {
        key: "mejores_muchos_minutos",
        title: `10 mejores medias - ${MINUTOS_RENDIMIENTO}+ minutos`,
        color: COLORS.green,
        jugadores: mejoresMuchosMinutos,
      },
      {
        key: "mejores_menos_minutos",
        title: `10 mejores medias - menos de ${MINUTOS_RENDIMIENTO} minutos`,
        color: COLORS.gold,
        jugadores: mejoresMenosMinutos,
      },
      {
        key: "peores_muchos_minutos",
        title: `10 peores medias - ${MINUTOS_RENDIMIENTO}+ minutos`,
        color: COLORS.red,
        jugadores: peoresMuchosMinutos,
      },
    ];
  }, [jugadoresContextoElegibles]);

  const jugadoresRendimientoScatter = useMemo(
    () =>
      uniqueById(
        jugadoresRendimiento.flatMap((grupo) => grupo.jugadores),
        "id_jugador",
      ).map((jugador) => ({
        ...jugador,
        x: jugador.minutos,
        y: jugador.nota_media,
      })),
    [jugadoresRendimiento],
  );

  const defensasTop = useMemo(
    () =>
      [...jugadoresContextoElegibles]
        .map((jugador) => ({
          ...jugador,
          volumen_defensivo:
            jugador.bloqueos + jugador.entradas + jugador.intercepciones,
          label: splitNameLabel(jugador.nombre),
        }))
        .sort((a, b) => b.volumen_defensivo - a.volumen_defensivo)
        .slice(0, 7)
        .reverse(),
    [jugadoresContextoElegibles],
  );

  const atacantes = useMemo(
    () =>
      jugadoresElegibles
        .filter((jugador) => jugador.posicion_codigo === "DEL")
        .map((jugador) => ({
          ...jugador,
          x: jugador.tiros_totales,
          y: jugador.goles,
        })),
    [jugadoresElegibles],
  );

  const selectedLabel =
    selectedEquipoId === TODOS
      ? "Toda la liga"
      : selectedEquipo?.nombre || "Equipo";

  const eligibilityText = `Mínimo ${minPartidosJugador} partidos jugados`;

  const selectEquipo = (id) => {
    setSelectedEquipoId(String(id));
    setSelectorVisible(false);
  };

  const renderState = () => {
    if (cargando) {
      return (
        <View style={styles.centerState}>
          <ActivityIndicator size="small" color={COLORS.blue} />
          <Text style={styles.centerText}>Cargando graficos...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerState}>
          <Ionicons
            name="alert-circle-outline"
            size={34}
            color={COLORS.muted}
          />
          <Text style={styles.centerText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={cargarDatos}
            activeOpacity={0.85}
          >
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return null;
  };

  const renderKpis = () => (
    <View style={styles.kpiGrid}>
      {kpis.map((item) => (
        <View key={item.label} style={styles.kpiCard}>
          <View style={styles.kpiIcon}>
            <Ionicons name={item.icon} size={18} color={COLORS.blue} />
          </View>
          <Text style={styles.kpiLabel}>{item.label}</Text>
          <Text style={styles.kpiValue} numberOfLines={2}>
            {item.value}
          </Text>
          {item.meta ? <Text style={styles.kpiMeta}>{item.meta}</Text> : null}
        </View>
      ))}
    </View>
  );

  const renderRendimientoPasado = () => {
    if (selectedEquipoId !== TODOS) {
      const equipo = rendimientoEquipos[0];
      const diff = toNumber(equipo?.diferencia_puntos);
      const color = diff >= 0 ? COLORS.green : COLORS.red;

      return (
        <View style={styles.performanceSingle}>
          <Text style={[styles.performanceValue, { color }]}>
            {diff >= 0 ? "+" : ""}
            {diff} puntos
          </Text>
          <Text style={styles.performanceText}>respecto al año pasado</Text>
        </View>
      );
    }

    const mejores = getTopByMetric(
      rendimientoEquipos,
      "diferencia_puntos",
      3,
      "desc",
    );
    const peores = getTopByMetric(
      rendimientoEquipos,
      "diferencia_puntos",
      3,
      "asc",
    );

    return (
      <View style={styles.performanceColumns}>
        <View style={styles.performanceColumn}>
          <Text style={styles.performanceTitle}>Mas mejoran</Text>
          {mejores.map((equipo) => renderDiffRow(equipo, COLORS.green))}
        </View>
        <View style={styles.performanceColumn}>
          <Text style={styles.performanceTitle}>Mas caen</Text>
          {peores.map((equipo) => renderDiffRow(equipo, COLORS.red))}
        </View>
      </View>
    );
  };

  const renderDiffRow = (equipo, color) => (
    <View key={`diff-${equipo.id_equipo}-${color}`} style={styles.diffRow}>
      <Text style={styles.diffTeam} numberOfLines={1}>
        {equipo.nombre}
      </Text>
      <Text style={[styles.diffValue, { color }]}>
        {equipo.diferencia_puntos >= 0 ? "+" : ""}
        {equipo.diferencia_puntos}
      </Text>
    </View>
  );

  const renderSection = (title, subtitle, children) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {subtitle ? (
          <Text style={styles.sectionSubtitle}>{subtitle}</Text>
        ) : null}
      </View>
      {children}
    </View>
  );

  const renderEmptyChart = (message) => (
    <View style={styles.emptyChart}>
      <Ionicons name="bar-chart-outline" size={28} color={COLORS.muted} />
      <Text style={styles.emptyChartText}>{message}</Text>
    </View>
  );

  const renderSelectorLogo = (equipo, active = false) => {
    if (equipo?.logo) {
      return (
        <Image
          source={{ uri: equipo.logo }}
          style={styles.selectorLogo}
          resizeMode="contain"
        />
      );
    }

    return (
      <View
        style={[
          styles.selectorLogoFallback,
          active && styles.selectorLogoFallbackActive,
        ]}
      >
        <Ionicons
          name="shield-outline"
          size={15}
          color={active ? COLORS.blue : COLORS.muted}
        />
      </View>
    );
  };

  const renderTeamQuadrant = () => {
    if (scatterEquipos.length === 0) {
      return renderEmptyChart("No hay equipos para mostrar");
    }

    const maxContra = getMaxValue(scatterEquipos, "goles_contra", 10) + 5;
    const maxFavor = getMaxValue(scatterEquipos, "goles_favor", 10) + 5;
    const fullDomain = { x: [0, maxFavor], y: [0, maxContra] };

    return (
      <ChartShell width={chartWidth} height={CHART_HEIGHT}>
        <VictoryChart
          standalone={false}
          width={chartWidth}
          height={CHART_HEIGHT}
          padding={{ top: 18, left: 48, right: 24, bottom: 46 }}
          domain={fullDomain}
        >
          <VictoryAxis label="Goles favor" style={axisStyle} />
          <VictoryAxis dependentAxis label="Goles contra" style={axisStyle} />
          <VictoryLine
            data={[
              { x: mediasEquipo.golesFavor, y: 0 },
              { x: mediasEquipo.golesFavor, y: maxContra },
            ]}
            style={{
              data: {
                stroke: COLORS.muted,
                strokeDasharray: "6,6",
                strokeWidth: 1,
              },
            }}
          />
          <VictoryLine
            data={[
              { x: 0, y: mediasEquipo.golesContra },
              { x: maxFavor, y: mediasEquipo.golesContra },
            ]}
            style={{
              data: {
                stroke: COLORS.muted,
                strokeDasharray: "6,6",
                strokeWidth: 1,
              },
            }}
          />
          <VictoryScatter
            data={scatterEquipos}
            size={({ datum }) =>
              String(datum.id_equipo) === String(selectedEquipoId) ? 7 : 4
            }
            style={{
              data: {
                fill: ({ datum }) =>
                  String(datum.id_equipo) === String(selectedEquipoId)
                    ? COLORS.gold
                    : COLORS.blue,
                opacity: ({ datum }) =>
                  selectedEquipoId === TODOS ||
                  String(datum.id_equipo) === String(selectedEquipoId)
                    ? 0.9
                    : 0.25,
              },
            }}
          />
          <VictoryScatter
            data={scatterEquipos}
            size={0}
            dataComponent={
              <TeamLogoLabel selectedEquipoId={selectedEquipoId} />
            }
          />
        </VictoryChart>
      </ChartShell>
    );
  };

  const renderPerformanceDetails = () => (
    <View style={styles.performanceDetails}>
      <TouchableOpacity
        style={styles.performanceToggle}
        onPress={() => setPerformanceDetailsVisible((visible) => !visible)}
        activeOpacity={0.85}
      >
        <Text style={styles.performanceToggleText}>
          {performanceDetailsVisible
            ? "Ocultar detalle de jugadores"
            : "Ver detalle de jugadores"}
        </Text>
        <Ionicons
          name={performanceDetailsVisible ? "chevron-up" : "chevron-down"}
          size={16}
          color={COLORS.blue}
        />
      </TouchableOpacity>

      {performanceDetailsVisible
        ? jugadoresRendimiento.map((grupo) => (
            <View key={grupo.key} style={styles.performanceGroup}>
              <View style={styles.performanceGroupHeader}>
                <View
                  style={[
                    styles.performanceGroupDot,
                    { backgroundColor: grupo.color },
                  ]}
                />
                <Text style={styles.performanceGroupTitle}>{grupo.title}</Text>
              </View>
              {grupo.jugadores.length > 0 ? (
                grupo.jugadores.map((jugador) => (
                  <View
                    key={`${grupo.key}-${jugador.id_jugador}`}
                    style={styles.performanceRow}
                  >
                    <Text style={styles.performanceInitials}>
                      {getInitials(jugador.nombre)}
                    </Text>
                    <Text style={styles.performanceName} numberOfLines={1}>
                      {jugador.nombre}
                    </Text>
                    <Text style={styles.performanceMeta}>
                      {formatNumber(jugador.nota_media, 2)} -{" "}
                      {formatNumber(jugador.minutos)} min
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.performanceEmpty}>
                  No hay jugadores en esta seccion
                </Text>
              )}
            </View>
          ))
        : null}
    </View>
  );

  const renderPlayerPerformance = () => {
    if (jugadoresRendimientoScatter.length === 0) {
      return renderEmptyChart(
        `No hay jugadores para mostrar con el corte de ${MINUTOS_RENDIMIENTO} minutos`,
      );
    }

    const colorPorGrupo = jugadoresRendimiento.reduce((acc, grupo) => {
      acc[grupo.key] = grupo.color;
      return acc;
    }, {});
    const maxMinutos =
      getMaxValue(jugadoresRendimientoScatter, "minutos", 1000) + 150;
    const minNota = Math.max(
      4.5,
      Math.min(
        ...jugadoresRendimientoScatter.map((jugador) => jugador.nota_media),
      ) - 0.25,
    );
    const maxNota = 10;
    const fullDomain = { x: [0, maxMinutos], y: [minNota, maxNota] };

    return (
      <>
        <ChartShell width={chartWidth} height={CHART_HEIGHT}>
          <VictoryChart
            standalone={false}
            width={chartWidth}
            height={CHART_HEIGHT}
            padding={{ top: 18, left: 48, right: 24, bottom: 46 }}
            domain={fullDomain}
          >
            <VictoryAxis label="Minutos" style={axisStyle} />
            <VictoryAxis dependentAxis label="Nota media" style={axisStyle} />
            <VictoryScatter
              data={jugadoresRendimientoScatter}
              size={5}
              style={{
                data: {
                  fill: ({ datum }) =>
                    colorPorGrupo[datum.grupo_rendimiento] || COLORS.red,
                  opacity: 0.82,
                },
              }}
            />
            <VictoryScatter
              data={jugadoresRendimientoScatter}
              size={0}
              labels={({ datum }) => getInitials(datum.nombre)}
              labelComponent={
                <VictoryLabel
                  dy={-8}
                  textAnchor="middle"
                  style={{
                    fill: () => colors.textStrong,
                    fontSize: 8,
                    fontWeight: "900",
                  }}
                />
              }
            />
          </VictoryChart>
        </ChartShell>
        {renderPerformanceDetails()}
      </>
    );
  };

  const renderDefensiveBars = () => {
    if (defensasTop.length === 0) {
      return renderEmptyChart("No hay acciones defensivas para mostrar");
    }

    const barData = (key) =>
      defensasTop.map((jugador) => ({
        x: jugador.label,
        y: toNumber(jugador[key]),
        nombre: jugador.nombre,
        valor: toNumber(jugador[key]),
      }));

    return (
      <ChartShell width={chartWidth} height={320}>
        <VictoryChart
          standalone={false}
          width={chartWidth}
          height={320}
          domainPadding={{ x: 20, y: 18 }}
          padding={{ top: 18, left: 48, right: 20, bottom: 92 }}
        >
          <VictoryAxis style={defensiveAxisStyle} />
          <VictoryAxis dependentAxis style={axisStyle} />
          <VictoryStack colorScale={[COLORS.blue, COLORS.red, COLORS.gold]}>
            <VictoryBar data={barData("bloqueos")} />
            <VictoryBar data={barData("entradas")} />
            <VictoryBar data={barData("intercepciones")} />
          </VictoryStack>
        </VictoryChart>
      </ChartShell>
    );
  };

  const renderMidfieldBadges = () => (
    <View style={styles.badgeGrid}>
      {lideresMediocentro.map((item) => {
        const value = item.player
          ? `${formatNumber(item.player[item.metric])}${item.suffix}`
          : "-";
        return (
          <View key={item.label} style={styles.badgeCard}>
            <Text style={styles.badgeLabel}>{item.label}</Text>
            <Text style={styles.badgePlayer} numberOfLines={1}>
              {item.player?.nombre || "Sin datos"}
            </Text>
            <Text style={styles.badgeValue}>{value}</Text>
          </View>
        );
      })}
    </View>
  );

  const renderAttackersScatter = () => {
    const dataAtacantes = atacantes;
    const tablaAtacantes =
      selectedEquipoId === TODOS
        ? [...atacantes].sort((a, b) => b.goles - a.goles).slice(0, 10)
        : atacantes
            .filter(
              (jugador) =>
                String(jugador.id_equipo) === String(selectedEquipoId),
            )
            .sort((a, b) => b.goles - a.goles);

    if (dataAtacantes.length === 0) {
      return renderEmptyChart("No hay delanteros para mostrar");
    }

    const maxTiros = getMaxValue(dataAtacantes, "tiros_totales", 20) + 8;
    const maxGoles = getMaxValue(dataAtacantes, "goles", 5) + 3;
    const fullDomain = { x: [0, maxTiros], y: [0, maxGoles] };

    return (
      <>
        <ChartShell width={chartWidth} height={CHART_HEIGHT}>
          <VictoryChart
            standalone={false}
            width={chartWidth}
            height={CHART_HEIGHT}
            padding={{ top: 18, left: 48, right: 24, bottom: 46 }}
            domain={fullDomain}
          >
            <VictoryAxis label="Tiros totales" style={axisStyle} />
            <VictoryAxis dependentAxis label="Goles" style={axisStyle} />
            <VictoryScatter
              data={dataAtacantes}
              size={({ datum }) =>
                selectedEquipoId !== TODOS &&
                String(datum.id_equipo) === String(selectedEquipoId)
                  ? 6
                  : 4
              }
              style={{
                data: {
                  fill: ({ datum }) => {
                    if (selectedEquipoId === TODOS) return COLORS.orange;
                    return String(datum.id_equipo) === String(selectedEquipoId)
                      ? COLORS.gold
                      : "#8ca0b3";
                  },
                  opacity: ({ datum }) => {
                    if (selectedEquipoId === TODOS) return 0.8;
                    return String(datum.id_equipo) === String(selectedEquipoId)
                      ? 0.95
                      : 0.25;
                  },
                },
              }}
            />
              <VictoryScatter
                data={dataAtacantes}
                size={0}
                style={{
                  labels: {
                    fill: () => colors.textStrong,
                    fontSize: 8,
                    fontWeight: "800",
                  },
                }}
              labels={({ datum }) => {
                if (selectedEquipoId === TODOS) {
                  return datum.goles > 10 ? getInitials(datum.nombre) : "";
                }

                return String(datum.id_equipo) === String(selectedEquipoId)
                  ? getInitials(datum.nombre)
                  : "";
              }}
              labelComponent={
                <VictoryLabel
                  dy={-7}
                  textAnchor="middle"
                />
              }
            />
          </VictoryChart>
        </ChartShell>
        <View style={styles.attackList}>
          {tablaAtacantes.map((jugador) => (
            <View key={`atk-${jugador.id_jugador}`} style={styles.attackRow}>
              <Text
                style={[
                  styles.attackInitials,
                  isDark && { color: colors.textStrong },
                ]}
              >
                {getInitials(jugador.nombre)}
              </Text>
              <Text style={styles.attackName}>{jugador.nombre}</Text>
              <Text style={styles.attackMeta}>
                {jugador.goles} G / {jugador.tiros_totales} T
              </Text>
            </View>
          ))}
        </View>
      </>
    );
  };

  if (cargando || error) {
    return <View style={styles.container}>{renderState()}</View>;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.subtitle}>
              Temporada {temporadaBase}{" "}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.selectorButton}
            onPress={() => setSelectorVisible(true)}
            activeOpacity={0.85}
          >
            {renderSelectorLogo(
              selectedEquipoId === TODOS ? null : selectedEquipo,
              true,
            )}
            <Text style={styles.selectorText} numberOfLines={1}>
              {selectedLabel}
            </Text>
            <Ionicons name="chevron-down" size={16} color={COLORS.muted} />
          </TouchableOpacity>
        </View>

        {renderSection("Estadísticas globales", selectedLabel, renderKpis())}
        {renderSection(
          "Rendimiento actual vs año pasado",
          null,
          renderRendimientoPasado(),
        )}
        {renderSection(
          "Cuadrante de goles",
          renderTeamQuadrant(),
        )}
        {renderSection(
          "Rendimiento de jugadores",
          `Top/bottom por nota media y corte de ${MINUTOS_RENDIMIENTO} minutos`,
          renderPlayerPerformance(),
        )}
        {renderSection(
          "Acciones defensivas",
          `Top 7 por volumen defensivo`,
          <>
            <View style={styles.legendRow}>
              <Text style={[styles.legendItem, { color: COLORS.blue }]}>
                Bloqueos
              </Text>
              <Text style={[styles.legendItem, { color: COLORS.red }]}>
                Entradas
              </Text>
              <Text style={[styles.legendItem, { color: COLORS.gold }]}>
                Intercepciones
              </Text>
            </View>
            {renderDefensiveBars()}
          </>,
        )}
        {renderSection(
          "Lideres de creacion",
          renderMidfieldBadges(),
        )}
        {renderSection(
          "Eficiencia goleadora",
          `Goles vs tiros totales`,
          renderAttackersScatter(),
        )}
      </ScrollView>

      <Modal
        visible={selectorVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectorVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setSelectorVisible(false)}
          />
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecciona equipo</Text>
              <TouchableOpacity
                onPress={() => setSelectorVisible(false)}
                style={styles.modalClose}
              >
                <Ionicons name="close" size={20} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              <TouchableOpacity
                style={[
                  styles.modalOption,
                  selectedEquipoId === TODOS && styles.modalOptionActive,
                ]}
                onPress={() => selectEquipo(TODOS)}
              >
                {renderSelectorLogo(null, selectedEquipoId === TODOS)}
                <Text
                  style={[
                    styles.modalOptionText,
                    selectedEquipoId === TODOS && styles.modalOptionTextActive,
                  ]}
                >
                  Toda la liga
                </Text>
              </TouchableOpacity>
              {equipos.map((equipo) => (
                <TouchableOpacity
                  key={`selector-${equipo.id_equipo}`}
                  style={[
                    styles.modalOption,
                    String(equipo.id_equipo) === String(selectedEquipoId) &&
                      styles.modalOptionActive,
                  ]}
                  onPress={() => selectEquipo(equipo.id_equipo)}
                >
                  {renderSelectorLogo(
                    equipo,
                    String(equipo.id_equipo) === String(selectedEquipoId),
                  )}
                  <Text
                    style={[
                      styles.modalOptionText,
                      String(equipo.id_equipo) === String(selectedEquipoId) &&
                        styles.modalOptionTextActive,
                    ]}
                  >
                    {equipo.nombre}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 28,
  },
  header: {
    gap: 12,
    marginBottom: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.text,
  },
  subtitle: {
    marginTop: 3,
    fontSize: 13,
    color: COLORS.muted,
  },
  selectorButton: {
    minHeight: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  selectorText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },
  selectorLogo: {
    width: 24,
    height: 24,
  },
  selectorLogoFallback: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#edf3f8",
    alignItems: "center",
    justifyContent: "center",
  },
  selectorLogoFallbackActive: {
    backgroundColor: COLORS.card,
  },
  section: {
    marginBottom: 18,
  },
  sectionHeader: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.text,
  },
  sectionSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: COLORS.muted,
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  kpiCard: {
    width: "48%",
    minHeight: 124,
    borderRadius: 8,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  kpiIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: COLORS.sky,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  kpiLabel: {
    fontSize: 11,
    color: COLORS.muted,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  kpiValue: {
    marginTop: 5,
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.text,
  },
  kpiMeta: {
    marginTop: 3,
    fontSize: 12,
    color: COLORS.muted,
  },
  performanceSingle: {
    borderRadius: 8,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
  },
  performanceValue: {
    fontSize: 24,
    fontWeight: "900",
  },
  performanceText: {
    marginTop: 4,
    color: COLORS.muted,
    fontSize: 13,
  },
  performanceColumns: {
    flexDirection: "row",
    gap: 10,
  },
  performanceColumn: {
    flex: 1,
    borderRadius: 8,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
  },
  performanceTitle: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: "800",
    marginBottom: 8,
  },
  diffRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingVertical: 5,
  },
  diffTeam: {
    flex: 1,
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "600",
  },
  diffValue: {
    fontSize: 13,
    fontWeight: "900",
  },
  emptyChart: {
    minHeight: 140,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  },
  emptyChartText: {
    marginTop: 8,
    color: COLORS.muted,
    textAlign: "center",
    fontSize: 13,
  },
  chartBox: {
    alignSelf: "center",
    overflow: "hidden",
  },
  performanceDetails: {
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    overflow: "hidden",
  },
  performanceToggle: {
    minHeight: 40,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f6f9fc",
  },
  performanceToggleText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "800",
  },
  performanceGroup: {
    borderTopWidth: 1,
    borderTopColor: "#edf3f8",
    paddingVertical: 8,
  },
  performanceGroupHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    marginBottom: 4,
  },
  performanceGroupDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  performanceGroupTitle: {
    flex: 1,
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "900",
  },
  performanceRow: {
    minHeight: 32,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
  },
  performanceInitials: {
    width: 32,
    color: COLORS.blue,
    fontSize: 12,
    fontWeight: "900",
  },
  performanceName: {
    flex: 1,
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "700",
  },
  performanceMeta: {
    color: COLORS.red,
    fontSize: 12,
    fontWeight: "900",
  },
  performanceEmpty: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "700",
  },
  attackList: {
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    overflow: "hidden",
  },
  attackRow: {
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#edf3f8",
  },
  attackInitials: {
    width: 32,
    color: COLORS.blue,
    fontSize: 12,
    fontWeight: "800",
  },
  attackName: {
    flex: 1,
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "700",
  },
  attackMeta: {
    color: COLORS.red,
    fontSize: 12,
    fontWeight: "900",
  },
  legendRow: {
    flexDirection: "row",
    gap: 14,
    marginBottom: 4,
  },
  legendItem: {
    fontSize: 12,
    fontWeight: "800",
  },
  badgeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  badgeCard: {
    flexGrow: 1,
    flexBasis: "30%",
    minWidth: 104,
    borderRadius: 8,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
  },
  badgeLabel: {
    fontSize: 11,
    color: COLORS.muted,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  badgePlayer: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.text,
  },
  badgeValue: {
    marginTop: 5,
    fontSize: 19,
    color: COLORS.red,
    fontWeight: "900",
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  centerText: {
    marginTop: 10,
    fontSize: 13,
    color: COLORS.muted,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 12,
    borderRadius: 8,
    backgroundColor: COLORS.blue,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  retryText: {
    color: "#ffffff",
    fontWeight: "800",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10, 24, 42, 0.45)",
  },
  modalCard: {
    maxHeight: "72%",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    backgroundColor: COLORS.card,
    paddingBottom: 18,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
  },
  modalClose: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#edf3f8",
    alignItems: "center",
    justifyContent: "center",
  },
  modalList: {
    paddingHorizontal: 12,
  },
  modalOption: {
    minHeight: 44,
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 8,
    backgroundColor: "#f6f9fc",
  },
  modalOptionActive: {
    backgroundColor: COLORS.sky,
    borderWidth: 1,
    borderColor: COLORS.blue,
  },
  modalOptionText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "700",
  },
  modalOptionTextActive: {
    color: COLORS.blue,
  },
});
