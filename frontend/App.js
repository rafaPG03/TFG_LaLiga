import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Pantallas
import LoginScreen from './src/screens/LoginScreen';
import RegistroScreen from './src/screens/RegistroScreen';
import InicioScreen from './src/screens/InicioScreen';
import TemporadaScreen from './src/screens/TemporadaScreen';
import EquiposScreen from './src/screens/EquiposScreen';
import JugadoresScreen from './src/screens/JugadoresScreen';
import PartidosScreen from './src/screens/PartidosScreen';
import AjustesScreen from './src/screens/AjustesScreen';
import DetalleEquipoScreen from './src/screens/DetalleEquipoScreen';
import DetalleJugadorScreen from './src/screens/DetalleJugadorScreen';  
import DetallePartidoScreen from './src/screens/DetallePartidoScreen';
import PerfilScreen from './src/screens/PerfilScreen';
import CustomDrawer from './src/components/menu';
import { FavoritosProvider } from './src/context/FavoritosContext';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();
const SESSION_KEY = '@tfg/session';

// 1. Definimos el Menú Lateral primero
function DrawerNavigator() {
  return (
    <Drawer.Navigator 
      drawerContent={(props) => <CustomDrawer {...props} />}
      screenOptions={{ headerShown: false }} // Usamos tu CustomHeader
    >
      <Drawer.Screen name="Inicio" component={InicioScreen} />
      <Drawer.Screen name="Temporadas" component={TemporadaScreen} />
      <Drawer.Screen name="Equipos" component={EquiposScreen} />
      <Drawer.Screen name="DetalleEquipo" component={DetalleEquipoScreen} />
      <Drawer.Screen name="Jugadores" component={JugadoresScreen} />
      <Drawer.Screen name="DetalleJugador" component={DetalleJugadorScreen} />
      <Drawer.Screen name="Partidos" component={PartidosScreen} />
      <Drawer.Screen name="DetallePartido" component={DetallePartidoScreen} />
      <Drawer.Screen name="Ajustes" component={AjustesScreen} />
      <Drawer.Screen name="Perfil" component={PerfilScreen} />
    </Drawer.Navigator>
  );
}

// 2. Navegador Principal (Stack)
export default function App() {
  const [cargandoSesion, setCargandoSesion] = useState(true);
  const [haySesion, setHaySesion] = useState(false);

  useEffect(() => {
    const restaurarSesion = async () => {
      try {
        const sesionGuardada = await AsyncStorage.getItem(SESSION_KEY);
        setHaySesion(Boolean(sesionGuardada));
      } catch (error) {
        setHaySesion(false);
      } finally {
        setCargandoSesion(false);
      }
    };

    restaurarSesion();
  }, []);

  if (cargandoSesion) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#1f6fa7" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <FavoritosProvider>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName={haySesion ? 'MainApp' : 'Login'}
            screenOptions={{ headerShown: false }}
          >
            
            {/* Pantallas de acceso (Sin Menú Lateral) */}
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Registro" component={RegistroScreen} />

            {/* Pantalla Principal (QUE CONTIENE EL DRAWER) */}
            <Stack.Screen name="MainApp" component={DrawerNavigator} />
            
          </Stack.Navigator>
        </NavigationContainer>
      </FavoritosProvider>
    </GestureHandlerRootView>
  );
}