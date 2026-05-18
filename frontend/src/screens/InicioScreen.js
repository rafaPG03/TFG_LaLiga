import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomHeader from '../components/header';
import { useFavoritos } from '../context/FavoritosContext';

const formatearHora = (hora) => {
  if (!hora || typeof hora !== 'string') {
    return '--:--';
  }

  return hora.slice(0, 5);
};

const construirFechaISO = (partido) => {
  if (partido.fecha_iso) {
    return partido.fecha_iso;
  }

  if (partido.anio && partido.mes && partido.dia) {
    const mes = String(partido.mes).padStart(2, '0');
    const dia = String(partido.dia).padStart(2, '0');
    return `${partido.anio}-${mes}-${dia}`;
  }

  return 'Sin fecha';
};

const formatearFechaCabecera = (fechaISO) => {
  if (!fechaISO || fechaISO === 'Sin fecha') {
    return 'Fecha sin información';
  }

  const fecha = new Date(`${fechaISO}T00:00:00`);
  if (Number.isNaN(fecha.getTime())) {
    return fechaISO;
  }

  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(fecha);
};

const formatearFechaPartido = (partido) => {
  if (partido.dia && partido.nombre_mes) {
    return `${partido.dia} ${partido.nombre_mes}`;
  }

  const fechaISO = construirFechaISO(partido);
  if (!fechaISO || fechaISO === 'Sin fecha') {
    return 'Fecha sin información';
  }

  return fechaISO;
};

const esPartidoFavorito = (partido, favSet) => {
  return favSet.has(Number(partido.id_local)) || favSet.has(Number(partido.id_visitante));
};

