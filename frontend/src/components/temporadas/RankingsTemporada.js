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
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const ATRIBUTOS = [
  {
    grupo: 'General',
    items: [
      { key: 'nota_media', label: 'Nota media' },
      { key: 'partidos', label: 'Partidos' },
      { key: 'minutos', label: 'Minutos' },
      { key: 'titular', label: 'Titularidades' },
    ],
  },
  {
    grupo: 'Porteria',
    items: [
      { key: 'paradas', label: 'Paradas' },
      { key: 'goles_concedidos', label: 'Goles concedidos' },
      { key: 'penaltis_parados', label: 'Penaltis parados' },
    ],
  },
  {
    grupo: 'Defensa',
    items: [
      { key: 'entradas', label: 'Entradas' },
      { key: 'bloqueos', label: 'Bloqueos' },
      { key: 'intercepciones', label: 'Intercepciones' },
      { key: 'duelos_ganados', label: 'Duelos ganados' },
      { key: 'duelos_totales', label: 'Duelos totales' },
      { key: 'faltas_cometidas', label: 'Faltas cometidas' },
      { key: 'regateado', label: 'Regateado' },
      { key: 'amarillas', label: 'Amarillas' },
      { key: 'rojas', label: 'Rojas' },
    ],
  },
  {
    grupo: 'Creacion',
    items: [
      { key: 'asistencias', label: 'Asistencias' },
      { key: 'pases_totales', label: 'Pases totales' },
      { key: 'pases_clave', label: 'Pases clave' },
      { key: 'precision_pases', label: 'Precision pases' },
      { key: 'regates_intentados', label: 'Regates intentados' },
      { key: 'regates_exito', label: 'Regates exitosos' },
    ],
  },
  {
    grupo: 'Ataque',
    items: [
      { key: 'goles', label: 'Goles' },
      { key: 'tiros_totales', label: 'Tiros totales' },
      { key: 'tiros_a_puerta', label: 'Tiros a puerta' },
      { key: 'faltas_sufridas', label: 'Faltas sufridas' },
      { key: 'penaltis_marcados', label: 'Penaltis marcados' },
    ],
  },
];

const MODOS = [
  { key: 'total', label: 'Total' },
  { key: 'por90', label: 'Por 90' },
];

const POSICIONES = [
  { key: 'TODAS', label: 'Todas' },
  { key: 'POR', label: 'POR' },
  { key: 'DF', label: 'DF' },
  { key: 'MED', label: 'MED' },
  { key: 'DEL', label: 'DEL' },
];

const POSICION_TEXTO = {
  POR: 'Portero',
  DF: 'Defensa',
  MED: 'Mediocentro',
  DEL: 'Delantero',
};

const META_ATRIBUTOS = ATRIBUTOS.flatMap((grupo) => grupo.items);

const getAtributoLabel = (key) => META_ATRIBUTOS.find((item) => item.key === key)?.label ?? key;

const isRating = (atributo) => atributo === 'nota_media';
const isPercentual = (atributo) => atributo === 'precision_pases';
const usaDecimales = (atributo, modo) => modo === 'por90' && !isRating(atributo) && atributo !== 'minutos';

const formatValor = (valor, atributo, modo) => {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return '-';

  if (isRating(atributo)) {
    return numero.toFixed(2);
  }

  if (isPercentual(atributo)) {
    return `${Math.round(numero)}%`;
  }

  if (usaDecimales(atributo, modo)) {
    return numero.toFixed(2);
  }

  return String(Math.round(numero));
};

