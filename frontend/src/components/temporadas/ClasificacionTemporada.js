import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import MontecarloClasificacion from '../MontecarloClasificacion';

const MODOS = ['TODO', 'LOCAL', 'VISITANTE'];
const VISTAS = [
  { key: 'CLASIFICACION', label: 'CLASIFICACION' },
  { key: 'PROBABILIDADES', label: 'PROBABILIDADES' },
];

const COL_TEAM = 210;
const COL_STAT = 48;

const STATS = [
  { key: 'puntos', label: 'Pts' },
  { key: 'pj', label: 'PJ' },
  { key: 'pg', label: 'PG' },
  { key: 'pe', label: 'PE' },
  { key: 'pp', label: 'PP' },
  { key: 'gf', label: 'GF' },
  { key: 'gc', label: 'GD' },
  { key: 'dg', label: 'DG' },
];

const toNumber = (valor) => {
  const n = Number(valor);
  return Number.isFinite(n) ? n : 0;
};

const formatNumero = (valor) => {
  const n = Number(valor);
  return Number.isFinite(n) ? String(n) : '-';
};

const getColorPosicion = (posicion) => {
  if (posicion === 1) return '#f6c84f';
  if (posicion >= 2 && posicion <= 4) return '#58a5ff';
  if (posicion >= 5 && posicion <= 6) return '#f29b4b';
  if (posicion === 7) return '#76d7a5';
  if (posicion >= 18) return '#f06a6a';
  return '#dce6f0';
};

const ordenClasificacion = (rows) => {
  const sortedByPos = rows.every((row, idx) => {
    if (idx === 0) return true;
    return toNumber(row.posicion) >= toNumber(rows[idx - 1].posicion);
  });

  if (sortedByPos) return rows;

  return [...rows].sort((a, b) => {
    const pa = toNumber(a.puntos);
    const pb = toNumber(b.puntos);
    if (pa !== pb) return pb - pa;
    const dga = toNumber(a.dg);
    const dgb = toNumber(b.dg);
    if (dga !== dgb) return dgb - dga;
    return toNumber(b.gf) - toNumber(a.gf);
  });
};

