import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import CustomHeader from '../components/header';

const Tab = createMaterialTopTabNavigator();

const CLASIFICACION_COLUMNS = [
  { key: 'puntos', label: 'Pts' },
  { key: 'partidos_jugados', label: 'PJ' },
  { key: 'victorias', label: 'PG' },
  { key: 'empates', label: 'PE' },
  { key: 'derrotas', label: 'PP' },
  { key: 'gf', label: 'GF' },
  { key: 'gc', label: 'GC' },
  { key: 'dg', label: 'DG' },
];

const PROB_COLUMNS = [
  {
    key: 'campeon_pct',
    label: 'Campeon',
    palette: ['#fff8d8', '#ffe98a', '#ffd94d', '#f6c400'],
  },
  {
    key: 'champions_pct',
    label: 'Champions',
    palette: ['#e6f1ff', '#b9dcff', '#76b7ff', '#2f8cff'],
  },
  {
    key: 'europa_pct',
    label: 'Europa',
    palette: ['#fff0df', '#ffd5a8', '#ffad5c', '#f27a1a'],
  },
  {
    key: 'media_tabla_pct',
    label: 'Media tabla',
    palette: ['#e9f8ee', '#bcebc9', '#78d895', '#2fbf61'],
  },
  {
    key: 'descenso_pct',
    label: 'Descenso',
    palette: ['#ffe9e9', '#ffc0c0', '#ff8181', '#e54848'],
  },
];

const toNumber = (valor) => {
  const n = Number(valor);
  return Number.isFinite(n) ? n : 0;
};

const formatNumero = (valor) => {
  const n = Number(valor);
  return Number.isFinite(n) ? String(n) : '-';
};

const formatPct = (valor) => {
  const n = Number(valor);
  if (!Number.isFinite(n)) return '-';
  return `${Number.isInteger(n) ? n : n.toFixed(1)}%`;
};

const getColorPosicion = (posicion) => {
  if (posicion === 1) return '#f6c84f';
  if (posicion >= 2 && posicion <= 4) return '#58a5ff';
  if (posicion >= 5 && posicion <= 6) return '#f29b4b';
  if (posicion === 7) return '#76d7a5';
  if (posicion >= 18) return '#f06a6a';
  return '#dce6f0';
};

const getProbBackground = (valor, palette) => {
  const pct = toNumber(valor);
  if (pct <= 0) return '#ffffff';
  if (pct < 25) return palette[0];
  if (pct < 50) return palette[1];
  if (pct < 75) return palette[2];
  return palette[3];
};

const normalizarMarcador = (valor) => {
  if (valor === null || valor === undefined) return '';
  return String(valor);
};

const parseMarcador = (valor) => {
  if (valor === null || valor === undefined || valor === '') return null;
  const n = Number(valor);
  return Number.isInteger(n) && n >= 0 ? n : null;
};

const getJornadasVisibles = (jornadas, jornadaSeleccionada) => {
  const index = jornadas.findIndex((item) => item === jornadaSeleccionada);
  if (index < 0) return jornadas.slice(0, 5);
  const start = Math.max(0, Math.min(index - 2, jornadas.length - 5));
  return jornadas.slice(start, start + 5);
};

