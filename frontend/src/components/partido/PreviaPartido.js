import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { BarChart } from "react-native-chart-kit";
import { Dimensions } from "react-native";

export default function PreviaTab({ route, navigation }) {
  const { h2h, destacados, estado, partidoInfo, id_partido } = route.params || {};
  const [dmData, setDmData] = useState(null);
  const [dmLoading, setDmLoading] = useState(false);
  const [dmError, setDmError] = useState('');
  const ultimosEnfrentamientos = Array.isArray(h2h) ? h2h.slice(0, 5) : [];
  const destacadosFlat = Array.isArray(destacados) ? destacados : [];
  const destacadosLocal = Array.isArray(destacados?.local)
    ? destacados.local
    : destacadosFlat.filter((item) => item?.tipo_equipo === 'local');
  const destacadosVisitante = Array.isArray(destacados?.visitante)
    ? destacados.visitante
    : destacadosFlat.filter((item) => item?.tipo_equipo === 'visitante');

  // GRAFICO
  let vL = 0, vV = 0, e = 0;
  
  (Array.isArray(h2h) ? h2h : []).forEach(p => {
    if (p.ganador === 'Empate') {
      e++;
    } else if (p.ganador === partidoInfo?.equipo_local) { 
      // Si el nombre del ganador coincide con el equipo que hoy es local
      vL++;
    } else {
      // Si no es empate y no ganó el local actual, ganó el visitante actual
      vV++;
    }
  });

  const chartData = {
    labels: [partidoInfo?.equipo_local, "Empates", partidoInfo?.equipo_visitante],
    datasets: [{ data: [vL, e, vV] }]
  };

  const parseForma = (forma) => {
    if (!forma || typeof forma !== 'string') return [];
    return forma
      .replace(/[^WDL]/gi, '')
      .toUpperCase()
      .split('')
      .slice(0, 5);
  };

  const colorResultado = (resultado) => {
    if (resultado === 'W') return '#16a34a';
    if (resultado === 'D') return '#f59e0b';
    return '#dc2626';
  };
  
  const IrDetallesPartido = (id_partido) => {
    navigation.navigate('DetallePartido', { id_partido });
  }

  const IrDetallesJugador = (id_jugador) => {
    navigation.navigate('DetalleJugador', { id_jugador });
  }

  const getDestacadoPorCategoria = (lista, categoria) => {
    return lista.find((item) => item?.categoria === categoria) || null;
  };

  const formatearValorDestacado = (jugador) => {
    if (!jugador) return '-';

    if (jugador.categoria === 'Rating') {
      const rating = Number(jugador.valor);
      return Number.isFinite(rating) ? rating.toFixed(2) : '-';
    }

    if (jugador.categoria === 'Minutos') {
      const minutos = Number(jugador.valor);
      return Number.isFinite(minutos) ? `${Math.round(minutos)} min` : '-';
    }

    return jugador.valor ?? '-';
  };

  const renderJugador = (jugador) => {
    if (!jugador) {
      return <Text style={styles.destacadoEmpty}>-</Text>;
    }

    const idJugador = jugador?.id_jugador ?? jugador?.id;

    return (
      <TouchableOpacity
        style={styles.jugadorCellContent}
        activeOpacity={idJugador ? 0.8 : 1}
        disabled={!idJugador}
        onPress={() => IrDetallesJugador(idJugador)}
      >
        <Image source={{ uri: jugador.foto }} style={styles.destacadoFoto} resizeMode="cover" />
        <Text style={styles.destacadoNombre} numberOfLines={1}>{jugador.nombre || '-'}</Text>
        <Text style={styles.destacadoValor}>{formatearValorDestacado(jugador)}</Text>
      </TouchableOpacity>
    );
  };

  const filasDestacados = [
    { key: 'minutos', label: 'Mas Minutos', categoria: 'Minutos' },
    { key: 'golesAsistencias', label: 'Mas G + A', categoria: 'G+A' },
    { key: 'rating', label: 'Rating', categoria: 'Rating' },
  ];

  const formaLocal = parseForma(estado?.local_forma);
  const formaVisitante = parseForma(estado?.visitante_forma);

  useEffect(() => {
    const cargarDataMining = async () => {
      if (!id_partido) {
        setDmData(null);
        return;
      }

      try {
        setDmLoading(true);
        setDmError('');
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/partidos/${id_partido}/data_mining`
        );

        if (!response.ok) {
          throw new Error('No se pudo cargar data mining');
        }

        const data = await response.json();
        setDmData(data);
      } catch (_e) {
        setDmData(null);
        setDmError('No se pudieron cargar las predicciones');
      } finally {
        setDmLoading(false);
      }
    };

    cargarDataMining();
  }, [id_partido]);

  const normalizarPorcentaje = (valor) => {
    const n = Number(valor);
    if (!Number.isFinite(n)) return null;
    return n <= 1 ? n * 100 : n;
  };

  const formatPorcentaje = (valor) => {
    const pct = normalizarPorcentaje(valor);
    if (pct === null) return '-';
    return `${pct.toFixed(pct >= 10 ? 1 : 2)}%`;
  };

  const formatDecimal = (valor) => {
    const n = Number(valor);
    return Number.isFinite(n) ? n.toFixed(2) : '-';
  };

  const prediccion = dmData?.prediccion || null;
  const golesEsperados = dmData?.goles_esperados || null;
  const probablesGoleadores = Array.isArray(dmData?.probables_goleadores)
    ? dmData.probables_goleadores
    : [];

  const renderProbabilidadPartido = (label, valor, tipo) => (
    <View style={[styles.prediccionCard, styles[`prediccionCard${tipo}`]]}>
      <Text style={styles.prediccionLabel}>{label}</Text>
      <Text style={styles.prediccionValue}>{formatPorcentaje(valor)}</Text>
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.screenContent}>
      <View style={styles.formaContainer}>
        <View style={styles.equipoCol}>
          <View style={styles.logoEquipoWrap}>
            <Image source={{ uri: partidoInfo?.logo_local }} style={styles.logoEquipo} />
          </View>
          <Text style={styles.nombreEquipo} numberOfLines={2}>
            {partidoInfo?.equipo_local || 'Local'}
          </Text>

          <View style={styles.metricasRow}>
            <View style={styles.badgeMetrica}>
              <Text style={styles.badgeLabel}>Pos</Text>
              <Text style={styles.badgeValue}>{estado?.local_posicion ?? '-'}</Text>
            </View>
            <View style={styles.badgeMetrica}>
              <Text style={styles.badgeLabel}>Pts</Text>
              <Text style={styles.badgeValue}>{estado?.local_puntos ?? '-'}</Text>
            </View>
            <View style={styles.badgeMetrica}>
              <Text style={styles.badgeLabel}>Vic</Text>
              <Text style={styles.badgeValue}>{estado?.local_victorias ?? '-'}</Text>
            </View>
          </View>

          <View style={styles.formaRow}>
            {formaLocal.length > 0 ? (
              formaLocal.map((resultado, idx) => (
                <View
                  key={`local-${idx}`}
                  style={[styles.formaBadge, { backgroundColor: colorResultado(resultado) }]}
                >
                  <Text style={styles.formaText}>{resultado}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.formaSinDatos}>Sin forma</Text>
            )}
          </View>
        </View>

        <View style={styles.separator} />

        <View style={styles.equipoCol}>
          <View style={styles.logoEquipoWrap}>
            <Image source={{ uri: partidoInfo?.logo_visitante }} style={styles.logoEquipo} />
          </View>
          <Text style={styles.nombreEquipo} numberOfLines={2}>
            {partidoInfo?.equipo_visitante || 'Visitante'}
          </Text>

          <View style={styles.metricasRow}>
            <View style={styles.badgeMetrica}>
              <Text style={styles.badgeLabel}>Pos</Text>
              <Text style={styles.badgeValue}>{estado?.visitante_posicion ?? '-'}</Text>
            </View>
            <View style={styles.badgeMetrica}>
              <Text style={styles.badgeLabel}>Pts</Text>
              <Text style={styles.badgeValue}>{estado?.visitante_puntos ?? '-'}</Text>
            </View>
            <View style={styles.badgeMetrica}>
              <Text style={styles.badgeLabel}>Vic</Text>
              <Text style={styles.badgeValue}>{estado?.visitante_victorias ?? '-'}</Text>
            </View>
          </View>

          <View style={styles.formaRow}>
            {formaVisitante.length > 0 ? (
              formaVisitante.map((resultado, idx) => (
                <View
                  key={`visitante-${idx}`}
                  style={[styles.formaBadge, { backgroundColor: colorResultado(resultado) }]}
                >
                  <Text style={styles.formaText}>{resultado}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.formaSinDatos}>Sin forma</Text>
            )}
          </View>
        </View>
      </View>

      <View style={styles.dmContainer}>
        <Text style={styles.h2hTitle}>Predicciones </Text>

        {dmLoading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Cargando predicciones...</Text>
          </View>
        ) : dmError ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>{dmError}</Text>
          </View>
        ) : !prediccion && !golesEsperados && probablesGoleadores.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No hay datos de data mining para este partido</Text>
          </View>
        ) : (
          <>
            <View style={styles.dmBlock}>
              <Text style={styles.dmBlockTitle}>Prediccion del partido</Text>
              <View style={styles.prediccionesRow}>
                {renderProbabilidadPartido(
                  partidoInfo?.equipo_local || 'Local',
                  prediccion?.prob_victoria_local,
                  'Local'
                )}
                {renderProbabilidadPartido('Empate', prediccion?.prob_empate, 'Empate')}
                {renderProbabilidadPartido(
                  partidoInfo?.equipo_visitante || 'Visitante',
                  prediccion?.prob_victoria_visitante,
                  'Visitante'
                )}
              </View>
              {prediccion?.prediccion ? (
                <Text style={styles.prediccionFinal}>
                  Resultado previsto: {prediccion.prediccion}
                </Text>
              ) : null}
            </View>

            <View style={styles.dmBlock}>
              <Text style={styles.dmBlockTitle}>Goles esperados</Text>
              <View style={styles.xgRow}>
                <View style={styles.xgEquipo}>
                  <Image source={{ uri: partidoInfo?.logo_local }} style={styles.xgLogo} />
                  <Text style={styles.xgEquipoNombre} numberOfLines={1}>
                    {partidoInfo?.equipo_local || 'Local'}
                  </Text>
                  <Text style={styles.xgValor}>
                    {formatDecimal(golesEsperados?.goles_local_esperados)}
                  </Text>
                </View>
                <View style={styles.xgCenter}>
                  <Text style={styles.xgMarcador}>
                    {golesEsperados?.marcador_estimado || '-'}
                  </Text>
                  <Text style={styles.xgSubtext}>
                    {golesEsperados?.resultado_estimado || 'Estimacion'}
                  </Text>
                </View>
                <View style={styles.xgEquipo}>
                  <Image source={{ uri: partidoInfo?.logo_visitante }} style={styles.xgLogo} />
                  <Text style={styles.xgEquipoNombre} numberOfLines={1}>
                    {partidoInfo?.equipo_visitante || 'Visitante'}
                  </Text>
                  <Text style={styles.xgValor}>
                    {formatDecimal(golesEsperados?.goles_visitante_esperados)}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.dmBlock}>
              <Text style={styles.dmBlockTitle}>Probables goleadores</Text>
              {probablesGoleadores.length === 0 ? (
                <Text style={styles.dmEmptyText}>Sin goleadores probables</Text>
              ) : (
                <View style={styles.goleadoresGrid}>
                  {probablesGoleadores.map((jugador) => (
                    <TouchableOpacity
                      key={`${jugador.id_partido}-${jugador.id_jugador}`}
                      style={styles.goleadorCard}
                      activeOpacity={0.85}
                      onPress={() => IrDetallesJugador(jugador.id_jugador)}
                    >
                      {jugador.foto ? (
                        <Image source={{ uri: jugador.foto }} style={styles.goleadorFoto} />
                      ) : (
                        <View style={styles.goleadorFotoFallback} />
                      )}
                      <View style={styles.goleadorInfo}>
                        <Text style={styles.goleadorNombre} numberOfLines={1}>
                          {jugador.nombre_jugador || '-'}
                        </Text>
                        <Text style={styles.goleadorEquipo} numberOfLines={1}>
                          {jugador.nombre_equipo || '-'}
                        </Text>
                      </View>
                      <Text style={styles.goleadorProb}>
                        {formatPorcentaje(jugador.probabilidad)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </>
        )}
      </View>

      <View style={styles.h2hContainer}>
        <Text style={styles.h2hTitle}>Ultimos 5 enfrentamientos</Text>

        {ultimosEnfrentamientos.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No hay partidos recientes entre estos equipos</Text>
          </View>
        ) : (
          ultimosEnfrentamientos.map((item) => (
            <TouchableOpacity
              key={item.id_partido}
              style={styles.matchCard}
              activeOpacity={0.85}
              onPress={() => IrDetallesPartido(item.id_partido)}
            >
              <View style={styles.teamSide}>
                <Image source={{ uri: item.logo_local }} style={styles.teamLogo} resizeMode="contain" />
                <Text style={styles.teamName} numberOfLines={2}>
                  {item.equipo_local}
                </Text>
              </View>

              <View style={styles.centerInfo}>
                <Text style={styles.scoreText}>
                  {item.goles_local ?? '-'} - {item.goles_visitante ?? '-'}
                </Text>
                <Text style={styles.metaText}>
                  {item.dia} {item.nombre_mes} {item.anio}
                </Text>
                <Text style={styles.metaText}>Jornada {item.jornada ?? '-'}</Text>
              </View>

              <View style={styles.teamSide}>
                <Image source={{ uri: item.logo_visitante }} style={styles.teamLogo} resizeMode="contain" />
                <Text style={styles.teamName} numberOfLines={2}>
                  {item.equipo_visitante}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
        <BarChart
          data={chartData}
          width={Dimensions.get("window").width - 30}
          height={220}
          fromZero
          chartConfig={{
            backgroundGradientFrom: "#ffffff",
            backgroundGradientTo: "#ffffff",
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(18, 35, 63, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          }}
          style={{ marginVertical: 15, borderRadius: 10 }}
        />
      </View>
      <View style={styles.destacadosContainer}>
        <Text style={styles.h2hTitle}>Jugadores destacados</Text>
        {destacadosLocal.length > 0 || destacadosVisitante.length > 0 ? (
          <View style={styles.destacadosTabla}>
            <View style={styles.destacadosHeader}>
              <Text style={[styles.destacadosHeaderText, styles.destacadosColText]}>{partidoInfo?.equipo_local}</Text>
              <Text style={[styles.destacadosHeaderText, styles.destacadosCentroText]}>Categoria</Text>
              <Text style={[styles.destacadosHeaderText, styles.destacadosColText]}>{partidoInfo?.equipo_visitante}</Text>
            </View>

            {filasDestacados.map((fila) => {
              const jugadorLocal = getDestacadoPorCategoria(destacadosLocal, fila.categoria);
              const jugadorVisitante = getDestacadoPorCategoria(destacadosVisitante, fila.categoria);

              return (
                <View key={fila.key} style={styles.destacadoFila}>
                  <View style={styles.jugadorCell}>
                    {renderJugador(jugadorLocal)}
                  </View>
                  <View style={styles.categoriaCell}>
                    <Text style={styles.categoriaText}>{fila.label}</Text>
                  </View>
                  <View style={styles.jugadorCell}>
                    {renderJugador(jugadorVisitante)}
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No hay destacados para mostrar</Text>
          </View>
        )}
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  formaContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: '#e9f1f8',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#c5d8ea',
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginBottom: 16,
  },
  equipoCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  logoEquipoWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 8,
  },
  logoEquipo: {
    width: '78%',
    height: '78%',
    resizeMode: 'contain',
  },
  nombreEquipo: {
    color: '#16324a',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    minHeight: 34,
  },
  metricasRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
    marginBottom: 10,
  },
  badgeMetrica: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 5,
    alignItems: 'center',
    minWidth: 40,
  },
  badgeLabel: {
    color: '#5f7f9b',
    fontSize: 10,
    fontWeight: '700',
  },
  badgeValue: {
    color: '#12233f',
    fontSize: 13,
    fontWeight: '800',
  },
  formaRow: {
    flexDirection: 'row',
    gap: 6,
    minHeight: 24,
  },
  formaBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formaText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  formaSinDatos: {
    color: '#6c879f',
    fontSize: 11,
    fontWeight: '600',
  },
  separator: {
    width: 1,
    backgroundColor: '#c5d8ea',
    marginHorizontal: 10,
  },
  h2hContainer: {
    backgroundColor: '#e9f1f8',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#c5d8ea',
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  dmContainer: {
    backgroundColor: '#e9f1f8',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#c5d8ea',
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginBottom: 16,
  },
  dmBlock: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d9e5f0',
    padding: 10,
    marginBottom: 10,
  },
  dmBlockTitle: {
    color: '#16324a',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8,
  },
  prediccionesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  prediccionCard: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  prediccionCardLocal: {
    backgroundColor: '#eaf3ff',
    borderColor: '#c8ddf4',
  },
  prediccionCardEmpate: {
    backgroundColor: '#f7f8fb',
    borderColor: '#d9e2ec',
  },
  prediccionCardVisitante: {
    backgroundColor: '#fff0ea',
    borderColor: '#f1d1c3',
  },
  prediccionLabel: {
    color: '#567087',
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
    minHeight: 24,
  },
  prediccionValue: {
    color: '#103a5d',
    fontSize: 16,
    fontWeight: '900',
    marginTop: 3,
  },
  prediccionFinal: {
    marginTop: 8,
    color: '#244c70',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  xgRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  xgEquipo: {
    flex: 1,
    alignItems: 'center',
  },
  xgLogo: {
    width: 34,
    height: 34,
    resizeMode: 'contain',
    marginBottom: 5,
  },
  xgEquipoNombre: {
    color: '#4f6b83',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  xgValor: {
    color: '#103a5d',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 3,
  },
  xgCenter: {
    width: 92,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  xgMarcador: {
    color: '#e20613',
    fontSize: 20,
    fontWeight: '900',
  },
  xgSubtext: {
    color: '#59778f',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 2,
  },
  goleadoresGrid: {
    gap: 8,
  },
  goleadorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fbff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#edf3f8',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  goleadorFoto: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#e7eef6',
  },
  goleadorFotoFallback: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#e7eef6',
  },
  goleadorInfo: {
    flex: 1,
    marginLeft: 8,
  },
  goleadorNombre: {
    color: '#1d3850',
    fontSize: 12,
    fontWeight: '800',
  },
  goleadorEquipo: {
    color: '#6b829b',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  goleadorProb: {
    color: '#103a5d',
    fontSize: 13,
    fontWeight: '900',
    marginLeft: 8,
  },
  dmEmptyText: {
    color: '#59778f',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: 8,
  },
  h2hTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#16324a',
    marginBottom: 10,
  },
  matchCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginBottom: 9,
    borderWidth: 1,
    borderColor: '#d9e5f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teamSide: {
    width: '31%',
    alignItems: 'center',
  },
  teamLogo: {
    width: 40,
    height: 40,
    marginBottom: 6,
  },
  teamName: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: '#1d3850',
  },
  centerInfo: {
    width: '38%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  scoreText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#103a5d',
    marginBottom: 5,
  },
  metaText: {
    fontSize: 12,
    color: '#59778f',
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyState: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d9e5f0',
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 13,
    color: '#59778f',
    fontWeight: '600',
    textAlign: 'center',
  },
  destacadosContainer: {
    backgroundColor: '#e9f1f8',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#c5d8ea',
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginBottom: 16,
  },
  destacadosTabla: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d9e5f0',
    overflow: 'hidden',
  },
  destacadosHeader: {
    flexDirection: 'row',
    backgroundColor: '#eef5fb',
    borderBottomWidth: 1,
    borderBottomColor: '#d9e5f0',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  destacadosHeaderText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#34526a',
    textAlign: 'center',
  },
  destacadosColText: {
    flex: 1,
  },
  destacadosCentroText: {
    width: 86,
  },
  destacadoFila: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderBottomWidth: 1,
    borderBottomColor: '#edf3f8',
  },
  jugadorCell: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  categoriaCell: {
    width: 86,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f7fbff',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#edf3f8',
    paddingHorizontal: 4,
  },
  categoriaText: {
    textAlign: 'center',
    color: '#1d3850',
    fontSize: 11,
    fontWeight: '700',
  },
  jugadorCellContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  destacadoFoto: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#e7eef6',
  },
  destacadoNombre: {
    fontSize: 11,
    color: '#1d3850',
    fontWeight: '700',
    textAlign: 'center',
  },
  destacadoValor: {
    fontSize: 12,
    color: '#103a5d',
    fontWeight: '800',
  },
  destacadoEmpty: {
    textAlign: 'center',
    color: '#6c879f',
    fontSize: 12,
    fontWeight: '600',
  },
});
