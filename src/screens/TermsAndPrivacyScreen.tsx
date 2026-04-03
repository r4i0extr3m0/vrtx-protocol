import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useTheme } from '@/src/hooks';
import { spacing, typography, radius } from '@/src/theme';
import { AppButton } from '@/src/components/AppButton';

type TabType = 'terms' | 'privacy';

export function TermsAndPrivacyScreen() {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('terms');

  const termsContent = `# Termos de Uso do VRTX Protocol

## 1. Aceitação dos Termos
Ao usar o VRTX Protocol, você concorda com estes termos e condições. Se não concordar, não use o aplicativo.

## 2. Uso Permitido
Você concorda em usar o VRTX Protocol apenas para fins legítimos e de forma que não infrinja os direitos de terceiros ou restrinja seu uso.

## 3. Conteúdo do Usuário
Você é responsável por todo o conteúdo que publica no VRTX Protocol. Você garante que possui todos os direitos necessários sobre esse conteúdo.

## 4. Limitação de Responsabilidade
O VRTX Protocol é fornecido "como está". Não garantimos que o aplicativo será livre de erros ou que funcionará sem interrupções.

## 5. Modificações
Reservamos o direito de modificar estes termos a qualquer momento. Notificaremos você sobre mudanças significativas.

## 6. Encerramento
Podemos encerrar sua conta se você violar estes termos.`;

  const privacyContent = `# Política de Privacidade do VRTX Protocol

## 1. Coleta de Dados
Coletamos informações que você nos fornece voluntariamente, como:
- Informações de conta (e-mail, nome)
- Dados de treino e nutrição
- Preferências de notificação

## 2. Uso de Dados
Usamos seus dados para:
- Fornecer e melhorar o serviço
- Enviar notificações (se consentido)
- Análise e pesquisa

## 3. Compartilhamento de Dados
Não compartilhamos seus dados pessoais com terceiros sem seu consentimento, exceto conforme exigido por lei.

## 4. Segurança
Implementamos medidas de segurança para proteger seus dados pessoais.

## 5. Retenção de Dados
Mantemos seus dados enquanto sua conta estiver ativa. Você pode solicitar a exclusão a qualquer momento.

## 6. Direitos do Usuário
Você tem o direito de:
- Acessar seus dados pessoais
- Corrigir dados imprecisos
- Solicitar a exclusão de seus dados

## 7. Contato
Para questões sobre privacidade, entre em contato conosco através do aplicativo.`;

  return (
    <ScreenContainer>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.tabs}>
          <AppButton
            label="Termos de Uso"
            onPress={() => setActiveTab('terms')}
            variant={activeTab === 'terms' ? 'default' : 'secondary'}
            style={styles.tab}
          />
          <AppButton
            label="Privacidade"
            onPress={() => setActiveTab('privacy')}
            variant={activeTab === 'privacy' ? 'default' : 'secondary'}
            style={styles.tab}
          />
        </View>

        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.contentInner}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.textBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {(activeTab === 'terms' ? termsContent : privacyContent).split('\n').map((line, index) => {
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
                  <Text key={index} style={[styles.bullet, { color: colors.text }]}>
                    {line}
                  </Text>
                );
              }
              if (line.trim()) {
                return (
                  <Text key={index} style={[styles.paragraph, { color: colors.text }]}>
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
    borderBottomColor: 'rgba(0,0,0,0.1)',
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
    fontSize: typography.bodySm,
    lineHeight: typography.bodySm * 1.6,
    marginBottom: spacing.sm,
  },
  bullet: {
    fontSize: typography.bodySm,
    lineHeight: typography.bodySm * 1.6,
    marginLeft: spacing.md,
    marginBottom: spacing.sm,
  },
  spacer: {
    height: spacing.sm,
  },
});
