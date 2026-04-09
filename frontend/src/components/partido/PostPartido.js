import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

import AnalisisEquipoTab from './PostPartidoAnalisis/AnalisisEquipo';
import AnalisisJugadorTab from './PostPartidoAnalisis/AnalisisJugador';
import GraficasTab from './PostPartidoAnalisis/AnalisisGraficas';
const Tab = createMaterialTopTabNavigator();

export default function PostPartidoTab({ route }) {
  const { id_partido, partidoInfo } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [datosEquipo, setDatosEquipo] = useState(null);
  const [datosJugadorLocal, setDatosJugadorLocal] = useState(null);
  const [datosJugadorVisitante, setDatosJugadorVisitante] = useState(null);
  const [graficas, setGraficas] = useState(null);

  useEffect(() => {
    const cargarPostPartido = async () => {
      try {
        setLoading(true);

        if (!id_partido) {
          setDatosEquipo([]);
          return;
        }

        const responseStats = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/partidos/${id_partido}/stats_equipos`
        );

        if (!responseStats.ok) {
          throw new Error('No se pudieron cargar las stats de equipos');
        }

        const stats = await responseStats.json();
        setDatosEquipo(Array.isArray(stats) ? stats : []);
      } catch (error) {
        setDatosEquipo([]);
      } finally {
        setLoading(false);
      }
    };

    cargarPostPartido();
  }, [id_partido]);

  if (loading) return <ActivityIndicator style={{flex: 1}} />;

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarShowLabel: false, // Oculta el texto para que solo se vea el icono
            tabBarActiveTintColor: '#12233F', // Color del icono seleccionado
            tabBarInactiveTintColor: '#8E8E93', // Color del icono no seleccionado
            tabBarIndicatorStyle: { backgroundColor: '#12233F' }, // Línea inferior
            tabBarIcon: ({ color, focused }) => {
              let iconName;

              if (route.name === 'Analisis Equipo') {
                iconName = focused ? 'shield-checkmark' : 'shield-checkmark-outline';
              } else if (route.name === 'Analisis Jugador') {
                iconName = focused ? 'people' : 'people-outline';
              } else if (route.name === 'Graficas') {
                iconName = focused ? 'bar-chart' : 'bar-chart-outline';
              }

              return <Ionicons name={iconName} size={24} color={color} />;
            },
          })}
        >
          <Tab.Screen name="Analisis Equipo">
            {(props) => (
              <AnalisisEquipoTab 
                {...props}
                route={{
                  ...props.route,
                  params: {
                    ...props.route.params,
                    datosEquipo,
                    partidoInfo,
                  },
                }} 
              />
            )}
          </Tab.Screen>
          <Tab.Screen name="Analisis Jugador" component={AnalisisJugadorTab} />
          <Tab.Screen name="Graficas" component={GraficasTab} />
        </Tab.Navigator>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  section: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});