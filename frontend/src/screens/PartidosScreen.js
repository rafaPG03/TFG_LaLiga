import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
   FlatList,
   Image,
  KeyboardAvoidingView,
   Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomHeader from '../components/header';

export default function PartidosScreen({ navigation }) {
   const [equipo1, setEquipo1] = useState(null);
   const [equipo2, setEquipo2] = useState(null);
   const [partidos, setPartidos] = useState([]);
   const [listaEquipos, setListaEquipos] = useState([]);
   const [textoBusqueda, setTextoBusqueda] = useState('');
   const [slotActivo, setSlotActivo] = useState(null);
   const [modalEquiposVisible, setModalEquiposVisible] = useState(false);

   const [cargandoEquipos, setCargandoEquipos] = useState(false);
   const [errorEquipos, setErrorEquipos] = useState('');
   const [cargandoPartidos, setCargandoPartidos] = useState(false);
   const [errorPartidos, setErrorPartidos] = useState('');

   const ambosEquiposSeleccionados = Boolean(equipo1 && equipo2);

   const equiposFiltrados = useMemo(() => {
      if (textoBusqueda.trim() === '') {
         return listaEquipos;
      }

      return listaEquipos.filter((equipo) =>
         equipo.nombre_equipo.toLowerCase().includes(textoBusqueda.toLowerCase())
      );
   }, [listaEquipos, textoBusqueda]);

   useEffect(() => {
      let pantallaActiva = true;

      const cargarEquipos = async () => {
         setCargandoEquipos(true);
         setErrorEquipos('');

         try {
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/equipos`);

            if (!response.ok) {
               throw new Error('No se pudieron cargar los equipos');
            }

            const data = await response.json();

            if (pantallaActiva) {
               setListaEquipos(Array.isArray(data) ? data : []);
            }
         } catch (e) {
            if (pantallaActiva) {
               setErrorEquipos('Error al cargar los equipos');
               setListaEquipos([]);
            }
         } finally {
            if (pantallaActiva) {
               setCargandoEquipos(false);
            }
         }
      };

      cargarEquipos();

      return () => {
         pantallaActiva = false;
      };
   }, []);

   const cargarPartidosH2H = async () => {
      if (!equipo1 || !equipo2) {
         return;
      }

      setCargandoPartidos(true);
      setErrorPartidos('');

      try {
         const response = await fetch(
            `${process.env.EXPO_PUBLIC_API_URL}/partidos/h2h/${equipo1.id_equipo}/${equipo2.id_equipo}`
         );

         if (!response.ok) {
            throw new Error('No se pudieron cargar los partidos entre equipos');
         }

         const data = await response.json();
         setPartidos(Array.isArray(data) ? data : []);
      } catch (e) {
         setErrorPartidos('Error al cargar la comparativa de partidos');
         setPartidos([]);
      } finally {
         setCargandoPartidos(false);
      }
   };

   useEffect(() => {
      if (!ambosEquiposSeleccionados) {
         setPartidos([]);
         setErrorPartidos('');
         return;
      }

      cargarPartidosH2H();
   }, [equipo1, equipo2]);

   const abrirSelector = (slot) => {
      setSlotActivo(slot);
      setTextoBusqueda('');
      setModalEquiposVisible(true);
   };

   const seleccionarEquipo = (equipoSeleccionado) => {
      const equipoContrario = slotActivo === 1 ? equipo2 : equipo1;

      if (equipoContrario?.id_equipo === equipoSeleccionado.id_equipo) {
         Alert.alert('Equipo repetido', 'Selecciona un equipo distinto para comparar.');
         return;
      }

      if (slotActivo === 1) {
         setEquipo1(equipoSeleccionado);
      } else if (slotActivo === 2) {
         setEquipo2(equipoSeleccionado);
      }

      setModalEquiposVisible(false);
      setSlotActivo(null);
   };

   const limpiarSeleccion = () => {
      setEquipo1(null);
      setEquipo2(null);
      setPartidos([]);
      setErrorPartidos('');
   };

   const irDetallePartido = (id_partido) => {
      navigation.navigate('DetallePartido', { id_partido });
   };

   const renderSlotEquipo = (equipo, onPress, etiqueta) => (
      <TouchableOpacity style={styles.teamSlot} onPress={onPress} activeOpacity={0.85}>
         {equipo ? (
            <>
               <Image
                  source={{ uri: equipo.logo }}
                  style={styles.slotLogo}
                  resizeMode="contain"
               />
               <Text style={styles.slotName} numberOfLines={2}>
                  {equipo.nombre_equipo}
               </Text>
            </>
         ) : (
            <View style={styles.slotEmptyContainer}>
               <Ionicons name="add" size={26} color="#1f6fa7" />
               <Text style={styles.slotEmptyText}>{etiqueta}</Text>
            </View>
         )}
      </TouchableOpacity>
   );

   const renderEstadoResultado = () => {
      if (cargandoPartidos) {
         return (
            <View style={styles.loadingState}>
               <ActivityIndicator size="small" color="#1f6fa7" />
               <Text style={styles.loadingText}>Cargando enfrentamientos...</Text>
            </View>
         );
      }

      if (errorPartidos) {
         return (
            <View style={styles.emptyState}>
               <Ionicons name="alert-circle-outline" size={34} color="#5f7f9b" />
               <Text style={styles.emptyStateText}>{errorPartidos}</Text>
            </View>
         );
      }

      if (!ambosEquiposSeleccionados) {
         return (
            <View style={styles.emptyState}>
               <Ionicons name="git-compare-outline" size={34} color="#5f7f9b" />
               <Text style={styles.emptyStateText}>
                  Selecciona dos equipos para ver el historial
               </Text>
            </View>
         );
      }

      if (partidos.length === 0) {
         return (
            <View style={styles.emptyState}>
               <Ionicons name="calendar-clear-outline" size={34} color="#5f7f9b" />
               <Text style={styles.emptyStateText}>No hay partidos entre estos equipos</Text>
            </View>
         );
      }

      return null;
   };

   const estadoResultado = renderEstadoResultado();

   return (
      <KeyboardAvoidingView
         style={styles.container}
         behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
         <CustomHeader
            title="Partidos"
            onMenuPress={() => navigation.openDrawer()}
            onSearchPress={() => Alert.alert('Función de búsqueda no implementada')}
         />

         <FlatList
            data={partidos}
            keyExtractor={(item) => String(item.id_partido)}
            contentContainerStyle={styles.screenContent}
            ListHeaderComponent={
               <View>
                  <View style={styles.sectionContainer}>
                     <Text style={styles.sectionTitle}>Comparar equipos</Text>

                     <View style={styles.comparisonRow}>
                        {renderSlotEquipo(equipo1, () => abrirSelector(1), 'Equipo local')}
                        <Text style={styles.vsTitle}>VS</Text>
                        {renderSlotEquipo(equipo2, () => abrirSelector(2), 'Equipo visitante')}
                     </View>

                     <View style={styles.actionsRow}>
                        <TouchableOpacity
                           style={[
                              styles.actionButton,
                              (!ambosEquiposSeleccionados || cargandoPartidos) && styles.actionButtonDisabled,
                           ]}
                           onPress={cargarPartidosH2H}
                           disabled={!ambosEquiposSeleccionados || cargandoPartidos}
                           activeOpacity={0.85}
                        >
                           <Text style={styles.actionButtonText}>Comparar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                           style={styles.secondaryButton}
                           onPress={limpiarSeleccion}
                           activeOpacity={0.85}
                        >
                           <Text style={styles.secondaryButtonText}>Limpiar</Text>
                        </TouchableOpacity>
                     </View>
                  </View>

                  <View style={styles.resultsSection}>
                     <Text style={styles.sectionTitle}>Historial de enfrentamientos</Text>
                     {estadoResultado}
                  </View>
               </View>
            }
            renderItem={({ item }) => (
               <TouchableOpacity
                  style={styles.matchCard}
                  onPress={() => irDetallePartido(item.id_partido)}
                  activeOpacity={0.85}
               >
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
                     <Image
                        source={{ uri: item.logo_visitante }}
                        style={styles.teamLogo}
                        resizeMode="contain"
                     />
                     <Text style={styles.teamName} numberOfLines={2}>
                        {item.equipo_visitante}
                     </Text>
                  </View>
               </TouchableOpacity>
            )}
            ListEmptyComponent={null}
            showsVerticalScrollIndicator={false}
         />

         <Modal
            visible={modalEquiposVisible}
            animationType="fade"
            transparent
            onRequestClose={() => setModalEquiposVisible(false)}
         >
            <View style={styles.modalOverlay}>
               <View style={styles.modalCard}>
                  <View style={styles.modalHeader}>
                     <Text style={styles.modalTitle}>Selecciona un equipo</Text>
                     <TouchableOpacity
                        style={styles.closeModalButton}
                        onPress={() => setModalEquiposVisible(false)}
                        activeOpacity={0.85}
                     >
                        <Ionicons name="close" size={18} color="#1f6fa7" />
                     </TouchableOpacity>
                  </View>

                  <TextInput
                     style={styles.searchInput}
                     placeholder="Buscar equipos..."
                     value={textoBusqueda}
                     onChangeText={setTextoBusqueda}
                     autoCapitalize="none"
                  />

                  {cargandoEquipos ? (
                     <View style={styles.loadingState}>
                        <ActivityIndicator size="small" color="#1f6fa7" />
                        <Text style={styles.loadingText}>Cargando equipos...</Text>
                     </View>
                  ) : errorEquipos ? (
                     <View style={styles.emptyState}>
                        <Ionicons name="alert-circle-outline" size={34} color="#5f7f9b" />
                        <Text style={styles.emptyStateText}>{errorEquipos}</Text>
                     </View>
                  ) : (
                     <FlatList
                        data={equiposFiltrados}
                        keyExtractor={(item) => String(item.id_equipo)}
                        style={styles.teamsList}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        renderItem={({ item }) => (
                           <TouchableOpacity
                              style={styles.teamItem}
                              onPress={() => seleccionarEquipo(item)}
                              activeOpacity={0.85}
                           >
                              <Image source={{ uri: item.logo }} style={styles.teamItemLogo} resizeMode="contain" />
                              <Text style={styles.teamItemName}>{item.nombre_equipo}</Text>
                           </TouchableOpacity>
                        )}
                        ListEmptyComponent={
                           <View style={styles.emptyState}>
                              <Ionicons name="search-outline" size={34} color="#5f7f9b" />
                              <Text style={styles.emptyStateText}>No hay equipos que coincidan</Text>
                           </View>
                        }
                     />
                  )}
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
      paddingHorizontal: 16,
      paddingTop: 16,
    paddingBottom: 26,
   },
   sectionContainer: {
      marginBottom: 14,
   },
   sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: '#163f61',
      marginBottom: 12,
   },
   comparisonRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
   },
   teamSlot: {
      width: '42%',
      backgroundColor: '#ffffff',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: '#d9e5f0',
      minHeight: 122,
      paddingHorizontal: 12,
      paddingVertical: 10,
      alignItems: 'center',
      justifyContent: 'center',
   },
   slotLogo: {
      width: 58,
      height: 58,
      marginBottom: 8,
   },
   slotName: {
      textAlign: 'center',
      fontSize: 14,
      fontWeight: '700',
      color: '#1d3850',
   },
   slotEmptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
   },
   slotEmptyText: {
      marginTop: 4,
      fontSize: 13,
      color: '#4a6a83',
      fontWeight: '600',
   },
   vsTitle: {
      width: '16%',
      textAlign: 'center',
      fontSize: 16,
      fontWeight: '800',
      color: '#2b5b84',
   },
   actionsRow: {
      marginTop: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
   },
   actionButton: {
      flex: 1,
      height: 40,
      borderRadius: 10,
      backgroundColor: '#1f6fa7',
      alignItems: 'center',
      justifyContent: 'center',
   },
   actionButtonDisabled: {
      backgroundColor: '#9cb8cd',
   },
   actionButtonText: {
      fontSize: 14,
      fontWeight: '700',
      color: '#ffffff',
   },
   secondaryButton: {
      marginLeft: 10,
      height: 40,
      minWidth: 88,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#c3d6e6',
      backgroundColor: '#ffffff',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 14,
   },
   secondaryButtonText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#2a567b',
   },
   resultsSection: {
      marginTop: 8,
   },
   matchCard: {
      backgroundColor: '#ffffff',
      borderRadius: 14,
      paddingVertical: 14,
      paddingHorizontal: 12,
      marginBottom: 10,
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
      width: 42,
      height: 42,
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
      fontSize: 22,
      fontWeight: '800',
      color: '#103a5d',
      marginBottom: 6,
   },
   metaText: {
      fontSize: 12,
      color: '#59778f',
      fontWeight: '600',
      textAlign: 'center',
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
      textAlign: 'center',
      paddingHorizontal: 16,
   },
   modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(13, 33, 51, 0.35)',
      justifyContent: 'center',
      paddingHorizontal: 16,
   },
   modalCard: {
      backgroundColor: '#ffffff',
      borderRadius: 14,
      borderWidth: 1,
      borderColor: '#d9e5f0',
      padding: 12,
      maxHeight: '78%',
   },
   modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
      paddingHorizontal: 4,
   },
   modalTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: '#163f61',
   },
   closeModalButton: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: '#e8f1f9',
      alignItems: 'center',
      justifyContent: 'center',
   },
   searchInput: {
      backgroundColor: '#ffffff',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#d9e5f0',
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      color: '#1d3850',
      marginBottom: 12,
   },
   teamsList: {
      minHeight: 200,
   },
   teamItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#ffffff',
      borderWidth: 1,
      borderColor: '#d9e5f0',
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 12,
      marginBottom: 8,
   },
   teamItemLogo: {
      width: 28,
      height: 28,
      marginRight: 10,
   },
   teamItemName: {
      flex: 1,
      fontSize: 14,
      fontWeight: '600',
      color: '#1d3850',
   },
});