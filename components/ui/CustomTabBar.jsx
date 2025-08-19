import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
// Temporarily disabled BlurView due to native module issues
// import { BlurView } from '@react-native-community/blur';

const TAB_ICONS = {
  Home: { icon: 'home-outline', activeIcon: 'home', label: 'Home' },
  Favorites: { icon: 'heart-outline', activeIcon: 'heart', label: 'Favorites' },
  Settings: { icon: 'settings-outline', activeIcon: 'settings', label: 'Settings' },
};

const INDICATOR_SIZE = 48;
const ICON_SIZE = 25;
const ICON_SIZE_ACTIVE = 30;
const BAR_HEIGHT = 68;
const BAR_RADIUS = BAR_HEIGHT / 2; // 50%
const HORIZONTAL_PADDING = 32;

export default function CustomTabBar({ state, descriptors, navigation }) {
  const { theme, isDarkMode } = useTheme();
  const { width } = Dimensions.get('window');
  const barWidth = width * 0.85;

  // Debug theme state
  console.log('CustomTabBar - isDarkMode:', isDarkMode, 'theme.background:', theme.background);

  const visibleRoutes = state.routes.filter(
    (route) => route.name === 'Home' || route.name === 'Favorites' || route.name === 'Settings'
  );

  const tabCount = visibleRoutes.length;
  const contentWidth = barWidth - HORIZONTAL_PADDING * 2;
  const tabContentWidth = contentWidth / tabCount;

  const indicatorAnim = useRef(new Animated.Value(0)).current;

  const currentRouteName = state.routes[state.index]?.name;
  const visibleNames = visibleRoutes.map((r) => r.name);
  const effectiveActiveName = visibleNames.includes(currentRouteName) ? currentRouteName : 'Settings';
  const focusedVisibleIndex = Math.max(0, visibleRoutes.findIndex((r) => r.name === effectiveActiveName));

  useEffect(() => {
    const targetPosition = HORIZONTAL_PADDING + focusedVisibleIndex * tabContentWidth + tabContentWidth / 2 - INDICATOR_SIZE / 2;
    console.log('Indicator positioning:', {
      focusedVisibleIndex,
      tabContentWidth,
      targetPosition,
      tabName: effectiveActiveName
    });
    
    Animated.spring(indicatorAnim, {
      toValue: targetPosition,
      useNativeDriver: false,
      friction: 7,
      tension: 80,
    }).start();
  }, [focusedVisibleIndex, tabContentWidth, HORIZONTAL_PADDING, INDICATOR_SIZE]);

  return (
    <View style={[styles.container, { borderRadius: BAR_RADIUS }]}> 
      <View style={[styles.tabBarWrapper, { 
        width: barWidth, 
        borderRadius: BAR_RADIUS,
        backgroundColor: isDarkMode ? '#000000' : '#FFFFFF',
        borderWidth: isDarkMode ? 2 : 0,
        borderColor: isDarkMode ? '#444444' : 'transparent'
      }]}>        
        <View style={[styles.inner, { 
          borderRadius: BAR_RADIUS,
          backgroundColor: isDarkMode ? '#000000' : '#FFFFFF'
        }]}>        
          <Animated.View
            style={[
              styles.indicator,
              {
                left: indicatorAnim,
                backgroundColor: theme.primary,
                shadowColor: theme.primary,
              },
            ]}
          />
          {visibleRoutes.map((route) => {
            const { options } = descriptors[route.key];
            const isFocused = route.name === effectiveActiveName;
            const iconConfig = TAB_ICONS[route.name];
            if (!iconConfig) return <View key={route.key} />;
            const iconName = isFocused ? iconConfig.activeIcon : iconConfig.icon;

            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                onPress={() => navigation.navigate(route.name)}
                style={styles.tabButton}
                activeOpacity={0.7}
              >
                {isFocused ? (
                  <View style={styles.activeIconWrapper}>
                    <Ionicons name={iconName} size={ICON_SIZE_ACTIVE} color="#fff" style={styles.activeIcon} />
                  </View>
                ) : (
                  <View style={styles.inactiveIconWrapper}>
                    <Ionicons name={iconName} size={ICON_SIZE} color={isDarkMode ? '#CCCCCC' : '#666666'} style={styles.inactiveIcon} />
                    <Text style={[styles.tabLabel, { color: isDarkMode ? '#CCCCCC' : '#666666' }]}>{iconConfig.label || ''}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 24,
    alignItems: 'center',
    zIndex: 100,
  },
  tabBarWrapper: {
    height: BAR_HEIGHT,
    justifyContent: 'center',
    // Put shadow/elevation on the wrapper so the inner can clip corners cleanly
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  inner: {
    flexDirection: 'row',
    height: '100%',
    paddingHorizontal: HORIZONTAL_PADDING,
    overflow: 'hidden', // critical to enforce 50% rounded corners with BlurView
    position: 'relative',
    alignItems: 'center',
  },
  indicator: {
    position: 'absolute',
    width: INDICATOR_SIZE,
    height: INDICATOR_SIZE,
    borderRadius: INDICATOR_SIZE / 2,
    top: -INDICATOR_SIZE / 2 + BAR_HEIGHT / 2,
    zIndex: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 16,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: BAR_HEIGHT,
    zIndex: 2,
    paddingHorizontal: 4,
  },
  activeIconWrapper: {
    width: INDICATOR_SIZE,
    height: INDICATOR_SIZE,
    borderRadius: INDICATOR_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  inactiveIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  activeIcon: {
    opacity: 1,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  inactiveIcon: {
    opacity: 0.7,
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  tabLabel: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
