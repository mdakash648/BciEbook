import React from 'react';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { StyleSheet, View } from 'react-native';

export function IconSymbol({
  name,
  size = 24,
  color = '#000',
  style,
  weight = 'regular',
}) {
  // Basic wrapper to allow drop-in replacement for expo-symbols SymbolView
  return (
    <View style={[{ width: size, height: size }, style]}>
      <MaterialIcons name={name} size={size} color={color} style={StyleSheet.absoluteFill} />
    </View>
  );
}