export default function ClasificacionTemporada({ temporada }) {
  const navigation = useNavigation();
  const temporadaBase = Number.isFinite(Number(temporada)) ? Number(temporada) : null;

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [clasificacion, setClasificacion] = useState([]);
  const [equiposById, setEquiposById] = useState({});
  const [jornadas, setJornadas] = useState([]);
  const [jornadaSeleccionada, setJornadaSeleccionada] = useState(null);
  const [modo, setModo] = useState('TODO');
  const [vista, setVista] = useState('CLASIFICACION');

  const cargarEquipos = async () => {
    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/equipos`);
    if (!response.ok) {
      throw new Error('No se pudieron cargar los equipos');
    }
    const data = await response.json();
    const lista = Array.isArray(data) ? data : [];
    return Object.fromEntries(
      lista
        .map((equipo) => [Number(equipo.id_equipo), equipo])
        .filter(([id]) => Number.isFinite(id))
    );
  };

  const cargarJornadas = async (temporadaSeleccionada) => {
    const response = await fetch(
      `${process.env.EXPO_PUBLIC_API_URL}/partidos/jornadas?temporada=${temporadaSeleccionada}`
    );
    if (!response.ok) {
      throw new Error('No se pudieron cargar las jornadas');
    }
    const data = await response.json();
    const lista = Array.isArray(data?.jornadas) ? data.jornadas : [];
    const jornadasOrdenadas = [...new Set(
      lista.map((item) => Number(item.jornada)).filter((j) => Number.isFinite(j))
    )].sort((a, b) => a - b);
    return {
      jornadas: jornadasOrdenadas,
      jornadaActual: Number.isFinite(Number(data?.jornada_actual)) ? Number(data.jornada_actual) : null,
    };
  };

  const cargarClasificacion = async (temporadaSeleccionada, jornada) => {
    const params = [];
    if (temporadaSeleccionada) params.push(`anno=${temporadaSeleccionada}`);
    if (jornada) params.push(`jornada=${jornada}`);
    const query = params.length > 0 ? `?${params.join('&')}` : '';

    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/temporadas${query}`);
    if (!response.ok) {
      throw new Error('No se pudo cargar la clasificacion');
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  };

  const cargarInicial = async () => {
    try {
      setCargando(true);
      setError('');

      if (!temporadaBase) {
        setError('Temporada no disponible');
        setClasificacion([]);
        return;
      }

      const [equiposMap, jornadasData] = await Promise.all([
        cargarEquipos(),
        cargarJornadas(temporadaBase),
      ]);

      const jornadaBase = jornadasData.jornadaActual
        ?? jornadasData.jornadas[jornadasData.jornadas.length - 1]
        ?? null;
      const rows = jornadaBase
        ? await cargarClasificacion(temporadaBase, jornadaBase)
        : [];

      setEquiposById(equiposMap);
      setJornadas(jornadasData.jornadas);
      setJornadaSeleccionada(jornadaBase);
      setClasificacion(rows);
    } catch (_e) {
      setError('No se pudo cargar la clasificacion');
      setClasificacion([]);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarInicial();
  }, [temporadaBase]);

  const seleccionarJornada = async (jornada) => {
    if (jornada === jornadaSeleccionada || !temporadaBase) return;
    try {
      setCargando(true);
      setError('');
      const rows = await cargarClasificacion(temporadaBase, jornada);
      setJornadaSeleccionada(jornada);
      setClasificacion(rows);
    } catch (_e) {
      setError('No se pudo cargar la clasificacion');
      setClasificacion([]);
    } finally {
      setCargando(false);
    }
  };

  const rowsTodo = useMemo(() => (
    ordenClasificacion(clasificacion).map((row) => ({
      ...row,
      puntos: row.puntos,
      pj: row.partidos_jugados,
      pg: row.victorias,
      pe: row.empates,
      pp: row.derrotas,
      gf: row.gf,
      gc: row.gc,
      dg: row.dg,
    }))
  ), [clasificacion]);

  const rowsLocal = useMemo(() => {
    const mapped = clasificacion.map((row) => {
      const gf = toNumber(row.gf_local);
      const gc = toNumber(row.gc_local);
      return {
        ...row,
        puntos: toNumber(row.victorias_local) * 3 + toNumber(row.empates_local),
        pj: toNumber(row.partidos_jugados_local),
        pg: toNumber(row.victorias_local),
        pe: toNumber(row.empates_local),
        pp: toNumber(row.derrotas_local),
        gf,
        gc,
        dg: gf - gc,
      };
    });

    return mapped
      .sort((a, b) => {
        if (a.puntos !== b.puntos) return b.puntos - a.puntos;
        if (a.dg !== b.dg) return b.dg - a.dg;
        return b.gf - a.gf;
      })
      .map((row, idx) => ({ ...row, posicion_calculada: idx + 1 }));
  }, [clasificacion]);

  const rowsVisitante = useMemo(() => {
    const mapped = clasificacion.map((row) => {
      const gf = toNumber(row.gf_visitante);
      const gc = toNumber(row.gc_visitante);
      return {
        ...row,
        puntos: toNumber(row.victorias_visitante) * 3 + toNumber(row.empates_visitante),
        pj: toNumber(row.partidos_jugados_visitante),
        pg: toNumber(row.victorias_visitante),
        pe: toNumber(row.empates_visitante),
        pp: toNumber(row.derrotas_visitante),
        gf,
        gc,
        dg: gf - gc,
      };
    });

    return mapped
      .sort((a, b) => {
        if (a.puntos !== b.puntos) return b.puntos - a.puntos;
        if (a.dg !== b.dg) return b.dg - a.dg;
        return b.gf - a.gf;
      })
      .map((row, idx) => ({ ...row, posicion_calculada: idx + 1 }));
  }, [clasificacion]);

  const rowsMostrar = useMemo(() => {
    switch (modo) {
      case 'LOCAL':
        return rowsLocal;
      case 'VISITANTE':
        return rowsVisitante;
      default:
        return rowsTodo;
    }
  }, [modo, rowsLocal, rowsVisitante, rowsTodo]);

  const renderFila = (row, idx) => {
    const id = Number(row.id_equipo);
    const equipo = equiposById[id] || {};
    const posicion = modo === 'TODO' ? toNumber(row.posicion) : toNumber(row.posicion_calculada);
    const colorPos = getColorPosicion(posicion);
    const forma = modo === 'TODO' ? row.forma : null;

    return (
      <TouchableOpacity
        key={`fila-${row.id_equipo}-${idx}`}
        style={[styles.row, idx % 2 === 1 && styles.rowAlt]}
        onPress={() => navigation.navigate('DetalleEquipo', { idEquipo: id })}
        activeOpacity={0.85}
      >
        <View style={styles.teamCell}>
          <View style={[styles.posBadge, { backgroundColor: colorPos }]}>
            <Text style={styles.posText}>{posicion || '-'}</Text>
          </View>
          {equipo?.logo ? (
            <Image source={{ uri: equipo.logo }} style={styles.teamLogo} />
          ) : (
            <View style={styles.logoFallback}>
              <Ionicons name="shield-outline" size={14} color="#6b86a1" />
            </View>
          )}
          <View style={styles.teamInfo}>
            <Text style={styles.teamName} numberOfLines={1}>
              {equipo?.nombre_equipo || row.nombre_equipo || '-'}
            </Text>
            {forma ? (
              <Text style={styles.teamForma} numberOfLines={1}>
                Forma: {String(forma)}
              </Text>
            ) : null}
          </View>
        </View>

        {STATS.map((col) => (
          <View key={col.key} style={styles.statCell}>
            <Text style={styles.statText}>{formatNumero(row[col.key])}</Text>
          </View>
        ))}
      </TouchableOpacity>
    );
  };

  if (cargando) {
    return (
      <View style={styles.estadoPantalla}>
        <ActivityIndicator size="small" color="#1f6fa7" />
        <Text style={styles.estadoTexto}>Cargando clasificacion...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.estadoPantalla}>
        <Ionicons name="alert-circle-outline" size={18} color="#5f7f9b" />
        <Text style={styles.estadoTexto}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.containerContent}>
      <View style={styles.topBar}>
        <Text style={styles.title}>Clasificacion</Text>
        <Text style={styles.subtitle}>
          {vista === 'PROBABILIDADES'
            ? 'Probabilidades de final de temporada'
            : 'Tabla por jornada'}
        </Text>
      </View>

      <View style={styles.vistaRow}>
        {VISTAS.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={[styles.vistaBtn, vista === item.key && styles.vistaBtnActive]}
            onPress={() => setVista(item.key)}
            activeOpacity={0.85}
          >
            <Text style={[styles.vistaText, vista === item.key && styles.vistaTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {vista === 'PROBABILIDADES' ? (
        <MontecarloClasificacion temporada={temporadaBase} />
      ) : (
        <>
          <View style={styles.selectorBlock}>
            <Text style={styles.selectorLabel}>Jornada</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.selectorRow}>
                {jornadas.map((jor) => (
                  <TouchableOpacity
                    key={`jor-${jor}`}
                    style={[styles.chip, jor === jornadaSeleccionada && styles.chipActive]}
                    onPress={() => seleccionarJornada(jor)}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.chipText, jor === jornadaSeleccionada && styles.chipTextActive]}>
                      {jor}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.modoRow}>
            {MODOS.map((item) => (
              <TouchableOpacity
                key={item}
                style={[styles.modoBtn, modo === item && styles.modoBtnActive]}
                onPress={() => setModo(item)}
                activeOpacity={0.85}
              >
                <Text style={[styles.modoText, modo === item && styles.modoTextActive]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {rowsMostrar.length === 0 ? (
            <View style={styles.emptyRow}>
              <Ionicons name="stats-chart-outline" size={18} color="#6d839a" />
              <Text style={styles.emptyText}>No hay datos de clasificacion</Text>
            </View>
          ) : (
            <View style={styles.tablaWrap}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View>
                  <View style={styles.headerRow}>
                    <View style={styles.teamHeaderCell}>
                      <Text style={styles.headerText}>Pos</Text>
                      <Text style={styles.headerText}>Equipo</Text>
                    </View>
                    {STATS.map((col) => (
                      <View key={col.key} style={styles.statHeaderCell}>
                        <Text style={styles.headerText}>{col.label}</Text>
                      </View>
                    ))}
                  </View>

                  {rowsMostrar.map((row, idx) => renderFila(row, idx))}
                </View>
              </ScrollView>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f8fc',
  },
  containerContent: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 24,
  },
  topBar: {
    marginBottom: 10,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#12233f',
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    color: '#55708d',
    fontWeight: '600',
  },
  vistaRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    marginBottom: 2,
  },
  vistaBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#eef3f9',
  },
  vistaBtnActive: {
    backgroundColor: '#1f4f7a',
  },
  vistaText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2a4763',
  },
  vistaTextActive: {
    color: '#ffffff',
  },
  selectorBlock: {
    marginTop: 10,
  },
  selectorLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1f4f7a',
    marginBottom: 6,
  },
  selectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 2,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#d4e2f0',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipActive: {
    backgroundColor: '#1f4f7a',
    borderColor: '#1f4f7a',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2c4a66',
  },
  chipTextActive: {
    color: '#ffffff',
  },
  modoRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    marginBottom: 10,
  },
  modoBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#eef3f9',
  },
  modoBtnActive: {
    backgroundColor: '#1f4f7a',
  },
  modoText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2a4763',
  },
  modoTextActive: {
    color: '#ffffff',
  },
  tablaWrap: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#d2e0ec',
    backgroundColor: '#ffffff',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    borderBottomWidth: 1,
    borderBottomColor: '#d2e0ec',
    backgroundColor: '#edf3f9',
  },
  teamHeaderCell: {
    width: COL_TEAM,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 10,
  },
  statHeaderCell: {
    width: COL_STAT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1f4f7a',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: '#eef3f7',
    backgroundColor: '#ffffff',
  },
  rowAlt: {
    backgroundColor: '#f8fbff',
  },
  teamCell: {
    width: COL_TEAM,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 8,
  },
  posBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  posText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0f2743',
  },
  teamLogo: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
  },
  logoFallback: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ecf2f8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1d3850',
  },
  teamForma: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: '700',
    color: '#6b829b',
  },
  statCell: {
    width: COL_STAT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1d3850',
  },
  emptyRow: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d9e5f0',
    paddingVertical: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  emptyText: {
    marginTop: 6,
    color: '#5f7f9b',
    fontWeight: '600',
    fontSize: 13,
  },
  estadoPantalla: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f4f8fc',
  },
  estadoTexto: {
    marginTop: 6,
    color: '#5f7f9b',
    fontWeight: '600',
    fontSize: 13,
  },
});
