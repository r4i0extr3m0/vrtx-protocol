import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/src/hooks';
import { radius, typography } from '@/src/theme';

interface BadgeMetalProps {
  label: string;
  variant?: 'primary' | 'success' | 'error' | 'warning' | 'metal';
  icon?: React.ReactNode;
  style?: any;
}

/**
 * BadgeMetal - Minimalist tech status badge.
 * No neon. Focus on subdued colors and clean typography.
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
        bg: [colors.primary, colors.primaryStrong], 
        text: '#FFFFFF', 
        border: 'transparent' 
      };
      case 'success': return { 
        bg: ['rgba(16, 185, 129, 0.15)', 'rgba(16, 185, 129, 0.05)'], 
        text: colors.success, 
        border: 'rgba(16, 185, 129, 0.2)' 
      };
      case 'error': return { 
        bg: ['rgba(239, 68, 68, 0.15)', 'rgba(239, 68, 68, 0.05)'], 
        text: colors.error, 
        border: 'rgba(239, 68, 68, 0.2)' 
      };
      case 'warning': return { 
        bg: ['rgba(245, 158, 11, 0.15)', 'rgba(245, 158, 11, 0.05)'], 
        text: colors.warning, 
        border: 'rgba(245, 158, 11, 0.2)' 
      };
      default: return { 
        bg: [colors.surfaceAlt, colors.surface], 
        text: colors.muted, 
        border: colors.borderStrong 
      };
    }
  };

  const config = getColors();

  return (
    <View style={[styles.container, { borderColor: config.border }, style]}>
      <LinearGradient
        colors={config.bg as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: radius.xs }]}
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
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.xs,
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
    fontWeight: '800',
    letterSpacing: 1,
  },
});
