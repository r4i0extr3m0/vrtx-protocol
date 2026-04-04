import React, { type ReactNode } from 'react';
import { Stack } from 'expo-router';
import { Platform } from 'react-native';

interface AnimatedStackProps {
  children?: ReactNode;
}

export function AnimatedStack({ children }: AnimatedStackProps) {
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
    >
      {children}
    </Stack>
  );
}
