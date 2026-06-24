import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import FavoritoButton from '../FavoritoButton';
import { useFavoritos } from '../../context/FavoritosContext';

export default function EquiposTemporada({ temporada }) {
  const navigation = useNavigation();
  const { equiposFav } = useFavoritos();
  const [listaEquipos, setListaEquipos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [errorCarga, setErrorCarga] = useState('');

  useEffect(() => {
    let pantallaActiva = true;

    const cargarEquipos = async () => {
      if (!temporada || temporada === 'N/D') {
        if (pantallaActiva) {
          setListaEquipos([]);
          setErrorCarga('Temporada no valida');
        }
        return;
      }

      setCargando(true);
      setErrorCarga('');

      try {
        const response = await fetch(
          `${process.env.EXPO_PUBLIC_API_URL}/temporadas/equipos?temporada=${temporada}`
        );

        if (!response.ok) {
          throw new Error('No se pudieron cargar los equipos');
        }

        const data = await response.json();

        if (pantallaActiva) {
          const equiposArray = Array.isArray(data) ? data : [];
          setListaEquipos(equiposArray);
        }
      } catch (error) {
        if (pantallaActiva) {
          setErrorCarga('Error al cargar los equipos');
          setListaEquipos([]);
        }
      } finally {
        if (pantallaActiva) {
          setCargando(false);
        }
      }
    };

    cargarEquipos();

    return () => {
      pantallaActiva = false;
    };
  }, [temporada]);

  const equiposOrdenados = useMemo(() => {
    const favSet = new Set(equiposFav.map((id) => Number(id)));

    return [...listaEquipos].sort((a, b) => {
      const aFav = favSet.has(Number(a.id_equipo));
      const bFav = favSet.has(Number(b.id_equipo));
      if (aFav === bFav) {
        return String(a.nombre_equipo).localeCompare(String(b.nombre_equipo), 'es');
      }
      return Number(bFav) - Number(aFav);
    });
  }, [listaEquipos, equiposFav]);

  const irDetalleEquipo = (idEquipo) => {
    navigation.navigate('DetalleEquipo', { idEquipo });
  };

  const renderEstadoVacio = () => {
    if (cargando) {
      return (
        <View style={styles.loadingState}>
          <ActivityIndicator size="small" color="#1f6fa7" />
          <Text style={styles.loadingText}>Cargando equipos...</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Ionicons
          name={errorCarga ? 'alert-circle-outline' : 'shield-outline'}
          size={34}
          color="#5f7f9b"
        />
        <Text style={styles.emptyStateText}>
          {errorCarga || 'No hay equipos para esta temporada'}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={equiposOrdenados}
        keyExtractor={(item) => item.id_equipo.toString()}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.screenContent}
        ListEmptyComponent={renderEstadoVacio}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.equipoCard}
            onPress={() => irDetalleEquipo(item.id_equipo)}
            activeOpacity={0.85}
          >
            <FavoritoButton
              id={item.id_equipo}
              tipo="equipo"
              style={styles.favoritoFloat}
            />
            <View style={styles.logoContainer}>
              <Image
                source={{ uri: item.logo }}
                style={styles.equipoLogo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.equipoName} numberOfLines={2}>
              {item.nombre_equipo}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f8fc',
  },
  screenContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 26,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  equipoCard: {
    width: '48.5%',
    aspectRatio: 1,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d9e5f0',
    paddingHorizontal: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  favoritoFloat: {
    position: 'absolute',
    right: 8,
    top: 8,
    zIndex: 10,
  },
  logoContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  equipoLogo: {
    width: 64,
    height: 64,
  },
  equipoName: {
    width: '100%',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
    color: '#1d3850',
    minHeight: 36,
  },
  emptyState: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d9e5f0',
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  loadingState: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d9e5f0',
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#59778f',
    fontWeight: '500',
  },
  emptyStateText: {
    marginTop: 8,
    fontSize: 14,
    color: '#59778f',
    fontWeight: '500',
  },
});
