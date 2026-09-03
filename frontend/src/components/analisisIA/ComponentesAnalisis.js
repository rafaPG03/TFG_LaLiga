import React from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RadarChart } from "react-native-gifted-charts";
import { useTheme } from "../../theme/ThemeContext";

export const PESTANAS_ANALISIS = [
  { id: "favoritos", label: "Favoritos", icono: "heart-outline" },
  { id: "equipos", label: "Equipos", icono: "shield-outline" },
  { id: "jugadores", label: "Jugadores", icono: "people-outline" },
  { id: "predicciones", label: "Predicciones", icono: "analytics-outline" },
];

export const aNumero = (valor, respaldo = 0) => {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : respaldo;
};

export const normalizarPorcentaje = (valor) => {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return null;
  return numero >= 0 && numero <= 1 ? numero * 100 : numero;
};

export const formatearPorcentaje = (valor) => {
  const numero = normalizarPorcentaje(valor);
  if (numero === null) return "-";
  const decimales = Number.isInteger(numero) ? 0 : 1;
  return `${numero.toFixed(decimales)}%`;
};

export const formatearNumero = (valor, decimales = 2) => {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero.toFixed(decimales) : "-";
};

const obtenerColorEstado = (estado, colors) => {
  const valor = String(estado || "").toLowerCase();
  if (valor.includes("posit") || valor.includes("alto")) return colors.success;
  if (valor.includes("cr") || valor.includes("bajo")) return colors.danger;
  return colors.warning;
};

