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
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const toNumber = (valor) => {
	const n = Number(valor);
	return Number.isFinite(n) ? n : 0;
};

const formatRating = (valor) => {
	const n = Number(valor);
	return Number.isFinite(n) ? n.toFixed(2) : '-';
};

const formatFecha = (item) => {
	if (!item) return '-';
	const dia = String(item.dia || 0).padStart(2, '0');
	const mes = String(item.mes || 0).padStart(2, '0');
	const anio = item.anio || '';
	return `${dia}/${mes}/${anio}`;
};

const getEscudo = (logo) => (
	logo ? <Image source={{ uri: logo }} style={styles.teamLogo} /> : (
		<View style={styles.logoFallback}>
			<Ionicons name="shield-outline" size={16} color="#5f7f9b" />
		</View>
	)
);

export default function InfoEquipo({ id_equipo, route }) {
	const navigation = useNavigation();
	const equipoId = id_equipo ?? route?.params?.id_equipo ?? route?.params?.idEquipo ?? route?.params?.id;

	const [cargando, setCargando] = useState(true);
	const [error, setError] = useState('');
	const [payload, setPayload] = useState(null);

	const cargarInfo = async () => {
		try {
			setCargando(true);
			setError('');

			if (!equipoId) {
				setPayload(null);
				return;
			}

			const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/equipos/info/${equipoId}`);

			if (!response.ok) {
				throw new Error('No se pudo cargar la información del equipo');
			}

			const data = await response.json();
			setPayload(data ?? null);
		} catch (_e) {
			setError('No se pudo cargar la información del equipo');
			setPayload(null);
		} finally {
			setCargando(false);
		}
	};

	useEffect(() => {
		cargarInfo();
	}, [equipoId]);

	const equipo = payload?.equipo ?? null;
	const proximoPartido = payload?.proximo_partido ?? null;
	const proximosPartidos = payload?.proximos_partidos ?? [];
	const clasificacion = payload?.clasificacion ?? null;
	const destacados = payload?.destacados ?? { minutos: null, goles: null, rating: null };
	const historicos = payload?.historicos ?? [];

	const infoItems = useMemo(() => {
		if (!equipo) return [];
		return [
			{ label: 'Pais', value: equipo.pais || '-' },
			{ label: 'Ciudad', value: equipo.ciudad || '-' },
			{ label: 'Fundado', value: equipo.fundado_en || '-' },
			{ label: 'Estadio', value: equipo.estadio || '-' },
			{ label: 'Capacidad', value: equipo.capacidad || '-' },
			{ label: 'Direccion', value: equipo.direccion || '-' },
		];
	}, [equipo]);

	const renderPartidoCompacto = (partido) => {
		const estaIncompleto = partido.status !== 'Completado';
		return (
			<TouchableOpacity
				key={`partido-${partido.id_partido}`}
				style={styles.tarjetaPartido}
				onPress={() => navigation.navigate('DetallePartido', { id_partido: partido.id_partido })}
				activeOpacity={0.8}
			>
				<View style={styles.columnaContenido}>
					<View style={styles.cabeceraCentro}>
						<Text style={styles.jornadaTexto}>Jornada {partido.jornada ?? '-'}</Text>
					</View>

					<View style={styles.filaEquipos}>
						<View style={styles.equipoBloque}>
							<View style={styles.equipoFila}>
								{partido.logo_local ? (
									<Image source={{ uri: partido.logo_local }} style={styles.logoEquipo} />
								) : (
									<View style={styles.logoFallbackSmall}>
										<Ionicons name="shield-outline" size={14} color="#5f7f9b" />
									</View>
								)}
								<Text style={styles.equipoNombre} numberOfLines={1}>
									{partido.equipo_local || '-'}
								</Text>
							</View>
						</View>

						<View style={styles.marcadorBloque}>
							{estaIncompleto ? (
								<Text style={styles.horaTexto}>{partido.hora || '--:--'}</Text>
							) : (
								<>
									<Text style={styles.marcadorTexto}>{partido.goles_local ?? '-'}</Text>
									<Text style={styles.separadorMarcador}>-</Text>
									<Text style={styles.marcadorTexto}>{partido.goles_visitante ?? '-'}</Text>
								</>
							)}
						</View>

						<View style={[styles.equipoBloque, styles.equipoBloqueDerecha]}>
							<View style={styles.equipoFilaDerecha}>
								<Text style={styles.equipoNombreDerecha} numberOfLines={1}>
									{partido.equipo_visitante || '-'}
								</Text>
								{partido.logo_visitante ? (
									<Image source={{ uri: partido.logo_visitante }} style={styles.logoEquipo} />
								) : (
									<View style={styles.logoFallbackSmall}>
										<Ionicons name="shield-outline" size={14} color="#5f7f9b" />
									</View>
								)}
							</View>
						</View>
					</View>

					<View style={styles.piePartido}>
						<Text style={styles.fechaTexto}>{formatFecha(partido)}</Text>
					</View>
				</View>
			</TouchableOpacity>
		);
	};

	const renderDestacado = (titulo, jugador, valor, sufijo) => (
		<TouchableOpacity
			style={styles.destacadoCard}
			onPress={() => (jugador?.id_jugador ? navigation.navigate('DetalleJugador', { id_jugador: jugador.id_jugador }) : null)}
			activeOpacity={jugador?.id_jugador ? 0.8 : 1}
		>
			<Text style={styles.destacadoTitle}>{titulo}</Text>
			<View style={styles.destacadoInfo}>
				{jugador?.foto ? (
					<Image source={{ uri: jugador.foto }} style={styles.destacadoAvatar} />
				) : (
					<View style={styles.destacadoAvatarFallback}>
						<Ionicons name="person-outline" size={18} color="#5f7f9b" />
					</View>
				)}
				<View style={styles.destacadoTextWrap}>
					<Text style={styles.destacadoNombre} numberOfLines={1}>{jugador?.nombre || 'Sin datos'}</Text>
					<Text style={styles.destacadoValor}>
						{valor ?? '-'}{sufijo ? ` ${sufijo}` : ''}
					</Text>
				</View>
			</View>
		</TouchableOpacity>
	);

	if (cargando) {
		return (
			<View style={styles.estadoPantalla}>
				<ActivityIndicator size="small" color="#1f6fa7" />
				<Text style={styles.estadoTexto}>Cargando informacion del equipo...</Text>
			</View>
		);
	}

	if (error) {
		return (
			<View style={styles.estadoPantalla}>
				<Ionicons name="alert-circle-outline" size={20} color="#5f7f9b" />
				<Text style={styles.estadoTexto}>{error}</Text>
			</View>
		);
	}

	return (
		<ScrollView style={styles.container} contentContainerStyle={styles.containerContent}>
			<View style={styles.sectionCard}>
				<Text style={styles.sectionTitle}>Informacion general</Text>
				{equipo ? (
					<View style={styles.infoGrid}>
						{infoItems.map((item) => (
							<View key={item.label} style={styles.infoItem}>
								<Text style={styles.infoLabel}>{item.label}</Text>
								<Text style={styles.infoValue} numberOfLines={2}>{item.value}</Text>
							</View>
						))}
					</View>
				) : (
					<Text style={styles.emptyText}>No hay informacion del equipo</Text>
				)}
			</View>

			<View style={styles.sectionCard}>
				<Text style={styles.sectionTitle}>Proximo partido</Text>
				{proximoPartido ? (
					renderPartidoCompacto(proximoPartido)
				) : (
					<Text style={styles.emptyText}>No hay partidos programados</Text>
				)}
			</View>

			<View style={styles.sectionCard}>
				<Text style={styles.sectionTitle}>Proximos partidos y posicion</Text>
				{proximosPartidos.length > 0 ? (
					<View style={styles.listaPartidosCompacta}>
						{proximosPartidos.map((partido) => renderPartidoCompacto(partido))}
					</View>
				) : (
					<Text style={styles.emptyText}>No hay partidos disponibles</Text>
				)}

				{clasificacion?.posicion ? (
					<View style={styles.posicionCard}>
						<View style={styles.posicionHeader}>
							<Text style={styles.posicionTitle}>Puesto en liga</Text>
							<Text style={styles.posicionMeta}>
								Temp {clasificacion.temporada ?? '-'} · J{clasificacion.jornada ?? '-'}
							</Text>
						</View>
						<View style={styles.posicionActual}>
							<Text style={styles.posicionNumero}>#{clasificacion.posicion}</Text>
							<Text style={styles.posicionPuntos}>{clasificacion.puntos ?? '-'} pts</Text>
						</View>

						<View style={styles.posicionVecinos}>
							{clasificacion.equipo_arriba ? (
								<TouchableOpacity
									style={styles.vecinoRow}
									onPress={() => navigation.navigate('DetalleEquipo', { idEquipo: clasificacion.equipo_arriba.id_equipo })}
									activeOpacity={0.8}
								>
									{getEscudo(clasificacion.equipo_arriba.logo)}
									<View style={styles.vecinoTextWrap}>
										<Text style={styles.vecinoNombre} numberOfLines={1}>{clasificacion.equipo_arriba.nombre_equipo}</Text>
										<Text style={styles.vecinoSub}>
											+{toNumber(clasificacion.diferencia_arriba)} pts
										</Text>
									</View>
									<Text style={styles.vecinoPuntos}>{clasificacion.equipo_arriba.puntos ?? '-'} pts</Text>
								</TouchableOpacity>
							) : null}

							{clasificacion.equipo_abajo ? (
								<TouchableOpacity
									style={styles.vecinoRow}
									onPress={() => navigation.navigate('DetalleEquipo', { idEquipo: clasificacion.equipo_abajo.id_equipo })}
									activeOpacity={0.8}
								>
									{getEscudo(clasificacion.equipo_abajo.logo)}
									<View style={styles.vecinoTextWrap}>
										<Text style={styles.vecinoNombre} numberOfLines={1}>{clasificacion.equipo_abajo.nombre_equipo}</Text>
										<Text style={styles.vecinoSub}>
											+{toNumber(clasificacion.diferencia_abajo)} pts
										</Text>
									</View>
									<Text style={styles.vecinoPuntos}>{clasificacion.equipo_abajo.puntos ?? '-'} pts</Text>
								</TouchableOpacity>
							) : null}
						</View>
					</View>
				) : (
					<Text style={styles.emptyText}>No hay clasificacion disponible</Text>
				)}
			</View>

			<View style={styles.sectionCard}>
				<Text style={styles.sectionTitle}>Destacados actuales</Text>
				<View style={styles.destacadosGrid}>
					{renderDestacado('Mas minutos', destacados.minutos, destacados.minutos?.minutos, 'min')}
					{renderDestacado('Mas goles', destacados.goles, destacados.goles?.goles, 'goles')}
					{renderDestacado('Mejor rating', destacados.rating, formatRating(destacados.rating?.nota_media))}
				</View>
			</View>

			<View style={styles.sectionCard}>
				<Text style={styles.sectionTitle}>Ídolos</Text>
				{historicos.length > 0 ? (
					<View style={styles.historicosList}>
						{historicos.map((jugador) => (
							<TouchableOpacity
								key={`historico-${jugador.id_jugador}`}
								style={styles.historicoRow}
								onPress={() => navigation.navigate('DetalleJugador', { id_jugador: jugador.id_jugador })}
								activeOpacity={0.8}
							>
								{jugador.foto ? (
									<Image source={{ uri: jugador.foto }} style={styles.historicoAvatar} />
								) : (
									<View style={styles.historicoAvatarFallback}>
										<Ionicons name="person-outline" size={18} color="#5f7f9b" />
									</View>
								)}
								<View style={styles.historicoTextWrap}>
									<Text style={styles.historicoNombre} numberOfLines={1}>{jugador.nombre}</Text>
									<Text style={styles.historicoRating}>Rating medio {formatRating(jugador.rating_medio)}</Text>
								</View>
								<Ionicons name="chevron-forward" size={16} color="#89a2b9" />
							</TouchableOpacity>
						))}
					</View>
				) : (
					<Text style={styles.emptyText}>No hay jugadores historicos disponibles</Text>
				)}
			</View>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f4f8fc',
	},
	containerContent: {
		padding: 14,
		paddingBottom: 24,
	},
	sectionCard: {
		backgroundColor: '#ffffff',
		borderRadius: 16,
		borderWidth: 1,
		borderColor: '#e4ebf2',
		padding: 14,
		marginBottom: 12,
		shadowColor: '#0d2b4a',
		shadowOffset: { width: 0, height: 6 },
		shadowOpacity: 0.08,
		shadowRadius: 10,
		elevation: 4,
	},
	sectionTitle: {
		fontSize: 15,
		fontWeight: '800',
		color: '#0f2743',
		marginBottom: 10,
	},
	infoGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 10,
	},
	infoItem: {
		width: '48%',
		backgroundColor: '#f2f6fa',
		borderRadius: 12,
		padding: 10,
		borderWidth: 1,
		borderColor: '#e3ebf3',
	},
	infoLabel: {
		fontSize: 11,
		color: '#6b86a1',
		fontWeight: '700',
		textTransform: 'uppercase',
	},
	infoValue: {
		marginTop: 4,
		fontSize: 13,
		fontWeight: '700',
		color: '#1d3850',
	},
	emptyText: {
		fontSize: 12,
		color: '#6b86a1',
		fontWeight: '600',
		textAlign: 'center',
		paddingVertical: 8,
	},
	listaPartidosCompacta: {
		gap: 8,
		marginBottom: 12,
	},
	tarjetaPartido: {
		flexDirection: 'column',
		alignItems: 'stretch',
		backgroundColor: '#ffffff',
		borderRadius: 12,
		borderWidth: 1,
		borderColor: '#dbe6f0',
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
	logoFallbackSmall: {
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
	teamLogo: {
		width: 26,
		height: 26,
		borderRadius: 13,
		resizeMode: 'contain',
		backgroundColor: '#f0f5fa',
	},
	logoFallback: {
		width: 26,
		height: 26,
		borderRadius: 13,
		backgroundColor: '#e8edf2',
		alignItems: 'center',
		justifyContent: 'center',
	},
	posicionCard: {
		borderRadius: 12,
		borderWidth: 1,
		borderColor: '#e1eaf2',
		padding: 12,
		backgroundColor: '#f9fbfe',
	},
	posicionHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 10,
	},
	posicionTitle: {
		fontSize: 13,
		fontWeight: '800',
		color: '#123252',
	},
	posicionMeta: {
		fontSize: 11,
		color: '#6b86a1',
		fontWeight: '600',
	},
	posicionActual: {
		flexDirection: 'row',
		alignItems: 'baseline',
		gap: 10,
		marginBottom: 10,
	},
	posicionNumero: {
		fontSize: 22,
		fontWeight: '800',
		color: '#1f6fa7',
	},
	posicionPuntos: {
		fontSize: 12,
		fontWeight: '700',
		color: '#4f6782',
	},
	posicionVecinos: {
		gap: 8,
	},
	vecinoRow: {
		flexDirection: 'row',
		alignItems: 'center',
		borderRadius: 10,
		borderWidth: 1,
		borderColor: '#d9e5f0',
		paddingHorizontal: 10,
		paddingVertical: 8,
		backgroundColor: '#ffffff',
	},
	vecinoTextWrap: {
		flex: 1,
		marginLeft: 8,
	},
	vecinoNombre: {
		fontSize: 12,
		fontWeight: '700',
		color: '#123252',
	},
	vecinoSub: {
		fontSize: 11,
		color: '#6b86a1',
		fontWeight: '600',
		marginTop: 2,
	},
	vecinoPuntos: {
		fontSize: 12,
		fontWeight: '700',
		color: '#1f6fa7',
	},
	destacadosGrid: {
		gap: 8,
	},
	destacadoCard: {
		borderRadius: 12,
		borderWidth: 1,
		borderColor: '#e1eaf2',
		padding: 10,
		backgroundColor: '#f9fbfe',
	},
	destacadoTitle: {
		fontSize: 12,
		fontWeight: '800',
		color: '#1e3f66',
		marginBottom: 6,
	},
	destacadoInfo: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	destacadoAvatar: {
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: '#eef3f8',
	},
	destacadoAvatarFallback: {
		width: 36,
		height: 36,
		borderRadius: 18,
		backgroundColor: '#eef3f8',
		alignItems: 'center',
		justifyContent: 'center',
	},
	destacadoTextWrap: {
		flex: 1,
		marginLeft: 10,
	},
	destacadoNombre: {
		fontSize: 13,
		fontWeight: '700',
		color: '#123252',
	},
	destacadoValor: {
		fontSize: 12,
		color: '#5f7f9b',
		fontWeight: '600',
		marginTop: 2,
	},
	historicosList: {
		gap: 8,
	},
	historicoRow: {
		flexDirection: 'row',
		alignItems: 'center',
		borderRadius: 12,
		borderWidth: 1,
		borderColor: '#e1eaf2',
		padding: 10,
		backgroundColor: '#f9fbfe',
	},
	historicoAvatar: {
		width: 38,
		height: 38,
		borderRadius: 19,
		backgroundColor: '#eef3f8',
	},
	historicoAvatarFallback: {
		width: 38,
		height: 38,
		borderRadius: 19,
		backgroundColor: '#eef3f8',
		alignItems: 'center',
		justifyContent: 'center',
	},
	historicoTextWrap: {
		flex: 1,
		marginLeft: 10,
	},
	historicoNombre: {
		fontSize: 13,
		fontWeight: '700',
		color: '#123252',
	},
	historicoRating: {
		fontSize: 12,
		color: '#5f7f9b',
		fontWeight: '600',
		marginTop: 2,
	},
	estadoPantalla: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		padding: 20,
		backgroundColor: '#f4f8fc',
	},
	estadoTexto: {
		marginTop: 6,
		fontSize: 13,
		color: '#5f7f9b',
		fontWeight: '600',
	},
});
