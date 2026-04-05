import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

interface BlurViewProps {
  children?: React.ReactNode;
  intensity?: number;
  tint?: 'dark' | 'light' | 'default' | string;
  style?: StyleProp<ViewStyle>;
}

export function BlurView({ children, intensity = 20, style }: BlurViewProps) {
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: `rgba(0,0,0,${Math.min(Math.max(intensity / 100, 0.08), 0.35)})` },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
