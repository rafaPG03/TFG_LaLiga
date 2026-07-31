import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useFavoritos } from "../../context/FavoritosContext";
import { useTheme } from "../../theme/ThemeContext";
import useConsultaDataMining from "./useConsultaDataMining";
import {
  EncabezadoSeccion,
  EstadoConsulta,
  GraficoRadarRatings,
  IndicadorEstado,
  Separador,
  formatearNumero,
  formatearPorcentaje,
} from "./ComponentesAnalisis";

export default function AnalisisJugadores({ temporada }) {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { jugadoresFav } = useFavoritos();
  const [idJugador, setIdJugador] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [errorBusqueda, setErrorBusqueda] = useState("");
  const [mostrarTodos, setMostrarTodos] = useState(false);
  const favoritosQuery = jugadoresFav.length
    ? `&favoritos=${jugadoresFav.join(",")}`
    : "";
  const jugadorQuery = idJugador ? `&id_jugador=${idJugador}` : "";
  const { data, cargando, error, recargar } = useConsultaDataMining(
    temporada
      ? `/data-mining/jugadores?temporada=${temporada}${jugadorQuery}${favoritosQuery}`
      : null,
    Boolean(temporada),
  );

  useEffect(() => {
    const termino = busqueda.trim();
    if (termino.length < 2) {
      setResultados([]);
      setBuscando(false);
      setErrorBusqueda("");
      return undefined;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setBuscando(true);
      setErrorBusqueda("");
      try {
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/data-mining/jugadores/buscar?temporada=${temporada}&q=${encodeURIComponent(termino)}`,
          { signal: controller.signal },
        );
        const body = await response.json().catch(() => []);
        if (!response.ok)
          throw new Error(body?.error || "No se pudo completar la búsqueda");
        setResultados(Array.isArray(body) ? body : []);
      } catch (searchError) {
        if (searchError.name !== "AbortError") {
          setResultados([]);
          setErrorBusqueda(searchError.message);
        }
      } finally {
        if (!controller.signal.aborted) setBuscando(false);
      }
    }, 300);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [busqueda, temporada]);

  const ranking = Array.isArray(data?.ranking) ? data.ranking : [];
  const rankingVisible = mostrarTodos ? ranking : ranking.slice(0, 10);
  const favoritos = useMemo(
    () => (Array.isArray(data?.favoritos) ? data.favoritos : []),
    [data],
  );
  const detalle = data?.jugador_seleccionado;

  const seleccionarJugador = (jugador) => {
    setIdJugador(Number(jugador.id_jugador));
    setBusqueda("");
    setResultados([]);
  };

  if (cargando && !data) return <EstadoConsulta cargando />;
  if (error && !data)
    return <EstadoConsulta error={error} onReintentar={recargar} />;

  return (
    <View>
      <View
        style={[
          styles.buscador,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <Ionicons name="search" size={19} color={colors.textMuted} />
        <TextInput
          style={[styles.buscadorInput, { color: colors.text }]}
          placeholder="Buscar jugadores..."
          placeholderTextColor={colors.textMuted}
          value={busqueda}
          onChangeText={setBusqueda}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {buscando ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : null}
        {busqueda ? (
          <TouchableOpacity onPress={() => setBusqueda("")} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {busqueda.trim().length > 0 ? (
        <View
          style={[
            styles.resultadosBusqueda,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          {busqueda.trim().length < 2 ? (
            <Text style={[styles.busquedaMensaje, { color: colors.textMuted }]}>
              Escribe al menos dos letras.
            </Text>
          ) : errorBusqueda ? (
            <Text style={[styles.busquedaMensaje, { color: colors.danger }]}>
              {errorBusqueda}
            </Text>
          ) : !buscando && resultados.length === 0 ? (
            <Text style={[styles.busquedaMensaje, { color: colors.textMuted }]}>
              No se encontraron jugadores.
            </Text>
          ) : (
            resultados.slice(0, 6).map((jugador) => (
              <TouchableOpacity
                key={jugador.id_jugador}
                style={[
                  styles.resultadoFila,
                  { borderBottomColor: colors.border },
                ]}
                onPress={() => seleccionarJugador(jugador)}
              >
                {jugador.foto ? (
                  <Image
                    source={{ uri: jugador.foto }}
                    style={styles.resultadoFoto}
                  />
                ) : (
                  <View
                    style={[
                      styles.fotoVacia,
                      { backgroundColor: colors.surfaceAlt },
                    ]}
                  >
                    <Ionicons
                      name="person-outline"
                      size={18}
                      color={colors.primary}
                    />
                  </View>
                )}
                <View style={styles.resultadoInfo}>
                  <Text
                    style={[
                      styles.resultadoNombre,
                      { color: colors.textStrong },
                    ]}
                  >
                    {jugador.nombre}
                  </Text>
                  <Text
                    style={[
                      styles.resultadoEquipo,
                      { color: colors.textMuted },
                    ]}
                  >
                    {jugador.nombre_equipo || "Equipo no disponible"}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            ))
          )}
        </View>
      ) : null}

      {!busqueda && favoritos.length > 0 ? (
        <View style={styles.favoritosRapidos}>
          <Text style={[styles.favoritosTitulo, { color: colors.textMuted }]}>
            Favoritos
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {favoritos.map((jugador) => (
              <TouchableOpacity
                key={jugador.id_jugador}
                style={[
                  styles.favoritoChip,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                  Number(jugador.id_jugador) === Number(idJugador) && {
                    borderColor: colors.primary,
                  },
                ]}
                onPress={() => seleccionarJugador(jugador)}
              >
                {jugador.foto ? (
                  <Image
                    source={{ uri: jugador.foto }}
                    style={styles.favoritoFoto}
                  />
                ) : (
                  <Ionicons
                    name="person-circle-outline"
                    size={26}
                    color={colors.primary}
                  />
                )}
                <Text
                  style={[styles.favoritoNombre, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {jugador.nombre}
                </Text>
                <Ionicons name="heart" size={13} color="#f24d6e" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      ) : null}

      <View style={styles.seccion}>
        <EncabezadoSeccion
          titulo="Ranking de forma"
          subtitulo={
            data?.meta?.es_temporada_actual
              ? "Ordenado por rendimiento reciente"
              : "La forma reciente solo se calcula para la temporada actual"
          }
          icono="podium-outline"
        />
        {rankingVisible.map((jugador, index) => {
          const evolucion = Number(jugador.evolucion);
          return (
            <TouchableOpacity
              key={jugador.id_jugador}
              style={[
                styles.rankingFila,
                { backgroundColor: colors.surface, borderColor: colors.border },
                Number(jugador.id_jugador) === Number(idJugador) && {
                  borderColor: colors.primary,
                },
              ]}
              onPress={() => seleccionarJugador(jugador)}
            >
              <Text style={[styles.posicion, { color: colors.textMuted }]}>
                {index + 1}
              </Text>
              {jugador.foto ? (
                <Image
                  source={{ uri: jugador.foto }}
                  style={styles.rankingFoto}
                />
              ) : (
                <View
                  style={[
                    styles.fotoVacia,
                    { backgroundColor: colors.surfaceAlt },
                  ]}
                >
                  <Ionicons
                    name="person-outline"
                    size={18}
                    color={colors.primary}
                  />
                </View>
              )}
              <View style={styles.rankingInfo}>
                <Text
                  style={[styles.rankingNombre, { color: colors.textStrong }]}
                  numberOfLines={1}
                >
                  {jugador.nombre}
                </Text>
                <Text
                  style={[styles.rankingEquipo, { color: colors.textMuted }]}
                  numberOfLines={1}
                >
                  {jugador.nombre_equipo || "Equipo no disponible"}
                </Text>
              </View>
              <View style={styles.scoreReciente}>
                <Text
                  style={[styles.scoreEtiqueta, { color: colors.textMuted }]}
                >
                  Reciente
                </Text>
                <Text style={[styles.scoreValor, { color: colors.textStrong }]}>
                  {formatearNumero(jugador.score_reciente)}
                </Text>
              </View>
              <View style={styles.evolucion}>
                <Ionicons
                  name={
                    evolucion > 0
                      ? "arrow-up"
                      : evolucion < 0
                        ? "arrow-down"
                        : "remove"
                  }
                  size={17}
                  color={
                    evolucion > 0
                      ? colors.success
                      : evolucion < 0
                        ? colors.danger
                        : colors.warning
                  }
                />
                <Text
                  style={[
                    styles.evolucionValor,
                    {
                      color:
                        evolucion > 0
                          ? colors.success
                          : evolucion < 0
                            ? colors.danger
                            : colors.warning,
                    },
                  ]}
                >
                  {formatearNumero(Math.abs(evolucion))}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
        {ranking.length === 0 ? (
          <View style={[styles.aviso, { backgroundColor: colors.surfaceAlt }]}>
            <Ionicons
              name="information-circle-outline"
              size={18}
              color={colors.primary}
            />
            <Text style={[styles.avisoTexto, { color: colors.text }]}>
              No existe un ranking histórico de forma. Puedes buscar un jugador
              para consultar sus ratings y perfiles similares en esta temporada.
            </Text>
          </View>
        ) : null}
        {ranking.length > 10 ? (
          <TouchableOpacity
            style={styles.mostrarBoton}
            onPress={() => setMostrarTodos((v) => !v)}
          >
            <Text style={[styles.mostrarTexto, { color: colors.primary }]}>
              {mostrarTodos
                ? "Mostrar menos"
                : `Ver los ${ranking.length} jugadores`}
            </Text>
            <Ionicons
              name={mostrarTodos ? "chevron-up" : "chevron-down"}
              size={16}
              color={colors.primary}
            />
          </TouchableOpacity>
        ) : null}
      </View>

      {detalle ? (
        <View style={styles.seccion}>
          <EncabezadoSeccion
            titulo={detalle.nombre}
            subtitulo={detalle.nombre_equipo || "Equipo no disponible"}
            icono="person-outline"
            accion={
              <TouchableOpacity
                style={[
                  styles.detalleBoton,
                  { backgroundColor: colors.surfaceAlt },
                ]}
                onPress={() =>
                  navigation.navigate("DetalleJugador", {
                    id_jugador: detalle.id_jugador,
                  })
                }
              >
                <Ionicons
                  name="open-outline"
                  size={17}
                  color={colors.primary}
                />
              </TouchableOpacity>
            }
          />
          <View
            style={[
              styles.bloqueDetalle,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            {detalle.forma ? (
              <>
                <View style={styles.formaCabecera}>
                  <IndicadorEstado estado={detalle.forma.estado} />
                  <View style={styles.formaPuntuacion}>
                    <Text
                      style={[
                        styles.formaEtiqueta,
                        { color: colors.textMuted },
                      ]}
                    >
                      Temporada
                    </Text>
                    <Text
                      style={[styles.formaValor, { color: colors.textStrong }]}
                    >
                      {formatearNumero(detalle.forma.score_temporada)}
                    </Text>
                  </View>
                  <View style={styles.formaPuntuacion}>
                    <Text
                      style={[
                        styles.formaEtiqueta,
                        { color: colors.textMuted },
                      ]}
                    >
                      Reciente
                    </Text>
                    <Text
                      style={[styles.formaValor, { color: colors.textStrong }]}
                    >
                      {formatearNumero(detalle.forma.score_reciente)}
                    </Text>
                  </View>
                  <View style={styles.formaPuntuacion}>
                    <Text
                      style={[
                        styles.formaEtiqueta,
                        { color: colors.textMuted },
                      ]}
                    >
                      Evolución
                    </Text>
                    <Text
                      style={[
                        styles.formaValor,
                        {
                          color:
                            Number(detalle.forma.evolucion) >= 0
                              ? colors.success
                              : colors.danger,
                        },
                      ]}
                    >
                      {Number(detalle.forma.evolucion) > 0 ? "+" : ""}
                      {formatearNumero(detalle.forma.evolucion)}
                    </Text>
                  </View>
                </View>
                <Separador />
              </>
            ) : (
              <View
                style={[styles.aviso, { backgroundColor: colors.surfaceAlt }]}
              >
                <Ionicons
                  name="information-circle-outline"
                  size={18}
                  color={colors.primary}
                />
                <Text style={[styles.avisoTexto, { color: colors.text }]}>
                  El estado de forma solo está disponible para la temporada
                  actual.
                </Text>
              </View>
            )}

            <Text style={[styles.bloqueTitulo, { color: colors.textStrong }]}>
              Ratings de habilidades
            </Text>
            <GraficoRadarRatings
              ratings={detalle.ratings}
              nombre={detalle.nombre}
            />

            <Separador />
            <Text style={[styles.bloqueTitulo, { color: colors.textStrong }]}>
              Jugadores similares
            </Text>
            {detalle.similares?.length ? (
              detalle.similares.map((similar, index) => (
                <TouchableOpacity
                  key={similar.id_jugador}
                  style={[
                    styles.similarFila,
                    { borderBottomColor: colors.border },
                  ]}
                  onPress={() => seleccionarJugador(similar)}
                >
                  <View
                    style={[
                      styles.similarPosicion,
                      { backgroundColor: colors.surfaceAlt },
                    ]}
                  >
                    <Text
                      style={[
                        styles.similarPosicionTexto,
                        { color: colors.primary },
                      ]}
                    >
                      {index + 1}
                    </Text>
                  </View>
                  <Text style={[styles.similarNombre, { color: colors.text }]}>
                    {similar.nombre}
                  </Text>
                  <Text
                    style={[styles.similarValor, { color: colors.primary }]}
                  >
                    {formatearPorcentaje(similar.similitud)}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>
              ))
            ) : (
              <Text style={[styles.sinDatos, { color: colors.textMuted }]}>
                No hay jugadores similares para esta temporada.
              </Text>
            )}
          </View>
        </View>
      ) : (
        <View
          style={[
            styles.seleccionAviso,
            { backgroundColor: colors.surfaceAlt },
          ]}
        >
          <Ionicons name="search-outline" size={20} color={colors.primary} />
          <Text style={[styles.seleccionTexto, { color: colors.text }]}>
            Busca o selecciona un jugador para consultar su radar y perfiles
            similares.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  buscador: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  buscadorInput: { flex: 1, height: "100%", fontSize: 14 },
  resultadosBusqueda: {
    marginTop: 7,
    maxHeight: 330,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  busquedaMensaje: {
    paddingVertical: 18,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
  },
  resultadoFila: {
    minHeight: 54,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  resultadoFoto: { width: 38, height: 38, borderRadius: 8 },
  fotoVacia: {
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  resultadoInfo: { flex: 1, minWidth: 0 },
  resultadoNombre: { fontSize: 13, fontWeight: "800" },
  resultadoEquipo: { marginTop: 2, fontSize: 11 },
  favoritosRapidos: { marginTop: 12 },
  favoritosTitulo: {
    marginBottom: 7,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  favoritoChip: {
    height: 42,
    maxWidth: 180,
    marginRight: 8,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  favoritoFoto: { width: 27, height: 27, borderRadius: 7 },
  favoritoNombre: { maxWidth: 105, fontSize: 11, fontWeight: "700" },
  seccion: { marginTop: 18 },
  rankingFila: {
    minHeight: 62,
    marginBottom: 8,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  posicion: { width: 20, textAlign: "center", fontSize: 13, fontWeight: "900" },
  rankingFoto: { width: 38, height: 38, borderRadius: 8 },
  rankingInfo: { flex: 1, minWidth: 0 },
  rankingNombre: { fontSize: 12, fontWeight: "800" },
  rankingEquipo: { marginTop: 3, fontSize: 10 },
  scoreReciente: { alignItems: "center" },
  scoreEtiqueta: { fontSize: 8, fontWeight: "700" },
  scoreValor: { marginTop: 2, fontSize: 12, fontWeight: "900" },
  evolucion: { width: 38, alignItems: "center" },
  evolucionValor: { fontSize: 9, fontWeight: "800" },
  aviso: {
    padding: 10,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  avisoTexto: { flex: 1, fontSize: 11, lineHeight: 16, fontWeight: "600" },
  mostrarBoton: {
    height: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  mostrarTexto: { fontSize: 12, fontWeight: "800" },
  detalleBoton: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  bloqueDetalle: { borderWidth: 1, borderRadius: 8, padding: 13 },
  formaCabecera: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  formaPuntuacion: { alignItems: "center" },
  formaEtiqueta: { fontSize: 9, fontWeight: "600" },
  formaValor: { marginTop: 3, fontSize: 14, fontWeight: "900" },
  bloqueTitulo: { marginBottom: 9, fontSize: 14, fontWeight: "800" },
  similarFila: {
    minHeight: 43,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  similarPosicion: {
    width: 25,
    height: 25,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  similarPosicionTexto: { fontSize: 11, fontWeight: "900" },
  similarNombre: { flex: 1, fontSize: 12, fontWeight: "700" },
  similarValor: { fontSize: 11, fontWeight: "900" },
  sinDatos: { fontSize: 12, lineHeight: 18 },
  seleccionAviso: {
    marginTop: 14,
    minHeight: 58,
    paddingHorizontal: 12,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  seleccionTexto: { flex: 1, fontSize: 12, lineHeight: 17, fontWeight: "600" },
});
