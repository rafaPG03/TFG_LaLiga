import React from "react";
import { View } from "react-native";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import GraficosEquipo from "./GraficosEquipo";
import GraficosJugadoresEquipo from "./GraficosJugadoresEquipo";
import { useTheme } from "../../theme/ThemeContext";

const Tab = createMaterialTopTabNavigator();

export default function AnalisisEquipo({ id_equipo }) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: "#f4f8fc" }}>
      <Tab.Navigator
        screenOptions={{
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "bold",
            textAlign: "center",
          },
          tabBarIndicatorStyle: { backgroundColor: "#e20613" },
          tabBarActiveTintColor: colors.textStrong,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: { backgroundColor: colors.surface },
          tabBarItemStyle: { flex: 1, minWidth: 0, paddingHorizontal: 8 },
          tabBarScrollEnabled: false,
          lazy: true,
        }}
      >
        <Tab.Screen name="Equipo" options={{ tabBarLabel: "EQUIPO" }}>
          {() => <GraficosEquipo id_equipo={id_equipo} />}
        </Tab.Screen>
        <Tab.Screen name="Jugadores" options={{ tabBarLabel: "JUGADORES" }}>
          {() => <GraficosJugadoresEquipo id_equipo={id_equipo} />}
        </Tab.Screen>
      </Tab.Navigator>
    </View>
  );
}
