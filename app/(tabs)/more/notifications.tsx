import { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  Modal,
  ScrollView,
  TextInput,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useNotificationStore } from "../../../src/stores/notification-store";
import { useReturnBack } from "../../../src/hooks/useReturnBack";
import type {
  AppNotification,
  NotificationPreferences,
  SnoozeOption,
} from "../../../src/services/types";
import { URGENCY_COLORS } from "../../../src/services/types";
import { colors } from "../../../src/theme/tokens";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

const SECTION_CARD = {
  backgroundColor: "#FFFFFF",
  borderWidth: 1,
  borderColor: colors.golden[100],
  borderRadius: 14,
  padding: 16,
  marginBottom: 12,
};

const FILTER_TABS: Array<{ key: "all" | "unread" | "read"; labelKey: string }> =
  [
    { key: "all", labelKey: "filterAll" },
    { key: "unread", labelKey: "filterUnread" },
    { key: "read", labelKey: "filterRead" },
  ];

const SNOOZE_OPTIONS: Array<{ option: SnoozeOption; labelKey: string }> = [
  { option: "1h", labelKey: "snoozeIn1h" },
  { option: "3h", labelKey: "snoozeIn3h" },
  { option: "tomorrow", labelKey: "snoozeTomorrow" },
  { option: "next-week", labelKey: "snoozeNextWeek" },
];

function computeSnoozeUntil(option: SnoozeOption): string {
  const now = new Date();
  switch (option) {
    case "1h":
      return new Date(now.getTime() + 60 * 60 * 1000).toISOString();
    case "3h":
      return new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString();
    case "tomorrow": {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      return tomorrow.toISOString();
    }
    case "next-week": {
      const nextMonday = new Date(now);
      const dayOfWeek = nextMonday.getDay();
      const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
      nextMonday.setDate(nextMonday.getDate() + daysUntilMonday);
      nextMonday.setHours(9, 0, 0, 0);
      return nextMonday.toISOString();
    }
  }
}

function getUrgencyIcon(urgency: string | undefined): IoniconsName {
  if (urgency === "today") return "alert-circle";
  return "time-outline";
}

// ---------- Toggle Switch Component ----------

function ToggleSwitch({
  value,
  onToggle,
}: {
  value: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      onPress={onToggle}
      style={{
        width: 48,
        height: 28,
        borderRadius: 14,
        backgroundColor: value ? colors.golden.DEFAULT : "#CCCCCC",
        justifyContent: "center",
        padding: 2,
      }}
    >
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: "#FFFFFF",
          alignSelf: value ? "flex-end" : "flex-start",
        }}
      />
    </Pressable>
  );
}

// ---------- Notification Item Component ----------

