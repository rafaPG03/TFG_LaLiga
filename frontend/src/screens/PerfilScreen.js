import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CommonActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import CustomHeader from '../components/header';
import { useFavoritos } from '../context/FavoritosContext';

const SESSION_KEY = '@tfg/session';

export default function PerfilScreen({navigation, route}) {
   const { usuarioId } = route.params || {};
   const { refreshSession } = useFavoritos();
   const [usuario, setUsuario] = useState(null);
   const [cargando, setCargando] = useState(false);
   const [errorCarga, setErrorCarga] = useState('');
   const [cerrandoSesion, setCerrandoSesion] = useState(false);

   useEffect(() => {
      if (!usuarioId) {
         setErrorCarga('No se proporcionó un ID de usuario');
         return;
      }
      let pantallaActiva = true;
      const cargarUsuario = async () => {
         setCargando(true);
         setErrorCarga('');
         try {
            const response = await fetch(
               `${process.env.EXPO_PUBLIC_API_URL}/usuarios/${usuarioId}`
            );
            if (!response.ok) {
               throw new Error('No se pudo cargar la información del usuario');
            }
            const data = await response.json();
            if (pantallaActiva) {
               setUsuario(data);
            }
         } catch (error) {
            if (pantallaActiva) {
               setErrorCarga(error.message);
            }
         } finally {
            if (pantallaActiva) {
               setCargando(false);
            }
         }
      };
      cargarUsuario();  
      return () => {
         pantallaActiva = false;
      };
   }, [usuarioId]);

   const cerrarSesion = async () => {
      if (cerrandoSesion) {
         return;
      }

      setCerrandoSesion(true);

      try {
         const rawSesion = await AsyncStorage.getItem(SESSION_KEY);
         const sesion = rawSesion ? JSON.parse(rawSesion) : null;
         const idSesion = Number(sesion?.id) || null;

         if (!rawSesion && !usuarioId) {
            Alert.alert('Aviso', 'No hay una sesion activa que cerrar.');
         }

         try {
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/auth/logout`, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ id_usuario: idSesion || usuarioId || null }),
            });

            if (!response.ok) {
               throw new Error('Logout no disponible');
            }
         } catch (error) {
            Alert.alert('Aviso', 'No se pudo cerrar sesion en el servidor.');
         }

         await AsyncStorage.removeItem(SESSION_KEY);
         await refreshSession();

         navigation.dispatch(
            CommonActions.reset({
               index: 0,
               routes: [{ name: 'Login' }],
            })
         );
      } catch (error) {
         Alert.alert('Error', 'No se pudo cerrar sesion. Intentalo otra vez.');
      } finally {
         setCerrandoSesion(false);
      }
   };

   return (
      <KeyboardAvoidingView
         style={styles.container}
         behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
         <CustomHeader
         title="Perfil"
         onMenuPress={() => navigation.openDrawer()}
         onSearchPress={() => Alert.alert('Función de búsqueda no implementada')}
         />
         <ScrollView contentContainerStyle={styles.screenContent}>
            <View style={styles.datosContainer}>
					<MaterialCommunityIcons
						name="account-circle"
						size={74}
						color="#1f6fa7"
						style={styles.avatar}
					/>
					<Text style={styles.nombreUsuario}>{usuario?.nombre_usuario}</Text>
					<Text style={styles.emailUsuario}>{usuario?.email}</Text>
            </View>
            <View style={styles.opcionesContainer}>
               <TouchableOpacity
                  style={styles.opcionItem}
                  activeOpacity={0.8}
                  onPress={() =>
                     navigation.navigate('EditPerfil', {
                        usuarioId,
                        usuario,
                     })
                  }
               >
                  <Ionicons name="pencil-outline" size={20} color="#1f6fa7" />
                  <Text style={styles.opcionTexto}>Editar perfil</Text>
               </TouchableOpacity>
               <TouchableOpacity
                  style={styles.opcionItem}
                  activeOpacity={0.8}
                  onPress={() =>
                     navigation.navigate('CambiarContraseña', {
                        usuarioId,
                     })
                  }
               >
                  <Ionicons name="shield-outline" size={20} color="#1f6fa7" />
                  <Text style={styles.opcionTexto}>Cambiar contraseña</Text>
               </TouchableOpacity>
               <TouchableOpacity
                  style={[styles.opcionItem, cerrandoSesion && styles.opcionItemDisabled]}
                  activeOpacity={0.8}
                  onPress={cerrarSesion}
                  disabled={cerrandoSesion}
               >
                  {cerrandoSesion ? (
                     <ActivityIndicator size="small" color="#1f6fa7" />
                  ) : (
                     <Ionicons name="log-out-outline" size={20} color="#1f6fa7" />
                  )}
                  <Text style={styles.opcionTexto}>
                     {cerrandoSesion ? 'Cerrando sesion...' : 'Cerrar sesion'}
                  </Text> 
               </TouchableOpacity>
            </View>
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
  },
datosContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 30,
      marginBottom: 20,
      backgroundColor: '#ffffff', 
      paddingVertical: 30,       
      paddingHorizontal: 20,
      borderRadius: 20,           
      marginHorizontal: 25,     
      elevation: 3, 
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
   },
   avatar: {
      backgroundColor: '#f4f8fc', 
      padding: 15,
      borderRadius: 60,          
      marginBottom: 10,
      borderWidth: 2,
      borderColor: '#d9e5f0',    
   },
   nombreUsuario: {
      fontSize: 24,              
      fontWeight: 'bold',
      color: '#133d60',
      textAlign: 'center',
   },
   emailUsuario: {
      fontSize: 15,
      color: '#57758f',           
      marginTop: 4,
      textAlign: 'center',
      letterSpacing: 0.5,
   },
   opcionesContainer: {
      marginHorizontal: 25,
      backgroundColor: '#ffffff',
      borderRadius: 20,
      paddingVertical: 25,
      paddingHorizontal: 15,
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
   },
   opcionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 25,
      paddingHorizontal: 10,
      borderRadius: 12,
      marginBottom: 20,
      backgroundColor: '#f4f8fc',
      borderWidth: 3,
      borderColor: '#d9e5f0',
   },
   opcionItemDisabled: {
      opacity: 0.7,
   },
   opcionTexto: {
      marginLeft: 12,
      fontSize: 16,
      color: '#133d60',
   },

});