export default function InicioScreen({ navigation }) {
  const { equiposFav } = useFavoritos();
  const [temporadas, setTemporadas] = useState([]);
  const [jornadas, setJornadas] = useState([]);
  const [temporadaSeleccionada, setTemporadaSeleccionada] = useState(null);
  const [jornadaSeleccionada, setJornadaSeleccionada] = useState(null);
  const [partidosDelDia, setPartidosDelDia] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [cargandoFiltros, setCargandoFiltros] = useState(false);
  const [errorCarga, setErrorCarga] = useState('');
  const [selectorVisible, setSelectorVisible] = useState(false);
  const [tipoSelector, setTipoSelector] = useState(null);

  useEffect(() => {
    let pantallaActiva = true;

    const cargarTemporadas = async () => {
      setCargandoFiltros(true);
      setErrorCarga('');

      try {
        const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/temporadas/annos`);

        if (!response.ok) {
          throw new Error('No se pudieron cargar las temporadas');
        }

        const data = await response.json();

        if (!pantallaActiva) {
          return;
        }

        const temporadasDisponibles = Array.isArray(data)
          ? data.map((item) => item.temporada).filter((valor) => Number.isInteger(valor))
          : [];

        setTemporadas(temporadasDisponibles);
        setTemporadaSeleccionada(temporadasDisponibles[0] ?? null);
      } catch (error) {
        if (pantallaActiva) {
          setErrorCarga('No se pudieron cargar las temporadas');
        }
      } finally {
        if (pantallaActiva) {
          setCargandoFiltros(false);
        }
      }
    };

    cargarTemporadas();

    return () => {
      pantallaActiva = false;
    };
  }, []);

  useEffect(() => {
    let pantallaActiva = true;

    const cargarJornadas = async () => {
      if (!temporadaSeleccionada) {
        setJornadas([]);
        setJornadaSeleccionada(null);
        return;
      }

      setCargandoFiltros(true);
      try {
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/partidos/jornadas?temporada=${temporadaSeleccionada}`
        );

        if (!response.ok) {
          throw new Error('No se pudieron cargar las jornadas');
        }

        const data = await response.json();

        if (!pantallaActiva) {
          return;
        }

        const jornadasRaw = Array.isArray(data)
          ? data
          : Array.isArray(data?.jornadas)
            ? data.jornadas
            : [];

        const jornadasDisponibles = jornadasRaw
          .map((item) => item.jornada)
          .filter((valor) => Number.isInteger(valor));

        const jornadaActual = Number.isInteger(data?.jornada_actual)
          ? data.jornada_actual + 1
          : null;

        setJornadas(jornadasDisponibles);
        setJornadaSeleccionada(
          jornadaActual && jornadasDisponibles.includes(jornadaActual)
            ? jornadaActual
            : jornadasDisponibles[jornadasDisponibles.length - 1] ?? null
        );
      } catch (error) {
        if (pantallaActiva) {
          setErrorCarga('No se pudieron cargar las jornadas');
          setJornadas([]);
          setJornadaSeleccionada(null);
        }
      } finally {
        if (pantallaActiva) {
          setCargandoFiltros(false);
        }
      }
    };

    cargarJornadas();

    return () => {
      pantallaActiva = false;
    };
  }, [temporadaSeleccionada]);

  useEffect(() => {
    let pantallaActiva = true;

    const cargarPartidos = async () => {
      if (!temporadaSeleccionada || !jornadaSeleccionada) {
        setPartidosDelDia([]);
        return;
      }

      setCargando(true);
      setErrorCarga('');

      try {
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/partidos?temporada=${temporadaSeleccionada}&jornada=${jornadaSeleccionada}`
        );

        if (!response.ok) {
          throw new Error('No se pudieron cargar los partidos');
        }

        const data = await response.json();

        if (pantallaActiva) {
          setPartidosDelDia(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (pantallaActiva) {
          setErrorCarga('No se pudo conectar con el servidor');
          setPartidosDelDia([]);
        }
      } finally {
        if (pantallaActiva) {
          setCargando(false);
        }
      }
    };

    cargarPartidos();

    return () => {
      pantallaActiva = false;
    };
  }, [temporadaSeleccionada, jornadaSeleccionada]);

  const { favoritos, otrosAgrupados } = useMemo(() => {
    const favSet = new Set(equiposFav.map((id) => Number(id)));
    const grupos = new Map();
    const partidosFavoritos = [];

    partidosDelDia.forEach((partido) => {
      if (esPartidoFavorito(partido, favSet)) {
        partidosFavoritos.push(partido);
        return;
      }

      const fechaISO = construirFechaISO(partido);

      if (!grupos.has(fechaISO)) {
        grupos.set(fechaISO, []);
      }

      grupos.get(fechaISO).push(partido);
    });

    return {
      favoritos: partidosFavoritos,
      otrosAgrupados: Array.from(grupos.entries()).map(([fechaISO, partidos]) => ({
        fechaISO,
        partidos,
      })),
    };
  }, [partidosDelDia, equiposFav]);

  const renderPartidoCard = (partido) => {
    const logoLocal = partido.logo_local;
    const logoVisitante = partido.logo_visitante;
    const nombreLocal = partido.equipo_local;
    const nombreVisitante = partido.equipo_visitante;
    const golesLocal = partido.goles_local;
    const golesVisitante = partido.goles_visitante;
    const tieneMarcador = partido.goles_local != null && partido.goles_visitante != null;
    const estaCompletado = partido.status === 'Completado' || tieneMarcador;
    const fechaFormato = `${String(partido.dia || 0).padStart(2, '0')}/${String(partido.mes || 0).padStart(2, '0')}/${partido.anio || ''}`;

    return (
      <TouchableOpacity
        key={String(partido.id_partido)}
        style={styles.tarjetaPartido}
        onPress={() => irDetallePartido(partido.id_partido)}
        activeOpacity={0.7}
      >
        <View style={styles.columnaContenido}>
          <View style={styles.cabeceraCentro}>
            <Text style={styles.jornadaTexto}>Jornada {partido.jornada ?? '-'}</Text>
          </View>

          <View style={styles.filaEquipos}>
            <View style={styles.equipoBloque}>
              <View style={styles.equipoFila}>
                {logoLocal ? (
                  <Image source={{ uri: logoLocal }} style={styles.logoEquipo} />
                ) : (
                  <View style={styles.logoFallback}>
                    <Ionicons name="shield-outline" size={14} color="#5f7f9b" />
                  </View>
                )}
                <Text style={styles.equipoNombre} numberOfLines={1}>
                  {nombreLocal || '-'}
                </Text>
              </View>
            </View>

            <View style={styles.marcadorBloque}>
              {estaCompletado ? (
                <>
                  <Text style={styles.marcadorTexto}>{golesLocal ?? '-'}</Text>
                  <Text style={styles.separadorMarcador}>-</Text>
                  <Text style={styles.marcadorTexto}>{golesVisitante ?? '-'}</Text>
                </>
              ) : (
                <Text style={styles.horaTexto}>{formatearHora(partido.hora)}</Text>
              )}
            </View>

            <View style={[styles.equipoBloque, styles.equipoBloqueDerecha]}>
              <View style={styles.equipoFilaDerecha}>
                <Text style={styles.equipoNombreDerecha} numberOfLines={1}>
                  {nombreVisitante || '-'}
                </Text>
                {logoVisitante ? (
                  <Image source={{ uri: logoVisitante }} style={styles.logoEquipo} />
                ) : (
                  <View style={styles.logoFallback}>
                    <Ionicons name="shield-outline" size={14} color="#5f7f9b" />
                  </View>
                )}
              </View>
            </View>
          </View>

          <View style={styles.piePartido}>
            <Text style={styles.fechaTexto}>{fechaFormato}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const irDetallePartido = (id_partido) => {
    navigation.navigate('DetallePartido', { id_partido });
  };

  const abrirSelector = (tipo) => {
    setTipoSelector(tipo);
    setSelectorVisible(true);
  };

  const cerrarSelector = () => {
    setSelectorVisible(false);
    setTipoSelector(null);
  };

  const opcionesSelector = tipoSelector === 'temporada' ? temporadas : jornadas;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <CustomHeader
        title="Partidos"
        onMenuPress={() => navigation.openDrawer()}
        onSearchPress={() => Alert.alert('Función de búsqueda no implementada')}
      />

      <ScrollView
        contentContainerStyle={styles.screenContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.filterSection}>
          <Text style={styles.sectionTitle}>Selecciona temporada y jornada</Text>
          <View style={styles.selectorsRow}>
            <View style={styles.selectorGroup}>
              <Text style={styles.filterLabel}>Temporada</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => abrirSelector('temporada')}
                activeOpacity={0.85}
              >
                <Text style={styles.dropdownButtonText}>{temporadaSeleccionada ?? 'Selecciona'}</Text>
                <Ionicons name="chevron-down" size={18} color="#2b5b84" />
              </TouchableOpacity>
            </View>

            <View style={styles.selectorGroup}>
              <Text style={styles.filterLabel}>Jornada</Text>
              <TouchableOpacity
                style={[styles.dropdownButton, !jornadas.length && styles.dropdownButtonDisabled]}
                onPress={() => abrirSelector('jornada')}
                activeOpacity={0.85}
                disabled={!jornadas.length}
              >
                <Text style={styles.dropdownButtonText}>
                  {jornadaSeleccionada ? `J${jornadaSeleccionada}` : 'Selecciona'}
                </Text>
                <Ionicons name="chevron-down" size={18} color="#2b5b84" />
              </TouchableOpacity>
            </View>
          </View>

          {cargandoFiltros ? (
            <View style={styles.filtersLoadingRow}>
              <ActivityIndicator size="small" color="#1f6fa7" />
              <Text style={styles.filtersLoadingText}>Cargando filtros...</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.matchesSection}>
          {cargando ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="small" color="#1f6fa7" />
              <Text style={styles.loadingText}>Cargando partidos...</Text>
            </View>
          ) : errorCarga ? (
            <View style={styles.emptyState}>
              <Ionicons name="alert-circle-outline" size={34} color="#5f7f9b" />
              <Text style={styles.emptyStateText}>{errorCarga}</Text>
            </View>
          ) : partidosDelDia.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-clear-outline" size={34} color="#5f7f9b" />
              <Text style={styles.emptyStateText}>No hay partidos para esta jornada</Text>
            </View>
          ) : (
            <>
              {favoritos.length > 0 ? (
                <View style={styles.groupBlock}>
                  <Text style={styles.groupTitleFav}>Favoritos</Text>
                  {favoritos.map(renderPartidoCard)}
                </View>
              ) : null}

              <View style={styles.groupBlock}>
                {favoritos.length > 0 ? <View style={styles.separatorLine} /> : null}
                {otrosAgrupados.map((grupo) => (
                  <View key={grupo.fechaISO} style={styles.dateGroupBlock}>
                    <Text style={styles.dateGroupTitle}>{formatearFechaCabecera(grupo.fechaISO)}</Text>
                    {grupo.partidos.map(renderPartidoCard)}
                  </View>
                ))}
              </View>
            </>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={selectorVisible}
        transparent
        animationType="fade"
        onRequestClose={cerrarSelector}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {tipoSelector === 'temporada' ? 'Selecciona temporada' : 'Selecciona jornada'}
              </Text>
              <TouchableOpacity onPress={cerrarSelector} style={styles.modalCloseButton}>
                <Ionicons name="close" size={18} color="#1f6fa7" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalOptionsList}>
              {opcionesSelector.map((opcion) => {
                const valor = Number(opcion);
                const estaActiva =
                  tipoSelector === 'temporada'
                    ? valor === temporadaSeleccionada
                    : valor === jornadaSeleccionada;

                return (
                  <TouchableOpacity
                    key={String(valor)}
                    style={[styles.modalOption, estaActiva && styles.modalOptionActive]}
                    onPress={() => {
                      if (tipoSelector === 'temporada') {
                        setTemporadaSeleccionada(valor);
                      } else {
                        setJornadaSeleccionada(valor);
                      }
                      cerrarSelector();
                    }}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.modalOptionText, estaActiva && styles.modalOptionTextActive]}>
                      {tipoSelector === 'temporada' ? valor : `Jornada ${valor}`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f8fc',
  },
  screenContent: {
    paddingBottom: 26,
  },
  filterSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#163f61',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#52738e',
    paddingHorizontal: 2,
    marginBottom: 8,
  },
  selectorsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    marginBottom: 4,
    gap: 12,
  },
  selectorGroup: {
    flexShrink: 1,
  },
  dropdownButton: {
    marginBottom: 0,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d1e0ed',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    minWidth: 116,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownButtonDisabled: {
    opacity: 0.55,
  },
  dropdownButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#28506d',
  },
  filtersLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 2,
  },
  filtersLoadingText: {
    marginLeft: 8,
    fontSize: 13,
    fontWeight: '500',
    color: '#59778f',
  },
  matchesSection: {
    marginTop: 10,
    paddingHorizontal: 16,
  },
  groupBlock: {
    marginBottom: 10,
  },
  groupTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#4f6d86',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  groupTitleFav: {
    fontSize: 13,
    fontWeight: '900',
    color: '#1b547e',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  separatorLine: {
    height: 1,
    backgroundColor: '#d7e4f0',
    marginBottom: 12,
    marginTop: 4,
  },
  dateGroupBlock: {
    marginBottom: 4,
  },
  dateGroupTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4f6d86',
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  tarjetaPartido: {
    flexDirection: 'column',
    alignItems: 'stretch',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dbe6f0',
    marginBottom: 8,
    overflow: 'hidden',
  },
  columnaContenido: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
    justifyContent: 'flex-start',
  },
  cabeceraCentro: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  filaEquipos: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    marginTop: 2,
  },
  equipoBloque: {
    flex: 1,
    alignItems: 'flex-start',
    gap: 2,
  },
  equipoBloqueDerecha: {
    alignItems: 'flex-end',
  },
  equipoFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  equipoFilaDerecha: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  logoEquipo: {
    width: 22,
    height: 22,
    borderRadius: 11,
    resizeMode: 'contain',
    backgroundColor: '#f0f5fa',
  },
  logoFallback: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#e8edf2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  equipoNombre: {
    flex: 1,
    color: '#173a5d',
    fontSize: 12,
    fontWeight: '700',
  },
  equipoNombreDerecha: {
    flex: 1,
    color: '#173a5d',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
  },
  marcadorBloque: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    minWidth: 52,
  },
  marcadorTexto: {
    fontSize: 16,
    color: '#0f2743',
    fontWeight: '800',
    minWidth: 16,
    textAlign: 'center',
  },
  separadorMarcador: {
    fontSize: 14,
    color: '#6c8299',
    fontWeight: '800',
  },
  piePartido: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  fechaTexto: {
    fontSize: 11,
    fontWeight: '700',
    color: '#123455',
    textAlign: 'center',
  },
  jornadaTexto: {
    fontSize: 11,
    fontWeight: '700',
    color: '#32506f',
    backgroundColor: '#edf3f9',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  horaTexto: {
    fontSize: 10,
    color: '#6c8299',
    fontWeight: '600',
  },
  emptyState: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d9e5f0',
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingState: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d9e5f0',
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#59778f',
    fontWeight: '500',
  },
  emptyStateText: {
    marginTop: 8,
    fontSize: 14,
    color: '#59778f',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(13, 33, 51, 0.35)',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d9e5f0',
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#163f61',
  },
  modalCloseButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#e8f1f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOptionsList: {
    paddingHorizontal: 10,
    paddingBottom: 12,
  },
  modalOption: {
    height: 42,
    borderRadius: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 8,
    backgroundColor: '#f7fbff',
    borderWidth: 1,
    borderColor: '#d9e5f0',
  },
  modalOptionActive: {
    backgroundColor: '#1f6fa7',
    borderColor: '#1f6fa7',
  },
  modalOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#214964',
  },
  modalOptionTextActive: {
    color: '#ffffff',
  },
});