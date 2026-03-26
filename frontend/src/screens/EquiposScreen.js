import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
   Image,
   FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomHeader from '../components/header';
import { TextInput } from 'react-native-gesture-handler';

export default function EquiposScreen({ navigation }) {
   const [listaEquipos, setListaEquipos] = useState([]);
   const [equiposFiltrados, setEquiposFiltrados] = useState([]);
   const [textoBusqueda, setTextoBusqueda] = useState('');
   const [cargando, setCargando] = useState(false);
   const [errorCarga, setErrorCarga] = useState('');

   const handleBusqueda = (texto) => {
      setTextoBusqueda(texto); // Actualizamos el input

      if (texto.trim() === '') {
         // Si el buscador está vacío, mostramos todos de nuevo
         setEquiposFiltrados(listaEquipos);
      } else {
         // Filtramos ignorando mayúsculas/minúsculas
         const filtrados = listaEquipos.filter((equipo) =>
            equipo.nombre_equipo.toLowerCase().includes(texto.toLowerCase())
         );
         setEquiposFiltrados(filtrados);
      }
   };

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
               setEquiposFiltrados(equiposArray);
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
            data={equiposFiltrados}
            keyExtractor={(item) => item.id_equipo.toString()}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={styles.screenContent}
            ListEmptyComponent={renderEstadoVacio}
            renderItem={({ item }) => (
               <TouchableOpacity
                  style={styles.equipoCard}
                  onPress={() => irDetalleEquipo(item.id_equipo)}
                  activeOpacity={0.85}
               >
                  <View style={styles.logoContainer}>
                     <Image
                        source={{ uri: item.logo_url }}
                        style={styles.equipoLogo}
                        resizeMode="contain"
                     />
                  </View>
                  <Text style={styles.equipoName} numberOfLines={2}>
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
   equipoCard: {
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
   equipoLogo: {
      width: 64,
      height: 64,
   },
   equipoName: {
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