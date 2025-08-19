import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import { BlurView } from '@react-native-community/blur';

const TAB_ICONS = {
  Home: { icon: 'home-outline', activeIcon: 'home', label: 'Home' },
  Favorites: { icon: 'heart-outline', activeIcon: 'heart', label: 'Favorites' },
  Settings: { icon: 'settings-outline', activeIcon: 'settings', label: 'Settings' },
};

const INDICATOR_SIZE = 48;
const ICON_SIZE = 25;
const ICON_SIZE_ACTIVE = 28;
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
    <View style={styles.container}> 
      <View style={[styles.blurWrapper, { 
        width: barWidth,
        borderRadius: BAR_RADIUS,
        overflow: 'hidden'
      }]}>
        <BlurView
          style={styles.blurContainer}
          blurType={isDarkMode ? "dark" : "light"}
          blurAmount={20}
          reducedTransparencyFallbackColor={isDarkMode ? "#000000" : "#FFFFFF"}
          fallbackColor={isDarkMode ? "rgba(0, 0, 0, 0.8)" : "rgba(255, 255, 255, 0.8)"}
        >
          <View style={[styles.tabBarWrapper, { 
            width: '100%', 
            height: '100%',
            backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.15)',
            borderWidth: 1,
            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'
          }]}>        
            <View style={styles.inner}>        
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
                        <Ionicons name={iconName} size={ICON_SIZE} color={isDarkMode ? '#FFFFFF' : '#000000'} style={styles.inactiveIcon} />
                        <Text style={[styles.tabLabel, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>{iconConfig.label || ''}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </BlurView>
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
  blurWrapper: {
    height: BAR_HEIGHT,
    borderRadius: BAR_RADIUS,
    overflow: 'hidden',
  },
  blurContainer: {
    height: BAR_HEIGHT,
    justifyContent: 'center',
  },
  tabBarWrapper: {
    height: BAR_HEIGHT,
    justifyContent: 'center',
    borderRadius: BAR_RADIUS,
  },
  inner: {
    flexDirection: 'row',
    height: '100%',
    paddingHorizontal: HORIZONTAL_PADDING,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    borderRadius: BAR_RADIUS,
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
