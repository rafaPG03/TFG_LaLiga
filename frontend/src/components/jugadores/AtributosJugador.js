import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BarChart, RadarChart } from 'react-native-gifted-charts';

const ATRIBUTOS = [
    { key: 'ataque', label: 'AT' },
    { key: 'creacion', label: 'CR' },
    { key: 'defensa', label: 'DF' },
    { key: 'porteros', label: 'POR' },
    { key: 'duelos', label: 'DUEL' },
    { key: 'regates', label: 'REG' },
];

const PERCENTILES = [
    { key: 'percentil_ataque', label: 'AT' },
    { key: 'percentil_creacion', label: 'CR' },
    { key: 'percentil_defensa', label: 'DF' },
    { key: 'percentil_porteros', label: 'POR' },
    { key: 'percentil_duelos', label: 'DUEL' },
    { key: 'percentil_regates', label: 'REG' },
];

const ATRIBUTOS_TEMPORADA_BASE = [
    { key: 'partidos', label: 'PJ', formato: 'entero' },
    { key: 'goles', label: 'Goles', formato: 'entero' },
    { key: 'asistencias', label: 'Asistencias', formato: 'entero' },
    { key: 'nota_media', label: 'Nota', formato: 'decimal' },
];

const ATRIBUTOS_TEMPORADA = [
    {
        grupo: 'Porteria',
        items: [
            { key: 'paradas', label: 'Paradas', formato: 'entero' },
            { key: 'goles_concedidos', label: 'Goles concedidos', formato: 'entero' },
            { key: 'penaltis_parados', label: 'Penaltis parados', formato: 'entero' },
        ],
    },
    {
        grupo: 'Defensa',
        items: [
            { key: 'entradas', label: 'Entradas', formato: 'entero' },
            { key: 'bloqueos', label: 'Bloqueos', formato: 'entero' },
            { key: 'intercepciones', label: 'Intercepciones', formato: 'entero' },
            { key: 'duelos_ganados', label: 'Duelos ganados', formato: 'entero' },
            { key: 'duelos_totales', label: 'Duelos totales', formato: 'entero' },
            { key: 'faltas_cometidas', label: 'Faltas cometidas', formato: 'entero' },
            { key: 'regateado', label: 'Regateado', formato: 'entero' },
            { key: 'amarillas', label: 'Amarillas', formato: 'entero' },
            { key: 'rojas', label: 'Rojas', formato: 'entero' },
        ],
    },
    {
        grupo: 'Creacion',
        items: [
            { key: 'pases_totales', label: 'Pases totales', formato: 'entero' },
            { key: 'pases_clave', label: 'Pases clave', formato: 'entero' },
            { key: 'precision_pases', label: 'Precision pases', formato: 'porcentaje' },
            { key: 'regates_intentados', label: 'Regates intentados', formato: 'entero' },
            { key: 'regates_exito', label: 'Regates exitosos', formato: 'entero' },
        ],
    },
    {
        grupo: 'Ataque',
        items: [
            { key: 'tiros_totales', label: 'Tiros totales', formato: 'entero' },
            { key: 'tiros_a_puerta', label: 'Tiros a puerta', formato: 'entero' },
            { key: 'faltas_sufridas', label: 'Faltas sufridas', formato: 'entero' },
            { key: 'penaltis_marcados', label: 'Penaltis marcados', formato: 'entero' },
        ],
    },
];

const META_ATRIBUTOS_TEMPORADA = ATRIBUTOS_TEMPORADA.flatMap((grupo) => grupo.items);

const COLORES_RADAR = [
        '#1f77b4',
        '#ff7f0e',
        '#2ca02c',
];
const RADAR_RADIUS = 50;
const CHART_SIZE = 200;

const toNumber = (valor) => {
    const n = Number(valor);
    return Number.isFinite(n) ? n : 0;
};

