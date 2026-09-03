import React, { useRef, useState } from 'react';
import { ActivityIndicator, StatusBar, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
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
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

const withThemeSubscription = (ScreenComponent) => {
  function ThemeSubscribedScreen(props) {
    const { isDark } = useTheme();

    return (
      <ScreenComponent
        {...props}
        themeMode={isDark ? 'dark' : 'light'}
      />
    );
  }

  ThemeSubscribedScreen.displayName = `ThemeSubscribed(${ScreenComponent.displayName || ScreenComponent.name || 'Screen'})`;
  return ThemeSubscribedScreen;
};

const ThemedLoginScreen = withThemeSubscription(LoginScreen);
const ThemedRegistroScreen = withThemeSubscription(RegistroScreen);
const ThemedInicioScreen = withThemeSubscription(InicioScreen);
const ThemedAnalisisIAScreen = withThemeSubscription(AnalisisIAScreen);
const ThemedTemporadaScreen = withThemeSubscription(TemporadaScreen);
const ThemedDetalleTemporadaScreen = withThemeSubscription(DetalleTemporadaScreen);
const ThemedEquiposScreen = withThemeSubscription(EquiposScreen);
const ThemedDetalleEquipoScreen = withThemeSubscription(DetalleEquipoScreen);
const ThemedJugadoresScreen = withThemeSubscription(JugadoresScreen);
const ThemedDetalleJugadorScreen = withThemeSubscription(DetalleJugadorScreen);
const ThemedPartidosScreen = withThemeSubscription(PartidosScreen);
const ThemedDetallePartidoScreen = withThemeSubscription(DetallePartidoScreen);
const ThemedSimulacionTemporadaScreen = withThemeSubscription(SimulacionTemporadaScreen);
const ThemedAjustesScreen = withThemeSubscription(AjustesScreen);
const ThemedPerfilScreen = withThemeSubscription(PerfilScreen);
const ThemedEditPerfilScreen = withThemeSubscription(EditPerfilScreen);
const ThemedCambiarContrasenaScreen = withThemeSubscription(CambiarContrasenaScreen);

const AGENTE_ROUTES_OCULTAS = new Set([
  'Login',
  'Registro',
  'Ajustes',
  'Perfil',
  'EditPerfil',
  'CambiarContraseña',
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
      <Drawer.Screen name="Inicio" component={ThemedInicioScreen} />
      <Drawer.Screen name="AnalisisIA" component={ThemedAnalisisIAScreen} />
      <Drawer.Screen name="Temporadas" component={ThemedTemporadaScreen} />
      <Drawer.Screen name="DetalleTemporada" component={ThemedDetalleTemporadaScreen} />
      <Drawer.Screen name="Equipos" component={ThemedEquiposScreen} />
      <Drawer.Screen name="DetalleEquipo" component={ThemedDetalleEquipoScreen} />
      <Drawer.Screen name="Jugadores" component={ThemedJugadoresScreen} />
      <Drawer.Screen name="DetalleJugador" component={ThemedDetalleJugadorScreen} />
      <Drawer.Screen name="Partidos" component={ThemedPartidosScreen} />
      <Drawer.Screen name="DetallePartido" component={ThemedDetallePartidoScreen} />
      <Drawer.Screen name="SimulacionTemporada" component={ThemedSimulacionTemporadaScreen} />
      <Drawer.Screen name="Ajustes" component={ThemedAjustesScreen} />
      <Drawer.Screen name="Perfil" component={ThemedPerfilScreen} />
      <Drawer.Screen name="EditPerfil" component={ThemedEditPerfilScreen} />
      <Drawer.Screen name="CambiarContraseña" component={ThemedCambiarContrasenaScreen} />
    </Drawer.Navigator>
  );
}

// 2. Navegador Principal (Stack)
function AppContent() {
  const { colors, isDark, isThemeReady, navigationTheme } = useTheme();
  const { sesion, cargandoSesion } = useAuth();
  const navigationRef = useRef(null);
  const [rutaActiva, setRutaActiva] = useState(null);

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

  const agenteVisible = Boolean(sesion && rutaActiva)
    && !AGENTE_ROUTES_OCULTAS.has(rutaActiva);

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
            screenOptions={{ headerShown: false }}
          >
            
            {/* Pantallas de acceso (Sin Menú Lateral) */}
            {!sesion && <Stack.Screen name="Login" component={ThemedLoginScreen} />}
            {!sesion && <Stack.Screen name="Registro" component={ThemedRegistroScreen} />}

            {/* Pantalla Principal (QUE CONTIENE EL DRAWER) */}
            {sesion && <Stack.Screen name="MainApp" component={DrawerNavigator} />}
            
          </Stack.Navigator>
          <AgenteDeOro
            visible={agenteVisible}
            resetConversation={rutaActiva === 'Login'}
          />
        </NavigationContainer>
      </FavoritosProvider>
    </GestureHandlerRootView>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
