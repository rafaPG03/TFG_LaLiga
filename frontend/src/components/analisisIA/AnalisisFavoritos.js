import React, { useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useFavoritos } from "../../context/FavoritosContext";
import { useTheme } from "../../theme/ThemeContext";
import useConsultaDataMining from "./useConsultaDataMining";
import {
  BarrasPrediccion,
  EncabezadoSeccion,
  EstadoConsulta,
  GraficoRadarRatings,
  IndicadorEstado,
  IndicadorTendencia,
  ResumenMontecarlo,
  Separador,
  TarjetaDesplegable,
  formatearNumero,
  formatearPorcentaje,
} from "./ComponentesAnalisis";

export default function AnalisisFavoritos({ temporada }) {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { idUsuario, equiposFav, jugadoresFav, loadingFavoritos } =
    useFavoritos();
  const [abiertos, setAbiertos] = useState({});
  const ruta =
    idUsuario && temporada
      ? `/data-mining/favoritos/${idUsuario}?temporada=${temporada}`
      : null;
  const { data, cargando, error, recargar } = useConsultaDataMining(
    ruta,
    Boolean(idUsuario && temporada),
  );

  const sinFavoritos = equiposFav.length === 0 && jugadoresFav.length === 0;
  const alternar = (clave) =>
    setAbiertos((prev) => ({ ...prev, [clave]: !prev[clave] }));

  const equipos = useMemo(
    () => (Array.isArray(data?.equipos) ? data.equipos : []),
    [data],
  );
  const jugadores = useMemo(
    () => (Array.isArray(data?.jugadores) ? data.jugadores : []),
    [data],
  );

  if (loadingFavoritos || cargando) {
    return <EstadoConsulta cargando />;
  }

  if (!idUsuario) {
    return (
      <EstadoConsulta
        vacio
        mensajeVacio="Inicia sesión para consultar un análisis personalizado."
      />
    );
  }

  if (sinFavoritos) {
    return (
      <View style={styles.vacioFavoritos}>
        <Ionicons name="heart-outline" size={34} color={colors.textMuted} />
        <Text style={[styles.vacioTitulo, { color: colors.textStrong }]}>
          Personaliza tu análisis
        </Text>
        <Text style={[styles.vacioTexto, { color: colors.textMuted }]}>
          Añade equipos o jugadores a favoritos para reunir aquí sus
          predicciones, estados de forma y ratings.
        </Text>
        <View style={styles.acciones}>
          <TouchableOpacity
            style={[styles.accion, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate("Equipos")}
          >
            <Ionicons name="shield-outline" size={17} color="#ffffff" />
            <Text style={styles.accionTexto}>Ver equipos</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.accion, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate("Jugadores")}
          >
            <Ionicons name="people-outline" size={17} color="#ffffff" />
            <Text style={styles.accionTexto}>Ver jugadores</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (error) {
    return <EstadoConsulta error={error} onReintentar={recargar} />;
  }

  return (
    <View>
      {equiposFav.length > 0 ? (
        <View style={styles.seccion}>
          <EncabezadoSeccion
            titulo="Tus equipos"
            subtitulo="Forma, predicciones y necesidades de plantilla"
            icono="shield-outline"
          />
          {equipos.map((equipo) => {
            const clave = `equipo-${equipo.id_equipo}`;
            const partido = equipo.proxima_prediccion;
            return (
              <TarjetaDesplegable
                key={clave}
                titulo={equipo.nombre_equipo}
                subtitulo={
                  equipo.puntuacion_forma != null
                    ? `Forma ${formatearNumero(equipo.puntuacion_forma)}`
                    : "Sin puntuación de forma"
                }
                imagen={equipo.logo}
                abierta={Boolean(abiertos[clave])}
                onPress={() => alternar(clave)}
                onDetalle={() =>
                  navigation.navigate("DetalleEquipo", {
                    idEquipo: equipo.id_equipo,
                  })
                }
                cabeceraExtra={
                  equipo.estado ? (
                    <IndicadorEstado estado={equipo.estado} />
                  ) : null
                }
              >
                <View style={styles.resumenForma}>
                  <View>
                    <Text
                      style={[styles.datoEtiqueta, { color: colors.textMuted }]}
                    >
                      Puntuación de forma
                    </Text>
                    <Text
                      style={[
                        styles.datoPrincipal,
                        { color: colors.textStrong },
                      ]}
                    >
                      {formatearNumero(equipo.puntuacion_forma)}
                    </Text>
                  </View>
                  <IndicadorTendencia valor={equipo.tendencia} />
                </View>

                {partido ? (
                  <>
                    <Separador />
                    <Text
                      style={[
                        styles.bloqueTitulo,
                        { color: colors.textStrong },
                      ]}
                    >
                      Próxima predicción
                    </Text>
                    <Text
                      style={[
                        styles.partidoNombre,
                        { color: colors.textMuted },
                      ]}
                    >
                      {partido.equipo_local} - {partido.equipo_visitante}
                    </Text>
                    <BarrasPrediccion
                      local={partido.prob_victoria_local}
                      empate={partido.prob_empate}
                      visitante={partido.prob_victoria_visitante}
                    />
                  </>
                ) : null}

                <Separador />
                <Text
                  style={[styles.bloqueTitulo, { color: colors.textStrong }]}
                >
                  Objetivos de temporada
                </Text>
                <ResumenMontecarlo
                  datos={equipo.montecarlo}
                  historico={!data?.meta?.es_temporada_actual}
                />

                <Separador />
                <Text
                  style={[styles.bloqueTitulo, { color: colors.textStrong }]}
                >
                  Necesidad principal
                </Text>
                {equipo.necesidad_principal ? (
                  <>
                    <Text style={[styles.necesidad, { color: colors.primary }]}>
                      {equipo.necesidad_principal.necesidad}
                    </Text>
                    <Text
                      style={[styles.textoDetalle, { color: colors.textMuted }]}
                    >
                      {equipo.necesidad_principal.motivo}
                    </Text>
                  </>
                ) : (
                  <Text
                    style={[styles.textoDetalle, { color: colors.textMuted }]}
                  >
                    No hay necesidades registradas para esta temporada.
                  </Text>
                )}
              </TarjetaDesplegable>
            );
          })}
          {equipos.length === 0 ? (
            <EstadoConsulta
              vacio
              mensajeVacio="No hay análisis para tus equipos en esta temporada."
            />
          ) : null}
        </View>
      ) : null}

      {jugadoresFav.length > 0 ? (
        <View style={styles.seccion}>
          <EncabezadoSeccion
            titulo="Tus jugadores"
            subtitulo="Estado, ratings y perfiles similares"
            icono="person-outline"
          />
          {jugadores.map((jugador) => {
            const clave = `jugador-${jugador.id_jugador}`;
            const ratings = {
              ataque: jugador.ataque,
              creacion: jugador.creacion,
              defensa: jugador.defensa,
              porteros: jugador.porteros,
              duelos: jugador.duelos,
              regates: jugador.regates,
            };
            return (
              <TarjetaDesplegable
                key={clave}
                titulo={jugador.nombre}
                subtitulo={jugador.nombre_equipo || "Equipo no disponible"}
                imagen={jugador.foto}
                icono="person-outline"
                abierta={Boolean(abiertos[clave])}
                onPress={() => alternar(clave)}
                onDetalle={() =>
                  navigation.navigate("DetalleJugador", {
                    id_jugador: jugador.id_jugador,
                  })
                }
                cabeceraExtra={
                  jugador.estado ? (
                    <IndicadorEstado estado={jugador.estado} />
                  ) : null
                }
              >
                {data?.meta?.es_temporada_actual &&
                jugador.score_reciente != null ? (
                  <View style={styles.puntuaciones}>
                    <View style={styles.puntuacion}>
                      <Text
                        style={[
                          styles.datoEtiqueta,
                          { color: colors.textMuted },
                        ]}
                      >
                        Temporada
                      </Text>
                      <Text
                        style={[
                          styles.datoPrincipal,
                          { color: colors.textStrong },
                        ]}
                      >
                        {formatearNumero(jugador.score_temporada)}
                      </Text>
                    </View>
                    <View style={styles.puntuacion}>
                      <Text
                        style={[
                          styles.datoEtiqueta,
                          { color: colors.textMuted },
                        ]}
                      >
                        Reciente
                      </Text>
                      <Text
                        style={[
                          styles.datoPrincipal,
                          { color: colors.textStrong },
                        ]}
                      >
                        {formatearNumero(jugador.score_reciente)}
                      </Text>
                    </View>
                    <View style={styles.puntuacion}>
                      <Text
                        style={[
                          styles.datoEtiqueta,
                          { color: colors.textMuted },
                        ]}
                      >
                        Evolución
                      </Text>
                      <Text
                        style={[
                          styles.datoPrincipal,
                          {
                            color:
                              Number(jugador.evolucion) >= 0
                                ? colors.success
                                : colors.danger,
                          },
                        ]}
                      >
                        {Number(jugador.evolucion) > 0 ? "+" : ""}
                        {formatearNumero(jugador.evolucion)}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View
                    style={[
                      styles.aviso,
                      { backgroundColor: colors.surfaceAlt },
                    ]}
                  >
                    <Ionicons
                      name="information-circle-outline"
                      size={17}
                      color={colors.primary}
                    />
                    <Text style={[styles.avisoTexto, { color: colors.text }]}>
                      El estado de forma solo está disponible para la temporada
                      actual.
                    </Text>
                  </View>
                )}

                <Separador />
                <GraficoRadarRatings
                  ratings={ratings}
                  nombre={jugador.nombre}
                />
                <Separador />
                <Text
                  style={[styles.bloqueTitulo, { color: colors.textStrong }]}
                >
                  Jugadores similares
                </Text>
                {jugador.similares?.length ? (
                  jugador.similares.slice(0, 3).map((similar) => (
                    <TouchableOpacity
                      key={similar.id_jugador}
                      style={styles.similarFila}
                      onPress={() =>
                        navigation.navigate("DetalleJugador", {
                          id_jugador: similar.id_jugador,
                        })
                      }
                    >
                      <Text
                        style={[styles.similarNombre, { color: colors.text }]}
                      >
                        {similar.nombre}
                      </Text>
                      <Text
                        style={[styles.similarValor, { color: colors.primary }]}
                      >
                        {formatearPorcentaje(similar.similitud)}
                      </Text>
                      <Ionicons
                        name="chevron-forward"
                        size={15}
                        color={colors.textMuted}
                      />
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text
                    style={[styles.textoDetalle, { color: colors.textMuted }]}
                  >
                    No hay perfiles similares para esta temporada.
                  </Text>
                )}
              </TarjetaDesplegable>
            );
          })}
          {jugadores.length === 0 ? (
            <EstadoConsulta
              vacio
              mensajeVacio="No hay análisis para tus jugadores en esta temporada."
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  seccion: { marginBottom: 18 },
  vacioFavoritos: {
    minHeight: 300,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  vacioTitulo: { marginTop: 10, fontSize: 18, fontWeight: "800" },
  vacioTexto: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
  acciones: { marginTop: 18, flexDirection: "row", gap: 10 },
  accion: {
    height: 42,
    borderRadius: 8,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  accionTexto: { color: "#ffffff", fontSize: 12, fontWeight: "800" },
  resumenForma: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  datoEtiqueta: { fontSize: 11, fontWeight: "600" },
  datoPrincipal: { marginTop: 3, fontSize: 20, fontWeight: "900" },
  bloqueTitulo: { marginBottom: 7, fontSize: 13, fontWeight: "800" },
  partidoNombre: { marginBottom: 10, fontSize: 12, fontWeight: "600" },
  necesidad: { marginBottom: 4, fontSize: 13, fontWeight: "800" },
  textoDetalle: { fontSize: 12, lineHeight: 18 },
  puntuaciones: { flexDirection: "row", justifyContent: "space-around" },
  puntuacion: { flex: 1, alignItems: "center" },
  aviso: {
    padding: 10,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  avisoTexto: { flex: 1, fontSize: 11, lineHeight: 16, fontWeight: "600" },
  similarFila: { minHeight: 38, flexDirection: "row", alignItems: "center" },
  similarNombre: { flex: 1, fontSize: 12, fontWeight: "700" },
  similarValor: { marginRight: 6, fontSize: 12, fontWeight: "800" },
});
