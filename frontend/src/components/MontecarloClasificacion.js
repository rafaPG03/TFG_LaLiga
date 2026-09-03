import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { resolveThemeColor } from '../theme/themeRuntime';

const COL_TEAM = Platform.OS === 'web' ? 170 : 86;
const COL_PROB = Platform.OS === 'web' ? 94 : 58;

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

const TABLE_WIDTH = COL_TEAM + PROB_COLUMNS.length * COL_PROB;
const CONTENT_WIDTH = TABLE_WIDTH + 72;

const toNumber = (valor) => {
  const n = Number(valor);
  return Number.isFinite(n) ? n : 0;
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

export default function MontecarloClasificacion({ temporada, equipoId }) {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [rows, setRows] = useState([]);
  const [esTemporadaActual, setEsTemporadaActual] = useState(false);

  useEffect(() => {
    const cargarMontecarlo = async () => {
      if (!temporada) {
        setRows([]);
        setError('Temporada no disponible');
        setCargando(false);
        return;
      }

      try {
        setCargando(true);
        setError('');
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/temporadas/montecarlo?temporada=${temporada}`,
        );

        if (!response.ok) {
          throw new Error('No se pudo cargar Montecarlo');
        }

        const data = await response.json();
        setRows(Array.isArray(data?.montecarlo) ? data.montecarlo : []);
        setEsTemporadaActual(Boolean(data?.es_temporada_actual));
      } catch (_e) {
        setRows([]);
        setError('No se pudo cargar la simulacion Montecarlo');
      } finally {
        setCargando(false);
      }
    };

    cargarMontecarlo();
  }, [temporada]);

  const renderFila = (row, idx) => {
    const id = Number(row.id_equipo);
    const posicion = toNumber(row.posicion);
    const colorPos = getColorPosicion(posicion);

    return (
      <TouchableOpacity
        key={`montecarlo-${row.id_equipo}-${idx}`}
        style={[
          styles.row,
          idx % 2 === 1 && styles.rowAlt,
          id === Number(equipoId) && styles.rowHighlight,
        ]}
        onPress={() => navigation.navigate('DetalleEquipo', { idEquipo: id })}
        activeOpacity={0.85}
      >
        <View style={styles.teamCell}>
          <View style={[styles.posBadge, { backgroundColor: colorPos }]}>
            <Text style={styles.posText}>{posicion || '-'}</Text>
          </View>
          {row?.logo ? (
            <Image source={{ uri: row.logo }} style={styles.teamLogo} />
          ) : (
            <View style={styles.logoFallback}>
              <Ionicons name="shield-outline" size={14} color="#6b86a1" />
            </View>
          )}
          <View style={styles.teamInfo}>
            <Text
              style={styles.teamName}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
            >
              {row.codigo || row.nombre_equipo || row.equipo || '-'}
            </Text>
          </View>
        </View>

        {PROB_COLUMNS.map((col) => (
          <View
            key={col.key}
            style={[
              styles.probCell,
              {
                backgroundColor: resolveThemeColor(
                  getProbBackground(row[col.key], col.palette),
                  'backgroundColor'
                ),
              },
            ]}
          >
            <Text style={[styles.probText, isDark && { color: colors.textStrong }]}>
              {formatPct(row[col.key])}
            </Text>
          </View>
        ))}
      </TouchableOpacity>
    );
  };

  if (cargando) {
    return (
      <View style={styles.estadoPantalla}>
        <ActivityIndicator size="small" color="#1f6fa7" />
        <Text style={styles.estadoTexto}>Cargando Montecarlo...</Text>
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
    <View style={styles.container}>
      <View style={styles.montecarloInfo}>
        <Ionicons name="analytics-outline" size={17} color="#1f4f7a" />
        <Text style={styles.montecarloInfoText}>
          {esTemporadaActual
            ? 'Simulacion actual de final de temporada'
            : 'Resultado historico convertido a probabilidad final'}
        </Text>
      </View>

      {rows.length === 0 ? (
        <View style={styles.emptyRow}>
          <Ionicons name="stats-chart-outline" size={18} color="#6d839a" />
          <Text style={styles.emptyText}>No hay datos de Montecarlo</Text>
        </View>
      ) : (
        <View style={styles.tablaWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.tablaInner}>
              <View style={styles.headerRow}>
                <View style={styles.teamHeaderCell}>
                  <Text style={styles.headerText}>Pos</Text>
                  <Text style={styles.headerText}>Equipo</Text>
                </View>
                {PROB_COLUMNS.map((col) => (
                  <View key={col.key} style={styles.probHeaderCell}>
                    <Text
                      style={styles.headerText}
                      numberOfLines={2}
                      adjustsFontSizeToFit
                      minimumFontScale={0.75}
                    >
                      {col.label}
                    </Text>
                  </View>
                ))}
              </View>

              {rows.map((row, idx) => renderFila(row, idx))}
            </View>
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: CONTENT_WIDTH,
    alignSelf: 'center',
  },
  estadoPantalla: {
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  estadoTexto: {
    marginTop: 6,
    color: '#5f7f9b',
    fontWeight: '600',
    fontSize: 13,
  },
  montecarloInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#eaf3fb',
    borderWidth: 1,
    borderColor: '#d1e2f1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    marginTop: 6,
  },
  montecarloInfoText: {
    flex: 1,
    color: '#244c70',
    fontSize: 12,
    fontWeight: '700',
  },
  tablaWrap: {
    width: '100%',
    maxWidth: TABLE_WIDTH,
    alignSelf: 'center',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#d2e0ec',
    backgroundColor: '#ffffff',
  },
  tablaInner: {
    width: TABLE_WIDTH,
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
    gap: 5,
    paddingHorizontal: 5,
  },
  probHeaderCell: {
    width: COL_PROB,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    fontSize: Platform.OS === 'web' ? 11 : 9,
    fontWeight: '700',
    color: '#1f4f7a',
    textAlign: 'center',
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
  rowHighlight: {
    borderBottomWidth: 2,
    borderBottomColor: '#b9d1e8',
  },
  teamCell: {
    width: COL_TEAM,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    gap: 5,
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
    width: 18,
    height: 18,
    resizeMode: 'contain',
  },
  logoFallback: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ecf2f8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: Platform.OS === 'web' ? 12 : 11,
    fontWeight: '800',
    color: '#1d3850',
  },
  probCell: {
    width: COL_PROB,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#eef3f7',
    paddingHorizontal: 2,
  },
  probText: {
    fontSize: 11,
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
});
