import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TextInput } from 'react-native';
import { router } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { AppButton } from '@/src/components/AppButton';
import { useTheme } from '@/src/hooks';
import { spacing, typography, radius } from '@/src/theme';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '@/src/store/authStore';

export function ForgotPasswordScreen() {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const resetPassword = useAuthStore(state => state.resetPassword);

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Erro', 'Por favor, insira seu e-mail.');
      return;
    }

    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const result = await resetPassword(email.trim());
      
      if (result.success) {
        setSent(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          'E-mail Enviado',
          'Verifique seu e-mail para o link de redefinição de senha.'
        );
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erro', error.message || 'Não foi possível enviar o e-mail de recuperação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <ScrollView 
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>Recuperar Senha</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Insira seu e-mail para receber um link de redefinição de senha.
          </Text>
        </View>

        {sent ? (
          <View style={[styles.successBox, { backgroundColor: colors.success + '20', borderColor: colors.success }]}>
            <Text style={[styles.successText, { color: colors.success }]}>
              ✓ E-mail de recuperação enviado com sucesso!
            </Text>
            <Text style={[styles.successDesc, { color: colors.muted }]}>
              Verifique sua caixa de entrada e clique no link para redefinir sua senha.
            </Text>
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={[styles.label, { color: colors.foreground }]}>E-mail</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
              placeholder="seu@email.com"
              placeholderTextColor={colors.muted}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
              value={email}
              onChangeText={setEmail}
            />
          </View>
        )}

        <View style={styles.actions}>
          {sent ? (
            <AppButton
              label="Voltar para Login"
              onPress={() => router.back()}
              disabled={loading}
            />
          ) : (
            <AppButton
              label="Enviar Link"
              onPress={handleResetPassword}
              disabled={loading}
              loading={loading}
            />
          )}
          <AppButton
            label="Cancelar"
            onPress={() => router.back()}
            variant="secondary"
          />
        </View>

        <Text style={[styles.info, { color: colors.muted }]}>
          Não recebeu o e-mail? Verifique sua pasta de spam ou tente novamente em alguns minutos.
        </Text>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  header: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.title,
    fontWeight: '900',
  },
  subtitle: {
    fontSize: typography.body,
    lineHeight: typography.body * 1.4,
  },
  form: {
    gap: spacing.md,
  },
  label: {
    fontSize: typography.bodySm,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    fontSize: typography.body,
  },
  successBox: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  successText: {
    fontSize: typography.body,
    fontWeight: '700',
  },
  successDesc: {
    fontSize: typography.bodySm,
    lineHeight: typography.bodySm * 1.4,
  },
  actions: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  info: {
    fontSize: typography.bodySm,
    textAlign: 'center',
    lineHeight: typography.bodySm * 1.4,
  },
});
