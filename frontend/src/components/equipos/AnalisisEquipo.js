import React from "react";
import { View } from "react-native";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import GraficosEquipo from "./GraficosEquipo";
import GraficosJugadoresEquipo from "./GraficosJugadoresEquipo";

const Tab = createMaterialTopTabNavigator();

export default function AnalisisEquipo({ id_equipo }) {
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
          tabBarActiveTintColor: "#12233f",
          tabBarInactiveTintColor: "#6f8096",
          tabBarStyle: { backgroundColor: "#ffffff" },
          tabBarItemStyle: { width: 150, paddingHorizontal: 12 },
          tabBarScrollEnabled: true,
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
