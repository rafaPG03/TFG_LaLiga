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

const INFO_FIELDS = [
    { key: 'nombre_completo', label: 'Nombre completo' },
    { key: 'edad', label: 'Edad' },
    { key: 'fecha_nacimiento', label: 'Fecha nacimiento' },
    { key: 'lugar_nacimiento', label: 'Lugar nacimiento' },
    { key: 'pais_nacimiento', label: 'Pais nacimiento' },
    { key: 'nacionalidad', label: 'Nacionalidad' },
    { key: 'altura', label: 'Altura (cm)' },
    { key: 'peso', label: 'Peso (kg)' },
];

const TRAYECTORIA_COLUMNAS = [
    { key: 'partidos', label: 'PJ' },
    { key: 'goles', label: 'G' },
    { key: 'rating', label: 'Rating' },
    { key: 'temporadas', label: 'Temp.' },
];

const getNumero = (valor) => {
    const n = Number(valor);
    return Number.isFinite(n) ? n : 0;
};

const formatearRating = (valor) => {
    const n = Number(valor);
    return Number.isFinite(n) ? n.toFixed(2) : '-';
};

const formatFechaNacimiento = (valor) => {
    if (!valor) return '-';
    const texto = String(valor).trim();
    if (texto.includes('T')) return texto.split('T')[0];
    if (texto.includes(' ')) return texto.split(' ')[0];
    return texto;
};

const formatFechaPartido = (partido) => {
    if (!partido) return '-';
    if (partido.fecha_iso) return partido.fecha_iso;
    return '-';
};

const detectarPortero = (posicion = '') => {
    const p = String(posicion).trim().toLowerCase();
    return p.includes('portero') || p.includes('goalkeeper') || p.includes('keeper');
};

const getResultado = (partido, idEquipo) => {
    if (!partido || !idEquipo) return '-';
    const esLocal = Number(partido.id_local) === Number(idEquipo);
    const golesPropios = esLocal ? partido.goles_local : partido.goles_visitante;
    const golesRival = esLocal ? partido.goles_visitante : partido.goles_local;

    if (!Number.isFinite(Number(golesPropios)) || !Number.isFinite(Number(golesRival))) {
        return '-';
    }

    if (golesPropios > golesRival) return 'V';
    if (golesPropios < golesRival) return 'D';
    return 'E';
};

