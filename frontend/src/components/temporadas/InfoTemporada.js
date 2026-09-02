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

const toNumber = (valor) => {
  const n = Number(valor);
  return Number.isFinite(n) ? n : 0;
};

const formatFecha = (item) => {
  if (!item) return '-';
  const dia = String(item.dia || 0).padStart(2, '0');
  const mes = String(item.mes || 0).padStart(2, '0');
  const anio = item.anio || '';
  return `${dia}/${mes}/${anio}`;
};

const formatNumero = (valor, decimals = 2) => {
  const n = Number(valor);
  if (!Number.isFinite(n)) return '-';
  return decimals === 0 ? String(n) : n.toFixed(decimals);
};

export default function InfoTemporada({ temporada }) {
  const navigation = useNavigation();
  const temporadaBase = Number.isFinite(Number(temporada)) ? Number(temporada) : null;

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [resumen, setResumen] = useState(null);
  const [mejoresPartidos, setMejoresPartidos] = useState([]);
  const [destacados, setDestacados] = useState({
    goleador: null,
    portero: null,
    amarillas: null,
    rojas: null,
  });
  const [jornadasDisponibles, setJornadasDisponibles] = useState([]);
  const [jornadaSeleccionada, setJornadaSeleccionada] = useState(null);
  const [jornadaAbierta, setJornadaAbierta] = useState(false);
  const [mvps, setMvps] = useState([]);
  const [cargandoMvps, setCargandoMvps] = useState(false);
  const [ultimaJornada, setUltimaJornada] = useState({ jornada: null, partidos: [] });
  const [proximaJornada, setProximaJornada] = useState({ partidos: [] });
  const [ascensos, setAscensos] = useState([]);
  const [descensos, setDescensos] = useState([]);

  const cargarMvps = async (temporadaSeleccionada, jornada) => {
    if (!temporadaSeleccionada || !jornada) {
      setMvps([]);
      return;
    }

    try {
      setCargandoMvps(true);
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/temporadas/mvps?temporada=${temporadaSeleccionada}&jornada=${jornada}`
      );

      if (!response.ok) {
        throw new Error('No se pudieron cargar los mvps');
      }

      const data = await response.json();
      const lista = Array.isArray(data?.mvps) ? data.mvps : [];
      setMvps(lista);
    } catch (_e) {
      setMvps([]);
    } finally {
      setCargandoMvps(false);
    }
  };

  const cargarInicial = async () => {
    if (!temporadaBase) {
      setError('Temporada no disponible');
      setResumen(null);
      setMejoresPartidos([]);
      setDestacados({ goleador: null, portero: null, amarillas: null, rojas: null });
      setJornadasDisponibles([]);
      setJornadaSeleccionada(null);
      setMvps([]);
      setUltimaJornada({ jornada: null, partidos: [] });
      setProximaJornada({ partidos: [] });
      setAscensos([]);
      setDescensos([]);
      setCargando(false);
      return;
    }

    try {
      setCargando(true);
      setError('');

      const [resResumen, resDestacados, resJornadas, resUltima, resProxima, resAscensos] = await Promise.all([
        fetch(`${process.env.EXPO_PUBLIC_API_URL}/temporadas/info?temporada=${temporadaBase}`),
        fetch(`${process.env.EXPO_PUBLIC_API_URL}/temporadas/destacados?temporada=${temporadaBase}`),
        fetch(`${process.env.EXPO_PUBLIC_API_URL}/partidos/jornadas?temporada=${temporadaBase}`),
        fetch(`${process.env.EXPO_PUBLIC_API_URL}/temporadas/jornada/ultima?temporada=${temporadaBase}`),
        fetch(`${process.env.EXPO_PUBLIC_API_URL}/temporadas/jornada/proxima?temporada=${temporadaBase}`),
        fetch(`${process.env.EXPO_PUBLIC_API_URL}/temporadas/ascensos-descensos?temporada=${temporadaBase}`),
      ]);

      if (!resResumen.ok || !resDestacados.ok || !resJornadas.ok || !resUltima.ok || !resProxima.ok || !resAscensos.ok) {
        throw new Error('No se pudo cargar la informacion de la temporada');
      }

      const [dataResumen, dataDestacados, dataJornadas, dataUltima, dataProxima, dataAscensos] = await Promise.all([
        resResumen.json(),
        resDestacados.json(),
        resJornadas.json(),
        resUltima.json(),
        resProxima.json(),
        resAscensos.json(),
      ]);

      const listaJornadas = Array.isArray(dataJornadas?.jornadas) ? dataJornadas.jornadas : [];
      const jornadasOrdenadas = [...new Set(
        listaJornadas.map((item) => Number(item.jornada)).filter((j) => Number.isFinite(j))
      )].sort((a, b) => a - b);

      const jornadaBase = Number.isFinite(Number(dataJornadas?.jornada_actual))
        ? Number(dataJornadas.jornada_actual)
        : (jornadasOrdenadas[jornadasOrdenadas.length - 1] ?? null);

      setResumen(dataResumen?.resumen ?? null);
      setMejoresPartidos(Array.isArray(dataResumen?.mejores_partidos) ? dataResumen.mejores_partidos : []);
      setDestacados({
        goleador: dataDestacados?.goleador ?? null,
        portero: dataDestacados?.portero ?? null,
        amarillas: dataDestacados?.amarillas ?? null,
        rojas: dataDestacados?.rojas ?? null,
      });
      setJornadasDisponibles(jornadasOrdenadas);
      setJornadaSeleccionada(jornadaBase);
      setUltimaJornada({
        jornada: dataUltima?.jornada ?? null,
        partidos: Array.isArray(dataUltima?.partidos) ? dataUltima.partidos : [],
      });
      setProximaJornada({
        partidos: Array.isArray(dataProxima?.partidos) ? dataProxima.partidos : [],
      });
      setAscensos(Array.isArray(dataAscensos?.ascendidos) ? dataAscensos.ascendidos : []);
      setDescensos(Array.isArray(dataAscensos?.descendidos) ? dataAscensos.descendidos : []);

      if (jornadaBase) {
        await cargarMvps(temporadaBase, jornadaBase);
      } else {
        setMvps([]);
      }
    } catch (_e) {
      setError('No se pudo cargar la informacion de la temporada');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarInicial();
  }, [temporadaBase]);

  const seleccionarJornada = async (jornada) => {
    if (jornada === jornadaSeleccionada || !temporadaBase) return;
    setJornadaSeleccionada(jornada);
    setJornadaAbierta(false);
    await cargarMvps(temporadaBase, jornada);
  };

  const mvpsPorRol = useMemo(() => {
    const base = { Portero: null, Defensa: null, Mediocentro: null, Delantero: null };
    (Array.isArray(mvps) ? mvps : []).forEach((item) => {
      if (item?.rol && base[item.rol] === null) {
        base[item.rol] = item;
      }
    });
    return base;
  }, [mvps]);

  const renderLogoEquipo = (logo) => (
    logo ? (
      <Image source={{ uri: logo }} style={styles.logoEquipo} />
    ) : (
      <View style={styles.logoFallback}>
        <Ionicons name="shield-outline" size={14} color="#5f7f9b" />
      </View>
    )
  );

  const renderPartido = (partido) => {
    const estaIncompleto = partido.status !== 'Completado';

    return (
      <TouchableOpacity
        key={`partido-${partido.id_partido}`}
        style={styles.tarjetaPartido}
        onPress={() => navigation.navigate('DetallePartido', { id_partido: partido.id_partido })}
        activeOpacity={0.8}
      >
        <View style={styles.columnaContenido}>
          <View style={styles.cabeceraCentro}>
            <Text style={styles.jornadaTexto}>Jornada {partido.jornada ?? '-'}</Text>
          </View>

          <View style={styles.filaEquipos}>
            <View style={styles.equipoBloque}>
              <TouchableOpacity
                style={styles.equipoFila}
                onPress={() => navigation.navigate('DetalleEquipo', { idEquipo: partido.id_local })}
                activeOpacity={partido.id_local ? 0.8 : 1}
                disabled={!partido.id_local}
              >
                {renderLogoEquipo(partido.logo_local)}
                <Text style={styles.equipoNombre} numberOfLines={1}>
                  {partido.equipo_local || '-'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.marcadorBloque}>
              {estaIncompleto ? (
                <Text style={styles.horaTexto}>{partido.hora || '--:--'}</Text>
              ) : (
                <>
                  <Text style={styles.marcadorTexto}>{partido.goles_local ?? '-'}</Text>
                  <Text style={styles.separadorMarcador}>-</Text>
                  <Text style={styles.marcadorTexto}>{partido.goles_visitante ?? '-'}</Text>
                </>
              )}
            </View>

            <View style={[styles.equipoBloque, styles.equipoBloqueDerecha]}>
              <TouchableOpacity
                style={styles.equipoFilaDerecha}
                onPress={() => navigation.navigate('DetalleEquipo', { idEquipo: partido.id_visitante })}
                activeOpacity={partido.id_visitante ? 0.8 : 1}
                disabled={!partido.id_visitante}
              >
                <Text style={styles.equipoNombreDerecha} numberOfLines={1}>
                  {partido.equipo_visitante || '-'}
                </Text>
                {renderLogoEquipo(partido.logo_visitante)}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.piePartido}>
            <Text style={styles.fechaTexto}>{formatFecha(partido)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderJugadorDestacado = (titulo, jugador, valor, formatoValor) => {
    const idJugador = jugador?.id_jugador;
    const idEquipo = jugador?.id_equipo;

    return (
      <TouchableOpacity
        style={styles.destacadoCard}
        onPress={() => (idJugador ? navigation.navigate('DetalleJugador', { id_jugador: idJugador }) : null)}
        activeOpacity={idJugador ? 0.85 : 1}
      >
        <Text style={styles.destacadoTitle}>{titulo}</Text>
        <View style={styles.destacadoInfo}>
          {jugador?.foto ? (
            <Image source={{ uri: jugador.foto }} style={styles.destacadoAvatar} />
          ) : (
            <View style={styles.destacadoAvatarFallback}>
              <Ionicons name="person-outline" size={18} color="#5f7f9b" />
            </View>
          )}
          <View style={styles.destacadoTextWrap}>
            <Text style={styles.destacadoNombre} numberOfLines={1}>{jugador?.nombre || 'Sin datos'}</Text>
            <Text style={styles.destacadoValor}>
              {formatoValor ? formatoValor(valor) : (valor ?? '-')}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.destacadoEquipo}
          onPress={() => (idEquipo ? navigation.navigate('DetalleEquipo', { idEquipo }) : null)}
          activeOpacity={idEquipo ? 0.85 : 1}
        >
          {jugador?.logo ? (
            <Image source={{ uri: jugador.logo }} style={styles.destacadoEquipoLogo} />
          ) : (
            <View style={styles.destacadoEquipoFallback}>
              <Ionicons name="shield-outline" size={14} color="#5f7f9b" />
            </View>
          )}
          <Text style={styles.destacadoEquipoNombre} numberOfLines={1}>
            {jugador?.nombre_equipo || 'Sin equipo'}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderMvpCard = (rol, jugador) => {
    const idJugador = jugador?.id_jugador;
    const idEquipo = jugador?.id_equipo;

    return (
      <TouchableOpacity
        key={`mvp-${rol}`}
        style={styles.mvpCard}
        onPress={() => (idJugador ? navigation.navigate('DetalleJugador', { id_jugador: idJugador }) : null)}
        activeOpacity={idJugador ? 0.85 : 1}
      >
        <Text style={styles.mvpRol}>{rol}</Text>
        <View style={styles.mvpInfo}>
          {jugador?.foto ? (
            <Image source={{ uri: jugador.foto }} style={styles.mvpAvatar} />
          ) : (
            <View style={styles.mvpAvatarFallback}>
              <Ionicons name="person-outline" size={20} color="#5f7f9b" />
            </View>
          )}
          <View style={styles.mvpTextWrap}>
            <Text style={styles.mvpNombre} numberOfLines={1}>{jugador?.nombre || 'Sin datos'}</Text>
            <Text style={styles.mvpValor}>Rating {formatNumero(jugador?.nota, 2)}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.mvpEquipo}
          onPress={() => (idEquipo ? navigation.navigate('DetalleEquipo', { idEquipo }) : null)}
          activeOpacity={idEquipo ? 0.85 : 1}
        >
          {jugador?.logo ? (
            <Image source={{ uri: jugador.logo }} style={styles.mvpEquipoLogo} />
          ) : (
            <View style={styles.mvpEquipoFallback}>
              <Ionicons name="shield-outline" size={14} color="#5f7f9b" />
            </View>
          )}
          <Text style={styles.mvpEquipoNombre} numberOfLines={1}>
            {jugador?.nombre_equipo || 'Sin equipo'}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderEquipoPill = (equipo, etiqueta) => (
    <TouchableOpacity
      key={`${etiqueta}-${equipo.id_equipo}`}
      style={styles.equipoPill}
      onPress={() => navigation.navigate('DetalleEquipo', { idEquipo: equipo.id_equipo })}
      activeOpacity={0.85}
    >
      {equipo.logo ? (
        <Image source={{ uri: equipo.logo }} style={styles.equipoPillLogo} />
      ) : (
        <View style={styles.equipoPillFallback}>
          <Ionicons name="shield-outline" size={14} color="#5f7f9b" />
        </View>
      )}
      <Text style={styles.equipoPillNombre} numberOfLines={1}>
        {equipo.nombre_equipo}
      </Text>
    </TouchableOpacity>
  );

  if (cargando) {
    return (
      <View style={styles.estadoPantalla}>
        <ActivityIndicator size="small" color="#1f6fa7" />
        <Text style={styles.estadoTexto}>Cargando informacion...</Text>
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
        <View style={styles.metricasRow}>
          <View style={styles.metricaBadge}>
            <Text style={styles.metricaLabel}>Partidos</Text>
            <Text style={styles.metricaValue}>{resumen?.partidos_jugados ?? 0}</Text>
          </View>
          <View style={styles.metricaBadge}>
            <Text style={styles.metricaLabel}>Goles</Text>
            <Text style={styles.metricaValue}>{resumen?.goles_total ?? 0}</Text>
          </View>
          <View style={styles.metricaBadge}>
            <Text style={styles.metricaLabel}>Amarillas</Text>
            <Text style={styles.metricaValue}>{resumen?.amarillas_total ?? 0}</Text>
          </View>
          <View style={styles.metricaBadge}>
            <Text style={styles.metricaLabel}>Rojas</Text>
            <Text style={styles.metricaValue}>{resumen?.rojas_total ?? 0}</Text>
          </View>
        </View>

        <Text style={styles.subSectionTitle}>Mejor partido</Text>
        {mejoresPartidos.length > 0 ? (
          <View style={styles.listaPartidosCompacta}>
            {mejoresPartidos.map((partido) => renderPartido(partido))}
          </View>
        ) : (
          <Text style={styles.emptyText}>No hay partidos destacados</Text>
        )}
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Jugadores destacados</Text>
        <View style={styles.destacadosGrid}>
          {renderJugadorDestacado('Maximo goleador', destacados.goleador, destacados.goleador?.goles, (v) => formatNumero(v, 0))}
          {renderJugadorDestacado('Mejor portero', destacados.portero, destacados.portero?.goles_por_partido, (v) => `${formatNumero(v, 2)} goles/partido`)}
          {renderJugadorDestacado('Mas amarillas', destacados.amarillas, destacados.amarillas?.amarillas, (v) => formatNumero(v, 0))}
          {renderJugadorDestacado('Mas rojas', destacados.rojas, destacados.rojas?.rojas, (v) => formatNumero(v, 0))}
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>MVPs de la jornada</Text>
        <View style={styles.bloqueDropdown}>
          <Text style={styles.labelDropdown}>Jornada</Text>
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

        {cargandoMvps ? (
          <View style={styles.estadoPantallaCompacto}>
            <ActivityIndicator size="small" color="#1f6fa7" />
            <Text style={styles.estadoTexto}>Cargando MVPs...</Text>
          </View>
        ) : (
          <View style={styles.mvpsGrid}>
            {renderMvpCard('Portero', mvpsPorRol.Portero)}
            {renderMvpCard('Defensa', mvpsPorRol.Defensa)}
            {renderMvpCard('Mediocentro', mvpsPorRol.Mediocentro)}
            {renderMvpCard('Delantero', mvpsPorRol.Delantero)}
          </View>
        )}
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Ultima jornada</Text>
        {ultimaJornada?.jornada ? (
          <Text style={styles.subSectionTitle}>Jornada {ultimaJornada.jornada}</Text>
        ) : null}
        {ultimaJornada?.partidos?.length ? (
          <View style={styles.listaPartidosCompacta}>
            {ultimaJornada.partidos.map((partido) => renderPartido(partido))}
          </View>
        ) : (
          <Text style={styles.emptyText}>No hay partidos completados</Text>
        )}
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Proximos 10 partidos</Text>
        {proximaJornada?.partidos?.length ? (
          <View style={styles.listaPartidosCompacta}>
            {proximaJornada.partidos.map((partido) => renderPartido(partido))}
          </View>
        ) : (
          <Text style={styles.emptyText}>No hay partidos programados</Text>
        )}
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Ascendidos y descendidos</Text>
        <Text style={styles.subSectionTitle}>Ascendidos</Text>
        {ascensos.length > 0 ? (
          <View style={styles.equiposWrap}>
            {ascensos.map((equipo) => renderEquipoPill(equipo, 'asc'))}
          </View>
        ) : (
          <Text style={styles.emptyText}>Sin ascensos detectados</Text>
        )}

        <Text style={styles.subSectionTitle}>Descendidos</Text>
        {descensos.length > 0 ? (
          <View style={styles.equiposWrap}>
            {descensos.map((equipo) => renderEquipoPill(equipo, 'desc'))}
          </View>
        ) : (
          <Text style={styles.emptyText}>Sin descensos detectados</Text>
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#12233f',
    marginBottom: 10,
  },
  subSectionTitle: {
    marginTop: 8,
    marginBottom: 8,
    fontSize: 12,
    fontWeight: '700',
    color: '#32506f',
  },
  metricasRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricaBadge: {
    flexGrow: 1,
    minWidth: '45%',
    backgroundColor: '#edf3f9',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  metricaLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4f6782',
  },
  metricaValue: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: '800',
    color: '#12233f',
  },
  destacadosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  destacadoCard: {
    width: '48%',
    borderWidth: 1,
    borderColor: '#dbe6f0',
    borderRadius: 12,
    padding: 10,
    backgroundColor: '#f8fbff',
  },
  destacadoTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1f4f7a',
    marginBottom: 8,
  },
  destacadoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  destacadoAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  destacadoAvatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e8edf2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  destacadoTextWrap: {
    flex: 1,
  },
  destacadoNombre: {
    fontSize: 12,
    fontWeight: '700',
    color: '#173a5d',
  },
  destacadoValor: {
    fontSize: 11,
    fontWeight: '600',
    color: '#55708d',
    marginTop: 2,
  },
  destacadoEquipo: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  destacadoEquipoLogo: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  destacadoEquipoFallback: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#e8edf2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  destacadoEquipoNombre: {
    fontSize: 11,
    color: '#4f6782',
    fontWeight: '600',
    flex: 1,
  },
  mvpsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  mvpCard: {
    width: '48%',
    borderWidth: 1,
    borderColor: '#dbe6f0',
    borderRadius: 12,
    padding: 10,
    backgroundColor: '#ffffff',
  },
  mvpRol: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1f4f7a',
    marginBottom: 6,
  },
  mvpInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mvpAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  mvpAvatarFallback: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#e8edf2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mvpTextWrap: {
    flex: 1,
  },
  mvpNombre: {
    fontSize: 12,
    fontWeight: '700',
    color: '#173a5d',
  },
  mvpValor: {
    fontSize: 11,
    fontWeight: '600',
    color: '#55708d',
    marginTop: 2,
  },
  mvpEquipo: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mvpEquipoLogo: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  mvpEquipoFallback: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#e8edf2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mvpEquipoNombre: {
    fontSize: 11,
    color: '#4f6782',
    fontWeight: '600',
    flex: 1,
  },
  equiposWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  equipoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#edf3f9',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  equipoPillLogo: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  equipoPillFallback: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#e8edf2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  equipoPillNombre: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1f4f7a',
    maxWidth: 110,
  },
  listaPartidosCompacta: {
    marginTop: 4,
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
  estadoPantalla: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 32,
    paddingBottom: 200,
    backgroundColor: '#f4f8fc',
  },
  estadoPantallaCompacto: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  estadoTexto: {
    color: '#4f6782',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 12,
    color: '#6b7f96',
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
});
