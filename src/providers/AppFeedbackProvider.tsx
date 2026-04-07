import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { PropsWithChildren } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeOutUp, LinearTransition } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppIcon } from "@/src/components/AppIcon";
import { useTheme } from "@/src/hooks";
import { radius, shadows, spacing, typography } from "@/src/theme";

type FeedbackVariant = "info" | "success" | "warning" | "error";

type AlertButtonStyle = "default" | "cancel" | "destructive";

type AppAlertButton = {
  text?: string;
  onPress?: () => void;
  style?: AlertButtonStyle;
};

type NoticeState = {
  id: string;
  title?: string;
  message: string;
  variant: FeedbackVariant;
};

type DialogState = {
  title: string;
  message?: string;
  variant: FeedbackVariant;
  buttons: AppAlertButton[];
};

type AppFeedbackContextValue = {
  showNotice: (input: { title?: string; message: string; variant?: FeedbackVariant; durationMs?: number }) => void;
  showDialog: (input: DialogState) => void;
};

const AppFeedbackContext = createContext<AppFeedbackContextValue | null>(null);

function createNoticeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function inferVariant(title?: string, message?: string, buttons?: AppAlertButton[]): FeedbackVariant {
  const normalized = `${title ?? ""} ${message ?? ""}`.toLowerCase();

  if (buttons?.some((button) => button.style === "destructive")) {
    return "error";
  }

  if (
    normalized.includes("erro") ||
    normalized.includes("falha") ||
    normalized.includes("nao foi possivel") ||
    normalized.includes("indisponivel")
  ) {
    return "error";
  }

  if (
    normalized.includes("sucesso") ||
    normalized.includes("tudo certo") ||
    normalized.includes("salva") ||
    normalized.includes("salvo") ||
    normalized.includes("ativado") ||
    normalized.includes("ativada") ||
    normalized.includes("restaurad")
  ) {
    return "success";
  }

  if (
    normalized.includes("aviso") ||
    normalized.includes("inval") ||
    normalized.includes("obrigat") ||
    normalized.includes("falta") ||
    normalized.includes("selecione") ||
    normalized.includes("confirma")
  ) {
    return "warning";
  }

  return "info";
}

function getVariantVisuals(variant: FeedbackVariant, colors: ReturnType<typeof useTheme>["colors"]) {
  switch (variant) {
    case "success":
      return {
        icon: "Check",
        accent: colors.success,
        accentSoft: colors.success + "18",
      };
    case "warning":
      return {
        icon: "AlertTriangle",
        accent: colors.warning,
        accentSoft: colors.warning + "18",
      };
    case "error":
      return {
        icon: "X",
        accent: colors.error,
        accentSoft: colors.error + "18",
      };
    default:
      return {
        icon: "BarChart",
        accent: colors.primary,
        accentSoft: colors.primary + "18",
      };
  }
}

function NoticeCard({
  notice,
  onDismiss,
}: {
  notice: NoticeState;
  onDismiss: (id: string) => void;
}) {
  const { colors } = useTheme();
  const visuals = getVariantVisuals(notice.variant, colors);

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(16)}
      exiting={FadeOutUp.duration(180)}
      layout={LinearTransition.springify().damping(18)}
      style={[
        styles.noticeCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        shadows.card,
      ]}
    >
      <View style={[styles.noticeIconWrap, { backgroundColor: visuals.accentSoft }]}>
        <AppIcon color={visuals.accent} name={visuals.icon} size={18} />
      </View>
      <View style={styles.noticeCopy}>
        {notice.title ? (
          <Text style={[styles.noticeTitle, { color: colors.foreground }]}>{notice.title}</Text>
        ) : null}
        <Text style={[styles.noticeMessage, { color: colors.foreground }]}>
          {notice.message}
        </Text>
      </View>
      <Pressable
        accessibilityLabel="Fechar aviso"
        hitSlop={10}
        onPress={() => onDismiss(notice.id)}
        style={styles.noticeClose}
      >
        <AppIcon color={colors.muted} name="X" size={18} />
      </Pressable>
    </Animated.View>
  );
}

