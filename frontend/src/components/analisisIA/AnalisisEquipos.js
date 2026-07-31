import React, { useMemo, useState } from "react";
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
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
  IndicadorEstado,
  IndicadorTendencia,
  ResumenMontecarlo,
  Separador,
  formatearNumero,
  formatearPorcentaje,
} from "./ComponentesAnalisis";

function SelectorEquipo({
  equipos,
  seleccionado,
  visible,
  onAbrir,
  onCerrar,
  onSeleccionar,
}) {
  const { colors } = useTheme();
  const { equiposFav } = useFavoritos();
  const equipo = equipos.find(
    (item) => Number(item.id_equipo) === Number(seleccionado),
  );
  const favoritos = new Set(equiposFav.map(Number));
  const ordenados = useMemo(
    () =>
      [...equipos].sort((a, b) => {
        const diferenciaFavorito =
          Number(favoritos.has(Number(b.id_equipo))) -
          Number(favoritos.has(Number(a.id_equipo)));
        return (
          diferenciaFavorito ||
          String(a.nombre_equipo).localeCompare(String(b.nombre_equipo), "es")
        );
      }),
    [equipos, equiposFav],
  );

  return (
    <>
      <TouchableOpacity
        style={[
          styles.selector,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
        onPress={onAbrir}
      >
        <View style={styles.selectorIzquierda}>
          {equipo?.logo ? (
            <Image
              source={{ uri: equipo.logo }}
              style={styles.selectorLogo}
              resizeMode="contain"
            />
          ) : (
            <Ionicons name="shield-outline" size={20} color={colors.primary} />
          )}
          <View style={styles.selectorTexto}>
            <Text
              style={[styles.selectorEtiqueta, { color: colors.textMuted }]}
            >
              Equipo
            </Text>
            <Text
              style={[styles.selectorNombre, { color: colors.textStrong }]}
              numberOfLines={1}
            >
              {equipo?.nombre_equipo || "Todos los equipos"}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-down" size={18} color={colors.primary} />
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onCerrar}
      >
        <View style={styles.modalCapa}>
          <TouchableOpacity
            style={styles.modalFondo}
            activeOpacity={1}
            onPress={onCerrar}
          />
          <View
            style={[
              styles.modalContenido,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.modalCabecera}>
              <Text style={[styles.modalTitulo, { color: colors.textStrong }]}>
                Seleccionar equipo
              </Text>
              <TouchableOpacity onPress={onCerrar} style={styles.cerrar}>
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                style={[
                  styles.opcion,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => onSeleccionar(null)}
              >
                <View
                  style={[
                    styles.logoVacio,
                    { backgroundColor: colors.surfaceAlt },
                  ]}
                >
                  <Ionicons
                    name="grid-outline"
                    size={17}
                    color={colors.primary}
                  />
                </View>
                <Text style={[styles.opcionNombre, { color: colors.text }]}>
                  Todos los equipos
                </Text>
                {!seleccionado ? (
                  <Ionicons
                    name="checkmark-circle"
                    size={19}
                    color={colors.primary}
                  />
                ) : null}
              </TouchableOpacity>
              {ordenados.map((item) => (
                <TouchableOpacity
                  key={item.id_equipo}
                  style={[
                    styles.opcion,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => onSeleccionar(item.id_equipo)}
                >
                  {item.logo ? (
                    <Image
                      source={{ uri: item.logo }}
                      style={styles.opcionLogo}
                      resizeMode="contain"
                    />
                  ) : (
                    <View
                      style={[
                        styles.logoVacio,
                        { backgroundColor: colors.surfaceAlt },
                      ]}
                    >
                      <Ionicons
                        name="shield-outline"
                        size={17}
                        color={colors.primary}
                      />
                    </View>
                  )}
                  <Text style={[styles.opcionNombre, { color: colors.text }]}>
                    {item.nombre_equipo}
                  </Text>
                  {favoritos.has(Number(item.id_equipo)) ? (
                    <Ionicons name="heart" size={16} color="#f24d6e" />
                  ) : null}
                  {Number(item.id_equipo) === Number(seleccionado) ? (
                    <Ionicons
                      name="checkmark-circle"
                      size={19}
                      color={colors.primary}
                    />
                  ) : null}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

export default function AnalisisEquipos({ temporada, equipos }) {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const [idEquipo, setIdEquipo] = useState(null);
  const [selectorVisible, setSelectorVisible] = useState(false);
  const [mostrarTodos, setMostrarTodos] = useState(false);
  const queryEquipo = idEquipo ? `&id_equipo=${idEquipo}` : "";
  const { data, cargando, error, recargar } = useConsultaDataMining(
    temporada
      ? `/data-mining/equipos?temporada=${temporada}${queryEquipo}`
      : null,
    Boolean(temporada),
  );
  const ranking = Array.isArray(data?.ranking) ? data.ranking : [];
  const rankingVisible = mostrarTodos ? ranking : ranking.slice(0, 8);
  const detalle = data?.equipo_seleccionado;

  const seleccionar = (id) => {
    setIdEquipo(id ? Number(id) : null);
    setSelectorVisible(false);
  };

  if (cargando && !data) return <EstadoConsulta cargando />;
  if (error && !data)
    return <EstadoConsulta error={error} onReintentar={recargar} />;

  return (
    <View>
      <SelectorEquipo
        equipos={equipos}
        seleccionado={idEquipo}
        visible={selectorVisible}
        onAbrir={() => setSelectorVisible(true)}
        onCerrar={() => setSelectorVisible(false)}
        onSeleccionar={seleccionar}
      />

      {cargando ? (
        <View style={styles.actualizando}>
          <Text style={[styles.actualizandoTexto, { color: colors.textMuted }]}>
            Actualizando equipo...
          </Text>
        </View>
      ) : null}

      <View style={styles.seccion}>
        <EncabezadoSeccion
          titulo="Ranking de forma"
          subtitulo={
            data?.meta?.es_temporada_actual
              ? "Rendimiento reciente de los equipos"
              : "Datos disponibles para la temporada seleccionada"
          }
          icono="trending-up-outline"
        />
        {rankingVisible.map((equipo, index) => (
          <TouchableOpacity
            key={equipo.id_equipo}
            style={[
              styles.rankingFila,
              { backgroundColor: colors.surface, borderColor: colors.border },
              Number(idEquipo) === Number(equipo.id_equipo) && {
                borderColor: colors.primary,
              },
            ]}
            onPress={() => seleccionar(equipo.id_equipo)}
            activeOpacity={0.8}
          >
            <Text style={[styles.posicion, { color: colors.textMuted }]}>
              {index + 1}
            </Text>
            {equipo.logo ? (
              <Image
                source={{ uri: equipo.logo }}
                style={styles.rankingLogo}
                resizeMode="contain"
              />
            ) : (
              <View
                style={[
                  styles.logoVacio,
                  { backgroundColor: colors.surfaceAlt },
                ]}
              >
                <Ionicons
                  name="shield-outline"
                  size={16}
                  color={colors.primary}
                />
              </View>
            )}
            <View style={styles.rankingInfo}>
              <Text
                style={[styles.rankingNombre, { color: colors.textStrong }]}
                numberOfLines={1}
              >
                {equipo.nombre_equipo}
              </Text>
              <Text style={[styles.rankingPuntos, { color: colors.textMuted }]}>
                Forma {formatearNumero(equipo.puntuacion_forma)}
              </Text>
            </View>
            {equipo.estado ? <IndicadorEstado estado={equipo.estado} /> : null}
            <IndicadorTendencia valor={equipo.tendencia} />
          </TouchableOpacity>
        ))}
        {ranking.length === 0 ? (
          <EstadoConsulta
            vacio
            mensajeVacio="No hay estados de forma para esta temporada."
          />
        ) : null}
        {ranking.length > 8 ? (
          <TouchableOpacity
            style={styles.mostrarBoton}
            onPress={() => setMostrarTodos((v) => !v)}
          >
            <Text style={[styles.mostrarTexto, { color: colors.primary }]}>
              {mostrarTodos
                ? "Mostrar menos"
                : `Ver los ${ranking.length} equipos`}
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
            titulo={detalle.nombre_equipo}
            subtitulo="Simulación, plantilla y recomendaciones"
            icono="sparkles-outline"
            accion={
              <TouchableOpacity
                style={[
                  styles.detalleBoton,
                  { backgroundColor: colors.surfaceAlt },
                ]}
                onPress={() =>
                  navigation.navigate("DetalleEquipo", {
                    idEquipo: detalle.id_equipo,
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
              styles.bloque,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.bloqueTitulo, { color: colors.textStrong }]}>
              Objetivos de temporada
            </Text>
            <ResumenMontecarlo
              datos={detalle.montecarlo}
              historico={data?.meta?.montecarlo === "resultado_final"}
            />

            <Separador />
            <Text style={[styles.bloqueTitulo, { color: colors.textStrong }]}>
              Necesidades de plantilla
            </Text>
            {detalle.necesidades?.length ? (
              detalle.necesidades.map((necesidad, index) => (
                <View
                  key={`${necesidad.necesidad}-${index}`}
                  style={styles.necesidadFila}
                >
                  <View
                    style={[
                      styles.necesidadIcono,
                      { backgroundColor: colors.surfaceAlt },
                    ]}
                  >
                    <Ionicons
                      name="construct-outline"
                      size={16}
                      color={colors.primary}
                    />
                  </View>
                  <View style={styles.necesidadTexto}>
                    <Text
                      style={[
                        styles.necesidadTitulo,
                        { color: colors.textStrong },
                      ]}
                    >
                      {necesidad.necesidad}
                    </Text>
                    <Text
                      style={[
                        styles.necesidadMotivo,
                        { color: colors.textMuted },
                      ]}
                    >
                      {necesidad.motivo}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={[styles.sinDato, { color: colors.textMuted }]}>
                No hay necesidades detectadas para esta temporada.
              </Text>
            )}

            <Separador />
            <Text style={[styles.bloqueTitulo, { color: colors.textStrong }]}>
              Recomendaciones de fichajes
            </Text>
            {!data?.meta?.es_temporada_actual ? (
              <View
                style={[styles.aviso, { backgroundColor: colors.surfaceAlt }]}
              >
                <Ionicons
                  name="information-circle-outline"
                  size={17}
                  color={colors.primary}
                />
                <Text style={[styles.avisoTexto, { color: colors.text }]}>
                  Las recomendaciones solo están calculadas para la temporada
                  actual.
                </Text>
              </View>
            ) : detalle.recomendaciones?.length ? (
              detalle.recomendaciones.map((recomendacion) => (
                <TouchableOpacity
                  key={`${recomendacion.necesidad}-${recomendacion.id_jugador}`}
                  style={[
                    styles.fichajeFila,
                    { borderBottomColor: colors.border },
                  ]}
                  onPress={() =>
                    navigation.navigate("DetalleJugador", {
                      id_jugador: recomendacion.id_jugador,
                    })
                  }
                >
                  {recomendacion.foto ? (
                    <Image
                      source={{ uri: recomendacion.foto }}
                      style={styles.fichajeFoto}
                    />
                  ) : (
                    <View
                      style={[
                        styles.fichajeFotoVacia,
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
                  <View style={styles.fichajeInfo}>
                    <Text
                      style={[
                        styles.fichajeNombre,
                        { color: colors.textStrong },
                      ]}
                    >
                      {recomendacion.nombre_jugador}
                    </Text>
                    <Text
                      style={[
                        styles.fichajeEquipo,
                        { color: colors.textMuted },
                      ]}
                    >
                      {recomendacion.equipo_actual || "Equipo no disponible"} ·{" "}
                      {recomendacion.necesidad}
                    </Text>
                    <Text
                      style={[
                        styles.fichajeMotivo,
                        { color: colors.textMuted },
                      ]}
                    >
                      {String(recomendacion.motivo || "").replace(/\*\*/g, "")}
                    </Text>
                  </View>
                  <View style={[styles.score, { borderColor: colors.primary }]}>
                    <Text
                      style={[styles.scoreValor, { color: colors.primary }]}
                    >
                      {formatearPorcentaje(recomendacion.score_recomendacion)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={[styles.sinDato, { color: colors.textMuted }]}>
                No hay recomendaciones disponibles para este equipo.
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
          <Ionicons name="hand-left-outline" size={20} color={colors.primary} />
          <Text style={[styles.seleccionTexto, { color: colors.text }]}>
            Selecciona un equipo para consultar probabilidades de clasificación, necesidades y
            fichajes.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  selector: {
    height: 58,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectorIzquierda: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  selectorLogo: { width: 30, height: 30 },
  selectorTexto: { flex: 1 },
  selectorEtiqueta: { fontSize: 10, fontWeight: "600" },
  selectorNombre: { marginTop: 2, fontSize: 14, fontWeight: "800" },
  modalCapa: { flex: 1, justifyContent: "center", paddingHorizontal: 20 },
  modalFondo: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10, 28, 45, 0.48)",
  },
  modalContenido: {
    maxHeight: "76%",
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
  },
  modalCabecera: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  modalTitulo: { fontSize: 17, fontWeight: "800" },
  cerrar: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  opcion: {
    minHeight: 50,
    marginBottom: 7,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  opcionLogo: { width: 30, height: 30 },
  logoVacio: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  opcionNombre: { flex: 1, fontSize: 13, fontWeight: "700" },
  actualizando: { height: 26, justifyContent: "center" },
  actualizandoTexto: { textAlign: "center", fontSize: 11, fontWeight: "600" },
  seccion: { marginTop: 18 },
  rankingFila: {
    minHeight: 62,
    marginBottom: 8,
    paddingHorizontal: 9,
    borderWidth: 1,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  posicion: { width: 20, textAlign: "center", fontSize: 13, fontWeight: "900" },
  rankingLogo: { width: 31, height: 31 },
  rankingInfo: { flex: 1, minWidth: 0 },
  rankingNombre: { fontSize: 13, fontWeight: "800" },
  rankingPuntos: { marginTop: 3, fontSize: 11, fontWeight: "600" },
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
  bloque: { borderWidth: 1, borderRadius: 8, padding: 13 },
  bloqueTitulo: { marginBottom: 10, fontSize: 14, fontWeight: "800" },
  necesidadFila: { flexDirection: "row", marginBottom: 11, gap: 9 },
  necesidadIcono: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  necesidadTexto: { flex: 1 },
  necesidadTitulo: { fontSize: 12, fontWeight: "800" },
  necesidadMotivo: { marginTop: 3, fontSize: 11, lineHeight: 16 },
  sinDato: { fontSize: 12, lineHeight: 18 },
  aviso: {
    padding: 10,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  avisoTexto: { flex: 1, fontSize: 11, lineHeight: 16, fontWeight: "600" },
  fichajeFila: {
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  fichajeFoto: { width: 42, height: 42, borderRadius: 8 },
  fichajeFotoVacia: {
    width: 42,
    height: 42,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  fichajeInfo: { flex: 1, minWidth: 0 },
  fichajeNombre: { fontSize: 12, fontWeight: "800" },
  fichajeEquipo: { marginTop: 2, fontSize: 10, fontWeight: "600" },
  fichajeMotivo: { marginTop: 4, fontSize: 10, lineHeight: 14 },
  score: {
    minWidth: 48,
    height: 30,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreValor: { fontSize: 10, fontWeight: "900" },
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
