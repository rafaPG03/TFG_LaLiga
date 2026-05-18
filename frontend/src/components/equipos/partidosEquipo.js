import React, { useEffect, useMemo, useState } from 'react';
import {
	ActivityIndicator,
	FlatList,
	Image,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function PartidosEquipo({ id_equipo, route }) {
	const navigation = useNavigation();
	const equipoId = id_equipo ?? route?.params?.id_equipo ?? route?.params?.idEquipo ?? route?.params?.id;

	const [cargando, setCargando] = useState(true);
	const [error, setError] = useState('');
	const [partidos, setPartidos] = useState([]);
	const [temporadasDisponibles, setTemporadasDisponibles] = useState([]);
	const [temporadaSeleccionada, setTemporadaSeleccionada] = useState(null);

	const obtenerTemporadas = async () => {
		const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/temporadas/annos`);

		if (!response.ok) {
			throw new Error('No se pudieron cargar las temporadas');
		}

		const data = await response.json();
		return [...new Set((Array.isArray(data) ? data : []).map((item) => Number(item.temporada)).filter((temp) => Number.isFinite(temp)))].sort((a, b) => b - a);
	};

	const obtenerPartidos = async (temporada) => {
		const queryTemporada = temporada ? `?temporada=${temporada}` : '';
		const response = await fetch(
			`${process.env.EXPO_PUBLIC_API_URL}/equipos/partidos/${equipoId}${queryTemporada}`
		);

		if (response.status === 404) {
			return [];
		}

		if (!response.ok) {
			throw new Error('No se pudieron cargar los partidos del equipo');
		}

		const data = await response.json();
		return Array.isArray(data) ? data : [];
	};

	const cargarInicial = async () => {
		try {
			setCargando(true);
			setError('');

			if (!equipoId) {
				setPartidos([]);
				setTemporadasDisponibles([]);
				setTemporadaSeleccionada(null);
				return;
			}

			const temporadas = await obtenerTemporadas();
			setTemporadasDisponibles(temporadas);

			if (temporadas.length > 0) {
				let temporadaConPartidos = null;
				let partidosFiltrados = [];

				for (const temporada of temporadas) {
					const partidosTemporada = await obtenerPartidos(temporada);
					if (partidosTemporada.length > 0) {
						temporadaConPartidos = temporada;
						partidosFiltrados = partidosTemporada;
						break;
					}
				}

				const temporadaPorDefecto = temporadaConPartidos ?? temporadas[0];
				setTemporadaSeleccionada(temporadaPorDefecto);
				setPartidos(partidosFiltrados);
			} else {
				setTemporadaSeleccionada(null);
				setPartidos([]);
			}
		} catch (e) {
			setError('No se pudieron obtener los partidos del equipo');
			setPartidos([]);
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
			const partidosFiltrados = await obtenerPartidos(temporada);
			setPartidos(partidosFiltrados);
		} catch (e) {
			setError('No se pudieron filtrar los partidos por temporada');
			setPartidos([]);
		} finally {
			setCargando(false);
		}
	};

	useEffect(() => {
		cargarInicial();
	}, [equipoId]);

	const partidosOrdenados = useMemo(
		() => [...partidos].sort((a, b) => {
			const fechaA = `${Number(a.anio) || 0}-${String(Number(a.mes) || 0).padStart(2, '0')}-${String(Number(a.dia) || 0).padStart(2, '0')}`;
			const fechaB = `${Number(b.anio) || 0}-${String(Number(b.mes) || 0).padStart(2, '0')}-${String(Number(b.dia) || 0).padStart(2, '0')}`;
			return fechaB.localeCompare(fechaA);
		}),
		[partidos]
	);

	const getNumero = (valor) => {
		const n = Number(valor);
		return Number.isFinite(n) ? n : 0;
	};



	const renderItemPartido = ({ item }) => {
		const logoLocal = item.logo_local;
		const logoVisitante = item.logo_visitante;
		const nombreLocal = item.equipo_local;
		const nombreVisitante = item.equipo_visitante;
		const golesLocal = item.goles_local;
		const golesVisitante = item.goles_visitante;
		const estaIncompleto = item.status !== 'Completado';
		const fechaFormato = `${String(item.dia || 0).padStart(2, '0')}/${String(item.mes || 0).padStart(2, '0')}/${item.anio || ''}`;

		const handleNavegar = () => {
			navigation.navigate('DetallePartido', { id_partido: item.id_partido });
		};

		return (
			<TouchableOpacity
				style={styles.tarjetaPartido}
				onPress={handleNavegar}
				activeOpacity={0.7}
			>
				<View style={styles.columnaContenido}>
					<View style={styles.cabeceraCentro}>
						<Text style={styles.jornadaTexto}>Jornada {item.jornada ?? '-'}</Text>
					</View>

					<View style={styles.filaEquipos}>
						<View style={styles.equipoBloque}>
							<View style={styles.equipoFila}>
								{logoLocal ? (
									<Image source={{ uri: logoLocal }} style={styles.logoEquipo} />
								) : (
									<View style={styles.logoFallback}>
										<Ionicons name="shield-outline" size={14} color="#5f7f9b" />
									</View>
								)}
								<Text style={styles.equipoNombre} numberOfLines={1}>
									{nombreLocal || '-'}
								</Text>
							</View>
						</View>

						<View style={styles.marcadorBloque}>
							{estaIncompleto ? (
								<Text style={styles.horaTexto}>{item.hora || '--:--'}</Text>
							) : (
								<>
									<Text style={styles.marcadorTexto}>{golesLocal ?? '-'}</Text>
									<Text style={styles.separadorMarcador}>-</Text>
									<Text style={styles.marcadorTexto}>{golesVisitante ?? '-'}</Text>
								</>
							)}
						</View>

						<View style={[styles.equipoBloque, styles.equipoBloqueDerecha]}>
							<View style={styles.equipoFilaDerecha}>
								<Text style={styles.equipoNombreDerecha} numberOfLines={1}>
									{nombreVisitante || '-'}
								</Text>
								{logoVisitante ? (
									<Image source={{ uri: logoVisitante }} style={styles.logoEquipo} />
								) : (
									<View style={styles.logoFallback}>
										<Ionicons name="shield-outline" size={14} color="#5f7f9b" />
									</View>
								)}
							</View>
						</View>
					</View>

					<View style={styles.piePartido}>
						<Text style={styles.fechaTexto}>{fechaFormato}</Text>
					</View>
				</View>
			</TouchableOpacity>
		);
	};

	if (cargando) {
		return (
			<View style={styles.estadoPantalla}>
				<ActivityIndicator size="small" color="#1f6fa7" />
				<Text style={styles.estadoTexto}>Cargando partidos...</Text>
			</View>
		);
	}

	return (
		<View style={styles.contenedor}>
			<View style={styles.cabeceraFiltros}>
				<Text style={styles.titulo}>Partidos</Text>
				{temporadaSeleccionada ? (
					<Text style={styles.subtitulo}>Temporada {temporadaSeleccionada}</Text>
				) : null}
			</View>

			{temporadasDisponibles.length > 0 ? (
				<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.listaTemporadas}>
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

			{!error && partidosOrdenados.length === 0 ? (
				<View style={styles.estadoPantalla}>
					<Ionicons name="calendar-clear-outline" size={45} color="#5f7f9b" />
					<Text style={styles.estadoTexto}>
						{temporadaSeleccionada ? 'No participó en esta temporada' : 'No hay temporadas disponibles'}
					</Text>
				</View>
			) : (
				<FlatList
					data={partidosOrdenados}
					keyExtractor={(item, index) => `${item.id_partido ?? 'partido'}-${index}`}
					renderItem={renderItemPartido}
					contentContainerStyle={styles.listaPartidos}
					showsVerticalScrollIndicator={false}
				/>
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
	listaPartidos: {
		paddingBottom: 14,
	},
	tarjetaPartido: {
		flexDirection: 'column',
		alignItems: 'stretch',
		backgroundColor: '#ffffff',
		borderRadius: 12,
		borderWidth: 1,
		borderColor: '#dbe6f0',
		marginBottom: 8,
		overflow: 'hidden',
	},
	columnaContenido: {
		flex: 1,
		paddingHorizontal: 8,
		paddingVertical: 6,
		justifyContent: 'flex-start',
	},
	cabeceraCentro: {
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 4,
	},
	filaEquipos: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: 6,
		marginTop: 2,
	},
	equipoBloque: {
		flex: 1,
		alignItems: 'flex-start',
		gap: 2,
	},
	equipoBloqueDerecha: {
		alignItems: 'flex-end',
	},
	equipoFila: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
	},
	equipoFilaDerecha: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'flex-end',
		gap: 4,
	},
	logoEquipo: {
		width: 22,
		height: 22,
		borderRadius: 11,
		resizeMode: 'contain',
		backgroundColor: '#f0f5fa',
	},
	logoFallback: {
		width: 22,
		height: 22,
		borderRadius: 11,
		backgroundColor: '#e8edf2',
		alignItems: 'center',
		justifyContent: 'center',
	},
	equipoNombre: {
		flex: 1,
		color: '#173a5d',
		fontSize: 12,
		fontWeight: '700',
	},
	equipoNombreDerecha: {
		flex: 1,
		color: '#173a5d',
		fontSize: 12,
		fontWeight: '700',
		textAlign: 'right',
	},
	marcadorBloque: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 3,
		minWidth: 52,
	},
	marcadorTexto: {
		fontSize: 16,
		color: '#0f2743',
		fontWeight: '800',
		minWidth: 16,
		textAlign: 'center',
	},
	separadorMarcador: {
		fontSize: 14,
		color: '#6c8299',
		fontWeight: '800',
	},
	piePartido: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		marginTop: 6,
	},
	fechaTexto: {
		fontSize: 11,
		fontWeight: '700',
		color: '#123455',
		textAlign: 'center',
	},
	jornadaTexto: {
		fontSize: 11,
		fontWeight: '700',
		color: '#32506f',
		backgroundColor: '#edf3f9',
		borderRadius: 999,
		paddingHorizontal: 8,
		paddingVertical: 3,
	},
	horaTexto: {
		fontSize: 10,
		color: '#6c8299',
		fontWeight: '600',
	},
	estadoPantalla: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'flex-start',
		gap: 8,
		paddingTop: 32,
        paddingBottom: 200,
	},
	estadoTexto: {
		color: '#4f6782',
		fontSize: 17,
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
