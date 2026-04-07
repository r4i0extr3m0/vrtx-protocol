import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useTheme } from '@/src/hooks';
import { PRIVACY_MARKDOWN, TERMS_MARKDOWN } from '@/src/legal/legalTexts';
import { spacing, typography, radius } from '@/src/theme';
import { AppButton } from '@/src/components/AppButton';

type TabType = 'terms' | 'privacy';

export function TermsAndPrivacyScreen() {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('terms');

  return (
    <ScreenContainer>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.tabs}>
          <AppButton
            label="Termos de Uso"
            onPress={() => setActiveTab('terms')}
            variant={activeTab === 'terms' ? 'primary' : 'secondary'}
            style={styles.tab}
          />
          <AppButton
            label="Privacidade"
            onPress={() => setActiveTab('privacy')}
            variant={activeTab === 'privacy' ? 'primary' : 'secondary'}
            style={styles.tab}
          />
        </View>

        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.contentInner}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.textBox,
              {
                backgroundColor: "rgba(255,255,255,0.03)",
                borderColor: colors.border,
              },
            ]}
          >
            {(activeTab === 'terms' ? TERMS_MARKDOWN : PRIVACY_MARKDOWN).split('\n').map((line, index) => {
              if (line.startsWith('# ')) {
                return (
                  <Text key={index} style={[styles.heading, { color: colors.foreground }]}>
                    {line.replace('# ', '')}
                  </Text>
                );
              }
              if (line.startsWith('## ')) {
                return (
                  <Text key={index} style={[styles.subheading, { color: colors.foreground }]}>
                    {line.replace('## ', '')}
                  </Text>
                );
              }
              if (line.startsWith('- ')) {
                return (
                  <Text key={index} style={[styles.bullet, { color: colors.foreground }]}>
                    {line}
                  </Text>
                );
              }
              if (line.trim()) {
                return (
                  <Text key={index} style={[styles.paragraph, { color: colors.foreground }]}>
                    {line}
                  </Text>
                );
              }
              return <View key={index} style={styles.spacer} />;
            })}
          </View>
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabs: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  tab: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: spacing.lg,
  },
  textBox: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  heading: {
    fontSize: typography.title,
    fontWeight: '900',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  subheading: {
    fontSize: typography.body,
    fontWeight: '700',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  paragraph: {
    fontSize: typography.bodySm + 1,
    lineHeight: (typography.bodySm + 1) * 1.65,
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  bullet: {
    fontSize: typography.bodySm + 1,
    lineHeight: (typography.bodySm + 1) * 1.65,
    fontWeight: '500',
    marginLeft: spacing.md,
    marginBottom: spacing.sm,
  },
  spacer: {
    height: spacing.sm,
  },
});
