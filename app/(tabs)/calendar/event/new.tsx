import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, Alert } from "react-native";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { useRouter, Stack } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useServices } from "../../../../src/hooks/useServices";
import { useCalendarStore } from "../../../../src/stores/calendar-store";
import { colors } from "../../../../src/theme/tokens";
import type { EventType, CaseSummary } from "../../../../src/services/types";
import { EVENT_TYPE_COLORS } from "../../../../src/services/types";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

const EVENT_TYPES: EventType[] = ["hearing", "meeting", "deadline"];

export default function NewEventScreen() {
  const { t } = useTranslation("calendar");
  const services = useServices();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { selectedDate } = useCalendarStore();

  const [type, setType] = useState<EventType | null>(null);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(selectedDate);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [loadingCases, setLoadingCases] = useState(true);

  const [errors, setErrors] = useState<{ type?: string; title?: string }>({});

  useEffect(() => {
    (async () => {
      const data = await services.cases.getCases();
      setCases(data);
      setLoadingCases(false);
    })();
  }, [services]);

  const validate = (): boolean => {
    const newErrors: { type?: string; title?: string } = {};
    if (!type) newErrors.type = t("form.required");
    if (!title.trim()) newErrors.title = t("form.required");
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate() || !type) return;
    setSaving(true);
    try {
      const selectedCase = cases.find((c) => c.id === selectedCaseId);
      await services.calendarEvents.createEvent({
        type,
        title: title.trim(),
        date,
        startTime: type !== "deadline" ? startTime : undefined,
        endTime: type !== "deadline" ? endTime : undefined,
        caseId: selectedCaseId ?? undefined,
        caseName: selectedCase?.title,
        caseNumber: selectedCase?.caseNumber,
        location: location.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      router.back();
    } catch {
      Alert.alert("Error", "Failed to create event");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerTitle: t("form.createTitle") }} />
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.cream.DEFAULT }}
        contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Event Type Selector */}
        <View style={{ marginHorizontal: 16, marginTop: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: colors.navy.DEFAULT, marginBottom: 10 }}>
            {t("event.type")} *
          </Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            {EVENT_TYPES.map((et) => {
              const isActive = type === et;
              const typeColor = EVENT_TYPE_COLORS[et];
              return (
                <Pressable
                  key={et}
                  onPress={() => {
                    setType(et);
                    setErrors((prev) => ({ ...prev, type: undefined }));
                  }}
                  style={{
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    paddingVertical: 16,
                    borderRadius: 12,
                    backgroundColor: isActive ? typeColor.bg : "#FFFFFF",
                    borderWidth: 2,
                    borderColor: isActive ? typeColor.dot : "#E5E5E5",
                  }}
                >
                  <View
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 6,
                      backgroundColor: typeColor.dot,
                      marginBottom: 6,
                    }}
                  />
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: isActive ? typeColor.text : colors.navy.DEFAULT,
                    }}
                  >
                    {t("eventTypes." + et)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {errors.type && (
            <Text style={{ fontSize: 12, color: "#C62828", marginTop: 4 }}>{errors.type}</Text>
          )}
        </View>

        {/* Title */}
        <View style={{ marginHorizontal: 16, marginTop: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: colors.navy.DEFAULT, marginBottom: 6 }}>
            {t("event.title")} *
          </Text>
          <TextInput
            value={title}
            onChangeText={(v) => {
              setTitle(v);
              setErrors((prev) => ({ ...prev, title: undefined }));
            }}
            placeholder={t("form.enterTitle")}
            placeholderTextColor="#BBB"
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 10,
              paddingHorizontal: 14,
              paddingVertical: 12,
              fontSize: 14,
              color: colors.navy.DEFAULT,
              borderWidth: 1,
              borderColor: errors.title ? "#C62828" : "#E5E5E5",
            }}
          />
          {errors.title && (
            <Text style={{ fontSize: 12, color: "#C62828", marginTop: 4 }}>{errors.title}</Text>
          )}
        </View>

        {/* Date */}
        <View style={{ marginHorizontal: 16, marginTop: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: colors.navy.DEFAULT, marginBottom: 6 }}>
            {t("event.date")}
          </Text>
          <TextInput
            value={date}
            onChangeText={setDate}
            placeholder={t("form.selectDate") + " (YYYY-MM-DD)"}
            placeholderTextColor="#BBB"
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 10,
              paddingHorizontal: 14,
              paddingVertical: 12,
              fontSize: 14,
              color: colors.navy.DEFAULT,
              borderWidth: 1,
              borderColor: "#E5E5E5",
            }}
          />
        </View>

        {/* Start / End Time (only for hearings and meetings) */}
        {type && type !== "deadline" && (
          <View style={{ flexDirection: "row", marginHorizontal: 16, marginTop: 16, gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.navy.DEFAULT, marginBottom: 6 }}>
                {t("event.startTime")}
              </Text>
              <TextInput
                value={startTime}
                onChangeText={setStartTime}
                placeholder="HH:mm"
                placeholderTextColor="#BBB"
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: 10,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  fontSize: 14,
                  color: colors.navy.DEFAULT,
                  borderWidth: 1,
                  borderColor: "#E5E5E5",
                }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.navy.DEFAULT, marginBottom: 6 }}>
                {t("event.endTime")}
              </Text>
              <TextInput
                value={endTime}
                onChangeText={setEndTime}
                placeholder="HH:mm"
                placeholderTextColor="#BBB"
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: 10,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  fontSize: 14,
                  color: colors.navy.DEFAULT,
                  borderWidth: 1,
                  borderColor: "#E5E5E5",
                }}
              />
            </View>
          </View>
        )}

        {/* Linked Case Picker */}
        <View style={{ marginHorizontal: 16, marginTop: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: colors.navy.DEFAULT, marginBottom: 6 }}>
            {t("event.linkedCase")}
          </Text>
          {loadingCases ? (
            <ActivityIndicator color={colors.golden.DEFAULT} style={{ paddingVertical: 12 }} />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              <Pressable
                onPress={() => setSelectedCaseId(null)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 10,
                  backgroundColor: !selectedCaseId ? colors.golden[50] : "#FFFFFF",
                  borderWidth: 1,
                  borderColor: !selectedCaseId ? colors.golden.DEFAULT : "#E5E5E5",
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: !selectedCaseId ? colors.golden.DEFAULT : "#888",
                  }}
                >
                  --
                </Text>
              </Pressable>
              {cases.map((c) => {
                const isSelected = selectedCaseId === c.id;
                return (
                  <Pressable
                    key={c.id}
                    onPress={() => setSelectedCaseId(c.id)}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      borderRadius: 10,
                      backgroundColor: isSelected ? colors.golden[50] : "#FFFFFF",
                      borderWidth: 1,
                      borderColor: isSelected ? colors.golden.DEFAULT : "#E5E5E5",
                      maxWidth: 200,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "600",
                        color: isSelected ? colors.golden.DEFAULT : colors.navy.DEFAULT,
                      }}
                      numberOfLines={1}
                    >
                      {c.caseNumber}
                    </Text>
                    <Text
                      style={{ fontSize: 11, color: "#AAA", marginTop: 2 }}
                      numberOfLines={1}
                    >
                      {c.title}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* Location */}
        <View style={{ marginHorizontal: 16, marginTop: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: colors.navy.DEFAULT, marginBottom: 6 }}>
            {t("event.location")}
          </Text>
          <TextInput
            value={location}
            onChangeText={setLocation}
            placeholder={t("form.enterLocation")}
            placeholderTextColor="#BBB"
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 10,
              paddingHorizontal: 14,
              paddingVertical: 12,
              fontSize: 14,
              color: colors.navy.DEFAULT,
              borderWidth: 1,
              borderColor: "#E5E5E5",
            }}
          />
        </View>

        {/* Notes */}
        <View style={{ marginHorizontal: 16, marginTop: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: colors.navy.DEFAULT, marginBottom: 6 }}>
            {t("event.notes")}
          </Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder={t("form.enterNotes")}
            placeholderTextColor="#BBB"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 10,
              paddingHorizontal: 14,
              paddingVertical: 12,
              fontSize: 14,
              color: colors.navy.DEFAULT,
              borderWidth: 1,
              borderColor: "#E5E5E5",
              minHeight: 100,
            }}
          />
        </View>

        {/* Action Buttons */}
        <View style={{ marginHorizontal: 16, marginTop: 24, gap: 10 }}>
          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={{
              backgroundColor: colors.golden.DEFAULT,
              borderRadius: 12,
              paddingVertical: 14,
              alignItems: "center",
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#FFFFFF" }}>
                {t("form.save")}
              </Text>
            )}
          </Pressable>
          <Pressable
            onPress={() => router.back()}
            style={{
              borderRadius: 12,
              paddingVertical: 14,
              alignItems: "center",
              borderWidth: 1,
              borderColor: "#E5E5E5",
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "600", color: "#888" }}>
              {t("form.cancel")}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </>
  );
}
