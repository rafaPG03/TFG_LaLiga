import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

export default function EventosTab({ route, navigation }) {
  const { id_partido, partidoInfo } = route.params;
  const [loading, setLoading] = useState(true);
  const [datos, setDatos] = useState([]);
  const [error, setError] = useState("");
  const [logosEquipo, setLogosEquipo] = useState({});
  const [jugadoresInfo, setJugadoresInfo] = useState({});

  useEffect(() => {
    const cargarInfoEquipos = async (idsEquipo) => {
      const respuestas = await Promise.all(
        idsEquipo.map(async (idEquipo) => {
          try {
            const res = await fetch(
              `${process.env.EXPO_PUBLIC_API_URL}/equipos/${idEquipo}`,
            );
            if (!res.ok) return null;
            const data = await res.json();
            return [idEquipo, data?.logo || null];
          } catch {
            return null;
          }
        }),
      );

      const mapa = {};
      respuestas.forEach((item) => {
        if (item && item[1]) {
          mapa[item[0]] = item[1];
        }
      });
      setLogosEquipo(mapa);
    };

    const cargarInfoJugadores = async (idsJugador) => {
      const respuestas = await Promise.all(
        idsJugador.map(async (idJugador) => {
          try {
            const res = await fetch(
              `${process.env.EXPO_PUBLIC_API_URL}/jugadores/${idJugador}`,
            );
            if (!res.ok) return null;
            const data = await res.json();
            return [idJugador, data];
          } catch {
            return null;
          }
        }),
      );

      const mapa = {};
      respuestas.forEach((item) => {
        if (item && item[1]) {
          mapa[item[0]] = item[1];
        }
      });
      setJugadoresInfo(mapa);
    };

    const cargarEventos = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/partidos/${id_partido}/eventos`,
        );

        if (!response.ok) {
          throw new Error("No se pudieron cargar los eventos del partido");
        }

        const eventos = await response.json();
        const listaEventos = Array.isArray(eventos) ? eventos : [];
        setDatos(listaEventos);

        const idsEquipo = [
          ...new Set(
            listaEventos
              .map((evento) => Number(evento.id_equipo))
              .filter((id) => Number.isInteger(id) && id > 0),
          ),
        ];

        const idsJugador = [
          ...new Set(
            listaEventos
              .flatMap((evento) => [
                Number(evento.id_jugador),
                Number(evento.id_asistente_o_sale),
              ])
              .filter((id) => Number.isInteger(id) && id > 0),
          ),
        ];

        await Promise.all([
          cargarInfoEquipos(idsEquipo),
          cargarInfoJugadores(idsJugador),
        ]);
      } catch (e) {
        setError("No se pudieron obtener los eventos");
        setDatos([]);
        setLogosEquipo({});
        setJugadoresInfo({});
      } finally {
        setLoading(false);
      }
    };

    if (id_partido) {
      cargarEventos();
    } else {
      setError("Partido invalido");
      setLoading(false);
    }
  }, [id_partido]);

  const eventosOrdenados = useMemo(() => {
    return [...datos].sort((a, b) => {
      if (a.minuto !== b.minuto) return a.minuto - b.minuto;
      if (a.extra !== b.extra) return a.extra - b.extra;
      return a.id_evento - b.id_evento;
    });
  }, [datos]);

  const eventosConMarcador = useMemo(() => {
    const idLocal = Number(partidoInfo?.id_local);
    const idVisitante = Number(partidoInfo?.id_visitante);
    let golesLocal = 0;
    let golesVisitante = 0;

    return eventosOrdenados.map((evento) => {
      const idEquipoEvento = Number(evento?.id_equipo);
      const esGol = (evento?.tipo || "").trim().toLowerCase() === "gol";
      const esGolEnPropia =
        (evento?.detalle || "").trim().toLowerCase() === "gol en propia";

      if (esGol) {
        const golParaLocal =
          (!esGolEnPropia && idEquipoEvento === idLocal) ||
          (esGolEnPropia && idEquipoEvento === idVisitante);
        const golParaVisitante =
          (!esGolEnPropia && idEquipoEvento === idVisitante) ||
          (esGolEnPropia && idEquipoEvento === idLocal);

        if (golParaLocal) golesLocal += 1;
        if (golParaVisitante) golesVisitante += 1;
      }

      return {
        ...evento,
        esLocal: idEquipoEvento === idLocal,
        marcadorLocal: golesLocal,
        marcadorVisitante: golesVisitante,
      };
    });
  }, [eventosOrdenados, partidoInfo?.id_local, partidoInfo?.id_visitante]);

  const formatearMinuto = (minuto, extra) => {
    if (Number(extra) > 0) return `${minuto}+${extra}'`;
    return `${minuto}'`;
  };

  const colorTipo = (tipo) => {
    const normalizado = (tipo || "").toLowerCase();
    if (normalizado.includes("gol")) return "#16a34a";
    if (normalizado.includes("tarjeta")) return "#d97706";
    if (normalizado.includes("sustit")) return "#2563eb";
    return "#475569";
  };

  const getIconoConfig = (tipo) => {
    const normalizado = (tipo || "").toLowerCase();

    if (normalizado.includes("gol")) {
      return { name: "football-outline", family: "Ionicons", color: "#ffffff" };
    }
    if (normalizado.includes("tarjeta")) {
      return {
        name: "cards",
        family: "MaterialCommunityIcons",
        color: "#ffffff",
      }; // Rojo LaLiga
    }
    if (normalizado.includes("sustit")) {
      return {
        name: "swap-horizontal-outline",
        family: "Ionicons",
        color: "#ffffff",
      }; // Verde éxito
    }
    if (normalizado.includes("var")) {
      return {
        name: "monitor-eye",
        family: "MaterialCommunityIcons",
        color: "#ffffff",
      }; // Azul oscuro
    }

    return { name: "ellipse-outline", family: "Ionicons", color: "#94a3b8" };
  };

  const descripcionEvento = (evento) => {
    const jugadorPrincipal = jugadoresInfo[evento?.id_jugador];
    const jugadorSecundario = jugadoresInfo[evento?.id_asistente_o_sale];
    const nombrePrincipal =
      jugadorPrincipal?.nombre || evento?.nombre_jugador || "Jugador";
    const nombreSecundario =
      jugadorSecundario?.nombre || evento?.nombre_secundario || "Jugador";

    if (evento?.tipo === "Sustitución") {
      return `Entra ${nombrePrincipal} por ${nombreSecundario}`;
    }

    if (evento?.tipo === "Gol") {
      if (evento?.id_asistente_o_sale) {
        return `${nombrePrincipal} (asistencia: ${nombreSecundario})`;
      }
      return nombrePrincipal;
    }

    if (evento?.tipo === "Tarjeta") {
      return nombrePrincipal;
    }

    return nombrePrincipal || "Evento";
  };

  const irDetalleJugador = (evento) => {
    if (!evento?.id_jugador) return;
    navigation.navigate("DetalleJugador", { id: evento.id_jugador });
  };

  const renderEventoCard = (evento, lado) => {
    const jugadorNoDisponible = !evento?.id_jugador;
    const logoEvento = logosEquipo[evento?.id_equipo];
    const fotoJugador =
      jugadoresInfo[evento?.id_jugador]?.foto || evento?.foto_jugador || null;
    const icono = getIconoConfig(evento.tipo);
    const esDerecha = lado === "visitante";

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={[
          styles.card,
          esDerecha ? styles.cardVisitante : styles.cardLocal,
          jugadorNoDisponible && styles.cardDisabled,
        ]}
        onPress={() => irDetalleJugador(evento)}
        disabled={jugadorNoDisponible}
      >
        <View style={[styles.cardTopRow, esDerecha && styles.rowReverse]}>
          {logoEvento ? (
            <Image source={{ uri: logoEvento }} style={styles.logoEquipo} />
          ) : (
            <View style={styles.logoFallback}>
              <Ionicons name="shield-outline" size={12} color="#5f7f9b" />
            </View>
          )}

          <View
            style={[
              styles.badgeTipo,
              { backgroundColor: colorTipo(evento.tipo) },
            ]}
          >
            {icono.family === "Ionicons" ? (
              <Ionicons name={icono.name} size={11} color={icono.color} />
            ) : (
              <MaterialCommunityIcons
                name={icono.name}
                size={11}
                color={icono.color}
              />
            )}
            <Text style={styles.badgeTipoText} numberOfLines={1}>
              {evento.tipo}
            </Text>
          </View>
        </View>

        <View style={[styles.descripcionRow, esDerecha && styles.rowReverse]}>
          {fotoJugador ? (
            <Image source={{ uri: fotoJugador }} style={styles.fotoJugador} />
          ) : (
            <View style={styles.fotoFallback}>
              <Ionicons name="person-outline" size={13} color="#5f7f9b" />
            </View>
          )}
          <Text
            style={[styles.descripcion, esDerecha && styles.textRight]}
            numberOfLines={3}
          >
            {descripcionEvento(evento)}
          </Text>
        </View>

        {!!evento.detalle && (
          <Text style={[styles.detalleText, esDerecha && styles.textRight]}>
            {evento.detalle}
          </Text>
        )}

        {!!evento.comentarios && (
          <Text
            style={[styles.comentario, esDerecha && styles.textRight]}
            numberOfLines={3}
          >
            {evento.comentarios}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="large" color="#1f6fa7" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {!error && eventosOrdenados.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="hourglass-outline" size={22} color="#5f7f9b" />
          <Text style={styles.emptyText}>
            No hay eventos registrados para este partido
          </Text>
        </View>
      ) : null}

      {eventosConMarcador.length > 0 ? (
        <View>
          <View style={styles.teamsHeader}>
            <View style={styles.teamHeaderSide}>
              {partidoInfo?.logo_local ? (
                <Image
                  source={{ uri: partidoInfo.logo_local }}
                  style={styles.teamHeaderLogo}
                />
              ) : (
                <View style={styles.teamHeaderLogoFallback}>
                  <Ionicons name="shield-outline" size={18} color="#5f7f9b" />
                </View>
              )}
              <Text style={styles.teamHeaderName} numberOfLines={2}>
                {partidoInfo?.equipo_local || "Local"}
              </Text>
            </View>

            <View style={styles.headerCenter}>
              <Text style={styles.vsText}>VS</Text>
            </View>

            <View style={styles.teamHeaderSide}>
              {partidoInfo?.logo_visitante ? (
                <Image
                  source={{ uri: partidoInfo.logo_visitante }}
                  style={styles.teamHeaderLogo}
                />
              ) : (
                <View style={styles.teamHeaderLogoFallback}>
                  <Ionicons name="shield-outline" size={18} color="#5f7f9b" />
                </View>
              )}
              <Text style={styles.teamHeaderName} numberOfLines={2}>
                {partidoInfo?.equipo_visitante || "Visitante"}
              </Text>
            </View>
          </View>

          <View style={styles.timelineWrap}>
            <View style={styles.timelineLine} />

            {eventosConMarcador.map((evento) => (
              <View key={evento.id_evento} style={styles.row}>
                <View style={styles.eventColumn}>
                  {evento.esLocal ? renderEventoCard(evento, "local") : null}
                </View>

                <View style={styles.timelineCenter}>
                  <Text style={styles.minuteText}>
                    {formatearMinuto(evento.minuto, evento.extra)}
                  </Text>
                  <View
                    style={[
                      styles.scoreBadge,
                      { borderColor: colorTipo(evento.tipo) },
                    ]}
                  >
                    <Text style={styles.scoreText}>
                      {evento.marcadorLocal} - {evento.marcadorVisitante}
                    </Text>
                  </View>
                </View>

                <View style={styles.eventColumn}>
                  {!evento.esLocal
                    ? renderEventoCard(evento, "visitante")
                    : null}
                </View>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loaderWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    paddingHorizontal: 14,
    paddingVertical: 16,
    paddingBottom: 30,
  },
  errorText: {
    color: "#b91c1c",
    backgroundColor: "#fee2e2",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10,
    fontWeight: "600",
  },
  emptyWrap: {
    marginTop: 8,
    backgroundColor: "#e9f1f8",
    borderColor: "#c5d8ea",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyText: {
    color: "#3d5b77",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  timelineWrap: {
    position: "relative",
    paddingTop: 10,
  },
  timelineLine: {
    position: "absolute",
    left: "50%",
    top: 0,
    bottom: 0,
    width: 2,
    marginLeft: -1,
    backgroundColor: "#c5d8ea",
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  eventColumn: {
    flex: 1,
    minWidth: 0,
  },
  timelineCenter: {
    width: 62,
    alignItems: "center",
    zIndex: 1,
  },
  minuteText: {
    backgroundColor: "#f4f8fc",
    paddingHorizontal: 4,
    textAlign: "center",
    color: "#1f4f7a",
    fontSize: 12,
    fontWeight: "800",
  },
  scoreBadge: {
    minWidth: 50,
    marginTop: 5,
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 2,
    backgroundColor: "#ffffff",
    alignItems: "center",
  },
  scoreText: {
    color: "#12233f",
    fontSize: 12,
    fontWeight: "900",
  },
  card: {
    backgroundColor: "#ffffff",
    borderColor: "#d8e5f1",
    borderWidth: 1,
    borderRadius: 11,
    paddingHorizontal: 8,
    paddingVertical: 9,
  },
  cardLocal: {
    marginRight: 2,
    borderTopRightRadius: 3,
  },
  cardVisitante: {
    marginLeft: 2,
    borderTopLeftRadius: 3,
  },
  cardDisabled: {
    opacity: 0.75,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 7,
  },
  rowReverse: {
    flexDirection: "row-reverse",
  },
  badgeTipo: {
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  badgeTipoText: {
    flexShrink: 1,
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "800",
  },
  logoEquipo: {
    width: 20,
    height: 20,
    borderRadius: 10,
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },
  logoFallback: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e9f1f8",
  },
  detalleText: {
    marginTop: 6,
    color: "#5f7f9b",
    fontSize: 10,
    fontWeight: "700",
  },
  descripcionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  fotoJugador: {
    width: 23,
    height: 23,
    borderRadius: 12,
    resizeMode: "cover",
    backgroundColor: "#e9f1f8",
  },
  fotoFallback: {
    width: 23,
    height: 23,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e9f1f8",
  },
  descripcion: {
    flex: 1,
    color: "#12233f",
    fontSize: 12,
    fontWeight: "700",
  },
  textRight: {
    textAlign: "right",
  },
  comentario: {
    marginTop: 5,
    color: "#5f7f9b",
    fontSize: 10,
    fontWeight: "500",
  },
  teamsHeader: {
    flexDirection: "row",
    alignItems: "stretch",
    paddingVertical: 10,
    marginBottom: 4,
    borderRadius: 13,
    backgroundColor: "#e9f1f8",
    borderColor: "#c5d8ea",
    borderWidth: 1,
  },
  teamHeaderSide: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    paddingHorizontal: 4,
  },
  teamHeaderLogo: {
    width: 30,
    height: 30,
    resizeMode: "contain",
  },
  teamHeaderLogoFallback: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  teamHeaderName: {
    marginTop: 4,
    color: "#12233f",
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "800",
    textAlign: "center",
  },
  headerCenter: {
    width: 62,
    alignItems: "center",
    justifyContent: "center",
  },
  vsText: {
    color: "#5f7f9b",
    fontSize: 11,
    fontWeight: "900",
  },
});
