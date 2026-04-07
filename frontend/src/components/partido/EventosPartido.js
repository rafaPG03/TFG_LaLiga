import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function EventosTab({ route, navigation }) {
  const { id_partido } = route.params;
  const [loading, setLoading] = useState(true);
  const [datos, setDatos] = useState([]);
  const [error, setError] = useState('');
  const [logosEquipo, setLogosEquipo] = useState({});
  const [jugadoresInfo, setJugadoresInfo] = useState({});

  useEffect(() => {
    const cargarInfoEquipos = async (idsEquipo) => {
      const respuestas = await Promise.all(
        idsEquipo.map(async (idEquipo) => {
          try {
            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/equipos/${idEquipo}`);
            if (!res.ok) return null;
            const data = await res.json();
            return [idEquipo, data?.logo || null];
          } catch {
            return null;
          }
        })
      );

      const mapa = {};
      respuestas.forEach((item) => {
        if (item && item[1]) {
          mapa[item[0]] = item[1];
        }
      });
      setLogosEquipo(mapa);
    };

    const cargarInfoJugadores = async (idsJugador) => {
      const respuestas = await Promise.all(
        idsJugador.map(async (idJugador) => {
          try {
            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/jugadores/${idJugador}`);
            if (!res.ok) return null;
            const data = await res.json();
            return [idJugador, data];
          } catch {
            return null;
          }
        })
      );

      const mapa = {};
      respuestas.forEach((item) => {
        if (item && item[1]) {
          mapa[item[0]] = item[1];
        }
      });
      setJugadoresInfo(mapa);
    };

    const cargarEventos = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/partidos/${id_partido}/eventos`
        );

        if (!response.ok) {
          throw new Error('No se pudieron cargar los eventos del partido');
        }

        const eventos = await response.json();
        const listaEventos = Array.isArray(eventos) ? eventos : [];
        setDatos(listaEventos);

        const idsEquipo = [
          ...new Set(
            listaEventos
              .map((evento) => Number(evento.id_equipo))
              .filter((id) => Number.isInteger(id) && id > 0)
          ),
        ];

        const idsJugador = [
          ...new Set(
            listaEventos
              .flatMap((evento) => [Number(evento.id_jugador), Number(evento.id_asistente_o_sale)])
              .filter((id) => Number.isInteger(id) && id > 0)
          ),
        ];

        await Promise.all([cargarInfoEquipos(idsEquipo), cargarInfoJugadores(idsJugador)]);
      } catch (e) {
        setError('No se pudieron obtener los eventos');
        setDatos([]);
        setLogosEquipo({});
        setJugadoresInfo({});
      } finally {
        setLoading(false);
      }
    };

    if (id_partido) {
      cargarEventos();
    } else {
      setError('Partido invalido');
      setLoading(false);
    }
  }, [id_partido]);

  const eventosOrdenados = useMemo(() => {
    return [...datos].sort((a, b) => {
      if (a.minuto !== b.minuto) return a.minuto - b.minuto;
      if (a.extra !== b.extra) return a.extra - b.extra;
      return a.id_evento - b.id_evento;
    });
  }, [datos]);

  const formatearMinuto = (minuto, extra) => {
    if (Number(extra) > 0) return `${minuto}+${extra}'`;
    return `${minuto}'`;
  };

  const colorTipo = (tipo) => {
    const normalizado = (tipo || '').toLowerCase();
    if (normalizado.includes('gol')) return '#16a34a';
    if (normalizado.includes('tarjeta')) return '#d97706';
    if (normalizado.includes('sustit')) return '#2563eb';
    return '#475569';
  };

  const getIconoConfig = (tipo) => {
    const normalizado = (tipo || '').toLowerCase();
    
    if (normalizado.includes('gol')) {
      return { name: 'football-outline', family: 'Ionicons', color: '#ffffff' };
    }
    if (normalizado.includes('tarjeta')) {
      return { name: 'cards', family: 'MaterialCommunityIcons', color: '#ffffff' }; // Rojo LaLiga
    }
    if (normalizado.includes('sustit')) {
      return { name: 'swap-horizontal-outline', family: 'Ionicons', color: '#ffffff' }; // Verde éxito
    }
    if (normalizado.includes('var')) {
      return { name: 'monitor-eye', family: 'MaterialCommunityIcons', color: '#ffffff' }; // Azul oscuro
    }
    
    return { name: 'ellipse-outline', family: 'Ionicons', color: '#94a3b8' };
  };

  const descripcionEvento = (evento) => {
    const jugadorPrincipal = jugadoresInfo[evento?.id_jugador];
    const jugadorSecundario = jugadoresInfo[evento?.id_asistente_o_sale];
    const nombrePrincipal = jugadorPrincipal?.nombre || evento?.nombre_jugador || 'Jugador';
    const nombreSecundario = jugadorSecundario?.nombre || evento?.nombre_secundario || 'Jugador';

    if (evento?.tipo === 'Sustitución') {
      return `Entra ${nombrePrincipal} por ${nombreSecundario}`;
    }

    if (evento?.tipo === 'Gol') {
      if (evento?.id_asistente_o_sale) {
        return `${nombrePrincipal} (asistencia: ${nombreSecundario})`;
      }
      return nombrePrincipal;
    }

    if (evento?.tipo === 'Tarjeta') {
      return nombrePrincipal;
    }

    return nombrePrincipal || 'Evento';
  };

  const irDetalleJugador = (evento) => {
    if (!evento?.id_jugador) return;
    navigation.navigate('DetalleJugador', { id: evento.id_jugador });
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
      <Text style={styles.title}>Eventos del partido</Text>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {!error && eventosOrdenados.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="hourglass-outline" size={22} color="#5f7f9b" />
          <Text style={styles.emptyText}>No hay eventos registrados para este partido</Text>
        </View>
      ) : null}

      {eventosOrdenados.length > 0 ? (
        <View style={styles.timelineWrap}>
          <View style={styles.timelineLine} />

          {eventosOrdenados.map((evento) => {
            const jugadorNoDisponible = !evento?.id_jugador;
            const logoEvento = logosEquipo[evento?.id_equipo];
            const fotoJugador =
              jugadoresInfo[evento?.id_jugador]?.foto || evento?.foto_jugador || null;

            return (
              <View key={evento.id_evento} style={styles.row}>
                <Text style={styles.minuteText}>{formatearMinuto(evento.minuto, evento.extra)}</Text>

                <View style={styles.dotCol}>
                  <View style={[styles.dot, { backgroundColor: colorTipo(evento.tipo) }]} />
                </View>

                <TouchableOpacity
                  activeOpacity={0.85}
                  style={[styles.card, jugadorNoDisponible && styles.cardDisabled]}
                  onPress={() => irDetalleJugador(evento)}
                  disabled={jugadorNoDisponible}
                >
                  <View style={styles.cardTopRow}>
                    <View style={styles.metaLeftRow}>
                      <View style={[styles.badgeTipo, { backgroundColor: colorTipo(evento.tipo) }]}>
                        {getIconoConfig(evento.tipo).family === 'Ionicons' ? (
                          <Ionicons name={getIconoConfig(evento.tipo).name} size={12} color={getIconoConfig(evento.tipo).color} />
                        ) : (
                          <MaterialCommunityIcons name={getIconoConfig(evento.tipo).name} size={12} color={getIconoConfig(evento.tipo).color} />
                        )}
                        <Text style={styles.badgeTipoText}>{evento.tipo}</Text>
                      </View>

                      {logoEvento ? (
                        <Image source={{ uri: logoEvento }} style={styles.logoEquipo} />
                      ) : (
                        <View style={styles.logoFallback}>
                          <Ionicons name="shield-outline" size={13} color="#5f7f9b" />
                        </View>
                      )}
                    </View>
                    {!!evento.detalle && <Text style={styles.detalleText}>{evento.detalle}</Text>}
                  </View>

                  <View style={styles.descripcionRow}>
                    {fotoJugador ? (
                      <Image source={{ uri: fotoJugador }} style={styles.fotoJugador} />
                    ) : (
                      <View style={styles.fotoFallback}>
                        <Ionicons name="person-outline" size={14} color="#5f7f9b" />
                      </View>
                    )}
                    <Text style={styles.descripcion}>{descripcionEvento(evento)}</Text>
                  </View>

                  {!!evento.comentarios && (
                    <Text style={styles.comentario}>{evento.comentarios}</Text>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    paddingHorizontal: 14,
    paddingVertical: 16,
    paddingBottom: 30,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#12233f',
    marginBottom: 12,
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
    marginTop: 8,
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
  timelineWrap: {
    position: 'relative',
    paddingTop: 2,
  },
  timelineLine: {
    position: 'absolute',
    left: 72,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#c5d8ea',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  minuteText: {
    width: 58,
    marginTop: 8,
    textAlign: 'right',
    color: '#1f4f7a',
    fontSize: 13,
    fontWeight: '800',
  },
  dotCol: {
    width: 28,
    alignItems: 'center',
    paddingTop: 8,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  card: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderColor: '#d8e5f1',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  cardDisabled: {
    opacity: 0.75,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 8,
  },
  metaLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  badgeTipo: {
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeTipoText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
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
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e9f1f8',
  },
  detalleText: {
    flexShrink: 1,
    color: '#5f7f9b',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
  },
  descripcionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fotoJugador: {
    width: 24,
    height: 24,
    borderRadius: 12,
    resizeMode: 'cover',
    backgroundColor: '#e9f1f8',
  },
  fotoFallback: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e9f1f8',
  },
  descripcion: {
    flex: 1,
    color: '#12233f',
    fontSize: 14,
    fontWeight: '700',
  },
  comentario: {
    marginTop: 5,
    color: '#5f7f9b',
    fontSize: 12,
    fontWeight: '500',
  },
});