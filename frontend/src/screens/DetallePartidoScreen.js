import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
   Image,
   FlatList,
   
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import CustomHeader from '../components/header';

import PreviaTab from '../components/partido/PreviaPartido';
import AlineacionTab from '../components/partido/AlineacionPartido';
import EventosTab from '../components/partido/EventosPartido';
import PostPartidoTab from '../components/partido/PostPartido';
import { useTheme } from '../theme/ThemeContext';

const Tab = createMaterialTopTabNavigator();

export default function DetallePartidoScreen({navigation, route}) {
   const { colors } = useTheme();
   const { width } = useWindowDimensions();
   const esEscritorio = Platform.OS === 'web' && width >= 1000;
   const pestanasExpandidas = Platform.OS === 'web' && width >= 768;
   const id_partido = route.params?.id_partido ?? route.params?.idpartido;
   const [loading, setLoading] = useState(true);
   const [partidoInfo, setPartidoInfo] = useState(null);
   const [extraData, setExtraData] = useState({ h2h: [], destacados: [], estado: null });

   useEffect(() => {
      cargarDatosPartido();
   }, [id_partido]);

   const cargarDatosPartido = async () => {
      try {
         if (!id_partido) {
            Alert.alert('Error', 'No se recibió el identificador del partido');
            return;
         }

         setLoading(true);
         
         // 1. Primero traemos la info básica para saber quiénes son id_local e id_visitante
         const resInfo = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/partidos/${id_partido}/info`);
         const info = await resInfo.json();
         setPartidoInfo(info);

         // 2. Ahora lanzamos el resto en paralelo para ganar velocidad
         const [resH2H, resDestacados, resEstado] = await Promise.all([
         fetch(`${process.env.EXPO_PUBLIC_API_URL}/partidos/h2h/${info.id_local}/${info.id_visitante}?id_partido_actual=${id_partido}`),
         fetch(`${process.env.EXPO_PUBLIC_API_URL}/partidos/${id_partido}/jugadores_destacados`),
         fetch(`${process.env.EXPO_PUBLIC_API_URL}/partidos/${id_partido}/estado_actual`)
         ]);

         const [h2h, destacados, estado] = await Promise.all([
         resH2H.json(),
         resDestacados.json(),
         resEstado.json()
         ]);

         setExtraData({ h2h, destacados, estado });
      } catch (error) {
         console.error(error);
         Alert.alert("Error", "No se pudieron cargar los detalles del partido");
      } finally {
         setLoading(false);
      }
   };

   const irDetalleEquipo = (idEquipo) => {
      if (!idEquipo) {
         return;
      }

      navigation.navigate('DetalleEquipo', { idEquipo });
   };

   return (
      <KeyboardAvoidingView
         style={styles.container}
         behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
         <CustomHeader
         title="Detalle del Partido"
         onMenuPress={() => navigation.openDrawer()}
         onSearchPress={() => Alert.alert('Función de búsqueda no implementada')}
         />
         <View
            style={[
               styles.resultadoContainer,
               esEscritorio && styles.resultadoContainerDesktop,
            ]}
         >
            <Text
               style={[
                  styles.jornadatext,
                  esEscritorio && styles.jornadaTextDesktop,
               ]}
            >
               Jornada {partidoInfo?.jornada} 
            </Text>
            <View style={[styles.marcadorRow, esEscritorio && styles.marcadorRowDesktop]}>
               <View style={[styles.equipoCol, esEscritorio && styles.equipoColDesktop]}>
                  <TouchableOpacity
                     style={[
                        styles.logoEquipoWrap,
                        esEscritorio && styles.logoEquipoWrapDesktop,
                     ]}
                     onPress={() => irDetalleEquipo(partidoInfo?.id_local)}
                     activeOpacity={0.85}
                     disabled={!partidoInfo?.id_local}
                  >
                     <Image
                        source={{ uri: partidoInfo?.logo_local }}
                        style={styles.logoEquipo}
                     />
                  </TouchableOpacity>
                  <Text
                     style={[
                        styles.nombreEquipo,
                        esEscritorio && styles.nombreEquipoDesktop,
                     ]}
                     numberOfLines={2}
                  >
                     {partidoInfo?.equipo_local}
                  </Text>
               </View>
               <Text style={[styles.golesText, esEscritorio && styles.golesTextDesktop]}>
                  {partidoInfo?.goles_local != null && partidoInfo?.goles_visitante != null
                     ? `${partidoInfo.goles_local} - ${partidoInfo.goles_visitante}`
                     : '- -'}
               </Text>
               <View
                  style={[
                     styles.equipoCol,
                     esEscritorio && styles.equipoColDesktop,
                     esEscritorio && styles.equipoColVisitanteDesktop,
                  ]}
               >
                  <TouchableOpacity
                     style={[
                        styles.logoEquipoWrap,
                        esEscritorio && styles.logoEquipoWrapDesktop,
                     ]}
                     onPress={() => irDetalleEquipo(partidoInfo?.id_visitante)}
                     activeOpacity={0.85}
                     disabled={!partidoInfo?.id_visitante}
                  >
                     <Image
                        source={{ uri: partidoInfo?.logo_visitante }}
                        style={styles.logoEquipo}
                     />
                  </TouchableOpacity>
                  <Text
                     style={[
                        styles.nombreEquipo,
                        esEscritorio && styles.nombreEquipoVisitanteDesktop,
                     ]}
                     numberOfLines={2}
                  >
                     {partidoInfo?.equipo_visitante}
                  </Text>
               </View>
            </View>
            <View style={[styles.fecha, esEscritorio && styles.fechaDesktop]}>
               <Ionicons name="time-outline" size={16} color="#d4e5f7" />
               <Text style={styles.horaText}>{partidoInfo?.dia} {partidoInfo?.nombre_mes} {partidoInfo?.anio}</Text>
            </View>  
         </View>
         <Tab.Navigator
         screenOptions={{
            tabBarLabelStyle: { fontSize: 12, fontWeight: 'bold', textAlign: 'center' },
            tabBarIndicatorStyle: { backgroundColor: '#e20613' }, // Rojo LaLiga
            tabBarActiveTintColor: colors.textStrong,
            tabBarInactiveTintColor: colors.textMuted,
            tabBarStyle: { backgroundColor: colors.surface },
            tabBarItemStyle: pestanasExpandidas
               ? { flex: 1, minWidth: 0, paddingHorizontal: 12 }
               : { width: 120, paddingHorizontal: 12 },
            tabBarScrollEnabled: !pestanasExpandidas,
            lazy: true,
         }}
         >
            <Tab.Screen name="Previa" options={{ tabBarLabel: 'PREVIA' }}>
               {(props) => (
                  <PreviaTab
                     {...props}
                     route={{
                        ...props.route,
                        params: {
                           ...props.route?.params,
                           id_partido,
                           partidoInfo,
                           h2h: extraData.h2h,
                           destacados: extraData.destacados,
                           estado: extraData.estado,
                        },
                     }}
                  />
               )}
            </Tab.Screen>
            <Tab.Screen name="Alineacion" options={{ tabBarLabel: 'ALINEACIÓN' }}>
               {(props) => (
                  <AlineacionTab
                     {...props}
                     route={{
                        ...props.route,
                        params: {
                           ...props.route?.params,
                           id_partido,
                           partidoInfo,
                        },
                     }}
                  />
               )}
            </Tab.Screen>
            <Tab.Screen name="Eventos" options={{ tabBarLabel: 'EVENTOS' }}>
               {(props) => (
                  <EventosTab
                     {...props}
                     route={{
                        ...props.route,
                        params: {
                           ...props.route?.params,
                           id_partido,
                           partidoInfo,
                        },
                     }}
                  />
               )}
            </Tab.Screen>
            <Tab.Screen name="Post-Partido" options={{ tabBarLabel: 'POST-PARTIDO' }}>
               {(props) => (
                  <PostPartidoTab
                     {...props}
                     route={{
                        ...props.route,
                        params: {
                           ...props.route?.params,
                           id_partido,
                           partidoInfo,
                        },
                     }}
                  />
               )}
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
   resultadoContainer: {
      marginHorizontal: 16,
      marginTop: 14,
      marginBottom: 10,
      backgroundColor: '#1f4f7a',
      borderRadius: 18,
      paddingHorizontal: 14,
      paddingVertical: 16,
   },
   resultadoContainerDesktop: {
      marginTop: 10,
      marginBottom: 8,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
   },
   jornadatext: {
      textAlign: 'center',
      fontSize: 16,
      fontWeight: '700',
      color: '#eef6ff',
      marginBottom: 14,
   },
   jornadaTextDesktop: {
      minWidth: 92,
      marginRight: 16,
      marginBottom: 0,
      fontSize: 15,
   },
   marcadorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
   },
   marcadorRowDesktop: {
      flex: 1,
      justifyContent: 'center',
   },
   equipoCol: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
   },
   equipoColDesktop: {
      maxWidth: 280,
      flexDirection: 'row',
      justifyContent: 'center',
      paddingHorizontal: 8,
   },
   equipoColVisitanteDesktop: {
      flexDirection: 'row-reverse',
   },
   logoEquipoWrap: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: '#ffffff',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
   },
   logoEquipoWrapDesktop: {
      width: 48,
      height: 48,
      borderRadius: 24,
   },
   logoEquipo: {
      width: '78%',
      height: '78%',
      resizeMode: 'contain',
   },
   nombreEquipo: {
      marginTop: 8,
      textAlign: 'center',
      color: '#eef6ff',
      fontSize: 13,
      fontWeight: '600',
   },
   nombreEquipoDesktop: {
      marginTop: 0,
      marginLeft: 8,
      textAlign: 'left',
      fontSize: 14,
   },
   nombreEquipoVisitanteDesktop: {
      marginTop: 0,
      marginLeft: 0,
      marginRight: 8,
      textAlign: 'right',
      fontSize: 14,
   },
   golesText: {
      minWidth: 90,
      textAlign: 'center',
      color: '#ffffff',
      fontSize: 30,
      fontWeight: '800',
      letterSpacing: 0.6,
   },
   golesTextDesktop: {
      minWidth: 82,
      fontSize: 28,
   },
   fecha: {
      marginTop: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
   },
   fechaDesktop: {
      minWidth: 150,
      marginTop: 0,
      marginLeft: 16,
   },
   horaText: {
      color: '#d4e5f7',
      fontSize: 14,
      fontWeight: '600',
   },
  screenContent: {
    paddingBottom: 26,
  }
});
