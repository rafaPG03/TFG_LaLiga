import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const MENSAJE_BIENVENIDA = {
  id: 'welcome',
  role: 'assistant',
  text: 'Hola, soy Agente de Oro. Preguntame por equipos, jugadores, partidos o rankings.',
};

const MENSAJE_HINT = {
  id: 'hint',
  role: 'assistant',
  text: 'Puedo convertir tu consulta en datos de la liga y devolvertelo de forma clara.',
};

const SUGERENCIAS = [
  'Top goleadores de la temporada 2024',
  'Clasificacion del Barcelona',
  'Ultimos partidos del Madrid',
];

const API_BASE = process.env.EXPO_PUBLIC_API_URL;
const MAX_HISTORIAL_MENSAJES = 12;
const CHATBOT_TIMEOUT_MS = 12000;
const CHATBOT_TIMEOUT_CODE = 'CHATBOT_TIMEOUT';
const CHATBOT_TIMEOUT_MESSAGE = 'La consulta está tardando demasiado. Intenta indicar de forma más concreta el jugador, equipo, temporada o estadística que buscas.';

const crearId = (prefijo) => `${prefijo}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const MENSAJES_INICIALES = [MENSAJE_BIENVENIDA, MENSAJE_HINT];

const crearHistorial = (mensajes) => mensajes
  .filter((mensaje) => mensaje.contextEligible === true)
  .slice(-MAX_HISTORIAL_MENSAJES)
  .map(({ role, text }) => ({ role, text }));

export default function AgenteDeOro({ visible = true, resetConversation = false }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [texto, setTexto] = useState('');
  const [mensajes, setMensajes] = useState(MENSAJES_INICIALES);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const scrollViewRef = useRef(null);

  const abrir = () => setModalVisible(true);

  const cerrar = () => {
    setModalVisible(false);
    setError('');
  };

  const nuevoChat = () => {
    if (cargando) {
      return;
    }

    setMensajes(MENSAJES_INICIALES);
    setTexto('');
    setError('');
  };

  useEffect(() => {
    if (!resetConversation) {
      return;
    }

    setMensajes(MENSAJES_INICIALES);
    setTexto('');
    setError('');
    setModalVisible(false);
  }, [resetConversation]);

  useEffect(() => {
    if (!modalVisible) {
      return;
    }

    requestAnimationFrame(() => {
      scrollViewRef.current?.scrollToEnd?.({ animated: false });
    });
  }, [modalVisible]);

  useEffect(() => {
    if (!modalVisible) {
      return;
    }

    requestAnimationFrame(() => {
      scrollViewRef.current?.scrollToEnd?.({ animated: true });
    });
  }, [mensajes, modalVisible]);

  useEffect(() => {
    if (Platform.OS !== 'web' || !modalVisible) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        cerrar();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [modalVisible]);

  const puedeEnviar = useMemo(() => {
    return texto.trim().length > 0 && !cargando;
  }, [texto, cargando]);

  const enviarPregunta = async () => {
    const pregunta = texto.trim();

    if (!pregunta || cargando) {
      return;
    }

    const mensajeUsuario = {
      id: crearId('user'),
      role: 'user',
      text: pregunta,
      contextEligible: false,
    };
    const historial = crearHistorial(mensajes);

    setMensajes((prev) => [...prev, mensajeUsuario]);
    setTexto('');
    setError('');
    setCargando(true);

    const abortController = new AbortController();
    const timeoutId = setTimeout(() => {
      abortController.abort();
    }, CHATBOT_TIMEOUT_MS);

    try {
      if (!API_BASE) {
        throw new Error('API base no configurada');
      }

      const response = await fetch(`${API_BASE}/chatbot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pregunta, historial }),
        signal: abortController.signal,
      });

      const data = await response.json();

      if (!response.ok) {
        const requestError = new Error(data?.error || 'No se pudo obtener respuesta');
        requestError.code = data?.code;
        throw requestError;
      }

      const respuestaTexto = typeof data?.respuesta === 'string'
        ? data.respuesta
        : data?.respuesta
          ? JSON.stringify(data.respuesta)
          : data?.mensaje || 'No he podido generar una respuesta.';

      setMensajes((prev) => [
        ...prev.map((mensaje) => (
          mensaje.id === mensajeUsuario.id
            ? { ...mensaje, contextEligible: true }
            : mensaje
        )),
        {
          id: crearId('assistant'),
          role: 'assistant',
          text: respuestaTexto,
          contextEligible: true,
        },
      ]);
    } catch (err) {
      const isTimeout = err?.name === 'AbortError' || err?.code === CHATBOT_TIMEOUT_CODE;
      const errorText = isTimeout
        ? 'La solicitud ha superado el tiempo límite.'
        : err?.message || 'Error de conexión con el agente';
      const assistantErrorText = isTimeout
        ? CHATBOT_TIMEOUT_MESSAGE
        : 'Ahora mismo no puedo responder. Inténtalo de nuevo en unos segundos.';

      setError(errorText);
      setMensajes((prev) => [
        ...prev,
        {
          id: crearId('error'),
          role: 'assistant',
          text: assistantErrorText,
          contextEligible: false,
        },
      ]);
    } finally {
      clearTimeout(timeoutId);
      setCargando(false);
    }
  };

  const usarSugerencia = (sugerencia) => {
    if (cargando) {
      return;
    }

    setTexto(sugerencia);
  };

  if (!visible) {
    return null;
  }

  return (
    <>
      {!modalVisible ? (
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={abrir}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={['#f5d27a', '#c89b2c', '#8a6512']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.floatingGradient}
          >
            <Ionicons name="sparkles" size={22} color="#fff9e9" />
          </LinearGradient>
        </TouchableOpacity>
      ) : null}

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={cerrar}
      >
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={cerrar} />

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : Platform.OS === 'android' ? 'height' : undefined}
            enabled={Platform.OS !== 'web'}
            style={styles.modalShell}
          >
            <View style={[styles.card, styles.cardWeb]}>
              <LinearGradient
                colors={['#1f3550', '#17304b', '#0f2238']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
              >
                <View style={styles.headerLeft}>
                  <View style={styles.avatar}>
                    <Ionicons name="sparkles" size={18} color="#fff3ce" />
                  </View>
                  <View>
                    <Text style={styles.title}>Agente de Oro</Text>
                  </View>
                </View>

                <View style={styles.headerActions}>
                  <TouchableOpacity
                    style={[styles.newChatButton, cargando && styles.headerButtonDisabled]}
                    onPress={nuevoChat}
                    activeOpacity={0.8}
                    disabled={cargando}
                    accessibilityLabel="Iniciar un nuevo chat"
                  >
                    <Ionicons name="add" size={16} color="#f8e8b4" />
                    <Text style={styles.newChatText}>Nuevo chat</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.closeButton} onPress={cerrar} activeOpacity={0.8}>
                    <Ionicons name="close" size={18} color="#f8e8b4" />
                  </TouchableOpacity>
                </View>
              </LinearGradient>

              <View style={styles.body}>
                <ScrollView
                  ref={scrollViewRef}
                  style={styles.messagesList}
                  contentContainerStyle={styles.messagesContent}
                  showsVerticalScrollIndicator={false}
                  onContentSizeChange={() => {
                    scrollViewRef.current?.scrollToEnd?.({ animated: true });
                  }}
                >
                  {mensajes.map((mensaje) => (
                    <View
                      key={mensaje.id}
                      style={[
                        styles.bubbleRow,
                        mensaje.role === 'assistant' ? styles.bubbleRowLeft : styles.bubbleRowRight,
                      ]}
                    >
                      <View
                        style={[
                          styles.bubble,
                          mensaje.role === 'assistant'
                            ? styles.assistantBubble
                            : styles.userBubble,
                        ]}
                      >
                        <Text
                          style={[
                            styles.bubbleText,
                            mensaje.role === 'assistant'
                              ? styles.assistantBubbleText
                              : styles.userBubbleText,
                          ]}
                        >
                          {mensaje.text}
                        </Text>
                      </View>
                    </View>
                  ))}

                  <View style={styles.suggestionsBlock}>
                    <Text style={styles.suggestionsTitle}>Sugerencias</Text>
                    <View style={styles.suggestionsWrap}>
                      {SUGERENCIAS.map((item) => (
                        <TouchableOpacity
                          key={item}
                          style={styles.suggestionChip}
                          onPress={() => usarSugerencia(item)}
                          activeOpacity={0.82}
                          disabled={cargando}
                        >
                          <Text style={styles.suggestionText}>{item}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </ScrollView>

                <View style={styles.composer}>
                  <View style={styles.inputCard}>
                    <TextInput
                      style={styles.input}
                      placeholder="Escribe tu consulta..."
                      placeholderTextColor="#8c7d55"
                      value={texto}
                      onChangeText={setTexto}
                      multiline
                      textAlignVertical="top"
                      editable={!cargando}
                    />
                    <TouchableOpacity
                      style={[styles.sendButton, !puedeEnviar && styles.sendButtonDisabled]}
                      activeOpacity={0.85}
                      onPress={enviarPregunta}
                      disabled={!puedeEnviar}
                    >
                      {cargando ? (
                        <ActivityIndicator size="small" color="#fff3ce" />
                      ) : (
                        <Ionicons name="send" size={17} color="#fff3ce" />
                      )}
                    </TouchableOpacity>
                  </View>

                  {error ? <Text style={styles.errorText}>{error}</Text> : null}
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    right: 18,
    bottom: 22,
    zIndex: 999,
    elevation: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  floatingGradient: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 248, 222, 0.7)',
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(10, 18, 28, 0.42)',
    overflow: 'hidden',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalShell: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 18 : 14,
    minHeight: 0,
  },
  card: {
    width: '100%',
    height: '82%',
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#fffaf0',
    borderWidth: 1,
    borderColor: '#e3cd8a',
    maxHeight: '100%',
  },
  cardWeb: Platform.select({
    web: {
      height: '82vh',
      maxHeight: 'calc(100vh - 28px)',
    },
    default: {},
  }),
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 12,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 246, 210, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255, 246, 210, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  title: {
    color: '#fff7dc',
    fontSize: 17,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 2,
    color: '#d4c18c',
    fontSize: 12,
    fontWeight: '600',
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 246, 210, 0.1)',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  newChatButton: {
    height: 34,
    borderRadius: 17,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 246, 210, 0.1)',
  },
  newChatText: {
    color: '#f8e8b4',
    fontSize: 11,
    fontWeight: '700',
  },
  headerButtonDisabled: {
    opacity: 0.5,
  },
  body: {
    backgroundColor: '#fffdf7',
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
    flex: 1,
    minHeight: 0,
  },
  messagesList: {
    flex: 1,
    minHeight: 0,
  },
  messagesContent: {
    paddingBottom: 14,
  },
  bubbleRow: {
    marginBottom: 10,
    flexDirection: 'row',
  },
  bubbleRowLeft: {
    justifyContent: 'flex-start',
  },
  bubbleRowRight: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '84%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  assistantBubble: {
    backgroundColor: '#f5efe0',
    borderTopLeftRadius: 8,
    borderWidth: 1,
    borderColor: '#ead8aa',
  },
  userBubble: {
    backgroundColor: '#17304b',
    borderTopRightRadius: 8,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  assistantBubbleText: {
    color: '#4b3a16',
    fontWeight: '500',
  },
  userBubbleText: {
    color: '#fff7dc',
    fontWeight: '600',
  },
  suggestionsBlock: {
    marginTop: 6,
  },
  suggestionsTitle: {
    color: '#7b6230',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  suggestionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: '#fff5d8',
    borderColor: '#e6cd86',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  suggestionText: {
    color: '#7a5a14',
    fontSize: 12,
    fontWeight: '600',
  },
  composer: {
    paddingTop: 10,
  },
  inputCard: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#fff7e1',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e4cc87',
    paddingLeft: 14,
    paddingRight: 8,
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 88,
    color: '#4a3810',
    fontSize: 14,
    lineHeight: 20,
    paddingRight: 10,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d8b04b',
  },
  sendButtonDisabled: {
    opacity: 0.55,
  },
  errorText: {
    marginTop: 8,
    color: '#a6452d',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  composerNote: {
    marginTop: 8,
    color: '#907740',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
});
