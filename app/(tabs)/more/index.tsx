import { View, Text, Pressable } from "react-native";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { ScreenContainer, Card } from "../../../src/components/ui";
import { colors } from "../../../src/theme/tokens";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

export default function MoreScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const menuItems: {
    icon: IoniconsName;
    label: string;
    route: "./settings" | "./profile";
  }[] = [
    {
      icon: "settings-outline" as IoniconsName,
      label: t("more.settings"),
      route: "./settings",
    },
    {
      icon: "person-outline" as IoniconsName,
      label: t("more.profile"),
      route: "./profile",
    },
  ];

  return (
    <ScreenContainer>
      <View className="mt-4">
        {menuItems.map((item) => (
          <Pressable
            key={item.route}
            onPress={() => router.push(item.route)}
          >
            <Card className="mb-3">
              <View className="flex-row items-center">
                <Ionicons
                  name={item.icon}
                  size={24}
                  color={colors.navy.DEFAULT}
                />
                <Text className="ml-3 text-base font-medium text-navy">
                  {item.label}
                </Text>
                <View className="flex-1" />
                <Ionicons
                  name={"chevron-forward" as IoniconsName}
                  size={20}
                  color="#888888"
                />
              </View>
            </Card>
          </Pressable>
        ))}
      </View>
    </ScreenContainer>
  );
}
