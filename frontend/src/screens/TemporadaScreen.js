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
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomHeader from '../components/header';
import { FlatList } from 'react-native-gesture-handler';

export default function TemporadaScreen({navigation}) {
   const [temporadas, setTemporadas] = useState([]);
   const [cargando, setCargando] = useState(false);
   const [errorCarga, setErrorCarga] = useState('');

   useEffect(() => {
      const cargarTemporadas = async () => {
         setCargando(true);
         setErrorCarga('');
         try {
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/temporadas/annos`);
            if (!response.ok) {
               throw new Error('No se pudieron cargar las temporadas');
            }
            const data = await response.json();
            setTemporadas(data);
         } catch (error) {
            setErrorCarga(error.message);
         } finally {
            setCargando(false);
         }
      };
      cargarTemporadas();
   }, []);

   const irDetallesTemporada = (temporada) => {
      navigation.navigate('DetallesTemporada', { temporada });
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
         title="Temporada"
         onMenuPress={() => navigation.openDrawer()}
         onSearchPress={() => Alert.alert('Función de búsqueda no implementada')}
         />
         <View style={styles.screenContent}>
            <FlatList
               data={temporadas}
               keyExtractor={(item) => item.temporada.toString()}
               numColumns={2}
               columnWrapperStyle={styles.columnWrapper}
               contentContainerStyle={styles.screenContent}
               ListEmptyComponent={renderEstadoVacio}
               renderItem={({ item }) => (
                  <TouchableOpacity style={styles.temporadaItem} onPress={() => irDetallesTemporada(item)}>
                     <Text style={styles.numTemporada}>{item.temporada}</Text>
                  </TouchableOpacity>
               )}
            />
         </View>
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
     columnWrapper: {
      justifyContent: 'space-between',
      marginBottom: 12,
  },
   temporadaItem: {
      width: '48.5%',
      aspectRatio: 1,
      borderRadius: 8,
      backgroundColor: '#ffffff',
      borderWidth: 1,
      borderColor: '#d9e5f0',
      paddingHorizontal: 12,
      paddingVertical: 14,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
   },
   numTemporada: {
      width: '100%',
      textAlign: 'center',
      fontSize: 30,
      fontWeight: 'bold',
      color: '#333333',
   },
});