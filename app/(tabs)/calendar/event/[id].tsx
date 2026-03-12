import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useServices } from "../../../../src/hooks/useServices";
import { colors } from "../../../../src/theme/tokens";
import type { CalendarEvent } from "../../../../src/services/types";
import { EVENT_TYPE_COLORS } from "../../../../src/services/types";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}.${m}.${y}`;
}

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation("calendar");
  const services = useServices();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [event, setEvent] = useState<CalendarEvent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const data = await services.calendarEvents.getEventById(id);
      setEvent(data);
      setLoading(false);
    })();
  }, [id, services]);

  if (loading || !event) {
    return (
      <>
        <Stack.Screen options={{ headerTitle: "" }} />
        <View style={{ flex: 1, backgroundColor: colors.cream.DEFAULT, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.golden.DEFAULT} />
        </View>
      </>
    );
  }

  const typeColor = EVENT_TYPE_COLORS[event.type];

  return (
    <>
      <Stack.Screen options={{ headerTitle: t("event.title") }} />
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.cream.DEFAULT }}
        contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        {/* Type Badge */}
        <View style={{ alignItems: "center", marginTop: 20, marginBottom: 16 }}>
          <View
            style={{
              backgroundColor: typeColor.bg,
              borderRadius: 20,
              paddingHorizontal: 20,
              paddingVertical: 8,
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
            }}
          >
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: typeColor.dot,
              }}
            />
            <Text style={{ fontSize: 14, fontWeight: "700", color: typeColor.text }}>
              {t("eventTypes." + event.type)}
            </Text>
          </View>
        </View>

        {/* Event Info Card */}
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 16,
            paddingHorizontal: 16,
            paddingVertical: 16,
            marginHorizontal: 16,
            marginBottom: 12,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 2,
            borderWidth: 1,
            borderColor: "#FFF3E0",
          }}
        >
          {/* Title */}
          <Text style={{ fontSize: 20, fontWeight: "700", color: colors.navy.DEFAULT, marginBottom: 16 }}>
            {event.title}
          </Text>

          {/* Date */}
          <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F5F0E8" }}>
            <View style={{ width: 32, alignItems: "center" }}>
              <Ionicons name={"calendar-outline" as IoniconsName} size={16} color="#AAA" />
            </View>
            <View>
              <Text style={{ fontSize: 12, color: "#AAA", marginBottom: 2 }}>{t("event.date")}</Text>
              <Text style={{ fontSize: 14, color: colors.navy.DEFAULT }}>{formatDate(event.date)}</Text>
            </View>
          </View>

          {/* Time */}
          <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F5F0E8" }}>
            <View style={{ width: 32, alignItems: "center" }}>
              <Ionicons name={"time-outline" as IoniconsName} size={16} color="#AAA" />
            </View>
            <View>
              <Text style={{ fontSize: 12, color: "#AAA", marginBottom: 2 }}>{t("event.time")}</Text>
              <Text style={{ fontSize: 14, color: colors.navy.DEFAULT }}>
                {event.startTime && event.endTime
                  ? `${event.startTime} - ${event.endTime}`
                  : t("allDay")}
              </Text>
            </View>
          </View>

          {/* Location */}
          {event.location && (
            <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F5F0E8" }}>
              <View style={{ width: 32, alignItems: "center" }}>
                <Ionicons name={"location-outline" as IoniconsName} size={16} color="#AAA" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, color: "#AAA", marginBottom: 2 }}>{t("event.location")}</Text>
                <Text style={{ fontSize: 14, color: colors.navy.DEFAULT }}>{event.location}</Text>
              </View>
            </View>
          )}

          {/* Notes */}
          {event.notes && (
            <View style={{ flexDirection: "row", alignItems: "flex-start", paddingVertical: 10 }}>
              <View style={{ width: 32, alignItems: "center", marginTop: 2 }}>
                <Ionicons name={"document-text-outline" as IoniconsName} size={16} color="#AAA" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, color: "#AAA", marginBottom: 2 }}>{t("event.notes")}</Text>
                <Text style={{ fontSize: 14, color: colors.navy.DEFAULT, lineHeight: 20 }}>{event.notes}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Linked Case */}
        {event.caseId && (
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 16,
              paddingHorizontal: 16,
              paddingVertical: 12,
              marginHorizontal: 16,
              marginBottom: 12,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.04,
              shadowRadius: 4,
              elevation: 1,
              borderWidth: 1,
              borderColor: "#FFF3E0",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
              <Ionicons name={"briefcase-outline" as IoniconsName} size={16} color={colors.navy.DEFAULT} style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.navy.DEFAULT }}>
                {t("event.linkedCase")}
              </Text>
            </View>
            <Pressable
              onPress={() => router.push(("/(tabs)/cases/" + event.caseId) as any)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 8,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: "600", color: colors.golden.DEFAULT, textDecorationLine: "underline" }}>
                  {event.caseNumber} - {event.caseName}
                </Text>
              </View>
              <Ionicons name={"chevron-forward" as IoniconsName} size={14} color="#DDD" />
            </Pressable>
          </View>
        )}
      </ScrollView>
    </>
  );
}