export function PestanasAnalisis({ activa, onChange }) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.pestanas,
        { borderColor: colors.border, backgroundColor: colors.surface },
      ]}
    >
      {PESTANAS_ANALISIS.map((pestana) => {
        const seleccionada = pestana.id === activa;
        return (
          <TouchableOpacity
            key={pestana.id}
            style={[
              styles.pestana,
              seleccionada && {
                borderBottomColor: colors.primary,
                borderBottomWidth: 3,
              },
            ]}
            onPress={() => onChange(pestana.id)}
            activeOpacity={0.75}
          >
            <Ionicons
              name={pestana.icono}
              size={17}
              color={seleccionada ? colors.primary : colors.textMuted}
            />
            <Text
              style={[
                styles.pestanaTexto,
                { color: seleccionada ? colors.primary : colors.textMuted },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.78}
            >
              {pestana.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function SelectorTemporada({
  temporadas,
  temporada,
  visible,
  onAbrir,
  onCerrar,
  onSeleccionar,
}) {
  const { colors } = useTheme();

  return (
    <>
      <TouchableOpacity
        style={[
          styles.selectorTemporada,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
        onPress={onAbrir}
        activeOpacity={0.8}
      >
        <View>
          <Text style={[styles.selectorEtiqueta, { color: colors.textMuted }]}>
            Temporada
          </Text>
          <Text style={[styles.selectorValor, { color: colors.textStrong }]}>
            {temporada || "Seleccionar"}
          </Text>
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
                Seleccionar temporada
              </Text>
              <TouchableOpacity style={styles.botonIcono} onPress={onCerrar}>
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {temporadas.map((item) => {
                const seleccionada = Number(item) === Number(temporada);
                return (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.opcionModal,
                      {
                        borderColor: colors.border,
                        backgroundColor: colors.surface,
                      },
                      seleccionada && { borderColor: colors.primary },
                    ]}
                    onPress={() => onSeleccionar(item)}
                  >
                    <Text style={[styles.opcionTexto, { color: colors.text }]}>
                      Temporada {item}
                    </Text>
                    {seleccionada ? (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={colors.primary}
                      />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

export function EstadoConsulta({
  cargando,
  error,
  vacio,
  mensajeVacio,
  onReintentar,
}) {
  const { colors } = useTheme();

  if (cargando) {
    return (
      <View style={styles.estadoConsulta}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={[styles.estadoTexto, { color: colors.textMuted }]}>
          Cargando análisis...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.estadoConsulta}>
        <Ionicons
          name="cloud-offline-outline"
          size={28}
          color={colors.textMuted}
        />
        <Text style={[styles.estadoTitulo, { color: colors.textStrong }]}>
          No se pudo cargar la información
        </Text>
        <Text style={[styles.estadoTexto, { color: colors.textMuted }]}>
          {error}
        </Text>
        {onReintentar ? (
          <TouchableOpacity
            style={[
              styles.botonReintentar,
              { backgroundColor: colors.primary },
            ]}
            onPress={onReintentar}
          >
            <Ionicons name="refresh" size={17} color="#ffffff" />
            <Text style={styles.botonReintentarTexto}>Reintentar</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }

  if (vacio) {
    return (
      <View style={styles.estadoConsulta}>
        <Ionicons
          name="stats-chart-outline"
          size={28}
          color={colors.textMuted}
        />
        <Text style={[styles.estadoTexto, { color: colors.textMuted }]}>
          {mensajeVacio || "No hay datos disponibles"}
        </Text>
      </View>
    );
  }

  return null;
}

export function EncabezadoSeccion({
  titulo,
  subtitulo,
  icono = "analytics-outline",
  accion,
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.encabezadoSeccion}>
      <View
        style={[styles.iconoSeccion, { backgroundColor: colors.surfaceAlt }]}
      >
        <Ionicons name={icono} size={18} color={colors.primary} />
      </View>
      <View style={styles.encabezadoTexto}>
        <Text style={[styles.seccionTitulo, { color: colors.textStrong }]}>
          {titulo}
        </Text>
        {subtitulo ? (
          <Text style={[styles.seccionSubtitulo, { color: colors.textMuted }]}>
            {subtitulo}
          </Text>
        ) : null}
      </View>
      {accion || null}
    </View>
  );
}

export function IndicadorEstado({ estado }) {
  const { colors } = useTheme();
  const color = obtenerColorEstado(estado, colors);

  return (
    <View style={[styles.indicadorEstado, { borderColor: color }]}>
      <View style={[styles.puntoEstado, { backgroundColor: color }]} />
      <Text style={[styles.indicadorTexto, { color }]}>
        {estado || "Sin estado"}
      </Text>
    </View>
  );
}

export function IndicadorTendencia({ valor }) {
  const { colors } = useTheme();
  const numero = aNumero(valor);
  const icono =
    numero > 0.05 ? "trending-up" : numero < -0.05 ? "trending-down" : "remove";
  const color =
    numero > 0.05
      ? colors.success
      : numero < -0.05
        ? colors.danger
        : colors.warning;

  return (
    <View style={styles.tendencia}>
      <Ionicons name={icono} size={24} color={color} />
      <Text style={[styles.tendenciaTexto, { color }]}>
        {numero > 0.05 ? "Mejora" : numero < -0.05 ? "Baja" : "Estable"}
      </Text>
    </View>
  );
}

export function TarjetaDesplegable({
  titulo,
  subtitulo,
  imagen,
  icono = "analytics-outline",
  abierta,
  onPress,
  onDetalle,
  cabeceraPersonalizada,
  cabeceraExtra,
  children,
}) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.tarjeta,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <TouchableOpacity
        style={styles.tarjetaCabecera}
        onPress={onPress}
        activeOpacity={0.8}
      >
        {cabeceraPersonalizada ? (
          <View style={styles.tarjetaCabeceraPersonalizada}>
            {cabeceraPersonalizada}
          </View>
        ) : (
          <>
            {imagen ? (
              <Image
                source={{ uri: imagen }}
                style={styles.tarjetaImagen}
                resizeMode="contain"
              />
            ) : (
              <View
                style={[
                  styles.tarjetaImagenVacia,
                  { backgroundColor: colors.surfaceAlt },
                ]}
              >
                <Ionicons name={icono} size={20} color={colors.primary} />
              </View>
            )}
            <View style={styles.tarjetaTitulos}>
              <Text
                style={[styles.tarjetaTitulo, { color: colors.textStrong }]}
                numberOfLines={1}
              >
                {titulo}
              </Text>
              {subtitulo ? (
                <Text
                  style={[
                    styles.tarjetaSubtitulo,
                    { color: colors.textMuted },
                  ]}
                  numberOfLines={1}
                >
                  {subtitulo}
                </Text>
              ) : null}
            </View>
            {cabeceraExtra || null}
          </>
        )}
        {onDetalle ? (
          <TouchableOpacity
            style={[
              styles.botonDetalle,
              { backgroundColor: colors.surfaceAlt },
            ]}
            onPress={onDetalle}
            hitSlop={8}
          >
            <Ionicons name="open-outline" size={17} color={colors.primary} />
          </TouchableOpacity>
        ) : null}
        <Ionicons
          name={abierta ? "chevron-up" : "chevron-down"}
          size={18}
          color={colors.textMuted}
        />
      </TouchableOpacity>
      {abierta ? (
        <View
          style={[styles.tarjetaContenido, { borderTopColor: colors.border }]}
        >
          {children}
        </View>
      ) : null}
    </View>
  );
}

export function BarrasPrediccion({ local, empate, visitante, nombres }) {
  const { colors } = useTheme();
  const datos = [
    {
      clave: "local",
      etiqueta: nombres?.local || "Victoria local",
      valor: local,
      color: "#2e86de",
    },
    { clave: "empate", etiqueta: "Empate", valor: empate, color: "#7b8794" },
    {
      clave: "visitante",
      etiqueta: nombres?.visitante || "Victoria visitante",
      valor: visitante,
      color: "#e07a3f",
    },
  ];

  return (
    <View style={styles.barras}>
      {datos.map((item) => {
        const porcentaje = Math.max(
          0,
          Math.min(100, normalizarPorcentaje(item.valor) || 0),
        );
        return (
          <View key={item.clave} style={styles.barraFila}>
            <View style={styles.barraEtiquetaFila}>
              <Text
                style={[styles.barraEtiqueta, { color: colors.text }]}
                numberOfLines={1}
              >
                {item.etiqueta}
              </Text>
              <Text style={[styles.barraValor, { color: colors.textStrong }]}>
                {formatearPorcentaje(item.valor)}
              </Text>
            </View>
            <View
              style={[
                styles.barraFondo,
                { backgroundColor: colors.surfaceAlt },
              ]}
            >
              <View
                style={[
                  styles.barraRelleno,
                  { width: `${porcentaje}%`, backgroundColor: item.color },
                ]}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

const MONTECARLO_CAMPOS = [
  { clave: "campeon_pct", etiqueta: "Campeón", color: "#e6b800" },
  { clave: "champions_pct", etiqueta: "Champions", color: "#2f8cff" },
  { clave: "europa_pct", etiqueta: "Europa", color: "#f27a1a" },
  { clave: "media_tabla_pct", etiqueta: "Media tabla", color: "#2fbf61" },
  { clave: "descenso_pct", etiqueta: "Descenso", color: "#e54848" },
];

export function ResumenMontecarlo({ datos, historico = false }) {
  const { colors } = useTheme();

  if (!datos) {
    return (
      <Text style={[styles.textoSecundario, { color: colors.textMuted }]}>
        No hay datos de Monte Carlo disponibles.
      </Text>
    );
  }

  return (
    <View>
      <View
        style={[styles.avisoModelo, { backgroundColor: colors.surfaceAlt }]}
      >
        <Ionicons
          name={historico ? "checkmark-done-outline" : "dice-outline"}
          size={17}
          color={colors.primary}
        />
        <Text style={[styles.avisoModeloTexto, { color: colors.text }]}>
          {historico
            ? "Resultado final de la temporada"
            : "Simulación actual de final de temporada"}
        </Text>
      </View>
      <View style={styles.montecarloFila}>
        {MONTECARLO_CAMPOS.map((campo) => (
          <View key={campo.clave} style={styles.montecarloItem}>
            <View
              style={[
                styles.montecarloValor,
                {
                  borderColor:
                    (normalizarPorcentaje(datos[campo.clave]) || 0) > 0
                      ? campo.color
                      : colors.border,
                },
              ]}
            >
              <Text
                style={[styles.montecarloNumero, { color: colors.textStrong }]}
              >
                {formatearPorcentaje(datos[campo.clave])}
              </Text>
            </View>
            <Text
              style={[styles.montecarloEtiqueta, { color: colors.textMuted }]}
              numberOfLines={2}
            >
              {campo.etiqueta}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function GraficoRadarRatings({ ratings, nombre }) {
  const { colors, isDark } = useTheme();
  const radarLabelColor = isDark
    ? "rgba(255, 255, 255, 1)"
    : "rgba(89, 119, 143, 1)";
  const radarGridColor = isDark
    ? "rgba(112, 148, 178, 0.55)"
    : "rgba(217, 229, 240, 1)";
  const radarGridFill = isDark
    ? "rgba(20, 40, 59, 1)"
    : "rgba(255, 255, 255, 1)";
  const radarPolygonColor = isDark
    ? "rgba(88, 170, 245, 1)"
    : "rgba(46, 134, 222, 1)";
  const campos = [
    ["Ataque", ratings?.ataque],
    ["Creación", ratings?.creacion],
    ["Defensa", ratings?.defensa],
    ["Portería", ratings?.porteros],
    ["Duelos", ratings?.duelos],
    ["Regate", ratings?.regates],
  ];
  const data = campos.map(([, value]) => aNumero(value));
  const tieneDatos = data.some((value) => value > 0);

  if (!ratings || !tieneDatos) {
    return (
      <Text style={[styles.textoSecundario, { color: colors.textMuted }]}>
        No hay ratings para esta temporada.
      </Text>
    );
  }

  return (
    <View style={styles.radar}>
      <Text
        style={[styles.radarTitulo, { color: colors.textStrong }]}
        numberOfLines={1}
      >
        {nombre || "Radar de rendimiento"}
      </Text>
      <RadarChart
        data={data}
        labels={campos.map(([label]) => label)}
        maxValue={10}
        chartSize={250}
        isAnimated={false}
        labelConfig={{
          stroke: radarLabelColor,
          fontSize: 12,
          fontWeight: "600",
        }}
        gridConfig={{
          stroke: radarGridColor,
          fill: radarGridFill,
          showGradient: false,
        }}
        asterLinesConfig={{ stroke: radarGridColor }}
        polygonConfig={{
          stroke: radarPolygonColor,
          fill: radarPolygonColor,
          opacity: 0.32,
        }}
        chartContainerProps={{ backgroundColor: "transparent" }}
      />
    </View>
  );
}

export function Separador() {
  const { colors } = useTheme();
  return (
    <View style={[styles.separador, { backgroundColor: colors.border }]} />
  );
}

const styles = StyleSheet.create({
  pestanas: {
    height: 58,
    flexDirection: "row",
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  pestana: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    borderBottomColor: "transparent",
  },
  pestanaTexto: {
    width: "100%",
    paddingHorizontal: 2,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "700",
  },
  selectorTemporada: {
    height: 52,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectorEtiqueta: { fontSize: 11, fontWeight: "600" },
  selectorValor: { marginTop: 2, fontSize: 15, fontWeight: "800" },
  modalCapa: { flex: 1, justifyContent: "center", paddingHorizontal: 22 },
  modalFondo: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10, 28, 45, 0.48)",
  },
  modalContenido: {
    maxHeight: "68%",
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
  botonIcono: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  opcionModal: {
    minHeight: 46,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  opcionTexto: { fontSize: 14, fontWeight: "700" },
  estadoConsulta: {
    minHeight: 210,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  estadoTitulo: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },
  estadoTexto: {
    marginTop: 7,
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 19,
  },
  botonReintentar: {
    height: 40,
    marginTop: 14,
    borderRadius: 8,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  botonReintentarTexto: { color: "#ffffff", fontSize: 13, fontWeight: "800" },
  encabezadoSeccion: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  iconoSeccion: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  encabezadoTexto: { flex: 1, marginLeft: 9 },
  seccionTitulo: { fontSize: 17, fontWeight: "800" },
  seccionSubtitulo: { marginTop: 2, fontSize: 12, lineHeight: 16 },
  indicadorEstado: {
    minHeight: 26,
    borderWidth: 1,
    borderRadius: 13,
    paddingHorizontal: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  puntoEstado: { width: 7, height: 7, borderRadius: 4 },
  indicadorTexto: { fontSize: 11, fontWeight: "800" },
  tendencia: { alignItems: "center", justifyContent: "center", minWidth: 56 },
  tendenciaTexto: { marginTop: 1, fontSize: 10, fontWeight: "800" },
  tarjeta: {
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 10,
    overflow: "hidden",
  },
  tarjetaCabecera: {
    minHeight: 66,
    paddingHorizontal: 11,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  tarjetaImagen: { width: 42, height: 42 },
  tarjetaImagenVacia: {
    width: 42,
    height: 42,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  tarjetaTitulos: { flex: 1, minWidth: 0 },
  tarjetaTitulo: { fontSize: 14, fontWeight: "800" },
  tarjetaSubtitulo: { marginTop: 3, fontSize: 12, fontWeight: "500" },
  tarjetaCabeceraPersonalizada: { flex: 1, minWidth: 0 },
  botonDetalle: {
    width: 31,
    height: 31,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  tarjetaContenido: { borderTopWidth: 1, padding: 12 },
  barras: { gap: 11 },
  barraFila: { gap: 5 },
  barraEtiquetaFila: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  barraEtiqueta: { flex: 1, marginRight: 8, fontSize: 12, fontWeight: "600" },
  barraValor: { fontSize: 12, fontWeight: "800" },
  barraFondo: { height: 7, borderRadius: 4, overflow: "hidden" },
  barraRelleno: { height: "100%", borderRadius: 4 },
  avisoModelo: {
    minHeight: 36,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  avisoModeloTexto: { flex: 1, fontSize: 11, fontWeight: "700" },
  montecarloFila: {
    flexDirection: "row",
    marginTop: 12,
    justifyContent: "space-between",
  },
  montecarloItem: { width: "19%", alignItems: "center" },
  montecarloValor: {
    width: "100%",
    aspectRatio: 1,
    maxWidth: 54,
    borderWidth: 2,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  montecarloNumero: { fontSize: 11, fontWeight: "900" },
  montecarloEtiqueta: {
    marginTop: 5,
    minHeight: 28,
    fontSize: 9,
    fontWeight: "700",
    textAlign: "center",
  },
  radar: { alignItems: "center", overflow: "hidden" },
  radarTitulo: {
    alignSelf: "stretch",
    marginBottom: 6,
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
  },
  textoSecundario: { fontSize: 12, lineHeight: 18 },
  separador: { height: StyleSheet.hairlineWidth, marginVertical: 13 },
});