function NotificationItem({
  notification,
  onPress,
  onLongPress,
}: {
  notification: AppNotification;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const urgency = notification.urgency;
  const isOverdue =
    notification.type === "deadline-reminder" &&
    notification.urgency === "today" &&
    notification.isRead;
  const urgencyColor = isOverdue
    ? { bg: "#FFCDD2", text: "#B71C1C", label: "" }
    : urgency
      ? URGENCY_COLORS[urgency]
      : null;
  const leftBorderColor = isOverdue
    ? "#B71C1C"
    : urgencyColor
      ? urgencyColor.text
      : colors.golden.DEFAULT;
  const isCompleted = notification.completed === true;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={400}
      style={{
        backgroundColor: notification.isRead ? "#FFFFFF" : "#FFFDF7",
        borderWidth: 1,
        borderColor: notification.isRead ? "#F0E8D8" : colors.golden[100],
        borderLeftWidth: 3,
        borderLeftColor: leftBorderColor,
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
        marginHorizontal: 16,
        flexDirection: "row",
        alignItems: "flex-start",
        opacity: isCompleted ? 0.6 : 1,
      }}
    >
      {/* Completed overlay checkmark */}
      {isCompleted && (
        <View
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            zIndex: 1,
          }}
        >
          <Ionicons
            name={"checkmark-circle" as IoniconsName}
            size={20}
            color="#43A047"
          />
        </View>
      )}

      {/* Unread dot */}
      {!notification.isRead && (
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: colors.golden.DEFAULT,
            marginTop: 5,
            marginRight: 10,
          }}
        />
      )}
      {notification.isRead && <View style={{ width: 18 }} />}

      {/* Content */}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: notification.isRead ? "400" : "600",
            color: colors.navy.DEFAULT,
          }}
          numberOfLines={2}
        >
          {notification.title}
        </Text>
        <Text
          style={{
            fontSize: 12,
            color: "#888888",
            marginTop: 2,
          }}
          numberOfLines={2}
        >
          {notification.body}
        </Text>
        <Text
          style={{
            fontSize: 10,
            color: "#AAAAAA",
            marginTop: 4,
          }}
        >
          {new Date(notification.createdAt).toLocaleDateString()}
        </Text>
      </View>

      {/* Urgency badge - enhanced with icon */}
      {urgency && urgencyColor && (urgencyColor.label || isOverdue) ? (
        <View
          style={{
            backgroundColor: urgencyColor.bg,
            borderRadius: 12,
            paddingHorizontal: 10,
            paddingVertical: 4,
            marginLeft: 8,
            alignSelf: "center",
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
          }}
        >
          <Ionicons
            name={isOverdue ? "alert-circle" : getUrgencyIcon(urgency)}
            size={12}
            color={urgencyColor.text}
          />
          <Text
            style={{
              fontSize: 10,
              fontWeight: "700",
              color: urgencyColor.text,
            }}
          >
            {isOverdue ? "!" : urgencyColor.label}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

// ---------- Actions Modal Component ----------

function ActionsModal({
  visible,
  notification,
  onClose,
  onSnooze,
  onMarkComplete,
  onReschedule,
  t,
}: {
  visible: boolean;
  notification: AppNotification | null;
  onClose: () => void;
  onSnooze: (option: SnoozeOption) => void;
  onMarkComplete: () => void;
  onReschedule: () => void;
  t: (key: string) => string;
}) {
  const [showSnoozeOptions, setShowSnoozeOptions] = useState(false);

  const handleClose = useCallback(() => {
    setShowSnoozeOptions(false);
    onClose();
  }, [onClose]);

  if (!notification) return null;

  const isDeadline = notification.type === "deadline-reminder";
  const hasEvent = !!notification.relatedEventId;
  const isCompleted = notification.completed === true;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <Pressable
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.4)",
          justifyContent: "center",
          alignItems: "center",
          padding: 32,
        }}
        onPress={handleClose}
      >
        <Pressable
          onPress={() => {}}
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 16,
            width: "100%",
            maxWidth: 340,
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <View
            style={{
              backgroundColor: colors.golden[50],
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: colors.golden[100],
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "700",
                color: colors.navy.DEFAULT,
              }}
              numberOfLines={2}
            >
              {notification.title}
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: "#888888",
                marginTop: 4,
              }}
            >
              {t("notifications:actions")}
            </Text>
          </View>

          {/* Snooze section */}
          {!showSnoozeOptions ? (
            <Pressable
              onPress={() => setShowSnoozeOptions(true)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 16,
                borderBottomWidth: 1,
                borderBottomColor: "#F0F0F0",
              }}
            >
              <Ionicons
                name={"time-outline" as IoniconsName}
                size={22}
                color={colors.golden.DEFAULT}
              />
              <Text
                style={{
                  fontSize: 15,
                  color: colors.navy.DEFAULT,
                  marginLeft: 12,
                  fontWeight: "500",
                }}
              >
                {t("notifications:snooze")}
              </Text>
              <Ionicons
                name={"chevron-forward" as IoniconsName}
                size={18}
                color="#CCCCCC"
                style={{ marginLeft: "auto" }}
              />
            </Pressable>
          ) : (
            <View
              style={{
                borderBottomWidth: 1,
                borderBottomColor: "#F0F0F0",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 16,
                  paddingBottom: 8,
                }}
              >
                <Ionicons
                  name={"time-outline" as IoniconsName}
                  size={22}
                  color={colors.golden.DEFAULT}
                />
                <Text
                  style={{
                    fontSize: 15,
                    color: colors.navy.DEFAULT,
                    marginLeft: 12,
                    fontWeight: "600",
                  }}
                >
                  {t("notifications:snooze")}
                </Text>
              </View>
              {SNOOZE_OPTIONS.map((s) => (
                <Pressable
                  key={s.option}
                  onPress={() => {
                    onSnooze(s.option);
                    handleClose();
                  }}
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: 50,
                    borderTopWidth: 1,
                    borderTopColor: "#F8F8F8",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      color: colors.navy.DEFAULT,
                    }}
                  >
                    {t(`notifications:${s.labelKey}`)}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          {/* Mark Complete (only for deadline-reminder, not already completed) */}
          {isDeadline && !isCompleted && (
            <Pressable
              onPress={() => {
                onMarkComplete();
                handleClose();
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 16,
                borderBottomWidth: 1,
                borderBottomColor: "#F0F0F0",
              }}
            >
              <Ionicons
                name={"checkmark-circle" as IoniconsName}
                size={22}
                color="#43A047"
              />
              <Text
                style={{
                  fontSize: 15,
                  color: colors.navy.DEFAULT,
                  marginLeft: 12,
                  fontWeight: "500",
                }}
              >
                {t("notifications:markComplete")}
              </Text>
            </Pressable>
          )}

          {/* Reschedule (only for deadline-reminder with event) */}
          {isDeadline && hasEvent && (
            <Pressable
              onPress={() => {
                onReschedule();
                handleClose();
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 16,
                borderBottomWidth: 1,
                borderBottomColor: "#F0F0F0",
              }}
            >
              <Ionicons
                name={"calendar-outline" as IoniconsName}
                size={22}
                color={colors.golden.DEFAULT}
              />
              <Text
                style={{
                  fontSize: 15,
                  color: colors.navy.DEFAULT,
                  marginLeft: 12,
                  fontWeight: "500",
                }}
              >
                {t("notifications:reschedule")}
              </Text>
            </Pressable>
          )}

          {/* Cancel */}
          <Pressable
            onPress={handleClose}
            style={{
              padding: 16,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: 15,
                color: "#999999",
                fontWeight: "500",
              }}
            >
              {t("notifications:cancel")}
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ---------- Preferences Modal Component ----------

function PreferencesModal({
  visible,
  preferences,
  onSave,
  onClose,
  t,
}: {
  visible: boolean;
  preferences: NotificationPreferences;
  onSave: (prefs: NotificationPreferences) => void;
  onClose: () => void;
  t: (key: string) => string;
}) {
  const [localPrefs, setLocalPrefs] =
    useState<NotificationPreferences>(preferences);

  const handleSave = useCallback(() => {
    onSave(localPrefs);
    onClose();
  }, [localPrefs, onSave, onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.4)",
          justifyContent: "flex-end",
        }}
      >
        <View
          style={{
            backgroundColor: colors.cream.DEFAULT,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            maxHeight: "80%",
          }}
        >
          {/* Handle bar */}
          <View style={{ alignItems: "center", paddingTop: 10 }}>
            <View
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: "#DDDDDD",
              }}
            />
          </View>

          {/* Title */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              padding: 16,
              paddingTop: 12,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: colors.navy.DEFAULT,
              }}
            >
              {t("notifications:preferencesTitle")}
            </Text>
            <Pressable onPress={onClose}>
              <Ionicons
                name={"close" as IoniconsName}
                size={24}
                color="#999999"
              />
            </Pressable>
          </View>

          <ScrollView
            style={{ paddingHorizontal: 16 }}
            contentContainerStyle={{ paddingBottom: 32 }}
          >
            {/* Quiet Hours Section */}
            <View style={{ ...SECTION_CARD }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <Ionicons
                    name={"moon-outline" as IoniconsName}
                    size={20}
                    color={colors.golden.DEFAULT}
                  />
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "600",
                      color: colors.navy.DEFAULT,
                    }}
                  >
                    {t("notifications:quietHours")}
                  </Text>
                </View>
                <ToggleSwitch
                  value={localPrefs.quietHoursEnabled}
                  onToggle={() =>
                    setLocalPrefs((p) => ({
                      ...p,
                      quietHoursEnabled: !p.quietHoursEnabled,
                    }))
                  }
                />
              </View>

              {localPrefs.quietHoursEnabled && (
                <View style={{ gap: 10 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        color: "#888888",
                        width: 70,
                      }}
                    >
                      {t("notifications:quietHoursStart")}
                    </Text>
                    <TextInput
                      value={localPrefs.quietHoursStart}
                      onChangeText={(text) =>
                        setLocalPrefs((p) => ({ ...p, quietHoursStart: text }))
                      }
                      placeholder="22:00"
                      style={{
                        flex: 1,
                        borderWidth: 1,
                        borderColor: "#E0E0E0",
                        borderRadius: 8,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        fontSize: 14,
                        color: colors.navy.DEFAULT,
                      }}
                    />
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        color: "#888888",
                        width: 70,
                      }}
                    >
                      {t("notifications:quietHoursEnd")}
                    </Text>
                    <TextInput
                      value={localPrefs.quietHoursEnd}
                      onChangeText={(text) =>
                        setLocalPrefs((p) => ({ ...p, quietHoursEnd: text }))
                      }
                      placeholder="07:00"
                      style={{
                        flex: 1,
                        borderWidth: 1,
                        borderColor: "#E0E0E0",
                        borderRadius: 8,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        fontSize: 14,
                        color: colors.navy.DEFAULT,
                      }}
                    />
                  </View>
                </View>
              )}
            </View>

            {/* Notification Types Section */}
            <View style={{ ...SECTION_CARD }}>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "600",
                  color: colors.navy.DEFAULT,
                  marginBottom: 12,
                }}
              >
                {t("notifications:quickActions")}
              </Text>

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <Ionicons
                    name={"timer-outline" as IoniconsName}
                    size={18}
                    color={colors.golden.DEFAULT}
                  />
                  <Text
                    style={{
                      fontSize: 14,
                      color: colors.navy.DEFAULT,
                    }}
                  >
                    {t("notifications:enableDeadlineReminders")}
                  </Text>
                </View>
                <ToggleSwitch
                  value={localPrefs.deadlineReminders}
                  onToggle={() =>
                    setLocalPrefs((p) => ({
                      ...p,
                      deadlineReminders: !p.deadlineReminders,
                    }))
                  }
                />
              </View>

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <Ionicons
                    name={"briefcase-outline" as IoniconsName}
                    size={18}
                    color={colors.golden.DEFAULT}
                  />
                  <Text
                    style={{
                      fontSize: 14,
                      color: colors.navy.DEFAULT,
                    }}
                  >
                    {t("notifications:enableCaseUpdates")}
                  </Text>
                </View>
                <ToggleSwitch
                  value={localPrefs.caseUpdates}
                  onToggle={() =>
                    setLocalPrefs((p) => ({
                      ...p,
                      caseUpdates: !p.caseUpdates,
                    }))
                  }
                />
              </View>
            </View>

            {/* Save Button */}
            <Pressable
              onPress={handleSave}
              style={{
                backgroundColor: colors.golden.DEFAULT,
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: "center",
                marginTop: 4,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "700",
                  color: "#FFFFFF",
                }}
              >
                {t("notifications:savePreferences")}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ---------- Main Screen ----------

