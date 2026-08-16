import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomHeader from '../components/header';
import { useAuth } from '../context/AuthContext';

const PRIMARY_BLUE = '#2e86de';
const BACKGROUND_WHITE = '#FFFFFF';
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export default function CambiarContrasenaScreen({ navigation, route }) {
  const { usuarioId: usuarioIdParam } = route.params || {};
  const { sesion, peticionAutenticada } = useAuth();
  const idUsuario = Number(usuarioIdParam || sesion?.id) || null;
  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNueva, setPasswordNueva] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const handleCambiarPassword = async () => {
    if (guardando) {
      return;
    }

    if (!idUsuario) {
      Alert.alert('Error', 'No hay un usuario valido para actualizar.');
      return;
    }

    if (!passwordActual || !passwordNueva || !confirmarPassword) {
      Alert.alert('Error', 'Por favor, rellena todos los campos.');
      return;
    }

    if (!PASSWORD_REGEX.test(passwordNueva)) {
      Alert.alert(
        'Contraseña debil',
        'La nueva contraseña debe tener al menos 8 caracteres, una mayuscula, una minuscula y un numero.'
      );
      return;
    }

    if (passwordNueva !== confirmarPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden.');
      return;
    }

    if (passwordActual === passwordNueva) {
      Alert.alert('Error', 'La nueva contraseña debe ser distinta a la actual.');
      return;
    }

    setGuardando(true);

    try {
      const response = await peticionAutenticada(
        `${process.env.EXPO_PUBLIC_API_URL}/usuarios/${idUsuario}/password`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            password_actual: passwordActual,
            password_nueva: passwordNueva,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'No se pudo cambiar la contraseña');
      }

      Alert.alert('Listo', data?.mensaje || 'Contraseña actualizada correctamente.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Error', error.message || 'No se pudo cambiar la contraseña');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <CustomHeader title="Cambiar contraseña" onMenuPress={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.formContainer}>
          <Text style={styles.title}>Actualiza tu contraseña</Text>

          <Text style={styles.inputLabel}>Contraseña actual</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Contraseña actual"
              placeholderTextColor="#A0A0A0"
              secureTextEntry={!mostrarPassword}
              value={passwordActual}
              onChangeText={setPasswordActual}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setMostrarPassword(!mostrarPassword)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={mostrarPassword ? 'eye-off' : 'eye'}
                size={24}
                color={PRIMARY_BLUE}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.inputLabel}>Nueva contraseña</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Nueva contraseña"
              placeholderTextColor="#A0A0A0"
              secureTextEntry={!mostrarPassword}
              value={passwordNueva}
              onChangeText={setPasswordNueva}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setMostrarPassword(!mostrarPassword)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={mostrarPassword ? 'eye-off' : 'eye'}
                size={24}
                color={PRIMARY_BLUE}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.inputLabel}>Confirmar nueva contraseña</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Confirmar nueva contraseña"
              placeholderTextColor="#A0A0A0"
              secureTextEntry={!mostrarPassword}
              value={confirmarPassword}
              onChangeText={setConfirmarPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setMostrarPassword(!mostrarPassword)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={mostrarPassword ? 'eye-off' : 'eye'}
                size={24}
                color={PRIMARY_BLUE}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, guardando && styles.buttonDisabled]}
            onPress={handleCambiarPassword}
            activeOpacity={0.85}
            disabled={guardando}
          >
            {guardando ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.buttonText}>Guardar contraseña</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND_WHITE,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 30,
    paddingVertical: 30,
  },
  formContainer: {
    width: '100%',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 24,
    textAlign: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    height: '100%',
  },
  eyeIcon: {
    padding: 5,
  },
  button: {
    width: '100%',
    height: 55,
    backgroundColor: PRIMARY_BLUE,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: PRIMARY_BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
