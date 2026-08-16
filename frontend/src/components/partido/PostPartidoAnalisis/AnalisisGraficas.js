import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import Svg from "react-native-svg";
import {
  VictoryArea,
  VictoryAxis,
  VictoryBar,
  VictoryChart,
  VictoryGroup,
  VictoryLabel,
  VictoryPolarAxis,
  VictoryScatter,
  VictoryStack,
} from "victory-native";
import { useTheme } from "../../../theme/ThemeContext";

const COLORS = {
  local: "#1f6fa7",
  visitante: "#e20613",
  gold: "#f2b705",
  green: "#168a4a",
  orange: "#d97a1f",
  text: "#0f2743",
  muted: "#5a7189",
  border: "#d9e5f0",
  background: "#f4f8fc",
  card: "#ffffff",
};

const CHART_HEIGHT = 270;
const TALL_CHART_HEIGHT = 320;
const IMPACT_MODES = [
  { key: "ataque", label: "Ataque" },
  { key: "creacion", label: "Creación" },
  { key: "defensa", label: "Defensa" },
];

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const splitTwoLines = (value) => {
  const parts = String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length <= 1) return parts[0] || "-";
  return `${parts[0]}\n${parts[parts.length - 1]}`;
};

const getInitials = (value) =>
  String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "-";

const SCATTER_LABEL_OFFSETS = [
  { dx: 0, dy: -11 },
  { dx: 12, dy: -7 },
  { dx: -12, dy: -7 },
  { dx: 0, dy: 13 },
  { dx: 14, dy: 8 },
  { dx: -14, dy: 8 },
  { dx: 18, dy: 0 },
  { dx: -18, dy: 0 },
];

const makePointKey = (x, y) =>
  `${Number(x).toFixed(2)}|${Number(y).toFixed(2)}`;

const withScatterLabelOffsets = (items, getX, getY) => {
  const groupSizes = new Map();
  const groupIndexes = new Map();

  items.forEach((item) => {
    const key = makePointKey(getX(item), getY(item));
    groupSizes.set(key, (groupSizes.get(key) || 0) + 1);
  });

  return items.map((item) => {
    const key = makePointKey(getX(item), getY(item));
    const groupSize = groupSizes.get(key) || 1;
    const index = groupIndexes.get(key) || 0;
    const offset =
      groupSize > 1
        ? SCATTER_LABEL_OFFSETS[index % SCATTER_LABEL_OFFSETS.length]
        : SCATTER_LABEL_OFFSETS[0];

    groupIndexes.set(key, index + 1);

    return {
      ...item,
      labelDx: offset.dx,
      labelDy: offset.dy,
    };
  });
};

const formatValue = (value, suffix = "") => {
  const n = Number(value);
  if (!Number.isFinite(n)) return "-";
  const text = Number.isInteger(n) ? `${n}` : n.toFixed(1);
  return `${text}${suffix}`;
};

const getTeamKey = (idEquipo, partidoInfo) =>
  Number(idEquipo) === Number(partidoInfo?.id_local) ? "local" : "visitante";

const getTeamColor = (idEquipo, partidoInfo) =>
  getTeamKey(idEquipo, partidoInfo) === "local"
    ? COLORS.local
    : COLORS.visitante;

const scoreAtaque = (jugador) =>
  toNumber(jugador.goles) * 4 +
  toNumber(jugador.asistencias) * 3 +
  toNumber(jugador.tiros_a_puerta) * 1.5 +
  toNumber(jugador.regates);

const scoreCreacion = (jugador) =>
  toNumber(jugador.pases_clave) * 3 +
  toNumber(jugador.asistencias) * 4 +
  toNumber(jugador.pases_totales) * 0.03 +
  toNumber(jugador.precision_pases) * 0.03;

const scoreDefensa = (jugador) =>
  toNumber(jugador.entradas) +
  toNumber(jugador.bloqueos) +
  toNumber(jugador.intercepciones) +
  toNumber(jugador.duelos_ganados) * 0.5;

const getImpactScore = (jugador, mode) => {
  if (mode === "ataque") return scoreAtaque(jugador);
  if (mode === "creacion") return scoreCreacion(jugador);
  return scoreDefensa(jugador);
};

const normalizePair = (localValue, visitanteValue) => {
  const max = Math.max(toNumber(localValue), toNumber(visitanteValue), 1);
  return {
    local: (toNumber(localValue) / max) * 100,
    visitante: (toNumber(visitanteValue) / max) * 100,
  };
};

