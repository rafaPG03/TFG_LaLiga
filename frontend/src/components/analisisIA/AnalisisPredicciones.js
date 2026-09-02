import React, { useMemo, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../theme/ThemeContext";
import useConsultaDataMining from "./useConsultaDataMining";
import {
  BarrasPrediccion,
  EncabezadoSeccion,
  EstadoConsulta,
  Separador,
  TarjetaDesplegable,
  formatearNumero,
  formatearPorcentaje,
} from "./ComponentesAnalisis";

const formatearFecha = (fecha) => {
  if (!fecha) return "Fecha no disponible";
  const [anio, mes, dia] = String(fecha).split("-");
  return dia && mes && anio ? `${dia}/${mes}/${anio}` : fecha;
};

const formatearPrediccion = (prediccion) => {
  if (!prediccion) return "Sin predicción";
  const texto = String(prediccion)
    .replace(/victoria\s*local/i, "Victoria local")
    .replace(/victoria\s*visitante/i, "Victoria visitante")
    .replace(/empate/i, "Empate");
  return texto.charAt(0).toUpperCase() + texto.slice(1);
};

const obtenerGoleador = (goleadores, idEquipo) =>
  [...(goleadores || [])]
    .filter((item) => Number(item.id_equipo) === Number(idEquipo))
    .sort(
      (a, b) => Number(b.probabilidad || 0) - Number(a.probabilidad || 0),
    )[0] || null;

export default function AnalisisPredicciones({ temporada }) {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const [abiertos, setAbiertos] = useState({});
  const { data, cargando, error, recargar } = useConsultaDataMining(
    temporada ? `/data-mining/predicciones?temporada=${temporada}` : null,
    Boolean(temporada),
  );
  const partidos = useMemo(
    () => (Array.isArray(data?.partidos) ? data.partidos : []),
    [data],
  );

  if (cargando) return <EstadoConsulta cargando />;
  if (error) return <EstadoConsulta error={error} onReintentar={recargar} />;
  if (partidos.length === 0) {
    return (
      <EstadoConsulta
        vacio
        mensajeVacio="No hay partidos pendientes con predicciones calculadas para esta temporada."
      />
    );
  }

  return (
    <View>
      <EncabezadoSeccion
        titulo="Próximos partidos"
        subtitulo="Probabilidades, goles esperados y posibles goleadores"
        icono="football-outline"
      />

      {partidos.map((partido) => {
        const clave = String(partido.id_partido);
        const goleadorLocal = obtenerGoleador(
          partido.probables_goleadores,
          partido.id_local,
        );
        const goleadorVisitante = obtenerGoleador(
          partido.probables_goleadores,
          partido.id_visitante,
        );
        const subtitulo = `Jornada ${partido.jornada || "-"} · ${formatearFecha(partido.fecha)}`;

        return (
          <TarjetaDesplegable
            key={clave}
            abierta={Boolean(abiertos[clave])}
            onPress={() =>
              setAbiertos((prev) => ({ ...prev, [clave]: !prev[clave] }))
            }
            onDetalle={() =>
              navigation.navigate("DetallePartido", {
                id_partido: partido.id_partido,
              })
            }
            cabeceraPersonalizada={
              <View style={styles.resumenPartido}>
                <View style={styles.resumenEquipos}>
                  <View style={styles.resumenEquipo}>
                    {partido.logo_local ? (
                      <Image
                        source={{ uri: partido.logo_local }}
                        style={styles.resumenLogo}
                        resizeMode="contain"
                      />
                    ) : (
                      <Ionicons
                        name="shield-outline"
                        size={24}
                        color={colors.primary}
                      />
                    )}
                    <Text
                      style={[
                        styles.resumenEquipoNombre,
                        { color: colors.textStrong },
                      ]}
                      numberOfLines={1}
                    >
                      {partido.codigo_local || partido.equipo_local}
                    </Text>
                  </View>

                  <View style={styles.resumenCentro}>
                    <Text
                      style={[styles.resumenHora, { color: colors.textStrong }]}
                    >
                      {String(partido.hora || "").slice(0, 5) || "--:--"}
                    </Text>
                    <Text
                      style={[styles.resumenMeta, { color: colors.textMuted }]}
                      numberOfLines={1}
                    >
                      {subtitulo}
                    </Text>
                  </View>

                  <View style={styles.resumenEquipo}>
                    {partido.logo_visitante ? (
                      <Image
                        source={{ uri: partido.logo_visitante }}
                        style={styles.resumenLogo}
                        resizeMode="contain"
                      />
                    ) : (
                      <Ionicons
                        name="shield-outline"
                        size={24}
                        color={colors.primary}
                      />
                    )}
                    <Text
                      style={[
                        styles.resumenEquipoNombre,
                        { color: colors.textStrong },
                      ]}
                      numberOfLines={1}
                    >
                      {partido.codigo_visitante || partido.equipo_visitante}
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.resumenPrediccion,
                    { backgroundColor: colors.surfaceAlt },
                  ]}
                >
                  <Text
                    style={[
                      styles.resumenPrediccionTexto,
                      { color: colors.primary },
                    ]}
                    numberOfLines={1}
                  >
                    {formatearPrediccion(partido.prediccion)}
                  </Text>
                </View>
              </View>
            }
          >
            <Text style={[styles.bloqueTitulo, { color: colors.textStrong }]}>
              Predicción del partido
            </Text>
            <BarrasPrediccion
              local={partido.prob_victoria_local}
              empate={partido.prob_empate}
              visitante={partido.prob_victoria_visitante}
              nombres={{
                local: partido.codigo_local || partido.equipo_local,
                visitante: partido.codigo_visitante || partido.equipo_visitante,
              }}
            />

            <Separador />
            <Text style={[styles.bloqueTitulo, { color: colors.textStrong }]}>
              Goles esperados
            </Text>
            <View style={styles.golesEsperados}>
              <View style={styles.golesEquipo}>
                <Text
                  style={[styles.golesEtiqueta, { color: colors.textMuted }]}
                >
                  {partido.codigo_local || "Local"}
                </Text>
                <Text style={[styles.golesValor, { color: colors.textStrong }]}>
                  {formatearNumero(partido.goles_local_esperados)}
                </Text>
              </View>
              <View
                style={[
                  styles.marcador,
                  { backgroundColor: colors.surfaceAlt },
                ]}
              >
                <Text
                  style={[styles.marcadorEtiqueta, { color: colors.textMuted }]}
                >
                  Marcador estimado
                </Text>
                <Text style={[styles.marcadorValor, { color: colors.primary }]}>
                  {partido.marcador_estimado || "-"}
                </Text>
              </View>
              <View style={styles.golesEquipo}>
                <Text
                  style={[styles.golesEtiqueta, { color: colors.textMuted }]}
                >
                  {partido.codigo_visitante || "Visitante"}
                </Text>
                <Text style={[styles.golesValor, { color: colors.textStrong }]}>
                  {formatearNumero(partido.goles_visitante_esperados)}
                </Text>
              </View>
            </View>

            <Separador />
            <Text style={[styles.bloqueTitulo, { color: colors.textStrong }]}>
              Goleadores probables
            </Text>
            <View style={styles.goleadores}>
              <Goleador
                goleador={goleadorLocal}
                equipo={partido.codigo_local || partido.equipo_local}
              />
              <Goleador
                goleador={goleadorVisitante}
                equipo={partido.codigo_visitante || partido.equipo_visitante}
              />
            </View>
          </TarjetaDesplegable>
        );
      })}
    </View>
  );
}

