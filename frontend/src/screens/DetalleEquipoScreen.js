import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import CustomHeader from "../components/header";
import FavoritoButton from "../components/FavoritoButton";
import PartidosEquipo from "../components/equipos/partidosEquipo";
import PlantillaEquipo from "../components/equipos/plantillaEquipo";
import TrayectoriaEquipo from "../components/equipos/trayectoriaEquipo";
import ClasificacionEquipo from "../components/equipos/clasificacionEquipo";
import InfoEquipo from "../components/equipos/infoEquipo";
import AnalisisEquipo from "../components/equipos/AnalisisEquipo";

const Tab = createMaterialTopTabNavigator();

const EQUIPO_FALLBACK = {
  nombre_equipo: "Equipo no disponible",
  logo: null,
  pais: null,
  estadio: null,
  fundado_en: null,
};

function PlaceholderTab({ label }) {
  return (
    <View style={styles.placeholderContainer}>
      <Ionicons name="construct-outline" size={34} color="#5f7f9b" />
      <Text style={styles.placeholderTitle}>{label}</Text>
      <Text style={styles.placeholderText}>
        Esta pestaña queda lista para conectar su pantalla específica.
      </Text>
    </View>
  );
}

export default function DetalleEquipoScreen({ navigation, route }) {
  const idEquipo =
    route?.params?.idEquipo ?? route?.params?.id ?? route?.params?.id_equipo;
  const [loading, setLoading] = useState(true);
  const [equipoInfo, setEquipoInfo] = useState(null);

  useEffect(() => {
    cargarDatosEquipo();
  }, [idEquipo]);

  const cargarDatosEquipo = async () => {
    try {
      if (!idEquipo) {
        setEquipoInfo(EQUIPO_FALLBACK);
        return;
      }

      setLoading(true);

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/equipos/${idEquipo}`,
      );

      if (!response.ok) {
        throw new Error("No se pudo cargar la información del equipo");
      }

      const data = await response.json();
      setEquipoInfo(data ?? EQUIPO_FALLBACK);
    } catch (error) {
      setEquipoInfo(EQUIPO_FALLBACK);
    } finally {
      setLoading(false);
    }
  };

  const equipo = equipoInfo ?? EQUIPO_FALLBACK;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1f6fa7" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <CustomHeader
        title="Detalle del Equipo"
        onMenuPress={() => navigation.openDrawer()}
        onSearchPress={() => Alert.alert("Función de búsqueda no implementada")}
      />

      <View style={styles.equipoCard}>
        <View style={styles.logoWrapper}>
          {equipo.logo ? (
            <Image source={{ uri: equipo.logo }} style={styles.logoEquipo} />
          ) : (
            <Ionicons name="shield-outline" size={40} color="#325b88" />
          )}
        </View>

        <View style={styles.infoPrincipal}>
          <Text style={styles.nombreEquipo} numberOfLines={2}>
            {equipo.nombre_equipo}
          </Text>

          <View style={styles.metaRow}>
            {equipo.pais ? (
              <View style={styles.metaBadge}>
                <Ionicons name="flag-outline" size={14} color="#1e3f66" />
                <Text style={styles.metaText}>{equipo.pais}</Text>
              </View>
            ) : null}

            {equipo.fundado_en ? (
              <View style={styles.metaBadge}>
                <Ionicons name="calendar-outline" size={14} color="#1e3f66" />
                <Text style={styles.metaText}>{equipo.fundado_en}</Text>
              </View>
            ) : null}
          </View>

          {equipo.estadio ? (
            <Text style={styles.estadioText} numberOfLines={1}>
              {equipo.estadio}
            </Text>
          ) : null}
        </View>

        {idEquipo ? (
          <FavoritoButton
            id={idEquipo}
            tipo="equipo"
            style={styles.favoritoDetalle}
          />
        ) : null}
      </View>

      <Tab.Navigator
        screenOptions={{
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "bold",
            textAlign: "center",
          },
          tabBarIndicatorStyle: { backgroundColor: "#e20613" },
          tabBarActiveTintColor: "#12233f",
          tabBarInactiveTintColor: "#6f8096",
          tabBarStyle: { backgroundColor: "#ffffff" },
          tabBarItemStyle: { flex: 1, minWidth: 0, paddingHorizontal: 8 },
          tabBarScrollEnabled: true,
          lazy: true,
        }}
      >
        <Tab.Screen name="Info" options={{ tabBarLabel: "INFO" }}>
          {() => <InfoEquipo id_equipo={idEquipo} />}
        </Tab.Screen>
        <Tab.Screen name="Partidos" options={{ tabBarLabel: "PARTIDOS" }}>
          {() => <PartidosEquipo id_equipo={idEquipo} />}
        </Tab.Screen>
        <Tab.Screen name="Trayectoria" options={{ tabBarLabel: "TRAYECTORIA" }}>
          {() => <TrayectoriaEquipo id_equipo={idEquipo} />}
        </Tab.Screen>
        <Tab.Screen
          name="Clasificacion"
          options={{ tabBarLabel: "CLASIFICACION" }}
        >
          {() => <ClasificacionEquipo id_equipo={idEquipo} />}
        </Tab.Screen>
        <Tab.Screen name="Plantilla" options={{ tabBarLabel: "PLANTILLA" }}>
          {() => <PlantillaEquipo id_equipo={idEquipo} />}
        </Tab.Screen>
        <Tab.Screen name="Analisis" options={{ tabBarLabel: "ANALISIS" }}>
          {() => <AnalisisEquipo id_equipo={idEquipo} />}
        </Tab.Screen>
      </Tab.Navigator>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f8fc",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f4f8fc",
  },
  equipoCard: {
    marginHorizontal: 14,
    marginTop: 12,
    marginBottom: 10,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e4ebf2",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#0d2b4a",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  logoWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#e9f1f8",
    borderWidth: 2,
    borderColor: "#d6e3f1",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginRight: 12,
  },
  logoEquipo: {
    width: "78%",
    height: "78%",
    resizeMode: "contain",
  },
  infoPrincipal: {
    flex: 1,
  },
  nombreEquipo: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0f2743",
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: 8,
  },
  metaBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#edf3f9",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 8,
    marginBottom: 6,
  },
  metaText: {
    color: "#1e3f66",
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 4,
  },
  estadioText: {
    color: "#4f6782",
    fontSize: 13,
    fontWeight: "600",
  },
  favoritoDetalle: {
    marginLeft: 8,
  },
  placeholderContainer: {
    flex: 1,
    backgroundColor: "#f4f8fc",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingVertical: 36,
  },
  placeholderTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: "800",
    color: "#103a5d",
  },
  placeholderText: {
    marginTop: 8,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
    color: "#5f7f9b",
  },
});
