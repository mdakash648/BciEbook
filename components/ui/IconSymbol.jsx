import React from 'react';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
};

export function IconSymbol({
  name,
  size = 24,
  color = '#000',
  style,
}) {
  const mapped = MAPPING[name] || 'help-outline';
  return <MaterialIcons color={color} size={size} name={mapped} style={style} />;
}
