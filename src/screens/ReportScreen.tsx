import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useTheme } from '@/src/hooks';
import { spacing, typography, radius } from '@/src/theme';

export function ReportScreen() {
  const { colors } = useTheme();

  return (
    <ScreenContainer>
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.header, { color: colors.foreground }]}>Relatórios de Progresso</Text>

        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Relatório Semanal</Text>
          <Text style={[styles.reportText, { color: colors.foreground }]}>
            Aqui você verá um resumo do seu progresso semanal, incluindo volume total, recordes pessoais e consistência nos treinos.
          </Text>
          <View style={{ height: 220, backgroundColor: colors.muted, borderRadius: radius.md, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: colors.foreground }}>Gráfico de Progresso Semanal</Text>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Relatório Mensal</Text>
          <Text style={[styles.reportText, { color: colors.foreground }]}>
            Uma visão mais ampla do seu desempenho mensal, com análises de tendências e comparação com meses anteriores.
          </Text>
          <View style={{ height: 220, backgroundColor: colors.muted, borderRadius: radius.md, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: colors.foreground }}>Gráfico de Progresso Mensal</Text>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Outras Métricas</Text>
          <Text style={[styles.reportText, { color: colors.foreground }]}>
            Em breve, mais métricas detalhadas e insights personalizados para otimizar seus resultados.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
  },
  header: {
    fontSize: typography.section,
    fontWeight: '800',
    marginBottom: spacing.lg,
  },
  section: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.body,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  reportText: {
    fontSize: typography.body,
    lineHeight: typography.body * 1.4,
    marginBottom: spacing.md,
  },
});
