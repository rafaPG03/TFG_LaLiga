import React, { useMemo } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomHeader from '../components/header';
import { useTheme } from '../theme/ThemeContext';

export default function AjustesScreen({ navigation }) {
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <CustomHeader title="Ajustes" onMenuPress={() => navigation.openDrawer()} />
      <ScrollView contentContainerStyle={styles.screenContent}>
        <Text style={styles.sectionTitle}>Apariencia</Text>

        <View style={styles.settingCard}>
          <View style={styles.iconWrap}>
            <Ionicons name={isDark ? 'moon' : 'moon-outline'} size={22} color={colors.primary} />
          </View>
          <View style={styles.settingCopy}>
            <Text style={styles.settingTitle}>Modo oscuro</Text>
            <Text style={styles.settingDescription}>
              Usa una paleta azul marino con menos luminosidad en toda la aplicación.
            </Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={isDark ? colors.textStrong : colors.surface}
            ios_backgroundColor={colors.border}
            accessibilityRole="switch"
            accessibilityLabel="Modo oscuro"
            accessibilityHint="Activa o desactiva el tema oscuro de la aplicación"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    screenContent: {
      paddingHorizontal: 18,
      paddingTop: 22,
      paddingBottom: 26,
    },
    title: {
      color: colors.textStrong,
      fontSize: 26,
      fontWeight: '800',
      marginBottom: 24,
    },
    sectionTitle: {
      color: colors.textMuted,
      fontSize: 13,
      fontWeight: '800',
      letterSpacing: 0.8,
      marginBottom: 10,
      textTransform: 'uppercase',
    },
    settingCard: {
      alignItems: 'center',
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: 16,
      borderWidth: 1,
      flexDirection: 'row',
      padding: 16,
    },
    iconWrap: {
      alignItems: 'center',
      backgroundColor: colors.surfaceAlt,
      borderRadius: 21,
      height: 42,
      justifyContent: 'center',
      width: 42,
    },
    settingCopy: {
      flex: 1,
      marginHorizontal: 13,
    },
    settingTitle: {
      color: colors.textStrong,
      fontSize: 16,
      fontWeight: '700',
    },
    settingDescription: {
      color: colors.textMuted,
      fontSize: 13,
      lineHeight: 18,
      marginTop: 4,
    },
  });
