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
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function PartidosJugador({ id_jugador, route }) {
    const jugadorId = id_jugador ?? route?.params?.id_jugador ?? route?.params?.idjugador;

    const navegacion = useNavigation();
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [partidos, setPartidos] = useState([]);
    const [temporadasDisponibles, setTemporadasDisponibles] = useState([]);
    const [temporadaSeleccionada, setTemporadaSeleccionada] = useState(null);

    const getNumero = (valor) => {
        const n = Number(valor);
        return Number.isFinite(n) ? n : 0;
    };

    const obtenerPartidos = async (temporada) => {
        const queryTemporada = temporada ? `?temporada=${temporada}` : '';
        const response = await fetch(
            `${process.env.EXPO_PUBLIC_API_URL}/jugadores/partidos/${jugadorId}${queryTemporada}`
        );

        if (!response.ok) {
            throw new Error('No se pudieron cargar los partidos del jugador');
        }

        const data = await response.json();
        return Array.isArray(data) ? data : [];
    };

    const cargarInicial = async () => {
        try {
            setCargando(true);
            setError('');

            if (!jugadorId) {
                setPartidos([]);
                setTemporadasDisponibles([]);
                setTemporadaSeleccionada(null);
                return;
            }

            const partidosSinFiltro = await obtenerPartidos();

            const temporadas = [
                ...new Set(
                    partidosSinFiltro
                        .map((partido) => Number(partido.temporada))
                        .filter((temp) => Number.isFinite(temp))
                ),
            ].sort((a, b) => b - a);

            setTemporadasDisponibles(temporadas);

            if (temporadas.length > 0) {
                const temporadaPorDefecto = temporadas[0];
                setTemporadaSeleccionada(temporadaPorDefecto);
                const partidosFiltrados = await obtenerPartidos(temporadaPorDefecto);
                setPartidos(partidosFiltrados);
            } else {
                setTemporadaSeleccionada(null);
                setPartidos([]);
            }
        } catch (e) {
            setError('No se pudieron obtener los partidos del jugador');
            setPartidos([]);
            setTemporadasDisponibles([]);
            setTemporadaSeleccionada(null);
        } finally {
            setCargando(false);
        }
    };

    const seleccionarTemporada = async (temporada) => {
        if (temporada === temporadaSeleccionada || !jugadorId) return;

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
    }, [jugadorId]);

    const partidosOrdenados = useMemo(
        () => [...partidos].sort((a, b) => Number(b.id_tiempo) - Number(a.id_tiempo)),
        [partidos]
    );

    const getEstiloNota = (nota) => {
        const valor = Number(nota);

        if (!Number.isFinite(valor)) {
            return styles.notaVacia;
        }

        if (valor < 5) return styles.notaRoja;
        if (valor < 7) return styles.notaNaranja;
        if (valor < 9) return styles.notaVerde;
        return styles.notaAmarilla;
    };

    const renderEventosJugador = (partido) => {
        const goles = getNumero(partido.goles);
        const asistencias = getNumero(partido.asistencias);
        const amarillas = getNumero(partido.amarilla);
        const rojas = getNumero(partido.roja);

        const etiquetas = [];
        if (goles > 0) etiquetas.push(`⚽ ${goles}`);
        if (asistencias > 0) etiquetas.push(`🥾 ${asistencias}`);
        if (amarillas > 0) etiquetas.push(`🟨 ${amarillas}`);
        if (rojas > 0) etiquetas.push(`🟥 ${rojas}`);

        if (etiquetas.length === 0) return null;

        return <Text style={styles.eventosJugador}>{etiquetas.join('  ')}</Text>;
    };

    const renderFilaEquipo = ({ partido, esLocal, mostrarNota }) => {
        const nombre = esLocal ? partido.equipo_local : partido.equipo_visitante;
        const logo = esLocal ? partido.logo_local : partido.logo_visitante;
        const golesEquipo = esLocal ? partido.goles_local : partido.goles_visitante;
        const esEquipoJugador = Number(partido.id_equipo_jugador) === Number(esLocal ? partido.id_local : partido.id_visitante);
        const minutos = Number(partido.minutos);
        const jugoCeroMinutos = Number.isFinite(minutos) && minutos === 0;

        return (
            <View style={styles.filaEquipo}>
                <View style={styles.bloqueEquipo}>
                    {logo ? (
                        <Image source={{ uri: logo }} style={styles.escudoEquipo} />
                    ) : (
                        <View style={styles.escudoFallback}>
                            <Ionicons name="shield-outline" size={12} color="#5f7f9b" />
                        </View>
                    )}
                    <Text style={styles.nombreEquipo} numberOfLines={1}>
                        {nombre || '-'}
                    </Text>
                </View>

                <View style={styles.bloqueMarcadorNota}>
                    {esEquipoJugador ? renderEventosJugador(partido) : <View style={styles.eventosVacio} />}
                    <Text style={styles.golesEquipo}>{golesEquipo ?? '-'}</Text>
                    {mostrarNota ? (
                        jugoCeroMinutos ? (
                            <View style={styles.notaGuionWrap}>
                                <Text style={styles.notaGuionTexto}>-</Text>
                            </View>
                        ) : (
                            <View style={[styles.notaBadge, getEstiloNota(partido.nota)]}>
                                <Text style={styles.notaTexto}>
                                    {Number.isFinite(Number(partido.nota)) ? Number(partido.nota).toFixed(2) : '-'}
                                </Text>
                            </View>
                        )
                    ) : (
                        <View style={styles.notaPlaceholder} />
                    )}
                </View>
            </View>
        );
    };

    const renderItemPartido = ({ item }) => (
        <TouchableOpacity
            style={styles.tarjetaPartido}
            onPress={() => navegacion.navigate('DetallePartido', { id_partido: item.id_partido })}
            activeOpacity={0.88}
        >
            <View style={styles.columnaFecha}>
                <Text style={styles.fechaDia}>{item.dia ?? '--'}</Text>
                <Text style={styles.fechaMes} numberOfLines={1}>
                    {item.nombre_mes || '-'}
                </Text>
                <Text style={styles.fechaAnio}>{item.anio ?? '-'}</Text>
            </View>

            <View style={styles.columnaEquipos}>
                {renderFilaEquipo({ partido: item, esLocal: true, mostrarNota: true })}
                {renderFilaEquipo({ partido: item, esLocal: false, mostrarNota: false })}
            </View>
        </TouchableOpacity>
    );

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
                                <Text style={[styles.textoTemporada, activa && styles.textoTemporadaActivo]}>
                                    {temporada}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            ) : null}

            {error ? <Text style={styles.errorTexto}>{error}</Text> : null}

            {!error && partidosOrdenados.length === 0 ? (
                <View style={styles.estadoPantalla}>
                    <Ionicons name="calendar-clear-outline" size={18} color="#5f7f9b" />
                    <Text style={styles.estadoTexto}>No hay partidos para esta temporada</Text>
                </View>
            ) : (
                <FlatList
                    data={partidosOrdenados}
                    keyExtractor={(item) => String(item.id_partido)}
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
        flexDirection: 'row',
        alignItems: 'stretch',
        backgroundColor: '#ffffff',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#dbe6f0',
        marginBottom: 10,
        overflow: 'hidden',
    },
    columnaFecha: {
        width: 70,
        backgroundColor: '#edf3f9',
        borderRightWidth: 1,
        borderRightColor: '#dbe6f0',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 6,
    },
    fechaDia: {
        fontSize: 16,
        fontWeight: '800',
        color: '#123455',
        lineHeight: 18,
    },
    fechaMes: {
        marginTop: 2,
        fontSize: 11,
        fontWeight: '700',
        color: '#4f6782',
        textAlign: 'center',
    },
    fechaAnio: {
        marginTop: 1,
        fontSize: 10,
        color: '#6c8299',
        fontWeight: '600',
    },
    columnaEquipos: {
        flex: 1,
        paddingHorizontal: 10,
        paddingVertical: 8,
        gap: 7,
    },
    filaEquipo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    bloqueEquipo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 8,
    },
    escudoEquipo: {
        width: 20,
        height: 20,
        borderRadius: 10,
        resizeMode: 'contain',
        marginRight: 6,
        backgroundColor: '#ffffff',
    },
    escudoFallback: {
        width: 20,
        height: 20,
        borderRadius: 10,
        marginRight: 6,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#e8edf2',
    },
    nombreEquipo: {
        flex: 1,
        color: '#173a5d',
        fontSize: 12,
        fontWeight: '700',
    },
    bloqueMarcadorNota: {
        minWidth: 120,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 6,
    },
    eventosJugador: {
        maxWidth: 82,
        textAlign: 'right',
        fontSize: 10,
        color: '#32506f',
        fontWeight: '700',
    },
    eventosVacio: {
        width: 38,
    },
    golesEquipo: {
        minWidth: 18,
        textAlign: 'center',
        fontSize: 16,
        color: '#0f2743',
        fontWeight: '800',
    },
    notaBadge: {
        minWidth: 42,
        height: 24,
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },
    notaTexto: {
        color: '#ffffff',
        fontSize: 11,
        fontWeight: '800',
    },
    notaPlaceholder: {
        minWidth: 42,
        height: 24,
    },
    notaGuionWrap: {
        minWidth: 42,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 0,
    },
    notaGuionTexto: {
        color: '#4f6782',
        fontSize: 14,
        fontWeight: '800',
        textAlign: 'center',
    },
    notaRoja: {
        backgroundColor: '#dc2626',
    },
    notaNaranja: {
        backgroundColor: '#ea580c',
    },
    notaVerde: {
        backgroundColor: '#16a34a',
    },
    notaAmarilla: {
        backgroundColor: '#ca8a04',
    },
    notaVacia: {
        backgroundColor: '#6b7280',
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