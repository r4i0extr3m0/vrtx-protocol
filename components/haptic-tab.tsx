import { BottomTabBarButtonProps } from "@react-navigation/bottom-tabs";
import { Pressable } from "react-native";
import * as Haptics from "expo-haptics";

export function HapticTab(props: BottomTabBarButtonProps) {
  const { onPress, onLongPress, onPressIn, style, children, testID } = props;

  return (
    <Pressable
      style={style}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={(ev) => {
        if (process.env.EXPO_OS === "ios") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onPressIn?.(ev);
      }}
      testID={testID}
    >
      {children}
    </Pressable>
  );
}
