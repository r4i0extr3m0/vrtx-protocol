import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useTheme } from '@/src/hooks';
import { spacing, typography, radius } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppButton } from '@/src/components/AppButton';
import { usePremiumStore } from '@/src/store/premiumStore';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

export function PremiumScreen() {
  const { colors } = useTheme();
  const { isPremium, setPremium } = usePremiumStore();

  const features = [
    { icon: 'analytics', title: 'Relatórios Avançados', desc: 'Gráficos detalhados de volume e progresso.' },
    { icon: 'cloud-upload', title: 'Backup em Nuvem', desc: 'Nunca perca seus dados de treino.' },
    { icon: 'infinite', title: 'Templates Ilimitados', desc: 'Crie quantos templates de treino desejar.' },
    { icon: 'star', title: 'Sem Anúncios', desc: 'Foco total no seu treino, sem interrupções.' },
  ];

  const handlePurchase = (plan: 'monthly' | 'yearly' | 'lifetime') => {
    Alert.alert(
      'Confirmar Compra',
      `Deseja assinar o plano ${plan === 'monthly' ? 'Mensal' : plan === 'yearly' ? 'Anual' : 'Vitalício'}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Confirmar', 
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setPremium(true, plan);
            Alert.alert('Sucesso!', 'Você agora é um membro Premium do CoreIronTrack!');
            router.back();
          } 
        }
      ]
    );
  };

  return (
    <ScreenContainer>
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={colors.primaryGradient}
          style={styles.headerGradient}
        >
          <Ionicons name="trophy" size={60} color="#fff" />
          <Text style={styles.headerTitle}>CoreIronTrack Premium</Text>
          <Text style={styles.headerSubtitle}>Desbloqueie todo o seu potencial</Text>
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
              style={[styles.planCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => handlePurchase('monthly')}
            >
              <View>
                <Text style={[styles.planName, { color: colors.foreground }]}>Mensal</Text>
                <Text style={[styles.planPrice, { color: colors.primary }]}>R$ 19,90/mês</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={colors.muted} />
            </Pressable>

            <Pressable 
              style={[styles.planCard, { backgroundColor: colors.surface, borderColor: colors.primary, borderWidth: 2 }]}
              onPress={() => handlePurchase('yearly')}
            >
              <View style={styles.bestValueBadge}>
                <Text style={styles.bestValueText}>MELHOR VALOR</Text>
              </View>
              <View>
                <Text style={[styles.planName, { color: colors.foreground }]}>Anual</Text>
                <Text style={[styles.planPrice, { color: colors.primary }]}>R$ 149,90/ano</Text>
                <Text style={[styles.planSavings, { color: colors.success }]}>Economize 37%</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={colors.muted} />
            </Pressable>

            <Pressable 
              style={[styles.planCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => handlePurchase('lifetime')}
            >
              <View>
                <Text style={[styles.planName, { color: colors.foreground }]}>Vitalício</Text>
                <Text style={[styles.planPrice, { color: colors.primary }]}>R$ 299,90</Text>
                <Text style={[styles.planSavings, { color: colors.muted }]}>Pagamento único</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={colors.muted} />
            </Pressable>
          </View>

          <AppButton 
            label="Restaurar Compras" 
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); Alert.alert("Restaurar", "Buscando compras anteriores..."); }}
            variant="ghost"
            style={{ marginTop: spacing.md }}
          />
          
          <Text style={[styles.terms, { color: colors.muted }]}>
            Ao assinar, você concorda com nossos Termos de Uso e Política de Privacidade. A assinatura é renovada automaticamente, a menos que seja cancelada 24h antes do término do período atual.
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
    fontWeight: '600',
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
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
    marginTop: spacing.md,
  },
});
