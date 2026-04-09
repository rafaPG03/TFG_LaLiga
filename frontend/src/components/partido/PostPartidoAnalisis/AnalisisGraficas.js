import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';

export default function AnalisisGraficas() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Análisis de Gráficas</Text>
            <Text style={styles.subtitle}>Aquí se mostrarán las estadísticas individuales de los jugadores destacados del partido.</Text>
            {/* Aquí puedes agregar componentes para mostrar las estadísticas de los jugadores */}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },  
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 20,   
    },
});