export default function NotificationsScreen() {
  const { t } = useTranslation(["notifications", "common"]);
  const router = useRouter();
  const { goBack, returnTo } = useReturnBack();

  // Store state
  const notifications = useNotificationStore((s) => s.notifications);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);
  const preferences = useNotificationStore((s) => s.preferences);
  const setPreferences = useNotificationStore((s) => s.setPreferences);
  const snoozeNotification = useNotificationStore(
    (s) => s.snoozeNotification
  );
  const markNotificationComplete = useNotificationStore(
    (s) => s.markNotificationComplete
  );
  const activeFilter = useNotificationStore((s) => s.activeFilter);
  const setActiveFilter = useNotificationStore((s) => s.setActiveFilter);

  // Local state
  const [preferencesModalVisible, setPreferencesModalVisible] = useState(false);
  const [actionsModalVisible, setActionsModalVisible] = useState(false);
  const [selectedNotification, setSelectedNotification] =
    useState<AppNotification | null>(null);

  // Filter and sort notifications
  const filteredNotifications = useMemo(() => {
    const now = new Date().toISOString();

    return [...notifications]
      .filter((n) => {
        // Hide snoozed notifications whose snoozedUntil is in the future
        if (n.snoozedUntil && n.snoozedUntil > now) {
          return false;
        }
        // Apply filter
        if (activeFilter === "unread") return !n.isRead;
        if (activeFilter === "read") return n.isRead;
        return true;
      })
      .sort((a, b) => {
        // Unread first, then by createdAt descending
        if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });
  }, [notifications, activeFilter]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  const handlePress = useCallback(
    (notification: AppNotification) => {
      markAsRead(notification.id);
      if (notification.relatedEventId) {
        router.push({
          pathname: "/(tabs)/calendar/event/[id]",
          params: { id: notification.relatedEventId, returnTo: "/(tabs)/more/notifications" },
        });
      } else if (notification.relatedCaseId) {
        router.push({
          pathname: "/(tabs)/cases/[id]",
          params: { id: notification.relatedCaseId, returnTo: "/(tabs)/more/notifications" },
        });
      }
    },
    [markAsRead, router]
  );

  const handleLongPress = useCallback((notification: AppNotification) => {
    setSelectedNotification(notification);
    setActionsModalVisible(true);
  }, []);

  const handleSnooze = useCallback(
    (option: SnoozeOption) => {
      if (selectedNotification) {
        const until = computeSnoozeUntil(option);
        snoozeNotification(selectedNotification.id, until);
      }
    },
    [selectedNotification, snoozeNotification]
  );

  const handleMarkComplete = useCallback(() => {
    if (selectedNotification) {
      markNotificationComplete(selectedNotification.id);
    }
  }, [selectedNotification, markNotificationComplete]);

  const handleReschedule = useCallback(() => {
    if (selectedNotification?.relatedEventId) {
      router.push({
        pathname: "/(tabs)/calendar/event/[id]",
        params: { id: selectedNotification.relatedEventId, returnTo: "/(tabs)/more/notifications" },
      });
    }
  }, [selectedNotification, router]);

  const handleSavePreferences = useCallback(
    (prefs: NotificationPreferences) => {
      setPreferences(prefs);
    },
    [setPreferences]
  );

  // Empty state messages
  const emptyMessage = useMemo(() => {
    if (activeFilter === "all") return t("notifications:noNotifications");
    return t("notifications:noNotificationsFiltered");
  }, [activeFilter, t]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream.DEFAULT }}>
      {returnTo && (
        <Stack.Screen
          options={{
            headerLeft: () => (
              <Pressable onPress={goBack} style={{ marginLeft: 4, padding: 4 }}>
                <Ionicons name={"arrow-back" as IoniconsName} size={24} color="#FFFFFF" />
              </Pressable>
            ),
          }}
        />
      )}
      {/* Header toolbar */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderBottomWidth: 1,
          borderBottomColor: colors.golden[100],
        }}
      >
        {/* Filter tabs */}
        <View
          style={{
            flexDirection: "row",
            gap: 6,
          }}
        >
          {FILTER_TABS.map((tab) => {
            const isActive = activeFilter === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setActiveFilter(tab.key)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                  borderRadius: 16,
                  backgroundColor: isActive
                    ? colors.golden.DEFAULT
                    : colors.cream[200],
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: isActive ? "700" : "500",
                    color: isActive ? "#FFFFFF" : colors.navy.DEFAULT,
                  }}
                >
                  {t(`notifications:${tab.labelKey}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Right side: Mark all read + Settings gear */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          {unreadCount > 0 && (
            <Pressable onPress={markAllAsRead}>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: colors.golden.DEFAULT,
                }}
              >
                {t("notifications:markAllRead")}
              </Text>
            </Pressable>
          )}
          <Pressable onPress={() => setPreferencesModalVisible(true)}>
            <Ionicons
              name={"settings-outline" as IoniconsName}
              size={22}
              color={colors.navy.DEFAULT}
            />
          </Pressable>
        </View>
      </View>

      {/* Notification List */}
      {filteredNotifications.length > 0 ? (
        <FlatList
          data={filteredNotifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NotificationItem
              notification={item}
              onPress={() => handlePress(item)}
              onLongPress={() => handleLongPress(item)}
            />
          )}
          contentContainerStyle={{ paddingTop: 10, paddingBottom: 24 }}
        />
      ) : (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 32,
          }}
        >
          <Ionicons
            name={"notifications-off-outline" as IoniconsName}
            size={48}
            color="#CCCCCC"
          />
          <Text
            style={{
              fontSize: 16,
              color: "#AAAAAA",
              marginTop: 12,
              textAlign: "center",
            }}
          >
            {emptyMessage}
          </Text>
        </View>
      )}

      {/* Actions Modal (long-press menu) */}
      <ActionsModal
        visible={actionsModalVisible}
        notification={selectedNotification}
        onClose={() => {
          setActionsModalVisible(false);
          setSelectedNotification(null);
        }}
        onSnooze={handleSnooze}
        onMarkComplete={handleMarkComplete}
        onReschedule={handleReschedule}
        t={t}
      />

      {/* Preferences Modal */}
      <PreferencesModal
        visible={preferencesModalVisible}
        preferences={preferences}
        onSave={handleSavePreferences}
        onClose={() => setPreferencesModalVisible(false)}
        t={t}
      />
    </View>
  );
}
