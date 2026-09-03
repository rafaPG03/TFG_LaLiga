import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

export default function AnalisisEquipo({ route }) {
    const { datosEquipo, partidoInfo } = route.params || {};

    const [local, visitante] = useMemo(() => {
        if (!Array.isArray(datosEquipo) || datosEquipo.length < 2) {
            return [null, null];
        }

        return [datosEquipo[0], datosEquipo[1]];
    }, [datosEquipo]);

    const statsConfig = [
        { key: 'posesion', label: 'Posesión', mayorMejor: true, sufijo: '%' },
        { key: 'tiros_totales', label: 'Tiros', mayorMejor: true },
        { key: 'tiros_a_puerta', label: 'Tiros a puerta', mayorMejor: true },
        { key: 'precision_tiro', label: 'Precisión de tiro', mayorMejor: true, sufijo: '%' },
        { key: 'pases_totales', label: 'Pases', mayorMejor: true },
        { key: 'pct_pases_acertados', label: 'Pases acertados', mayorMejor: true, sufijo: '%' },
        { key: 'faltas_cometidas', label: 'Faltas', mayorMejor: false },
        { key: 'corners', label: 'Corners', mayorMejor: true },
        { key: 'fueras_de_juego', label: 'Fueras de juego', mayorMejor: false },
        { key: 'tarjetas_amarillas', label: 'Amarillas', mayorMejor: false },
        { key: 'tarjetas_rojas', label: 'Rojas', mayorMejor: false },
        { key: 'goles_esperados', label: 'xG', mayorMejor: true },
        { key: 'df_goles_esperados', label: 'Dif. xG', mayorMejor: true },
    ];

    const formatearValor = (valor, sufijo = '') => {
        const numero = Number(valor);
        if (!Number.isFinite(numero)) return '-';

        const texto = Number.isInteger(numero) ? `${numero}` : numero.toFixed(1);
        return `${texto}${sufijo}`;
    };

    const getGanador = (valorLocal, valorVisitante, mayorMejor) => {
        const nLocal = Number(valorLocal);
        const nVisitante = Number(valorVisitante);

        if (!Number.isFinite(nLocal) || !Number.isFinite(nVisitante)) return 'none';
        if (nLocal === nVisitante) return 'empate';

        if (mayorMejor) {
            return nLocal > nVisitante ? 'local' : 'visitante';
        }

        return nLocal < nVisitante ? 'local' : 'visitante';
    };

    if (!local || !visitante) {
        return (
            <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>No hay estadisticas de equipos para este partido</Text>
            </View>
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Análisis de equipos</Text>

            <View style={styles.tablaWrap}>
                <View style={styles.headerRow}>
                    <Text style={[styles.headerText, styles.colEquipo]} numberOfLines={1}>
                        {partidoInfo?.equipo_local || local.nombre_equipo || 'Local'}
                    </Text>
                    <Text style={[styles.headerText, styles.colStat]}>Atributo</Text>
                    <Text style={[styles.headerText, styles.colEquipo]} numberOfLines={1}>
                        {partidoInfo?.equipo_visitante || visitante.nombre_equipo || 'Visitante'}
                    </Text>
                </View>

                {statsConfig.map((stat) => {
                    const valorLocal = local[stat.key];
                    const valorVisitante = visitante[stat.key];
                    const ganador = getGanador(valorLocal, valorVisitante, stat.mayorMejor);

                    return (
                        <View key={stat.key} style={styles.filaRow}>
                            <View style={styles.colEquipo}>
                                <View style={[styles.valorWrap, ganador === 'local' && styles.valorMejor]}>
                                    <Text style={styles.valorText}>{formatearValor(valorLocal, stat.sufijo)}</Text>
                                </View>
                            </View>

                            <Text style={styles.colStat}>{stat.label}</Text>

                            <View style={styles.colEquipo}>
                                <View style={[styles.valorWrap, ganador === 'visitante' && styles.valorMejor]}>
                                    <Text style={styles.valorText}>{formatearValor(valorVisitante, stat.sufijo)}</Text>
                                </View>
                            </View>
                        </View>
                    );
                })}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 12,
        paddingTop: 12,
        paddingBottom: 24,
    },
    title: {
        fontSize: 17,
        fontWeight: '800',
        color: '#12233f',
        marginBottom: 10,
    },
    tablaWrap: {
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#d2e0ec',
        overflow: 'hidden',
        backgroundColor: '#ffffff',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 5,
        paddingVertical: 5,
        backgroundColor: '#edf3f9',
        borderBottomWidth: 1,
        borderBottomColor: '#d2e0ec',
    },
    headerText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#2f4a63',
        textAlign: 'center',
    },
    filaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 5,
        paddingVertical: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#eef3f7',
    },
    colEquipo: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    colStat: {
        width: 112,
        textAlign: 'center',
        color: '#1f3851',
        fontSize: 12,
        fontWeight: '700',
    },
    valorWrap: {
        minWidth: 46,
        paddingHorizontal: 5,
        paddingVertical: 5,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
        borderRadius: 8,
    },
    valorMejor: {
        borderBottomColor: '#16a34a',
        backgroundColor: '#ecfdf3',
    },
    valorText: {
        color: '#1f3851',
        fontSize: 13,
        fontWeight: '800',
        textAlign: 'center',
    },
    emptyWrap: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 14,
        paddingVertical: 20,
    },
    emptyText: {
        textAlign: 'center',
        fontSize: 13,
        color: '#3d5b77',
        fontWeight: '600',
    },
});
