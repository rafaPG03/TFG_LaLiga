import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function CustomHeader({ title, onMenuPress, onSearchPress }) {
  return (
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
        onPress={onSearchPress}
        activeOpacity={0.7}
      >
        <Ionicons name="search" size={24} color="#103a5d" />
      </TouchableOpacity>
    </View>
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
});