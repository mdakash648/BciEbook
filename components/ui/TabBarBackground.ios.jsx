import React from 'react';
// Temporarily disabled BlurView due to native module issues
// import { BlurView } from '@react-native-community/blur';
import { StyleSheet, View } from 'react-native';

export default function BlurTabBarBackground() {
  return (
    <View
      style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255, 255, 255, 0.8)' }]}
    />
  );
}

export function useBottomTabOverflow() {
  return 0;
}
