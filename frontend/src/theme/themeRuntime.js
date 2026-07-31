import { StyleSheet } from 'react-native';

let darkModeEnabled = false;

const DARK_BACKGROUNDS = {
  '#ffffff': '#14283b',
  '#fff': '#14283b',
  '#fffdf7': '#182c3f',
  '#fffaf0': '#182c3f',
  '#fff7e1': '#223143',
  '#fff5d8': '#263446',
  '#f9fcff': '#102235',
  '#f8fbfe': '#102235',
  '#f4f8fc': '#0b1c2d',
  '#f3f8fd': '#0b1c2d',
  '#f5f5f5': '#183047',
  '#fafafa': '#102235',
  '#eef5fb': '#152b40',
  '#edf3f8': '#193248',
  '#edf3f9': '#193248',
  '#eef3f7': '#193248',
  '#eef3f8': '#193248',
  '#ecf2f8': '#193248',
  '#f0f5fa': '#152b40',
  '#f8fbff': '#102235',
  '#eef6ff': '#173047',
  '#e9f1f8': '#193248',
  '#e8edf2': '#1a3044',
  '#e7eef6': '#1a3248',
  '#e4ebf2': '#1b344a',
  '#dbe6f0': '#315069',
  '#d2e0ec': '#315069',
  '#c7d7e6': '#35566f',
  '#c5d8ea': '#35566f',
  '#eaf3fb': '#1c3850',
  '#e6f0f8': '#1b354b',
  '#e3eef8': '#1c3850',
  '#dcebf8': '#21445f',
  '#d9e5f0': '#315069',
  '#d8e5f1': '#315069',
  '#d7e5f2': '#315069',
  '#cfe0ee': '#35566f',
  '#e0e0e0': '#355269',
  '#000000': '#081522',
  '#000': '#081522',
  '#12233f': '#183b57',
  '#103a5d': '#1c5278',
  '#0f4f7e': '#1f6fa7',
  '#1f4f7a': '#246b9a',
  '#0f2743': '#142f47',
  '#17304b': '#1b3b56',
  '#173a5d': '#1d547b',
};

const DARK_FOREGROUNDS = {
  '#000000': '#edf6ff',
  '#000': '#edf6ff',
  '#333333': '#edf6ff',
  '#333': '#edf6ff',
  '#444444': '#d8e8f5',
  '#444': '#d8e8f5',
  '#12233f': '#eef7ff',
  '#103a5d': '#e4f2ff',
  '#0f4f7e': '#72bdf2',
  '#133d60': '#e4f2ff',
  '#153d5d': '#dceeff',
  '#1d3850': '#dceeff',
  '#102f4a': '#e4f2ff',
  '#35566f': '#c0d7e8',
  '#4a4a4a': '#cfdfec',
  '#555555': '#c0d4e3',
  '#555': '#c0d4e3',
  '#666666': '#a9c2d5',
  '#666': '#a9c2d5',
  '#68859d': '#9db8cc',
  '#6f8096': '#93adc1',
  '#5f7f9b': '#9dbbd1',
  '#59778f': '#9db8cc',
  '#57758f': '#9db8cc',
  '#8aa0b5': '#7899b2',
  '#a0a0a0': '#7899b2',
  '#2e86de': '#58aaf5',
  '#1f6fa7': '#58aee8',
  '#1f4f7a': '#8bc5ed',
  '#0f2743': '#e4f2ff',
  '#173a5d': '#dceeff',
  '#1e3f66': '#c6def0',
  '#1f3851': '#dceeff',
  '#4f6782': '#aac3d7',
  '#55708d': '#a8c3d8',
  '#6b86a1': '#9db8cc',
  '#6c8299': '#9db8cc',
  '#6d839a': '#9db8cc',
  '#5a7189': '#a4bed2',
};

