import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import Animated, { 
  FadeIn, 
  FadeOut, 
  FadeInUp
} from 'react-native-reanimated';
import { BlurView } from './BlurView';
import { useTheme } from '@/src/hooks';
import { spacing, radius, typography } from '@/src/theme';
import { AppIcon } from './AppIcon';
import { RestTimer } from './RestTimer';

interface FocusModeProps {
  isVisible: boolean;
  onClose: () => void;
  exerciseName: string;
  currentSet: number;
  totalSets: number;
  weight: number;
  reps: number;
}

export function FocusMode({ 
  isVisible, 
  onClose, 
  exerciseName, 
  currentSet, 
  totalSets,
  weight,
  reps
}: FocusModeProps) {
  const { colors } = useTheme();

  if (!isVisible) return null;

  return (
    <Animated.View 
      entering={FadeIn} 
      exiting={FadeOut} 
      style={StyleSheet.absoluteFill}
    >
      <BlurView intensity={40}>
        <View style={styles.container}>
          <Pressable 
            onPress={onClose} 
            style={[styles.closeBtn, { backgroundColor: colors.surfaceAlt }]}
          >
            <AppIcon name="X" size={24} color={colors.foreground} />
          </Pressable>

          <View style={styles.content}>
            <Text style={[styles.label, { color: colors.primary }]}>Modo foco ativado</Text>
            <Text style={[styles.exerciseTitle, { color: colors.foreground }]}>{exerciseName}</Text>
            
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={[styles.statValue, { color: colors.foreground }]}>{currentSet}/{totalSets}</Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>Serie</Text>
              </View>
              <View style={styles.stat}>
                <Text style={[styles.statValue, { color: colors.foreground }]}>{weight} kg</Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>Carga</Text>
              </View>
              <View style={styles.stat}>
                <Text style={[styles.statValue, { color: colors.foreground }]}>{reps}</Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>Repeticoes</Text>
              </View>
            </View>

            <View style={styles.timerWrapper}>
              <RestTimer />
            </View>
          </View>

          <Animated.View 
            entering={FadeInUp.delay(300)} 
            style={[styles.footer, { backgroundColor: colors.surface }]}
          >
            <Text style={[styles.footerText, { color: colors.muted }]}>
              Mantenha o foco. O descanso é parte do treino.
            </Text>
          </Animated.View>
        </View>
      </BlurView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: spacing.xxl,
    right: spacing.xl,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  content: {
    alignItems: 'center',
    gap: spacing.lg,
    width: '100%',
  },
  label: {
    fontFamily: typography.family.body,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  exerciseTitle: {
    fontSize: 36,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -1.5,
    marginBottom: spacing.xl,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: spacing.xxl,
  },
  stat: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
  },
  statLabel: {
    fontFamily: typography.family.body,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  timerWrapper: {
    width: '100%',
    maxWidth: 300,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
