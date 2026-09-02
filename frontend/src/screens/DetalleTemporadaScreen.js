import React from 'react';
import {
	Alert,
	KeyboardAvoidingView,
	Platform,
	StyleSheet,
	View,
} from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import CustomHeader from '../components/header';

import PartidosTab from '../components/temporadas/PartidosTemporada';
import ClasificacionTab from '../components/temporadas/ClasificacionTemporada';
import InfoTab from '../components/temporadas/InfoTemporada';
import RankingsTab from '../components/temporadas/RankingsTemporada';
import AnalisisTab from '../components/temporadas/AnalisisTemporada';
import EquiposTab from '../components/temporadas/EquiposTemporada';
import { useTheme } from '../theme/ThemeContext';

const Tab = createMaterialTopTabNavigator();

const getTemporadaLabel = (temporadaParam) => {
	if (temporadaParam && typeof temporadaParam === 'object') {
		return temporadaParam.temporada ?? 'N/D';
	}

	return temporadaParam ?? 'N/D';
};

export default function DetalleTemporadaScreen({ navigation, route }) {
	const { colors } = useTheme();
	const temporadaParam = route?.params?.temporada;
	const temporadaLabel = getTemporadaLabel(temporadaParam);

	return (
		<KeyboardAvoidingView
			style={styles.container}
			behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
		>
			<CustomHeader
				title={`Temporada ${temporadaLabel}`}
				onMenuPress={() => navigation.openDrawer()}
				onSearchPress={() => Alert.alert('Función de búsqueda no implementada')}
			/>

			<View style={styles.tabsWrapper}>
				<Tab.Navigator
					screenOptions={{
						tabBarLabelStyle: { fontSize: 12, fontWeight: 'bold', textAlign: 'center' },
						tabBarIndicatorStyle: { backgroundColor: '#e20613' },
						tabBarActiveTintColor: colors.textStrong,
						tabBarInactiveTintColor: colors.textMuted,
						tabBarStyle: { backgroundColor: colors.surface },
						tabBarItemStyle: { width: 140, paddingHorizontal: 12 },
						tabBarScrollEnabled: true,
						lazy: true,
					}}
				>
					<Tab.Screen name="Partidos" options={{ tabBarLabel: 'PARTIDOS' }}>
						{() => <PartidosTab temporada={temporadaLabel} />}
					</Tab.Screen>
					<Tab.Screen name="Clasificacion" options={{ tabBarLabel: 'CLASIFICACIÓN' }}>
						{() => <ClasificacionTab temporada={temporadaLabel} />}
					</Tab.Screen>
					<Tab.Screen name="Info" options={{ tabBarLabel: 'INFO' }}>
						{() => <InfoTab temporada={temporadaLabel} />}
					</Tab.Screen>
					<Tab.Screen name="Rankings" options={{ tabBarLabel: 'RANKINGS' }}>
						{() => <RankingsTab temporada={temporadaLabel} />}
					</Tab.Screen>
					<Tab.Screen name="Analisis" options={{ tabBarLabel: 'ANÁLISIS' }}>
						{() => <AnalisisTab temporada={temporadaLabel} />}
					</Tab.Screen>
					<Tab.Screen name="Equipos" options={{ tabBarLabel: 'EQUIPOS' }}>
						{() => <EquiposTab temporada={temporadaLabel} />}
					</Tab.Screen>
				</Tab.Navigator>
			</View>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f4f8fc',
	},
	tabsWrapper: {
		flex: 1,
	},
});
