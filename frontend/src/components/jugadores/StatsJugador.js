import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function StatsJugador({ id_jugador, route }) {
    const jugadorId = id_jugador ?? route?.params?.id_jugador ?? route?.params?.idjugador;
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Estadísticas del Jugador {jugadorId ?? '-'}</Text>
        </View>
    );
}

const styles = StyleSheet.create({  
    container: {
        flex: 1,    
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',

    },
});