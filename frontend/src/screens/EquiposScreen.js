import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
   Image,
   FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomHeader from '../components/header';
import { TextInput } from 'react-native-gesture-handler';
import FavoritoButton from '../components/FavoritoButton';
import { useFavoritos } from '../context/FavoritosContext';

export default function EquiposScreen({ navigation }) {
   const { equiposFav } = useFavoritos();
   const { width } = useWindowDimensions();
   const [listaEquipos, setListaEquipos] = useState([]);
   const [textoBusqueda, setTextoBusqueda] = useState('');
   const [cargando, setCargando] = useState(false);
   const [errorCarga, setErrorCarga] = useState('');

   const esEscritorio = Platform.OS === 'web' && width >= 768;
   const separacionGrid = 14;
   const columnasEscritorio = Math.max(
      3,
      Math.min(6, Math.floor((width - 32 + separacionGrid) / (240 + separacionGrid)))
   );
   const numeroColumnas = esEscritorio ? columnasEscritorio : 2;
   const anchoTarjetaEscritorio = Math.min(
      280,
      (width - 32 - separacionGrid * (numeroColumnas - 1)) / numeroColumnas
   );

   const handleBusqueda = (texto) => {
      setTextoBusqueda(texto);
   };

   const equiposFiltrados = useMemo(() => {
      const base = textoBusqueda.trim()
         ? listaEquipos.filter((equipo) =>
              equipo.nombre_equipo.toLowerCase().includes(textoBusqueda.toLowerCase())
           )
         : listaEquipos;

      const favSet = new Set(equiposFav.map((id) => Number(id)));

      return [...base].sort((a, b) => {
         const aFav = favSet.has(Number(a.id_equipo));
         const bFav = favSet.has(Number(b.id_equipo));
         if (aFav === bFav) {
            return String(a.nombre_equipo).localeCompare(String(b.nombre_equipo), 'es');
         }
         return Number(bFav) - Number(aFav);
      });
   }, [listaEquipos, textoBusqueda, equiposFav]);

   useEffect(() => {
      let pantallaActiva = true;
      const cargarEquipos = async () => {
         setCargando(true);
         setErrorCarga('');
         try {
            const response = await fetch(
               `${process.env.EXPO_PUBLIC_API_URL}/equipos`
            );

            if (!response.ok) {
               throw new Error('No se pudieron cargar los equipos');
            }

            const data = await response.json();

            if (pantallaActiva) {
               const equiposArray = Array.isArray(data) ? data : [];
               setListaEquipos(equiposArray);
            } else {
               setListaEquipos([]);
            }
         } catch (error) {
            if (pantallaActiva) {
               setErrorCarga('Error al cargar los equipos');
               setListaEquipos([]);
            }
         } finally {
            if (pantallaActiva) {
               setCargando(false);
            }
         }
      };
      cargarEquipos();
      return () => {
         pantallaActiva = false;
      };
   }, []);

   const irDetalleEquipo = (idEquipo) => {
    navigation.navigate('DetalleEquipo', { idEquipo });
   };

   const renderEstadoVacio = () => {
      if (cargando) {
         return (
            <View style={styles.loadingState}>
               <ActivityIndicator size="small" color="#1f6fa7" />
               <Text style={styles.loadingText}>Cargando equipos...</Text>
            </View>
         );
      }

      return (
         <View style={styles.emptyState}>
            <Ionicons
               name={errorCarga ? 'alert-circle-outline' : 'shield-outline'}
               size={34}
               color="#5f7f9b"
            />
            <Text style={styles.emptyStateText}>
               {errorCarga || 'No se encontraron equipos'}
            </Text>
         </View>
      );
   };

   return (
      <KeyboardAvoidingView
         style={styles.container}
         behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
         <CustomHeader
            title="Equipos"
            onMenuPress={() => navigation.openDrawer()}
            onSearchPress={() => Alert.alert('Función de búsqueda no implementada')}
         />
         <View style={styles.buscadorContainer}>
            <TextInput 
               style={styles.buscadorInput} 
               placeholder="Buscar equipos..." 
               editable={true} 
               value={textoBusqueda}
               onChangeText={handleBusqueda}
               autoCapitalize="none"
            />
         </View>
         <FlatList
            key={`equipos-${numeroColumnas}`}
            data={equiposFiltrados}
            keyExtractor={(item) => item.id_equipo.toString()}
            numColumns={numeroColumnas}
            columnWrapperStyle={[
               styles.columnWrapper,
               esEscritorio && styles.columnWrapperDesktop,
            ]}
            contentContainerStyle={styles.screenContent}
            ListEmptyComponent={renderEstadoVacio}
            renderItem={({ item }) => (
               <TouchableOpacity
                  style={[
                     styles.equipoCard,
                     esEscritorio
                        ? [
                             styles.equipoCardDesktop,
                             { width: anchoTarjetaEscritorio },
                          ]
                        : styles.equipoCardMobile,
                  ]}
                  onPress={() => irDetalleEquipo(item.id_equipo)}
                  activeOpacity={0.85}
               >
                  <FavoritoButton
                     id={item.id_equipo}
                     tipo="equipo"
                     style={styles.favoritoFloat}
                  />
                  <View style={styles.logoContainer}>
                     <Image
                        source={{ uri: item.logo }}
                        style={[
                           styles.equipoLogo,
                           esEscritorio && styles.equipoLogoDesktop,
                        ]}
                        resizeMode="contain"
                     />
                  </View>
                  <Text
                     style={[
                        styles.equipoName,
                        esEscritorio && styles.equipoNameDesktop,
                     ]}
                     numberOfLines={2}
                  >
                     {item.nombre_equipo}
                  </Text>
               </TouchableOpacity>
            )}
         />
      </KeyboardAvoidingView>
   );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f8fc',
  },
  screenContent: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 26,
  },
   buscadorContainer: {
      paddingHorizontal: 16,
      marginBottom: 0,
      marginTop: 14,
   },
   buscadorInput: {
      backgroundColor: '#ffffff',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#d9e5f0',
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      color: '#1d3850',
   },
   columnWrapper: {
      justifyContent: 'space-between',
      marginBottom: 12,
   },
   columnWrapperDesktop: {
      justifyContent: 'center',
      gap: 14,
      marginBottom: 14,
   },
   equipoCard: {
      borderRadius: 8,
      backgroundColor: '#ffffff',
      borderWidth: 1,
      borderColor: '#d9e5f0',
      paddingHorizontal: 12,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'space-between',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
      position: 'relative',
   },
   equipoCardMobile: {
      width: '48.5%',
      aspectRatio: 1,
   },
   equipoCardDesktop: {
      height: 240,
   },
   favoritoFloat: {
      position: 'absolute',
      right: 8,
      top: 8,
      zIndex: 10,
   },
   logoContainer: {
      flex: 1,
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
   },
   equipoLogo: {
      width: 64,
      height: 64,
   },
   equipoLogoDesktop: {
      width: 120,
      height: 120,
   },
   equipoName: {
      width: '100%',
      textAlign: 'center',
      fontSize: 14,
      fontWeight: '700',
      color: '#1d3850',
      minHeight: 36,
   },
   equipoNameDesktop: {
      fontSize: 17,
      lineHeight: 22,
      minHeight: 44,
   },
   emptyState: {
      backgroundColor: '#ffffff',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: '#d9e5f0',
      paddingVertical: 28,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
   },
   loadingState: {
      backgroundColor: '#ffffff',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: '#d9e5f0',
      paddingVertical: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
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

});