const recalcularClasificacion = (clasificacionBase, partidosEditados) => {
  const equiposMap = new Map(
    clasificacionBase.map((equipo) => [
      Number(equipo.id_equipo),
      {
        ...equipo,
        puntos: toNumber(equipo.puntos),
        partidos_jugados: toNumber(equipo.partidos_jugados),
        victorias: toNumber(equipo.victorias),
        empates: toNumber(equipo.empates),
        derrotas: toNumber(equipo.derrotas),
        gf: toNumber(equipo.gf),
        gc: toNumber(equipo.gc),
        dg: toNumber(equipo.dg),
      },
    ]),
  );

  let resultadosAplicados = 0;

  partidosEditados.forEach((partido) => {
    if (partido.status === 'Completado') return;

    const idLocal = Number(partido.id_local);
    const idVisitante = Number(partido.id_visitante);
    const local = equiposMap.get(idLocal);
    const visitante = equiposMap.get(idVisitante);
    const golesLocal = parseMarcador(partido.goles_local);
    const golesVisitante = parseMarcador(partido.goles_visitante);

    if (!local || !visitante || golesLocal === null || golesVisitante === null) {
      return;
    }

    local.partidos_jugados += 1;
    visitante.partidos_jugados += 1;
    local.gf += golesLocal;
    local.gc += golesVisitante;
    visitante.gf += golesVisitante;
    visitante.gc += golesLocal;

    if (golesLocal > golesVisitante) {
      local.victorias += 1;
      local.puntos += 3;
      visitante.derrotas += 1;
    } else if (golesLocal < golesVisitante) {
      visitante.victorias += 1;
      visitante.puntos += 3;
      local.derrotas += 1;
    } else {
      local.empates += 1;
      visitante.empates += 1;
      local.puntos += 1;
      visitante.puntos += 1;
    }

    local.dg = local.gf - local.gc;
    visitante.dg = visitante.gf - visitante.gc;
    resultadosAplicados += 1;
  });

  const clasificacion = Array.from(equiposMap.values())
    .sort((a, b) => {
      const puntosDiff = toNumber(b.puntos) - toNumber(a.puntos);
      if (puntosDiff !== 0) return puntosDiff;
      const dgDiff = toNumber(b.dg) - toNumber(a.dg);
      if (dgDiff !== 0) return dgDiff;
      return toNumber(b.gf) - toNumber(a.gf);
    })
    .map((equipo, idx) => ({ ...equipo, posicion: idx + 1 }));

  return { clasificacion, resultadosAplicados };
};

const mezclarPartidosConSimulacion = (partidosApi, partidosSimulados) => (
  partidosApi.map((partido) => {
    const partidoSimulado = partidosSimulados[partido.id_partido];
    return partidoSimulado ? { ...partido, ...partidoSimulado } : partido;
  })
);

function EstadoPantalla({ icon = 'alert-circle-outline', text, loading }) {
  return (
    <View style={styles.estadoPantalla}>
      {loading ? (
        <ActivityIndicator size="small" color="#1f6fa7" />
      ) : (
        <Ionicons name={icon} size={22} color="#5f7f9b" />
      )}
      <Text style={styles.estadoTexto}>{text}</Text>
    </View>
  );
}

