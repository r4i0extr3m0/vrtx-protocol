import { Platform, StyleSheet, View, type ViewProps } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";
import Animated, { FadeIn } from "react-native-reanimated";

import { cn } from "@/lib/utils";
import { ScreenBackdrop } from "@/src/components/ScreenBackdrop";

export interface ScreenContainerProps extends ViewProps {
  /**
   * SafeArea edges to apply. Defaults to ["top", "left", "right"].
   * Bottom is typically handled by Tab Bar.
   */
  edges?: Edge[];
  /**
   * Tailwind className for the content area.
   */
  className?: string;
  /**
   * Additional className for the outer container (background layer).
   */
  containerClassName?: string;
  /**
   * Additional className for the SafeAreaView (content layer).
   */
  safeAreaClassName?: string;
  /**
   * Optional max width for web content. Set false to disable web framing.
   */
  webContentMaxWidth?: number | false;
}

/**
 * A container component that properly handles SafeArea and background colors.
 */
export function ScreenContainer({
  children,
  edges = ["top", "left", "right"],
  className,
  containerClassName,
  safeAreaClassName,
  webContentMaxWidth = 1120,
  style,
  ...props
}: ScreenContainerProps) {
  const shouldFrameWebContent = Platform.OS === "web" && webContentMaxWidth !== false;

  return (
    <View
      className={cn(
        "flex-1",
        "bg-background",
        containerClassName
      )}
      {...props}
    >
      <ScreenBackdrop />
      <SafeAreaView
        edges={edges}
        className={cn("flex-1", safeAreaClassName)}
        style={style}
      >
        <Animated.View 
          entering={FadeIn.duration(450)}
          className={cn("flex-1", className)}
          style={shouldFrameWebContent ? styles.webFrame : undefined}
        >
          {shouldFrameWebContent ? (
            <View style={[styles.webContent, { maxWidth: webContentMaxWidth }]}>
              {children}
            </View>
          ) : (
            children
          )}
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  webFrame: {
    alignItems: "center",
  },
  webContent: {
    width: "100%",
    flex: 1,
  },
});