function Goleador({ goleador, equipo }) {
  const navigation = useNavigation();
  const { colors } = useTheme();

  if (!goleador) {
    return (
      <View style={[styles.goleador, { borderColor: colors.border }]}>
        <Text style={[styles.goleadorEquipo, { color: colors.textMuted }]}>
          {equipo}
        </Text>
        <Text style={[styles.goleadorVacio, { color: colors.textMuted }]}>
          Sin datos
        </Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.goleador, { borderColor: colors.border }]}
      onPress={() =>
        navigation.navigate("DetalleJugador", {
          id_jugador: goleador.id_jugador,
        })
      }
    >
      <Text
        style={[styles.goleadorEquipo, { color: colors.textMuted }]}
        numberOfLines={1}
      >
        {equipo}
      </Text>
      {goleador.foto ? (
        <Image source={{ uri: goleador.foto }} style={styles.goleadorFoto} />
      ) : (
        <View
          style={[
            styles.goleadorFotoVacia,
            { backgroundColor: colors.surfaceAlt },
          ]}
        >
          <Ionicons name="person-outline" size={20} color={colors.primary} />
        </View>
      )}
      <Text
        style={[styles.goleadorNombre, { color: colors.textStrong }]}
        numberOfLines={2}
      >
        {goleador.nombre_jugador}
      </Text>
      <Text style={[styles.goleadorProbabilidad, { color: colors.primary }]}>
        {formatearPorcentaje(goleador.probabilidad)}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  resumenPartido: { gap: 6 },
  resumenEquipos: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  resumenEquipo: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
  },
  resumenLogo: { width: 32, height: 32 },
  resumenEquipoNombre: {
    width: "100%",
    marginTop: 3,
    fontSize: 10,
    fontWeight: "900",
    textAlign: "center",
  },
  resumenCentro: {
    width: 94,
    alignItems: "center",
  },
  resumenHora: { fontSize: 15, fontWeight: "900" },
  resumenMeta: {
    width: "100%",
    marginTop: 2,
    fontSize: 8,
    fontWeight: "700",
    textAlign: "center",
  },
  resumenPrediccion: {
    alignSelf: "center",
    maxWidth: "100%",
    minHeight: 23,
    paddingHorizontal: 10,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  resumenPrediccionTexto: { fontSize: 10, fontWeight: "900" },
  bloqueTitulo: { marginBottom: 10, fontSize: 14, fontWeight: "800" },
  golesEsperados: { flexDirection: "row", alignItems: "center" },
  golesEquipo: { flex: 1, alignItems: "center" },
  golesEtiqueta: { fontSize: 10, fontWeight: "700" },
  golesValor: { marginTop: 4, fontSize: 24, fontWeight: "900" },
  marcador: {
    minWidth: 112,
    minHeight: 56,
    paddingHorizontal: 9,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  marcadorEtiqueta: { fontSize: 9, fontWeight: "600" },
  marcadorValor: { marginTop: 4, fontSize: 18, fontWeight: "900" },
  goleadores: { flexDirection: "row", gap: 9 },
  goleador: {
    flex: 1,
    minHeight: 142,
    padding: 9,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: "center",
  },
  goleadorEquipo: {
    width: "100%",
    marginBottom: 7,
    fontSize: 9,
    fontWeight: "800",
    textAlign: "center",
  },
  goleadorFoto: { width: 45, height: 45, borderRadius: 8 },
  goleadorFotoVacia: {
    width: 45,
    height: 45,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  goleadorNombre: {
    minHeight: 31,
    marginTop: 6,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "800",
    textAlign: "center",
  },
  goleadorProbabilidad: { marginTop: 4, fontSize: 13, fontWeight: "900" },
  goleadorVacio: { marginTop: 36, fontSize: 11, fontWeight: "600" },
});
