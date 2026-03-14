import { View, Text, ScrollView, TextInput, Pressable, ActivityIndicator, Alert, Platform } from "react-native";
import { useTranslation } from "react-i18next";
import { useEffect, useState, useCallback } from "react";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useServices } from "../../../../src/hooks/useServices";
import { colors } from "../../../../src/theme/tokens";
import type { CalendarEvent, EventType, CaseSummary, RecurrencePattern } from "../../../../src/services/types";
import { EVENT_TYPE_COLORS } from "../../../../src/services/types";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

const EVENT_TYPES: EventType[] = ["hearing", "meeting", "deadline"];
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_VALUES = [1, 2, 3, 4, 5, 6, 0];
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}.${m}.${y}`;
}

function formatRecurrenceDescription(rec: RecurrencePattern): string {
  const interval = rec.interval > 1 ? `every ${rec.interval} ` : "";
  if (rec.type === "daily") return `Repeats ${interval}daily`;
  if (rec.type === "monthly") return `Repeats ${interval}monthly`;
  if (rec.type === "weekly") {
    const days = rec.daysOfWeek?.map((d) => DAY_NAMES[d]).join(", ") ?? "";
    return `Repeats ${interval}weekly${days ? ` on ${days}` : ""}`;
  }
  return "Recurring";
}

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation("calendar");
  const services = useServices();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [event, setEvent] = useState<CalendarEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

  // Edit form state
  const [editType, setEditType] = useState<EventType>("hearing");
  const [editTitle, setEditTitle] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editStartTime, setEditStartTime] = useState("09:00");
  const [editEndTime, setEditEndTime] = useState("10:00");
  const [editLocation, setEditLocation] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editCaseId, setEditCaseId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Edit pickers
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  // Conflict detection in edit mode
  const [conflicts, setConflicts] = useState<CalendarEvent[]>([]);

  // Recurrence state for edit
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<RecurrencePattern['type']>("weekly");
  const [recurrenceInterval, setRecurrenceInterval] = useState("1");
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("");
  const [showRecurrenceEndDatePicker, setShowRecurrenceEndDatePicker] = useState(false);
  const [selectedDaysOfWeek, setSelectedDaysOfWeek] = useState<number[]>([]);

  // Cases for picker
  const [cases, setCases] = useState<CaseSummary[]>([]);

  const parseDate = (str: string): Date => {
    const [y, m, d] = str.split("-").map(Number);
    return new Date(y, m - 1, d);
  };

  const parseTime = (str: string): Date => {
    const [h, m] = str.split(":").map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  };

  const timeToMinutes = (str: string): number => {
    const [h, m] = str.split(":").map(Number);
    return h * 60 + m;
  };

  const minutesToTime = (mins: number): string => {
    const clamped = Math.max(0, Math.min(mins, 23 * 60 + 59));
    const h = String(Math.floor(clamped / 60)).padStart(2, "0");
    const m = String(clamped % 60).padStart(2, "0");
    return `${h}:${m}`;
  };

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [data, casesData] = await Promise.all([
        services.calendarEvents.getEventById(id),
        services.cases.getCases(),
      ]);
      setEvent(data);
      setCases(casesData);
      setLoading(false);
    })();
  }, [id, services]);

  const enterEditMode = () => {
    if (!event) return;
    setEditType(event.type);
    setEditTitle(event.title);
    setEditDate(event.date);
    setEditStartTime(event.startTime ?? "09:00");
    setEditEndTime(event.endTime ?? "10:00");
    setEditLocation(event.location ?? "");
    setEditNotes(event.notes ?? "");
    setEditCaseId(event.caseId ?? null);
    if (event.recurrence) {
      setIsRecurring(true);
      setRecurrenceType(event.recurrence.type);
      setRecurrenceInterval(String(event.recurrence.interval));
      setRecurrenceEndDate(event.recurrence.endDate ?? "");
      setSelectedDaysOfWeek(event.recurrence.daysOfWeek ?? []);
    } else {
      setIsRecurring(false);
      setRecurrenceType("weekly");
      setRecurrenceInterval("1");
      setRecurrenceEndDate("");
      setSelectedDaysOfWeek([]);
    }
    setConflicts([]);
    setEditMode(true);
  };

  const cancelEdit = () => {
    setEditMode(false);
    setConflicts([]);
  };

  // Check conflicts in edit mode
  const checkConflicts = useCallback(async () => {
    if (!editDate || !id) return;
    try {
      const results = await services.calendarEvents.getConflictingEvents(
        editDate,
        editType !== "deadline" ? editStartTime : undefined,
        editType !== "deadline" ? editEndTime : undefined,
        id
      );
      setConflicts(results);
    } catch {
      setConflicts([]);
    }
  }, [editDate, editStartTime, editEndTime, editType, id, services]);

  useEffect(() => {
    if (!editMode) return;
    const timer = setTimeout(() => {
      checkConflicts();
    }, 300);
    return () => clearTimeout(timer);
  }, [checkConflicts, editMode]);

  const handleSave = async () => {
    if (!id || !editTitle.trim()) return;
    setSaving(true);
    try {
      const selectedCase = cases.find((c) => c.id === editCaseId);
      const recurrence: RecurrencePattern | undefined = isRecurring
        ? {
            type: recurrenceType,
            interval: parseInt(recurrenceInterval) || 1,
            endDate: recurrenceEndDate || undefined,
            daysOfWeek: recurrenceType === "weekly" ? selectedDaysOfWeek : undefined,
          }
        : undefined;

      const updated = await services.calendarEvents.updateEvent(id, {
        type: editType,
        title: editTitle.trim(),
        date: editDate,
        startTime: editType !== "deadline" ? editStartTime : undefined,
        endTime: editType !== "deadline" ? editEndTime : undefined,
        caseId: editCaseId ?? undefined,
        caseName: selectedCase?.title,
        caseNumber: selectedCase?.caseNumber,
        location: editLocation.trim() || undefined,
        notes: editNotes.trim() || undefined,
        recurrence,
      });
      if (updated) {
        setEvent(updated);
        setEditMode(false);
      }
    } catch {
      Alert.alert("Error", "Failed to update event");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      t("edit.confirmDelete"),
      t("edit.deleteConfirmMessage"),
      [
        { text: t("form.cancel"), style: "cancel" },
        {
          text: t("edit.deleteEvent"),
          style: "destructive",
          onPress: async () => {
            if (!id) return;
            await services.calendarEvents.deleteEvent(id);
            router.back();
          },
        },
      ]
    );
  };

  const toggleDayOfWeek = (day: number) => {
    setSelectedDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

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

  // EDIT MODE
  if (editMode) {
    return (
      <>
        <Stack.Screen
          options={{
            headerTitle: t("edit.editEvent"),
            headerRight: () => (
              <Pressable onPress={cancelEdit} style={{ marginRight: 4 }}>
                <Ionicons name={"close" as IoniconsName} size={24} color="#FFFFFF" />
              </Pressable>
            ),
          }}
        />
        <ScrollView
          style={{ flex: 1, backgroundColor: colors.cream.DEFAULT }}
          contentContainerStyle={{ paddingBottom: 40 + insets.bottom }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Event Type */}
          <View style={{ marginHorizontal: 16, marginTop: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.navy.DEFAULT, marginBottom: 10 }}>
              {t("event.type")}
            </Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              {EVENT_TYPES.map((et) => {
                const isActive = editType === et;
                const etColor = EVENT_TYPE_COLORS[et];
                return (
                  <Pressable
                    key={et}
                    onPress={() => setEditType(et)}
                    style={{
                      flex: 1,
                      alignItems: "center",
                      paddingVertical: 12,
                      borderRadius: 12,
                      backgroundColor: isActive ? etColor.bg : "#FFFFFF",
                      borderWidth: 2,
                      borderColor: isActive ? etColor.dot : "#E5E5E5",
                    }}
                  >
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: etColor.dot, marginBottom: 4 }} />
                    <Text style={{ fontSize: 11, fontWeight: "600", color: isActive ? etColor.text : colors.navy.DEFAULT }}>
                      {t("eventTypes." + et)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Title */}
          <View style={{ marginHorizontal: 16, marginTop: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.navy.DEFAULT, marginBottom: 6 }}>
              {t("event.title")}
            </Text>
            <TextInput
              value={editTitle}
              onChangeText={setEditTitle}
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

          {/* Date */}
          <View style={{ marginHorizontal: 16, marginTop: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.navy.DEFAULT, marginBottom: 6 }}>
              {t("event.date")}
            </Text>
            <Pressable
              onPress={() => setShowDatePicker(true)}
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 10,
                paddingHorizontal: 14,
                paddingVertical: 12,
                borderWidth: 1,
                borderColor: "#E5E5E5",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text style={{ fontSize: 14, color: colors.navy.DEFAULT }}>{formatDate(editDate)}</Text>
              <Ionicons name={"calendar-outline" as IoniconsName} size={18} color="#AAA" />
            </Pressable>
            {showDatePicker && (
              <DateTimePicker
                value={parseDate(editDate)}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={(ev: DateTimePickerEvent, selected?: Date) => {
                  setShowDatePicker(Platform.OS === "ios");
                  if (selected) {
                    const y = selected.getFullYear();
                    const m = String(selected.getMonth() + 1).padStart(2, "0");
                    const d = String(selected.getDate()).padStart(2, "0");
                    setEditDate(`${y}-${m}-${d}`);
                  }
                }}
              />
            )}
          </View>

          {/* Time */}
          {editType !== "deadline" && (
            <View style={{ flexDirection: "row", marginHorizontal: 16, marginTop: 16, gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: colors.navy.DEFAULT, marginBottom: 6 }}>
                  {t("event.startTime")}
                </Text>
                <Pressable
                  onPress={() => setShowStartTimePicker(true)}
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    borderWidth: 1,
                    borderColor: "#E5E5E5",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Text style={{ fontSize: 14, color: colors.navy.DEFAULT }}>{editStartTime}</Text>
                  <Ionicons name={"time-outline" as IoniconsName} size={18} color="#AAA" />
                </Pressable>
                {showStartTimePicker && (
                  <DateTimePicker
                    value={parseTime(editStartTime)}
                    mode="time"
                    is24Hour
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={(ev: DateTimePickerEvent, selected?: Date) => {
                      setShowStartTimePicker(Platform.OS === "ios");
                      if (selected) {
                        const h = String(selected.getHours()).padStart(2, "0");
                        const m = String(selected.getMinutes()).padStart(2, "0");
                        const newStart = `${h}:${m}`;
                        const duration = timeToMinutes(editEndTime) - timeToMinutes(editStartTime);
                        setEditStartTime(newStart);
                        setEditEndTime(minutesToTime(timeToMinutes(newStart) + duration));
                      }
                    }}
                  />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: colors.navy.DEFAULT, marginBottom: 6 }}>
                  {t("event.endTime")}
                </Text>
                <Pressable
                  onPress={() => setShowEndTimePicker(true)}
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    borderWidth: 1,
                    borderColor: "#E5E5E5",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Text style={{ fontSize: 14, color: colors.navy.DEFAULT }}>{editEndTime}</Text>
                  <Ionicons name={"time-outline" as IoniconsName} size={18} color="#AAA" />
                </Pressable>
                {showEndTimePicker && (
                  <DateTimePicker
                    value={parseTime(editEndTime)}
                    mode="time"
                    is24Hour
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={(ev: DateTimePickerEvent, selected?: Date) => {
                      setShowEndTimePicker(Platform.OS === "ios");
                      if (selected) {
                        const h = String(selected.getHours()).padStart(2, "0");
                        const m = String(selected.getMinutes()).padStart(2, "0");
                        setEditEndTime(`${h}:${m}`);
                      }
                    }}
                  />
                )}
              </View>
            </View>
          )}

          {/* Conflict Warning in edit mode */}
          {conflicts.length > 0 && (
            <View
              style={{
                marginHorizontal: 16,
                marginTop: 12,
                backgroundColor: "#FFF8E1",
                borderRadius: 10,
                padding: 12,
                borderWidth: 1,
                borderColor: "#FFE082",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                <Ionicons name={"warning-outline" as IoniconsName} size={18} color="#F9A825" style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 13, fontWeight: "700", color: "#F57F17" }}>
                  {t("conflict.conflictWarning")}
                </Text>
              </View>
              {conflicts.map((c) => (
                <View key={c.id} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 4, marginLeft: 26 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: EVENT_TYPE_COLORS[c.type].dot, marginRight: 8 }} />
                  <Text style={{ fontSize: 12, color: "#795548", flex: 1 }} numberOfLines={1}>
                    {c.title}
                  </Text>
                  <Text style={{ fontSize: 11, color: "#AAA", marginLeft: 8 }}>
                    {c.startTime && c.endTime ? `${c.startTime}-${c.endTime}` : t("allDay")}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Recurrence Section in Edit */}
          <View style={{ marginHorizontal: 16, marginTop: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.navy.DEFAULT, marginBottom: 10 }}>
              {t("recurrence.recurrence")}
            </Text>
            <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
              <Pressable
                onPress={() => setIsRecurring(false)}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 10,
                  backgroundColor: !isRecurring ? colors.golden[50] : "#FFFFFF",
                  borderWidth: 1,
                  borderColor: !isRecurring ? colors.golden.DEFAULT : "#E5E5E5",
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: "600", color: !isRecurring ? colors.golden.DEFAULT : "#888" }}>
                  {t("recurrence.noRecurrence")}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setIsRecurring(true)}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 10,
                  backgroundColor: isRecurring ? colors.golden[50] : "#FFFFFF",
                  borderWidth: 1,
                  borderColor: isRecurring ? colors.golden.DEFAULT : "#E5E5E5",
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <Ionicons name={"repeat-outline" as IoniconsName} size={16} color={isRecurring ? colors.golden.DEFAULT : "#888"} />
                <Text style={{ fontSize: 12, fontWeight: "600", color: isRecurring ? colors.golden.DEFAULT : "#888" }}>
                  Recurring
                </Text>
              </Pressable>
            </View>

            {isRecurring && (
              <>
                <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
                  {(["daily", "weekly", "monthly"] as RecurrencePattern['type'][]).map((rt) => {
                    const isActive = recurrenceType === rt;
                    return (
                      <Pressable
                        key={rt}
                        onPress={() => setRecurrenceType(rt)}
                        style={{
                          flex: 1,
                          paddingVertical: 10,
                          borderRadius: 8,
                          backgroundColor: isActive ? colors.navy.DEFAULT : "#FFFFFF",
                          borderWidth: 1,
                          borderColor: isActive ? colors.navy.DEFAULT : "#E5E5E5",
                          alignItems: "center",
                        }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: "600", color: isActive ? "#FFFFFF" : colors.navy.DEFAULT }}>
                          {t("recurrence." + rt)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 10 }}>
                  <Text style={{ fontSize: 13, color: colors.navy.DEFAULT }}>{t("recurrence.interval")}</Text>
                  <TextInput
                    value={recurrenceInterval}
                    onChangeText={setRecurrenceInterval}
                    keyboardType="numeric"
                    maxLength={2}
                    style={{
                      backgroundColor: "#FFFFFF",
                      borderRadius: 8,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      fontSize: 14,
                      color: colors.navy.DEFAULT,
                      borderWidth: 1,
                      borderColor: "#E5E5E5",
                      width: 60,
                      textAlign: "center",
                    }}
                  />
                </View>

                {recurrenceType === "weekly" && (
                  <View style={{ marginBottom: 12 }}>
                    <Text style={{ fontSize: 13, color: colors.navy.DEFAULT, marginBottom: 8 }}>{t("recurrence.daysOfWeek")}</Text>
                    <View style={{ flexDirection: "row", gap: 6 }}>
                      {DAY_LABELS.map((label, index) => {
                        const dayValue = DAY_VALUES[index];
                        const isActive = selectedDaysOfWeek.includes(dayValue);
                        return (
                          <Pressable
                            key={label}
                            onPress={() => toggleDayOfWeek(dayValue)}
                            style={{
                              flex: 1,
                              paddingVertical: 8,
                              borderRadius: 8,
                              backgroundColor: isActive ? colors.golden.DEFAULT : "#FFFFFF",
                              borderWidth: 1,
                              borderColor: isActive ? colors.golden.DEFAULT : "#E5E5E5",
                              alignItems: "center",
                            }}
                          >
                            <Text style={{ fontSize: 11, fontWeight: "600", color: isActive ? "#FFFFFF" : "#888" }}>
                              {label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                )}

                <View style={{ marginBottom: 4 }}>
                  <Text style={{ fontSize: 13, color: colors.navy.DEFAULT, marginBottom: 6 }}>{t("recurrence.endDate")}</Text>
                  <Pressable
                    onPress={() => setShowRecurrenceEndDatePicker(true)}
                    style={{
                      backgroundColor: "#FFFFFF",
                      borderRadius: 10,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      borderWidth: 1,
                      borderColor: "#E5E5E5",
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text style={{ fontSize: 14, color: recurrenceEndDate ? colors.navy.DEFAULT : "#BBB" }}>
                      {recurrenceEndDate ? formatDate(recurrenceEndDate) : "No end date"}
                    </Text>
                    <Ionicons name={"calendar-outline" as IoniconsName} size={18} color="#AAA" />
                  </Pressable>
                  {showRecurrenceEndDatePicker && (
                    <DateTimePicker
                      value={recurrenceEndDate ? parseDate(recurrenceEndDate) : new Date()}
                      mode="date"
                      display={Platform.OS === "ios" ? "spinner" : "default"}
                      onChange={(ev: DateTimePickerEvent, selected?: Date) => {
                        setShowRecurrenceEndDatePicker(Platform.OS === "ios");
                        if (selected) {
                          const y = selected.getFullYear();
                          const m = String(selected.getMonth() + 1).padStart(2, "0");
                          const d = String(selected.getDate()).padStart(2, "0");
                          setRecurrenceEndDate(`${y}-${m}-${d}`);
                        }
                      }}
                    />
                  )}
                </View>
              </>
            )}
          </View>

          {/* Location */}
          <View style={{ marginHorizontal: 16, marginTop: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.navy.DEFAULT, marginBottom: 6 }}>
              {t("event.location")}
            </Text>
            <TextInput
              value={editLocation}
              onChangeText={setEditLocation}
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
              value={editNotes}
              onChangeText={setEditNotes}
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
                minHeight: 80,
              }}
            />
          </View>

          {/* Linked Case */}
          <View style={{ marginHorizontal: 16, marginTop: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.navy.DEFAULT, marginBottom: 6 }}>
              {t("event.linkedCase")}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              <Pressable
                onPress={() => setEditCaseId(null)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 10,
                  backgroundColor: !editCaseId ? colors.golden[50] : "#FFFFFF",
                  borderWidth: 1,
                  borderColor: !editCaseId ? colors.golden.DEFAULT : "#E5E5E5",
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: "600", color: !editCaseId ? colors.golden.DEFAULT : "#888" }}>--</Text>
              </Pressable>
              {cases.map((c) => {
                const isSelected = editCaseId === c.id;
                return (
                  <Pressable
                    key={c.id}
                    onPress={() => setEditCaseId(c.id)}
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
                    <Text style={{ fontSize: 12, fontWeight: "600", color: isSelected ? colors.golden.DEFAULT : colors.navy.DEFAULT }} numberOfLines={1}>
                      {c.caseNumber}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Save / Cancel buttons */}
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
                <Text style={{ fontSize: 16, fontWeight: "700", color: "#FFFFFF" }}>{t("edit.save")}</Text>
              )}
            </Pressable>
            <Pressable
              onPress={cancelEdit}
              style={{
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: "center",
                borderWidth: 1,
                borderColor: "#E5E5E5",
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "600", color: "#888" }}>{t("form.cancel")}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </>
    );
  }

  // VIEW MODE
  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: t("event.title"),
          headerRight: () => (
            <Pressable onPress={enterEditMode} style={{ marginRight: 4 }}>
              <Ionicons name={"create-outline" as IoniconsName} size={22} color="#FFFFFF" />
            </Pressable>
          ),
        }}
      />
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

          {/* Recurrence */}
          {event.recurrence && (
            <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F5F0E8" }}>
              <View style={{ width: 32, alignItems: "center" }}>
                <Ionicons name={"repeat-outline" as IoniconsName} size={16} color={colors.golden.DEFAULT} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, color: "#AAA", marginBottom: 2 }}>{t("recurrence.recurrence")}</Text>
                <Text style={{ fontSize: 14, color: colors.navy.DEFAULT }}>
                  {formatRecurrenceDescription(event.recurrence)}
                </Text>
                {event.recurrence.endDate && (
                  <Text style={{ fontSize: 12, color: "#AAA", marginTop: 2 }}>
                    Until {formatDate(event.recurrence.endDate)}
                  </Text>
                )}
              </View>
            </View>
          )}

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

        {/* Delete Button */}
        <Pressable
          onPress={handleDelete}
          style={{
            marginHorizontal: 16,
            marginTop: 12,
            borderRadius: 12,
            paddingVertical: 14,
            alignItems: "center",
            borderWidth: 1,
            borderColor: "#FFCDD2",
            backgroundColor: "#FFF5F5",
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: "600", color: "#E53935" }}>
            {t("edit.deleteEvent")}
          </Text>
        </Pressable>
      </ScrollView>
    </>
  );
}
