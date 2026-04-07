import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useTheme } from '@/src/hooks';
import { spacing, radius } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppButton } from '@/src/components/AppButton';
import { usePremiumStore } from '@/src/store/premiumStore';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Purchases from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { env } from '@/src/constants/env';
import { useAuthStore } from '@/src/store/authStore';

export function PremiumScreen() {
  const { colors } = useTheme();
  const { refreshAIUsage } = usePremiumStore();
  const userId = useAuthStore((s) => s.user?.id ?? null);

  const features = [
    { icon: 'analytics', title: 'Relatorios melhores', desc: 'Acompanhe volume, progresso e consistencia com mais clareza.' },
    { icon: 'cloud-upload', title: 'Backup na nuvem', desc: 'Mantenha seus dados protegidos e acessiveis.' },
    { icon: 'infinite', title: 'Treinos ilimitados', desc: 'Crie quantos treinos personalizados quiser.' },
    { icon: 'star', title: 'Experiencia limpa', desc: 'Mais foco no treino e menos distracoes.' },
  ];

  const handlePurchase = async () => {
    try {
      const result = await RevenueCatUI.presentPaywallIfNeeded({
        requiredEntitlementIdentifier: env.revenueCatEntitlementId,
      });

      if (result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        if (userId) {
          await refreshAIUsage(userId);
        }
        Alert.alert('Tudo certo', 'Seu Premium foi ativado e os recursos extras ja estao disponiveis.');
        router.back();
      }
    } catch {
      Alert.alert('Nao foi possivel continuar', 'Nao conseguimos abrir a tela de assinatura agora. Tente novamente em instantes.');
    }
  };

  const handleRestore = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await Purchases.restorePurchases();
      if (userId) {
        await refreshAIUsage(userId);
      }
      Alert.alert('Compras restauradas', 'Se houver uma assinatura vinculada a esta conta, ela ja foi restaurada.');
    } catch {
      Alert.alert('Nao foi possivel restaurar', 'Tente novamente daqui a pouco.');
    }
  };

  return (
    <ScreenContainer>
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={colors.primaryGradient}
          style={styles.headerGradient}
        >
          <Ionicons name="trophy" size={60} color="#fff" />
          <Text style={styles.headerTitle}>Premium</Text>
          <Text style={styles.headerSubtitle}>Mais recursos para treinar com consistencia e evoluir com mais clareza.</Text>
        </LinearGradient>

        <View style={styles.content}>
          <View style={styles.featuresGrid}>
            {features.map((f, i) => (
              <View key={i} style={[styles.featureItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name={f.icon as any} size={24} color={colors.primary} />
                <Text style={[styles.featureTitle, { color: colors.foreground }]}>{f.title}</Text>
                <Text style={[styles.featureDesc, { color: colors.muted }]}>{f.desc}</Text>
              </View>
            ))}
          </View>

          <View style={styles.plansContainer}>
            <Pressable 
              style={[styles.planCard, { backgroundColor: colors.surface, borderColor: colors.primary, borderWidth: 2 }]}
              onPress={() => { void handlePurchase(); }}
            >
              <View style={styles.bestValueBadge}>
                <Text style={styles.bestValueText}>Mais completo</Text>
              </View>
              <View>
                <Text style={[styles.planName, { color: colors.foreground }]}>Premium</Text>
                <Text style={[styles.planPrice, { color: colors.primary }]}>Coach com IA e recursos extras</Text>
                <Text style={[styles.planSavings, { color: colors.muted }]}>Valores e opcoes aparecem na tela segura de assinatura.</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={colors.muted} />
            </Pressable>
          </View>

          <AppButton 
            label="Restaurar compras" 
            onPress={() => { void handleRestore(); }}
            variant="ghost"
            style={{ marginTop: spacing.md }}
          />
          
          <Text style={[styles.terms, { color: colors.muted }]}>
            Ao assinar, a renovacao pode acontecer automaticamente ate que voce cancele pelas configuracoes da loja. Os detalhes finais aparecem na etapa de compra.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    padding: spacing.xxl,
    alignItems: 'center',
    borderBottomLeftRadius: radius.xxl,
    borderBottomRightRadius: radius.xxl,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    marginTop: spacing.md,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 22,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.xl,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  featureItem: {
    width: '47%',
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: 8,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  featureDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
  plansContainer: {
    gap: spacing.md,
  },
  planCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    position: 'relative',
  },
  planName: {
    fontSize: 18,
    fontWeight: '800',
  },
  planPrice: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  planSavings: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
    marginTop: 2,
  },
  bestValueBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: '#FFD700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  bestValueText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#000',
  },
  terms: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 17,
    marginTop: spacing.md,
  },
});
