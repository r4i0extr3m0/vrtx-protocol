import React from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView } from 'react-native';
import { useTheme } from '@/src/hooks';
import { useSettingsStore, AccentColor } from '@/src/store/settingsStore';
import { spacing, shadows } from '@/src/theme';
import { AppIcon } from './AppIcon';
import Animated, { FadeInRight } from 'react-native-reanimated';

export function ThemeSelector() {
  const { colors } = useTheme();
  const { accentColor, setAccentColor } = useSettingsStore();

  const options: { id: AccentColor; label: string; hex: string }[] = [
    { id: 'blue', label: 'Oceano', hex: colors.accents.blue },
    { id: 'purple', label: 'Galáxia', hex: colors.accents.purple },
    { id: 'orange', label: 'Fogo', hex: colors.accents.orange },
    { id: 'green', label: 'Floresta', hex: colors.accents.green },
    { id: 'pink', label: 'Vênus', hex: colors.accents.pink },
  ];

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.foreground }]}>Cor de Destaque</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.scroll}
      >
        {options.map((opt, i) => (
          <Animated.View key={opt.id} entering={FadeInRight.delay(i * 100)}>
            <Pressable 
              onPress={() => setAccentColor(opt.id)}
              style={[
                styles.option, 
                { 
                  backgroundColor: opt.hex,
                  borderColor: accentColor === opt.id ? colors.foreground : 'transparent',
                  borderWidth: 2
                },
                shadows.card
              ]}
            >
              {accentColor === opt.id && (
                <AppIcon name="Check" size={16} color="#000" strokeWidth={3} />
              )}
            </Pressable>
            <Text style={[styles.label, { color: colors.muted }]}>{opt.label}</Text>
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.md,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  scroll: {
    gap: spacing.lg,
    paddingRight: spacing.xl,
  },
  option: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 6,
  },
});
