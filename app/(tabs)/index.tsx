import { View, Text, ScrollView, Pressable, FlatList, TextInput } from "react-native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useAuthStore } from "../../src/stores/auth-store";
import { useNotificationStore } from "../../src/stores/notification-store";
import { useServices } from "../../src/hooks/useServices";
import { colors } from "../../src/theme/tokens";
import type { CaseSummary, CalendarEvent } from "../../src/services/types";
import { getDeadlineUrgency, URGENCY_COLORS, STATUS_COLORS } from "../../src/services/types";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

interface QuickAction {
  icon: IoniconsName;
  labelKey: string;
  route: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { icon: "person-add-outline" as IoniconsName, labelKey: "home:newClient", route: "/(tabs)/clients/new" },
  { icon: "briefcase-outline" as IoniconsName, labelKey: "home:newCase", route: "/(tabs)/cases/new" },
  { icon: "camera-outline" as IoniconsName, labelKey: "home:scanDocument", route: "/(tabs)/cases" },
];

export default function HomeScreen() {
  const { t } = useTranslation(["common", "home"]);
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
    <View style={{ flex: 1, backgroundColor: colors.cream.DEFAULT }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View
          style={{
            backgroundColor: colors.navy.DEFAULT,
            paddingTop: insets.top + 8,
            paddingBottom: 20,
            paddingHorizontal: 20,
            borderBottomLeftRadius: 24,
            borderBottomRightRadius: 24,
          }}
        >
          {/* Top Row: Logo + App Name + Bell */}
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                backgroundColor: colors.golden.DEFAULT,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name={"scale-outline" as IoniconsName} size={20} color="#FFFFFF" />
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
              onPress={() => router.push("/(tabs)/more/notifications" as any)}
              style={{ position: "relative", padding: 4 }}
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
          </View>

          {/* Search Bar */}
          <Pressable onPress={() => router.push("/(tabs)/more/search" as any)}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "rgba(255,255,255,0.15)",
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 10,
              }}
            >
              <Ionicons name={"search-outline" as IoniconsName} size={18} color="rgba(255,255,255,0.7)" />
              <TextInput
                placeholder={t("actions.search") + " " + t("cases").toLowerCase() + ", " + t("clients").toLowerCase() + "..."}
                placeholderTextColor="rgba(255,255,255,0.5)"
                editable={false}
                pointerEvents="none"
                style={{
                  flex: 1,
                  marginLeft: 10,
                  color: "#FFFFFF",
                  fontSize: 14,
                }}
              />
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  backgroundColor: colors.golden.DEFAULT,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name={"options-outline" as IoniconsName} size={14} color="#FFFFFF" />
              </View>
            </View>
          </Pressable>
        </View>

        {/* Stats Cards */}
        <View style={{ flexDirection: "row", paddingHorizontal: 16, marginTop: -1, gap: 12, paddingTop: 20 }}>
          {/* Clients Card */}
          <Pressable
            onPress={() => router.push("/(tabs)/clients" as any)}
            style={{
              flex: 1,
              backgroundColor: "#FFFFFF",
              borderRadius: 16,
              padding: 16,
              alignItems: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 2,
              borderWidth: 1,
              borderColor: "#FFF3E0",
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: "#FDF8EC",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 8,
              }}
            >
              <Ionicons name={"people-outline" as IoniconsName} size={22} color={colors.golden.DEFAULT} />
            </View>
            <Text style={{ fontSize: 28, fontWeight: "700", color: colors.navy.DEFAULT }}>
              {clientCount}
            </Text>
            <Text style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
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
              padding: 16,
              alignItems: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 2,
              borderWidth: 1,
              borderColor: "#FFF3E0",
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: "#FDF8EC",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 8,
              }}
            >
              <Ionicons name={"briefcase-outline" as IoniconsName} size={22} color={colors.golden.DEFAULT} />
            </View>
            <Text style={{ fontSize: 28, fontWeight: "700", color: colors.navy.DEFAULT }}>
              {caseCount}
            </Text>
            <Text style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
              {t("caseCount")}
            </Text>
          </Pressable>

          {/* Deadlines Card */}
          <Pressable
            onPress={() => router.push("/(tabs)/calendar" as any)}
            style={{
              flex: 1,
              backgroundColor: "#FFFFFF",
              borderRadius: 16,
              padding: 16,
              alignItems: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 2,
              borderWidth: 1,
              borderColor: "#FFF3E0",
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: "#FDF8EC",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 8,
              }}
            >
              <Ionicons name={"alarm-outline" as IoniconsName} size={22} color={colors.golden.DEFAULT} />
            </View>
            <Text style={{ fontSize: 28, fontWeight: "700", color: colors.navy.DEFAULT }}>
              {deadlines.length}
            </Text>
            <Text style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
              {t("home:deadlineCount")}
            </Text>
          </Pressable>
        </View>

        {/* Recent Cases */}
        <View style={{ marginTop: 24 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, marginBottom: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.navy.DEFAULT }}>
              {t("home:recentCases")}
            </Text>
            <Pressable onPress={() => router.push("/(tabs)/cases" as any)}>
              <Text style={{ fontSize: 13, color: colors.golden.DEFAULT, fontWeight: "600" }}>
                {t("home:viewAll")} →
              </Text>
            </Pressable>
          </View>

          {recentCases.length === 0 && !loading ? (
            <View style={{ paddingHorizontal: 16 }}>
              <Text style={{ fontSize: 14, color: "#888", fontStyle: "italic" }}>
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
                    onPress={() => router.push(("/(tabs)/cases/" + item.id) as any)}
                    style={{
                      width: 180,
                      backgroundColor: "#FFFFFF",
                      borderRadius: 16,
                      padding: 14,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.06,
                      shadowRadius: 8,
                      elevation: 2,
                      borderWidth: 1,
                      borderColor: "#FFF3E0",
                    }}
                  >
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        backgroundColor: "#FDF8EC",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: 10,
                      }}
                    >
                      <Ionicons name={"folder-outline" as IoniconsName} size={18} color={colors.golden.DEFAULT} />
                    </View>
                    <Text
                      numberOfLines={2}
                      style={{
                        fontSize: 13,
                        fontWeight: "600",
                        color: colors.navy.DEFAULT,
                        marginBottom: 4,
                        lineHeight: 18,
                      }}
                    >
                      {item.title}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={{ fontSize: 11, color: "#888", marginBottom: 8 }}
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
        <View style={{ marginTop: 24, paddingHorizontal: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: colors.navy.DEFAULT, marginBottom: 12 }}>
            {t("home:deadlinesThisWeek")}
          </Text>

          {deadlines.length === 0 && !loading ? (
            <Text style={{ fontSize: 14, color: "#888", fontStyle: "italic" }}>
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
                  onPress={() => router.push(("/(tabs)/calendar/event/" + item.id) as any)}
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: 14,
                    padding: 14,
                    marginBottom: 10,
                    flexDirection: "row",
                    alignItems: "center",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.04,
                    shadowRadius: 4,
                    elevation: 1,
                    borderWidth: 1,
                    borderColor: "#FFF3E0",
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
                      style={{ fontSize: 14, fontWeight: "600", color: colors.navy.DEFAULT, marginBottom: 2 }}
                    >
                      {item.title}
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <Ionicons name={"time-outline" as IoniconsName} size={12} color="#AAA" />
                      <Text style={{ fontSize: 11, color: "#888" }}>
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
                  <Ionicons name={"chevron-forward" as IoniconsName} size={16} color="#DDD" style={{ marginLeft: 4 }} />
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Speed-Dial FAB */}
      {fabOpen && (
        <>
          {/* Backdrop */}
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
          {/* Action Items */}
          {QUICK_ACTIONS.map((action, index) => (
            <Pressable
              key={action.labelKey}
              onPress={() => {
                setFabOpen(false);
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
                  backgroundColor: colors.golden[50],
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 10,
                }}
              >
                <Ionicons name={action.icon} size={18} color={colors.golden.DEFAULT} />
              </View>
              <Text style={{ fontSize: 14, fontWeight: "600", color: colors.navy.DEFAULT }}>
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
          backgroundColor: colors.golden.DEFAULT,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: colors.golden.DEFAULT,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.35,
          shadowRadius: 8,
          elevation: 6,
          zIndex: 10,
        }}
      >
        <Ionicons name={(fabOpen ? "close" : "add") as IoniconsName} size={28} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}
