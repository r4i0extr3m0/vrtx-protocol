import React from 'react';
import { StyleSheet, View, Text, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/src/hooks';
import { radius, spacing, typography } from '@/src/theme';

interface BadgeMetalProps {
  label: string;
  variant?: 'primary' | 'success' | 'error' | 'warning' | 'metal';
  icon?: React.ReactNode;
  style?: any;
}

/**
 * BadgeMetal - High-end status badge with brushed metal and glass effect.
 * Features: Multi-layer gradient, Border highlight, Monospace text.
 */
export function BadgeMetal({ 
  label, 
  variant = 'metal', 
  icon, 
  style 
}: BadgeMetalProps) {
  const { colors } = useTheme();

  const getColors = () => {
    switch (variant) {
      case 'primary': return { 
        bg: ['#1A1A1A', '#0096FF'], 
        text: '#FFF', 
        border: 'rgba(0, 150, 255, 0.5)' 
      };
      case 'success': return { 
        bg: ['#1A1A1A', '#10B981'], 
        text: '#FFF', 
        border: 'rgba(16, 185, 129, 0.5)' 
      };
      case 'error': return { 
        bg: ['#1A1A1A', '#EF4444'], 
        text: '#FFF', 
        border: 'rgba(239, 68, 68, 0.5)' 
      };
      case 'warning': return { 
        bg: ['#1A1A1A', '#F59E0B'], 
        text: '#FFF', 
        border: 'rgba(245, 158, 11, 0.5)' 
      };
      default: return { 
        bg: ['#2C2C2C', '#1A1A1A', '#0D0D0D'], 
        text: colors.muted, 
        border: 'rgba(255, 255, 255, 0.12)' 
      };
    }
  };

  const config = getColors();

  return (
    <View style={[styles.container, { borderColor: config.border }, style]}>
      <LinearGradient
        colors={config.bg}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: radius.md }]}
      />
      
      {/* Glossy Overlay */}
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: radius.md }]}
      />

      <View style={styles.content}>
        {icon && <View style={styles.iconWrapper}>{icon}</View>}
        <Text style={[
          styles.label, 
          { 
            color: config.text, 
            fontFamily: typography.family.mono,
            fontSize: 9,
          }
        ]}>
          {label.toUpperCase()}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    marginRight: 4,
  },
  label: {
    fontWeight: '900',
    letterSpacing: 1,
  },
});
