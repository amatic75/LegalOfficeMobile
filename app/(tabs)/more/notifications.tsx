import { View, Text, FlatList, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useNotificationStore } from "../../../src/stores/notification-store";
import type { AppNotification } from "../../../src/services/types";
import { URGENCY_COLORS } from "../../../src/services/types";
import { colors } from "../../../src/theme/tokens";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

function NotificationItem({
  notification,
  onPress,
}: {
  notification: AppNotification;
  onPress: () => void;
}) {
  const urgency = notification.urgency;
  const urgencyColor = urgency ? URGENCY_COLORS[urgency] : null;
  const leftBorderColor = urgencyColor
    ? urgencyColor.text
    : colors.golden.DEFAULT;

  return (
    <Pressable
      onPress={onPress}
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
      }}
    >
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

      {/* Urgency badge */}
      {urgency && urgencyColor && urgencyColor.label ? (
        <View
          style={{
            backgroundColor: urgencyColor.bg,
            borderRadius: 10,
            paddingHorizontal: 8,
            paddingVertical: 3,
            marginLeft: 8,
            alignSelf: "center",
          }}
        >
          <Text
            style={{
              fontSize: 10,
              fontWeight: "700",
              color: urgencyColor.text,
            }}
          >
            {urgencyColor.label}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const { t } = useTranslation(["notifications", "common"]);
  const router = useRouter();
  const notifications = useNotificationStore((s) => s.notifications);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Sort: unread first, then by createdAt descending
  const sortedNotifications = [...notifications].sort((a, b) => {
    if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const handlePress = (notification: AppNotification) => {
    markAsRead(notification.id);
    if (notification.relatedEventId) {
      router.push(
        ("/(tabs)/calendar/event/" + notification.relatedEventId) as any
      );
    } else if (notification.relatedCaseId) {
      router.push(("/(tabs)/cases/" + notification.relatedCaseId) as any);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream.DEFAULT }}>
      {/* Mark all as read header */}
      {unreadCount > 0 && (
        <View
          style={{
            flexDirection: "row",
            justifyContent: "flex-end",
            paddingHorizontal: 16,
            paddingVertical: 10,
          }}
        >
          <Pressable onPress={markAllAsRead}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: colors.golden.DEFAULT,
              }}
            >
              {t("notifications:markAllRead")}
            </Text>
          </Pressable>
        </View>
      )}

      {/* Notification List */}
      {sortedNotifications.length > 0 ? (
        <FlatList
          data={sortedNotifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NotificationItem
              notification={item}
              onPress={() => handlePress(item)}
            />
          )}
          contentContainerStyle={{ paddingTop: unreadCount > 0 ? 0 : 10, paddingBottom: 24 }}
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
            {t("notifications:noNotifications")}
          </Text>
        </View>
      )}
    </View>
  );
}
