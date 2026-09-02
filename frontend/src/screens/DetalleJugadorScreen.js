import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
   Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import CustomHeader from '../components/header';

import InfoTab from '../components/jugadores/InfoJugador';
import PartidosJugTab from '../components/jugadores/PartidosJugador';
import TrayectoriaTab from '../components/jugadores/TrayectoriaJugador';
import StatsJugTab from '../components/jugadores/StatsJugador';
import FavoritoButton from '../components/FavoritoButton';
import { useTheme } from '../theme/ThemeContext';

const Tab = createMaterialTopTabNavigator();

const JUGADOR_FALLBACK = {
   nombre: 'Jugador',
   nombre_ultimo_equipo: 'Equipo no disponible',
   posicion_ultimo_equipo: 'Sin posicion',
   posicion: 'Sin posicion',
   edad: '-',
   foto: null,
   logo_ultimo_equipo: null,
};

export default function DetalleJugadorScreen({navigation, route}) {
   const { colors } = useTheme();
   const id_jugador = route?.params?.id_jugador ?? route?.params?.idjugador ?? route?.params?.id;
   const [loading, setLoading] = useState(true);
   const [jugadorInfo, setJugadorInfo] = useState(null);

   useEffect(() => {
      cargarDatosJugador();
   }, [id_jugador]);

   const cargarDatosJugador = async () => {
      try {
         if (!id_jugador) {
            setJugadorInfo(JUGADOR_FALLBACK);
            return;
         }

         setLoading(true);
         const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/jugadores/info/${id_jugador}`);
         if (!response.ok) {
            throw new Error('No se pudo cargar la información del jugador');
         }
         const data = await response.json();
         setJugadorInfo(data ?? JUGADOR_FALLBACK);
      } catch (error) {
         setJugadorInfo(JUGADOR_FALLBACK);
      } finally {
         setLoading(false);
      }
   };

   const jugador = jugadorInfo ?? JUGADOR_FALLBACK;

   if (loading) {
      return (
         <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
         </View>
      );
   }


   return (
      <KeyboardAvoidingView
         style={styles.container}
         behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
         <CustomHeader
             title={jugador.nombre}
         onMenuPress={() => navigation.openDrawer()}
         onSearchPress={() => Alert.alert('Función de búsqueda no implementada')}
         />
         <View style={styles.jugadorContainer}>
                  <View style={styles.fotoWrapper}>
                     {jugador.foto ? (
                        <Image source={{ uri: jugador.foto }} style={styles.fotoJugador} />
                     ) : (
                        <View style={styles.fotoFallback}>
                           <Ionicons name="person" size={44} color="#325b88" />
                        </View>
                     )}
                  </View>

                  <View style={styles.infoPrincipal}>
                     <Text style={styles.nombreJugador}>{jugador.nombre}</Text>
                     <Text style={styles.equipoJugador}>{jugador.nombre_ultimo_equipo}</Text>

                     <View style={styles.badgesRow}>
                        <View style={styles.badge}>
                           <Ionicons name="shirt-outline" size={14} color="#1e3f66" />
                           <Text style={styles.badgeTextPrimary}>{jugador.posicion || 'Sin posicion'}</Text>
                        </View>
                        <View style={styles.badge}>
                           <Ionicons name="calendar-outline" size={14} color="#1e3f66" />
                           <Text style={styles.badgeText}>{jugador.edad} años</Text>
                        </View>
                     </View>
                  </View>

                  <View style={styles.sideActionsWrap}>
                     <FavoritoButton id={id_jugador} tipo="jugador" style={styles.favoritoDetalle} />
                     <View style={styles.logoEquipoWrap}>
                        {jugador.logo_ultimo_equipo ? (
                           <Image source={{ uri: jugador.logo_ultimo_equipo }} style={styles.logoEquipo} />
                        ) : (
                           <Ionicons name="shield-outline" size={24} color="#7a8da3" />
                        )}
                     </View>
                  </View>
         </View>
         <Tab.Navigator
         screenOptions={{
            tabBarLabelStyle: { fontSize: 12, fontWeight: 'bold', textAlign: 'center' },
            tabBarIndicatorStyle: { backgroundColor: '#e20613' }, // Rojo LaLiga
            tabBarActiveTintColor: colors.textStrong,
                  tabBarInactiveTintColor: colors.textMuted,
                  tabBarStyle: { backgroundColor: colors.surface },
               tabBarItemStyle: { width: 120, paddingHorizontal: 12 },
               tabBarScrollEnabled: true,
                  lazy: true,
         }}
         >
            <Tab.Screen name="INFO" options={{ tabBarLabel: 'INFO' }}>
               {() => <InfoTab id_jugador={id_jugador} />}
            </Tab.Screen>
            <Tab.Screen name="PARTIDOS" options={{ tabBarLabel: 'PARTIDOS' }}>
               {() => <PartidosJugTab id_jugador={id_jugador} />}
            </Tab.Screen>
            <Tab.Screen name="TRAYECTORIA" options={{ tabBarLabel: 'TRAYECTORÍA' }}>
               {() => <TrayectoriaTab id_jugador={id_jugador} />}
            </Tab.Screen>
            <Tab.Screen name="STATS" options={{ tabBarLabel: 'ANÁLISIS' }}>
               {() => <StatsJugTab id_jugador={id_jugador} />}
            </Tab.Screen>
         </Tab.Navigator>
      </KeyboardAvoidingView>
   );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f8fc',
  },
   loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f4f8fc',
   },
   jugadorContainer: {
      marginHorizontal: 14,
      marginTop: 12,
      marginBottom: 10,
      backgroundColor: '#ffffff',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: '#e4ebf2',
      padding: 14,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: '#0d2b4a',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.08,
      shadowRadius: 10,
      elevation: 4,
   },
   fotoWrapper: {
      marginRight: 12,
   },
   fotoJugador: {
      width: 72,
      height: 72,
      borderRadius: 36,
      borderWidth: 2,
      borderColor: '#d6e3f1',
   },
   fotoFallback: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: '#e9f1f8',
      borderWidth: 2,
      borderColor: '#d6e3f1',
      alignItems: 'center',
      justifyContent: 'center',
   },
   infoPrincipal: {
      flex: 1,
   },
   nombreJugador: {
      fontSize: 20,
      fontWeight: '800',
      color: '#0f2743',
      marginBottom: 4,
   },
   equipoJugador: {
      fontSize: 13,
      color: '#4f6782',
      marginBottom: 10,
   },
   badgesRow: {
      flexDirection: 'row',
      alignItems: 'center',
   },
   badge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#edf3f9',
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 5,
      marginRight: 8,
   },
   badgeTextPrimary: {
      color: '#1e3f66',
      fontSize: 12,
      fontWeight: '700',
      marginLeft: 4,
   },
   badgeText: {
      color: '#1e3f66',
      fontSize: 12,
      fontWeight: '700',
      marginLeft: 4,
   },
   sideActionsWrap: {
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 90,
      marginLeft: 8,
   },
   favoritoDetalle: {
      marginBottom: 10,
   },
   logoEquipoWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#f3f6fa',
      borderWidth: 1,
      borderColor: '#e4ebf2',
      alignItems: 'center',
      justifyContent: 'center',
   },
   logoEquipo: {
      width: 28,
      height: 28,
      resizeMode: 'contain',
   },
});
