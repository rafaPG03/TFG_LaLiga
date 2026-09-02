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

export default function AlineacionTab({ route, navigation }) {
  const { id_partido, partidoInfo } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [datos, setDatos] = useState([]);
  const [equipoSeleccionado, setEquipoSeleccionado] = useState('local');

  useEffect(() => {
    const cargarAlineaciones = async () => {
      try {
        setLoading(true);
        setError('');

        if (!id_partido) {
          setError('Partido invalido');
          setDatos([]);
          return;
        }

        const response = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/partidos/${id_partido}/alineaciones`
        );

        if (!response.ok) {
          throw new Error('No se pudieron cargar las alineaciones');
        }

        const data = await response.json();
        setDatos(Array.isArray(data) ? data : []);
      } catch (e) {
        setError('No se pudieron obtener las alineaciones del partido');
        setDatos([]);
      } finally {
        setLoading(false);
      }
    };

    cargarAlineaciones();
  }, [id_partido]);

  const equipos = useMemo(() => {
    const localId = partidoInfo?.id_local;
    const visitanteId = partidoInfo?.id_visitante;

    const local = {
      key: 'local',
      id: localId,
      nombre: partidoInfo?.equipo_local || 'Equipo local',
      logo: partidoInfo?.logo_local || null,
    };

    const visitante = {
      key: 'visitante',
      id: visitanteId,
      nombre: partidoInfo?.equipo_visitante || 'Equipo visitante',
      logo: partidoInfo?.logo_visitante || null,
    };

    return { local, visitante };
  }, [partidoInfo]);

  const jugadoresEquipo = useMemo(() => {
    const idEquipo = equipos[equipoSeleccionado]?.id;

    if (!idEquipo) return [];

    return datos.filter((jugador) => Number(jugador.id_equipo) === Number(idEquipo));
  }, [datos, equipoSeleccionado, equipos]);

  const titulares = useMemo(() => {
    return jugadoresEquipo.filter((jugador) => jugador.sustituto !== true);
  }, [jugadoresEquipo]);

  const suplentes = useMemo(() => {
    return jugadoresEquipo.filter((jugador) => jugador.sustituto === true);
  }, [jugadoresEquipo]);

  const [orden, setOrden] = useState({ campo: null, modo: 'default' });
// campo: 'nota' | 'posicion' | null
// modo: 'default' (orden endpoint) | 'activo' (orden por columna)

const mapPosicion = { P: 1, DF: 2, M: 3, DL: 4 };

const alternarOrden = (campo) => {
  setOrden((prev) => {
    if (prev.campo !== campo) {
      return { campo, modo: 'activo' };
    }
    return { campo, modo: prev.modo === 'activo' ? 'default' : 'activo' };
  });
};

const ordenarLista = (lista) => {
  if (orden.modo === 'default' || !orden.campo) return lista;

  const copia = [...lista];

  if (orden.campo === 'nota') {
    return copia.sort((a, b) => {
      const na = Number(a.nota);
      const nb = Number(b.nota);
      const va = Number.isFinite(na) ? na : -Infinity;
      const vb = Number.isFinite(nb) ? nb : -Infinity;
      return vb - va; // mayor a menor
    });
  }

  if (orden.campo === 'posicion') {
    return copia.sort(
      (a, b) => (mapPosicion[a.posicion] ?? 99) - (mapPosicion[b.posicion] ?? 99)
    ); // orden endpoint
  }

  return lista;
};

const titularesOrdenados = useMemo(() => ordenarLista(titulares), [titulares, orden]);
const suplentesOrdenados = useMemo(() => ordenarLista(suplentes), [suplentes, orden]);

  const formatearNota = (nota) => {
    const n = Number(nota);
    if (!Number.isFinite(n)) return '-';
    return n.toFixed(2);
  };

  const irDetalleJugador = (id_jugador) => {
    if (!id_jugador) return;
    navigation.navigate('DetalleJugador', { id_jugador });
  };

  const renderFilaJugador = (jugador) => {
    return (
      <TouchableOpacity
        key={jugador.id_jugador}
        style={styles.filaTabla}
        activeOpacity={0.85}
        onPress={() => irDetalleJugador(jugador.id_jugador)}
      >
        <View style={styles.colJugador}>
          {jugador.foto ? (
            <Image source={{ uri: jugador.foto }} style={styles.fotoJugador} />
          ) : (
            <View style={styles.fotoFallback}>
              <Ionicons name="person-outline" size={15} color="#5f7f9b" />
            </View>
          )}

          <View style={styles.nombreWrap}>
            <Text style={styles.nombreJugador} numberOfLines={1}>
              {jugador.nombre || '-'}
            </Text>
          </View>

          {jugador.capitan ? (
            <View style={styles.capitanBadge}>
              <Text style={styles.capitanText}>C</Text>
            </View>
          ) : (
            <View style={styles.capitanSpacer} />
          )}
        </View>

        <Text style={styles.colPos}>{jugador.posicion ?? '-'}</Text>
        <Text style={styles.colMinutos}>{jugador.minutos ?? '-'}</Text>
        <Text style={styles.colNota}>{formatearNota(jugador.nota)}</Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="large" color="#1f6fa7" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.selectorWrap}>
        {[equipos.local, equipos.visitante].map((equipo) => {
          const activo = equipoSeleccionado === equipo.key;
          return (
            <TouchableOpacity
              key={equipo.key}
              style={[styles.selectorBtn, activo && styles.selectorBtnActivo]}
              onPress={() => setEquipoSeleccionado(equipo.key)}
              activeOpacity={0.9}
            >
              {equipo.logo ? (
                <Image source={{ uri: equipo.logo }} style={styles.logoEquipo} />
              ) : (
                <View style={styles.logoFallback}>
                  <Ionicons name="shield-outline" size={14} color="#5f7f9b" />
                </View>
              )}
              <Text style={[styles.selectorText, activo && styles.selectorTextActivo]} numberOfLines={1}>
                {equipo.nombre}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {!error && jugadoresEquipo.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="information-circle-outline" size={20} color="#5f7f9b" />
          <Text style={styles.emptyText}>No hay alineacion disponible para este equipo</Text>
        </View>
      ) : null}

      {jugadoresEquipo.length > 0 ? (
        <>
          <View style={styles.seccionWrap}>
            <Text style={styles.seccionTitulo}>Titulares</Text>
            <View style={styles.tablaWrap}>
              <View style={styles.headerTabla}>
                <Text style={[styles.headerText, styles.headerJugador]}>Jugador</Text>

                <TouchableOpacity
                  style={styles.headerPosBtn}
                  onPress={() => alternarOrden('posicion')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.headerText, styles.headerPos]}>Pos</Text>
                  <Text style={styles.sortIcon}>
                    {orden.campo === 'posicion' && orden.modo === 'activo' ? '↓' : ''}
                  </Text>
                </TouchableOpacity>

                <Text style={[styles.headerText, styles.headerMinutos]}>Min</Text>

                <TouchableOpacity
                  style={styles.headerNotaBtn}
                  onPress={() => alternarOrden('nota')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.headerText, styles.headerNota]}>Nota</Text>
                  <Text style={styles.sortIcon}>
                    {orden.campo === 'nota' && orden.modo === 'activo' ? '↓' : ''}
                  </Text>
                </TouchableOpacity>
              </View>
              {titulares.length > 0 ? (
                titularesOrdenados.map(renderFilaJugador)
              ) : (
                <Text style={styles.emptySeccion}>Sin titulares registrados</Text>
              )}
            </View>
          </View>

          <View style={styles.seccionWrap}>
            <Text style={styles.seccionTitulo}>Suplentes</Text>
            <View style={styles.tablaWrap}>
              <View style={styles.headerTabla}>
                <Text style={[styles.headerText, styles.headerJugador]}>Jugador</Text>

                <TouchableOpacity
                  style={styles.headerPosBtn}
                  onPress={() => alternarOrden('posicion')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.headerText, styles.headerPos]}>Pos</Text>
                  <Text style={styles.sortIcon}>
                    {orden.campo === 'posicion' && orden.modo === 'activo' ? '↓' : ''}
                  </Text>
                </TouchableOpacity>

                <Text style={[styles.headerText, styles.headerMinutos]}>Min</Text>

                <TouchableOpacity
                  style={styles.headerNotaBtn}
                  onPress={() => alternarOrden('nota')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.headerText, styles.headerNota]}>Nota</Text>
                  <Text style={styles.sortIcon}>
                    {orden.campo === 'nota' && orden.modo === 'activo' ? '↓' : ''}
                  </Text>
                </TouchableOpacity>
              </View>
              {suplentes.length > 0 ? (
                suplentesOrdenados.map(renderFilaJugador)
              ) : (
                <Text style={styles.emptySeccion}>Sin suplentes registrados</Text>
              )}
            </View>
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

const COL_POS_WIDTH = 52;
const COL_MIN_WIDTH = 50;
const COL_NOTA_WIDTH = 58;

const styles = StyleSheet.create({
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 28,
  },
  selectorWrap: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  selectorBtn: {
    flex: 1,
    backgroundColor: '#e9f1f8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#c5d8ea',
    paddingHorizontal: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectorBtnActivo: {
    backgroundColor: '#1f4f7a',
    borderColor: '#1f4f7a',
  },
  selectorText: {
    flex: 1,
    color: '#1f4f7a',
    fontSize: 12,
    fontWeight: '700',
  },
  selectorTextActivo: {
    color: '#eef6ff',
  },
  logoEquipo: {
    width: 22,
    height: 22,
    borderRadius: 11,
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  logoFallback: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#b91c1c',
    backgroundColor: '#fee2e2',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10,
    fontWeight: '600',
  },
  emptyWrap: {
    marginTop: 2,
    backgroundColor: '#e9f1f8',
    borderColor: '#c5d8ea',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyText: {
    color: '#3d5b77',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  seccionWrap: {
    marginTop: 12,
  },
  seccionTitulo: {
    fontSize: 15,
    fontWeight: '800',
    color: '#12233f',
    marginBottom: 8,
  },
  tablaWrap: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#d2e0ec',
    backgroundColor: '#ffffff',
  },
  headerTabla: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#edf3f9',
    borderBottomWidth: 1,
    borderBottomColor: '#d2e0ec',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  headerText: {
    color: '#2f4a63',
    fontSize: 12,
    fontWeight: '800',
  },
  headerJugador: {
    flex: 1,
  },
  headerMinutos: {
    width: COL_MIN_WIDTH,
    textAlign: 'center',
  },
  headerNota: {
    width: COL_NOTA_WIDTH,
    textAlign: 'center',
  },
  filaTabla: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#eef3f7',
  },
  colJugador: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fotoJugador: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#e8edf2',
  },
  fotoFallback: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e8edf2',
  },
  nombreWrap: {
    flex: 1,
  },
  nombreJugador: {
    color: '#1f3851',
    fontSize: 13,
    fontWeight: '600',
  },
  capitanBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#e20613',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  capitanText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  capitanSpacer: {
    width: 20,
  },
  colMinutos: {
    width: COL_MIN_WIDTH,
    textAlign: 'center',
    color: '#1f3851',
    fontWeight: '700',
    fontSize: 12,
  },
  colNota: {
    width: COL_NOTA_WIDTH,
    textAlign: 'center',
    color: '#1f3851',
    fontWeight: '700',
    fontSize: 12,
  },
  emptySeccion: {
    color: '#5f7f9b',
    fontWeight: '600',
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  headerPosBtn: {
    width: COL_POS_WIDTH,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  headerNotaBtn: {
    width: COL_NOTA_WIDTH,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  headerPos: {
    width: 'auto',
    textAlign: 'center',
  },
  sortIcon: {
    fontSize: 11,
    color: '#2f4a63',
    fontWeight: '800',
    minWidth: 8,
    textAlign: 'center',
  },
  colPos: {
    width: COL_POS_WIDTH,
    textAlign: 'center',
    color: '#1f3851',
    fontWeight: '700',
    fontSize: 12,
  },
});
