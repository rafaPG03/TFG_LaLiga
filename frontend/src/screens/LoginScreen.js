import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Viene con Expo
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFavoritos } from '../context/FavoritosContext';
import { useTheme } from '../theme/ThemeContext';

const SESSION_KEY = '@tfg/session';

export default function LoginScreen({ navigation }) { // <--- Añade esto aquí
  const { refreshSession } = useFavoritos();
  const { colors, isDark } = useTheme();
  // Estados para guardar lo que escribe el usuario
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false); // Nuevo estado

  const handleLogin = async () => {
    if(email.trim() === '' || password.trim() === '') {
      Alert.alert('Error', 'Por favor, completa todos los campos');
      return;
    }
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/usuarios/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data?.usuario) {
          await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(data.usuario));
          await refreshSession();
        }

        navigation.reset({
          index: 0,
          routes: [{ name: 'MainApp' }],
        });
      } else {
        Alert.alert("Error", data.error || "Datos incorrectos");
      }
      } catch (error) {
        Alert.alert("Error", "No se pudo conectar con el servidor");
      }
  };

  return (
    // KeyboardAvoidingView evita que el teclado tape los inputs en iOS/Android
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.surface}
      />
      
      {/* ScrollView permite hacer scroll si la pantalla es pequeña */}
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        
        {/* --- SECCIÓN SUPERIOR: LOGO --- */}
        <View style={styles.logoContainer}>
          <Image 
            // Asegúrate de tener tu logo en esta ruta o cambiarla
            source={require('../assets/logo.png')} 
            style={styles.logo}
          />
          <Text style={styles.brandText}>MoneyBall <Text style={styles.brandLaLiga}>LaLiga</Text></Text>
          <Text style={styles.welcomeText}>Identifícate para ver las estadísticas ⚽</Text>
        </View>

        {/* --- SECCIÓN MEDIA: FORMULARIO --- */}
        <View style={styles.formContainer}>
          
          {/* Input de Email */}
          <Text style={styles.inputLabel}>Nombre de usuario o Correo Electrónico</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Introduce tu nombre de usuario o correo electrónico"
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none" // Importante para emails
              value={email}
              onChangeText={setEmail}
            />
          </View>

          {/* Input de Contraseña */}
          <Text style={styles.inputLabel}>Contraseña</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!mostrarPassword} // Si mostrar es false, se oculta
              value={password}
              onChangeText={setPassword}
            />
            
            {/* Botón del ojo */}
            <TouchableOpacity 
              style={styles.eyeIcon} 
              onPress={() => setMostrarPassword(!mostrarPassword)}
            >
              <Ionicons 
                name={mostrarPassword ? "eye-off" : "eye"} 
                size={24} 
                color={colors.primaryBright}
              />
            </TouchableOpacity>
          </View>
          {/* --- SECCIÓN INFERIOR: BOTONES --- */}
          {/* Botón Principal de Iniciar Sesión */}
          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
          </TouchableOpacity>

          {/* Enlace para registrarse */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>¿No tienes cuenta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Registro')}>
              <Text style={styles.registerLink}>Regístrate aquí</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// --- ESTILOS ---
const PRIMARY_BLUE = '#2e86de'; // El azul que ya usabas, un toque vibrante
const BACKGROUND_WHITE = '#FFFFFF';

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: BACKGROUND_WHITE,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center', // Centra el contenido verticalmente si hay espacio
    paddingHorizontal: 30,
    paddingVertical: 50,
  },
  // Contenedor del Logo
  logoContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logo: {
    width: 130, // Tamaño "grande pero no mucho"
    height: 130,
    resizeMode: 'contain', // Asegura que el logo no se deforme
    marginBottom: 15,
  },
  brandText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  brandLaLiga: {
    color: PRIMARY_BLUE, // Toque azul en el nombre
  },
  welcomeText: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  // Contenedor del Formulario
  formContainer: {
    width: '100%',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    width: '100%',
    height: 55,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 20,
    flexDirection: 'row', // Alinea input y ojo de forma horizontal
    alignItems: 'center', // Centra verticalmente el contenido
    paddingHorizontal: 15,
  },
  input: {
    flex: 1, // El input ocupa todo el espacio sobrante
    fontSize: 16,
    color: '#000',
    height: '100%',
  },
  eyeIcon: {
    padding: 5, // Área táctil más cómoda
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 30,
    marginTop: -10, // Acerca el texto al input
  },
  forgotPasswordText: {
    color: PRIMARY_BLUE,
    fontSize: 14,
    fontWeight: '500',
  },
  // Botón de Login
  loginButton: {
    width: '100%',
    height: 55,
    backgroundColor: PRIMARY_BLUE, // Fondo totalmente azul
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    // Sombra para el botón
    elevation: 4,
    shadowColor: PRIMARY_BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Registro
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 25,
  },
  registerText: {
    fontSize: 15,
    color: '#666',
  },
  registerLink: {
    fontSize: 15,
    color: PRIMARY_BLUE,
    fontWeight: 'bold',
  },
});
