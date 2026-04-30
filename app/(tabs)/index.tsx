import { View, Text, ScrollView, Pressable, FlatList, Image, AccessibilityInfo } from "react-native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore } from "../../src/stores/auth-store";
import { useNotificationStore } from "../../src/stores/notification-store";
import { useServices } from "../../src/hooks/useServices";
import { colors } from "../../src/theme/tokens";
import type { CaseSummary, CalendarEvent } from "../../src/services/types";
import { getDeadlineUrgency, URGENCY_COLORS, STATUS_COLORS } from "../../src/services/types";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];
type MaterialCommunityIconsName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

interface QuickAction {
  icon: IoniconsName;
  labelKey: string;
  route: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { icon: "person-add-outline" as IoniconsName, labelKey: "home:newClient", route: "/(tabs)/clients/new" },
  { icon: "briefcase-outline" as IoniconsName, labelKey: "home:newCase", route: "/(tabs)/cases/new" },
];

const ACCENT = "#B68C3C";

const WARM = {
  headerBg: "#3A2518",
  titleDark: "#2C1810",
  textDark: "#3E2C1E",
  textMuted: "#8B7355",
  textLight: "#A89478",
  cardBorder: "#F0E4D0",
  cardIconBg: "#FDF3E0",
};

export default function HomeScreen() {
  const { t } = useTranslation(["common", "home", "search"]);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const services = useServices();
  const currentUser = useAuthStore((s) => s.currentUser);
  const unreadCount = useNotificationStore((s) => s.notifications.filter((n) => !n.isRead).length);

  const [clientCount, setClientCount] = useState(0);
  const [caseCount, setCaseCount] = useState(0);
  const [recentCases, setRecentCases] = useState<CaseSummary[]>([]);
  const [deadlines, setDeadlines] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [fabOpen, setFabOpen] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      async function loadData() {
        try {
          const [clients, cases, recent, events] = await Promise.all([
            services.clients.getClientCount(),
            services.cases.getCaseCount(),
            services.cases.getRecentCases(5),
            services.calendarEvents.getEvents(),
          ]);

          if (!isMounted) return;

          const now = new Date();
          const todayStr = now.toISOString().split("T")[0];
          const weekLater = new Date(now);
          weekLater.setDate(weekLater.getDate() + 7);
          const weekLaterStr = weekLater.toISOString().split("T")[0];

          const weekDeadlines = events
            .filter((e) => e.type === "deadline" && e.date >= todayStr && e.date <= weekLaterStr)
            .sort((a, b) => a.date.localeCompare(b.date));

          setClientCount(clients);
          setCaseCount(cases);
          setRecentCases(recent);
          setDeadlines(weekDeadlines);
          setLoading(false);
        } catch {
          if (isMounted) setLoading(false);
        }
      }

      loadData();

      return () => {
        isMounted = false;
      };
    }, [services])
  );

  return (
    <LinearGradient
      colors={["#F8F7F2", "#FAF2E4", "#F9F7F0", "#F6F3EC"]}
      locations={[0, 0.3, 0.65, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
        <ScrollView
          style={{ flex: 1, backgroundColor: "transparent" }}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header — navy, matching other tab Stack headers */}
          <View
            style={{
              paddingTop: insets.top + 8,
              paddingBottom: 14,
              paddingHorizontal: 20,
              backgroundColor: colors.navy.DEFAULT,
            }}
          >
            {/* Top Row: Logo + App Name + Bell + Avatar */}
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MaterialCommunityIcons name={"gavel" as MaterialCommunityIconsName} size={32} color={ACCENT} />
              </View>
              <Text
                style={{
                  marginLeft: 10,
                  fontSize: 20,
                  fontWeight: "700",
                  color: "#FFFFFF",
                  letterSpacing: 1,
                  flex: 1,
                }}
              >
                {t("app.name").toUpperCase()}
              </Text>
              {/* Bell Icon with Badge */}
              <Pressable
                onPress={() => router.push({ pathname: "/(tabs)/more/notifications", params: { returnTo: "/(tabs)" } })}
                style={{ position: "relative", padding: 4, marginRight: 10 }}
              >
                <Ionicons name={"notifications-outline" as IoniconsName} size={24} color="#FFFFFF" />
                {unreadCount > 0 && (
                  <View
                    style={{
                      position: "absolute",
                      top: 0,
                      right: 0,
                      width: 18,
                      height: 18,
                      borderRadius: 9,
                      backgroundColor: "#EF5350",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ fontSize: 10, fontWeight: "700", color: "#FFFFFF" }}>
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </Text>
                  </View>
                )}
              </Pressable>
              {/* Profile Avatar */}
              <Pressable
                onPress={() => router.push("/(tabs)/more/profile" as any)}
              >
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 19,
                    borderWidth: 2,
                    borderColor: ACCENT,
                    backgroundColor: WARM.cardIconBg,
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                  }}
                >
                  <Ionicons name={"person" as IoniconsName} size={20} color={ACCENT} />
                </View>
              </Pressable>
            </View>
          </View>

          {/* Search Bar — on cream gradient, below navy header */}
          <View style={{ paddingHorizontal: 20, paddingTop: 14 }}>
            <Pressable onPress={() => router.push("/(tabs)/more/search" as any)}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#FFFFFF",
                  borderRadius: 24,
                  paddingHorizontal: 16,
                  paddingVertical: 11,
                  borderWidth: 1,
                  borderColor: ACCENT,
                  shadowColor: "#B8975A",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.08,
                  shadowRadius: 4,
                  elevation: 1,
                  height: 50,
                }}
              >
                <Ionicons name={"search-outline" as IoniconsName} size={26} color={WARM.textMuted} />
                <Text
                  style={{
                    flex: 1,
                    marginLeft: 10,
                    color: WARM.textLight,
                    fontSize: 14,
                  }}
                  numberOfLines={1}
                >
                  {t("search:placeholder")}
                </Text>
              </View>
            </Pressable>
          </View>

          {/* Stats Cards — compact 2-card row */}
          <View style={{ flexDirection: "row", paddingHorizontal: 16, gap: 14, paddingTop: 10 }}>
            {/* Clients Card */}
            <Pressable
              onPress={() => router.push("/(tabs)/clients" as any)}
              style={{
                flex: 1,
                backgroundColor: "#FFFFFF",
                borderRadius: 16,
                paddingVertical: 14,
                paddingHorizontal: 14,
                alignItems: "center",
                shadowColor: "#B8975A",
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.07,
                shadowRadius: 10,
                elevation: 2,
                borderWidth: 1,
                borderColor: WARM.cardBorder,
              }}
            >
              <Ionicons name={"people-outline" as IoniconsName} size={30} color={ACCENT} style={{ marginBottom: 4 }} />
              <Text style={{ fontSize: 28, fontWeight: "800", color: ACCENT, lineHeight: 32 }}>
                {clientCount}
              </Text>
              <Text style={{ fontSize: 12, color: WARM.textMuted, marginTop: 2, fontWeight: "500" }}>
                {t("clientCount")}
              </Text>
            </Pressable>

            {/* Cases Card */}
            <Pressable
              onPress={() => router.push("/(tabs)/cases" as any)}
              style={{
                flex: 1,
                backgroundColor: "#FFFFFF",
                borderRadius: 16,
                paddingVertical: 14,
                paddingHorizontal: 14,
                alignItems: "center",
                shadowColor: "#B8975A",
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.07,
                shadowRadius: 10,
                elevation: 2,
                borderWidth: 1,
                borderColor: WARM.cardBorder,
              }}
            >
              <Ionicons name={"briefcase-outline" as IoniconsName} size={30} color={ACCENT} style={{ marginBottom: 4 }} />
              <Text style={{ fontSize: 28, fontWeight: "800", color: ACCENT, lineHeight: 32 }}>
                {caseCount}
              </Text>
              <Text style={{ fontSize: 12, color: WARM.textMuted, marginTop: 2, fontWeight: "500" }}>
                {t("caseCount")}
              </Text>
            </Pressable>
          </View>

          {/* Recent Cases */}
          <View style={{ marginTop: 28 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, marginBottom: 14 }}>
              <Text style={{ fontSize: 18, fontWeight: "700", color: WARM.titleDark }}>
                {t("home:recentCases")}
              </Text>
              <Pressable onPress={() => router.push("/(tabs)/cases" as any)}>
                <Text style={{ fontSize: 13, color: ACCENT, fontWeight: "600" }}>
                  {t("home:viewAll")} →
                </Text>
              </Pressable>
            </View>

            {recentCases.length === 0 && !loading ? (
              <View style={{ paddingHorizontal: 16 }}>
                <Text style={{ fontSize: 14, color: WARM.textLight, fontStyle: "italic" }}>
                  {t("home:noRecentCases")}
                </Text>
              </View>
            ) : (
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
                data={recentCases}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                  const statusColor = STATUS_COLORS[item.status] ?? STATUS_COLORS.active;
                  return (
                    <Pressable
                      onPress={() => router.push({ pathname: "/(tabs)/cases/[id]", params: { id: item.id, returnTo: "/(tabs)" } })}
                      style={{
                        width: 180,
                        backgroundColor: "#FFFFFF",
                        borderRadius: 16,
                        padding: 14,
                        shadowColor: "#B8975A",
                        shadowOffset: { width: 0, height: 3 },
                        shadowOpacity: 0.06,
                        shadowRadius: 10,
                        elevation: 2,
                        borderWidth: 1,
                        borderColor: WARM.cardBorder,
                      }}
                    >
                      <Text
                        numberOfLines={2}
                        style={{
                          fontSize: 14,
                          fontWeight: "600",
                          color: WARM.textDark,
                          marginBottom: 4,
                          lineHeight: 18,
                        }}
                      >
                        {item.title}
                      </Text>
                      <Text
                        numberOfLines={1}
                        style={{ fontSize: 11, color: WARM.textLight, marginBottom: 8 }}
                      >
                        {item.clientName}
                      </Text>
                      <View
                        style={{
                          alignSelf: "flex-start",
                          backgroundColor: statusColor.bg,
                          borderRadius: 6,
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                        }}
                      >
                        <Text style={{ fontSize: 10, fontWeight: "600", color: statusColor.text }}>
                          {t("status." + item.status)}
                        </Text>
                      </View>
                    </Pressable>
                  );
                }}
              />
            )}
          </View>

          {/* Deadlines This Week */}
          <View style={{ marginTop: 28, paddingHorizontal: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: "700", color: WARM.titleDark, marginBottom: 14 }}>
              {t("home:deadlinesThisWeek")}
            </Text>

            {deadlines.length === 0 && !loading ? (
              <Text style={{ fontSize: 14, color: WARM.textLight, fontStyle: "italic" }}>
                {t("home:noDeadlines")}
              </Text>
            ) : (
              deadlines.map((item) => {
                const urgency = getDeadlineUrgency(item.date);
                const urgencyColor = URGENCY_COLORS[urgency];
                const deadlineDate = new Date(item.date + "T00:00:00");
                const dateStr = deadlineDate.toLocaleDateString("sr-Latn", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                });
                const timeStr = item.startTime ?? "Ceo dan";

                return (
                  <Pressable
                    key={item.id}
                    onPress={() => router.push({ pathname: "/(tabs)/calendar/event/[id]", params: { id: item.id, returnTo: "/(tabs)" } })}
                    style={{
                      backgroundColor: "#FFFFFF",
                      borderRadius: 14,
                      padding: 14,
                      marginBottom: 10,
                      flexDirection: "row",
                      alignItems: "center",
                      shadowColor: "#B8975A",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.05,
                      shadowRadius: 6,
                      elevation: 1,
                      borderWidth: 1,
                      borderColor: WARM.cardBorder,
                      borderLeftWidth: 3,
                      borderLeftColor: urgencyColor.text,
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        backgroundColor: urgencyColor.bg,
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 12,
                      }}
                    >
                      <Ionicons
                        name={"calendar-outline" as IoniconsName}
                        size={18}
                        color={urgencyColor.text}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        numberOfLines={1}
                        style={{ fontSize: 14, fontWeight: "600", color: WARM.textDark, marginBottom: 2 }}
                      >
                        {item.title}
                      </Text>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <Ionicons name={"time-outline" as IoniconsName} size={12} color={WARM.textLight} />
                        <Text style={{ fontSize: 11, color: WARM.textMuted }}>
                          {dateStr}, {timeStr}
                        </Text>
                      </View>
                    </View>
                    {urgencyColor.label !== "" && (
                      <View
                        style={{
                          backgroundColor: urgencyColor.bg,
                          borderRadius: 8,
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          marginLeft: 8,
                        }}
                      >
                        <Text style={{ fontSize: 10, fontWeight: "600", color: urgencyColor.text }}>
                          {urgencyColor.label}
                        </Text>
                      </View>
                    )}
                    <Ionicons name={"chevron-forward" as IoniconsName} size={16} color="#D4C4A8" style={{ marginLeft: 4 }} />
                  </Pressable>
                );
              })
            )}
          </View>
        </ScrollView>

        {/* Speed-Dial FAB */}
        {fabOpen && (
          <>
            <Pressable
              onPress={() => setFabOpen(false)}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0,0,0,0.3)",
              }}
            />
            {QUICK_ACTIONS.map((action, index) => (
              <Pressable
                key={action.labelKey}
                onPress={() => {
                  setFabOpen(false);
                  // QUICK_ACTIONS targets are tab roots or /new routes -- no returnTo needed
                  router.push(action.route as any);
                }}
                style={{
                  position: "absolute",
                  bottom: 88 + index * 56,
                  right: 20,
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#FFFFFF",
                  borderRadius: 28,
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.15,
                  shadowRadius: 6,
                  elevation: 4,
                }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: WARM.cardIconBg,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 10,
                  }}
                >
                  <Ionicons name={action.icon} size={18} color={ACCENT} />
                </View>
                <Text style={{ fontSize: 14, fontWeight: "600", color: WARM.textDark }}>
                  {t(action.labelKey)}
                </Text>
              </Pressable>
            ))}
          </>
        )}

        {/* Main FAB */}
        <Pressable
          onPress={() => setFabOpen((prev) => !prev)}
          style={{
            position: "absolute",
            bottom: 24,
            right: 20,
            width: 52,
            height: 52,
            borderRadius: 26,
            backgroundColor: ACCENT,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: ACCENT,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 8,
            elevation: 6,
            zIndex: 10,
          }}
        >
          <Ionicons name={(fabOpen ? "close" : "add") as IoniconsName} size={28} color="#FFFFFF" />
        </Pressable>
    </LinearGradient>
  );
}
