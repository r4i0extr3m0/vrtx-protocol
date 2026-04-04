import React from 'react';
import { StyleSheet, View, SafeAreaView, Platform, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Rect, Defs, Pattern, Circle } from 'react-native-svg';
import { useTheme } from '@/src/hooks';

interface ScreenWrapperProps {
  children: React.ReactNode;
  withSafeArea?: boolean;
  withPadding?: boolean;
  style?: any;
}

/**
 * ScreenWrapper - The base for all "Command Center" screens.
 * Features: Deep graphite background, Blueprint Grid (dots), Noise Overlay.
 */
export function ScreenWrapper({ 
  children, 
  withSafeArea = true, 
  withPadding = true,
  style 
}: ScreenWrapperProps) {
  const { colors } = useTheme();

  const Content = (
    <View style={[
      styles.content, 
      withPadding && styles.padding,
      style
    ]}>
      {children}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      
      {/* 1. Base Gradient */}
      <LinearGradient
        colors={['#0D0D0D', '#050505']}
        style={StyleSheet.absoluteFill}
      />

      {/* 2. Blueprint Grid (Dots) */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width="100%" height="100%" opacity={0.15}>
          <Defs>
            <Pattern
              id="grid"
              width="24"
              height="24"
              patternUnits="userSpaceOnUse"
            >
              <Circle cx="1" cy="1" r="0.8" fill="#0096FF" />
            </Pattern>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#grid)" />
        </Svg>
      </View>

      {/* 3. Noise Overlay (Subtle via SVG) */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
         <Svg width="100%" height="100%" opacity={0.03}>
           <Rect width="100%" height="100%" fill="black" filter="url(#noise)" />
           {/* Note: Native SVG filter support is limited, using a subtle repeating pattern instead */}
           <Defs>
             <Pattern id="noise" width="4" height="4" patternUnits="userSpaceOnUse">
               <Rect width="1" height="1" fill="white" x="0" y="0" />
               <Rect width="1" height="1" fill="white" x="2" y="2" />
             </Pattern>
           </Defs>
           <Rect width="100%" height="100%" fill="url(#noise)" />
         </Svg>
      </View>

      {/* 4. Radial Glow (Top Left) */}
      <View style={[styles.radialGlow, { top: -100, left: -100 }]} pointerEvents="none" />

      {withSafeArea ? (
        <SafeAreaView style={styles.safeArea}>
          {Content}
        </SafeAreaView>
      ) : Content}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  padding: {
    paddingHorizontal: 20,
  },
  radialGlow: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(0, 150, 255, 0.05)',
    // Blur would be better here but needs a dedicated component or library
  },
});
