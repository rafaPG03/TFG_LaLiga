import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';

export default function PostPartidoTab({ route }) {
  const { id_partido } = route.params;
  const [loading, setLoading] = useState(true);
  const [datos, setDatos] = useState(null);

  useEffect(() => {
    // Aquí llamas a tu API: /api/partidos/:id/previa-lideres y estado-previa
    // fetch(...)
    setLoading(false);
  }, []);

  if (loading) return <ActivityIndicator style={{flex: 1}} />;

  return (
    <ScrollView style={{ padding: 15 }}>
      <Text style={{ fontWeight: 'bold', fontSize: 18 }}>Posición actual</Text>
      {/* Aquí renderizas tus secciones: Racha, H2H, Cracks */}
      <View style={{ height: 100, backgroundColor: '#f0f0f0', marginVertical: 10, borderRadius: 10, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Gráfico de Probabilidades (Data Mining)</Text>
      </View>
    </ScrollView>
  );
}