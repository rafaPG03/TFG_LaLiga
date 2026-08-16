import React, { useEffect, useState } from 'react';
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
import CustomHeader from '../components/header';
import { useAuth } from '../context/AuthContext';

export default function EditPerfilScreen({ navigation, route }) {
	const { usuarioId: usuarioIdParam, usuario: usuarioParam } = route.params || {};
	const { sesion, actualizarSesion, peticionAutenticada } = useAuth();
	const [idUsuario] = useState(usuarioIdParam || sesion?.id || null);
	const [nombreUsuario, setNombreUsuario] = useState(
		usuarioParam?.nombre_usuario || usuarioParam?.nombre || sesion?.nombre || ''
	);
	const [email, setEmail] = useState(usuarioParam?.email || sesion?.email || '');
	const [cargando, setCargando] = useState(false);
	const [guardando, setGuardando] = useState(false);

	useEffect(() => {
		if (!idUsuario || nombreUsuario || email) {
			return;
		}

		const cargarUsuario = async () => {
			setCargando(true);
			try {
				const response = await peticionAutenticada(
					`${process.env.EXPO_PUBLIC_API_URL}/usuarios/${idUsuario}`
				);

				if (!response.ok) {
					throw new Error('No se pudo cargar el perfil');
				}

				const data = await response.json();
				setNombreUsuario(data?.nombre_usuario || '');
				setEmail(data?.email || '');
			} catch (error) {
				Alert.alert('Error', error.message || 'No se pudo cargar el perfil');
			} finally {
				setCargando(false);
			}
		};

		cargarUsuario();
	}, [idUsuario, nombreUsuario, email, peticionAutenticada]);

	const handleGuardar = async () => {
		if (guardando) {
			return;
		}

		if (!idUsuario) {
			Alert.alert('Error', 'No hay un usuario valido para actualizar.');
			return;
		}

		if (!nombreUsuario.trim() || !email.trim()) {
			Alert.alert('Error', 'Completa el nombre de usuario y el email.');
			return;
		}

		setGuardando(true);

		try {
			const response = await peticionAutenticada(
				`${process.env.EXPO_PUBLIC_API_URL}/usuarios/${idUsuario}`,
				{
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						nombre_usuario: nombreUsuario.trim(),
						email: email.trim(),
					}),
				}
			);

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data?.error || 'No se pudo actualizar el perfil');
			}

			await actualizarSesion(data);

			Alert.alert('Listo', 'Perfil actualizado correctamente.');
			navigation.goBack();
		} catch (error) {
			Alert.alert('Error', error.message || 'No se pudo actualizar el perfil');
		} finally {
			setGuardando(false);
		}
	};

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
			style={styles.container}
		>
			<CustomHeader
				title="Editar perfil"
				onMenuPress={() => navigation.goBack()}
			/>
			<ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
				<View style={styles.formContainer}>
					<Text style={styles.title}>Actualiza tus datos</Text>

					<Text style={styles.inputLabel}>Nombre de usuario</Text>
					<View style={styles.inputWrapper}>
						<TextInput
							style={styles.input}
							placeholder="Nombre de usuario"
							placeholderTextColor="#A0A0A0"
							value={nombreUsuario}
							onChangeText={setNombreUsuario}
							autoCapitalize="none"
						/>
					</View>

					<Text style={styles.inputLabel}>Correo Electronico</Text>
					<View style={styles.inputWrapper}>
						<TextInput
							style={styles.input}
							placeholder="Correo Electronico"
							placeholderTextColor="#A0A0A0"
							keyboardType="email-address"
							autoCapitalize="none"
							value={email}
							onChangeText={setEmail}
						/>
					</View>

					<TouchableOpacity
						style={[styles.button, guardando && styles.buttonDisabled]}
						onPress={handleGuardar}
						activeOpacity={0.85}
						disabled={guardando}
					>
						{guardando ? (
							<ActivityIndicator size="small" color="#ffffff" />
						) : (
							<Text style={styles.buttonText}>Guardar cambios</Text>
						)}
					</TouchableOpacity>

					{cargando && (
						<View style={styles.loadingRow}>
							<ActivityIndicator size="small" color={PRIMARY_BLUE} />
							<Text style={styles.loadingText}>Cargando datos...</Text>
						</View>
					)}
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}

const PRIMARY_BLUE = '#2e86de';
const BACKGROUND_WHITE = '#FFFFFF';

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
	title: {
		fontSize: 22,
		fontWeight: 'bold',
		color: '#333',
		marginBottom: 24,
		textAlign: 'center',
	},
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
	loadingRow: {
		marginTop: 16,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
	},
	loadingText: {
		marginLeft: 10,
		color: '#666',
		fontSize: 14,
	},
});
