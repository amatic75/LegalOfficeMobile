import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, Alert, Platform } from "react-native";
import { useTranslation } from "react-i18next";
import { useEffect, useState, useCallback } from "react";
import { useRouter, Stack } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useServices } from "../../../../src/hooks/useServices";
import { useCalendarStore } from "../../../../src/stores/calendar-store";
import { colors } from "../../../../src/theme/tokens";
import type { EventType, CaseSummary, CalendarEvent, RecurrencePattern } from "../../../../src/services/types";
import { EVENT_TYPE_COLORS } from "../../../../src/services/types";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

const EVENT_TYPES: EventType[] = ["hearing", "meeting", "deadline"];
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_VALUES = [1, 2, 3, 4, 5, 6, 0]; // Monday=1 ... Sunday=0

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
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  // Conflict detection state
  const [conflicts, setConflicts] = useState<CalendarEvent[]>([]);
  const [checkingConflicts, setCheckingConflicts] = useState(false);

  // Recurrence state
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<RecurrencePattern['type']>("weekly");
  const [recurrenceInterval, setRecurrenceInterval] = useState("1");
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("");
  const [showRecurrenceEndDatePicker, setShowRecurrenceEndDatePicker] = useState(false);
  const [selectedDaysOfWeek, setSelectedDaysOfWeek] = useState<number[]>([]);

  // Parse "YYYY-MM-DD" to Date
  const parseDate = (str: string): Date => {
    const [y, m, d] = str.split("-").map(Number);
    return new Date(y, m - 1, d);
  };

  // Parse "HH:mm" to Date (for picker)
  const parseTime = (str: string): Date => {
    const [h, m] = str.split(":").map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  };

  // Format Date to "DD.MM.YYYY" for display
  const formatDateDisplay = (str: string): string => {
    const [y, m, d] = str.split("-");
    return `${d}.${m}.${y}`;
  };

  // Convert "HH:mm" to total minutes
  const timeToMinutes = (str: string): number => {
    const [h, m] = str.split(":").map(Number);
    return h * 60 + m;
  };

  // Convert total minutes to "HH:mm"
  const minutesToTime = (mins: number): string => {
    const clamped = Math.max(0, Math.min(mins, 23 * 60 + 59));
    const h = String(Math.floor(clamped / 60)).padStart(2, "0");
    const m = String(clamped % 60).padStart(2, "0");
    return `${h}:${m}`;
  };

  useEffect(() => {
    (async () => {
      const data = await services.cases.getCases();
      setCases(data);
      setLoadingCases(false);
    })();
  }, [services]);

  // Default selected day of week based on selected date
  useEffect(() => {
    const d = parseDate(date);
    setSelectedDaysOfWeek([d.getDay()]);
  }, [date]);

  // Check for conflicts when date/time changes
  const checkConflicts = useCallback(async () => {
    if (!date) return;
    setCheckingConflicts(true);
    try {
      const results = await services.calendarEvents.getConflictingEvents(
        date,
        type !== "deadline" ? startTime : undefined,
        type !== "deadline" ? endTime : undefined
      );
      setConflicts(results);
    } catch {
      setConflicts([]);
    } finally {
      setCheckingConflicts(false);
    }
  }, [date, startTime, endTime, type, services]);

  useEffect(() => {
    const timer = setTimeout(() => {
      checkConflicts();
    }, 300);
    return () => clearTimeout(timer);
  }, [checkConflicts]);

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
      const recurrence: RecurrencePattern | undefined = isRecurring
        ? {
            type: recurrenceType,
            interval: parseInt(recurrenceInterval) || 1,
            endDate: recurrenceEndDate || undefined,
            daysOfWeek: recurrenceType === "weekly" ? selectedDaysOfWeek : undefined,
          }
        : undefined;

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
        recurrence,
      });
      router.back();
    } catch {
      Alert.alert("Error", "Failed to create event");
    } finally {
      setSaving(false);
    }
  };

  const toggleDayOfWeek = (day: number) => {
    setSelectedDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
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
            <Text style={{ fontSize: 14, color: colors.navy.DEFAULT }}>
              {formatDateDisplay(date)}
            </Text>
            <Ionicons name={"calendar-outline" as IoniconsName} size={18} color="#AAA" />
          </Pressable>
          {showDatePicker && (
            <DateTimePicker
              value={parseDate(date)}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={(event: DateTimePickerEvent, selected?: Date) => {
                setShowDatePicker(Platform.OS === "ios");
                if (selected) {
                  const y = selected.getFullYear();
                  const m = String(selected.getMonth() + 1).padStart(2, "0");
                  const d = String(selected.getDate()).padStart(2, "0");
                  setDate(`${y}-${m}-${d}`);
                }
              }}
            />
          )}
        </View>

        {/* Start / End Time (only for hearings and meetings) */}
        {type && type !== "deadline" && (
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
                <Text style={{ fontSize: 14, color: colors.navy.DEFAULT }}>{startTime}</Text>
                <Ionicons name={"time-outline" as IoniconsName} size={18} color="#AAA" />
              </Pressable>
              {showStartTimePicker && (
                <DateTimePicker
                  value={parseTime(startTime)}
                  mode="time"
                  is24Hour
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={(event: DateTimePickerEvent, selected?: Date) => {
                    setShowStartTimePicker(Platform.OS === "ios");
                    if (selected) {
                      const h = String(selected.getHours()).padStart(2, "0");
                      const m = String(selected.getMinutes()).padStart(2, "0");
                      const newStart = `${h}:${m}`;
                      const duration = timeToMinutes(endTime) - timeToMinutes(startTime);
                      setStartTime(newStart);
                      setEndTime(minutesToTime(timeToMinutes(newStart) + duration));
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
                <Text style={{ fontSize: 14, color: colors.navy.DEFAULT }}>{endTime}</Text>
                <Ionicons name={"time-outline" as IoniconsName} size={18} color="#AAA" />
              </Pressable>
              {showEndTimePicker && (
                <DateTimePicker
                  value={parseTime(endTime)}
                  mode="time"
                  is24Hour
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={(event: DateTimePickerEvent, selected?: Date) => {
                    setShowEndTimePicker(Platform.OS === "ios");
                    if (selected) {
                      const h = String(selected.getHours()).padStart(2, "0");
                      const m = String(selected.getMinutes()).padStart(2, "0");
                      setEndTime(`${h}:${m}`);
                    }
                  }}
                />
              )}
            </View>
          </View>
        )}

        {/* Conflict Warning */}
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

        {/* Recurrence Section */}
        <View style={{ marginHorizontal: 16, marginTop: 16 }}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: colors.navy.DEFAULT, marginBottom: 10 }}>
            {t("recurrence.recurrence")}
          </Text>

          {/* Recurrence Toggle */}
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
              {/* Recurrence Type */}
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

              {/* Interval */}
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
                <Text style={{ fontSize: 13, color: "#888" }}>
                  {recurrenceType === "daily" ? "day(s)" : recurrenceType === "weekly" ? "week(s)" : "month(s)"}
                </Text>
              </View>

              {/* Days of Week (weekly only) */}
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

              {/* End Date */}
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
                    {recurrenceEndDate ? formatDateDisplay(recurrenceEndDate) : "No end date"}
                  </Text>
                  <Ionicons name={"calendar-outline" as IoniconsName} size={18} color="#AAA" />
                </Pressable>
                {showRecurrenceEndDatePicker && (
                  <DateTimePicker
                    value={recurrenceEndDate ? parseDate(recurrenceEndDate) : new Date()}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={(event: DateTimePickerEvent, selected?: Date) => {
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
