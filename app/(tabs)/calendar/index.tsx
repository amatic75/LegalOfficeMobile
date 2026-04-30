import { View, Text, Pressable, ActivityIndicator, SectionList, FlatList } from "react-native";
import { useTranslation } from "react-i18next";
import { useState, useMemo, useCallback } from "react";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Calendar, CalendarProvider, ExpandableCalendar, AgendaList } from "react-native-calendars";
import { Positions } from "react-native-calendars/src/expandableCalendar";
import { useServices } from "../../../src/hooks/useServices";
import { useCalendarStore } from "../../../src/stores/calendar-store";
import { colors } from "../../../src/theme/tokens";
import type { CalendarEvent } from "../../../src/services/types";
import { EVENT_TYPE_COLORS, eventsToMarkedDates } from "../../../src/services/types";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

const calendarTheme = {
  todayTextColor: colors.golden.DEFAULT,
  selectedDayBackgroundColor: colors.golden.DEFAULT,
  selectedDayTextColor: '#FFFFFF',
  arrowColor: colors.navy.DEFAULT,
  monthTextColor: colors.navy.DEFAULT,
  calendarBackground: colors.cream.DEFAULT,
  textSectionTitleColor: colors.navy.DEFAULT,
  dayTextColor: colors.navy.DEFAULT,
  textDisabledColor: '#CCCCCC',
  dotColor: colors.golden.DEFAULT,
  selectedDotColor: '#FFFFFF',
};

function EventCard({ event, onPress }: { event: CalendarEvent; onPress: () => void }) {
  const { t } = useTranslation("calendar");
  const typeColor = EVENT_TYPE_COLORS[event.type];

  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        marginHorizontal: 16,
        marginVertical: 4,
        paddingVertical: 12,
        paddingHorizontal: 14,
        flexDirection: "row",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
        borderWidth: 1,
        borderColor: "#FFF3E0",
      }}
    >
      <View
        style={{
          width: 4,
          height: 44,
          borderRadius: 2,
          backgroundColor: typeColor.dot,
          marginRight: 12,
        }}
      />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: "600", color: colors.navy.DEFAULT }} numberOfLines={1}>
          {event.title}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4, gap: 8 }}>
          <View
            style={{
              backgroundColor: typeColor.bg,
              borderRadius: 6,
              paddingHorizontal: 6,
              paddingVertical: 2,
            }}
          >
            <Text style={{ fontSize: 10, fontWeight: "600", color: typeColor.text }}>
              {t("eventTypes." + event.type)}
            </Text>
          </View>
          <Text style={{ fontSize: 12, color: "#888" }}>
            {event.startTime && event.endTime
              ? `${event.startTime} - ${event.endTime}`
              : t("allDay")}
          </Text>
          {event.recurrence && (
            <Ionicons name={"repeat-outline" as IoniconsName} size={14} color={colors.golden.DEFAULT} />
          )}
        </View>
        {event.caseName && (
          <Text style={{ fontSize: 12, color: "#AAA", marginTop: 3 }} numberOfLines={1}>
            {event.caseNumber} - {event.caseName}
          </Text>
        )}
      </View>
      <Ionicons name={"chevron-forward" as IoniconsName} size={16} color="#DDD" />
    </Pressable>
  );
}

