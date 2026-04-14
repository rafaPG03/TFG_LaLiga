import React, { useEffect, useMemo, useState } from 'react';
import {
    Modal,
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const COL_JUGADOR = 170;
const COL_BASE = 62;

const BASE_COLUMNS = [
    { key: 'posicion', label: 'Pos' },
    { key: 'minutos', label: 'Min' },
    { key: 'goles', label: 'Gol' },
    { key: 'tarjetas', label: 'Tarj' },
    { key: 'nota', label: 'Nota' },
];

const OPTIONAL_GROUPS = [
    {
        id: 'ofensivos',
        label: 'Ofensivos',
        stats: [
            { key: 'asistencias', label: 'Asis' },
            { key: 'tiros_totales', label: 'Tiros' },
            { key: 'tiros_a_puerta', label: 'T. puerta' },
            {key: 'regates_intentados', label: 'Reg. Intentados' },
            { key: 'regates', label: 'Regates' },
        ],
    },
    {
        id: 'creacion',
        label: 'Creacion',
        stats: [
            { key: 'pases_totales', label: 'Pases' },
            { key: 'pases_clave', label: 'P. clave' },
            { key: 'precision_pases', label: 'Prec. pase' },
        ],
    },
    {
        id: 'defensivos',
        label: 'Defensivos',
        stats: [
            { key: 'duelos_ganados', label: 'Duelos' },
            { key: 'intercepciones', label: 'Interc.' },
            { key: 'regateado', label: 'Regateado' },
            { key: 'entradas', label: 'Entradas'},
            { key: 'bloqueos', label: 'Bloqueos' },
        ],
    },
    {
        id: 'portero',
        label: 'Portero',
        stats: [
            { key: 'paradas', label: 'Paradas' },
            { key: 'goles_concedidos', label: 'G. conc.' },
        ],
    },
];

const OPTIONAL_STATS = OPTIONAL_GROUPS.flatMap((group) => group.stats);

const parseNumber = (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
};

const getTarjetas = (jugador) => {
    const amarilla = parseNumber(jugador.amarilla) || 0;
    const roja = parseNumber(jugador.roja) || 0;
    return amarilla + roja;
};

const formatoCelda = (jugador, key) => {
    if (key === 'tarjetas') {
        const total = getTarjetas(jugador);
        return total > 0 ? `${total}` : '0';
    }

    if (key === 'nota') {
        const nota = parseNumber(jugador.nota);
        return nota === null ? '-' : nota.toFixed(2);
    }

    const valor = jugador[key];
    if (valor === null || valor === undefined || valor === '') return '-';

    if (typeof valor === 'number') {
        return Number.isInteger(valor) ? `${valor}` : valor.toFixed(2);
    }

    return `${valor}`;
};

const getComparableValue = (jugador, key) => {
    if (key === 'posicion') {
        const mapPos = { P: 1, DF: 2, M: 3, DL: 4 };
        return mapPos[jugador.posicion] ?? 99;
    }

    if (key === 'tarjetas') {
        return getTarjetas(jugador);
    }

    if (key === 'nombre') {
        return (jugador.nombre || '').toLowerCase();
    }

    const num = parseNumber(jugador[key]);
    if (num !== null) return num;

    return `${jugador[key] ?? ''}`.toLowerCase();
};

const ordenarPorColumna = (lista, sortState) => {
    if (!sortState.key || !sortState.direction) {
        return lista;
    }

    const factor = sortState.direction === 'asc' ? 1 : -1;

    return [...lista].sort((a, b) => {
        const va = getComparableValue(a, sortState.key);
        const vb = getComparableValue(b, sortState.key);

        if (va < vb) return -1 * factor;
        if (va > vb) return 1 * factor;
        return 0;
    });
};

export default function AnalisisJugador({ route }) {
    const { id_partido, partidoInfo } = route.params || {};
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [datos, setDatos] = useState([]);
    const [equipoSeleccionado, setEquipoSeleccionado] = useState('local');
    const [statsSeleccionadas, setStatsSeleccionadas] = useState([]);
    const [sortState, setSortState] = useState({ key: null, direction: null });
    const [modalVisible, setModalVisible] = useState(false);

    useEffect(() => {
        const cargarStatsJugadores = async () => {
            try {
                setLoading(true);
                setError('');

                if (!id_partido) {
                    setError('Partido invalido');
                    setDatos([]);
                    return;
                }

                const response = await fetch(
                    `${process.env.EXPO_PUBLIC_API_URL}/partidos/${id_partido}/stats_jugadores`
                );

                if (!response.ok) {
                    throw new Error('No se pudieron cargar las estadisticas de jugadores');
                }

                const data = await response.json();
                setDatos(Array.isArray(data) ? data : []);
            } catch (e) {
                setError('No se pudieron obtener las estadisticas de jugadores del partido');
                setDatos([]);
            } finally {
                setLoading(false);
            }
        };

        cargarStatsJugadores();
    }, [id_partido]);

    const equipos = useMemo(() => {
        const local = {
            key: 'local',
            id: partidoInfo?.id_local,
            nombre: partidoInfo?.equipo_local || 'Local',
            logo: partidoInfo?.logo_local || null,
        };

        const visitante = {
            key: 'visitante',
            id: partidoInfo?.id_visitante,
            nombre: partidoInfo?.equipo_visitante || 'Visitante',
            logo: partidoInfo?.logo_visitante || null,
        };

        return { local, visitante };
    }, [partidoInfo]);

    const jugadoresEquipo = useMemo(() => {
        const idEquipo = equipos[equipoSeleccionado]?.id;
        if (!idEquipo) return [];

        return datos.filter((jugador) => Number(jugador.id_equipo) === Number(idEquipo));
    }, [datos, equipoSeleccionado, equipos]);

    const titulares = useMemo(
        () => jugadoresEquipo.filter((jugador) => jugador.sustituto !== true),
        [jugadoresEquipo]
    );

    const suplentes = useMemo(
        () => jugadoresEquipo.filter((jugador) => jugador.sustituto === true),
        [jugadoresEquipo]
    );

    const columnasVisibles = useMemo(() => {
        const optionalCols = OPTIONAL_STATS.filter((stat) => statsSeleccionadas.includes(stat.key));
        return [...BASE_COLUMNS, ...optionalCols];
    }, [statsSeleccionadas]);

    const titularesOrdenados = useMemo(() => ordenarPorColumna(titulares, sortState), [titulares, sortState]);
    const suplentesOrdenados = useMemo(() => ordenarPorColumna(suplentes, sortState), [suplentes, sortState]);

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

    // Función para alternar selección de stats extra
    const toggleStat = (key) => {
        setStatsSeleccionadas((prev) =>
            prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
        );
    };

    const renderHeader = () => (
        <View style={styles.headerTabla}>
            <TouchableOpacity
                style={[styles.headerCelda, styles.headerJugador]}
                onPress={() => alternarOrden('nombre')}
                activeOpacity={0.8}
            >
                <Text style={[styles.headerText, styles.headerJugadorText]}>Jugador</Text>
                <Text style={styles.sortIcon}>{sortState.key === 'nombre' ? (sortState.direction === 'asc' ? '↑' : '↓') : ''}</Text>
            </TouchableOpacity>

            {columnasVisibles.map((col) => (
                <TouchableOpacity
                    key={col.key}
                    style={styles.headerCelda}
                    onPress={() => alternarOrden(col.key)}
                    activeOpacity={0.8}
                >
                    <Text style={styles.headerText}>{col.label}</Text>
                    <Text style={styles.sortIcon}>{sortState.key === col.key ? (sortState.direction === 'asc' ? '↑' : '↓') : ''}</Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    // Renderizado de cada fila de jugador
    const renderFilaJugador = (jugador) => (
        <View key={jugador.id_jugador} style={styles.filaTabla}>
            <View style={[styles.celdaJugador, styles.colJugador]}>
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

            {columnasVisibles.map((col) => (
                <Text key={`${jugador.id_jugador}-${col.key}`} style={styles.cellText} numberOfLines={1}>
                    {formatoCelda(jugador, col.key)}
                </Text>
            ))}
        </View>
    );

    // Renderizado de tabla para titulares o suplentes
    const renderTabla = (titulo, jugadores) => (
        <View style={styles.seccionWrap}>
            <Text style={styles.seccionTitulo}>{titulo}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.tablaWrap}>
                    {renderHeader()}
                    {jugadores.length > 0 ? (
                        jugadores.map(renderFilaJugador)
                    ) : (
                        <Text style={styles.emptySeccion}>Sin datos en esta seccion</Text>
                    )}
                </View>
            </ScrollView>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loaderWrap}>
                <ActivityIndicator size="large" color="#1f6fa7" />
            </View>
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Analisis de jugadores</Text>

            {/* Selector de equipo */}
            <View style={styles.selectorWrap}>
                {[equipos.local, equipos.visitante].map((equipo) => {
                    const activo = equipoSeleccionado === equipo.key;
                    return (
                        <TouchableOpacity
                            key={equipo.key}
                            style={[styles.selectorBtn, activo && styles.selectorBtnActivo]}
                            onPress={() => setEquipoSeleccionado(equipo.key)}
                            activeOpacity={0.9}
                        >
                            {equipo.logo ? (
                                <Image source={{ uri: equipo.logo }} style={styles.logoEquipo} />
                            ) : (
                                <View style={styles.logoFallback}>
                                    <Ionicons name="shield-outline" size={14} color="#5f7f9b" />
                                </View>
                            )}
                            <Text style={[styles.selectorText, activo && styles.selectorTextActivo]} numberOfLines={1}>
                                {equipo.nombre}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Boton para elegir stats */}
            <TouchableOpacity
                style={styles.statsButton}
                onPress={() => setModalVisible(true)}
                activeOpacity={0.85}
            >
                <Ionicons name="options-outline" size={16} color="#1f4f7a" />
                <Text style={styles.statsButtonText}>
                    {statsSeleccionadas.length > 0
                        ? `Stats extra seleccionadas: ${statsSeleccionadas.length}`
                        : 'Elegir stats'}
                </Text>
            </TouchableOpacity>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {!error && jugadoresEquipo.length === 0 ? (
                <View style={styles.emptyWrap}>
                    <Ionicons name="information-circle-outline" size={20} color="#5f7f9b" />
                    <Text style={styles.emptyText}>No hay estadisticas de jugadores para este equipo</Text>
                </View>
            ) : null}

            {jugadoresEquipo.length > 0 ? (
                <>
                    {renderTabla('Titulares', titularesOrdenados)}
                    {renderTabla('Suplentes', suplentesOrdenados)}
                </>
            ) : null}
            {/* Modal para seleccionar stats extra */}
            <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Selecciona stats extra</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseButton}>
                                <Ionicons name="close" size={18} color="#1f6fa7" />
                            </TouchableOpacity>
                        </View>
                        {/* Lista de stats para seleccionar */}
                        <ScrollView style={styles.modalList}>
                            {OPTIONAL_GROUPS.map((group) => (
                                <View key={group.id} style={styles.groupWrap}>
                                    <Text style={styles.groupTitle}>{group.label}</Text>

                                    {group.stats.map((stat) => {
                                        const selected = statsSeleccionadas.includes(stat.key);

                                        return (
                                            <TouchableOpacity
                                                key={stat.key}
                                                style={[styles.statOption, selected && styles.statOptionActive]}
                                                onPress={() => toggleStat(stat.key)}
                                                activeOpacity={0.85}
                                            >
                                                <Text style={[styles.statOptionText, selected && styles.statOptionTextActive]}>
                                                    {stat.label}
                                                </Text>
                                                {selected ? <Ionicons name="checkmark" size={16} color="#ffffff" /> : null}
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    loaderWrap: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    container: {
        paddingHorizontal: 14,
        paddingTop: 14,
        paddingBottom: 28,
    },
    title: {
        fontSize: 17,
        fontWeight: '800',
        color: '#12233f',
        marginBottom: 12,
    },
    selectorWrap: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 10,
    },
    selectorBtn: {
        flex: 1,
        backgroundColor: '#e9f1f8',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#c5d8ea',
        paddingHorizontal: 10,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    selectorBtnActivo: {
        backgroundColor: '#1f4f7a',
        borderColor: '#1f4f7a',
    },
    selectorText: {
        flex: 1,
        color: '#1f4f7a',
        fontSize: 12,
        fontWeight: '700',
    },
    selectorTextActivo: {
        color: '#eef6ff',
    },
    logoEquipo: {
        width: 22,
        height: 22,
        borderRadius: 11,
        resizeMode: 'contain',
        backgroundColor: '#ffffff',
    },
    logoFallback: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: '#ffffff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    statsButton: {
        marginBottom: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#c5d8ea',
        backgroundColor: '#e9f1f8',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    statsButtonText: {
        color: '#1f4f7a',
        fontSize: 13,
        fontWeight: '700',
    },
    errorText: {
        color: '#b91c1c',
        backgroundColor: '#fee2e2',
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 8,
        marginBottom: 10,
        fontWeight: '600',
    },
    emptyWrap: {
        marginTop: 2,
        backgroundColor: '#e9f1f8',
        borderColor: '#c5d8ea',
        borderWidth: 1,
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 12,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    emptyText: {
        color: '#3d5b77',
        fontSize: 13,
        fontWeight: '600',
        textAlign: 'center',
    },
    seccionWrap: {
        marginTop: 12,
    },
    seccionTitulo: {
        fontSize: 15,
        fontWeight: '800',
        color: '#12233f',
        marginBottom: 8,
    },
    tablaWrap: {
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#d2e0ec',
        backgroundColor: '#ffffff',
    },
    headerTabla: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#edf3f9',
        borderBottomWidth: 1,
        borderBottomColor: '#d2e0ec',
        paddingHorizontal: 10,
        paddingVertical: 8,
    },
    headerCelda: {
        width: COL_BASE,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
    },
    headerJugador: {
        width: COL_JUGADOR,
        justifyContent: 'flex-start',
    },
    headerText: {
        color: '#2f4a63',
        fontSize: 12,
        fontWeight: '800',
        textAlign: 'center',
    },
    headerJugadorText: {
        textAlign: 'left',
    },
    sortIcon: {
        fontSize: 11,
        color: '#2f4a63',
        fontWeight: '800',
        minWidth: 8,
        textAlign: 'center',
    },
    filaTabla: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 9,
        borderBottomWidth: 1,
        borderBottomColor: '#eef3f7',
    },
    colJugador: {
        width: COL_JUGADOR,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingRight: 8,
    },
    celdaJugador: {
        width: COL_JUGADOR,
    },
    fotoJugador: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#e8edf2',
    },
    fotoFallback: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#e8edf2',
    },
    nombreJugador: {
        flex: 1,
        color: '#1f3851',
        fontSize: 13,
        fontWeight: '600',
    },
    cellText: {
        width: COL_BASE,
        textAlign: 'center',
        color: '#1f3851',
        fontWeight: '700',
        fontSize: 12,
    },
    emptySeccion: {
        color: '#5f7f9b',
        fontWeight: '600',
        fontSize: 12,
        textAlign: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(13, 33, 51, 0.35)',
        justifyContent: 'center',
        paddingHorizontal: 16,
    },
    modalCard: {
        backgroundColor: '#ffffff',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#d9e5f0',
        maxHeight: '72%',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        paddingTop: 12,
        paddingBottom: 8,
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#163f61',
    },
    modalCloseButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#e8f1f9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalList: {
        paddingHorizontal: 10,
        paddingBottom: 12,
    },
    groupWrap: {
        marginBottom: 10,
    },
    groupTitle: {
        fontSize: 13,
        fontWeight: '800',
        color: '#3d5b77',
        marginBottom: 6,
        paddingHorizontal: 2,
    },
    statOption: {
        minHeight: 38,
        borderRadius: 10,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#f7fbff',
        borderWidth: 1,
        borderColor: '#d9e5f0',
        marginBottom: 8,
    },
    statOptionActive: {
        backgroundColor: '#1f6fa7',
        borderColor: '#1f6fa7',
    },
    statOptionText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#214964',
    },
    statOptionTextActive: {
        color: '#ffffff',
    },
});

