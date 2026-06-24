import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function GraficosJugadoresEquipo() {
  return (
    <View style={styles.container}>
      <Ionicons name="people-outline" size={34} color="#5f7f9b" />
      <Text style={styles.title}>Análisis de jugadores</Text>
      <Text style={styles.text}>
        Esta pestaña queda preparada para el análisis individual de la
        plantilla.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f8fc",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: "800",
    color: "#0f2743",
  },
  text: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: "#5a7189",
    textAlign: "center",
  },
});
