import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StatusBar, View } from 'react-native';
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
import SimulacionTemporadaScreen from './src/screens/SimulacionTemporadaScreen';
import AnalisisIAScreen from './src/screens/AnalisisIAScreen';
import AjustesScreen from './src/screens/AjustesScreen';
import DetalleEquipoScreen from './src/screens/DetalleEquipoScreen';
import DetalleJugadorScreen from './src/screens/DetalleJugadorScreen';  
import DetallePartidoScreen from './src/screens/DetallePartidoScreen';
import DetalleTemporadaScreen from './src/screens/DetalleTemporadaScreen';
import PerfilScreen from './src/screens/PerfilScreen';
import EditPerfilScreen from './src/screens/EditPerfilScreen';
import CambiarContrasenaScreen from './src/screens/CambiarContraseñaScreen';
import CustomDrawer from './src/components/menu';
import AgenteDeOro from './src/components/agente/AgenteDeOro';
import { FavoritosProvider } from './src/context/FavoritosContext';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();
const SESSION_KEY = '@tfg/session';
const AGENTE_ROUTES_PERMITIDAS = new Set([
  'Inicio',
  'Temporadas',
  'DetalleTemporada',
  'Equipos',
  'DetalleEquipo',
  'Jugadores',
  'DetalleJugador',
  'Partidos',
  'DetallePartido',
  'SimulacionTemporada',
  'AnalisisIA',
]);

const obtenerRutaActiva = (state) => {
  if (!state || !state.routes || state.index == null) {
    return null;
  }

  const route = state.routes[state.index];

  if (!route) {
    return null;
  }

  if (route.state) {
    return obtenerRutaActiva(route.state);
  }

  return route.name;
};

// 1. Definimos el Menú Lateral primero
function DrawerNavigator() {
  const { colors } = useTheme();

  return (
    <Drawer.Navigator 
      drawerContent={(props) => <CustomDrawer {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: { backgroundColor: colors.background },
        sceneStyle: { backgroundColor: colors.background },
      }} // Usamos tu CustomHeader
    >
      <Drawer.Screen name="Inicio" component={InicioScreen} />
      <Drawer.Screen name="AnalisisIA" component={AnalisisIAScreen} />
      <Drawer.Screen name="Temporadas" component={TemporadaScreen} />
      <Drawer.Screen name="DetalleTemporada" component={DetalleTemporadaScreen} />
      <Drawer.Screen name="Equipos" component={EquiposScreen} />
      <Drawer.Screen name="DetalleEquipo" component={DetalleEquipoScreen} />
      <Drawer.Screen name="Jugadores" component={JugadoresScreen} />
      <Drawer.Screen name="DetalleJugador" component={DetalleJugadorScreen} />
      <Drawer.Screen name="Partidos" component={PartidosScreen} />
      <Drawer.Screen name="DetallePartido" component={DetallePartidoScreen} />
      <Drawer.Screen name="SimulacionTemporada" component={SimulacionTemporadaScreen} />
      <Drawer.Screen name="Ajustes" component={AjustesScreen} />
      <Drawer.Screen name="Perfil" component={PerfilScreen} />
      <Drawer.Screen name="EditPerfil" component={EditPerfilScreen} />
      <Drawer.Screen name="CambiarContraseña" component={CambiarContrasenaScreen} />
    </Drawer.Navigator>
  );
}

// 2. Navegador Principal (Stack)
function AppContent() {
  const { colors, isDark, isThemeReady, navigationTheme } = useTheme();
  const [cargandoSesion, setCargandoSesion] = useState(true);
  const [haySesion, setHaySesion] = useState(false);
  const navigationRef = useRef(null);
  const [rutaActiva, setRutaActiva] = useState(null);

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

  if (!isThemeReady || cargandoSesion) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.background,
        }}
      >
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor={colors.surface}
        />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const agenteVisible = AGENTE_ROUTES_PERMITIDAS.has(rutaActiva);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.surface}
      />
      <FavoritosProvider>
        <NavigationContainer
          theme={navigationTheme}
          ref={navigationRef}
          onReady={() => {
            setRutaActiva(obtenerRutaActiva(navigationRef.current?.getRootState()));
          }}
          onStateChange={() => {
            setRutaActiva(obtenerRutaActiva(navigationRef.current?.getRootState()));
          }}
        >
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
          <AgenteDeOro visible={agenteVisible} />
        </NavigationContainer>
      </FavoritosProvider>
    </GestureHandlerRootView>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