export default function RankingsTemporada({ temporada }) {
  const navigation = useNavigation();
  const temporadaBase = Number.isFinite(Number(temporada)) ? Number(temporada) : null;

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [rankings, setRankings] = useState([]);
  const [selectorAbierto, setSelectorAbierto] = useState(null);
  const [atributo, setAtributo] = useState('nota_media');
  const [modo, setModo] = useState('total');
  const [posicion, setPosicion] = useState('TODAS');
  const [meta, setMeta] = useState({ atributo_label: 'Nota media', grupo: 'General' });

  const cargarRankings = async () => {
    if (!temporadaBase) {
      setError('Temporada no disponible');
      setRankings([]);
      setCargando(false);
      return;
    }

    try {
      setCargando(true);
      setError('');

      const query = [
        `temporada=${encodeURIComponent(String(temporadaBase))}`,
        `atributo=${encodeURIComponent(atributo)}`,
        `modo=${encodeURIComponent(modo)}`,
        `posicion=${encodeURIComponent(posicion)}`,
      ].join('&');

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/temporadas/rankings?${query}`);

      if (!response.ok) {
        throw new Error('No se pudieron cargar los rankings');
      }

      const data = await response.json();
      setRankings(Array.isArray(data?.rankings) ? data.rankings : []);
      setMeta(data?.metadatos ?? { atributo_label: getAtributoLabel(atributo), grupo: 'General' });
    } catch (_e) {
      setError('No se pudieron cargar los rankings');
      setRankings([]);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarRankings();
  }, [temporadaBase, atributo, modo, posicion]);

  const atributoSeleccionado = useMemo(
    () => META_ATRIBUTOS.find((item) => item.key === atributo) ?? META_ATRIBUTOS[0],
    [atributo]
  );

  const posicionSeleccionada = useMemo(
    () => POSICIONES.find((item) => item.key === posicion) ?? POSICIONES[0],
    [posicion]
  );

  const modoSeleccionado = useMemo(
    () => MODOS.find((item) => item.key === modo) ?? MODOS[0],
    [modo]
  );

  const toggleSelector = (key) => {
    setSelectorAbierto((actual) => (actual === key ? null : key));
  };

  const seleccionarAtributo = (key) => {
    setAtributo(key);
    setSelectorAbierto(null);
  };

  const seleccionarModo = (key) => {
    setModo(key);
    setSelectorAbierto(null);
  };

  const seleccionarPosicion = (key) => {
    setPosicion(key);
    setSelectorAbierto(null);
  };

  const renderJugador = (item, index) => {
    const posicionTexto = POSICION_TEXTO[item?.posicion_codigo] || item?.posicion || '-';
    const valor = formatValor(item?.valor, atributo, modo);
    const rowKey = `ranking-${item?.id_jugador ?? 'jugador'}-${item?.id_equipo ?? 'equipo'}-${index}`;

    return (
      <TouchableOpacity
        key={rowKey}
        style={[styles.row, index % 2 === 1 && styles.rowAlt]}
        activeOpacity={0.85}
        onPress={() => item?.id_jugador && navigation.navigate('DetalleJugador', { id_jugador: item.id_jugador })}
      >
        <View style={styles.rankCell}>
          <View style={styles.rankBadge}>
            <Text style={styles.rankText}>{index + 1}</Text>
          </View>
        </View>

        <View style={styles.playerCell}>
          {item?.foto ? (
            <Image source={{ uri: item.foto }} style={styles.playerAvatar} />
          ) : (
            <View style={styles.playerAvatarFallback}>
              <Ionicons name="person-outline" size={18} color="#5f7f9b" />
            </View>
          )}

          <View style={styles.playerInfo}>
            <Text style={styles.playerName} numberOfLines={1}>
              {item?.nombre || '-'}
            </Text>
            <View style={styles.playerMetaRow}>
              <Text style={styles.playerMeta} numberOfLines={1}>
                {posicionTexto}
              </Text>
              <Text style={styles.metaSeparator}>•</Text>
              <Text style={styles.playerMeta} numberOfLines={1}>
                {item?.nombre_equipo || '-'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.valueCell}>
          <Text style={styles.valueText}>{valor}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSelector = (label, selectedLabel, selectorKey, children) => {
    const abierto = selectorAbierto === selectorKey;

    return (
      <View style={styles.selectorBlock}>
        <Text style={styles.selectorLabel}>{label}</Text>
        <TouchableOpacity
          style={styles.selectorDropdown}
          onPress={() => toggleSelector(selectorKey)}
          activeOpacity={0.8}
        >
          <Text style={styles.selectorTexto}>{selectedLabel}</Text>
          <Ionicons name={abierto ? 'chevron-up' : 'chevron-down'} size={16} color="#5a7189" />
        </TouchableOpacity>
        {abierto ? children : null}
      </View>
    );
  };

  if (cargando) {
    return (
      <View style={styles.estadoPantalla}>
        <ActivityIndicator size="small" color="#1f6fa7" />
        <Text style={styles.estadoTexto}>Cargando rankings...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.estadoPantalla}>
        <Ionicons name="alert-circle-outline" size={20} color="#5f7f9b" />
        <Text style={styles.estadoTexto}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.containerContent}>
      <View style={styles.sectionCard}>
        {renderSelector(
          'Atributo',
          meta?.atributo_label || atributoSeleccionado?.label || 'Selecciona un atributo',
          'atributo',
          <View style={styles.dropdownList}>
            <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
              {ATRIBUTOS.map((grupo) => (
                <View key={grupo.grupo}>
                  <Text style={styles.dropdownGroup}>{grupo.grupo}</Text>
                  {grupo.items.map((item) => {
                    const activo = item.key === atributo;
                    return (
                      <TouchableOpacity
                        key={item.key}
                        style={[styles.dropdownItem, activo && styles.dropdownItemActive]}
                        onPress={() => seleccionarAtributo(item.key)}
                        activeOpacity={0.85}
                      >
                        <Text style={[styles.dropdownItemText, activo && styles.dropdownItemTextActive]}>
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.filterRow}>
          {MODOS.map((item) => (
            <TouchableOpacity
              key={item.key}
              style={[styles.chip, modo === item.key && styles.chipActive]}
              onPress={() => seleccionarModo(item.key)}
              activeOpacity={0.85}
            >
              <Text style={[styles.chipText, modo === item.key && styles.chipTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {renderSelector(
          'Posicion',
          posicionSeleccionada?.label || 'Todas',
          'posicion',
          <View style={styles.dropdownListCompacta}>
            <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
              {POSICIONES.map((item) => {
              const activo = item.key === posicion;
              return (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.dropdownItem, activo && styles.dropdownItemActive]}
                  onPress={() => seleccionarPosicion(item.key)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.dropdownItemText, activo && styles.dropdownItemTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
              })}
            </ScrollView>
          </View>
        )}

        <View style={styles.summaryBar}>
          <Text style={styles.summaryText}>Grupo: {meta?.grupo || '-'}</Text>
          <Text style={styles.summaryText}>Modo: {modoSeleccionado?.label || '-'}</Text>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.tableHeaderRank]}>#</Text>
          <Text style={[styles.tableHeaderText, styles.tableHeaderPlayer]}>Jugador</Text>
          <Text style={[styles.tableHeaderText, styles.tableHeaderValue]}>Valor</Text>
        </View>

        {rankings.length > 0 ? (
          <View style={styles.listaRankings}>
            {rankings.map((item, index) => renderJugador(item, index))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="stats-chart-outline" size={22} color="#5f7f9b" />
            <Text style={styles.emptyStateText}>No hay datos para mostrar</Text>
          </View>
        )}
      </View>
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
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#dbe6f0',
    padding: 14,
    marginTop: 12,
  },
  selectorBlock: {
    marginBottom: 10,
  },
  selectorLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1f4f7a',
    marginBottom: 6,
  },
  selectorDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#c7d7e6',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  selectorTexto: {
    color: '#1f4f7a',
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
    paddingRight: 8,
  },
  dropdownList: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#c7d7e6',
    backgroundColor: '#ffffff',
    maxHeight: 260,
    overflow: 'hidden',
  },
  dropdownListCompacta: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#c7d7e6',
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  dropdownScroll: {
    paddingVertical: 6,
  },
  dropdownGroup: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 4,
    color: '#6b829b',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dropdownItemActive: {
    backgroundColor: '#edf3f9',
  },
  dropdownItemText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1f4f7a',
  },
  dropdownItemTextActive: {
    color: '#0f2743',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  chip: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#d4e2f0',
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    alignItems: 'center',
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
  summaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#edf3f8',
  },
  summaryText: {
    flex: 1,
    color: '#5f7f9b',
    fontSize: 11,
    fontWeight: '700',
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#edf3f9',
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  tableHeaderText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1f4f7a',
  },
  tableHeaderRank: {
    width: 34,
  },
  tableHeaderPlayer: {
    flex: 1,
    paddingLeft: 12,
  },
  tableHeaderValue: {
    width: 74,
    textAlign: 'right',
  },
  listaRankings: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dbe6f0',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
  },
  rowAlt: {
    backgroundColor: '#f8fbff',
  },
  rankCell: {
    width: 34,
    alignItems: 'flex-start',
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#edf3f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    color: '#12233f',
    fontSize: 12,
    fontWeight: '800',
  },
  playerCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 8,
  },
  playerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#e7eef6',
  },
  playerAvatarFallback: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#e7eef6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1d3850',
  },
  playerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
    flexWrap: 'wrap',
  },
  playerMeta: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6b829b',
  },
  metaSeparator: {
    fontSize: 10,
    color: '#8da1b6',
    fontWeight: '800',
  },
  valueCell: {
    width: 74,
    alignItems: 'flex-end',
  },
  valueText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#103a5d',
  },
  emptyState: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d9e5f0',
    paddingVertical: 22,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  emptyStateText: {
    color: '#5f7f9b',
    fontWeight: '600',
    fontSize: 13,
    textAlign: 'center',
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
