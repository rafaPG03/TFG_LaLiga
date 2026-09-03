import React, {useState} from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, KeyboardAvoidingView, Platform, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Viene con Expo
import { useTheme } from '../theme/ThemeContext';

const mostrarAlerta = (titulo, mensaje, onConfirm) => {
  if (Platform.OS === 'web') {
    if (typeof globalThis.alert === 'function') {
      globalThis.alert(`${titulo}\n\n${mensaje}`);
    }
    onConfirm?.();
    return;
  }

  Alert.alert(
    titulo,
    mensaje,
    onConfirm ? [{ text: 'OK', onPress: onConfirm }] : [{ text: 'OK' }],
  );
};

export default function RegistroScreen({ navigation }) {
    const { colors } = useTheme();
    // Estados para guardar lo que escribe el usuario
    const [usuario, setUsuario] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [Confpassword, setConfPassword] = useState('');
    const [mostrarPassword, setMostrarPassword] = useState(false); // Nuevo estado

    const volverAlLogin = () => {
      if (navigation.canGoBack()) {
        navigation.goBack();
        return;
      }

      navigation.replace('Login');
    };

    const handleRegistro = async () => {
      const regexPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

      console.log("Intentando conectar a:", process.env.EXPO_PUBLIC_API_URL);
      // 1. Validaciones básicas en el cliente
      if (!usuario || !email || !password || !Confpassword) {
        mostrarAlerta("Error", "Por favor, rellena todos los campos.");
        return;
      }


      if (!regexPassword.test(password)) {
        mostrarAlerta(
          "Contraseña débil",
          "La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número."
        );
        return; // Cortamos la ejecución aquí
      }

      // Si pasa la validación, hacemos el fetch...

      if (password !== Confpassword) {
        mostrarAlerta("Error", "Las contraseñas no coinciden.");
        return;
      }

      try {
        // 2. Petición al backend
        const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/usuarios/registro`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            nombre_usuario: usuario,
            email: email,
            password: password, // El backend se encargará de guardarlo en password_hash
          }),
        });

        const data = await response.json();

        if (response.ok) {
          // 3. Éxito
          mostrarAlerta("¡Bienvenido!", "Cuenta creada correctamente.", volverAlLogin);
        } else {
          // 4. Error desde el servidor (ej: email ya registrado)
          mostrarAlerta("Error", data.error || "No se pudo realizar el registro.");
        }
      } catch (error) {
        console.error(error);
        mostrarAlerta("Error de conexión", "Asegúrate de que el servidor esté encendido y en la misma red Wi-Fi.");
      }
    };

  return (
        // KeyboardAvoidingView evita que el teclado tape los inputs en iOS/Android
    <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
    >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
            <View style={styles.logoContainer}>
                <Image 
                // Asegúrate de tener tu logo en esta ruta o cambiarla
                source={require('../assets/logo.png')} 
                style={styles.logo}
                />
            <Text style={styles.title}>Crea tu cuenta para continuar</Text>
            </View>
            <View style={styles.formRegister}>
                {/*Input de nombre de usuario*/}
                <Text style={styles.inputLabel}>Nombre de usuario</Text>
                <View style={styles.inputWrapper}>
                    <TextInput
                        style={styles.input}
                        placeholder="Usuario"
                        placeholderTextColor={colors.textMuted}
                        value ={usuario}
                        onChangeText={setUsuario}
                    />
                </View>
                {/* Input de Email */}
                <Text style={styles.inputLabel}>Correo Electrónico</Text>
                <View style={styles.inputWrapper}>
                <TextInput
                    style={styles.input}
                    placeholder="Correo Electrónico"
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
                {/* Input de Contraseña Confirmada */}
                <Text style={styles.inputLabel}>Confirma la Contraseña</Text>
                <View style={styles.inputWrapper}>
                <TextInput
                    style={styles.input}
                    placeholder="Confirma la contraseña"
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry={!mostrarPassword} // Si mostrar es false, se oculta
                    value={Confpassword}
                    onChangeText={setConfPassword}
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
                            
            </View>
            <View>
            <TouchableOpacity 
                style={styles.button} 
                onPress={handleRegistro}
            >
                <Text style={styles.buttonText}>Registrarse</Text>
            </TouchableOpacity>
            <View style={styles.loginContainer}>
                <Text style={styles.loginText}>¿Ya tienes cuenta? </Text>
                <TouchableOpacity onPress={volverAlLogin}>
                    <Text style={styles.loginLink}>Inicia sesión</Text>
                </TouchableOpacity>
            </View>
            </View>
        </ScrollView>
    </KeyboardAvoidingView>
  );
}

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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginVertical: 20,
  },
  button: {
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
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  loginText: {
    color: '#666',
    fontSize: 14,
  },
  loginLink: {
    color: PRIMARY_BLUE,
    fontSize: 14,
    fontWeight: '700',
  },
    logoContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logo: {
    width: 130, // Tamaño "grande pero no mucho"
    height: 130,
    resizeMode: 'contain', // Asegura que el logo no se deforme
    marginTop: -80,
    marginBottom: 15,
  },
    // Contenedor del Formulario
  formRegister: {
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
});