function ViewModeToggle() {
  const { t } = useTranslation("calendar");
  const { viewMode, setViewMode } = useCalendarStore();
  const modes = ["month", "week", "agenda"] as const;

  return (
    <View
      style={{
        flexDirection: "row",
        marginHorizontal: 16,
        marginTop: 12,
        marginBottom: 8,
        backgroundColor: "#FFFFFF",
        borderRadius: 10,
        padding: 3,
        borderWidth: 1,
        borderColor: "#FFF3E0",
      }}
    >
      {modes.map((mode) => {
        const isActive = viewMode === mode;
        return (
          <Pressable
            key={mode}
            onPress={() => setViewMode(mode)}
            style={{
              flex: 1,
              paddingVertical: 8,
              borderRadius: 8,
              alignItems: "center",
              backgroundColor: isActive ? colors.golden.DEFAULT : "transparent",
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: isActive ? "#FFFFFF" : colors.navy.DEFAULT,
              }}
            >
              {t("views." + mode)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function MonthView({
  events,
  selectedDate,
  onSelectDate,
  onEventPress,
}: {
  events: CalendarEvent[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onEventPress: (event: CalendarEvent) => void;
}) {
  const { t } = useTranslation("calendar");
  const markedDates = useMemo(() => eventsToMarkedDates(events, selectedDate), [events, selectedDate]);
  const selectedEvents = useMemo(
    () => events.filter((e) => e.date === selectedDate).sort((a, b) => (a.startTime ?? '').localeCompare(b.startTime ?? '')),
    [events, selectedDate]
  );

  return (
    <View style={{ flex: 1 }}>
      <Calendar
        markingType="multi-dot"
        firstDay={1}
        markedDates={markedDates}
        onDayPress={(day: { dateString: string }) => onSelectDate(day.dateString)}
        theme={calendarTheme}
        style={{ borderBottomWidth: 1, borderBottomColor: "#F5F0E8" }}
      />
      <View style={{ flex: 1 }}>
        {selectedEvents.length > 0 ? (
          <FlatList
            data={selectedEvents}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <EventCard event={item} onPress={() => onEventPress(item)} />
            )}
            contentContainerStyle={{ paddingTop: 8, paddingBottom: 80 }}
          />
        ) : (
          <View style={{ alignItems: "center", paddingTop: 40 }}>
            <Ionicons name={"calendar-outline" as IoniconsName} size={36} color="#DDD" />
            <Text style={{ fontSize: 14, color: "#AAA", marginTop: 8 }}>
              {t("noEvents")}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

function WeekView({
  events,
  selectedDate,
  onSelectDate,
  onEventPress,
}: {
  events: CalendarEvent[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onEventPress: (event: CalendarEvent) => void;
}) {
  const { t } = useTranslation("calendar");
  const markedDates = useMemo(() => eventsToMarkedDates(events, selectedDate), [events, selectedDate]);

  const sections = useMemo(() => {
    const grouped: Record<string, CalendarEvent[]> = {};
    for (const event of events) {
      if (!grouped[event.date]) grouped[event.date] = [];
      grouped[event.date].push(event);
    }
    return Object.keys(grouped)
      .sort()
      .map((date) => ({
        title: date,
        data: grouped[date].sort((a, b) => (a.startTime ?? '').localeCompare(b.startTime ?? '')),
      }));
  }, [events]);

  const handleDateChanged = useCallback((date: string) => {
    onSelectDate(date);
  }, [onSelectDate]);

  return (
    <CalendarProvider
      date={selectedDate}
      onDateChanged={handleDateChanged}
      showTodayButton
      todayButtonStyle={{ backgroundColor: colors.golden.DEFAULT } as any}
    >
      <ExpandableCalendar
        firstDay={1}
        markingType="multi-dot"
        markedDates={markedDates}
        closeOnDayPress
        initialPosition={Positions.CLOSED}
        theme={{
          ...calendarTheme,
          todayButtonTextColor: '#FFFFFF',
        }}
      />
      <AgendaList
        sections={sections}
        renderItem={({ item }: { item: CalendarEvent }) => (
          <EventCard event={item} onPress={() => onEventPress(item)} />
        )}
        sectionStyle={{
          backgroundColor: colors.cream.DEFAULT,
          paddingHorizontal: 16,
          paddingVertical: 8,
        }}
      />
    </CalendarProvider>
  );
}

function AgendaView({
  events,
  onEventPress,
}: {
  events: CalendarEvent[];
  onEventPress: (event: CalendarEvent) => void;
}) {
  const { t } = useTranslation("calendar");
  const today = new Date().toISOString().split("T")[0];

  const sections = useMemo(() => {
    const futureEvents = events
      .filter((e) => e.date >= today)
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return (a.startTime ?? '').localeCompare(b.startTime ?? '');
      });

    const grouped: Record<string, CalendarEvent[]> = {};
    for (const event of futureEvents) {
      if (!grouped[event.date]) grouped[event.date] = [];
      grouped[event.date].push(event);
    }
    return Object.keys(grouped)
      .sort()
      .slice(0, 30)
      .map((date) => ({ title: formatSectionDate(date), data: grouped[date] }));
  }, [events, today]);

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      renderSectionHeader={({ section: { title } }) => (
        <View
          style={{
            backgroundColor: colors.cream.DEFAULT,
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderBottomColor: "#F5F0E8",
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: "700", color: colors.navy.DEFAULT }}>
            {title}
          </Text>
        </View>
      )}
      renderItem={({ item }) => (
        <EventCard event={item} onPress={() => onEventPress(item)} />
      )}
      contentContainerStyle={{ paddingBottom: 80 }}
      ListEmptyComponent={
        <View style={{ alignItems: "center", paddingTop: 60 }}>
          <Ionicons name={"calendar-outline" as IoniconsName} size={36} color="#DDD" />
          <Text style={{ fontSize: 14, color: "#AAA", marginTop: 8 }}>
            {t("noUpcoming")}
          </Text>
        </View>
      }
    />
  );
}

function formatSectionDate(dateStr: string): string {
  const [yearStr, monthStr, dayStr] = dateStr.split("-");
  const d = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, parseInt(dayStr, 10));
  const days = ["Nedelja", "Ponedeljak", "Utorak", "Sreda", "Cetvrtak", "Petak", "Subota"];
  const months = [
    "januar", "februar", "mart", "april", "maj", "jun",
    "jul", "avgust", "septembar", "oktobar", "novembar", "decembar",
  ];
  return `${days[d.getDay()]}, ${d.getDate()}. ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export default function CalendarScreen() {
  const { t } = useTranslation("calendar");
  const services = useServices();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { viewMode, selectedDate, setSelectedDate } = useCalendarStore();

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      (async () => {
        const data = await services.calendarEvents.getEvents();
        if (isMounted) {
          setEvents(data);
          setLoading(false);
        }
      })();
      return () => { isMounted = false; };
    }, [services])
  );

  const handleEventPress = useCallback((event: CalendarEvent) => {
    router.push(('/(tabs)/calendar/event/' + event.id) as any);
  }, [router]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.cream.DEFAULT, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={colors.golden.DEFAULT} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream.DEFAULT }}>
      <ViewModeToggle />

      {viewMode === "month" && (
        <MonthView
          events={events}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onEventPress={handleEventPress}
        />
      )}

      {viewMode === "week" && (
        <WeekView
          events={events}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onEventPress={handleEventPress}
        />
      )}

      {viewMode === "agenda" && (
        <AgendaView events={events} onEventPress={handleEventPress} />
      )}

      {/* FAB */}
      <Pressable
        onPress={() => router.push("/(tabs)/calendar/event/new" as any)}
        style={{
          position: "absolute",
          bottom: 20 + insets.bottom,
          right: 20,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: colors.golden.DEFAULT,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 6,
        }}
      >
        <Ionicons name={"add" as IoniconsName} size={28} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}
