import React, { useState } from 'react';
import {
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

const MENSAJES_INICIALES = [
  {
    id: 'welcome',
    role: 'assistant',
    text: 'Hola, soy Agente de Oro. Preguntame por equipos, jugadores, partidos o rankings.',
  },
  {
    id: 'hint',
    role: 'assistant',
    text: 'Esta es solo la fachada visual. En la siguiente fase conectaremos Gemini y la base de datos.',
  },
];

const SUGERENCIAS = [
  'Top goleadores de la temporada 2024',
  'Clasificacion del Barcelona',
  'Ultimos partidos del Madrid',
];

export default function AgenteDeOro({ visible = true }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [texto, setTexto] = useState('');

  const abrir = () => setModalVisible(true);
  const cerrar = () => setModalVisible(false);

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
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalShell}
          >
            <View style={styles.card}>
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
                    <Text style={styles.subtitle}>Asistente deportivo premium</Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.closeButton} onPress={cerrar} activeOpacity={0.8}>
                  <Ionicons name="close" size={18} color="#f8e8b4" />
                </TouchableOpacity>
              </LinearGradient>

              <View style={styles.body}>
                <ScrollView
                  style={styles.messagesList}
                  contentContainerStyle={styles.messagesContent}
                  showsVerticalScrollIndicator={false}
                >
                  {MENSAJES_INICIALES.map((mensaje) => (
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
                        <View key={item} style={styles.suggestionChip}>
                          <Text style={styles.suggestionText}>{item}</Text>
                        </View>
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
                    />
                    <TouchableOpacity
                      style={styles.sendButtonDisabled}
                      activeOpacity={1}
                      disabled
                    >
                      <Ionicons name="send" size={17} color="#fff3ce" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.composerNote}>
                    La versión funcional llegará en la siguiente fase.
                  </Text>
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
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalShell: {
    width: '100%',
    paddingHorizontal: 14,
    paddingBottom: Platform.OS === 'ios' ? 18 : 14,
  },
  card: {
    width: '100%',
    height: '82%',
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#fffaf0',
    borderWidth: 1,
    borderColor: '#e3cd8a',
  },
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
  sendButtonDisabled: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d8b04b',
    opacity: 0.6,
  },
  composerNote: {
    marginTop: 8,
    color: '#907740',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
});
