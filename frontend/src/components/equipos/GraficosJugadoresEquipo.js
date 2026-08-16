import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Circle, G, Image as SvgImage } from "react-native-svg";
import {
  VictoryAxis,
  VictoryBar,
  VictoryChart,
  VictoryGroup,
  VictoryLabel,
  VictoryLine,
  VictoryPie,
  VictoryScatter,
} from "victory-native";
import { useTheme } from "../../theme/ThemeContext";

const COLORS = {
  red: "#e20613",
  blue: "#1f6fa7",
  cyan: "#55a6d9",
  gold: "#f2b705",
  green: "#168a4a",
  orange: "#d97a1f",
  purple: "#7957a8",
  text: "#0f2743",
  muted: "#5a7189",
  border: "#d9e5f0",
  background: "#f4f8fc",
  card: "#ffffff",
  soft: "#f8fbfe",
};

const CHART_HEIGHT = 270;
const PIE_COLORS = [
  COLORS.red,
  COLORS.blue,
  COLORS.gold,
  COLORS.green,
  COLORS.orange,
  COLORS.purple,
  COLORS.cyan,
  "#9b6b43",
];

const RATING_KPIS = [
  { key: "ataque", label: "Ataque", icon: "football-outline" },
  { key: "defensa", label: "Defensa", icon: "shield-checkmark-outline" },
  { key: "creacion", label: "Creación", icon: "git-branch-outline" },
  { key: "duelos", label: "Duelos", icon: "people-outline" },
  { key: "porteros", label: "Portería", icon: "hand-left-outline" },
  { key: "regates", label: "Regate", icon: "flash-outline" },
];

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const formatInteger = (value) =>
  new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 }).format(
    toNumber(value),
  );

const formatRating = (value) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number.toFixed(2) : "-";
};

