import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import { useNavigation } from "@react-navigation/native";
import Svg from "react-native-svg";
import {
  VictoryArea,
  VictoryAxis,
  VictoryBar,
  VictoryChart,
  VictoryGroup,
  VictoryLabel,
  VictoryLine,
  VictoryPolarAxis,
  VictoryScatter,
  VictoryStack,
} from "victory-native";

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

const CHART_HEIGHT = 250;

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const splitTwoLines = (value) => {
  const parts = String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length <= 1) return parts[0] || "-";
  return `${parts[0]}\n${parts[parts.length - 1]}`;
};

const getResultColor = (resultado) => {
  if (resultado === "V") return COLORS.green;
  if (resultado === "E") return COLORS.orange;
  return COLORS.red;
};

const ChartShell = ({ width, height, children }) => (
  <View style={[styles.chartBox, { width, height }]}>
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {children}
    </Svg>
  </View>
);

const makeSummary = (rows) =>
  rows.reduce(
    (acc, row) => {
      acc.partidos += 1;
      acc.puntos += row.puntos;
      acc.gf += row.goles_equipo;
      acc.gc += row.goles_rival;
      acc.victorias += row.resultado === "V" ? 1 : 0;
      acc.empates += row.resultado === "E" ? 1 : 0;
      acc.derrotas += row.resultado === "D" ? 1 : 0;
      return acc;
    },
    {
      partidos: 0,
      puntos: 0,
      gf: 0,
      gc: 0,
      victorias: 0,
      empates: 0,
      derrotas: 0,
    },
  );

