import React, { use, useEffect, useMemo, useState } from 'react';
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
  View,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomHeader from '../components/header';
import { FlatList} from 'react-native-gesture-handler';

export default function JugadoresScreen({navigation}) {
   const [listaMasPartidos, setListaMasPartidos] = useState([]);
   const [listaJugadores, setListaJugadores] = useState([]);
   const [jugadoresFiltrados, setJugadoresFiltrados] = useState([]);
   const [textoBusqueda, setTextoBusqueda] = useState('');
   const [yaCargadosTodos, setYaCargadosTodos] = useState(false);
   const [cargando, setCargando] = useState(false);
   const [errorCarga, setErrorCarga] = useState('');


   const handleBusqueda = async (texto) => {
      setTextoBusqueda(texto);

      if (texto.trim() === '') {
         setJugadoresFiltrados(listaMasPartidos);
         return;
      }

      if (!yaCargadosTodos && !cargando) {
         try {
            setCargando(true); // Mostrar feedback de que estamos buscando en "toda la liga"
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/jugadores/`);
            const data = await response.json();
            const todos = Array.isArray(data) ? data : [];
            
            setListaJugadores(todos); 
            setYaCargadosTodos(true); 
            
            // Filtramos sobre los recién descargados
            filtrar(texto, todos);
         } catch (e) {
            setErrorCarga("Error al buscar en la base de datos completa");
         } finally {
            setCargando(false);
         }
      } else {
         // Si ya los teníamos, filtramos localmente al instante
         filtrar(texto, listaJugadores);
      }
   };

   // Función auxiliar para no repetir código de filtrado
   const filtrar = (term, base) => {
      const res = base.filter(j => 
         j.nombre.toLowerCase().includes(term.toLowerCase())
      );
      setJugadoresFiltrados(res);
   };
   
   useEffect(() => {
      let pantallaActiva = true;
    
      const cargarJugadoresIniciales = async () => {
         setCargando(true);
         setErrorCarga('');
         try {
               const response = await fetch(
                  `${process.env.EXPO_PUBLIC_API_URL}/jugadores/mas-partidos`
               );

               if (!response.ok) {
                  throw new Error('No se pudieron cargar los jugadores');
               }

               const data = await response.json();
               
               if (pantallaActiva) {
                  const jugadoresArray = Array.isArray(data) ? data : [];
                  
                  setListaMasPartidos(jugadoresArray);
                  setJugadoresFiltrados(jugadoresArray);
               }
         } catch (error) {
               if (pantallaActiva) {
                  setErrorCarga('Error al cargar la lista inicial');
                  setListaMasPartidos([]);
               }
         } finally {
               if (pantallaActiva) {
                  setCargando(false);
               }
         }
      };

      cargarJugadoresIniciales();

      return () => {
         pantallaActiva = false;
      };
   }, []); 

   const irDetallesJugador = (idJugador) => {
      navigation.navigate('DetalleJugador', { id: idJugador });
   };

   const renderEstadoVacio = () => {
      if (cargando) {
         return (
            <View style={styles.loadingState}>
               <ActivityIndicator size="small" color="#1f6fa7" />
               <Text style={styles.loadingText}>Cargando jugadores...</Text>
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
               {errorCarga || 'No se encontraron jugadores'}
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
         title="Jugadores"
         onMenuPress={() => navigation.openDrawer()}
         onSearchPress={() => Alert.alert('Función de búsqueda no implementada')}
         />
         <View style={styles.buscadorContainer}>
            <TextInput 
               style={styles.buscadorInput} 
               placeholder="Buscar jugadores..." 
               editable={true} 
               value={textoBusqueda}
               onChangeText={handleBusqueda}
               autoCapitalize="none"
            />
         </View>
         <FlatList
            data={jugadoresFiltrados}
            keyExtractor={(item) => item.id_jugador.toString()}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={styles.screenContent}
            ListEmptyComponent={renderEstadoVacio}
            renderItem={({ item }) => (
               <TouchableOpacity
                  style={styles.jugadorCard}
                  onPress={() => irDetallesJugador(item.id_jugador)}
                  activeOpacity={0.85}
               >
                  <View style={styles.logoContainer}>
                  <Image
                     source={item.foto ? { uri: item.foto } : require('../assets/player_default.png')}
                     style={styles.jugadorFoto}
                     resizeMode="cover" // Cover suele quedar mejor para caras de jugadores
                  />
                  </View>
                  <Text style={styles.jugadorName} numberOfLines={2}>
                     {item.nombre}
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
     jugadorCard: {
      width: '48.5%',
      aspectRatio: 1,
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
   },
   logoContainer: {
      flex: 1,
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
   },
   jugadorFoto: {
      width: 64,
      height: 64,
   },
   jugadorName: {
      width: '100%',
      textAlign: 'center',
      fontSize: 14,
      fontWeight: '700',
      color: '#1d3850',
      minHeight: 36,
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