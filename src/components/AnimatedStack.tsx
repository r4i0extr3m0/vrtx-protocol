import React from 'react';
import { Stack } from 'expo-router';
import { Platform } from 'react-native';

export function AnimatedStack() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: Platform.OS === 'ios' ? 'default' : 'fade_from_bottom',
        contentStyle: { backgroundColor: '#0B0D10' },
        animationDuration: 400,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        fullScreenGestureEnabled: true,
      }}
    />
  );
}
