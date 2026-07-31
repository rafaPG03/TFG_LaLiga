import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import CustomHeader from "../components/header";
import AnalisisEquipos from "../components/analisisIA/AnalisisEquipos";
import AnalisisFavoritos from "../components/analisisIA/AnalisisFavoritos";
import AnalisisJugadores from "../components/analisisIA/AnalisisJugadores";
import AnalisisPredicciones from "../components/analisisIA/AnalisisPredicciones";
import {
  EstadoConsulta,
  PestanasAnalisis,
  SelectorTemporada,
} from "../components/analisisIA/ComponentesAnalisis";
import useConsultaDataMining from "../components/analisisIA/useConsultaDataMining";
import { useTheme } from "../theme/ThemeContext";

export default function AnalisisIAScreen({ navigation }) {
  const { colors } = useTheme();
  const [pestanaActiva, setPestanaActiva] = useState("favoritos");
  const [temporada, setTemporada] = useState(null);
  const [selectorTemporadaVisible, setSelectorTemporadaVisible] =
    useState(false);
  const rutaCatalogos = temporada
    ? `/data-mining/catalogos?temporada=${temporada}`
    : "/data-mining/catalogos";
  const {
    data: catalogos,
    cargando,
    error,
    recargar,
  } = useConsultaDataMining(rutaCatalogos);

  useEffect(() => {
    const temporadaRespuesta = Number(catalogos?.meta?.temporada);
    if (!temporada && Number.isInteger(temporadaRespuesta)) {
      setTemporada(temporadaRespuesta);
    }
  }, [catalogos, temporada]);

  const seleccionarTemporada = (valor) => {
    setTemporada(Number(valor));
    setSelectorTemporadaVisible(false);
  };

  const renderContenido = () => {
    if (!temporada) {
      return (
        <EstadoConsulta
          cargando={cargando}
          error={error}
          onReintentar={recargar}
          vacio={!cargando && !error}
          mensajeVacio="No hay temporadas disponibles."
        />
      );
    }

    if (pestanaActiva === "equipos") {
      return (
        <AnalisisEquipos
          temporada={temporada}
          equipos={Array.isArray(catalogos?.equipos) ? catalogos.equipos : []}
        />
      );
    }
    if (pestanaActiva === "jugadores") {
      return <AnalisisJugadores temporada={temporada} />;
    }
    if (pestanaActiva === "predicciones") {
      return <AnalisisPredicciones temporada={temporada} />;
    }
    return <AnalisisFavoritos temporada={temporada} />;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <CustomHeader
        title="Análisis IA"
        onMenuPress={() => navigation.openDrawer()}
      />

      <View style={[styles.controles, { backgroundColor: colors.background }]}>
        <View style={styles.presentacion}>
          <View
            style={[
              styles.presentacionIcono,
              { backgroundColor: colors.surfaceAlt },
            ]}
          >
            <Ionicons
              name="sparkles-outline"
              size={21}
              color={colors.primary}
            />
          </View>
          <View style={styles.presentacionTexto}>
            <Text
              style={[styles.presentacionTitulo, { color: colors.textStrong }]}
            >
              Analiza tu equipo y tus jugadores favoritos
            </Text>
          </View>
        </View>

        <SelectorTemporada
          temporadas={catalogos?.meta?.temporadas || []}
          temporada={temporada}
          visible={selectorTemporadaVisible}
          onAbrir={() => setSelectorTemporadaVisible(true)}
          onCerrar={() => setSelectorTemporadaVisible(false)}
          onSeleccionar={seleccionarTemporada}
        />
      </View>

      <PestanasAnalisis activa={pestanaActiva} onChange={setPestanaActiva} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.contenido}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {error && temporada ? (
          <View
            style={[
              styles.avisoCatalogos,
              { backgroundColor: colors.surfaceAlt },
            ]}
          >
            <Ionicons name="warning-outline" size={17} color={colors.warning} />
            <Text style={[styles.avisoTexto, { color: colors.text }]}>
              No se pudo actualizar la lista de filtros. El análisis puede
              seguir disponible.
            </Text>
          </View>
        ) : null}
        {renderContenido()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  controles: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 },
  presentacion: {
    minHeight: 48,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  presentacionIcono: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  presentacionTexto: { flex: 1, marginLeft: 10 },
  presentacionTitulo: { fontSize: 17, fontWeight: "900" },
  presentacionSubtitulo: { marginTop: 2, fontSize: 11, lineHeight: 15 },
  scroll: { flex: 1 },
  contenido: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 34 },
  avisoCatalogos: {
    minHeight: 48,
    marginBottom: 12,
    paddingHorizontal: 10,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  avisoTexto: { flex: 1, fontSize: 11, lineHeight: 16, fontWeight: "600" },
});