const ChartShell = ({ width, height, children }) => (
  <View style={[styles.chartBox, { width, height }]}>
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {children}
    </Svg>
  </View>
);

const EmptyChart = ({ text }) => (
  <View style={styles.emptyBox}>
    <Text style={styles.emptyText}>{text}</Text>
  </View>
);

const ChartCard = ({ title, subtitle, children }) => (
  <View style={styles.card}>
    <Text style={styles.cardTitle}>{title}</Text>
    {!!subtitle && <Text style={styles.cardSubtitle}>{subtitle}</Text>}
    {children}
  </View>
);

export default function AnalisisGraficas({ route }) {
  const { colors } = useTheme();
  const CHART_LABEL_STYLE = useMemo(
    () => ({ fill: () => colors.text, fontSize: 8, fontWeight: "800" }),
    [colors],
  );
  const POINT_LABEL_STYLE = useMemo(
    () => ({ fill: () => colors.text, fontSize: 8, fontWeight: "900" }),
    [colors],
  );
  const { id_partido, partidoInfo, datosEquipo } = route.params || {};
  const { width } = useWindowDimensions();
  const screenWidth = Number.isFinite(Number(width)) ? Number(width) : 360;
  const chartWidth = Math.max(280, Math.min(screenWidth - 54, 720));

  const [jugadores, setJugadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [impactMode, setImpactMode] = useState("ataque");

  useEffect(() => {
    const cargarJugadores = async () => {
      try {
        setLoading(true);
        setError("");

        if (!id_partido) {
          setJugadores([]);
          setError("Partido inválido");
          return;
        }

        const response = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/partidos/${id_partido}/stats_jugadores`,
        );

        if (!response.ok) {
          throw new Error(
            "No se pudieron cargar las estadísticas de jugadores",
          );
        }

        const data = await response.json();
        setJugadores(Array.isArray(data) ? data : []);
      } catch (e) {
        setJugadores([]);
        setError("No se pudieron obtener las estadísticas de jugadores");
      } finally {
        setLoading(false);
      }
    };

    cargarJugadores();
  }, [id_partido]);

  const [local, visitante] = useMemo(() => {
    if (!Array.isArray(datosEquipo) || datosEquipo.length < 2) {
      return [null, null];
    }

    return [datosEquipo[0], datosEquipo[1]];
  }, [datosEquipo]);

  const jugadoresValidos = useMemo(
    () => jugadores.filter((jugador) => toNumber(jugador.minutos) > 0),
    [jugadores],
  );

  const axisStyle = {
    axis: { stroke: colors.border },
    axisLabel: {
      fill: () => colors.textMuted,
      fontSize: 10,
      fontWeight: "700",
      padding: 28,
    },
    tickLabels: { fill: () => colors.textMuted, fontSize: 9, padding: 4 },
    grid: { stroke: colors.border, strokeDasharray: "4,4" },
  };

  const renderLegend = () => (
    <View style={styles.legendRow}>
      <View style={styles.legendItem}>
        <View style={[styles.legendDot, { backgroundColor: COLORS.local }]} />
        <Text style={styles.legendText}>
          {partidoInfo?.equipo_local || local?.nombre_equipo || "Local"}
        </Text>
      </View>
      <View style={styles.legendItem}>
        <View
          style={[styles.legendDot, { backgroundColor: COLORS.visitante }]}
        />
        <Text style={styles.legendText}>
          {partidoInfo?.equipo_visitante ||
            visitante?.nombre_equipo ||
            "Visitante"}
        </Text>
      </View>
    </View>
  );

  const renderAttributeLegend = (items) => (
    <View style={styles.legendRow}>
      {items.map((item) => (
        <View key={item.label} style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: item.color }]} />
          <Text style={styles.legendText}>{item.label}</Text>
        </View>
      ))}
    </View>
  );

  const renderPlayerLegend = (players, getMeta) => (
    <View style={styles.playerLegend}>
      {players.map((jugador) => (
        <View key={jugador.id_jugador} style={styles.playerLegendItem}>
          <View
            style={[
              styles.initialsBadge,
              { backgroundColor: getTeamColor(jugador.id_equipo, partidoInfo) },
            ]}
          >
            <Text style={styles.initialsBadgeText}>
              {getInitials(jugador.nombre)}
            </Text>
          </View>
          <Text style={styles.playerLegendName} numberOfLines={1}>
            {jugador.nombre}
          </Text>
          {!!getMeta && (
            <Text style={styles.playerLegendMeta}>{getMeta(jugador)}</Text>
          )}
        </View>
      ))}
    </View>
  );

  const renderComparativaEquipos = () => {
    if (!local || !visitante) {
      return (
        <EmptyChart text="No hay estadísticas de equipos para comparar." />
      );
    }

    const metrics = [
      { key: "posesion", label: "Pos.", suffix: "%" },
      { key: "tiros_totales", label: "Tiros" },
      { key: "tiros_a_puerta", label: "Puerta" },
      { key: "pases_totales", label: "Pases" },
      { key: "pct_pases_acertados", label: "Prec.", suffix: "%" },
      { key: "corners", label: "Corners" },
      { key: "faltas_cometidas", label: "Faltas" },
    ];

    const dataLocal = metrics.map((metric) => {
      const normalized = normalizePair(
        local[metric.key],
        visitante[metric.key],
      );
      return {
        x: metric.label,
        y: normalized.local,
        raw: formatValue(local[metric.key], metric.suffix),
      };
    });
    const dataVisitante = metrics.map((metric) => {
      const normalized = normalizePair(
        local[metric.key],
        visitante[metric.key],
      );
      return {
        x: metric.label,
        y: normalized.visitante,
        raw: formatValue(visitante[metric.key], metric.suffix),
      };
    });

    return (
      <>
        {renderLegend()}
        <ChartShell width={chartWidth} height={CHART_HEIGHT}>
          <VictoryChart
            standalone={false}
            width={chartWidth}
            height={CHART_HEIGHT}
            padding={{ top: 18, left: 38, right: 18, bottom: 58 }}
            domain={{ y: [0, 115] }}
            domainPadding={{ x: 24 }}
          >
            <VictoryAxis
              style={{
                ...axisStyle,
                tickLabels: {
                  fill: () => colors.text,
                  fontSize: 8,
                  fontWeight: "800",
                  padding: 8,
                  angle: -24,
                },
              }}
            />
            <VictoryAxis
              dependentAxis
              tickValues={[0, 25, 50, 75, 100]}
              style={axisStyle}
            />
            <VictoryGroup offset={14}>
              <VictoryBar
                data={dataLocal}
                style={{ data: { fill: COLORS.local } }}
                labels={({ datum }) => datum.raw}
                labelComponent={
                  <VictoryLabel dy={-5} style={CHART_LABEL_STYLE} />
                }
              />
              <VictoryBar
                data={dataVisitante}
                style={{ data: { fill: COLORS.visitante } }}
                labels={({ datum }) => datum.raw}
                labelComponent={
                  <VictoryLabel dy={-5} style={CHART_LABEL_STYLE} />
                }
              />
            </VictoryGroup>
          </VictoryChart>
        </ChartShell>
      </>
    );
  };

  const renderRadarDominio = () => {
    if (!local || !visitante) {
      return <EmptyChart text="No hay datos suficientes para el radar." />;
    }

    const metrics = [
      { key: "posesion", label: "Posesión" },
      { key: "pct_pases_acertados", label: "Pase" },
      { key: "tiros_totales", label: "Tiros" },
      { key: "tiros_a_puerta", label: "Puerta" },
      { key: "goles_esperados", label: "xG" },
      { key: "corners", label: "Corners" },
    ];

    const localData = metrics.map((metric) => {
      const normalized = normalizePair(
        local[metric.key],
        visitante[metric.key],
      );
      return { x: metric.label, y: normalized.local };
    });
    const visitanteData = metrics.map((metric) => {
      const normalized = normalizePair(
        local[metric.key],
        visitante[metric.key],
      );
      return { x: metric.label, y: normalized.visitante };
    });

    return (
      <>
        {renderLegend()}
        <ChartShell width={chartWidth} height={CHART_HEIGHT}>
          <VictoryChart
            standalone={false}
            polar
            width={chartWidth}
            height={CHART_HEIGHT}
            padding={{ top: 26, left: 46, right: 46, bottom: 26 }}
            domain={{ y: [0, 100] }}
          >
            <VictoryPolarAxis
              labelPlacement="vertical"
              tickFormat={(tick) => tick}
              style={{
                axis: { stroke: COLORS.border },
                grid: { stroke: COLORS.border },
                tickLabels: {
                  fill: () => colors.text,
                  fontSize: 9,
                  fontWeight: "700",
                  padding: 10,
                },
              }}
            />
            <VictoryPolarAxis
              dependentAxis
              tickValues={[25, 50, 75, 100]}
              tickFormat={() => ""}
              style={{
                axis: { stroke: "transparent" },
                grid: { stroke: "#edf3f8" },
              }}
            />
            <VictoryArea
              data={localData}
              style={{
                data: {
                  fill: COLORS.local,
                  fillOpacity: 0.22,
                  stroke: COLORS.local,
                  strokeWidth: 2,
                },
              }}
            />
            <VictoryArea
              data={visitanteData}
              style={{
                data: {
                  fill: COLORS.visitante,
                  fillOpacity: 0.18,
                  stroke: COLORS.visitante,
                  strokeWidth: 2,
                },
              }}
            />
          </VictoryChart>
        </ChartShell>
      </>
    );
  };

  const renderFinalizacion = () => {
    if (!local || !visitante) {
      return <EmptyChart text="No hay datos de finalización." />;
    }

    const metrics = [
      { key: "tiros_totales", label: "Tiros" },
      { key: "tiros_a_puerta", label: "Puerta" },
      { key: "goles_esperados", label: "xG" },
    ];

    return (
      <>
        {renderLegend()}
        <ChartShell width={chartWidth} height={CHART_HEIGHT}>
          <VictoryChart
            standalone={false}
            width={chartWidth}
            height={CHART_HEIGHT}
            padding={{ top: 18, left: 40, right: 18, bottom: 44 }}
            domainPadding={{ x: 32, y: 12 }}
          >
            <VictoryAxis style={axisStyle} />
            <VictoryAxis dependentAxis style={axisStyle} />
            <VictoryGroup offset={18}>
              <VictoryBar
                data={metrics.map((metric) => ({
                  x: metric.label,
                  y: toNumber(local[metric.key]),
                }))}
                style={{ data: { fill: COLORS.local } }}
                labels={({ datum }) => formatValue(datum.y)}
                labelComponent={
                  <VictoryLabel dy={-5} style={CHART_LABEL_STYLE} />
                }
              />
              <VictoryBar
                data={metrics.map((metric) => ({
                  x: metric.label,
                  y: toNumber(visitante[metric.key]),
                }))}
                style={{ data: { fill: COLORS.visitante } }}
                labels={({ datum }) => formatValue(datum.y)}
                labelComponent={
                  <VictoryLabel dy={-5} style={CHART_LABEL_STYLE} />
                }
              />
            </VictoryGroup>
          </VictoryChart>
        </ChartShell>
      </>
    );
  };

  const renderEficaciaOfensiva = () => {
    const data = jugadoresValidos
      .filter(
        (jugador) =>
          toNumber(jugador.tiros_totales) > 1 || toNumber(jugador.goles) > 0,
      )
      .sort(
        (a, b) =>
          scoreAtaque(b) - scoreAtaque(a) ||
          toNumber(b.nota) - toNumber(a.nota),
      )
      .slice(0, 16);

    if (data.length === 0) {
      return <EmptyChart text="No hay jugadores ofensivos con datos." />;
    }

    const maxTiros = Math.max(
      ...data.map((jugador) => toNumber(jugador.tiros_totales)),
      4,
    );
    const maxGoles = Math.max(
      ...data.map((jugador) => toNumber(jugador.goles)),
      1,
    );
    const labelData = withScatterLabelOffsets(
      data,
      (jugador) => toNumber(jugador.tiros_totales),
      (jugador) => toNumber(jugador.goles),
    );

    return (
      <>
        <ChartShell width={chartWidth} height={CHART_HEIGHT}>
          <VictoryChart
            standalone={false}
            width={chartWidth}
            height={CHART_HEIGHT}
            padding={{ top: 20, left: 44, right: 24, bottom: 46 }}
            domain={{ x: [0, maxTiros + 2], y: [0, maxGoles + 1] }}
          >
            <VictoryAxis label="Tiros" style={axisStyle} />
            <VictoryAxis dependentAxis label="Goles" style={axisStyle} />
            <VictoryScatter
              data={data}
              x={(datum) => toNumber(datum.tiros_totales)}
              y={(datum) => toNumber(datum.goles)}
              size={(datum) => clamp(3 + toNumber(datum.tiros_a_puerta), 4, 9)}
              style={{
                data: {
                  fill: ({ datum }) =>
                    getTeamColor(datum.id_equipo, partidoInfo),
                  opacity: ({ datum }) =>
                    toNumber(datum.nota) >= 7 ? 0.95 : 0.72,
                },
              }}
            />
            <VictoryScatter
              data={labelData}
              x={(datum) => toNumber(datum.tiros_totales)}
              y={(datum) => toNumber(datum.goles)}
              size={0}
              labels={({ datum }) => getInitials(datum.nombre)}
              labelComponent={
                <VictoryLabel
                  dx={({ datum }) => datum.labelDx}
                  dy={({ datum }) => datum.labelDy}
                  style={POINT_LABEL_STYLE}
                />
              }
            />
          </VictoryChart>
        </ChartShell>
        {renderPlayerLegend(
          data,
          (jugador) =>
            `${formatValue(jugador.goles)} gol / ${formatValue(
              jugador.tiros_totales,
            )} tiros`,
        )}
      </>
    );
  };

  const renderCreadores = () => {
    const data = jugadoresValidos
      .map((jugador) => ({ ...jugador, score: scoreCreacion(jugador) }))
      .filter((jugador) => jugador.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 7);

    if (data.length === 0) {
      return (
        <EmptyChart text="No hay métricas de creación para este partido." />
      );
    }

    const chartData = [...data].reverse();

    return (
      <ChartShell width={chartWidth} height={TALL_CHART_HEIGHT}>
        <VictoryChart
          standalone={false}
          horizontal
          width={chartWidth}
          height={TALL_CHART_HEIGHT}
          padding={{ top: 18, left: 94, right: 34, bottom: 34 }}
          domainPadding={{ y: 12 }}
        >
          <VictoryAxis style={axisStyle} />
          <VictoryAxis dependentAxis style={axisStyle} />
          <VictoryBar
            data={chartData.map((jugador) => ({
              x: splitTwoLines(jugador.nombre),
              y: jugador.score,
              fill: getTeamColor(jugador.id_equipo, partidoInfo),
              label: `${toNumber(jugador.pases_clave)} PC`,
            }))}
            style={{ data: { fill: ({ datum }) => datum.fill } }}
            labels={({ datum }) => datum.label}
            labelComponent={<VictoryLabel dx={8} style={CHART_LABEL_STYLE} />}
          />
        </VictoryChart>
      </ChartShell>
    );
  };

  const renderMurallaDefensiva = () => {
    const data = jugadoresValidos
      .map((jugador) => ({
        ...jugador,
        totalDefensivo:
          toNumber(jugador.entradas) +
          toNumber(jugador.bloqueos) +
          toNumber(jugador.intercepciones),
      }))
      .filter((jugador) => jugador.totalDefensivo > 0)
      .sort((a, b) => b.totalDefensivo - a.totalDefensivo)
      .slice(0, 7);

    if (data.length === 0) {
      return <EmptyChart text="No hay acciones defensivas registradas." />;
    }

    const barData = (key) =>
      data.map((jugador) => ({
        x: splitTwoLines(jugador.nombre),
        y: toNumber(jugador[key]),
      }));

    return (
      <>
        {renderAttributeLegend([
          { label: "Entradas", color: COLORS.local },
          { label: "Bloqueos", color: COLORS.gold },
          { label: "Intercepciones", color: COLORS.green },
        ])}
        <ChartShell width={chartWidth} height={TALL_CHART_HEIGHT}>
          <VictoryChart
            standalone={false}
            width={chartWidth}
            height={TALL_CHART_HEIGHT}
            padding={{ top: 20, left: 38, right: 18, bottom: 74 }}
            domainPadding={{ x: 24, y: 10 }}
          >
            <VictoryAxis
              style={{
                ...axisStyle,
                tickLabels: {
                  fill: () => colors.textMuted,
                  fontSize: 8,
                  padding: 8,
                },
              }}
            />
            <VictoryAxis dependentAxis style={axisStyle} />
            <VictoryStack
              colorScale={[COLORS.local, COLORS.gold, COLORS.green]}
            >
              <VictoryBar data={barData("entradas")} />
              <VictoryBar data={barData("bloqueos")} />
              <VictoryBar data={barData("intercepciones")} />
            </VictoryStack>
          </VictoryChart>
        </ChartShell>
      </>
    );
  };

  const renderDuelosRegates = () => {
    const data = jugadoresValidos
      .filter(
        (jugador) =>
          toNumber(jugador.regates) > 0 || toNumber(jugador.duelos_totales) > 0,
      )
      .sort(
        (a, b) =>
          toNumber(b.duelos_ganados) +
          toNumber(b.regates) -
          (toNumber(a.duelos_ganados) + toNumber(a.regates)),
      )
      .slice(0, 18);

    if (data.length === 0) {
      return <EmptyChart text="No hay datos de duelos y regates." />;
    }

    const maxRegates = Math.max(
      ...data.map((jugador) => toNumber(jugador.regates)),
      2,
    );
    const maxDuelos = Math.max(
      ...data.map((jugador) => toNumber(jugador.duelos_ganados)),
      2,
    );
    const labelData = withScatterLabelOffsets(
      data.slice(0, 12),
      (jugador) => toNumber(jugador.regates),
      (jugador) => toNumber(jugador.duelos_ganados),
    );

    return (
      <>
        <ChartShell width={chartWidth} height={CHART_HEIGHT}>
          <VictoryChart
            standalone={false}
            width={chartWidth}
            height={CHART_HEIGHT}
            padding={{ top: 20, left: 44, right: 24, bottom: 46 }}
            domain={{ x: [0, maxRegates + 1], y: [0, maxDuelos + 1] }}
          >
            <VictoryAxis label="Regates" style={axisStyle} />
            <VictoryAxis
              dependentAxis
              label="Duelos ganados"
              style={axisStyle}
            />
            <VictoryScatter
              data={data}
              x={(datum) => toNumber(datum.regates)}
              y={(datum) => toNumber(datum.duelos_ganados)}
              size={(datum) =>
                clamp(3 + toNumber(datum.duelos_totales) * 0.25, 4, 10)
              }
              style={{
                data: {
                  fill: ({ datum }) =>
                    getTeamColor(datum.id_equipo, partidoInfo),
                  opacity: 0.78,
                },
              }}
            />
            <VictoryScatter
              data={labelData}
              x={(datum) => toNumber(datum.regates)}
              y={(datum) => toNumber(datum.duelos_ganados)}
              size={0}
              labels={({ datum }) => getInitials(datum.nombre)}
              labelComponent={
                <VictoryLabel
                  dx={({ datum }) => datum.labelDx}
                  dy={({ datum }) => datum.labelDy}
                  style={POINT_LABEL_STYLE}
                />
              }
            />
          </VictoryChart>
        </ChartShell>
        {renderPlayerLegend(
          labelData,
          (jugador) =>
            `${formatValue(jugador.regates)} reg. / ${formatValue(
              jugador.duelos_ganados,
            )} duelos`,
        )}
      </>
    );
  };

  const renderNotasPorPosicion = () => {
    const positions = ["P", "DF", "M", "DL"];
    const data = jugadoresValidos
      .filter((jugador) => positions.includes(jugador.posicion))
      .map((jugador) => ({
        ...jugador,
        posIndex: positions.indexOf(jugador.posicion) + 1,
        notaValue: toNumber(jugador.nota),
      }));

    if (data.length === 0) {
      return <EmptyChart text="No hay notas de jugadores disponibles." />;
    }

    const destacados = [...data]
      .sort((a, b) => b.notaValue - a.notaValue)
      .slice(0, 8);
    const labelData = withScatterLabelOffsets(
      destacados,
      (jugador) => jugador.posIndex,
      (jugador) => jugador.notaValue,
    );

    return (
      <>
        <ChartShell width={chartWidth} height={CHART_HEIGHT}>
          <VictoryChart
            standalone={false}
            width={chartWidth}
            height={CHART_HEIGHT}
            padding={{ top: 20, left: 44, right: 20, bottom: 46 }}
            domain={{ x: [0.5, 4.5], y: [3, 10] }}
          >
            <VictoryAxis
              tickValues={[1, 2, 3, 4]}
              tickFormat={(tick) => positions[tick - 1]}
              style={axisStyle}
            />
            <VictoryAxis
              dependentAxis
              label="Nota"
              tickValues={[3, 4, 5, 6, 7, 8, 9, 10]}
              style={axisStyle}
            />
            <VictoryScatter
              data={data}
              x={(datum) => datum.posIndex}
              y={(datum) => datum.notaValue}
              size={5}
              style={{
                data: {
                  fill: ({ datum }) =>
                    getTeamColor(datum.id_equipo, partidoInfo),
                  opacity: 0.78,
                },
              }}
            />
            <VictoryScatter
              data={labelData}
              x={(datum) => datum.posIndex}
              y={(datum) => datum.notaValue}
              size={0}
              labels={({ datum }) => getInitials(datum.nombre)}
              labelComponent={
                <VictoryLabel
                  dx={({ datum }) => datum.labelDx}
                  dy={({ datum }) => datum.labelDy}
                  style={POINT_LABEL_STYLE}
                />
              }
            />
          </VictoryChart>
        </ChartShell>
        {renderPlayerLegend(
          labelData,
          (jugador) => `${formatValue(jugador.notaValue)} nota`,
        )}
      </>
    );
  };

  const renderTopImpacto = () => {
    const data = jugadoresValidos
      .map((jugador) => ({
        ...jugador,
        score: getImpactScore(jugador, impactMode),
      }))
      .filter((jugador) => jugador.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 7);

    if (data.length === 0) {
      return <EmptyChart text="No hay datos suficientes para este ranking." />;
    }

    return (
      <>
        <View style={styles.segmented}>
          {IMPACT_MODES.map((mode) => (
            <TouchableOpacity
              key={mode.key}
              style={[
                styles.segmentButton,
                impactMode === mode.key && styles.segmentButtonActive,
              ]}
              onPress={() => setImpactMode(mode.key)}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.segmentText,
                  impactMode === mode.key && styles.segmentTextActive,
                ]}
              >
                {mode.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <ChartShell width={chartWidth} height={TALL_CHART_HEIGHT}>
          <VictoryChart
            standalone={false}
            horizontal
            width={chartWidth}
            height={TALL_CHART_HEIGHT}
            padding={{ top: 18, left: 92, right: 34, bottom: 34 }}
            domainPadding={{ y: 12 }}
          >
            <VictoryAxis style={axisStyle} />
            <VictoryAxis dependentAxis style={axisStyle} />
            <VictoryBar
              data={data.map((jugador) => ({
                x: splitTwoLines(jugador.nombre),
                y: jugador.score,
                fill: getTeamColor(jugador.id_equipo, partidoInfo),
              }))}
              style={{ data: { fill: ({ datum }) => datum.fill } }}
              labels={({ datum }) => formatValue(datum.y)}
              labelComponent={<VictoryLabel dx={8} style={CHART_LABEL_STYLE} />}
            />
          </VictoryChart>
        </ChartShell>
      </>
    );
  };

  const renderPorteros = () => {
    const porteros = jugadoresValidos.filter(
      (jugador) => jugador.posicion === "P",
    );

    if (porteros.length === 0) {
      return <EmptyChart text="No hay datos específicos de porteros." />;
    }

    const metrics = [
      { key: "paradas", label: "Paradas" },
      { key: "goles_concedidos", label: "G. conc." },
      { key: "penaltis_parados", label: "Pen. par." },
    ];

    return (
      <>
        {renderLegend()}
        <ChartShell width={chartWidth} height={CHART_HEIGHT}>
          <VictoryChart
            standalone={false}
            width={chartWidth}
            height={CHART_HEIGHT}
            padding={{ top: 18, left: 40, right: 18, bottom: 48 }}
            domainPadding={{ x: 28, y: 8 }}
          >
            <VictoryAxis style={axisStyle} />
            <VictoryAxis dependentAxis style={axisStyle} />
            <VictoryGroup offset={16}>
              {porteros.slice(0, 2).map((portero) => (
                <VictoryBar
                  key={portero.id_jugador}
                  data={metrics.map((metric) => ({
                    x: metric.label,
                    y: toNumber(portero[metric.key]),
                    nombre: portero.nombre,
                  }))}
                  style={{
                    data: {
                      fill: getTeamColor(portero.id_equipo, partidoInfo),
                    },
                  }}
                  labels={({ datum }) => formatValue(datum.y)}
                  labelComponent={
                    <VictoryLabel dy={-5} style={CHART_LABEL_STYLE} />
                  }
                />
              ))}
            </VictoryGroup>
          </VictoryChart>
        </ChartShell>
        <View style={styles.playerList}>
          {porteros.slice(0, 2).map((portero) => (
            <View key={portero.id_jugador} style={styles.playerRow}>
              <View
                style={[
                  styles.playerDot,
                  {
                    backgroundColor: getTeamColor(
                      portero.id_equipo,
                      partidoInfo,
                    ),
                  },
                ]}
              />
              <Text style={styles.playerName} numberOfLines={1}>
                {portero.nombre}
              </Text>
              <Text style={styles.playerMeta}>
                {formatValue(portero.nota)} nota
              </Text>
            </View>
          ))}
        </View>
      </>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator color={COLORS.local} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard gráfico</Text>
        <Text style={styles.subtitle}>
          Comparativa del partido y jugadores destacados por fase del juego.
        </Text>
      </View>

      {!!error && (
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>{error}</Text>
        </View>
      )}

      <ChartCard
        title="Comparativa general"
        subtitle="Valores normalizados para comparar métricas de distinta escala."
      >
        {renderComparativaEquipos()}
      </ChartCard>

      <ChartCard
        title="Mapa de dominio"
        subtitle="Radar comparativo de los dos equipos en las métricas principales."
      >
        {renderRadarDominio()}
      </ChartCard>

      <ChartCard
        title="Finalización por equipo"
        subtitle="Volumen de disparo y goles esperados."
      >
        {renderFinalizacion()}
      </ChartCard>

      <ChartCard
        title="Eficacia ofensiva"
        subtitle="Tiros totales vs goles. El tamaño crece con tiros a puerta."
      >
        {renderEficaciaOfensiva()}
      </ChartCard>

      <ChartCard
        title="Creadores del partido"
        subtitle="Top 7 por pases clave, asistencias, volumen y precisión de pase."
      >
        {renderCreadores()}
      </ChartCard>

      <ChartCard
        title="Muralla defensiva"
        subtitle="Top 7 en entradas, bloqueos e intercepciones."
      >
        {renderMurallaDefensiva()}
      </ChartCard>

      <ChartCard
        title="Duelos y regates"
        subtitle="Regates completados frente a duelos ganados."
      >
        {renderDuelosRegates()}
      </ChartCard>

      <ChartCard
        title="Notas por posición"
        subtitle="Distribución de notas por línea, coloreada por equipo."
      >
        {renderNotasPorPosicion()}
      </ChartCard>

      <ChartCard
        title="Top impacto individual"
        subtitle="Ranking configurable por ataque, creación o defensa."
      >
        {renderTopImpacto()}
      </ChartCard>

      <ChartCard
        title="Porteros"
        subtitle="Paradas, goles concedidos y penaltis parados."
      >
        {renderPorteros()}
      </ChartCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 28,
    gap: 12,
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 28,
  },
  header: {
    paddingHorizontal: 2,
    paddingTop: 2,
  },
  title: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "900",
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 17,
    marginTop: 3,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 10,
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "900",
  },
  cardSubtitle: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 15,
    marginTop: 2,
    marginBottom: 8,
  },
  chartBox: {
    alignSelf: "center",
    overflow: "hidden",
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 4,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    maxWidth: "48%",
  },
  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    marginRight: 5,
  },
  legendText: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: "800",
  },
  emptyBox: {
    minHeight: 96,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
  },
  emptyText: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  warningBox: {
    borderRadius: 8,
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderColor: "#fed7aa",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  warningText: {
    color: "#9a3412",
    fontSize: 12,
    fontWeight: "700",
  },
  segmented: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 8,
  },
  segmentButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    paddingVertical: 7,
  },
  segmentButtonActive: {
    backgroundColor: COLORS.local,
    borderColor: COLORS.local,
  },
  segmentText: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "900",
  },
  segmentTextActive: {
    color: "#ffffff",
  },
  playerLegend: {
    gap: 6,
    marginTop: 8,
  },
  playerLegendItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: COLORS.background,
    paddingHorizontal: 8,
    paddingVertical: 7,
  },
  initialsBadge: {
    width: 30,
    height: 22,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 7,
  },
  initialsBadgeText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "900",
  },
  playerLegendName: {
    flex: 1,
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "800",
  },
  playerLegendMeta: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "800",
    marginLeft: 8,
  },
  playerList: {
    gap: 6,
    marginTop: 8,
  },
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: COLORS.background,
    paddingHorizontal: 8,
    paddingVertical: 7,
  },
  playerDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    marginRight: 7,
  },
  playerName: {
    flex: 1,
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "800",
  },
  playerMeta: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "800",
  },
});