const clampPercentil = (valor) => {
    const n = toNumber(valor);
    if (n < 0) return 0;
    if (n > 100) return 100;
    return n;
};

const getColorPercentil = (valor) => {
    const n = clampPercentil(valor);
    if (n < 25) return '#e74c3c';
    if (n < 50) return '#f39c12';
    if (n < 75) return '#27ae60';
    return '#f1c40f';
};

const formatTemporadaValue = (valor, formato) => {
    const numero = Number(valor);
    if (!Number.isFinite(numero)) return '-';
    if (formato === 'decimal') return numero.toFixed(2);
    if (formato === 'porcentaje') return `${Math.round(numero)}%`;
    return String(Math.round(numero));
};


export default function AtributosJugador({ id_jugador, route }) {
    const jugadorId = id_jugador ?? route?.params?.id_jugador ?? route?.params?.idjugador;

    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [rating, setRating] = useState(null);
    const [temporadasDisponibles, setTemporadasDisponibles] = useState([]);
    const [temporadaSeleccionada, setTemporadaSeleccionada] = useState(null);

    const [comparaciones, setComparaciones] = useState([]);
    const [selectorTemporadaAbierto, setSelectorTemporadaAbierto] = useState(false);
    const [atributoTemporada, setAtributoTemporada] = useState(null);

    const [modalVisible, setModalVisible] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [results, setResults] = useState([]);
    const [isLoadingSearch, setIsLoadingSearch] = useState(false);
    const [searchError, setSearchError] = useState('');

    const fetchRatings = async (jugador, temporada) => {
        const queryTemporada = temporada ? `?temporada=${temporada}` : '';
        const response = await fetch(
            `${process.env.EXPO_PUBLIC_API_URL}/jugadores/${jugador}/ratings${queryTemporada}`
        );

        if (!response.ok) {
            throw new Error('No se pudieron cargar los ratings');
        }

        const data = await response.json();
        return Array.isArray(data) ? data : [];
    };

    const fetchTemporadas = async (jugador) => {
        const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/jugadores/trayectoria/${jugador}`);
        if (!response.ok) {
            return [];
        }

        const data = await response.json();
        const temporadas = [
            ...new Set(
                (Array.isArray(data) ? data : [])
                    .map((row) => Number(row.temporada))
                    .filter((temp) => Number.isFinite(temp))
            ),
        ].sort((a, b) => b - a);

        return temporadas;
    };

    const cargarInicial = async () => {
        try {
            setCargando(true);
            setError('');

            if (!jugadorId) {
                setRating(null);
                setTemporadasDisponibles([]);
                setTemporadaSeleccionada(null);
                setComparaciones([]);
                setSelectorTemporadaAbierto(false);
                setAtributoTemporada(null);
                return;
            }

            const [ratingsData, temporadas] = await Promise.all([
                fetchRatings(jugadorId),
                fetchTemporadas(jugadorId),
            ]);

            const ratingBase = ratingsData[0] || null;
            const temporadaBase = ratingBase?.temporada ? Number(ratingBase.temporada) : temporadas[0] || null;

            setRating(ratingBase);
            setTemporadasDisponibles(temporadas.length > 0 ? temporadas : temporadaBase ? [temporadaBase] : []);
            setTemporadaSeleccionada(temporadaBase);
            setComparaciones([]);
            setSelectorTemporadaAbierto(false);
            setAtributoTemporada(null);
        } catch (_e) {
            setError('No se pudieron cargar los ratings del jugador');
            setRating(null);
            setTemporadasDisponibles([]);
            setTemporadaSeleccionada(null);
            setComparaciones([]);
            setSelectorTemporadaAbierto(false);
            setAtributoTemporada(null);
        } finally {
            setCargando(false);
        }
    };

    const seleccionarTemporada = async (temporada) => {
        if (!jugadorId || temporada === temporadaSeleccionada) return;

        try {
            setCargando(true);
            setError('');

            const ratingsData = await fetchRatings(jugadorId, temporada);
            setRating(ratingsData[0] || null);
            setTemporadaSeleccionada(temporada);

            if (comparaciones.length > 0) {
                const nuevas = await Promise.all(
                    comparaciones.map(async (comp) => {
                        try {
                            const data = await fetchRatings(comp.id_jugador, temporada);
                            return { ...comp, rating: data[0] || null };
                        } catch (_e) {
                            return { ...comp, rating: null };
                        }
                    })
                );
                setComparaciones(nuevas);
            }
        } catch (_e) {
            setError('No se pudieron filtrar los ratings por temporada');
            setRating(null);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarInicial();
    }, [jugadorId]);

    useEffect(() => {
        if (!modalVisible) {
            setSearchText('');
            setResults([]);
            setIsLoadingSearch(false);
            setSearchError('');
            return;
        }

        const query = searchText.trim();
        if (query.length < 2) {
            setResults([]);
            setIsLoadingSearch(false);
            setSearchError('');
            return;
        }

        const timeoutId = setTimeout(async () => {
            try {
                setIsLoadingSearch(true);
                setSearchError('');

                const response = await fetch(
                    `${process.env.EXPO_PUBLIC_API_URL}/buscador?q=${encodeURIComponent(query)}`
                );

                if (!response.ok) {
                    throw new Error('No se pudo completar la busqueda');
                }

                const data = await response.json();
                const jugadores = (Array.isArray(data) ? data : []).filter((item) => item.tipo === 'jugador');
                setResults(jugadores);
            } catch (_e) {
                setResults([]);
                setSearchError('No se pudo conectar con la API de busqueda');
            } finally {
                setIsLoadingSearch(false);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchText, modalVisible]);

    const agregarComparacion = async (item) => {
        if (!item?.id) return;
        if (comparaciones.some((comp) => Number(comp.id_jugador) === Number(item.id))) return;
        if (comparaciones.length >= 1) return;

        try {
            const data = await fetchRatings(item.id, temporadaSeleccionada);
            const color = COLORES_RADAR[comparaciones.length + 1] || '#2e8b57';
            const nuevo = {
                id_jugador: item.id,
                nombre: item.principal || 'Jugador',
                color,
                rating: data[0] || null,
            };

            setComparaciones([nuevo]);
            setModalVisible(false);
        } catch (_e) {
            setModalVisible(false);
        }
    };

    const quitarComparacion = (id) => {
        setComparaciones((prev) => prev.filter((comp) => Number(comp.id_jugador) !== Number(id)));
    };

    const radarLabels = useMemo(() => ATRIBUTOS.map((attr) => attr.label), []);

    const radarDataPrincipal = useMemo(() => {
        if (!rating) return [];
        return ATRIBUTOS.map((attr) => toNumber(rating[attr.key]));
    }, [rating]);

    const radarDataComparacion1 = useMemo(() => {
        const comp = comparaciones[0];
        if (!comp?.rating) return [];
        return ATRIBUTOS.map((attr) => toNumber(comp.rating[attr.key]));
    }, [comparaciones]);

    const radarDataComparacion2 = useMemo(() => [], []);

    const atributoTemporadaSeleccionado = useMemo(
        () => META_ATRIBUTOS_TEMPORADA.find((item) => item.key === atributoTemporada) || null,
        [atributoTemporada]
    );

    const filasTemporada = useMemo(() => {
        const filas = [...ATRIBUTOS_TEMPORADA_BASE];
        if (atributoTemporadaSeleccionado && !filas.some((item) => item.key === atributoTemporadaSeleccionado.key)) {
            filas.push(atributoTemporadaSeleccionado);
        }
        return filas;
    }, [atributoTemporadaSeleccionado]);

    const percentilData = useMemo(() => {
        if (!rating) return [];
        return PERCENTILES.map((item) => {
            const valor = clampPercentil(rating[item.key]);
            return {
                value: valor,
                label: item.label,
                frontColor: getColorPercentil(valor),
            };
        });
    }, [rating]);

    if (cargando) {
        return (
            <View style={styles.estadoPantalla}>
                <ActivityIndicator size="small" color="#1f6fa7" />
                <Text style={styles.estadoTexto}>Cargando atributos...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.containerContent}>
                <View style={styles.headerRow}>
                    <View>
                        <Text style={styles.title}>Atributos</Text>
                        <Text style={styles.subtitle}>
                            {temporadaSeleccionada ? `Temporada ${temporadaSeleccionada}` : 'Sin temporada'}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={styles.compareButton}
                        onPress={() => setModalVisible(true)}
                        activeOpacity={0.85}
                        disabled={comparaciones.length >= 1}
                    >
                        <Ionicons name="person-add" size={16} color="#1f6fa7" />
                        <Text style={styles.compareButtonText}>
                            {comparaciones.length >= 1 ? 'Limite alcanzado' : 'Comparar'}
                        </Text>
                    </TouchableOpacity>
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

                {!error && !rating ? (
                    <View style={styles.estadoPantallaCompacto}>
                        <Ionicons name="stats-chart-outline" size={18} color="#6d839a" />
                        <Text style={styles.estadoTexto}>No hay ratings para esta temporada</Text>
                    </View>
                ) : null}

                {rating ? (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Radar de rendimiento</Text>
                        <View style={styles.legendRow}>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: COLORES_RADAR[0] }]} />
                                <Text style={styles.legendText} numberOfLines={1}>
                                    {rating?.nombre || 'Jugador'}
                                </Text>
                            </View>
                            {comparaciones.map((comp) => (
                                <View key={comp.id_jugador} style={styles.legendItem}>
                                    <View style={[styles.legendDot, { backgroundColor: comp.color }]} />
                                    <Text style={styles.legendText} numberOfLines={1}>
                                        {comp.nombre}
                                    </Text>
                                    <TouchableOpacity
                                        style={styles.legendRemove}
                                        onPress={() => quitarComparacion(comp.id_jugador)}
                                    >
                                        <Ionicons name="close" size={12} color="#6b86a1" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>

                        <View style={styles.chartRow}>
                            <View style={styles.chartColumn}>
                                <Text style={styles.chartTitle} numberOfLines={1}>
                                    {rating?.nombre || 'Jugador'}
                                </Text>
                                {radarDataPrincipal.length > 0 ? (
                                    <RadarChart
                                        data={radarDataPrincipal}
                                        labels={radarLabels}
                                        color={COLORES_RADAR[0]}
                                        opacity={0.25}
                                        maxValue={10}
                                        radius={RADAR_RADIUS}
                                        chartSize={CHART_SIZE}
                                        showValues={false}
                                        isAnimated={false}
                                        labelColor="#5f7f9b"
                                        axisColor="#d9e5f0"
                                        gridColor="#e6eef6"
                                    />
                                ) : null}
                            </View>
                            <View style={styles.chartColumn}>
                                <Text style={styles.chartTitle} numberOfLines={1}>
                                    {comparaciones[0]?.nombre || 'Comparacion'}
                                </Text>
                                {radarDataComparacion1.length > 0 ? (
                                    <RadarChart
                                        data={radarDataComparacion1}
                                        labels={radarLabels}
                                        color={COLORES_RADAR[1]}
                                        opacity={0.25}
                                        maxValue={10}
                                        radius={RADAR_RADIUS}
                                        chartSize={CHART_SIZE}
                                        showValues={false}
                                        isAnimated={false}
                                        labelColor="#5f7f9b"
                                        axisColor="#d9e5f0"
                                        gridColor="#e6eef6"
                                    />
                                ) : (
                                    <View style={styles.emptyCompare}>
                                        <Ionicons name="person-add" size={18} color="#6b86a1" />
                                        <Text style={styles.emptyCompareText}>Selecciona un jugador</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                        <View style={styles.abbrLegend}>
                            <Text style={styles.abbrLegendTitle}>Leyenda</Text>
                            <View style={styles.abbrLegendRow}>
                                <Text style={styles.abbrLegendItem}>AT: Ataque</Text>
                                <Text style={styles.abbrLegendItem}>CR: Creacion</Text>
                                <Text style={styles.abbrLegendItem}>DF: Defensa</Text>
                                <Text style={styles.abbrLegendItem}>POR: Porteros</Text>
                                <Text style={styles.abbrLegendItem}>DUEL: Duelos</Text>
                                <Text style={styles.abbrLegendItem}>REG: Regates</Text>
                            </View>
                        </View>
                    </View>
                ) : null}

                {rating ? (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Comparativa</Text>
                        {comparaciones.length === 0 ? (
                            <View style={styles.emptyCompare}>
                                <Ionicons name="stats-chart-outline" size={18} color="#6b86a1" />
                                <Text style={styles.emptyCompareText}>Agrega un jugador para comparar</Text>
                            </View>
                        ) : (
                            <>
                                <View style={styles.tableWrap}>
                                    <View style={styles.tableHeader}>
                                        <Text style={[styles.tableCell, styles.tableHeaderText]}>Atributo</Text>
                                        <Text style={[styles.tableCell, styles.tableHeaderText]} numberOfLines={1}>
                                            {rating?.nombre || 'Jugador'}
                                        </Text>
                                        <Text style={[styles.tableCell, styles.tableHeaderText]} numberOfLines={1}>
                                            {comparaciones[0]?.nombre || 'Comparacion'}
                                        </Text>
                                    </View>
                                    {ATRIBUTOS.map((attr) => {
                                        const valA = toNumber(rating?.[attr.key]);
                                        const valB = toNumber(comparaciones[0]?.rating?.[attr.key]);
                                        const mejorA = valA > valB;
                                        const mejorB = valB > valA;
                                        return (
                                            <View key={attr.key} style={styles.tableRow}>
                                                <Text style={styles.tableCell}>{attr.label}</Text>
                                                <Text style={[styles.tableCell, mejorA && styles.tableWinner]}>{valA.toFixed(2)}</Text>
                                                <Text style={[styles.tableCell, mejorB && styles.tableWinner]}>{valB.toFixed(2)}</Text>
                                            </View>
                                        );
                                    })}
                                </View>

                                <View style={styles.seasonCompareBlock}>
                                    <View style={styles.seasonCompareHeader}>
                                        <Text style={styles.subsectionTitle}>Datos de temporada</Text>
                                        <TouchableOpacity
                                            style={styles.selectorDropdown}
                                            onPress={() => setSelectorTemporadaAbierto((actual) => !actual)}
                                            activeOpacity={0.85}
                                        >
                                            <Text style={styles.selectorTexto} numberOfLines={1}>
                                                {atributoTemporadaSeleccionado?.label || 'Anadir atributo'}
                                            </Text>
                                            <Ionicons
                                                name={selectorTemporadaAbierto ? 'chevron-up' : 'chevron-down'}
                                                size={16}
                                                color="#5f7f9b"
                                            />
                                        </TouchableOpacity>
                                    </View>

                                    {selectorTemporadaAbierto ? (
                                        <View style={styles.dropdownList}>
                                            <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                                                {ATRIBUTOS_TEMPORADA.map((grupo) => (
                                                    <View key={grupo.grupo}>
                                                        <Text style={styles.dropdownGroup}>{grupo.grupo}</Text>
                                                        {grupo.items.map((item) => {
                                                            const activo = item.key === atributoTemporada;
                                                            return (
                                                                <TouchableOpacity
                                                                    key={item.key}
                                                                    style={[styles.dropdownItem, activo && styles.dropdownItemActive]}
                                                                    onPress={() => {
                                                                        setAtributoTemporada(item.key);
                                                                        setSelectorTemporadaAbierto(false);
                                                                    }}
                                                                    activeOpacity={0.85}
                                                                >
                                                                    <Text style={[styles.dropdownItemText, activo && styles.dropdownItemTextActive]}>
                                                                        {item.label}
                                                                    </Text>
                                                                </TouchableOpacity>
                                                            );
                                                        })}
                                                    </View>
                                                ))}
                                            </ScrollView>
                                        </View>
                                    ) : null}

                                    <View style={styles.tableWrap}>
                                        <View style={styles.tableHeader}>
                                            <Text style={[styles.tableCell, styles.tableHeaderText]}>Dato</Text>
                                            <Text style={[styles.tableCell, styles.tableHeaderText]} numberOfLines={1}>
                                                {rating?.nombre || 'Jugador'}
                                            </Text>
                                            <Text style={[styles.tableCell, styles.tableHeaderText]} numberOfLines={1}>
                                                {comparaciones[0]?.nombre || 'Comparacion'}
                                            </Text>
                                        </View>
                                        {filasTemporada.map((attr) => {
                                            const valA = Number(rating?.[attr.key]);
                                            const valB = Number(comparaciones[0]?.rating?.[attr.key]);
                                            const mejorA = Number.isFinite(valA) && Number.isFinite(valB) && valA > valB;
                                            const mejorB = Number.isFinite(valA) && Number.isFinite(valB) && valB > valA;
                                            return (
                                                <View key={attr.key} style={styles.tableRow}>
                                                    <Text style={styles.tableCell}>{attr.label}</Text>
                                                    <Text style={[styles.tableCell, mejorA && styles.tableWinner]}>
                                                        {formatTemporadaValue(rating?.[attr.key], attr.formato)}
                                                    </Text>
                                                    <Text style={[styles.tableCell, mejorB && styles.tableWinner]}>
                                                        {formatTemporadaValue(comparaciones[0]?.rating?.[attr.key], attr.formato)}
                                                    </Text>
                                                </View>
                                            );
                                        })}
                                    </View>
                                </View>
                            </>
                        )}
                    </View>
                ) : null}

                {rating ? (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Percentiles</Text>
                        <View style={styles.chartWrapBars}>
                            <BarChart
                                horizontal
                                data={percentilData}
                                barWidth={16}
                                spacing={14}
                                maxValue={100}
                                noOfSections={4}
                                stepValue={25}
                                xAxisLabelTextStyle={styles.axisLabel}
                                yAxisTextStyle={styles.axisLabel}
                                xAxisColor="#d9e5f0"
                                yAxisColor="#d9e5f0"
                                rulesColor="#e6eef6"
                                isAnimated={false}
                            />
                        </View>
                        <Text style={styles.percentilHint}>Colores: 0-25 roja, 25-50 naranja, 50-75 verde, 75-100 amarillo.</Text>
                    </View>
                ) : null}
            </ScrollView>

            <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <TouchableOpacity
                        style={styles.backdrop}
                        activeOpacity={1}
                        onPress={() => setModalVisible(false)}
                    />

                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Buscar jugadores</Text>
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => setModalVisible(false)}
                                activeOpacity={0.75}
                            >
                                <Ionicons name="close" size={18} color="#103a5d" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputRow}>
                            <Ionicons name="search" size={18} color="#5f7f9b" />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Buscar jugador"
                                placeholderTextColor="#8aa0b5"
                                autoCapitalize="none"
                                autoCorrect={false}
                                value={searchText}
                                onChangeText={setSearchText}
                            />
                        </View>

                        {isLoadingSearch ? (
                            <View style={styles.feedbackState}>
                                <ActivityIndicator size="small" color="#1f6fa7" />
                                <Text style={styles.feedbackText}>Buscando...</Text>
                            </View>
                        ) : searchText.trim().length < 2 ? (
                            <View style={styles.feedbackState}>
                                <Ionicons name="search-outline" size={20} color="#5f7f9b" />
                                <Text style={styles.feedbackText}>Escribe al menos 2 letras</Text>
                            </View>
                        ) : searchError ? (
                            <View style={styles.feedbackState}>
                                <Ionicons name="cloud-offline-outline" size={20} color="#5f7f9b" />
                                <Text style={styles.feedbackText}>{searchError}</Text>
                            </View>
                        ) : results.length === 0 ? (
                            <View style={styles.feedbackState}>
                                <Ionicons name="alert-circle-outline" size={20} color="#5f7f9b" />
                                <Text style={styles.feedbackText}>No hay resultados para tu busqueda</Text>
                            </View>
                        ) : (
                            <FlatList
                                data={results}
                                keyExtractor={(item, index) => `jugador-${item.id}-${index}`}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.resultItem}
                                        onPress={() => agregarComparacion(item)}
                                        activeOpacity={0.8}
                                    >
                                        <View style={styles.resultIconWrap}>
                                            <Ionicons name="person-outline" size={18} color="#1f6fa7" />
                                        </View>
                                        <View style={styles.resultTextWrap}>
                                            <Text style={styles.resultTitle} numberOfLines={1}>
                                                {item.principal}
                                            </Text>
                                            <Text style={styles.resultSubtitle} numberOfLines={1}>
                                                {item.secundario || 'Sin informacion'}
                                            </Text>
                                        </View>
                                        <Ionicons name="add" size={16} color="#5f7f9b" />
                                    </TouchableOpacity>
                                )}
                                style={styles.resultsList}
                                keyboardShouldPersistTaps="handled"
                                showsVerticalScrollIndicator={false}
                            />
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f4f8fc',
    },
    containerContent: {
        padding: 16,
        paddingBottom: 32,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: '#0f2743',
    },
    subtitle: {
        marginTop: 2,
        fontSize: 12,
        color: '#5f7f9b',
        fontWeight: '600',
    },
    compareButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: '#eaf3fb',
        borderWidth: 1,
        borderColor: '#d9e5f0',
    },
    compareButtonText: {
        marginLeft: 6,
        fontSize: 12,
        color: '#1f6fa7',
        fontWeight: '700',
    },
    listaTemporadas: {
        paddingVertical: 6,
        marginBottom: 10,
    },
    botonTemporada: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 18,
        backgroundColor: '#edf3f9',
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#d9e5f0',
    },
    botonTemporadaActivo: {
        backgroundColor: '#1f6fa7',
        borderColor: '#1f6fa7',
    },
    textoTemporada: {
        fontSize: 12,
        color: '#1e3f66',
        fontWeight: '700',
    },
    textoTemporadaActivo: {
        color: '#ffffff',
    },
    errorTexto: {
        color: '#d64545',
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 10,
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e4ebf2',
        padding: 14,
        marginBottom: 14,
        shadowColor: '#0d2b4a',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 4,
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#0f2743',
        marginBottom: 10,
    },
    legendRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 10,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor: '#f1f6fb',
        borderWidth: 1,
        borderColor: '#d9e5f0',
        marginRight: 8,
        marginBottom: 6,
    },
    legendDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    legendText: {
        fontSize: 11,
        color: '#1d3850',
        fontWeight: '700',
        maxWidth: 110,
    },
    legendRemove: {
        marginLeft: 6,
        width: 16,
        height: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#e9f1f8',
    },
    chartRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
    },
    chartColumn: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 6,
    },
    chartTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#1d3850',
        marginBottom: 6,
        maxWidth: 140,
        textAlign: 'center',
    },
    emptyCompare: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
    },
    emptyCompareText: {
        marginTop: 6,
        fontSize: 12,
        color: '#6b86a1',
        fontWeight: '600',
        textAlign: 'center',
    },
    abbrLegend: {
        marginTop: 10,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#eef3f8',
    },
    abbrLegendTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: '#1e3f66',
        marginBottom: 6,
    },
    abbrLegendRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    abbrLegendItem: {
        fontSize: 11,
        color: '#5f7f9b',
        fontWeight: '600',
        marginRight: 12,
        marginBottom: 4,
    },
    chartWrapBars: {
        paddingVertical: 6,
    },
    tableWrap: {
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e4ebf2',
        overflow: 'hidden',
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#edf3f9',
        borderBottomWidth: 1,
        borderBottomColor: '#e4ebf2',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#eef3f8',
    },
    tableCell: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 10,
        fontSize: 12,
        color: '#1d3850',
        fontWeight: '600',
    },
    tableHeaderText: {
        color: '#1e3f66',
        fontWeight: '800',
    },
    tableWinner: {
        color: '#1f6fa7',
    },
    seasonCompareBlock: {
        marginTop: 14,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#eef3f8',
    },
    seasonCompareHeader: {
        marginBottom: 10,
    },
    subsectionTitle: {
        fontSize: 13,
        fontWeight: '800',
        color: '#0f2743',
        marginBottom: 8,
    },
    selectorDropdown: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#d9e5f0',
        backgroundColor: '#ffffff',
        paddingHorizontal: 12,
        paddingVertical: 9,
    },
    selectorTexto: {
        flex: 1,
        paddingRight: 8,
        fontSize: 12,
        color: '#1e3f66',
        fontWeight: '700',
    },
    dropdownList: {
        marginBottom: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#d9e5f0',
        backgroundColor: '#ffffff',
        maxHeight: 230,
        overflow: 'hidden',
    },
    dropdownScroll: {
        paddingVertical: 6,
    },
    dropdownGroup: {
        paddingHorizontal: 12,
        paddingTop: 10,
        paddingBottom: 4,
        color: '#6b86a1',
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
    },
    dropdownItem: {
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    dropdownItemActive: {
        backgroundColor: '#edf3f9',
    },
    dropdownItemText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#1e3f66',
    },
    dropdownItemTextActive: {
        color: '#0f2743',
    },
    axisLabel: {
        fontSize: 10,
        color: '#6b86a1',
        fontWeight: '600',
    },
    percentilHint: {
        marginTop: 8,
        fontSize: 11,
        color: '#6b86a1',
        fontWeight: '600',
    },
    estadoPantalla: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        backgroundColor: '#f4f8fc',
    },
    estadoPantallaCompacto: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
    },
    estadoTexto: {
        marginTop: 6,
        fontSize: 13,
        color: '#5f7f9b',
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 16,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(16, 40, 64, 0.35)',
    },
    modalCard: {
        maxHeight: '70%',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#d9e5f0',
        backgroundColor: '#f4f8fc',
        paddingHorizontal: 14,
        paddingTop: 14,
        paddingBottom: 12,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    modalTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#103a5d',
    },
    closeButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#eaf3fb',
        alignItems: 'center',
        justifyContent: 'center',
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#d9e5f0',
        paddingHorizontal: 12,
        height: 44,
    },
    searchInput: {
        flex: 1,
        color: '#1d3850',
        fontSize: 14,
        height: '100%',
        marginLeft: 8,
    },
    resultsList: {
        marginTop: 10,
    },
    resultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#d9e5f0',
        paddingHorizontal: 10,
        paddingVertical: 10,
        marginBottom: 8,
    },
    resultIconWrap: {
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#eaf3fb',
        overflow: 'hidden',
    },
    resultTextWrap: {
        flex: 1,
        marginLeft: 10,
        marginRight: 8,
    },
    resultTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1d3850',
    },
    resultSubtitle: {
        fontSize: 12,
        color: '#59778f',
        marginTop: 2,
    },
    feedbackState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 24,
    },
    feedbackText: {
        fontSize: 13,
        color: '#59778f',
        fontWeight: '500',
        marginTop: 6,
    },
});
