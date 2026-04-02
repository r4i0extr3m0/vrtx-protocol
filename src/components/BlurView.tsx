import React from 'react';
import { StyleSheet, View } from 'react-native';

interface BlurViewProps {
  children: React.ReactNode;
  intensity?: number;
}

export function BlurView({ children }: BlurViewProps) {
  return (
    <View style={[styles.container, { backgroundColor: 'rgba(0,0,0,0.3)' }]}>
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
