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
import FavoritoButton from '../components/FavoritoButton';

export default function DetalleEquipoScreen({navigation, route}) {
   const idEquipo = route?.params?.idEquipo;

   return (
      <KeyboardAvoidingView
         style={styles.container}
         behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
         <CustomHeader
         title="Detalle del Equipo"
         onMenuPress={() => navigation.openDrawer()}
         onSearchPress={() => Alert.alert('Función de búsqueda no implementada')}
         />
         <ScrollView contentContainerStyle={styles.screenContent}>
            <View style={styles.titleRow}>
               <Text style={styles.title}>Detalle del Equipo</Text>
               {idEquipo ? <FavoritoButton id={idEquipo} tipo="equipo" /> : null}
            </View>
            {/* Aquí puedes agregar la lógica para mostrar los equipos */}
         </ScrollView>
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
      paddingHorizontal: 16,
      paddingTop: 16,
   },
   titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
   },
   title: {
      fontSize: 22,
      color: '#123a5d',
      fontWeight: '800',
   },
});