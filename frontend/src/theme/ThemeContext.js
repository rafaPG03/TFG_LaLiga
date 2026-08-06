import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, DefaultTheme } from '@react-navigation/native';
import { setRuntimeDarkMode } from './themeRuntime';

const THEME_KEY = '@tfg/dark-mode';

export const lightColors = {
  background: '#f4f8fc',
  surface: '#ffffff',
  surfaceAlt: '#eaf3fb',
  card: '#ffffff',
  input: '#f5f5f5',
  text: '#103a5d',
  textStrong: '#12233f',
  textScattered: '#1f4f7a',
  textMuted: '#59778f',
  border: '#d9e5f0',
  primary: '#1f6fa7',
  primaryBright: '#2e86de',
  overlay: 'rgba(16, 40, 64, 0.35)',
  success: '#2f855a',
  warning: '#b7791f',
  danger: '#c53030',
  shadow: '#000000',
};

export const darkColors = {
  background: '#0b1c2d',
  surface: '#14283b',
  surfaceAlt: '#1c3850',
  card: '#14283b',
  input: '#183047',
  text: '#e4f2ff',
  textStrong: '#f3f8fc',
  textMuted: '#9db8cc',
  border: '#315069',
  primary: '#58aee8',
  primaryBright: '#58aaf5',
  overlay: 'rgba(2, 10, 18, 0.72)',
  success: '#68d391',
  warning: '#f6c84f',
  danger: '#fc8181',
  shadow: '#000000',
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);
  const [isThemeReady, setIsThemeReady] = useState(false);

  useEffect(() => {
    let active = true;

    AsyncStorage.getItem(THEME_KEY)
      .then((storedValue) => {
        if (!active) return;
        const enabled = storedValue === 'true';
        setRuntimeDarkMode(enabled);
        setIsDark(enabled);
      })
      .catch(() => {
        if (active) setRuntimeDarkMode(false);
      })
      .finally(() => {
        if (active) setIsThemeReady(true);
      });

    return () => {
      active = false;
    };
  }, []);

  const toggleTheme = useCallback(async () => {
    const nextValue = !isDark;
    setRuntimeDarkMode(nextValue);
    setIsDark(nextValue);
    try {
      await AsyncStorage.setItem(THEME_KEY, String(nextValue));
    } catch (error) {
      // The visual change remains active for this session if storage is unavailable.
    }
  }, [isDark]);

  const colors = isDark ? darkColors : lightColors;
  const navigationTheme = useMemo(() => {
    const base = isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      dark: isDark,
      colors: {
        ...base.colors,
        primary: colors.primary,
        background: colors.background,
        card: colors.surface,
        text: colors.text,
        border: colors.border,
        notification: colors.danger,
      },
    };
  }, [colors, isDark]);

  const value = useMemo(
    () => ({ isDark, colors, navigationTheme, toggleTheme, isThemeReady }),
    [isDark, colors, navigationTheme, toggleTheme, isThemeReady]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme debe usarse dentro de ThemeProvider');
  return context;
}
