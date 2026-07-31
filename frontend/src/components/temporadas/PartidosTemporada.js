import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function PartidosTemporada({ temporada }) {
  const navigation = useNavigation();
  const temporadaBase = Number.isFinite(Number(temporada)) ? Number(temporada) : null;

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [partidos, setPartidos] = useState([]);
  const [jornadasDisponibles, setJornadasDisponibles] = useState([]);
  const [jornadaSeleccionada, setJornadaSeleccionada] = useState(null);
  const [jornadaAbierta, setJornadaAbierta] = useState(false);

  const obtenerJornadas = async (temporadaSeleccionada) => {
    const response = await fetch(
      `${process.env.EXPO_PUBLIC_API_URL}/partidos/jornadas?temporada=${temporadaSeleccionada}`
    );

    if (!response.ok) {
      throw new Error('No se pudieron cargar las jornadas');
    }

    const data = await response.json();
    const lista = Array.isArray(data?.jornadas) ? data.jornadas : [];
    const jornadas = [...new Set(
      lista.map((item) => Number(item.jornada)).filter((j) => Number.isFinite(j))
    )].sort((a, b) => a - b);

    return {
      jornadas,
      jornadaActual: Number.isFinite(Number(data?.jornada_actual)) ? Number(data.jornada_actual) : null,
    };
  };

  const obtenerPartidos = async (temporadaSeleccionada, jornada) => {
    const query = jornada ? `&jornada=${jornada}` : '';
    const response = await fetch(
      `${process.env.EXPO_PUBLIC_API_URL}/temporadas/partidos?temporada=${temporadaSeleccionada}${query}`
    );

    if (!response.ok) {
      throw new Error('No se pudieron cargar los partidos de la temporada');
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  };

  const cargarInicial = async () => {
    try {
      setCargando(true);
      setError('');

      if (!temporadaBase) {
        setPartidos([]);
        setJornadasDisponibles([]);
        setJornadaSeleccionada(null);
        return;
      }

      const { jornadas, jornadaActual } = await obtenerJornadas(temporadaBase);
      const jornadaBase = jornadaActual ?? jornadas[jornadas.length - 1] ?? null;
      const partidosTemporada = jornadaBase
        ? await obtenerPartidos(temporadaBase, jornadaBase)
        : [];

      setJornadasDisponibles(jornadas);
      setJornadaSeleccionada(jornadaBase);
      setPartidos(partidosTemporada);
    } catch (_e) {
      setError('No se pudieron obtener los partidos de la temporada');
      setPartidos([]);
      setJornadasDisponibles([]);
      setJornadaSeleccionada(null);
    } finally {
      setCargando(false);
    }
  };

  const seleccionarJornada = async (jornada) => {
    if (jornada === jornadaSeleccionada || !temporadaBase) return;

    try {
      setJornadaSeleccionada(jornada);
      setJornadaAbierta(false);
      setCargando(true);
      setError('');
      const partidosFiltrados = await obtenerPartidos(temporadaBase, jornada);
      setPartidos(partidosFiltrados);
    } catch (_e) {
      setError('No se pudieron filtrar los partidos por jornada');
      setPartidos([]);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarInicial();
  }, [temporadaBase]);

  const partidosOrdenados = useMemo(
    () => [...partidos].sort((a, b) => {
      const fechaA = `${Number(a.anio) || 0}-${String(Number(a.mes) || 0).padStart(2, '0')}-${String(Number(a.dia) || 0).padStart(2, '0')}`;
      const fechaB = `${Number(b.anio) || 0}-${String(Number(b.mes) || 0).padStart(2, '0')}-${String(Number(b.dia) || 0).padStart(2, '0')}`;
      return fechaB.localeCompare(fechaA);
    }),
    [partidos]
  );

  const renderItemPartido = ({ item }) => {
    const logoLocal = item.logo_local;
    const logoVisitante = item.logo_visitante;
    const nombreLocal = item.equipo_local;
    const nombreVisitante = item.equipo_visitante;
    const golesLocal = item.goles_local;
    const golesVisitante = item.goles_visitante;
    const estaIncompleto = item.status !== 'Completado';
    const fechaFormato = `${String(item.dia || 0).padStart(2, '0')}/${String(item.mes || 0).padStart(2, '0')}/${item.anio || ''}`;

    const handleNavegar = () => {
      navigation.navigate('DetallePartido', { id_partido: item.id_partido });
    };

    return (
      <TouchableOpacity
        style={styles.tarjetaPartido}
        onPress={handleNavegar}
        activeOpacity={0.7}
      >
        <View style={styles.columnaContenido}>
          <View style={styles.cabeceraCentro}>
            <Text style={styles.jornadaTexto}>Jornada {item.jornada ?? '-'}</Text>
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
              {estaIncompleto ? (
                <Text style={styles.horaTexto}>{item.hora || '--:--'}</Text>
              ) : (
                <>
                  <Text style={styles.marcadorTexto}>{golesLocal ?? '-'}</Text>
                  <Text style={styles.separadorMarcador}>-</Text>
                  <Text style={styles.marcadorTexto}>{golesVisitante ?? '-'}</Text>
                </>
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

  if (cargando) {
    return (
      <View style={styles.estadoPantalla}>
        <ActivityIndicator size="small" color="#1f6fa7" />
        <Text style={styles.estadoTexto}>Cargando partidos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.contenedor}>
      <View style={styles.cabeceraFiltros}>
        <Text style={styles.titulo}>Partidos</Text>
        {temporadaBase ? (
          <Text style={styles.subtitulo}>Temporada {temporadaBase}</Text>
        ) : null}
      </View>

      <View style={styles.bloqueDropdown}>
        <TouchableOpacity
          style={styles.selectorDropdown}
          onPress={() => setJornadaAbierta((prev) => !prev)}
          activeOpacity={0.8}
        >
          <Text style={styles.selectorTexto}>
            {jornadaSeleccionada ? `Jornada ${jornadaSeleccionada}` : 'Selecciona jornada'}
          </Text>
          <Ionicons
            name={jornadaAbierta ? 'chevron-up' : 'chevron-down'}
            size={16}
            color="#5a7189"
          />
        </TouchableOpacity>
        {jornadaAbierta ? (
          <View style={styles.dropdownList}>
            <ScrollView style={styles.dropdownScroll}>
              {jornadasDisponibles.map((jor) => {
                const activa = jor === jornadaSeleccionada;
                return (
                  <TouchableOpacity
                    key={`jor-${jor}`}
                    style={[styles.dropdownItem, activa && styles.dropdownItemActive]}
                    onPress={() => seleccionarJornada(jor)}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.dropdownItemText, activa && styles.dropdownItemTextActive]}>
                      Jornada {jor}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        ) : null}
      </View>

      {error ? <Text style={styles.errorTexto}>{error}</Text> : null}

      {!error && partidosOrdenados.length === 0 ? (
        <View style={styles.estadoPantalla}>
          <Ionicons name="calendar-clear-outline" size={45} color="#5f7f9b" />
          <Text style={styles.estadoTexto}>
            {jornadaSeleccionada ? 'No hay partidos en esta jornada' : 'No hay jornadas disponibles'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={partidosOrdenados}
          keyExtractor={(item, index) => `${item.id_partido ?? 'partido'}-${index}`}
          renderItem={renderItemPartido}
          contentContainerStyle={styles.listaPartidos}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: '#f4f8fc',
    paddingHorizontal: 12,
    paddingTop: 10,
  },
  cabeceraFiltros: {
    marginBottom: 8,
  },
  titulo: {
    fontSize: 17,
    fontWeight: '800',
    color: '#12233f',
  },
  subtitulo: {
    marginTop: 2,
    fontSize: 12,
    color: '#55708d',
    fontWeight: '600',
  },
  bloqueDropdown: {
    marginBottom: 10,
  },
  labelDropdown: {
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
  },
  dropdownList: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#c7d7e6',
    backgroundColor: '#ffffff',
    maxHeight: 200,
    overflow: 'hidden',
  },
  dropdownScroll: {
    paddingVertical: 6,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
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
  listaPartidos: {
    paddingBottom: 14,
  },
  tarjetaPartido: {
    flexDirection: 'column',
    alignItems: 'stretch',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d9e5f0',
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
    backgroundColor: '#ffffff',
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
    color: '#1d3850',
    fontSize: 12,
    fontWeight: '700',
  },
  equipoNombreDerecha: {
    flex: 1,
    color: '#1d3850',
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
    color: '#1d3850',
    fontWeight: '800',
    minWidth: 16,
    textAlign: 'center',
  },
  separadorMarcador: {
    fontSize: 14,
    color: '#59778f',
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
    color: '#333333',
    textAlign: 'center',
  },
  jornadaTexto: {
    fontSize: 11,
    fontWeight: '700',
    color: '#333333',
    backgroundColor: '#edf3f9',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  horaTexto: {
    fontSize: 10,
    color: '#59778f',
    fontWeight: '600',
  },
  estadoPantalla: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
    paddingTop: 32,
    paddingBottom: 200,
  },
  estadoTexto: {
    color: '#4f6782',
    fontSize: 17,
    fontWeight: '700',
  },
  errorTexto: {
    marginBottom: 8,
    color: '#b91c1c',
    backgroundColor: '#fee2e2',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontWeight: '600',
  },
});
