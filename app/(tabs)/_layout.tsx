import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";
import Ionicons from "@expo/vector-icons/Ionicons";
import { colors } from "../../src/theme/tokens";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

export default function TabsLayout() {
  const { t } = useTranslation("navigation");

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.golden.DEFAULT,
        tabBarInactiveTintColor: "#888888",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#E5E5E5",
          borderTopWidth: 1,
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
      />
      <Tabs.Screen
        name="clients"
        options={{
          title: t("tabs.clients"),
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name={"people-outline" as IoniconsName} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="cases"
        options={{
          title: t("tabs.cases"),
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name={"briefcase-outline" as IoniconsName} size={size} color={color} />
          ),
          tabBarBadge: 3,
          tabBarBadgeStyle: {
            backgroundColor: colors.golden.DEFAULT,
            color: "#FFFFFF",
            fontSize: 10,
          },
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: t("tabs.calendar"),
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name={"calendar-outline" as IoniconsName} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: t("tabs.more"),
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name={"ellipsis-horizontal" as IoniconsName} size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
