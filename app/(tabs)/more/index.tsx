import { View, Text, Pressable } from "react-native";
import { useTranslation } from "react-i18next";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { ScreenContainer } from "../../../src/components/ui";
import { colors } from "../../../src/theme/tokens";
import { useNotificationStore } from "../../../src/stores/notification-store";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

interface MenuItem {
  icon: IoniconsName;
  label: string;
  route:
    | "/(tabs)/more/settings"
    | "/(tabs)/more/profile"
    | "/(tabs)/more/search"
    | "/(tabs)/more/notifications"
    | "/(tabs)/more/billing"
    | "/(tabs)/more/reports";
  badge?: number;
}

export default function MoreScreen() {
  const { t } = useTranslation(["common", "search", "notifications", "billing", "reports"]);
  const router = useRouter();
  const unreadCount = useNotificationStore(
    (s) => s.notifications.filter((n) => !n.isRead).length
  );

  const menuItems: MenuItem[] = [
    {
      icon: "search-outline" as IoniconsName,
      label: t("search:title"),
      route: "/(tabs)/more/search",
    },
    {
      icon: "notifications-outline" as IoniconsName,
      label: t("notifications:title"),
      route: "/(tabs)/more/notifications",
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    {
      icon: "receipt-outline" as IoniconsName,
      label: t("billing:title"),
      route: "/(tabs)/more/billing",
    },
    {
      icon: "bar-chart-outline" as IoniconsName,
      label: t("reports:title"),
      route: "/(tabs)/more/reports",
    },
    {
      icon: "settings-outline" as IoniconsName,
      label: t("common:more.settings"),
      route: "/(tabs)/more/settings",
    },
  ];

  return (
    <ScreenContainer>
      <View style={{ marginTop: 16, gap: 12 }}>
        {menuItems.map((item) => (
          <Pressable
            key={item.route}
            onPress={() => router.push(item.route as any)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#FFFFFF",
              borderRadius: 12,
              padding: 16,
              borderWidth: 1,
              borderColor: "#FFF3E0",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 1,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "#FDF8EC",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons
                name={item.icon}
                size={20}
                color={colors.golden.DEFAULT}
              />
            </View>
            <Text
              style={{
                marginLeft: 12,
                fontSize: 16,
                fontWeight: "500",
                color: colors.navy.DEFAULT,
                flex: 1,
              }}
            >
              {item.label}
            </Text>
            {item.badge != null && item.badge > 0 && (
              <View
                style={{
                  backgroundColor: colors.golden.DEFAULT,
                  borderRadius: 10,
                  minWidth: 20,
                  height: 20,
                  alignItems: "center",
                  justifyContent: "center",
                  paddingHorizontal: 6,
                  marginRight: 8,
                }}
              >
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: 11,
                    fontWeight: "700",
                  }}
                >
                  {item.badge}
                </Text>
              </View>
            )}
            <Ionicons
              name={"chevron-forward" as IoniconsName}
              size={20}
              color="#CCCCCC"
            />
          </Pressable>
        ))}
      </View>
    </ScreenContainer>
  );
}
