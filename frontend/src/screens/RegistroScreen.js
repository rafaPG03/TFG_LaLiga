import React, {useState} from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, KeyboardAvoidingView, Platform, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Viene con Expo

export default function RegistroScreen({ navigation }) {
    // Estados para guardar lo que escribe el usuario
    const [usuario, setUsuario] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [Confpassword, setConfPassword] = useState('');
    const [mostrarPassword, setMostrarPassword] = useState(false); // Nuevo estado

    const handleRegistro = async () => {
      console.log("Intentando conectar a:", process.env.EXPO_PUBLIC_API_URL);
      // 1. Validaciones básicas en el cliente
      if (!usuario || !email || !password || !Confpassword) {
        Alert.alert("Error", "Por favor, rellena todos los campos.");
        return;
      }

      if (password !== Confpassword) {
        Alert.alert("Error", "Las contraseñas no coinciden.");
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
          Alert.alert("¡Bienvenido!", "Cuenta creada correctamente.", [
            { text: "OK", onPress: () => navigation.goBack() } 
          ]);
        } else {
          // 4. Error desde el servidor (ej: email ya registrado)
          Alert.alert("Error", data.error || "No se pudo realizar el registro.");
        }
      } catch (error) {
        console.error(error);
        Alert.alert("Error de conexión", "Asegúrate de que el servidor esté encendido y en la misma red Wi-Fi.");
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
                        placeholderTextColor="#A0A0A0"
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
                    placeholderTextColor="#A0A0A0"
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
                    placeholderTextColor="#A0A0A0"
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
                    color="#2e86de" 
                    />
                </TouchableOpacity>
                </View>
                {/* Input de Contraseña Confirmada */}
                <Text style={styles.inputLabel}>Confirma la Contraseña</Text>
                <View style={styles.inputWrapper}>
                <TextInput
                    style={styles.input}
                    placeholder="Confirma la contraseña"
                    placeholderTextColor="#A0A0A0"
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
                    color="#2e86de" 
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