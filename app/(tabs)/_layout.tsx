import { Tabs, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect } from "react";
import { BackHandler } from "react-native";
import { colors } from "../../src/theme/tokens";
import { useNotificationStore } from "../../src/stores/notification-store";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

function resetToTab(navigation: any, tabName: string, hasStack: boolean) {
  const targetRoute = hasStack
    ? { name: tabName, state: { index: 0, routes: [{ name: "index" }] } }
    : { name: tabName };
  navigation.reset({ index: 0, routes: [targetRoute] });
}

export default function TabsLayout() {
  const { t } = useTranslation("navigation");
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const unreadCount = useNotificationStore(
    (s) => s.notifications.filter((n) => !n.isRead).length
  );

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (router.canGoBack()) return false;
      return true;
    });
    return () => sub.remove();
  }, [router]);

  return (
    <Tabs
      backBehavior="none"
      sceneContainerStyle={{ backgroundColor: "transparent" }}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.golden.DEFAULT,
        tabBarInactiveTintColor: "#AAAAAA",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#F0E8D8",
          borderTopWidth: 1,
          height: 60 + insets.bottom,
          paddingBottom: 8 + insets.bottom,
          paddingTop: 4,
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("tabs.home"),
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name={"home-outline" as IoniconsName} size={size} color={color} />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            resetToTab(navigation, "index", false);
          },
        })}
      />
      <Tabs.Screen
        name="clients"
        options={{
          title: t("tabs.clients"),
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name={"people-outline" as IoniconsName} size={size} color={color} />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            resetToTab(navigation, "clients", true);
          },
        })}
      />
      <Tabs.Screen
        name="cases"
        options={{
          title: t("tabs.cases"),
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name={"briefcase-outline" as IoniconsName} size={size} color={color} />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            resetToTab(navigation, "cases", true);
          },
        })}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: t("tabs.calendar"),
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name={"calendar-outline" as IoniconsName} size={size} color={color} />
          ),
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            resetToTab(navigation, "calendar", true);
          },
        })}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: t("tabs.more"),
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name={"ellipsis-horizontal" as IoniconsName} size={size} color={color} />
          ),
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: "#E53935",
            color: "#FFFFFF",
            fontSize: 10,
            minWidth: 18,
            height: 18,
            lineHeight: 16,
          },
        }}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            resetToTab(navigation, "more", true);
          },
        })}
      />
    </Tabs>
  );
}
