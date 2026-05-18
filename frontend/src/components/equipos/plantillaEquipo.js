import React, { useEffect, useMemo, useState } from 'react';
import {
	ActivityIndicator,
	Image,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const COLUMNAS = [
	{ key: 'titular', label: 'PJ' },
	{ key: 'goles', label: 'G' },
	{ key: 'asistencias', label: 'A' },
	{ key: 'goles_concedidos', label: 'GC' },
	{ key: 'tarjetas_totales', label: 'Tar' },
];

const ORDEN_POSICION = ['Portero', 'Defensa', 'Mediocentro', 'Delantero'];

export default function PlantillaEquipo({ id_equipo, route }) {
	const navigation = useNavigation();
	const equipoId = id_equipo ?? route?.params?.id_equipo ?? route?.params?.idEquipo ?? route?.params?.id;

	const [cargando, setCargando] = useState(true);
	const [error, setError] = useState('');
	const [plantilla, setPlantilla] = useState([]);
	const [temporadasDisponibles, setTemporadasDisponibles] = useState([]);
	const [temporadaSeleccionada, setTemporadaSeleccionada] = useState(null);
	const [sortState, setSortState] = useState({ key: null, direction: null });

	const obtenerTemporadas = async () => {
		const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/temporadas/annos`);

		if (!response.ok) {
			throw new Error('No se pudieron cargar las temporadas');
		}

		const data = await response.json();
		return [...new Set((Array.isArray(data) ? data : [])
			.map((item) => Number(item.temporada))
			.filter((temp) => Number.isFinite(temp))
		)].sort((a, b) => b - a);
	};

	const obtenerPlantilla = async (temporada) => {
		const queryTemporada = temporada ? `?temporada=${temporada}` : '';
		const response = await fetch(
			`${process.env.EXPO_PUBLIC_API_URL}/equipos/plantilla/${equipoId}${queryTemporada}`
		);

		if (response.status === 404) {
			return [];
		}

		if (!response.ok) {
			throw new Error('No se pudo cargar la plantilla del equipo');
		}

		const data = await response.json();
		return Array.isArray(data) ? data : [];
	};

	const cargarInicial = async () => {
		try {
			setCargando(true);
			setError('');

			if (!equipoId) {
				setPlantilla([]);
				setTemporadasDisponibles([]);
				setTemporadaSeleccionada(null);
				return;
			}

			const temporadas = await obtenerTemporadas();
			setTemporadasDisponibles(temporadas);

			if (temporadas.length > 0) {
				let temporadaConDatos = null;
				let plantillaTemp = [];

				for (const temporada of temporadas) {
					const plantillaTemporada = await obtenerPlantilla(temporada);
					if (plantillaTemporada.length > 0) {
						temporadaConDatos = temporada;
						plantillaTemp = plantillaTemporada;
						break;
					}
				}

				const temporadaPorDefecto = temporadaConDatos ?? temporadas[0];
				setTemporadaSeleccionada(temporadaPorDefecto);
				setPlantilla(plantillaTemp);
			} else {
				setTemporadaSeleccionada(null);
				setPlantilla([]);
			}
		} catch (e) {
			setError('No se pudo obtener la plantilla del equipo');
			setPlantilla([]);
			setTemporadasDisponibles([]);
			setTemporadaSeleccionada(null);
		} finally {
			setCargando(false);
		}
	};

	const seleccionarTemporada = async (temporada) => {
		if (temporada === temporadaSeleccionada || !equipoId) return;

		try {
			setTemporadaSeleccionada(temporada);
			setCargando(true);
			setError('');
			const plantillaTemp = await obtenerPlantilla(temporada);
			setPlantilla(plantillaTemp);
		} catch (e) {
			setError('No se pudo filtrar la plantilla por temporada');
			setPlantilla([]);
		} finally {
			setCargando(false);
		}
	};

	useEffect(() => {
		cargarInicial();
	}, [equipoId]);

	const alternarOrden = (key) => {
		setSortState((prev) => {
			if (prev.key !== key) {
				return { key, direction: 'desc' };
			}

			if (prev.direction === 'desc') {
				return { key, direction: 'asc' };
			}

			return { key: null, direction: null };
		});
	};

	const ordenarLista = (lista) => {
		if (!sortState.key || !sortState.direction) return lista;

		const copia = [...lista];
		const dir = sortState.direction === 'asc' ? 1 : -1;

		return copia.sort((a, b) => {
			if (sortState.key === 'nombre') {
				return dir * String(a.nombre || '').localeCompare(String(b.nombre || ''));
			}

			const av = Number(a[sortState.key]);
			const bv = Number(b[sortState.key]);
			const na = Number.isFinite(av) ? av : -Infinity;
			const nb = Number.isFinite(bv) ? bv : -Infinity;
			return dir * (na - nb);
		});
	};

	const gruposPorPosicion = useMemo(() => {
		const grupos = {
			Portero: [],
			Defensa: [],
			Mediocentro: [],
			Delantero: [],
			Otros: [],
		};

		plantilla.forEach((jugador) => {
			const pos = jugador.posicion;
			if (pos === 'Portero') grupos.Portero.push(jugador);
			else if (pos === 'Defensa') grupos.Defensa.push(jugador);
			else if (pos === 'Mediocentro') grupos.Mediocentro.push(jugador);
			else if (pos === 'Delantero') grupos.Delantero.push(jugador);
			else grupos.Otros.push(jugador);
		});

		return grupos;
	}, [plantilla]);

	if (cargando) {
		return (
			<View style={styles.estadoPantalla}>
				<ActivityIndicator size="small" color="#1f6fa7" />
				<Text style={styles.estadoTexto}>Cargando plantilla...</Text>
			</View>
		);
	}

	const renderHeader = () => (
		<View style={styles.headerRow}>
			<TouchableOpacity
				style={[styles.headerCell, styles.headerJugador]}
				onPress={() => alternarOrden('nombre')}
				activeOpacity={0.8}
			>
				<View style={[styles.headerLabelWrap, styles.headerLabelWrapLeft]}>
					<Text style={[styles.headerText, styles.headerJugadorText]}>Jugador</Text>
					<Text style={styles.sortIcon}>
						{sortState.key === 'nombre' ? (sortState.direction === 'asc' ? '↑' : '↓') : ''}
					</Text>
				</View>
			</TouchableOpacity>

			{COLUMNAS.map((col) => (
				<TouchableOpacity
					key={col.key}
					style={styles.headerCell}
					onPress={() => alternarOrden(col.key)}
					activeOpacity={0.8}
				>
					<View style={styles.headerLabelWrap}>
						<Text style={styles.headerText}>{col.label}</Text>
						<Text style={styles.sortIcon}>
							{sortState.key === col.key ? (sortState.direction === 'asc' ? '↑' : '↓') : ''}
						</Text>
					</View>
				</TouchableOpacity>
			))}
		</View>
	);

	const renderFila = (jugador) => (
		<TouchableOpacity
			key={jugador.id_jugador}
			style={styles.filaRow}
			activeOpacity={0.85}
			onPress={() => navigation.navigate('DetalleJugador', { id_jugador: jugador.id_jugador })}
		>
			<View style={[styles.cellJugador, styles.cellJugadorContent]}>
				{jugador.foto ? (
					<Image source={{ uri: jugador.foto }} style={styles.fotoJugador} />
				) : (
					<View style={styles.fotoFallback}>
						<Ionicons name="person-outline" size={14} color="#5f7f9b" />
					</View>
				)}
				<Text style={styles.nombreJugador} numberOfLines={1}>
					{jugador.nombre || '-'}
				</Text>
			</View>

			{COLUMNAS.map((col) => (
				<Text key={`${jugador.id_jugador}-${col.key}`} style={styles.cellText}>
					{jugador[col.key] ?? '-'}
				</Text>
			))}
		</TouchableOpacity>
	);

	const renderSeccion = (titulo, jugadores) => {
		if (!jugadores || jugadores.length === 0) return null;

		const ordenados = ordenarLista(jugadores);

		return (
			<View key={titulo} style={styles.seccionWrap}>
				<Text style={styles.seccionTitulo}>{titulo}</Text>
				<View style={styles.tablaWrap}>
					{renderHeader()}
					{ordenados.map(renderFila)}
				</View>
			</View>
		);
	};

	return (
		<View style={styles.contenedor}>
			<View style={styles.cabeceraFiltros}>
				<Text style={styles.titulo}>Plantilla</Text>
				{temporadaSeleccionada ? (
					<Text style={styles.subtitulo}>Temporada {temporadaSeleccionada}</Text>
				) : null}
			</View>

			{temporadasDisponibles.length > 0 ? (
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={styles.listaTemporadas}
				>
					{temporadasDisponibles.map((temporada) => {
						const activa = temporada === temporadaSeleccionada;
						return (
							<TouchableOpacity
								key={temporada}
								style={[styles.botonTemporada, activa && styles.botonTemporadaActivo]}
								onPress={() => seleccionarTemporada(temporada)}
								activeOpacity={0.85}
							>
								<Text style={[styles.textoTemporada, activa && styles.textoTemporadaActivo]}>{temporada}</Text>
							</TouchableOpacity>
						);
					})}
				</ScrollView>
			) : null}

			{error ? <Text style={styles.errorTexto}>{error}</Text> : null}

			{!error && plantilla.length === 0 ? (
				<View style={styles.estadoPantallaVacio}>
					<Ionicons name="people-outline" size={28} color="#5f7f9b" />
					<Text style={styles.estadoTextoVacio}>
						{temporadaSeleccionada ? 'No participo en esta temporada' : 'No hay temporadas disponibles'}
					</Text>
				</View>
			) : (
				<ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listaContenida}>
					{ORDEN_POSICION.map((pos) => renderSeccion(pos, gruposPorPosicion[pos]))}
					{renderSeccion('Otros', gruposPorPosicion.Otros)}
				</ScrollView>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	contenedor: {
		flex: 1,
		backgroundColor: '#f4f8fc',
		paddingHorizontal: 12,
		paddingTop: 10,
	},
	cabeceraFiltros: {
		marginBottom: 8,
	},
	titulo: {
		fontSize: 17,
		fontWeight: '800',
		color: '#12233f',
	},
	subtitulo: {
		marginTop: 2,
		fontSize: 12,
		color: '#55708d',
		fontWeight: '600',
	},
	listaTemporadas: {
		paddingBottom: 10,
		gap: 8,
	},
	botonTemporada: {
		minWidth: 84,
		height: 34,
		paddingHorizontal: 14,
		paddingVertical: 0,
		borderRadius: 999,
		borderWidth: 1,
		borderColor: '#c7d7e6',
		backgroundColor: '#edf3f9',
		alignItems: 'center',
		justifyContent: 'center',
	},
	botonTemporadaActivo: {
		backgroundColor: '#1f4f7a',
		borderColor: '#1f4f7a',
	},
	textoTemporada: {
		color: '#1f4f7a',
		fontSize: 12,
		fontWeight: '700',
		lineHeight: 16,
		includeFontPadding: false,
		textAlignVertical: 'center',
	},
	textoTemporadaActivo: {
		color: '#eef6ff',
	},
	listaContenida: {
		paddingBottom: 16,
	},
	seccionWrap: {
		marginBottom: 12,
	},
	seccionTitulo: {
		fontSize: 13,
		fontWeight: '800',
		color: '#1f3b57',
		marginBottom: 6,
	},
	tablaWrap: {
		backgroundColor: '#ffffff',
		borderRadius: 12,
		borderWidth: 1,
		borderColor: '#dbe6f0',
		overflow: 'hidden',
	},
	headerRow: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#edf3f9',
		borderBottomWidth: 1,
		borderBottomColor: '#dbe6f0',
	},
	headerCell: {
		flex: 1,
		paddingVertical: 8,
		paddingHorizontal: 6,
		alignItems: 'center',
		justifyContent: 'center',
	},
	headerJugador: {
		flex: 2.4,
		alignItems: 'flex-start',
	},
	headerLabelWrap: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		width: '100%',
		gap: 4,
	},
	headerLabelWrapLeft: {
		justifyContent: 'flex-start',
	},
	headerText: {
		fontSize: 11,
		fontWeight: '800',
		color: '#1f3b57',
	},
	headerJugadorText: {
		textAlign: 'left',
	},
	sortIcon: {
		fontSize: 11,
		color: '#5f7f9b',
		width: 10,
		textAlign: 'center',
	},
	filaRow: {
		flexDirection: 'row',
		alignItems: 'center',
		borderBottomWidth: 1,
		borderBottomColor: '#eef2f6',
	},
	cellJugador: {
		flex: 2.4,
		paddingVertical: 8,
		paddingHorizontal: 6,
	},
	cellJugadorContent: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
	},
	fotoJugador: {
		width: 24,
		height: 24,
		borderRadius: 12,
		backgroundColor: '#e8edf2',
	},
	fotoFallback: {
		width: 24,
		height: 24,
		borderRadius: 12,
		backgroundColor: '#e8edf2',
		alignItems: 'center',
		justifyContent: 'center',
	},
	nombreJugador: {
		flex: 1,
		fontSize: 12,
		fontWeight: '700',
		color: '#173a5d',
	},
	cellText: {
		flex: 1,
		textAlign: 'center',
		fontSize: 12,
		fontWeight: '600',
		color: '#173a5d',
		paddingVertical: 8,
	},
	estadoPantalla: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
	},
	estadoTexto: {
		color: '#4f6782',
		fontSize: 13,
		fontWeight: '600',
	},
	estadoPantallaVacio: {
		alignItems: 'center',
		justifyContent: 'flex-start',
		gap: 8,
		paddingTop: 24,
	},
	estadoTextoVacio: {
		color: '#4f6782',
		fontSize: 15,
		fontWeight: '700',
	},
	errorTexto: {
		marginBottom: 8,
		color: '#b91c1c',
		backgroundColor: '#fee2e2',
		borderRadius: 10,
		paddingHorizontal: 10,
		paddingVertical: 8,
		fontWeight: '600',
	},
});
