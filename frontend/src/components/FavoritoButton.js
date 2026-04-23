import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFavoritos } from '../context/FavoritosContext';

export default function FavoritoButton({ id, tipo, size = 22, style }) {
  const scale = useRef(new Animated.Value(1)).current;
  const { isFavorite, toggleFav } = useFavoritos();

  const favorito = isFavorite(id, tipo);

  const animatePress = () => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.88,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        speed: 16,
        bounciness: 9,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const onPress = async () => {
    animatePress();
    await toggleFav(id, tipo);
  };

  return (
    <Animated.View style={[styles.wrapper, style, { transform: [{ scale }] }]}>
      <Pressable style={styles.button} onPress={onPress}>
        <Ionicons
          name={favorito ? 'heart' : 'heart-outline'}
          size={size}
          color={favorito ? '#f24d6e' : '#3d6f97'}
        />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 999,
    shadowColor: '#0e2f4f',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d7e5f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
