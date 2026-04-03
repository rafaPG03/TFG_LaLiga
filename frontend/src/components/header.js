import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function CustomHeader({ title, onMenuPress }) {
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState('');

  useEffect(() => {
    if (!modalVisible) {
      setSearchText('');
      setResults([]);
      setIsLoading(false);
      setSearchError('');
      return;
    }

    const query = searchText.trim();

    if (query.length < 2) {
      setResults([]);
      setIsLoading(false);
      setSearchError('');
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        setIsLoading(true);
        setSearchError('');

        const response = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/buscador?q=${encodeURIComponent(query)}`
        );

        if (!response.ok) {
          throw new Error('No se pudo completar la busqueda');
        }

        const data = await response.json();
        setResults(Array.isArray(data) ? data : []);
      } catch (error) {
        setResults([]);
        setSearchError('No se pudo conectar con la API de busqueda');
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchText, modalVisible]);

  const abrirModalBusqueda = () => {
    setModalVisible(true);
  };

  const cerrarModalBusqueda = () => {
    setModalVisible(false);
  };

  const navegarResultado = (item) => {
    cerrarModalBusqueda();

    if (item.tipo === 'jugador') {
      navigation.navigate('DetalleJugador', { id: item.id });
      return;
    }

    if (item.tipo === 'equipo') {
      navigation.navigate('DetalleEquipo', { idEquipo: item.id });
    }
  };

  const renderResultado = ({ item }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => navegarResultado(item)}
      activeOpacity={0.8}
    >
      <View style={styles.resultIconWrap}>
        {item.imagen ? (
          <Image
            source={{ uri: item.imagen }}
            style={styles.resultImage}
            resizeMode="cover"
          />
        ) : (
          <Ionicons
            name={item.tipo === 'jugador' ? 'person-outline' : 'shield-outline'}
            size={18}
            color="#1f6fa7"
          />
        )}
      </View>
      <View style={styles.resultTextWrap}>
        <Text style={styles.resultTitle} numberOfLines={1}>
          {item.principal}
        </Text>
        <Text style={styles.resultSubtitle} numberOfLines={1}>
          {item.secundario || 'Sin informacion'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#5f7f9b" />
    </TouchableOpacity>
  );

  return (
    <>
      <View style={styles.topBar}>
        <StatusBar barStyle="dark-content" />

        <TouchableOpacity
          style={styles.iconButton}
          onPress={onMenuPress}
          activeOpacity={0.7}
        >
          <Ionicons name="menu" size={28} color="#103a5d" />
        </TouchableOpacity>

        <Text style={styles.topBarTitle}>{title}</Text>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={abrirModalBusqueda}
          activeOpacity={0.7}
        >
          <Ionicons name="search" size={24} color="#103a5d" />
        </TouchableOpacity>
      </View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={cerrarModalBusqueda}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={cerrarModalBusqueda}
          />

          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Buscar</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={cerrarModalBusqueda}
                activeOpacity={0.75}
              >
                <Ionicons name="close" size={18} color="#103a5d" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputRow}>
              <Ionicons name="search" size={18} color="#5f7f9b" />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar jugador o equipo"
                placeholderTextColor="#8aa0b5"
                autoCapitalize="none"
                autoCorrect={false}
                value={searchText}
                onChangeText={setSearchText}
              />
            </View>

            {isLoading ? (
              <View style={styles.feedbackState}>
                <ActivityIndicator size="small" color="#1f6fa7" />
                <Text style={styles.feedbackText}>Buscando...</Text>
              </View>
            ) : searchText.trim().length < 2 ? (
              <View style={styles.feedbackState}>
                <Ionicons name="search-outline" size={20} color="#5f7f9b" />
                <Text style={styles.feedbackText}>Escribe al menos 2 letras</Text>
              </View>
            ) : searchError ? (
              <View style={styles.feedbackState}>
                <Ionicons name="cloud-offline-outline" size={20} color="#5f7f9b" />
                <Text style={styles.feedbackText}>{searchError}</Text>
              </View>
            ) : results.length === 0 ? (
              <View style={styles.feedbackState}>
                <Ionicons name="alert-circle-outline" size={20} color="#5f7f9b" />
                <Text style={styles.feedbackText}>No hay resultados para tu busqueda</Text>
              </View>
            ) : (
              <FlatList
                data={results}
                keyExtractor={(item, index) => `${item.tipo}-${item.id}-${index}`}
                renderItem={renderResultado}
                style={styles.resultsList}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  topBar: {
    height: 86,
    paddingTop: Platform.OS === 'ios' ? 42 : 28,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#dbe7f2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#eaf3fb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#103a5d',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(16, 40, 64, 0.35)',
  },
  modalCard: {
    maxHeight: '70%',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d9e5f0',
    backgroundColor: '#f4f8fc',
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#103a5d',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#eaf3fb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d9e5f0',
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    color: '#1d3850',
    fontSize: 14,
    height: '100%',
    marginLeft: 8,
  },
  resultsList: {
    marginTop: 10,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d9e5f0',
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginBottom: 8,
  },
  resultIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eaf3fb',
    overflow: 'hidden',
  },
  resultImage: {
    width: '100%',
    height: '100%',
  },
  resultTextWrap: {
    flex: 1,
    marginLeft: 10,
    marginRight: 8,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1d3850',
  },
  resultSubtitle: {
    fontSize: 12,
    color: '#59778f',
    marginTop: 2,
  },
  feedbackState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  feedbackText: {
    fontSize: 13,
    color: '#59778f',
    fontWeight: '500',
    marginTop: 6,
  },
});