export function AppFeedbackProvider({ children }: PropsWithChildren) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [notices, setNotices] = useState<NoticeState[]>([]);
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const originalAlertRef = useRef(Alert.alert);

  const dismissNotice = useCallback((id: string) => {
    setNotices((current) => current.filter((item) => item.id !== id));
  }, []);

  const showNotice = useCallback(({
    title,
    message,
    variant = "info",
    durationMs = 3400,
  }: {
    title?: string;
    message: string;
    variant?: FeedbackVariant;
    durationMs?: number;
  }) => {
    const id = createNoticeId();
    setNotices((current) => [...current, { id, title, message, variant }].slice(-3));
    setTimeout(() => {
      dismissNotice(id);
    }, durationMs);
  }, [dismissNotice]);

  const showDialog = useCallback((input: DialogState) => {
    setDialog({
      ...input,
      buttons: input.buttons.length > 0 ? input.buttons : [{ text: "OK" }],
    });
  }, []);

  useEffect(() => {
    const originalAlert = originalAlertRef.current;

    Alert.alert = (title, message, buttons) => {
      const safeTitle = title ?? "";
      const safeMessage = message ?? "";
      const safeButtons = buttons?.length ? buttons : [{ text: "OK" }];
      const hasButtonAction = safeButtons.some((button) => typeof button.onPress === "function");
      const shouldOpenDialog =
        safeButtons.length > 1 ||
        hasButtonAction ||
        safeButtons.some(
          (button) => button.style === "cancel" || button.style === "destructive",
        );
      const variant = inferVariant(safeTitle, safeMessage, safeButtons);

      if (shouldOpenDialog) {
        showDialog({
          title: safeTitle || "Aviso",
          message: safeMessage,
          variant,
          buttons: safeButtons,
        });
        return;
      }

      showNotice({
        title: safeTitle || undefined,
        message: safeMessage || safeTitle,
        variant,
      });
    };

    return () => {
      Alert.alert = originalAlert;
    };
  }, [showDialog, showNotice]);

  const contextValue = useMemo<AppFeedbackContextValue>(
    () => ({
      showDialog,
      showNotice,
    }),
    [showDialog, showNotice],
  );

  const dialogVisuals = getVariantVisuals(dialog?.variant ?? "info", colors);

  return (
    <AppFeedbackContext.Provider value={contextValue}>
      <View style={styles.root}>
        {children}

        <View
          pointerEvents="box-none"
          style={[styles.noticeStack, { paddingTop: Math.max(insets.top + 8, 20) }]}
        >
          {notices.map((notice) => (
            <NoticeCard key={notice.id} notice={notice} onDismiss={dismissNotice} />
          ))}
        </View>

        <Modal
          animationType="fade"
          onRequestClose={() => setDialog(null)}
          statusBarTranslucent={Platform.OS === "android"}
          transparent
          visible={Boolean(dialog)}
        >
          <View style={styles.dialogOverlay}>
            <View
              style={[
                styles.dialogCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
                shadows.card,
              ]}
            >
              <View style={[styles.dialogIconWrap, { backgroundColor: dialogVisuals.accentSoft }]}>
                <AppIcon color={dialogVisuals.accent} name={dialogVisuals.icon} size={22} />
              </View>
              <View style={styles.dialogCopy}>
                <Text style={[styles.dialogTitle, { color: colors.foreground }]}>
                  {dialog?.title}
                </Text>
                {dialog?.message ? (
                  <Text style={[styles.dialogMessage, { color: colors.muted }]}>
                    {dialog.message}
                  </Text>
                ) : null}
              </View>
              <View style={styles.dialogActions}>
                {dialog?.buttons.map((button, index) => {
                  const isDestructive = button.style === "destructive";
                  const isCancel = button.style === "cancel";

                  return (
                    <Pressable
                      key={`${button.text ?? "button"}-${index}`}
                      onPress={() => {
                        setDialog(null);
                        setTimeout(() => {
                          button.onPress?.();
                        }, 10);
                      }}
                      style={[
                        styles.dialogButton,
                        {
                          backgroundColor: isDestructive
                            ? colors.error + "14"
                            : isCancel
                              ? colors.surfaceAlt
                              : colors.primary,
                          borderColor: isDestructive ? colors.error + "30" : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.dialogButtonLabel,
                          {
                            color: isDestructive
                              ? colors.error
                              : isCancel
                                ? colors.foreground
                                : colors.background,
                          },
                        ]}
                      >
                        {(button.text ?? "OK").toUpperCase()}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </AppFeedbackContext.Provider>
  );
}

export function useAppFeedback() {
  const context = useContext(AppFeedbackContext);

  if (!context) {
    throw new Error("useAppFeedback must be used within AppFeedbackProvider");
  }

  return context;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  noticeStack: {
    left: 0,
    paddingHorizontal: spacing.md,
    pointerEvents: "box-none",
    position: "absolute",
    right: 0,
    top: 0,
    zIndex: 1000,
    gap: spacing.sm,
  },
  noticeCard: {
    alignItems: "center",
    borderRadius: radius.xl,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  noticeIconWrap: {
    alignItems: "center",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  noticeCopy: {
    flex: 1,
    gap: 2,
  },
  noticeTitle: {
    fontFamily: typography.family.heading,
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: -0.2,
  },
  noticeMessage: {
    fontFamily: typography.family.body,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  noticeClose: {
    alignItems: "center",
    height: 28,
    justifyContent: "center",
    width: 28,
  },
  dialogOverlay: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg,
  },
  dialogCard: {
    borderRadius: radius.xxl,
    borderWidth: 1,
    gap: spacing.lg,
    maxWidth: 420,
    padding: spacing.xl,
    width: "100%",
  },
  dialogIconWrap: {
    alignItems: "center",
    borderRadius: 24,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  dialogCopy: {
    gap: spacing.sm,
  },
  dialogTitle: {
    fontFamily: typography.family.heading,
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.6,
  },
  dialogMessage: {
    fontFamily: typography.family.body,
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 22,
  },
  dialogActions: {
    gap: spacing.sm,
  },
  dialogButton: {
    alignItems: "center",
    borderRadius: radius.lg,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 52,
    paddingHorizontal: spacing.lg,
  },
  dialogButtonLabel: {
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1,
  },
});