export default function InfoJugador({ id_jugador, route }) {
    const navigation = useNavigation();
    const jugadorId = id_jugador ?? route?.params?.id_jugador ?? route?.params?.idjugador;
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [infoJugador, setInfoJugador] = useState(null);
    const [actualidad, setActualidad] = useState({
        id_equipo_actual: null,
        ultimos_partidos: [],
        proximo_partido: null,
    });
    const [rendimiento, setRendimiento] = useState(null);
    const [trayectoria, setTrayectoria] = useState([]);
    const [mejoresPartidos, setMejoresPartidos] = useState([]);
    const [companeros, setCompaneros] = useState([]);
    const [sortKey, setSortKey] = useState('partidos');
    const [sortDir, setSortDir] = useState('desc');

    useEffect(() => {
        let activo = true;

        const cargarDatos = async () => {
            try {
                setCargando(true);
                setError('');

                if (!jugadorId) {
                    setInfoJugador(null);
                    setActualidad({ id_equipo_actual: null, ultimos_partidos: [], proximo_partido: null });
                    setRendimiento(null);
                    setTrayectoria([]);
                    setMejoresPartidos([]);
                    setCompaneros([]);
                    return;
                }

                const [resInfo, resActualidad, resRendimiento, resTrayectoria, resMejores, resCompaneros] =
                    await Promise.all([
                        fetch(`${process.env.EXPO_PUBLIC_API_URL}/jugadores/info/${jugadorId}`),
                        fetch(`${process.env.EXPO_PUBLIC_API_URL}/jugadores/${jugadorId}/actualidad`),
                        fetch(`${process.env.EXPO_PUBLIC_API_URL}/jugadores/${jugadorId}/rendimiento`),
                        fetch(`${process.env.EXPO_PUBLIC_API_URL}/jugadores/${jugadorId}/trayectoria-equipos`),
                        fetch(`${process.env.EXPO_PUBLIC_API_URL}/jugadores/${jugadorId}/mejores-partidos`),
                        fetch(`${process.env.EXPO_PUBLIC_API_URL}/jugadores/${jugadorId}/mejores-companeros`),
                    ]);

                if (!resInfo.ok) {
                    throw new Error('No se pudo cargar la informacion del jugador');
                }

                const dataInfo = await resInfo.json();
                const dataActualidad = resActualidad.ok ? await resActualidad.json() : null;
                const dataRendimiento = resRendimiento.ok ? await resRendimiento.json() : null;
                const dataTrayectoria = resTrayectoria.ok ? await resTrayectoria.json() : [];
                const dataMejores = resMejores.ok ? await resMejores.json() : [];
                const dataCompaneros = resCompaneros.ok ? await resCompaneros.json() : [];

                if (!activo) return;

                setInfoJugador(dataInfo || null);
                setActualidad(
                    dataActualidad || { id_equipo_actual: null, ultimos_partidos: [], proximo_partido: null }
                );
                setRendimiento(dataRendimiento || null);
                setTrayectoria(Array.isArray(dataTrayectoria) ? dataTrayectoria : []);
                setMejoresPartidos(Array.isArray(dataMejores) ? dataMejores : []);
                setCompaneros(Array.isArray(dataCompaneros) ? dataCompaneros : []);
            } catch (_e) {
                if (!activo) return;
                setError('No se pudo cargar la informacion del jugador');
            } finally {
                if (activo) setCargando(false);
            }
        };

        cargarDatos();

        return () => {
            activo = false;
        };
    }, [jugadorId]);

    const trayectoriaOrdenada = useMemo(() => {
        const copy = [...trayectoria];
        copy.sort((a, b) => {
            const av = getNumero(a[sortKey]);
            const bv = getNumero(b[sortKey]);

            if (sortDir === 'asc') {
                if (av !== bv) return av - bv;
                return getNumero(a.partidos) - getNumero(b.partidos);
            }

            if (av !== bv) return bv - av;
            return getNumero(b.partidos) - getNumero(a.partidos);
        });
        return copy;
    }, [trayectoria, sortKey, sortDir]);

    const cambiarOrden = (key) => {
        if (sortKey === key) {
            setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
            return;
        }
        setSortKey(key);
        setSortDir('desc');
    };

    if (cargando) {
        return (
            <View style={styles.estadoPantalla}>
                <ActivityIndicator size="small" color="#1f6fa7" />
                <Text style={styles.estadoTexto}>Cargando informacion...</Text>
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

    const idEquipoActual = actualidad?.id_equipo_actual || null;
    const ultimosPartidos = Array.isArray(actualidad?.ultimos_partidos)
        ? actualidad.ultimos_partidos
        : [];
    const proximoPartido = actualidad?.proximo_partido || null;
    const esPortero = detectarPortero(infoJugador?.posicion);

    const renderPartidoTarjeta = ({ partido, mostrarRating, mostrarResultado, etiqueta }) => {
        if (!partido) return null;

        const golesLocal = Number(partido.goles_local);
        const golesVisitante = Number(partido.goles_visitante);
        const estaIncompleto =
            !Number.isFinite(golesLocal) ||
            !Number.isFinite(golesVisitante) ||
            (partido.status && partido.status !== 'Completado');
        const resultado = mostrarResultado ? getResultado(partido, idEquipoActual) : null;
        const fecha = formatFechaPartido(partido);

        return (
            <TouchableOpacity
                key={`partido-${partido.id_partido}-${etiqueta || 'base'}`}
                style={styles.tarjetaPartido}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('DetallePartido', { id_partido: partido.id_partido })}
            >
                <View style={styles.columnaContenido}>
                    <View style={styles.cabeceraCentro}>
                        {etiqueta ? (
                            <View style={styles.cabeceraPill}>
                                <Text style={styles.cabeceraTexto}>{etiqueta}</Text>
                            </View>
                        ) : null}
                        {mostrarResultado ? (
                            <View style={styles.cabeceraPillSecundaria}>
                                <Text style={styles.cabeceraTexto}>Resultado {resultado}</Text>
                            </View>
                        ) : null}
                        {mostrarRating ? (
                            <View style={styles.ratingPill}>
                                <Text style={styles.ratingTexto}>Rating {formatearRating(partido.nota)}</Text>
                            </View>
                        ) : null}
                    </View>

                    <View style={styles.filaEquipos}>
                        <View style={styles.equipoBloque}>
                            <TouchableOpacity
                                style={styles.equipoFila}
                                activeOpacity={0.8}
                                onPress={() => navigation.navigate('DetalleEquipo', { idEquipo: partido.id_local })}
                            >
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
                            </TouchableOpacity>
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
                            <TouchableOpacity
                                style={styles.equipoFilaDerecha}
                                activeOpacity={0.8}
                                onPress={() => navigation.navigate('DetalleEquipo', { idEquipo: partido.id_visitante })}
                            >
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
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.piePartido}>
                        <Text style={styles.fechaTexto}>{fecha}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.containerContent}>
            <View style={styles.seccion}>
                <Text style={styles.seccionTitulo}>INFORMACION DEL JUGADOR</Text>
                <View style={styles.card}>
                    {INFO_FIELDS.map((field) => (
                        <View key={field.key} style={styles.infoRow}>
                            <Text style={styles.infoLabel}>{field.label}</Text>
                            <Text style={styles.infoValue}>
                                {field.key === 'fecha_nacimiento'
                                    ? formatFechaNacimiento(infoJugador?.[field.key])
                                    : infoJugador?.[field.key] ?? '-'}
                            </Text>
                        </View>
                    ))}
                </View>
            </View>

            <View style={styles.seccion}>
                <Text style={styles.seccionTitulo}>ACTUALIDAD</Text>
                <View style={styles.card}>
                    <Text style={styles.subtitulo}>Ultimos partidos</Text>
                    {ultimosPartidos.length === 0 ? (
                        <Text style={styles.emptyText}>No hay partidos recientes</Text>
                    ) : (
                        <View style={styles.listaPartidosCompacta}>
                            {ultimosPartidos.map((partido) =>
                                renderPartidoTarjeta({
                                    partido,
                                    mostrarRating: true,
                                    mostrarResultado: false,
                                })
                            )}
                        </View>
                    )}

                    <View style={styles.divider} />
                    <Text style={styles.subtitulo}>Proximo partido</Text>
                    {proximoPartido ? (
                        renderPartidoTarjeta({
                            partido: proximoPartido,
                            mostrarRating: false,
                            mostrarResultado: false,
                            etiqueta: 'Proximo',
                        })
                    ) : (
                        <Text style={styles.emptyText}>Sin proximo partido</Text>
                    )}
                </View>
            </View>

            <View style={styles.seccion}>
                <Text style={styles.seccionTitulo}>RENDIMIENTO ACTUAL</Text>
                <View style={styles.card}>
                    {rendimiento ? (
                        <View style={styles.rendimientoGrid}>
                            <View style={styles.rendimientoItem}>
                                <Text style={styles.rendimientoLabel}>Temporada</Text>
                                <Text style={styles.rendimientoValue}>{rendimiento.temporada ?? '-'}</Text>
                            </View>
                            <View style={styles.rendimientoItem}>
                                <Text style={styles.rendimientoLabel}>Partidos</Text>
                                <Text style={styles.rendimientoValue}>{rendimiento.partidos ?? '-'}</Text>
                            </View>
                            <View style={styles.rendimientoItem}>
                                <Text style={styles.rendimientoLabel}>Nota media</Text>
                                <Text style={styles.rendimientoValue}>{formatearRating(rendimiento.nota_media)}</Text>
                            </View>
                            <View style={styles.rendimientoItem}>
                                <Text style={styles.rendimientoLabel}>Goles</Text>
                                <Text style={styles.rendimientoValue}>{rendimiento.goles ?? '-'}</Text>
                            </View>
                            <View style={styles.rendimientoItem}>
                                <Text style={styles.rendimientoLabel}>Asistencias</Text>
                                <Text style={styles.rendimientoValue}>{rendimiento.asistencias ?? '-'}</Text>
                            </View>
                            {esPortero ? (
                                <View style={styles.rendimientoItem}>
                                    <Text style={styles.rendimientoLabel}>Porterias imbatidas</Text>
                                    <Text style={styles.rendimientoValue}>{rendimiento.porterias_imbatidas ?? '-'}</Text>
                                </View>
                            ) : null}
                        </View>
                    ) : (
                        <Text style={styles.emptyText}>Sin datos de rendimiento</Text>
                    )}
                </View>
            </View>

            <View style={styles.seccion}>
                <Text style={styles.seccionTitulo}>TRAYECTORIA</Text>
                <View style={styles.card}>
                    <View style={styles.trayectoriaHeader}>
                        <Text style={styles.subtitulo}>Equipos</Text>
                        <Text style={styles.subtituloPeq}>
                            Orden: {TRAYECTORIA_COLUMNAS.find((c) => c.key === sortKey)?.label || 'PJ'} (
                            {sortDir})
                        </Text>
                    </View>

                    {trayectoriaOrdenada.length === 0 ? (
                        <Text style={styles.emptyText}>No hay trayectoria disponible</Text>
                    ) : (
                        <View style={styles.tablaWrap}>
                            <View style={styles.tablaGrid}>
                                <View style={styles.columnaEquipoFija}>
                                    <View style={styles.headerCeldaEquipo}>
                                        <Text style={[styles.headerText, styles.headerEquipoText]}>Equipo</Text>
                                    </View>

                                    {trayectoriaOrdenada.map((row, idx) => (
                                        <TouchableOpacity
                                            key={`tray-equipo-${row.id_equipo}`}
                                            style={[styles.filaEquipoFija, idx % 2 === 1 && styles.filaAlt]}
                                            activeOpacity={0.8}
                                            onPress={() => navigation.navigate('DetalleEquipo', { idEquipo: row.id_equipo })}
                                        >
                                            {row.logo ? (
                                                <Image source={{ uri: row.logo }} style={styles.logo} />
                                            ) : (
                                                <View style={styles.logoFallback}>
                                                    <Ionicons name="shield-outline" size={14} color="#6b86a1" />
                                                </View>
                                            )}
                                            <Text style={styles.teamName} numberOfLines={1}>
                                                {row.nombre_equipo || `Equipo ${row.id_equipo ?? '-'}`}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    <View style={styles.columnaStats}>
                                        <View style={styles.headerStatsRow}>
                                            {TRAYECTORIA_COLUMNAS.map((col) => {
                                                const active = sortKey === col.key;
                                                return (
                                                    <TouchableOpacity
                                                        key={col.key}
                                                        style={[
                                                            styles.headerCeldaStat,
                                                            active && styles.headerCeldaStatActive,
                                                        ]}
                                                        onPress={() => cambiarOrden(col.key)}
                                                        activeOpacity={0.85}
                                                    >
                                                        <Text
                                                            style={[
                                                                styles.headerText,
                                                                active && styles.headerTextActive,
                                                            ]}
                                                        >
                                                            {col.label}
                                                        </Text>
                                                        {active ? (
                                                            <Ionicons
                                                                name={sortDir === 'desc' ? 'chevron-down' : 'chevron-up'}
                                                                size={14}
                                                                color="#ffffff"
                                                            />
                                                        ) : null}
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </View>

                                        {trayectoriaOrdenada.map((row, idx) => (
                                            <View
                                                key={`tray-stats-${row.id_equipo}`}
                                                style={[styles.filaStats, idx % 2 === 1 && styles.filaAlt]}
                                            >
                                                {TRAYECTORIA_COLUMNAS.map((col) => (
                                                    <View key={col.key} style={styles.cellStat}>
                                                        <Text style={styles.statValue}>
                                                            {col.key === 'rating'
                                                                ? formatearRating(row.rating)
                                                                : row[col.key] ?? '-'}
                                                        </Text>
                                                    </View>
                                                ))}
                                            </View>
                                        ))}
                                    </View>
                                </ScrollView>
                            </View>
                        </View>
                    )}
                </View>
            </View>

            <View style={styles.seccion}>
                <Text style={styles.seccionTitulo}>MEJORES PARTIDOS</Text>
                <View style={styles.card}>
                    {mejoresPartidos.length === 0 ? (
                        <Text style={styles.emptyText}>No hay mejores partidos</Text>
                    ) : (
                        <View style={styles.listaPartidosCompacta}>
                            {mejoresPartidos.map((partido) =>
                                renderPartidoTarjeta({
                                    partido,
                                    mostrarRating: true,
                                    mostrarResultado: false,
                                })
                            )}
                        </View>
                    )}
                </View>
            </View>

            <View style={styles.seccion}>
                <Text style={styles.seccionTitulo}>MEJORES COMPAÑEROS</Text>
                <View style={styles.card}>
                    {companeros.length === 0 ? (
                        <Text style={styles.emptyText}>No hay compañeros destacados</Text>
                    ) : (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View style={styles.companerosRow}>
                                {companeros.map((item) => (
                                    <TouchableOpacity
                                        key={`comp-${item.id_jugador}`}
                                        style={styles.companeroCard}
                                        activeOpacity={0.8}
                                        onPress={() => navigation.navigate('DetalleJugador', { id_jugador: item.id_jugador })}
                                    >
                                        {item.foto ? (
                                            <Image source={{ uri: item.foto }} style={styles.companeroFoto} />
                                        ) : (
                                            <View style={styles.companeroFotoFallback}>
                                                <Ionicons name="person" size={20} color="#6b86a1" />
                                            </View>
                                        )}
                                        <Text style={styles.companeroNombre} numberOfLines={1}>
                                            {item.nombre || '-'}
                                        </Text>
                                        <Text style={styles.companeroPartidos}>{item.partidos_juntos ?? 0} PJ</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>
                    )}
                </View>
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
        paddingBottom: 26,
        gap: 14,
    },
    seccion: {
        gap: 8,
    },
    seccionTitulo: {
        fontSize: 12,
        fontWeight: '800',
        color: '#1f3c5a',
        letterSpacing: 0.6,
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#dbe6f0',
        padding: 12,
        gap: 10,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 8,
    },
    infoLabel: {
        color: '#5b728a',
        fontSize: 12,
        fontWeight: '600',
    },
    infoValue: {
        color: '#12233f',
        fontSize: 12,
        fontWeight: '700',
        textAlign: 'right',
        flex: 1,
    },
    subtitulo: {
        fontSize: 13,
        fontWeight: '700',
        color: '#163a5b',
    },
    subtituloPeq: {
        fontSize: 11,
        color: '#6a8197',
        fontWeight: '600',
    },
    emptyText: {
        fontSize: 12,
        color: '#6a8197',
        fontWeight: '600',
    },
    listaPartidosCompacta: {
        gap: 8,
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
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginBottom: 4,
    },
    cabeceraPill: {
        backgroundColor: '#edf3f9',
        borderRadius: 999,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    cabeceraPillSecundaria: {
        backgroundColor: '#e4eef8',
        borderRadius: 999,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    cabeceraTexto: {
        fontSize: 10,
        fontWeight: '700',
        color: '#32506f',
    },
    ratingPill: {
        backgroundColor: '#1f4f7a',
        borderRadius: 999,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    ratingTexto: {
        fontSize: 10,
        fontWeight: '700',
        color: '#ffffff',
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
    horaTexto: {
        fontSize: 10,
        color: '#6c8299',
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: '#edf3f9',
        marginVertical: 6,
    },
    rendimientoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    rendimientoItem: {
        width: '48%',
        backgroundColor: '#f3f7fb',
        borderRadius: 10,
        padding: 8,
        borderWidth: 1,
        borderColor: '#e3ecf4',
    },
    rendimientoLabel: {
        fontSize: 10,
        color: '#5b728a',
        fontWeight: '600',
        marginBottom: 4,
    },
    rendimientoValue: {
        fontSize: 13,
        fontWeight: '800',
        color: '#12233f',
    },
    trayectoriaHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    tablaWrap: {
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#d2e0ec',
        backgroundColor: '#ffffff',
    },
    tablaGrid: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    columnaEquipoFija: {
        width: 170,
        borderRightWidth: 1,
        borderRightColor: '#d2e0ec',
        backgroundColor: '#ffffff',
    },
    columnaStats: {
        backgroundColor: '#ffffff',
    },
    headerCeldaEquipo: {
        width: 170,
        height: 40,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#d2e0ec',
        backgroundColor: '#edf3f9',
    },
    headerStatsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 40,
        borderBottomWidth: 1,
        borderBottomColor: '#d2e0ec',
        backgroundColor: '#edf3f9',
    },
    headerCeldaStat: {
        width: 76,
        height: 40,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
    },
    headerCeldaStatActive: {
        backgroundColor: '#1f4f7a',
    },
    filaEquipoFija: {
        width: 170,
        height: 46,
        paddingHorizontal: 10,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#eef3f7',
    },
    filaStats: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 46,
        borderBottomWidth: 1,
        borderBottomColor: '#eef3f7',
    },
    filaAlt: {
        backgroundColor: '#f8fbff',
    },
    cellStat: {
        width: 76,
        height: 46,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerText: {
        color: '#1f4f7a',
        fontSize: 12,
        fontWeight: '700',
    },
    headerEquipoText: {
        color: '#2f4a63',
    },
    headerTextActive: {
        color: '#ffffff',
    },
    logo: {
        width: 20,
        height: 20,
        resizeMode: 'contain',
        marginRight: 8,
    },
    logoFallback: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#ecf2f8',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
    },
    teamName: {
        flex: 1,
        fontSize: 12,
        color: '#1d3850',
        fontWeight: '700',
    },
    statValue: {
        fontSize: 12,
        color: '#1d3850',
        fontWeight: '700',
    },
    companerosRow: {
        flexDirection: 'row',
        gap: 10,
    },
    companeroCard: {
        width: 110,
        alignItems: 'center',
        padding: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e3ecf4',
        backgroundColor: '#f7fafc',
    },
    companeroFoto: {
        width: 44,
        height: 44,
        borderRadius: 22,
        marginBottom: 6,
    },
    companeroFotoFallback: {
        width: 44,
        height: 44,
        borderRadius: 22,
        marginBottom: 6,
        backgroundColor: '#e8edf2',
        alignItems: 'center',
        justifyContent: 'center',
    },
    companeroNombre: {
        fontSize: 11,
        fontWeight: '700',
        color: '#12233f',
        textAlign: 'center',
    },
    companeroPartidos: {
        fontSize: 10,
        color: '#5b728a',
        fontWeight: '600',
        marginTop: 4,
    },
    estadoPantalla: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#f4f8fc',
    },
    estadoTexto: {
        color: '#4f6782',
        fontSize: 13,
        fontWeight: '600',
    },
});