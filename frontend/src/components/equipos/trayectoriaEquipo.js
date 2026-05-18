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
	{ key: 'temporada', label: 'Temp.' },
	{ key: 'posicion', label: 'Pos' },
	{ key: 'puntos', label: 'Pts' },
	{ key: 'victorias', label: 'V' },
	{ key: 'empates', label: 'E' },
	{ key: 'derrotas', label: 'D' },
	{ key: 'dg', label: 'DG' },
];

const COL_WIDTH = 60;
const DETAIL_WIDTH = 72;

const toNumber = (valor) => {
	const n = Number(valor);
	return Number.isFinite(n) ? n : 0;
};

const formatNumero = (valor) => {
	const n = Number(valor);
	return Number.isFinite(n) ? String(n) : '-';
};

const formatRating = (valor) => {
	const n = Number(valor);
	return Number.isFinite(n) ? n.toFixed(2) : '-';
};

export default function TrayectoriaEquipo({ id_equipo, route }) {
	const navigation = useNavigation();
	const equipoId = id_equipo ?? route?.params?.id_equipo ?? route?.params?.idEquipo ?? route?.params?.id;

	const [cargando, setCargando] = useState(true);
	const [error, setError] = useState('');
	const [trayectoria, setTrayectoria] = useState([]);
	const [jugadoresById, setJugadoresById] = useState({});
	const [partidosById, setPartidosById] = useState({});
	const [temporadaAbierta, setTemporadaAbierta] = useState(null);
	const [sortKey, setSortKey] = useState('temporada');
	const [sortDir, setSortDir] = useState('desc');

	useEffect(() => {
		let activo = true;

		const cargarTrayectoria = async () => {
			try {
				setCargando(true);
				setError('');

				if (!equipoId) {
					setTrayectoria([]);
					setJugadoresById({});
					setPartidosById({});
					setTemporadaAbierta(null);
					return;
				}

				const resp = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/equipos/trayectoria/${equipoId}`);
				if (!resp.ok) {
					throw new Error('No se pudo cargar la trayectoria del equipo');
				}

				const data = await resp.json();
				const rows = Array.isArray(data) ? data : [];

				const idsJugadores = [
					...new Set(
						rows
							.flatMap((row) => [row.mvp_id_jugador, row.goleador_id_jugador, row.minutos_id_jugador])
							.map((id) => Number(id))
							.filter((id) => Number.isFinite(id) && id > 0)
					),
				];

				const jugadoresPairs = await Promise.all(
					idsJugadores.map(async (idJugador) => {
						try {
							const jugadorResp = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/jugadores/${idJugador}`);
							if (!jugadorResp.ok) {
								return [idJugador, null];
							}
							const jugador = await jugadorResp.json();
							return [idJugador, jugador];
						} catch (_e) {
							return [idJugador, null];
						}
					})
				);

				const idsPartidos = [
					...new Set(
						rows
							.map((row) => Number(row.mejor_partido_id_partido))
							.filter((id) => Number.isFinite(id) && id > 0)
					),
				];

				const partidosPairs = await Promise.all(
					idsPartidos.map(async (idPartido) => {
						try {
							const partidoResp = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/partidos/${idPartido}/info`);
							if (!partidoResp.ok) {
								return [idPartido, null];
							}
							const partido = await partidoResp.json();
							return [idPartido, partido];
						} catch (_e) {
							return [idPartido, null];
						}
					})
				);

				if (!activo) return;

				setTrayectoria(rows);
				setJugadoresById(Object.fromEntries(jugadoresPairs));
				setPartidosById(Object.fromEntries(partidosPairs));
				if (rows.length > 0) {
					setTemporadaAbierta(rows[0]?.temporada ?? null);
				}
			} catch (_e) {
				if (!activo) return;
				setError('No se pudo cargar la trayectoria');
				setTrayectoria([]);
				setJugadoresById({});
				setPartidosById({});
				setTemporadaAbierta(null);
			} finally {
				if (activo) {
					setCargando(false);
				}
			}
		};

		cargarTrayectoria();

		return () => {
			activo = false;
		};
	}, [equipoId]);

	const trayectoriaOrdenada = useMemo(() => {
		const copy = [...trayectoria];

		copy.sort((a, b) => {
			const av = toNumber(a[sortKey]);
			const bv = toNumber(b[sortKey]);

			if (sortDir === 'asc') {
				if (av !== bv) return av - bv;
				return toNumber(a.temporada) - toNumber(b.temporada);
			}

			if (av !== bv) return bv - av;
			return toNumber(b.temporada) - toNumber(a.temporada);
		});

		return copy;
	}, [trayectoria, sortKey, sortDir]);

	const alternarTemporada = (temporada) => {
		setTemporadaAbierta((prev) => (prev === temporada ? null : temporada));
	};

	const cambiarOrden = (key) => {
		if (sortKey === key) {
			setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
			return;
		}

		setSortKey(key);
		setSortDir('desc');
	};

	const renderJugadorDestacado = (label, jugadorId, nombreFallback, valor, tipoValor) => {
		const jugador = jugadoresById[Number(jugadorId)] || null;
		const nombre = jugador?.nombre || nombreFallback || '-';
		const foto = jugador?.foto || null;
		const jugadorIdNum = Number(jugadorId);
		const tieneId = Number.isFinite(jugadorIdNum) && jugadorIdNum > 0;

		return (
			<TouchableOpacity
				style={[styles.jugadorCard, !tieneId && styles.jugadorCardDisabled]}
				onPress={() =>
					tieneId ? navigation.navigate('DetalleJugador', { id_jugador: jugadorIdNum }) : null
				}
				activeOpacity={0.85}
				disabled={!tieneId}
			>
				<View style={styles.jugadorHeader}>
					<Text style={styles.jugadorLabel}>{label}</Text>
				</View>
				<View style={styles.jugadorRow}>
					{foto ? (
						<Image source={{ uri: foto }} style={styles.jugadorFoto} />
					) : (
						<View style={styles.jugadorFotoFallback}>
							<Ionicons name="person-outline" size={14} color="#6b86a1" />
						</View>
					)}
					<View style={styles.jugadorInfo}>
						<Text style={styles.jugadorNombre} numberOfLines={1}>
							{nombre}
						</Text>
						<Text style={styles.jugadorValor}>
							{tipoValor === 'rating' ? `Rating ${formatRating(valor)}` : `${valor ?? '-'}`}
						</Text>
					</View>
				</View>
			</TouchableOpacity>
		);
	};

	if (cargando) {
		return (
			<View style={styles.estadoPantalla}>
				<ActivityIndicator size="small" color="#1f6fa7" />
				<Text style={styles.estadoTexto}>Cargando trayectoria...</Text>
			</View>
		);
	}

	if (error) {
		return (
			<View style={styles.estadoPantalla}>
				<Ionicons name="alert-circle-outline" size={18} color="#5f7f9b" />
				<Text style={styles.estadoTexto}>{error}</Text>
			</View>
		);
	}

	return (
		<ScrollView style={styles.container} contentContainerStyle={styles.containerContent}>
			<View style={styles.topBar}>
				<Text style={styles.title}>Trayectoria del equipo</Text>
				<Text style={styles.subtitle}>Clasificacion por temporada</Text>
			</View>

			{trayectoriaOrdenada.length === 0 ? (
				<View style={styles.emptyRow}>
					<Ionicons name="stats-chart-outline" size={18} color="#6d839a" />
					<Text style={styles.emptyText}>No hay registros de trayectoria</Text>
				</View>
			) : (
				<View style={styles.tablaWrap}>
					<ScrollView horizontal showsHorizontalScrollIndicator={false}>
						<View>
							<View style={styles.headerRow}>
								{COLUMNAS.map((col) => {
									const active = sortKey === col.key;

									return (
										<TouchableOpacity
											key={col.key}
											style={[styles.headerCell, active && styles.headerCellActive]}
											onPress={() => cambiarOrden(col.key)}
											activeOpacity={0.85}
										>
											<Text style={[styles.headerText, active && styles.headerTextActive]}>{col.label}</Text>
											{active ? (
												<Ionicons
													name={sortDir === 'desc' ? 'chevron-down' : 'chevron-up'}
													size={12}
													color="#ffffff"
												/>
											) : null}
										</TouchableOpacity>
									);
								})}
								<View style={[styles.headerCell, styles.detailCell]}>
									<Text style={styles.headerText}>Detalle</Text>
								</View>
							</View>

							{trayectoriaOrdenada.map((row, idx) => {
								const abierta = temporadaAbierta === row.temporada;

								return (
									<View key={`temp-${row.temporada}-${idx}`}>
										<TouchableOpacity
											style={[styles.dataRow, idx % 2 === 1 && styles.filaAlt]}
											onPress={() => alternarTemporada(row.temporada)}
											activeOpacity={0.8}
										>
											{COLUMNAS.map((col) => (
												<View key={col.key} style={styles.dataCell}>
													<Text style={styles.dataText}>{formatNumero(row[col.key])}</Text>
												</View>
											))}
											<View style={[styles.dataCell, styles.detailCell]}>
												<Ionicons
													name={abierta ? 'chevron-up' : 'chevron-down'}
													size={16}
													color="#1f4f7a"
												/>
											</View>
										</TouchableOpacity>

										{abierta ? (
											<View style={styles.detalleRow}>
												<View style={styles.detalleHeader}>
													<Ionicons name="person-circle-outline" size={18} color="#1f4f7a" />
													<Text style={styles.detalleTitulo}>Jugadores destacados</Text>
												</View>

												<View style={styles.detalleGrid}>
													{renderJugadorDestacado(
														'MVP',
														row.mvp_id_jugador,
														row.mvp_nombre,
														row.mvp_rating,
														'rating'
													)}
													{renderJugadorDestacado(
														'Max. goleador',
														row.goleador_id_jugador,
														row.goleador_nombre,
														`Goles ${formatNumero(row.goleador_goles)}`,
														'text'
													)}
													{renderJugadorDestacado(
														'Mas minutos',
														row.minutos_id_jugador,
														row.minutos_nombre,
														`Min ${formatNumero(row.minutos_minutos)}`,
														'text'
													)}
												</View>

												<View style={styles.mejorPartidoRow}>
													<View style={styles.mejorPartidoLabel}>
														<Ionicons name="trophy-outline" size={16} color="#1f4f7a" />
														<Text style={styles.mejorPartidoTexto}>Mejor partido</Text>
													</View>

													{row.mejor_partido_id_partido ? (
														<TouchableOpacity
															style={styles.partidoCard}
															onPress={() =>
																navigation.navigate('DetallePartido', {
																	id_partido: row.mejor_partido_id_partido,
																})
															}
															activeOpacity={0.85}
														>
															<View style={styles.partidoRow}>
																<View style={styles.partidoEquipo}>
																	{partidosById[row.mejor_partido_id_partido]?.logo_local ? (
																		<Image
																			source={{ uri: partidosById[row.mejor_partido_id_partido]?.logo_local }}
																			style={styles.partidoLogo}
																		/>
																	) : (
																		<View style={styles.partidoLogoFallback}>
																			<Ionicons name="shield-outline" size={14} color="#6b86a1" />
																		</View>
																	)}
																	<Text style={styles.partidoNombre} numberOfLines={1}>
																		{partidosById[row.mejor_partido_id_partido]?.equipo_local || '-'}
																	</Text>
																</View>

																<View style={styles.partidoCentro}>
																	<Text style={styles.partidoVs}>vs</Text>
																	<Text style={styles.partidoResultado}>
																		{`${partidosById[row.mejor_partido_id_partido]?.goles_local ?? '-'} - ${
																			partidosById[row.mejor_partido_id_partido]?.goles_visitante ?? '-'
																		}`}
																	</Text>
																	<Text style={styles.partidoRating}>
																		Rating {formatRating(row.mejor_partido_rating)}
																	</Text>
																</View>

																<View style={[styles.partidoEquipo, styles.partidoEquipoDerecha]}>
																	<Text style={styles.partidoNombreDerecha} numberOfLines={1}>
																		{partidosById[row.mejor_partido_id_partido]?.equipo_visitante || '-'}
																	</Text>
																	{partidosById[row.mejor_partido_id_partido]?.logo_visitante ? (
																		<Image
																			source={{ uri: partidosById[row.mejor_partido_id_partido]?.logo_visitante }}
																			style={styles.partidoLogo}
																		/>
																	) : (
																		<View style={styles.partidoLogoFallback}>
																			<Ionicons name="shield-outline" size={14} color="#6b86a1" />
																		</View>
																	)}
																</View>
															</View>

															<Text style={styles.partidoFecha}>
																{partidosById[row.mejor_partido_id_partido]?.dia ?? '-'}{' '}
																{partidosById[row.mejor_partido_id_partido]?.nombre_mes ?? ''}{' '}
																{partidosById[row.mejor_partido_id_partido]?.anio ?? ''}
															</Text>
														</TouchableOpacity>
													) : (
														<Text style={styles.mejorPartidoValor}>Sin datos</Text>
													)}
												</View>
											</View>
										) : null}
									</View>
								);
							})}
						</View>
					</ScrollView>
				</View>
			)}
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f4f8fc',
	},
	containerContent: {
		paddingHorizontal: 12,
		paddingTop: 10,
		paddingBottom: 24,
	},
	topBar: {
		marginBottom: 10,
	},
	title: {
		fontSize: 17,
		fontWeight: '800',
		color: '#12233f',
	},
	subtitle: {
		marginTop: 2,
		fontSize: 12,
		color: '#55708d',
		fontWeight: '600',
	},
	tablaWrap: {
		borderRadius: 12,
		overflow: 'hidden',
		borderWidth: 1,
		borderColor: '#d2e0ec',
		backgroundColor: '#ffffff',
	},
	headerRow: {
		flexDirection: 'row',
		alignItems: 'center',
		height: 40,
		borderBottomWidth: 1,
		borderBottomColor: '#d2e0ec',
		backgroundColor: '#edf3f9',
	},
	headerCell: {
		width: COL_WIDTH,
		height: 40,
		alignItems: 'center',
		justifyContent: 'center',
		flexDirection: 'row',
		gap: 3,
	},
	headerCellActive: {
		backgroundColor: '#1f4f7a',
	},
	headerText: {
		color: '#1f4f7a',
		fontSize: 12,
		fontWeight: '700',
	},
	headerTextActive: {
		color: '#ffffff',
	},
	detailCell: {
		width: DETAIL_WIDTH,
	},
	dataRow: {
		flexDirection: 'row',
		alignItems: 'center',
		height: 46,
		borderBottomWidth: 1,
		borderBottomColor: '#eef3f7',
		backgroundColor: '#ffffff',
	},
	filaAlt: {
		backgroundColor: '#f8fbff',
	},
	dataCell: {
		width: COL_WIDTH,
		height: 46,
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 4,
	},
	dataText: {
		fontSize: 12,
		color: '#1d3850',
		fontWeight: '700',
	},
	detalleRow: {
		paddingHorizontal: 12,
		paddingTop: 10,
		paddingBottom: 12,
		backgroundColor: '#f7fbff',
		borderBottomWidth: 1,
		borderBottomColor: '#eef3f7',
	},
	detalleHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		marginBottom: 10,
	},
	detalleTitulo: {
		fontSize: 13,
		fontWeight: '800',
		color: '#1f4f7a',
	},
	detalleGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 10,
	},
	jugadorCard: {
		width: 190,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: '#dbe7f2',
		backgroundColor: '#ffffff',
		padding: 10,
	},
	jugadorCardDisabled: {
		opacity: 0.7,
	},
	jugadorHeader: {
		marginBottom: 6,
	},
	jugadorLabel: {
		fontSize: 12,
		fontWeight: '700',
		color: '#2a4763',
	},
	jugadorRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	jugadorFoto: {
		width: 28,
		height: 28,
		borderRadius: 14,
		resizeMode: 'cover',
	},
	jugadorFotoFallback: {
		width: 28,
		height: 28,
		borderRadius: 14,
		backgroundColor: '#ecf2f8',
		alignItems: 'center',
		justifyContent: 'center',
	},
	jugadorInfo: {
		flex: 1,
	},
	jugadorNombre: {
		fontSize: 12,
		fontWeight: '700',
		color: '#1d3850',
	},
	jugadorValor: {
		marginTop: 2,
		fontSize: 11,
		color: '#5b748c',
		fontWeight: '600',
	},
	mejorPartidoRow: {
		marginTop: 12,
		paddingTop: 10,
		borderTopWidth: 1,
		borderTopColor: '#e5eef7',
	},
	mejorPartidoLabel: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		marginBottom: 6,
	},
	mejorPartidoTexto: {
		fontSize: 12,
		fontWeight: '700',
		color: '#2a4763',
	},
	mejorPartidoValor: {
		fontSize: 12,
		color: '#1d3850',
		fontWeight: '700',
	},
	partidoCard: {
		borderRadius: 12,
		borderWidth: 1,
		borderColor: '#dbe7f2',
		backgroundColor: '#ffffff',
		paddingVertical: 10,
		paddingHorizontal: 12,
	},
	partidoRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	partidoEquipo: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
	},
	partidoEquipoDerecha: {
		justifyContent: 'flex-end',
	},
	partidoLogo: {
		width: 22,
		height: 22,
		resizeMode: 'contain',
	},
	partidoLogoFallback: {
		width: 22,
		height: 22,
		borderRadius: 11,
		backgroundColor: '#ecf2f8',
		alignItems: 'center',
		justifyContent: 'center',
	},
	partidoNombre: {
		fontSize: 12,
		fontWeight: '700',
		color: '#1d3850',
		maxWidth: 90,
	},
	partidoNombreDerecha: {
		fontSize: 12,
		fontWeight: '700',
		color: '#1d3850',
		textAlign: 'right',
		maxWidth: 90,
	},
	partidoCentro: {
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 6,
	},
	partidoVs: {
		fontSize: 11,
		fontWeight: '700',
		color: '#5b748c',
	},
	partidoResultado: {
		marginTop: 2,
		fontSize: 12,
		fontWeight: '800',
		color: '#1d3850',
	},
	partidoRating: {
		marginTop: 2,
		fontSize: 11,
		fontWeight: '700',
		color: '#1f4f7a',
	},
	partidoFecha: {
		marginTop: 8,
		fontSize: 11,
		fontWeight: '600',
		color: '#5b748c',
		textAlign: 'center',
	},
	emptyRow: {
		backgroundColor: '#ffffff',
		borderRadius: 14,
		borderWidth: 1,
		borderColor: '#d9e5f0',
		paddingVertical: 22,
		alignItems: 'center',
		justifyContent: 'center',
	},
	emptyText: {
		marginTop: 6,
		color: '#5f7f9b',
		fontWeight: '600',
		fontSize: 13,
	},
	estadoPantalla: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: '#f4f8fc',
	},
	estadoTexto: {
		marginTop: 6,
		color: '#5f7f9b',
		fontWeight: '600',
		fontSize: 13,
	},
});
