import { View, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ScreenContainerProps {
  children: React.ReactNode;
  className?: string;
  scroll?: boolean;
}

export function ScreenContainer({
  children,
  className = "",
  scroll = false,
}: ScreenContainerProps) {
  const insets = useSafeAreaInsets();

  const containerStyle = {
    paddingTop: insets.top,
    paddingBottom: insets.bottom,
  };

  if (scroll) {
    return (
      <ScrollView
        style={containerStyle}
        className={`flex-1 bg-cream-100 px-4 ${className}`}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {children}
      </ScrollView>
    );
  }

  return (
    <View
      style={containerStyle}
      className={`flex-1 bg-cream-100 px-4 ${className}`}
    >
      {children}
    </View>
  );
}
