import React from 'react';
import { View, Text, ScrollView, Image, StyleSheet } from 'react-native';
import { BarChart } from "react-native-chart-kit";
import { Dimensions } from "react-native";

export default function PreviaTab({ route }) {
  const { h2h, destacados, estado, partidoInfo } = route.params || {};
  const ultimosEnfrentamientos = Array.isArray(h2h) ? h2h.slice(0, 5) : [];

  // GRAFICO
  let vL = 0, vV = 0, e = 0;
  
  h2h.forEach(p => {
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

  const formaLocal = parseForma(estado?.local_forma);
  const formaVisitante = parseForma(estado?.visitante_forma);

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

      <View style={styles.h2hContainer}>
        <Text style={styles.h2hTitle}>Ultimos 5 enfrentamientos</Text>

        {ultimosEnfrentamientos.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No hay partidos recientes entre estos equipos</Text>
          </View>
        ) : (
          ultimosEnfrentamientos.map((item) => (
            <View key={item.id_partido} style={styles.matchCard}>
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
            </View>
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
});