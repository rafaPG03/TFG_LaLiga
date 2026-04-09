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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import CustomHeader from '../components/header';

//Configuración del calendario en español
LocaleConfig.locales['es'] = {
  monthNames: [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ],
  monthNamesShort: ['Ene.', 'Feb.', 'Mar.', 'Abr.', 'May.', 'Jun.', 'Jul.', 'Ago.', 'Sep.', 'Oct.', 'Nov.', 'DDic.'],
  dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  dayNamesShort: ['Dom.', 'Lun.', 'Mar.', 'Mié.', 'Jue.', 'Vie.', 'Sáb.'],
  today: "Hoy",
};

LocaleConfig.defaultLocale = 'es';

const RADIO_FECHAS = 4;

const formatearFechaISO = (fecha) => {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');

  return `${anio}-${mes}-${dia}`;
};

const fechaHoyISO = () => formatearFechaISO(new Date());

const parsearFechaISO = (fechaTexto) => {
  const patron = /^\d{4}-\d{2}-\d{2}$/;

  if (!patron.test(fechaTexto)) {
    return null;
  }

  const [anio, mes, dia] = fechaTexto.split('-').map(Number);
  const fecha = new Date(anio, mes - 1, dia);

  if (
    Number.isNaN(fecha.getTime()) ||
    fecha.getFullYear() !== anio ||
    fecha.getMonth() !== mes - 1 ||
    fecha.getDate() !== dia
  ) {
    return null;
  }

  return fecha;
};

const sumarDiasISO = (fechaTexto, cantidadDias) => {
  const fecha = parsearFechaISO(fechaTexto);

  if (!fecha) {
    return fechaHoyISO();
  }

  fecha.setDate(fecha.getDate() + cantidadDias);
  return formatearFechaISO(fecha);
};

const construirVentanaFechas = (fechaCentro, radio = RADIO_FECHAS) => {
  const fechas = [];

  for (let i = -radio; i <= radio; i += 1) {
    fechas.push(sumarDiasISO(fechaCentro, i));
  }

  return fechas;
};

