import React, { useEffect, useState } from 'react';
import {
	Alert,
	Image,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { CommonActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const SESSION_KEY = '@tfg/session';

const MENU_OPTIONS = [
	{ label: 'Inicio', route: 'Inicio', icon: 'home-outline' },
	{ label: 'Temporadas', route: 'Temporadas', icon: 'calendar-outline' },
	{ label: 'Equipos', route: 'Equipos', icon: 'shield-outline' },
	{ label: 'Jugadores', route: 'Jugadores', icon: 'people-outline' },
	{ label: 'Partidos', route: 'Partidos', icon: 'football-outline' },
];

export default function CustomDrawer(props) {
	const [nombreUsuario, setNombreUsuario] = useState('Usuario');
	const [idUsuario, setIdUsuario] = useState(null);

	useEffect(() => {
		const cargarSesion = async () => {
			try {
				const rawSesion = await AsyncStorage.getItem(SESSION_KEY);

				if (!rawSesion) {
					return;
				}

				const sesion = JSON.parse(rawSesion);
				if (sesion?.nombre) {
					setNombreUsuario(sesion.nombre);
				}
				if (sesion?.id) {
					setIdUsuario(sesion.id);
				}
			} catch (error) {
				console.log('No se pudo leer la sesion guardada');
			}
		};

		cargarSesion();
	}, [props.state?.index]);

const irAPantalla = (route) => {
    if (route === 'Perfil') {
        // Pasamos el objeto de sesión completo o solo el ID
        props.navigation.navigate(route, { usuarioId: idUsuario });
    } else {
        props.navigation.navigate(route);
    }
};

	const cerrarSesion = async () => {
		try {
			await AsyncStorage.removeItem(SESSION_KEY);

			const parentNavigation = props.navigation.getParent();
			if (parentNavigation) {
				parentNavigation.dispatch(
					CommonActions.reset({
						index: 0,
						routes: [{ name: 'Login' }],
					})
				);
			}
		} catch (error) {
			Alert.alert('Error', 'No se pudo cerrar sesion. Intentalo otra vez.');
		}
	};

	return (
		<DrawerContentScrollView
			{...props}
			contentContainerStyle={styles.drawerContainer}
			showsVerticalScrollIndicator={false}
		>
			<View>
				<TouchableOpacity
					style={styles.profileSection}
					activeOpacity={0.8}
					onPress={() => irAPantalla('Perfil')}
				>
					<MaterialCommunityIcons
						name="account-circle"
						size={74}
						color="#1f6fa7"
						style={styles.avatar}
					/>
					<Text style={styles.profileName}>{nombreUsuario}</Text>
					<Text style={styles.profileSubtitle}>Bienvenido de nuevo</Text>
				</TouchableOpacity>
				<View style={styles.optionsSection}>
					<Text style={styles.blockTitle}>Opciones</Text>

					{MENU_OPTIONS.map((item) => {
						const focused = props.state?.routeNames?.[props.state.index] === item.route;

						return (
							<TouchableOpacity
								key={item.route}
								style={[styles.menuItem, focused && styles.menuItemActive]}
								onPress={() => irAPantalla(item.route)}
								activeOpacity={0.8}
							>
								<Ionicons
									name={item.icon}
									size={20}
									color={focused ? '#0f4f7e' : '#57758f'}
								/>
								<Text style={[styles.menuItemText, focused && styles.menuItemTextActive]}>
									{item.label}
								</Text>
							</TouchableOpacity>
						);
					})}
				</View>
			</View>

			<View style={styles.bottomSection}>
				<TouchableOpacity
					style={styles.secondaryAction}
					onPress={() => irAPantalla('Ajustes')}
					activeOpacity={0.8}
				>
					<Ionicons name="settings-outline" size={19} color="#35566f" />
					<Text style={styles.secondaryActionText}>Ajustes</Text>
				</TouchableOpacity>

				<TouchableOpacity style={styles.logoutButton} onPress={cerrarSesion} activeOpacity={0.85}>
					<Ionicons name="log-out-outline" size={20} color="#ffffff" />
					<Text style={styles.logoutText}>Cerrar sesion</Text>
				</TouchableOpacity>
			</View>
		</DrawerContentScrollView>
	);
}

const styles = StyleSheet.create({
	drawerContainer: {
		flex: 1,
		justifyContent: 'space-between',
		backgroundColor: '#f3f8fd',
		paddingVertical: 10,
	},
	profileSection: {
		alignItems: 'center',
		marginTop: 8,
		marginHorizontal: 14,
		backgroundColor: '#ffffff',
		borderRadius: 16,
		borderWidth: 1,
		borderColor: '#d8e5f1',
		paddingVertical: 18,
	},
	avatar: {
		width: 74,
		height: 74,
		borderRadius: 37,
		marginBottom: 10,
	},
	profileName: {
		fontSize: 18,
		fontWeight: '700',
		color: '#133d60',
	},
	profileSubtitle: {
		marginTop: 4,
		fontSize: 13,
		color: '#68859d',
		fontWeight: '500',
	},
	optionsSection: {
		marginTop: 18,
		marginHorizontal: 14,
	},
	blockTitle: {
		fontSize: 13,
		fontWeight: '700',
		color: '#5d7e98',
		textTransform: 'uppercase',
		marginBottom: 10,
		marginLeft: 4,
	},
	menuItem: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 12,
		paddingHorizontal: 12,
		borderRadius: 12,
		marginBottom: 6,
	},
	menuItemActive: {
		backgroundColor: '#dcebf8',
	},
	menuItemText: {
		marginLeft: 10,
		fontSize: 15,
		color: '#35566f',
		fontWeight: '600',
	},
	menuItemTextActive: {
		color: '#0f4f7e',
	},
	bottomSection: {
		marginHorizontal: 14,
		marginBottom: 12,
	},
	secondaryAction: {
		height: 42,
		borderRadius: 11,
		backgroundColor: '#e3eef8',
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 10,
	},
	secondaryActionText: {
		marginLeft: 8,
		color: '#35566f',
		fontSize: 14,
		fontWeight: '700',
	},
	logoutButton: {
		height: 44,
		borderRadius: 11,
		backgroundColor: '#0f4f7e',
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
	},
	logoutText: {
		marginLeft: 8,
		color: '#ffffff',
		fontSize: 14,
		fontWeight: '700',
	},
});