export default function GraficosEquipo({ id_equipo }) {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const screenWidth = Number.isFinite(Number(width)) ? Number(width) : 360;
  const chartWidth = Math.max(280, Math.min(screenWidth - 32, 720));

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [payload, setPayload] = useState(null);
  const [selectedTemporada, setSelectedTemporada] = useState(null);

  const cargarDatos = useCallback(
    async (temporadaElegida = null) => {
      try {
        setLoading(true);
        setError("");

        if (!id_equipo) {
          setPayload(null);
          return;
        }

        const url = temporadaElegida
          ? `${process.env.EXPO_PUBLIC_API_URL}/equipos/dashboard/${id_equipo}?temporada=${temporadaElegida}`
          : `${process.env.EXPO_PUBLIC_API_URL}/equipos/dashboard/${id_equipo}`;

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error("No se pudo cargar el dashboard del equipo");
        }

        const data = await response.json();
        setPayload(data ?? null);
        setSelectedTemporada(
          (prev) => temporadaElegida ?? prev ?? data?.temporada ?? null,
        );
      } catch (_e) {
        setError("No se pudo cargar el dashboard del equipo");
        setPayload(null);
      } finally {
        setLoading(false);
      }
    },
    [id_equipo],
  );

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const equipo = payload?.equipo ?? null;
  const clasificacionActual = payload?.clasificacion_actual ?? null;
  const proximoPartido = payload?.proximo_partido ?? null;
  const posicionLinea = Array.isArray(payload?.posicion_linea)
    ? payload.posicion_linea
    : [];
  const jugadores = Array.isArray(payload?.jugadores) ? payload.jugadores : [];
  const ultimosPartidos = Array.isArray(payload?.ultimos_partidos)
    ? payload.ultimos_partidos
    : [];
  const bandas = Array.isArray(payload?.bandas) ? payload.bandas : [];
  const temporadasDisponibles = Array.isArray(payload?.temporadas_disponibles)
    ? payload.temporadas_disponibles
    : [];
  const radarEquipo = payload?.radar_equipo ?? {
    ataque: 0,
    creacion: 0,
    defensa: 0,
    porteros: 0,
    duelos: 0,
    regates: 0,
  };
  const temporada = payload?.temporada ?? null;
  const jornadaMaxima = payload?.jornada_maxima ?? null;
  const temporadaActiva = selectedTemporada ?? temporada;

  const radarData = useMemo(() => {
    const items = [
      {
        key: "ataque",
        label: "Ataque",
      },
      {
        key: "creacion",
        label: "Creación",
      },
      {
        key: "defensa",
        label: "Defensa",
      },
      {
        key: "porteros",
        label: "Porteros",
      },
      {
        key: "duelos",
        label: "Duelos",
      },
      {
        key: "regates",
        label: "Regates",
      },
    ];

    const points = items.map((item) => ({
      x: item.label,
      y: Math.max(0, Math.min(toNumber(radarEquipo[item.key]), 10)),
    }));

    if (points.length > 0) {
      points.push(points[0]);
    }

    return points;
  }, [radarEquipo]);

  const positionLineData = useMemo(
    () =>
      posicionLinea.map((fila) => ({
        x: toNumber(fila.jornada),
        y: toNumber(fila.posicion),
      })),
    [posicionLinea],
  );

  const maxJornada = useMemo(
    () =>
      Math.max(
        ...posicionLinea.map((fila) => toNumber(fila.jornada)),
        jornadaMaxima || 1,
        1,
      ),
    [jornadaMaxima, posicionLinea],
  );

  const maxPosicion = useMemo(
    () => Math.max(...posicionLinea.map((fila) => toNumber(fila.posicion)), 1),
    [posicionLinea],
  );

  const resumenLocal = makeSummary(
    ultimosPartidos.filter((partido) => partido.condicion === "LOCAL"),
  );
  const resumenVisitante = makeSummary(
    ultimosPartidos.filter((partido) => partido.condicion === "VISITANTE"),
  );

  const comparativaLocalVisitante = [
    {
      label: "Pts",
      local: resumenLocal.puntos,
      visitante: resumenVisitante.puntos,
    },
    { label: "GF", local: resumenLocal.gf, visitante: resumenVisitante.gf },
    { label: "GC", local: resumenLocal.gc, visitante: resumenVisitante.gc },
  ];

  const handleTemporadaPress = (temporadaElegida) => {
    const temporadaNum = Number(temporadaElegida);
    if (
      !Number.isFinite(temporadaNum) ||
      temporadaNum === Number(temporadaActiva)
    ) {
      return;
    }

    setSelectedTemporada(temporadaNum);
    cargarDatos(temporadaNum);
  };

  const kpis = [
    {
      label: "Posición",
      value: clasificacionActual?.posicion
        ? `#${clasificacionActual.posicion}`
        : "-",
    },
    { label: "Puntos", value: toNumber(clasificacionActual?.puntos) || "-" },
    {
      label: "Próximo rival",
      value: proximoPartido
        ? Number(proximoPartido.id_local) === Number(id_equipo)
          ? proximoPartido.equipo_visitante
          : proximoPartido.equipo_local
        : "Sin dato",
    },
    { label: "Forma", value: clasificacionActual?.forma || "N/D" },
  ];

  const renderKpi = (item) => (
    <View key={item.label} style={styles.kpiCard}>
      <Text style={styles.kpiLabel}>{item.label}</Text>
      <Text style={styles.kpiValue} numberOfLines={2}>
        {item.value}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingState}>
        <ActivityIndicator size="small" color={COLORS.blue} />
        <Text style={styles.loadingText}>Cargando análisis del equipo...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loadingState}>
        <Ionicons name="alert-circle-outline" size={20} color={COLORS.muted} />
        <Text style={styles.loadingText}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.seasonStrip}>
        <Text style={styles.seasonTitle}>Temporada</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.seasonRow}
        >
          {temporadasDisponibles.map((temporadaItem) => {
            const activa = Number(temporadaItem) === Number(temporadaActiva);
            return (
              <TouchableOpacity
                key={`temp-${temporadaItem}`}
                style={[styles.seasonPill, activa && styles.seasonPillActive]}
                onPress={() => handleTemporadaPress(temporadaItem)}
                activeOpacity={0.85}
              >
                <Text
                  style={[
                    styles.seasonPillText,
                    activa && styles.seasonPillTextActive,
                  ]}
                >
                  {temporadaItem}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.heroCard}>
        <View style={styles.heroTeam}>
          {equipo?.logo ? (
            <Image source={{ uri: equipo.logo }} style={styles.teamLogo} />
          ) : (
            <View style={styles.logoFallback}>
              <Ionicons name="shield-outline" size={30} color="#325b88" />
            </View>
          )}
          <View style={styles.heroText}>
            <Text style={styles.teamName} numberOfLines={2}>
              {equipo?.nombre_equipo || "Equipo"}
            </Text>
            <Text style={styles.teamMeta}>
              Temporada {temporada || "-"} · Jornada {jornadaMaxima || "-"}
            </Text>
          </View>
        </View>

        <View style={styles.formRow}>
          <Text style={styles.formTitle}>Forma</Text>
          <View style={styles.formBadges}>
            {(clasificacionActual?.forma || "")
              .split("")
              .filter(Boolean)
              .map((item, index) => (
                <View
                  key={`forma-${index}-${item}`}
                  style={[
                    styles.formBadge,
                    item === "V" && styles.formBadgeWin,
                    item === "E" && styles.formBadgeDraw,
                    item === "D" && styles.formBadgeLoss,
                  ]}
                >
                  <Text style={styles.formBadgeText}>{item}</Text>
                </View>
              ))}
          </View>
        </View>
      </View>

      <View style={styles.kpiGrid}>{kpis.map(renderKpi)}</View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Posición durante la temporada</Text>
        <Text style={styles.sectionSubtitle}>
          1 es mejor posición. La línea muestra la evolución jornada a jornada.
        </Text>
        {positionLineData.length > 0 ? (
          <ChartShell width={chartWidth} height={CHART_HEIGHT}>
            <VictoryChart
              standalone={false}
              width={chartWidth}
              height={CHART_HEIGHT}
              padding={{ top: 18, left: 48, right: 20, bottom: 40 }}
              domain={{
                x: [1, maxJornada],
                y: [Math.max(maxPosicion + 1, 2), 1],
              }}
            >
              <VictoryAxis
                label="Jornada"
                style={styles.axis}
                tickFormat={(tick) => `${tick}`}
              />
              <VictoryAxis
                dependentAxis
                label="Posición"
                style={styles.axis}
                tickValues={[1, 5, 10, 15, 20]}
              />
              <VictoryLine
                data={positionLineData}
                style={{ data: { stroke: COLORS.red, strokeWidth: 3 } }}
              />
              <VictoryScatter
                data={positionLineData}
                size={3.5}
                style={{ data: { fill: COLORS.blue } }}
              />
            </VictoryChart>
          </ChartShell>
        ) : (
          <Text style={styles.emptyText}>
            No hay datos de posición para esta temporada.
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Radar del equipo</Text>
        <Text style={styles.sectionSubtitle}>
          Perfil estadístico medio de los jugadores con partidos en la
          temporada.
        </Text>
        {radarData.length > 0 ? (
          <ChartShell width={chartWidth} height={CHART_HEIGHT}>
            <VictoryChart
              standalone={false}
              polar
              width={chartWidth}
              height={CHART_HEIGHT}
              padding={{ top: 24, left: 24, right: 24, bottom: 24 }}
              domain={{ y: [0, 10] }}
            >
              <VictoryPolarAxis
                labelPlacement="vertical"
                tickFormat={(tick) => tick}
                style={{
                  axis: { stroke: COLORS.border },
                  grid: { stroke: COLORS.border },
                  tickLabels: {
                    fill: COLORS.text,
                    fontSize: 9,
                    fontWeight: "700",
                    padding: 10,
                  },
                }}
              />
              <VictoryPolarAxis
                dependentAxis
                tickValues={[2, 4, 6, 8, 10]}
                tickFormat={(tick) => `${tick}`}
                style={styles.axis}
              />
              <VictoryArea
                data={radarData}
                style={{
                  data: {
                    fill: COLORS.red,
                    fillOpacity: 0.22,
                    stroke: COLORS.red,
                    strokeWidth: 2,
                  },
                }}
              />
            </VictoryChart>
          </ChartShell>
        ) : (
          <Text style={styles.emptyText}>
            No hay datos suficientes para construir el radar.
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Victorias, empates y derrotas por nivel de rival
        </Text>
        <Text style={styles.sectionSubtitle}>
          Top 6, tramo medio y zona baja de la clasificación.
        </Text>
        {bandas.length > 0 ? (
          <ChartShell width={chartWidth} height={CHART_HEIGHT}>
            <VictoryChart
              standalone={false}
              width={chartWidth}
              height={CHART_HEIGHT}
              domainPadding={{ x: 24, y: 20 }}
              padding={{ top: 18, left: 48, right: 20, bottom: 48 }}
            >
              <VictoryAxis style={styles.axis} />
              <VictoryAxis dependentAxis style={styles.axis} />
              <VictoryStack>
                <VictoryBar
                  data={bandas.map((item) => ({
                    x: item.banda,
                    y: item.victorias,
                  }))}
                  style={{ data: { fill: COLORS.green } }}
                  barWidth={18}
                />
                <VictoryBar
                  data={bandas.map((item) => ({
                    x: item.banda,
                    y: item.empates,
                  }))}
                  style={{ data: { fill: COLORS.orange } }}
                  barWidth={18}
                />
                <VictoryBar
                  data={bandas.map((item) => ({
                    x: item.banda,
                    y: item.derrotas,
                  }))}
                  style={{ data: { fill: COLORS.red } }}
                  barWidth={18}
                />
              </VictoryStack>
              <VictoryLabel
                text="V"
                x={chartWidth - 122}
                y={26}
                style={{ fill: COLORS.green, fontSize: 11, fontWeight: "700" }}
              />
              <VictoryLabel
                text="E"
                x={chartWidth - 98}
                y={26}
                style={{ fill: COLORS.orange, fontSize: 11, fontWeight: "700" }}
              />
              <VictoryLabel
                text="D"
                x={chartWidth - 74}
                y={26}
                style={{ fill: COLORS.red, fontSize: 11, fontWeight: "700" }}
              />
            </VictoryChart>
          </ChartShell>
        ) : (
          <Text style={styles.emptyText}>
            No hay partidos suficientes para analizar bandas de rival.
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Comparativa local vs visitante</Text>
        <Text style={styles.sectionSubtitle}>
          Resumen por partido jugado en casa o fuera.
        </Text>
        <ChartShell width={chartWidth} height={CHART_HEIGHT}>
          <VictoryChart
            standalone={false}
            width={chartWidth}
            height={CHART_HEIGHT}
            domainPadding={{ x: 22, y: 20 }}
            padding={{ top: 18, left: 48, right: 20, bottom: 48 }}
          >
            <VictoryAxis style={styles.axis} />
            <VictoryAxis dependentAxis style={styles.axis} />
            <VictoryGroup offset={16}>
              <VictoryBar
                data={comparativaLocalVisitante.map((item) => ({
                  x: item.label,
                  y: item.local,
                }))}
                style={{ data: { fill: COLORS.blue } }}
                barWidth={12}
              />
              <VictoryBar
                data={comparativaLocalVisitante.map((item) => ({
                  x: item.label,
                  y: item.visitante,
                }))}
                style={{ data: { fill: COLORS.red } }}
                barWidth={12}
              />
            </VictoryGroup>
          </VictoryChart>
        </ChartShell>
        <View style={styles.compareLegend}>
          <View style={styles.legendItem}>
            <View
              style={[styles.legendDot, { backgroundColor: COLORS.blue }]}
            />
            <Text style={styles.legendText}>Local</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.red }]} />
            <Text style={styles.legendText}>Visitante</Text>
          </View>
        </View>
        <View style={styles.compareGrid}>
          <View style={styles.compareCard}>
            <Text style={styles.compareTitle}>Local</Text>
            <Text style={styles.compareValue}>
              {resumenLocal.partidos} partidos
            </Text>
            <Text style={styles.compareMeta}>Pts: {resumenLocal.puntos}</Text>
            <Text style={styles.compareMeta}>
              GF: {resumenLocal.gf} · GC: {resumenLocal.gc}
            </Text>
            <Text style={styles.compareMeta}>
              V/E/D: {resumenLocal.victorias}/{resumenLocal.empates}/
              {resumenLocal.derrotas}
            </Text>
          </View>
          <View style={styles.compareCard}>
            <Text style={styles.compareTitle}>Visitante</Text>
            <Text style={styles.compareValue}>
              {resumenVisitante.partidos} partidos
            </Text>
            <Text style={styles.compareMeta}>
              Pts: {resumenVisitante.puntos}
            </Text>
            <Text style={styles.compareMeta}>
              GF: {resumenVisitante.gf} · GC: {resumenVisitante.gc}
            </Text>
            <Text style={styles.compareMeta}>
              V/E/D: {resumenVisitante.victorias}/{resumenVisitante.empates}/
              {resumenVisitante.derrotas}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Últimos 5 partidos</Text>
        <Text style={styles.sectionSubtitle}>
          Mini-cards con resultado, rival y marcador.
        </Text>
        {ultimosPartidos.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.lastMatchesRow}
          >
            {ultimosPartidos.map((partido) => (
              <TouchableOpacity
                key={`ult-${partido.id_partido}`}
                style={styles.matchCard}
                activeOpacity={0.85}
                onPress={() => {
                  if (partido.id_partido) {
                    navigation.navigate("DetallePartido", {
                      id_partido: partido.id_partido,
                    });
                  }
                }}
              >
                <Text style={styles.matchJornada}>J{partido.jornada}</Text>
                <View
                  style={[
                    styles.resultBadge,
                    { backgroundColor: getResultColor(partido.resultado) },
                  ]}
                >
                  <Text style={styles.resultBadgeText}>
                    {partido.resultado}
                  </Text>
                </View>
                <Text style={styles.matchOpponent} numberOfLines={2}>
                  {splitTwoLines(partido.rival_nombre)}
                </Text>
                <Text style={styles.matchScore}>
                  {partido.goles_equipo} - {partido.goles_rival}
                </Text>
                <Text style={styles.matchContext}>{partido.condicion}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <Text style={styles.emptyText}>
            No hay últimos partidos disponibles.
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Fichajes</Text>
        <View style={styles.placeholderCard}>
          <Ionicons
            name="swap-horizontal-outline"
            size={24}
            color={COLORS.muted}
          />
          <Text style={styles.placeholderTitle}>Próximamente</Text>
          <Text style={styles.placeholderText}>
            Esta sección quedará lista cuando conectemos la fuente de fichajes.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 30,
  },
  seasonStrip: {
    marginBottom: 12,
    backgroundColor: COLORS.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  seasonTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "900",
    marginBottom: 8,
  },
  seasonRow: {
    gap: 8,
    paddingRight: 6,
  },
  seasonPill: {
    minWidth: 72,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "#f8fbfe",
    alignItems: "center",
  },
  seasonPillActive: {
    backgroundColor: COLORS.blue,
    borderColor: COLORS.blue,
  },
  seasonPillText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "800",
  },
  seasonPillTextActive: {
    color: "#ffffff",
  },
  loadingState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 8,
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: "600",
  },
  heroCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    shadowColor: "#0d2b4a",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  heroTeam: {
    flexDirection: "row",
    alignItems: "center",
  },
  teamLogo: {
    width: 64,
    height: 64,
    resizeMode: "contain",
  },
  logoFallback: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#e9f1f8",
    alignItems: "center",
    justifyContent: "center",
  },
  heroText: {
    flex: 1,
    marginLeft: 12,
  },
  teamName: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "900",
  },
  teamMeta: {
    marginTop: 4,
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "600",
  },
  formRow: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
  },
  formTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 8,
  },
  formBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  formBadge: {
    minWidth: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  formBadgeWin: {
    backgroundColor: "#daf3e3",
  },
  formBadgeDraw: {
    backgroundColor: "#fceccf",
  },
  formBadgeLoss: {
    backgroundColor: "#f9d7d7",
  },
  formBadgeText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "900",
  },
  kpiGrid: {
    marginTop: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },
  kpiCard: {
    width: "48.5%",
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
  },
  kpiLabel: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "700",
  },
  kpiValue: {
    marginTop: 8,
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "900",
  },
  section: {
    marginTop: 16,
    backgroundColor: COLORS.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "900",
  },
  sectionSubtitle: {
    marginTop: 4,
    marginBottom: 10,
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 17,
  },
  emptyText: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 6,
  },
  chartBox: {
    alignSelf: "center",
    overflow: "hidden",
  },
  axis: {
    axis: { stroke: COLORS.border },
    axisLabel: {
      fill: COLORS.text,
      fontSize: 11,
      fontWeight: "700",
      padding: 24,
    },
    grid: { stroke: COLORS.border, strokeDasharray: "4,4" },
    tickLabels: { fill: COLORS.muted, fontSize: 10, angle: 0 },
  },
  compareLegend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "700",
  },
  compareGrid: {
    marginTop: 12,
    flexDirection: "row",
    gap: 10,
  },
  compareCard: {
    flex: 1,
    backgroundColor: "#f8fbfe",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
  },
  compareTitle: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "900",
  },
  compareValue: {
    marginTop: 4,
    color: COLORS.blue,
    fontSize: 16,
    fontWeight: "900",
  },
  compareMeta: {
    marginTop: 4,
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "600",
  },
  lastMatchesRow: {
    paddingVertical: 2,
    paddingRight: 6,
    gap: 10,
  },
  matchCard: {
    width: 118,
    backgroundColor: "#f8fbfe",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
  },
  matchJornada: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: "800",
  },
  resultBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 8,
  },
  resultBadgeText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "900",
  },
  matchOpponent: {
    marginTop: 10,
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "800",
    minHeight: 36,
  },
  matchScore: {
    marginTop: 8,
    color: COLORS.blue,
    fontSize: 18,
    fontWeight: "900",
  },
  matchContext: {
    marginTop: 4,
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: "700",
  },
  placeholderCard: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "#f8fbfe",
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  placeholderTitle: {
    marginTop: 8,
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "900",
  },
  placeholderText: {
    marginTop: 6,
    color: COLORS.muted,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
});
