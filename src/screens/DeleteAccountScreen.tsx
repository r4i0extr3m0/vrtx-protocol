import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TextInput } from 'react-native';
import { router } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { AppButton } from '@/src/components/AppButton';
import { useTheme } from '@/src/hooks';
import { spacing, typography, radius } from '@/src/theme';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '@/src/store/authStore';

export function DeleteAccountScreen() {
  const { colors } = useTheme();
  const [password, setPassword] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const deleteAccount = useAuthStore(state => state.deleteAccount);

  const handleDeleteAccount = async () => {
    if (!confirmed) {
      Alert.alert('Confirmação', 'Por favor, confirme que deseja excluir sua conta.');
      return;
    }

    if (!password.trim()) {
      Alert.alert('Erro', 'Por favor, insira sua senha para confirmar.');
      return;
    }

    setLastError(null);
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      const result = await deleteAccount(password, deleteReason);
      
      if (result.success) {
        setLastError(null);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          'Conta Excluída',
          result.message || 'Sua conta foi permanentemente excluída.',
          [
            {
              text: 'OK',
              onPress: () => {
                router.replace('/login' as any);
              }
            }
          ]
        );
      } else {
        const errorMessage = result.message || 'Não foi possível excluir sua conta.';
        setLastError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Não foi possível excluir sua conta. Verifique sua senha.';
      setLastError(errorMessage);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erro ao excluir conta', errorMessage);
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
          <Text style={[styles.title, { color: colors.error }]}>Excluir Conta</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            Esta ação é permanente e não pode ser desfeita. Todos os seus dados serão removidos.
          </Text>
        </View>

        <View style={[styles.warningBox, { backgroundColor: colors.error + '15', borderColor: colors.error }]}>
          <Text style={[styles.warningTitle, { color: colors.error }]}>⚠️ Aviso Importante</Text>
          <Text style={[styles.warningText, { color: colors.foreground }]}>
            Ao excluir sua conta, você perderá permanentemente:
          </Text>
          <View style={styles.warningList}>
            <Text style={[styles.warningItem, { color: colors.foreground }]}>• Todos os seus treinos e histórico</Text>
            <Text style={[styles.warningItem, { color: colors.foreground }]}>• Todos os seus registros de refeições</Text>
            <Text style={[styles.warningItem, { color: colors.foreground }]}>• Suas badges e pontos de gamificação</Text>
            <Text style={[styles.warningItem, { color: colors.foreground }]}>• Suas preferências e configurações</Text>
          </View>
        </View>

        <View style={styles.form}>
          <Text style={[styles.label, { color: colors.foreground }]}>Senha</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground }]}
            placeholder="Insira sua senha"
            placeholderTextColor={colors.muted}
            secureTextEntry
            editable={!loading}
            value={password}
            onChangeText={setPassword}
          />

          <Text style={[styles.label, { color: colors.foreground }]}>Motivo da exclusão (opcional)</Text>
          <TextInput
            style={[
              styles.input,
              styles.reasonInput,
              { backgroundColor: colors.surface, borderColor: colors.border, color: colors.foreground },
            ]}
            placeholder="Se quiser, conte para nós o motivo da exclusão"
            placeholderTextColor={colors.muted}
            editable={!loading}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            value={deleteReason}
            onChangeText={setDeleteReason}
          />

          {lastError ? (
            <View style={[styles.errorBox, { backgroundColor: colors.error + '12', borderColor: colors.error + '55' }]}>
              <Text style={[styles.errorTitle, { color: colors.error }]}>Motivo retornado pela exclusão</Text>
              <Text style={[styles.errorText, { color: colors.foreground }]}>{lastError}</Text>
            </View>
          ) : null}

          <View style={[styles.confirmBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.confirmLabel, { color: colors.foreground }]}>
              Confirmo que desejo excluir permanentemente minha conta e todos os meus dados.
            </Text>
            <AppButton
              label={confirmed ? '✓ Confirmado' : 'Confirmar Exclusão'}
              onPress={() => {
                setConfirmed(!confirmed);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              variant={confirmed ? 'default' : 'secondary'}
              style={{ marginTop: spacing.md }}
            />
          </View>
        </View>

        <View style={styles.actions}>
          <AppButton
            label="Excluir Permanentemente"
            onPress={handleDeleteAccount}
            disabled={!confirmed || loading}
            loading={loading}
            style={{ backgroundColor: colors.error }}
          />
          <AppButton
            label="Cancelar"
            onPress={() => router.back()}
            variant="secondary"
          />
        </View>

        <Text style={[styles.info, { color: colors.muted }]}>
          Se você tiver dúvidas, entre em contato com nosso suporte antes de excluir sua conta.
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
  warningBox: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  warningTitle: {
    fontSize: typography.body,
    fontWeight: '700',
  },
  warningText: {
    fontSize: typography.bodySm,
  },
  warningList: {
    gap: spacing.sm,
  },
  warningItem: {
    fontSize: typography.bodySm,
    lineHeight: typography.bodySm * 1.4,
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
  reasonInput: {
    minHeight: 104,
  },
  errorBox: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  errorTitle: {
    fontSize: typography.bodySm,
    fontWeight: '800',
  },
  errorText: {
    fontSize: typography.bodySm,
    lineHeight: typography.bodySm * 1.4,
  },
  confirmBox: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  confirmLabel: {
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