const shortName = (value, maxLength = 13) => {
  const name = String(value || "Jugador").trim();
  if (name.length <= maxLength) return name;
  const parts = name.split(/\s+/).filter(Boolean);
  const compact = parts.length > 1 ? parts[parts.length - 1] : name;
  return compact.length <= maxLength
    ? compact
    : `${compact.slice(0, maxLength - 1)}…`;
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

const getPositionGroup = (position) => {
  const normalized = String(position || "")
    .trim()
    .toUpperCase();

  if (
    ["P", "POR", "PORTERO"].includes(normalized) ||
    normalized.includes("PORT")
  ) {
    return "POR";
  }
  if (["DF", "DEF"].includes(normalized) || normalized.includes("DEF")) {
    return "DEF";
  }
  if (
    ["M", "MC", "MED"].includes(normalized) ||
    normalized.includes("MED") ||
    normalized.includes("CENTRO")
  ) {
    return "MED";
  }
  return "DEL";
};

const getLeader = (players, key) =>
  players.reduce((best, player) => {
    if (!best || toNumber(player[key]) > toNumber(best[key])) return player;
    return best;
  }, null);

const ChartShell = ({ width, height = CHART_HEIGHT, children }) => (
  <View style={[styles.chartBox, { width, height }]}>
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {children}
    </Svg>
  </View>
);

const MatchLogoLabel = ({ x, y, datum }) => {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;

  const size = 22;
  const centerY = y - 22;
  const logo = datum?.rival_logo ? { uri: datum.rival_logo } : null;

  return (
    <G>
      <Circle
        cx={x}
        cy={centerY}
        r={size / 2 + 2}
        fill="#ffffff"
        stroke={COLORS.border}
        strokeWidth={1}
      />
      {logo ? (
        <SvgImage
          x={x - size / 2}
          y={centerY - size / 2}
          width={size}
          height={size}
          href={logo}
          preserveAspectRatio="xMidYMid meet"
        />
      ) : (
        <Circle cx={x} cy={centerY} r={size / 2} fill={COLORS.blue} />
      )}
    </G>
  );
};

const Legend = ({ items }) => (
  <View style={styles.legendRow}>
    {items.map((item) => (
      <View key={item.label} style={styles.legendItem}>
        <View style={[styles.legendDot, { backgroundColor: item.color }]} />
        <Text style={styles.legendText}>{item.label}</Text>
      </View>
    ))}
  </View>
);

const makeGoalSlices = (rows, labelKey, valueKey) => {
  return rows
    .map((row) => ({
      x: String(row[labelKey] || "Sin nombre"),
      y: toNumber(row[valueKey]),
    }))
    .filter((row) => row.y > 0)
    .sort((a, b) => b.y - a.y);
};

export default function GraficosJugadoresEquipo({ id_equipo }) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const screenWidth = Number.isFinite(Number(width)) ? Number(width) : 360;
  const chartWidth = Math.max(280, Math.min(screenWidth - 60, 700));

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payload, setPayload] = useState(null);
  const [selectedTemporada, setSelectedTemporada] = useState(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const [scatterLegendVisible, setScatterLegendVisible] = useState(false);
  const requestIdRef = useRef(0);

  const axisStyle = useMemo(
    () => ({
      axis: { stroke: colors.border },
      axisLabel: { fill: colors.text, fontSize: 11, padding: 34 },
      tickLabels: { fill: colors.textMuted, fontSize: 9 },
      grid: { stroke: colors.border, strokeDasharray: "4,4" },
    }),
    [colors],
  );

  const cargarDatos = useCallback(
    async (temporadaElegida = null) => {
      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;

      try {
        setLoading(true);
        setError("");

        if (!id_equipo) {
          setPayload(null);
          return;
        }

        const query = temporadaElegida
          ? `?temporada=${encodeURIComponent(temporadaElegida)}`
          : "";
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/equipos/dashboard/${id_equipo}${query}`,
        );

        if (!response.ok) {
          throw new Error("No se pudo cargar el análisis de jugadores");
        }

        const data = await response.json();
        if (requestId !== requestIdRef.current) return;
        setPayload(data ?? null);
        setSelectedTemporada(temporadaElegida ?? data?.temporada ?? null);
      } catch (_error) {
        if (requestId !== requestIdRef.current) return;
        setPayload(null);
        setError("No se pudo cargar el análisis de jugadores");
      } finally {
        if (requestId === requestIdRef.current) setLoading(false);
      }
    },
    [id_equipo],
  );

  useEffect(() => {
    setPayload(null);
    setSelectedTemporada(null);
    setSelectedPlayerId(null);
    setScatterLegendVisible(false);
    cargarDatos();
  }, [cargarDatos]);

  const players = useMemo(
    () => (Array.isArray(payload?.jugadores) ? payload.jugadores : []),
    [payload?.jugadores],
  );
  const playerMatches = useMemo(
    () =>
      Array.isArray(payload?.jugadores_partido)
        ? payload.jugadores_partido
        : [],
    [payload?.jugadores_partido],
  );
  const teamRatingMatches = useMemo(
    () =>
      Array.isArray(payload?.media_ratings_partido)
        ? payload.media_ratings_partido
        : [],
    [payload?.media_ratings_partido],
  );
  const seasons = Array.isArray(payload?.temporadas_disponibles)
    ? payload.temporadas_disponibles
    : [];
  const activeSeason = selectedTemporada ?? payload?.temporada ?? null;
  const selectedPlayer = useMemo(
    () =>
      players.find(
        (player) => Number(player.id_jugador) === Number(selectedPlayerId),
      ) ?? null,
    [players, selectedPlayerId],
  );

  const selectedMatches = useMemo(
    () =>
      selectedPlayer
        ? playerMatches.filter(
            (match) =>
              Number(match.id_jugador) === Number(selectedPlayer.id_jugador),
          )
        : [],
    [playerMatches, selectedPlayer],
  );

  const mainKpis = useMemo(() => {
    if (selectedPlayer) {
      return [
        {
          label: "Minutos",
          value: formatInteger(selectedPlayer.minutos),
          detail: `${formatInteger(selectedPlayer.partidos)} partidos`,
          icon: "time-outline",
          color: COLORS.blue,
        },
        {
          label: "Goles",
          value: formatInteger(selectedPlayer.goles),
          detail: `${formatInteger(selectedPlayer.asistencias)} asistencias`,
          icon: "football-outline",
          color: COLORS.red,
        },
        {
          label: "Nota media",
          value: formatRating(selectedPlayer.nota_media),
          detail: selectedPlayer.nombre || "Jugador",
          icon: "star-outline",
          color: COLORS.gold,
        },
      ];
    }

    const minuteLeader = getLeader(players, "minutos");
    const goalLeader = getLeader(players, "goles");
    const ratingLeader = getLeader(
      players.filter((player) => toNumber(player.nota_media) > 1),
      "nota_media",
    );

    return [
      {
        label: "Más minutos",
        value: minuteLeader?.nombre || "-",
        detail: minuteLeader
          ? `${formatInteger(minuteLeader.minutos)} min`
          : "Sin datos",
        icon: "time-outline",
        color: COLORS.blue,
      },
      {
        label: "Más goles",
        value: goalLeader?.nombre || "-",
        detail: goalLeader
          ? `${formatInteger(goalLeader.goles)} goles`
          : "Sin datos",
        icon: "football-outline",
        color: COLORS.red,
      },
      {
        label: "Mejor nota",
        value: ratingLeader?.nombre || "-",
        detail: ratingLeader
          ? `${formatRating(ratingLeader.nota_media)} de media`
          : "Sin datos",
        icon: "star-outline",
        color: COLORS.gold,
      },
    ];
  }, [players, selectedPlayer]);

  const ratingKpis = useMemo(
    () =>
      RATING_KPIS.map((metric) => {
        const player =
          selectedPlayer ||
          getLeader(
            players.filter((item) => toNumber(item[metric.key]) > 0),
            metric.key,
          );
        return {
          ...metric,
          value: formatRating(player?.[metric.key]),
          detail: selectedPlayer
            ? "Rating del jugador"
            : player?.nombre || "Sin datos",
        };
      }),
    [players, selectedPlayer],
  );

  const lineData = useMemo(() => {
    if (selectedPlayer) {
      return selectedMatches
        .filter((match) => toNumber(match.nota) > 1)
        .map((match) => ({
          x: toNumber(match.jornada),
          y: toNumber(match.nota),
          rival: match.rival,
          rival_logo: match.rival_logo,
        }));
    }

    return teamRatingMatches
      .filter((match) => toNumber(match.nota_media_equipo) > 1)
      .map((match) => ({
        x: toNumber(match.jornada),
        y: toNumber(match.nota_media_equipo),
        rival: match.rival,
        rival_logo: match.rival_logo,
      }));
  }, [selectedMatches, selectedPlayer, teamRatingMatches]);

  const scatterData = useMemo(
    () =>
      players
        .filter((player) => toNumber(player.nota_media) > 0)
        .map((player) => ({
          x: toNumber(player.minutos),
          y: toNumber(player.nota_media),
          id: toNumber(player.id_jugador),
          name: player.nombre,
          initials: getInitials(player.nombre),
        })),
    [players],
  );
  const scatterOthers = scatterData.filter(
    (point) => point.id !== Number(selectedPlayerId),
  );
  const scatterSelected = scatterData.filter(
    (point) => point.id === Number(selectedPlayerId),
  );

  const goalData = useMemo(() => {
    if (!selectedPlayer) return makeGoalSlices(players, "nombre", "goles");

    return makeGoalSlices(
      selectedMatches.map((match) => ({
        label: `J${match.jornada} · ${shortName(match.rival, 10)}`,
        goles: match.goles,
      })),
      "label",
      "goles",
    );
  }, [players, selectedMatches, selectedPlayer]);

  const midfieldData = useMemo(() => {
    const source = selectedPlayer
      ? [selectedPlayer]
      : players.filter((player) => getPositionGroup(player.posicion) === "MED");
    return source
      .map((player) => ({
        x: shortName(player.nombre),
        y: toNumber(player.creacion),
      }))
      .sort((a, b) => b.y - a.y)
      .slice(0, 8);
  }, [players, selectedPlayer]);

  const defenseData = useMemo(() => {
    const source = selectedPlayer
      ? [selectedPlayer]
      : players.filter((player) => getPositionGroup(player.posicion) === "DEF");
    return source
      .map((player) => ({
        name: shortName(player.nombre),
        entradas: toNumber(player.entradas),
        intercepciones: toNumber(player.intercepciones),
        bloqueos: toNumber(player.bloqueos),
      }))
      .sort(
        (a, b) =>
          b.entradas +
          b.intercepciones +
          b.bloqueos -
          (a.entradas + a.intercepciones + a.bloqueos),
      )
      .slice(0, 7);
  }, [players, selectedPlayer]);

  const goalkeeperData = useMemo(() => {
    const source = selectedPlayer
      ? [selectedPlayer]
      : players.filter((player) => getPositionGroup(player.posicion) === "POR");
    return source.map((player) => ({
      name: shortName(player.nombre),
      paradas: toNumber(player.paradas),
      encajados: toNumber(player.goles_concedidos),
    }));
  }, [players, selectedPlayer]);

  const handleSeasonPress = (season) => {
    const seasonNumber = Number(season);
    if (
      !Number.isFinite(seasonNumber) ||
      seasonNumber === Number(activeSeason)
    ) {
      return;
    }
    setSelectedPlayerId(null);
    setScatterLegendVisible(false);
    setSelectedTemporada(seasonNumber);
    cargarDatos(seasonNumber);
  };

  const renderKpi = (item) => (
    <View key={item.label} style={styles.kpiCard}>
      <View style={[styles.kpiIcon, { backgroundColor: `${item.color}16` }]}>
        <Ionicons name={item.icon} size={18} color={item.color} />
      </View>
      <Text style={styles.kpiLabel}>{item.label}</Text>
      <Text style={styles.kpiValue} numberOfLines={2}>
        {item.value}
      </Text>
      <Text style={styles.kpiDetail} numberOfLines={1}>
        {item.detail}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingState}>
        <ActivityIndicator size="small" color={COLORS.blue} />
        <Text style={styles.loadingText}>
          Cargando análisis de jugadores...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loadingState}>
        <Ionicons name="alert-circle-outline" size={22} color={COLORS.muted} />
        <Text style={styles.loadingText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => cargarDatos(selectedTemporada)}
        >
          <Text style={styles.retryText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.filterCard}>
        <Text style={styles.filterTitle}>Temporada</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillRow}
        >
          {seasons.map((season) => {
            const active = Number(season) === Number(activeSeason);
            return (
              <TouchableOpacity
                key={`season-${season}`}
                style={[styles.pill, active && styles.pillActive]}
                onPress={() => handleSeasonPress(season)}
                activeOpacity={0.85}
              >
                <Text
                  style={[styles.pillText, active && styles.pillTextActive]}
                >
                  {season}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.filterDivider} />
        <View style={styles.playerFilterHeader}>
          <Text style={styles.filterTitle}>Jugador</Text>
          <Text style={styles.filterHint}>{players.length} en plantilla</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.playerRow}
        >
          <TouchableOpacity
            style={[
              styles.playerPill,
              !selectedPlayer && styles.playerPillActive,
            ]}
            onPress={() => setSelectedPlayerId(null)}
            activeOpacity={0.85}
          >
            <View style={styles.allPlayersIcon}>
              <Ionicons
                name="people"
                size={15}
                color={!selectedPlayer ? "#ffffff" : COLORS.blue}
              />
            </View>
            <Text
              style={[
                styles.playerPillText,
                !selectedPlayer && styles.playerPillTextActive,
              ]}
            >
              Toda la plantilla
            </Text>
          </TouchableOpacity>
          {players.map((player) => {
            const active =
              Number(player.id_jugador) === Number(selectedPlayerId);
            return (
              <TouchableOpacity
                key={`player-${player.id_jugador}`}
                style={[styles.playerPill, active && styles.playerPillActive]}
                onPress={() => setSelectedPlayerId(player.id_jugador)}
                activeOpacity={0.85}
              >
                {player.foto ? (
                  <Image
                    source={{ uri: player.foto }}
                    style={styles.playerPhoto}
                  />
                ) : (
                  <View style={styles.playerPhotoFallback}>
                    <Ionicons
                      name="person"
                      size={13}
                      color={active ? "#ffffff" : COLORS.muted}
                    />
                  </View>
                )}
                <Text
                  style={[
                    styles.playerPillText,
                    active && styles.playerPillTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {player.nombre || "Jugador"}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.dashboardHeader}>
        <View style={styles.dashboardHeaderIcon}>
          {selectedPlayer?.foto ? (
            <Image
              source={{ uri: selectedPlayer.foto }}
              style={styles.headerPhoto}
            />
          ) : payload?.equipo?.logo ? (
            <Image
              source={{ uri: payload.equipo.logo }}
              style={styles.headerLogo}
            />
          ) : (
            <Ionicons name="people-outline" size={28} color={COLORS.blue} />
          )}
        </View>
        <View style={styles.dashboardHeaderText}>
          <Text style={styles.dashboardTitle} numberOfLines={2}>
            {selectedPlayer?.nombre || "Rendimiento de la plantilla"}
          </Text>
          <Text style={styles.dashboardSubtitle} numberOfLines={2}>
            {selectedPlayer
              ? `${selectedPlayer.posicion || "Sin posición"} · Temporada ${activeSeason || "-"}`
              : `${payload?.equipo?.nombre_equipo || "Equipo"} · Temporada ${activeSeason || "-"}`}
          </Text>
        </View>
      </View>

      <View style={styles.kpiGrid}>{mainKpis.map(renderKpi)}</View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ratings por área</Text>
        <Text style={styles.sectionSubtitle}>
          {selectedPlayer
            ? "Perfil del jugador seleccionado en las seis dimensiones de rendimiento."
            : "Mejor jugador de la plantilla en cada dimensión de rendimiento."}
        </Text>
        <View style={styles.ratingGrid}>
          {ratingKpis.map((item) => (
            <View key={item.key} style={styles.ratingCard}>
              <View style={styles.ratingTitleRow}>
                <Ionicons name={item.icon} size={16} color={COLORS.blue} />
                <Text style={styles.ratingLabel}>{item.label}</Text>
              </View>
              <Text style={styles.ratingValue}>{item.value}</Text>
              <Text style={styles.ratingDetail} numberOfLines={1}>
                {item.detail}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Rating por partido</Text>
        <Text style={styles.sectionSubtitle}>
          {selectedPlayer
            ? `Evolución de ${selectedPlayer.nombre}. Solo cuentan notas superiores a 1.`
            : "Media de los jugadores del equipo por jornada. Solo cuentan notas superiores a 1."}
        </Text>
        {lineData.length > 0 ? (
          <ChartShell width={chartWidth}>
            <VictoryChart
              standalone={false}
              width={chartWidth}
              height={CHART_HEIGHT}
              padding={{ top: 42, left: 48, right: 18, bottom: 42 }}
              domain={{ y: [1, 10] }}
            >
              <VictoryAxis label="Jornada" style={axisStyle} />
              <VictoryAxis
                dependentAxis
                label="Rating"
                tickValues={[2, 4, 6, 8, 10]}
                style={axisStyle}
              />
              <VictoryLine
                data={lineData}
                interpolation="monotoneX"
                style={{ data: { stroke: COLORS.red, strokeWidth: 3 } }}
              />
              <VictoryScatter
                data={lineData}
                size={4}
                style={{
                  data: {
                    fill: COLORS.blue,
                    stroke: "#ffffff",
                    strokeWidth: 1.5,
                  },
                }}
              />
              <VictoryScatter
                data={lineData}
                size={0}
                dataComponent={<MatchLogoLabel />}
              />
            </VictoryChart>
          </ChartShell>
        ) : (
          <Text style={styles.emptyText}>
            No hay ratings válidos para esta selección.
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Minutos y nota media</Text>
        <Text style={styles.sectionSubtitle}>
          Cada punto representa un jugador. La selección actual se destaca en
          rojo.
        </Text>
        {scatterData.length > 0 ? (
          <>
            <ChartShell width={chartWidth}>
              <VictoryChart
                standalone={false}
                width={chartWidth}
                height={CHART_HEIGHT}
                padding={{ top: 18, left: 48, right: 18, bottom: 46 }}
              >
                <VictoryAxis label="Minutos" style={axisStyle} />
                <VictoryAxis
                  dependentAxis
                  label="Nota media"
                  style={axisStyle}
                />
                <VictoryScatter
                  data={scatterOthers}
                  size={4.5}
                  style={{ data: { fill: COLORS.blue, fillOpacity: 0.72 } }}
                />
                {scatterSelected.length > 0 ? (
                  <VictoryScatter
                    data={scatterSelected}
                    size={7}
                    style={{
                      data: {
                        fill: COLORS.red,
                        stroke: "#ffffff",
                        strokeWidth: 2,
                      },
                    }}
                  />
                ) : null}
                <VictoryScatter
                  data={scatterData}
                  size={0}
                  labels={({ datum }) => datum.initials}
                  labelComponent={
                    <VictoryLabel
                      dy={-9}
                      textAnchor="middle"
                      style={{
                        fill: colors.textStrong,
                        fontSize: 8,
                        fontWeight: "900",
                      }}
                    />
                  }
                />
              </VictoryChart>
            </ChartShell>
            <View style={styles.scatterLegend}>
              <TouchableOpacity
                style={styles.scatterLegendToggle}
                onPress={() => setScatterLegendVisible((visible) => !visible)}
                activeOpacity={0.85}
              >
                <Text style={styles.scatterLegendToggleText}>
                  {scatterLegendVisible
                    ? "Ocultar leyenda de jugadores"
                    : "Ver leyenda de jugadores"}
                </Text>
                <Ionicons
                  name={scatterLegendVisible ? "chevron-up" : "chevron-down"}
                  size={16}
                  color={COLORS.blue}
                />
              </TouchableOpacity>
              {scatterLegendVisible ? (
                <View style={styles.scatterLegendList}>
                  {scatterData.map((point) => {
                    const active = point.id === Number(selectedPlayerId);
                    return (
                      <View
                        key={`scatter-${point.id}`}
                        style={styles.scatterLegendRow}
                      >
                        <View
                          style={[
                            styles.initialsBadge,
                            active && styles.initialsBadgeActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.initialsBadgeText,
                              active && styles.initialsBadgeTextActive,
                            ]}
                          >
                            {point.initials}
                          </Text>
                        </View>
                        <Text
                          style={styles.scatterLegendName}
                          numberOfLines={1}
                        >
                          {point.name}
                        </Text>
                        <Text style={styles.scatterLegendMeta}>
                          {formatInteger(point.x)} min · {formatRating(point.y)}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              ) : null}
            </View>
          </>
        ) : (
          <Text style={styles.emptyText}>
            No hay minutos y ratings disponibles.
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {selectedPlayer ? "Goles por partido" : "Reparto de goles del equipo"}
        </Text>
        <Text style={styles.sectionSubtitle}>
          {selectedPlayer
            ? `Partidos en los que marcó ${selectedPlayer.nombre}.`
            : "Peso de cada goleador sobre el total de la plantilla."}
        </Text>
        {goalData.length > 0 ? (
          <ChartShell width={chartWidth} height={300}>
            <VictoryPie
              standalone={false}
              width={chartWidth}
              height={300}
              data={goalData}
              colorScale={PIE_COLORS}
              innerRadius={45}
              padAngle={2}
              labels={({ datum }) => `${datum.y}`}
              style={{
                labels: { fill: colors.text, fontSize: 11, fontWeight: "900" },
              }}
            />
          </ChartShell>
        ) : (
          <Text style={styles.emptyText}>
            No hay goles para esta selección.
          </Text>
        )}
        {goalData.length > 0 ? (
          <View style={styles.goalLegend}>
            {goalData.map((item, index) => (
              <View key={`goal-${item.x}`} style={styles.goalLegendItem}>
                <View
                  style={[
                    styles.goalLegendDot,
                    {
                      backgroundColor: PIE_COLORS[index % PIE_COLORS.length],
                    },
                  ]}
                />
                <Text style={styles.goalLegendName} numberOfLines={1}>
                  {item.x}
                </Text>
                <Text style={styles.goalLegendValue}>
                  {item.y} {item.y === 1 ? "gol" : "goles"}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {selectedPlayer
            ? "Creación del jugador"
            : "Creación de los centrocampistas"}
        </Text>
        <Text style={styles.sectionSubtitle}>
          Rating de creación para medir la aportación en la construcción del
          juego.
        </Text>
        {midfieldData.length > 0 ? (
          <ChartShell width={chartWidth}>
            <VictoryChart
              standalone={false}
              width={chartWidth}
              height={CHART_HEIGHT}
              domain={{ y: [0, 10] }}
              domainPadding={{ x: 16 }}
              padding={{ top: 18, left: 42, right: 16, bottom: 66 }}
            >
              <VictoryAxis
                style={{
                  ...axisStyle,
                  tickLabels: {
                    ...axisStyle.tickLabels,
                    angle: -32,
                    textAnchor: "end",
                  },
                }}
              />
              <VictoryAxis
                dependentAxis
                tickValues={[0, 2, 4, 6, 8, 10]}
                style={axisStyle}
              />
              <VictoryBar
                data={midfieldData}
                barRatio={0.65}
                style={{ data: { fill: COLORS.purple } }}
              />
            </VictoryChart>
          </ChartShell>
        ) : (
          <Text style={styles.emptyText}>
            No hay datos de creación disponibles.
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {selectedPlayer
            ? "Acciones defensivas del jugador"
            : "Actividad de los defensas"}
        </Text>
        <Text style={styles.sectionSubtitle}>
          Entradas, intercepciones y bloqueos acumulados en la temporada.
        </Text>
        {defenseData.length > 0 ? (
          <>
            <ChartShell width={chartWidth}>
              <VictoryChart
                standalone={false}
                width={chartWidth}
                height={CHART_HEIGHT}
                domainPadding={{ x: 18, y: 8 }}
                padding={{ top: 18, left: 44, right: 14, bottom: 66 }}
              >
                <VictoryAxis
                  style={{
                    ...axisStyle,
                    tickLabels: {
                      ...axisStyle.tickLabels,
                      angle: -32,
                      textAnchor: "end",
                    },
                  }}
                />
                <VictoryAxis dependentAxis style={axisStyle} />
                <VictoryGroup
                  offset={8}
                  colorScale={[COLORS.blue, COLORS.green, COLORS.orange]}
                >
                  <VictoryBar
                    data={defenseData.map((item) => ({
                      x: item.name,
                      y: item.entradas,
                    }))}
                    barWidth={7}
                  />
                  <VictoryBar
                    data={defenseData.map((item) => ({
                      x: item.name,
                      y: item.intercepciones,
                    }))}
                    barWidth={7}
                  />
                  <VictoryBar
                    data={defenseData.map((item) => ({
                      x: item.name,
                      y: item.bloqueos,
                    }))}
                    barWidth={7}
                  />
                </VictoryGroup>
              </VictoryChart>
            </ChartShell>
            <Legend
              items={[
                { label: "Entradas", color: COLORS.blue },
                { label: "Intercepciones", color: COLORS.green },
                { label: "Bloqueos", color: COLORS.orange },
              ]}
            />
          </>
        ) : (
          <Text style={styles.emptyText}>
            No hay acciones defensivas disponibles.
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {selectedPlayer
            ? "Rendimiento bajo palos"
            : "Rendimiento de porteros"}
        </Text>
        <Text style={styles.sectionSubtitle}>
          Comparación entre paradas realizadas y goles encajados.
        </Text>
        {goalkeeperData.length > 0 ? (
          <>
            <ChartShell width={chartWidth}>
              <VictoryChart
                standalone={false}
                width={chartWidth}
                height={CHART_HEIGHT}
                domainPadding={{ x: 34, y: 8 }}
                padding={{ top: 18, left: 44, right: 14, bottom: 58 }}
              >
                <VictoryAxis style={axisStyle} />
                <VictoryAxis dependentAxis style={axisStyle} />
                <VictoryGroup
                  offset={16}
                  colorScale={[COLORS.green, COLORS.red]}
                >
                  <VictoryBar
                    data={goalkeeperData.map((item) => ({
                      x: item.name,
                      y: item.paradas,
                    }))}
                    barWidth={14}
                  />
                  <VictoryBar
                    data={goalkeeperData.map((item) => ({
                      x: item.name,
                      y: item.encajados,
                    }))}
                    barWidth={14}
                  />
                </VictoryGroup>
              </VictoryChart>
            </ChartShell>
            <Legend
              items={[
                { label: "Paradas", color: COLORS.green },
                { label: "Goles encajados", color: COLORS.red },
              ]}
            />
          </>
        ) : (
          <Text style={styles.emptyText}>
            No hay datos de portería disponibles.
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 32 },
  loadingState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
    padding: 24,
  },
  loadingText: {
    marginTop: 9,
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  retryButton: {
    marginTop: 14,
    backgroundColor: COLORS.blue,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  retryText: { color: "#ffffff", fontSize: 13, fontWeight: "800" },
  filterCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
  },
  filterTitle: { color: COLORS.text, fontSize: 13, fontWeight: "900" },
  filterHint: { color: COLORS.muted, fontSize: 11, fontWeight: "700" },
  filterDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 12,
  },
  playerFilterHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pillRow: { gap: 8, paddingTop: 8, paddingRight: 6 },
  pill: {
    minWidth: 72,
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.soft,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pillActive: { backgroundColor: COLORS.blue, borderColor: COLORS.blue },
  pillText: { color: COLORS.text, fontSize: 12, fontWeight: "800" },
  pillTextActive: { color: "#ffffff" },
  playerRow: { gap: 8, paddingTop: 9, paddingRight: 6 },
  playerPill: {
    maxWidth: 190,
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.soft,
    paddingLeft: 5,
    paddingRight: 12,
    paddingVertical: 5,
  },
  playerPillActive: { backgroundColor: COLORS.blue, borderColor: COLORS.blue },
  playerPillText: {
    flexShrink: 1,
    marginLeft: 7,
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "800",
  },
  playerPillTextActive: { color: "#ffffff" },
  playerPhoto: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#e7eef6",
  },
  playerPhotoFallback: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e7eef6",
  },
  allPlayersIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  dashboardHeader: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    shadowColor: "#0d2b4a",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  dashboardHeaderIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e9f1f8",
    overflow: "hidden",
  },
  headerPhoto: { width: 58, height: 58, resizeMode: "cover" },
  headerLogo: { width: 44, height: 44, resizeMode: "contain" },
  dashboardHeaderText: { flex: 1, marginLeft: 12 },
  dashboardTitle: { color: COLORS.text, fontSize: 19, fontWeight: "900" },
  dashboardSubtitle: {
    marginTop: 4,
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "600",
  },
  kpiGrid: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
  },
  kpiCard: {
    flexGrow: 1,
    flexBasis: 104,
    minWidth: "30%",
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
  },
  kpiIcon: {
    width: 31,
    height: 31,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 9,
  },
  kpiLabel: { color: COLORS.muted, fontSize: 11, fontWeight: "800" },
  kpiValue: {
    minHeight: 36,
    marginTop: 5,
    color: COLORS.text,
    fontSize: 15,
    lineHeight: 18,
    fontWeight: "900",
  },
  kpiDetail: {
    marginTop: 5,
    color: COLORS.blue,
    fontSize: 10,
    fontWeight: "800",
  },
  section: {
    marginTop: 14,
    backgroundColor: COLORS.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
  },
  sectionTitle: { color: COLORS.text, fontSize: 16, fontWeight: "900" },
  sectionSubtitle: {
    marginTop: 4,
    marginBottom: 8,
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  ratingGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 9,
  },
  ratingCard: {
    width: "48.5%",
    backgroundColor: COLORS.soft,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 11,
  },
  ratingTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  ratingLabel: { color: COLORS.muted, fontSize: 11, fontWeight: "800" },
  ratingValue: {
    marginTop: 8,
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "900",
  },
  ratingDetail: {
    marginTop: 3,
    color: COLORS.blue,
    fontSize: 10,
    fontWeight: "700",
  },
  chartBox: { alignSelf: "center", overflow: "hidden" },
  emptyText: {
    marginTop: 7,
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: "600",
  },
  legendRow: {
    marginTop: 3,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 14,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 9, height: 9, borderRadius: 5 },
  legendText: { color: COLORS.muted, fontSize: 11, fontWeight: "700" },
  scatterLegend: {
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 10,
  },
  scatterLegendToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.soft,
    borderRadius: 11,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  scatterLegendToggleText: {
    color: COLORS.blue,
    fontSize: 12,
    fontWeight: "800",
  },
  scatterLegendList: { marginTop: 9, gap: 6 },
  scatterLegendRow: {
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 7,
  },
  initialsBadge: {
    width: 30,
    height: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e9f1f8",
  },
  initialsBadgeActive: { backgroundColor: COLORS.red },
  initialsBadgeText: { color: COLORS.blue, fontSize: 9, fontWeight: "900" },
  initialsBadgeTextActive: { color: "#ffffff" },
  scatterLegendName: {
    flex: 1,
    marginLeft: 9,
    color: COLORS.text,
    fontSize: 11,
    fontWeight: "800",
  },
  scatterLegendMeta: {
    marginLeft: 8,
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: "800",
  },
  goalLegend: {
    marginTop: 2,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  goalLegendItem: {
    width: "48.5%",
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.soft,
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  goalLegendDot: { width: 9, height: 9, borderRadius: 5 },
  goalLegendName: {
    flex: 1,
    marginLeft: 7,
    color: COLORS.text,
    fontSize: 10,
    fontWeight: "800",
  },
  goalLegendValue: {
    marginLeft: 5,
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: "800",
  },
});