const normalizeHex = (color) => {
  if (typeof color !== 'string' || !color.startsWith('#')) return color;
  const value = color.toLowerCase();
  if (value.length === 4) {
    return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`;
  }
  return value;
};

const getColorRole = (propertyName = '') => {
  const property = String(propertyName).toLowerCase();
  if (property.includes('shadow')) return 'shadow';
  if (property.includes('background') || property === 'fill') return 'background';
  if (property.includes('border') || property.includes('grid')) return 'border';
  return 'foreground';
};

const fallbackDarkColor = (normalized, role) => {
  if (!/^#[0-9a-f]{6}$/.test(normalized)) return null;
  const red = Number.parseInt(normalized.slice(1, 3), 16);
  const green = Number.parseInt(normalized.slice(3, 5), 16);
  const blue = Number.parseInt(normalized.slice(5, 7), 16);
  const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const saturation = max === 0 ? 0 : (max - min) / max;

  if (role === 'border' && luminance > 0.62) return '#315069';

  if (role === 'background' && luminance > 0.72) {
    if (saturation > 0.12 && red > blue * 1.35 && green > blue * 1.25) return '#49391d';
    if (saturation > 0.12 && red > green * 1.08) return '#49252b';
    if (saturation > 0.12 && green > red * 1.06) return '#183c31';
    if (saturation > 0.12 && blue > red * 1.06) return '#18364d';
    return luminance > 0.9 ? '#14283b' : '#1a3248';
  }

  if (role === 'foreground' && luminance < 0.52) {
    if (saturation < 0.18) return luminance < 0.3 ? '#e4f2ff' : '#a9c2d5';
    const mix = (channel) => Math.round(channel + (255 - channel) * 0.48);
    return `#${[mix(red), mix(green), mix(blue)]
      .map((channel) => channel.toString(16).padStart(2, '0'))
      .join('')}`;
  }

  return null;
};

export const resolveThemeColor = (color, propertyName) => {
  if (!darkModeEnabled || typeof color !== 'string') return color;
  const normalized = normalizeHex(color);
  const role = getColorRole(propertyName);

  if (role === 'shadow') return color;
  if (role === 'background') {
    return DARK_BACKGROUNDS[normalized] || fallbackDarkColor(normalized, role) || color;
  }
  if (role === 'border') {
    return (
      DARK_BACKGROUNDS[normalized] ||
      DARK_FOREGROUNDS[normalized] ||
      fallbackDarkColor(normalized, role) ||
      color
    );
  }
  return DARK_FOREGROUNDS[normalized] || fallbackDarkColor(normalized, role) || color;
};

const transformThemeValue = (value, propertyName) => {
  if (typeof value === 'string') return resolveThemeColor(value, propertyName);
  if (Array.isArray(value)) return value.map((item) => transformThemeValue(item, propertyName));
  if (!value || typeof value !== 'object') return value;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return value;

  return Object.fromEntries(
    Object.entries(value).map(([key, nestedValue]) => [key, transformThemeValue(nestedValue, key)])
  );
};

globalThis.__TFG_THEME_COLOR__ = resolveThemeColor;
globalThis.__TFG_THEME_VALUE__ = transformThemeValue;

const originalCreate = StyleSheet.create.bind(StyleSheet);

// Existing screens contain a large established StyleSheet palette. Wrapping create
// keeps those styles reactive while they are progressively expressed as tokens.
StyleSheet.create = (definitions) => {
  const lightStyles = originalCreate(definitions);
  let darkStyles;

  return new Proxy(lightStyles, {
    get(target, property, receiver) {
      if (!darkModeEnabled || typeof property === 'symbol') {
        return Reflect.get(target, property, receiver);
      }

      if (!darkStyles) {
        darkStyles = originalCreate(transformThemeValue(definitions));
      }
      return Reflect.get(darkStyles, property, receiver);
    },
  });
};

export const setRuntimeDarkMode = (enabled) => {
  darkModeEnabled = Boolean(enabled);
};
