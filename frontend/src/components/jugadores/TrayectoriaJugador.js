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

const COLUMNAS_BASE = [
    { key: 'temporada', label: 'Temp.' },
    { key: 'partidos', label: 'PJ' },
    { key: 'nota_media', label: 'Nota' },
];

const COLUMNAS_JUGADOR_CAMPO = [
    ...COLUMNAS_BASE,
    { key: 'goles', label: 'G' },
    { key: 'asistencias', label: 'A' },
    { key: 'amarillas', label: 'TA' },
    { key: 'rojas', label: 'TR' },
];

const COLUMNAS_PORTERO = [
    ...COLUMNAS_BASE,
    { key: 'goles_concedidos', label: 'GC' },
    { key: 'amarillas', label: 'TA' },
    { key: 'rojas', label: 'TR' },
];

const toNumber = (valor) => {
    const n = Number(valor);
    return Number.isFinite(n) ? n : 0;
};

const detectarPortero = (posicion = '') => {
    const p = String(posicion).trim().toLowerCase();
    return p.includes('portero') || p.includes('goalkeeper') || p.includes('keeper');
};

export default function TrayectoriaJugador({ id_jugador, route }) {
    const jugadorId = id_jugador ?? route?.params?.id_jugador ?? route?.params?.idjugador;

    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [trayectoria, setTrayectoria] = useState([]);
    const [equiposById, setEquiposById] = useState({});
    const [esPortero, setEsPortero] = useState(false);
    const [sortKey, setSortKey] = useState('temporada');
    const [sortDir, setSortDir] = useState('desc');

    const COL_EQUIPO = 170;
    const COL_STAT = 76;
    const ROW_HEIGHT = 46;
    const HEADER_HEIGHT = 40;

    useEffect(() => {
        let activo = true;

        const cargarTrayectoria = async () => {
            try {
                setCargando(true);
                setError('');

                if (!jugadorId) {
                    setTrayectoria([]);
                    setEquiposById({});
                    return;
                }

                const [resTrayectoria, resInfo] = await Promise.all([
                    fetch(`${process.env.EXPO_PUBLIC_API_URL}/jugadores/trayectoria/${jugadorId}`),
                    fetch(`${process.env.EXPO_PUBLIC_API_URL}/jugadores/info/${jugadorId}`),
                ]);

                if (!resTrayectoria.ok) {
                    throw new Error('No se pudo cargar la trayectoria del jugador');
                }

                const dataTrayectoria = await resTrayectoria.json();
                const trayectoriaArray = Array.isArray(dataTrayectoria) ? dataTrayectoria : [];

                let portero = false;
                if (resInfo.ok) {
                    const info = await resInfo.json();
                    portero = detectarPortero(info?.posicion);
                }

                const idsEquipos = [
                    ...new Set(
                        trayectoriaArray
                            .map((row) => Number(row.id_equipo))
                            .filter((id) => Number.isFinite(id) && id > 0)
                    ),
                ];

                const equiposPairs = await Promise.all(
                    idsEquipos.map(async (idEquipo) => {
                        try {
                            const resp = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/equipos/${idEquipo}`);
                            if (!resp.ok) {
                                return [idEquipo, null];
                            }
                            const equipo = await resp.json();
                            return [idEquipo, equipo];
                        } catch (_e) {
                            return [idEquipo, null];
                        }
                    })
                );

                if (!activo) return;

                setTrayectoria(trayectoriaArray);
                setEsPortero(portero);
                setEquiposById(Object.fromEntries(equiposPairs));
            } catch (_e) {
                if (!activo) return;
                setError('No se pudo cargar la trayectoria');
                setTrayectoria([]);
                setEquiposById({});
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
    }, [jugadorId]);

    const columnasVisibles = useMemo(
        () => (esPortero ? COLUMNAS_PORTERO : COLUMNAS_JUGADOR_CAMPO),
        [esPortero]
    );

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

    const cambiarOrden = (key) => {
        if (sortKey === key) {
            setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
            return;
        }

        setSortKey(key);
        setSortDir('desc');
    };

    const renderValor = (row, key) => {
        if (key === 'nota_media') {
            const nota = Number(row.nota_media);
            return Number.isFinite(nota) ? nota.toFixed(2) : '-';
        }

        const value = row[key];
        return Number.isFinite(Number(value)) ? String(value) : '-';
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
                <Text style={styles.title}>Trayectoria</Text>
                <Text style={styles.subtitle}>
                    Orden: {columnasVisibles.find((c) => c.key === sortKey)?.label || 'Temp.'} ({sortDir === 'desc' ? 'desc' : 'asc'})
                </Text>
            </View>

            {trayectoriaOrdenada.length === 0 ? (
                <View style={styles.emptyRow}>
                    <Ionicons name="stats-chart-outline" size={18} color="#6d839a" />
                    <Text style={styles.emptyText}>No hay registros de trayectoria</Text>
                </View>
            ) : (
                <View style={styles.tablaWrap}>
                    <View style={styles.tablaGrid}>
                        <View style={styles.columnaEquipoFija}>
                            <View style={styles.headerCeldaEquipo}>
                                <Text style={[styles.headerText, styles.headerEquipoText]}>Equipo</Text>
                            </View>

                            {trayectoriaOrdenada.map((row, idx) => {
                                const equipo = equiposById[Number(row.id_equipo)] || null;
                                const nombreEquipo =
                                    equipo?.nombre_equipo ||
                                    equipo?.nombre ||
                                    `Equipo ${row.id_equipo ?? '-'}`;
                                const logoEquipo = equipo?.logo || equipo?.logo_url || null;

                                return (
                                    <View
                                        key={`equipo-${row.id_jugador}-${row.id_equipo}-${row.temporada}-${idx}`}
                                        style={[styles.filaEquipoFija, idx % 2 === 1 && styles.filaAlt]}
                                    >
                                        {logoEquipo ? (
                                            <Image source={{ uri: logoEquipo }} style={styles.logo} />
                                        ) : (
                                            <View style={styles.logoFallback}>
                                                <Ionicons name="shield-outline" size={14} color="#6b86a1" />
                                            </View>
                                        )}
                                        <Text style={styles.teamName} numberOfLines={1}>
                                            {nombreEquipo}
                                        </Text>
                                    </View>
                                );
                            })}
                        </View>

                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <View style={styles.columnaStats}>
                                <View style={styles.headerStatsRow}>
                                    {columnasVisibles.map((col) => {
                                        const active = sortKey === col.key;
                                        return (
                                            <TouchableOpacity
                                                key={col.key}
                                                style={[styles.headerCeldaStat, active && styles.headerCeldaStatActive]}
                                                onPress={() => cambiarOrden(col.key)}
                                                activeOpacity={0.85}
                                            >
                                                <Text style={[styles.headerText, active && styles.headerTextActive]}>{col.label}</Text>
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
                                        key={`stats-${row.id_jugador}-${row.id_equipo}-${row.temporada}-${idx}`}
                                        style={[styles.filaStats, idx % 2 === 1 && styles.filaAlt]}
                                    >
                                        {columnasVisibles.map((col) => (
                                            <View key={col.key} style={styles.cellStat}>
                                                <Text style={styles.statValue}>{renderValor(row, col.key)}</Text>
                                            </View>
                                        ))}
                                    </View>
                                ))}
                            </View>
                        </ScrollView>
                    </View>
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