import React from 'react';
import { StyleSheet, View, SafeAreaView, StatusBar } from 'react-native';
import { useTheme } from '@/src/hooks';

interface ScreenWrapperProps {
  children: React.ReactNode;
  withSafeArea?: boolean;
  withPadding?: boolean;
  style?: any;
}

/**
 * ScreenWrapper - Clean dark background.
 * Minimalist Sci-Fi. No neon dots. Focus on solid dark surface.
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
});