export default function InicioScreen({ navigation }) {
  const [fechaSeleccionada, setFechaSeleccionada] = useState(fechaHoyISO);
  const [calendarioVisible, setCalendarioVisible] = useState(false);
  const [partidosDelDia, setPartidosDelDia] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [errorCarga, setErrorCarga] = useState('');

  const fechasVisibles = useMemo(
    () => construirVentanaFechas(fechaSeleccionada),
    [fechaSeleccionada]
  );

  useEffect(() => {
    let pantallaActiva = true;

    const cargarPartidos = async () => {
      setCargando(true);
      setErrorCarga('');

      try {
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/partidos?fecha=${fechaSeleccionada}`
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
  }, [fechaSeleccionada]);

  const irDetallePartido = (id_partido) => {
    navigation.navigate('DetallePartido', { id_partido });
  };

  const seleccionarFecha = (fecha) => {
    setFechaSeleccionada(fecha);
  };

  const formatearHora = (hora) => {
    if (!hora || typeof hora !== 'string') {
      return '--:--';
    }

    return hora.slice(0, 5);
  };

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
        <View style={styles.dateSection}>
          <Text style={styles.sectionTitle}>Selecciona fecha</Text>
          <View style={styles.dateControlsRow}>
            <TouchableOpacity
              style={styles.arrowButton}
              onPress={() => seleccionarFecha(sumarDiasISO(fechaSeleccionada, -1))}
              activeOpacity={0.85}
            >
              <Ionicons name="chevron-back" size={20} color="#1f6fa7" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.calendarButton}
              onPress={() => setCalendarioVisible(true)}
              activeOpacity={0.85}
            >
              <Ionicons name="calendar-outline" size={18} color="#1f6fa7" />
              <Text style={styles.calendarButtonText}>{fechaSeleccionada}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.arrowButton}
              onPress={() => seleccionarFecha(sumarDiasISO(fechaSeleccionada, 1))}
              activeOpacity={0.85}
            >
              <Ionicons name="chevron-forward" size={20} color="#1f6fa7" />
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateListContent}
          >
            {fechasVisibles.map((fecha) => {
              const activa = fecha === fechaSeleccionada;

              return (
                <TouchableOpacity
                  key={fecha}
                  style={[styles.datePill, activa && styles.datePillActive]}
                  onPress={() => seleccionarFecha(fecha)}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.dateText, activa && styles.dateTextActive]}>
                    {fecha}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.matchesSection}>
          <Text style={styles.sectionTitle}>Partidos de {fechaSeleccionada}</Text>

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
              <Text style={styles.emptyStateText}>No hay partidos para esta fecha</Text>
            </View>
          ) : (
            partidosDelDia.map((partido) => (
              <TouchableOpacity
                key={String(partido.id_partido)}
                style={styles.matchCard}
                onPress={() => irDetallePartido(partido.id_partido)}
                activeOpacity={0.85}
              >
                <Text style={styles.matchTime}>{formatearHora(partido.hora)}</Text>

                <View style={styles.teamsRow}>
                  <Text style={styles.teamName} numberOfLines={1}>
                    {partido.equipo_local}
                  </Text>
                  <Text style={styles.vsText}>vs</Text>
                  <Text style={styles.teamName} numberOfLines={1}>
                    {partido.equipo_visitante}
                  </Text>
                </View>

                <Text style={styles.scoreText}>
                  {partido.goles_local ?? '-'} - {partido.goles_visitante ?? '-'}
                </Text>

                <Ionicons name="chevron-forward" size={20} color="#2b5b84" />
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      <Modal
        visible={calendarioVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setCalendarioVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.calendarModalCard}>
            <View style={styles.calendarModalHeader}>
              <Text style={styles.calendarModalTitle}>Selecciona una fecha</Text>
              <TouchableOpacity
                style={styles.closeCalendarButton}
                onPress={() => setCalendarioVisible(false)}
                activeOpacity={0.85}
              >
                <Ionicons name="close" size={18} color="#1f6fa7" />
              </TouchableOpacity>
            </View>

            <Calendar
              current={fechaSeleccionada}
              onDayPress={(day) => {
                seleccionarFecha(day.dateString);
                setCalendarioVisible(false);
              }}
              markedDates={{
                [fechaSeleccionada]: {
                  selected: true,
                  selectedColor: '#1f6fa7',
                },
              }}
              theme={{
                arrowColor: '#1f6fa7',
                todayTextColor: '#1f6fa7',
                selectedDayBackgroundColor: '#1f6fa7',
                textDayFontWeight: '500',
                textMonthFontWeight: '700',
                textDayHeaderFontWeight: '600',
              }}
            />
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
  dateSection: {
    marginTop: 20,
  },
  dateControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  arrowButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e8f1f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarButton: {
    flex: 1,
    height: 38,
    marginHorizontal: 8,
    backgroundColor: '#e8f1f9',
    borderWidth: 1,
    borderColor: '#d1e0ed',
    borderRadius: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarButtonText: {
    marginLeft: 8,
    color: '#1f4f73',
    fontSize: 14,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#163f61',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  dateListContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  datePill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: '#e8f1f9',
    marginRight: 10,
  },
  datePillActive: {
    backgroundColor: '#1f6fa7',
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#28506d',
  },
  dateTextActive: {
    color: '#ffffff',
  },
  matchesSection: {
    marginTop: 10,
    paddingHorizontal: 16,
  },
  matchCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#d9e5f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  matchTime: {
    width: 56,
    fontSize: 15,
    fontWeight: '700',
    color: '#1f6fa7',
  },
  teamsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  teamName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1d3850',
  },
  vsText: {
    marginHorizontal: 8,
    fontSize: 13,
    fontWeight: '700',
    color: '#7894ac',
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
  scoreText: {
    width: 38,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
    color: '#103a5d',
    marginRight: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(13, 33, 51, 0.35)',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  calendarModalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d9e5f0',
    padding: 12,
  },
  calendarModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  calendarModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#163f61',
  },
  closeCalendarButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#e8f1f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
});