function ResultadosTab({
  temporada,
  jornadas,
  jornadaSeleccionada,
  partidos,
  cargandoJornada,
  errorJornada,
  onSeleccionarJornada,
  onActualizarMarcador,
  onRecalcular,
  onReset,
}) {
  const jornadaIndex = jornadas.findIndex((item) => item === jornadaSeleccionada);
  const puedeAnterior = jornadaIndex > 0;
  const puedeSiguiente = jornadaIndex >= 0 && jornadaIndex < jornadas.length - 1;
  const jornadasVisibles = getJornadasVisibles(jornadas, jornadaSeleccionada);

  const moverJornada = (offset) => {
    const nextIndex = jornadaIndex + offset;
    if (nextIndex >= 0 && nextIndex < jornadas.length) {
      onSeleccionarJornada(jornadas[nextIndex]);
    }
  };

  const renderPartido = (partido) => {
    const completado = partido.status === 'Completado';

    return (
      <View key={partido.id_partido} style={styles.matchRow}>
        <View style={styles.matchInfo}>
          <Text style={styles.matchMeta}>
            {partido.fecha_iso || 'Fecha pendiente'} {partido.hora ? `- ${partido.hora}` : ''}
          </Text>
          <View style={styles.teamsLine}>
            <Text style={styles.teamCode} numberOfLines={1}>
              {partido.codigo_local || partido.equipo_local || '-'}
            </Text>
            <Text style={styles.vsText}>vs</Text>
            <Text style={styles.teamCode} numberOfLines={1}>
              {partido.codigo_visitante || partido.equipo_visitante || '-'}
            </Text>
          </View>
          <Text style={styles.matchStatus} numberOfLines={1}>
            {completado ? 'Resultado oficial' : 'Pendiente'}
          </Text>
        </View>

        <View style={styles.scoreBox}>
          <TextInput
            style={[styles.scoreInput, completado && styles.scoreInputOfficial]}
            value={normalizarMarcador(partido.goles_local)}
            onChangeText={(value) => onActualizarMarcador(partido.id_partido, 'goles_local', value)}
            editable={!completado}
            keyboardType="number-pad"
            placeholder="-"
            placeholderTextColor="#8aa0b5"
            maxLength={2}
          />
          <Text style={styles.scoreSeparator}>:</Text>
          <TextInput
            style={[styles.scoreInput, completado && styles.scoreInputOfficial]}
            value={normalizarMarcador(partido.goles_visitante)}
            onChangeText={(value) => onActualizarMarcador(partido.id_partido, 'goles_visitante', value)}
            editable={!completado}
            keyboardType="number-pad"
            placeholder="-"
            placeholderTextColor="#8aa0b5"
            maxLength={2}
          />
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
      <View style={styles.topBlock}>
        <View>
          <Text style={styles.title}>Resultados manuales</Text>
          <Text style={styles.subtitle}>Temporada actual {temporada || '-'}</Text>
        </View>
        <View style={styles.statusPill}>
          <Ionicons name="create-outline" size={15} color="#1f6fa7" />
          <Text style={styles.statusText}>Edicion</Text>
        </View>
      </View>

      <View style={styles.jornadaBlock}>
        <Text style={styles.sectionLabel}>Jornada</Text>
        <View style={styles.jornadaNavigator}>
          <TouchableOpacity
            style={[styles.arrowButton, !puedeAnterior && styles.arrowButtonDisabled]}
            onPress={() => moverJornada(-1)}
            disabled={!puedeAnterior}
            activeOpacity={0.8}
          >
            <Ionicons name="chevron-back" size={20} color={puedeAnterior ? '#1f6fa7' : '#9eb2c2'} />
          </TouchableOpacity>

          <View style={styles.jornadaSlice}>
            {jornadasVisibles.map((item) => (
              <TouchableOpacity
                key={item}
                style={[styles.chip, jornadaSeleccionada === item && styles.chipActive]}
                onPress={() => onSeleccionarJornada(item)}
                activeOpacity={0.85}
              >
                <Text style={[styles.chipText, jornadaSeleccionada === item && styles.chipTextActive]}>
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.arrowButton, !puedeSiguiente && styles.arrowButtonDisabled]}
            onPress={() => moverJornada(1)}
            disabled={!puedeSiguiente}
            activeOpacity={0.8}
          >
            <Ionicons name="chevron-forward" size={20} color={puedeSiguiente ? '#1f6fa7' : '#9eb2c2'} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.panel}>
        <View style={styles.panelHeader}>
          <View>
            <Text style={styles.panelTitle}>Partidos de la jornada {jornadaSeleccionada || '-'}</Text>
            <Text style={styles.panelSubtitle}>Resultados reales y pendientes</Text>
          </View>
          <Ionicons name="football-outline" size={20} color="#1f6fa7" />
        </View>

        {cargandoJornada ? (
          <EstadoPantalla text="Cargando partidos..." loading />
        ) : errorJornada ? (
          <EstadoPantalla text={errorJornada} />
        ) : partidos.length > 0 ? (
          partidos.map((partido) => renderPartido(partido))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-clear-outline" size={22} color="#6d839a" />
            <Text style={styles.emptyText}>No hay partidos en esta jornada</Text>
          </View>
        )}
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.primaryAction} onPress={onRecalcular} activeOpacity={0.85}>
          <Ionicons name="calculator-outline" size={18} color="#ffffff" />
          <Text style={styles.primaryActionText}>Recalcular escenario</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryAction} onPress={onReset} activeOpacity={0.85}>
          <Ionicons name="refresh-outline" size={18} color="#1f6fa7" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function ClasificacionTab({
  clasificacion,
  montecarlo,
  navigation,
  cargandoMontecarlo,
  errorMontecarlo,
  onEjecutarMontecarlo,
}) {
  const [vistaResultado, setVistaResultado] = useState('CLASIFICACION');

  const renderEquipo = (row) => {
    const posicion = toNumber(row.posicion);
    return (
      <View style={styles.teamCell}>
        <View style={[styles.posBadge, { backgroundColor: getColorPosicion(posicion) }]}>
          <Text style={styles.posText}>{posicion || '-'}</Text>
        </View>
        {row.logo ? (
          <Image source={{ uri: row.logo }} style={styles.teamLogo} />
        ) : (
          <View style={styles.logoFallback}>
            <Ionicons name="shield-outline" size={14} color="#6b86a1" />
          </View>
        )}
        <Text style={styles.tableTeam} numberOfLines={1}>
          {row.codigo || row.nombre_equipo || row.equipo || '-'}
        </Text>
      </View>
    );
  };

  const renderClasificacion = () => (
    <View style={styles.tableWrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          <View style={styles.tableHeader}>
            <View style={styles.teamHeaderCell}>
              <Text style={styles.headerText}>Pos</Text>
              <Text style={styles.headerText}>Equipo</Text>
            </View>
            {CLASIFICACION_COLUMNS.map((col) => (
              <View key={col.key} style={styles.statHeaderCell}>
                <Text style={styles.headerText}>{col.label}</Text>
              </View>
            ))}
          </View>

          {clasificacion.map((row, idx) => (
            <TouchableOpacity
              key={`clasificacion-${row.id_equipo}-${idx}`}
              style={[styles.tableRow, idx % 2 === 1 && styles.tableRowAlt]}
              onPress={() => navigation.navigate('DetalleEquipo', { idEquipo: Number(row.id_equipo) })}
              activeOpacity={0.85}
            >
              {renderEquipo(row)}
              {CLASIFICACION_COLUMNS.map((col) => (
                <View key={col.key} style={styles.statCell}>
                  <Text style={styles.tableValue}>{formatNumero(row[col.key])}</Text>
                </View>
              ))}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  const renderMontecarlo = () => (
    <View style={styles.tableWrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          <View style={styles.tableHeader}>
            <View style={styles.teamHeaderCell}>
              <Text style={styles.headerText}>Pos</Text>
              <Text style={styles.headerText}>Equipo</Text>
            </View>
            {PROB_COLUMNS.map((col) => (
              <View key={col.key} style={styles.probHeaderCell}>
                <Text style={styles.headerText} numberOfLines={2} adjustsFontSizeToFit>
                  {col.label}
                </Text>
              </View>
            ))}
          </View>

          {montecarlo.map((row, idx) => (
            <TouchableOpacity
              key={`montecarlo-${row.id_equipo}-${idx}`}
              style={[styles.tableRow, idx % 2 === 1 && styles.tableRowAlt]}
              onPress={() => navigation.navigate('DetalleEquipo', { idEquipo: Number(row.id_equipo) })}
              activeOpacity={0.85}
            >
              {renderEquipo(row)}
              {PROB_COLUMNS.map((col) => (
                <View
                  key={col.key}
                  style={[
                    styles.probCell,
                    { backgroundColor: getProbBackground(row[col.key], col.palette) },
                  ]}
                >
                  <Text style={styles.probText}>{formatPct(row[col.key])}</Text>
                </View>
              ))}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  return (
    <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
      <View style={styles.topBlock}>
        <View>
          <Text style={styles.title}>Escenario actual</Text>
        </View>
        <View style={styles.statusPill}>
          <Ionicons name="stats-chart-outline" size={15} color="#1f6fa7" />
          <Text style={styles.statusText}>Analisis</Text>
        </View>
      </View>

      <View style={styles.resultTabs}>
        {['CLASIFICACION', 'PROBABILIDADES'].map((item) => (
          <TouchableOpacity
            key={item}
            style={[styles.resultTab, vistaResultado === item && styles.resultTabActive]}
            onPress={() => setVistaResultado(item)}
            activeOpacity={0.85}
          >
            <Text style={[styles.resultTabText, vistaResultado === item && styles.resultTabTextActive]}>
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.panel}>
        <View style={styles.panelHeader}>
          <View>
            <Text style={styles.panelTitle}>
              {vistaResultado === 'CLASIFICACION' ? 'Clasificacion actual' : 'Probabilidades'}
            </Text>
          </View>
          <Ionicons
            name={vistaResultado === 'CLASIFICACION' ? 'list-outline' : 'analytics-outline'}
            size={20}
            color="#1f6fa7"
          />
        </View>

        {vistaResultado === 'CLASIFICACION'
          ? clasificacion.length > 0
            ? renderClasificacion()
            : <EstadoPantalla icon="stats-chart-outline" text="No hay clasificacion disponible" />
          : (
            <>
              <TouchableOpacity
                style={[styles.montecarloAction, cargandoMontecarlo && styles.montecarloActionDisabled]}
                onPress={onEjecutarMontecarlo}
                disabled={cargandoMontecarlo}
                activeOpacity={0.85}
              >
                {cargandoMontecarlo ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Ionicons name="analytics-outline" size={18} color="#ffffff" />
                )}
                <Text style={styles.montecarloActionText}>
                  {cargandoMontecarlo ? 'Simulando...' : 'Ejecutar probabilidades'}
                </Text>
              </TouchableOpacity>

              {errorMontecarlo ? (
                <View style={styles.inlineError}>
                  <Ionicons name="alert-circle-outline" size={16} color="#9b4b4b" />
                  <Text style={styles.inlineErrorText}>{errorMontecarlo}</Text>
                </View>
              ) : null}

              {montecarlo.length > 0
                ? renderMontecarlo()
                : <EstadoPantalla icon="analytics-outline" text="No hay datos de Probabilidades" />}
            </>
          )}
      </View>
    </ScrollView>
  );
}

export default function SimulacionTemporadaScreen({ navigation }) {
  const [temporada, setTemporada] = useState(null);
  const [jornadas, setJornadas] = useState([]);
  const [jornadaSeleccionada, setJornadaSeleccionada] = useState(null);
  const [partidos, setPartidos] = useState([]);
  const [partidosSimulados, setPartidosSimulados] = useState({});
  const [clasificacionBase, setClasificacionBase] = useState([]);
  const [clasificacion, setClasificacion] = useState([]);
  const [montecarloBase, setMontecarloBase] = useState([]);
  const [montecarlo, setMontecarlo] = useState([]);
  const [cargandoInicial, setCargandoInicial] = useState(true);
  const [cargandoJornada, setCargandoJornada] = useState(false);
  const [cargandoMontecarlo, setCargandoMontecarlo] = useState(false);
  const [errorInicial, setErrorInicial] = useState('');
  const [errorJornada, setErrorJornada] = useState('');
  const [errorMontecarlo, setErrorMontecarlo] = useState('');

  const cargarInicial = async () => {
    try {
      setCargandoInicial(true);
      setErrorInicial('');
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/temporadas/simulacion/inicial`);

      if (!response.ok) {
        throw new Error('No se pudieron cargar los datos de simulacion');
      }

      const data = await response.json();
      setTemporada(data?.temporada ?? null);
      setJornadas(Array.isArray(data?.jornadas) ? data.jornadas.map(Number).filter(Number.isFinite) : []);
      setJornadaSeleccionada(Number.isFinite(Number(data?.jornada_actual)) ? Number(data.jornada_actual) : null);
      setPartidos(Array.isArray(data?.partidos) ? data.partidos : []);
      const clasificacionInicial = Array.isArray(data?.clasificacion) ? data.clasificacion : [];
      const montecarloInicial = Array.isArray(data?.montecarlo) ? data.montecarlo : [];
      setClasificacionBase(clasificacionInicial);
      setClasificacion(clasificacionInicial);
      setMontecarloBase(montecarloInicial);
      setMontecarlo(montecarloInicial);
    } catch (_e) {
      setErrorInicial('No se pudo cargar la simulacion');
      setPartidos([]);
      setPartidosSimulados({});
      setClasificacionBase([]);
      setClasificacion([]);
      setMontecarloBase([]);
      setMontecarlo([]);
    } finally {
      setCargandoInicial(false);
    }
  };

  useEffect(() => {
    cargarInicial();
  }, []);

  const seleccionarJornada = async (jornada) => {
    if (jornada === jornadaSeleccionada) return;

    try {
      setJornadaSeleccionada(jornada);
      setCargandoJornada(true);
      setErrorJornada('');

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/temporadas/simulacion/partidos?jornada=${encodeURIComponent(jornada)}`,
      );

      if (!response.ok) {
        throw new Error('No se pudieron cargar los partidos');
      }

      const data = await response.json();
      const partidosApi = Array.isArray(data?.partidos) ? data.partidos : [];
      setPartidos(mezclarPartidosConSimulacion(partidosApi, partidosSimulados));
    } catch (_e) {
      setErrorJornada('No se pudieron cargar los partidos de la jornada');
      setPartidos([]);
    } finally {
      setCargandoJornada(false);
    }
  };

  const actualizarMarcador = (idPartido, campo, valor) => {
    const soloNumeros = valor.replace(/[^0-9]/g, '').slice(0, 2);
    const partidoActual = partidos.find((partido) => partido.id_partido === idPartido);

    if (!partidoActual || partidoActual.status === 'Completado') {
      return;
    }

    setPartidos((prev) =>
      prev.map((partido) =>
        partido.id_partido === idPartido ? { ...partido, [campo]: soloNumeros } : partido
      )
    );
    setPartidosSimulados((prev) => {
      const partidoBase = prev[idPartido] || partidoActual;
      return {
        ...prev,
        [idPartido]: {
          ...partidoBase,
          [campo]: soloNumeros,
        },
      };
    });
  };

  const recalcularEscenario = () => {
    const { clasificacion: clasificacionRecalculada, resultadosAplicados } =
      recalcularClasificacion(clasificacionBase, Object.values(partidosSimulados));

    setClasificacion(clasificacionRecalculada);

    if (resultadosAplicados === 0) {
      Alert.alert('Sin resultados nuevos', 'Introduce un marcador completo en un partido pendiente.');
    }
  };

  const resetearEscenario = () => {
    setPartidosSimulados({});
    setPartidos((prev) =>
      prev.map((partido) => ({
        ...partido,
        goles_local: partido.status === 'Completado' ? partido.goles_local : null,
        goles_visitante: partido.status === 'Completado' ? partido.goles_visitante : null,
      }))
    );
    setClasificacion(clasificacionBase);
    setMontecarlo(montecarloBase);
    setErrorMontecarlo('');
  };

  const ejecutarMontecarlo = async () => {
    try {
      setCargandoMontecarlo(true);
      setErrorMontecarlo('');

      const { clasificacion: clasificacionRecalculada } =
        recalcularClasificacion(clasificacionBase, Object.values(partidosSimulados));

      setClasificacion(clasificacionRecalculada);

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/temporadas/simulacion/montecarlo`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            temporada,
            clasificacion: clasificacionRecalculada,
            partidos_simulados: Object.values(partidosSimulados),
          }),
        },
      );

      if (!response.ok) {
        throw new Error('No se pudo ejecutar Monte Carlo');
      }

      const data = await response.json();
      setMontecarlo(Array.isArray(data?.montecarlo) ? data.montecarlo : []);
    } catch (_e) {
      setErrorMontecarlo('No se pudo ejecutar la simulacion Monte Carlo');
      Alert.alert('Error', 'No se pudo ejecutar la simulacion Monte Carlo.');
    } finally {
      setCargandoMontecarlo(false);
    }
  };

  const tabBarOptions = useMemo(() => ({
    tabBarLabelStyle: { fontSize: 12, fontWeight: 'bold', textAlign: 'center' },
    tabBarIndicatorStyle: { backgroundColor: '#e20613' },
    tabBarActiveTintColor: '#12233f',
    tabBarInactiveTintColor: '#6f8096',
    tabBarStyle: { backgroundColor: '#ffffff' },
  }), []);

  if (cargandoInicial) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <CustomHeader
          title="Simulacion"
          onMenuPress={() => navigation.openDrawer()}
          onSearchPress={() => Alert.alert('Funcion de busqueda no implementada')}
        />
        <EstadoPantalla text="Cargando simulacion..." loading />
      </KeyboardAvoidingView>
    );
  }

  if (errorInicial) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <CustomHeader
          title="Simulacion"
          onMenuPress={() => navigation.openDrawer()}
          onSearchPress={() => Alert.alert('Funcion de busqueda no implementada')}
        />
        <EstadoPantalla text={errorInicial} />
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <CustomHeader
        title="Simulacion"
        onMenuPress={() => navigation.openDrawer()}
        onSearchPress={() => Alert.alert('Funcion de busqueda no implementada')}
      />

      <View style={styles.tabsWrapper}>
        <Tab.Navigator screenOptions={tabBarOptions}>
          <Tab.Screen name="Resultados" options={{ tabBarLabel: 'RESULTADOS' }}>
            {() => (
              <ResultadosTab
                temporada={temporada}
                jornadas={jornadas}
                jornadaSeleccionada={jornadaSeleccionada}
                partidos={partidos}
                cargandoJornada={cargandoJornada}
                errorJornada={errorJornada}
                onSeleccionarJornada={seleccionarJornada}
                onActualizarMarcador={actualizarMarcador}
                onRecalcular={recalcularEscenario}
                onReset={resetearEscenario}
              />
            )}
          </Tab.Screen>
          <Tab.Screen name="Clasificacion" options={{ tabBarLabel: 'CLASIFICACION' }}>
            {() => (
              <ClasificacionTab
                clasificacion={clasificacion}
                montecarlo={montecarlo}
                navigation={navigation}
                cargandoMontecarlo={cargandoMontecarlo}
                errorMontecarlo={errorMontecarlo}
                onEjecutarMontecarlo={ejecutarMontecarlo}
              />
            )}
          </Tab.Screen>
        </Tab.Navigator>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f8fc',
  },
  tabsWrapper: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 28,
  },
  estadoPantalla: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  estadoTexto: {
    marginTop: 7,
    color: '#5f7f9b',
    fontWeight: '700',
    fontSize: 13,
    textAlign: 'center',
  },
  topBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#102f4a',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#5f7f9b',
    fontWeight: '500',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eaf3fb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d4e5f3',
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  statusText: {
    marginLeft: 5,
    color: '#1f6fa7',
    fontWeight: '800',
    fontSize: 12,
  },
  jornadaBlock: {
    marginBottom: 12,
  },
  sectionLabel: {
    color: '#496b85',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  jornadaNavigator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  jornadaSlice: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 36,
  },
  arrowButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cfe0ee',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowButtonDisabled: {
    backgroundColor: '#edf3f8',
  },
  chip: {
    minWidth: 44,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d5e3ef',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 3,
    paddingHorizontal: 10,
  },
  chipActive: {
    backgroundColor: '#1f6fa7',
    borderColor: '#1f6fa7',
  },
  chipText: {
    color: '#45677f',
    fontSize: 13,
    fontWeight: '800',
  },
  chipTextActive: {
    color: '#ffffff',
  },
  panel: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d9e5f0',
    padding: 12,
    marginBottom: 12,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  panelTitle: {
    fontSize: 16,
    color: '#153d5d',
    fontWeight: '800',
  },
  panelSubtitle: {
    marginTop: 3,
    fontSize: 12,
    color: '#66859d',
    fontWeight: '500',
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#edf3f8',
    paddingVertical: 10,
  },
  emptyState: {
    borderTopWidth: 1,
    borderTopColor: '#edf3f8',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  emptyText: {
    marginTop: 6,
    color: '#66859d',
    fontSize: 13,
    fontWeight: '700',
  },
  matchInfo: {
    flex: 1,
    minWidth: 0,
    marginRight: 10,
  },
  matchMeta: {
    color: '#7190a8',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  teamsLine: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamCode: {
    color: '#163955',
    fontSize: 15,
    fontWeight: '900',
    minWidth: 42,
    maxWidth: 96,
  },
  vsText: {
    color: '#7591a8',
    fontSize: 12,
    fontWeight: '800',
    marginHorizontal: 8,
  },
  matchStatus: {
    marginTop: 4,
    color: '#66859d',
    fontSize: 11,
    fontWeight: '700',
  },
  scoreBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreInput: {
    width: 38,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cfe0ee',
    backgroundColor: '#f8fbfe',
    color: '#153d5d',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '900',
  },
  scoreInputOfficial: {
    backgroundColor: '#edf6ee',
    borderColor: '#bfdfc8',
  },
  scoreSeparator: {
    color: '#6c879d',
    fontSize: 16,
    fontWeight: '900',
    marginHorizontal: 5,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryAction: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#1f6fa7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  primaryActionText: {
    marginLeft: 7,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  secondaryAction: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cfe0ee',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultTabs: {
    flexDirection: 'row',
    backgroundColor: '#e6f0f8',
    borderRadius: 8,
    padding: 4,
    marginBottom: 12,
  },
  resultTab: {
    flex: 1,
    height: 36,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultTabActive: {
    backgroundColor: '#ffffff',
  },
  resultTabText: {
    color: '#58768f',
    fontSize: 12,
    fontWeight: '900',
  },
  resultTabTextActive: {
    color: '#103a5d',
  },
  montecarloAction: {
    height: 42,
    borderRadius: 8,
    backgroundColor: '#1f6fa7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  montecarloActionDisabled: {
    backgroundColor: '#7ea7c5',
  },
  montecarloActionText: {
    marginLeft: 7,
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  inlineError: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff1f1',
    borderWidth: 1,
    borderColor: '#ffd2d2',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10,
  },
  inlineErrorText: {
    flex: 1,
    marginLeft: 6,
    color: '#9b4b4b',
    fontSize: 12,
    fontWeight: '700',
  },
  tableWrap: {
    borderWidth: 1,
    borderColor: '#e0ebf4',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef5fb',
    minHeight: 38,
  },
  teamHeaderCell: {
    width: 112,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 8,
  },
  headerText: {
    color: '#52708a',
    fontSize: 11,
    fontWeight: '900',
    textAlign: 'center',
  },
  statHeaderCell: {
    width: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  probHeaderCell: {
    width: 62,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    borderTopWidth: 1,
    borderTopColor: '#edf3f8',
  },
  tableRowAlt: {
    backgroundColor: '#f9fcff',
  },
  teamCell: {
    width: 112,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  posBadge: {
    width: 23,
    height: 23,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  posText: {
    color: '#102f4a',
    fontSize: 10,
    fontWeight: '900',
  },
  teamLogo: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
    marginRight: 6,
  },
  logoFallback: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eaf3fb',
    marginRight: 6,
  },
  tableTeam: {
    flex: 1,
    color: '#163955',
    fontSize: 12,
    fontWeight: '900',
  },
  statCell: {
    width: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableValue: {
    color: '#244961',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  probCell: {
    width: 62,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  probText: {
    color: '#244961',
    fontSize: 11,
    fontWeight: '900',
    textAlign: 'center',
  },
});
