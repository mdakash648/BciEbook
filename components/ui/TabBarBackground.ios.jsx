import React from 'react';
import { BlurView } from '@react-native-community/blur';
import { StyleSheet } from 'react-native';

export default function BlurTabBarBackground() {
  return (
    <BlurView
      blurType="light"
      blurAmount={20}
      style={StyleSheet.absoluteFill}
      overlayColor="transparent"
    />
  );
}

export function useBottomTabOverflow() {
  return 0;
}
