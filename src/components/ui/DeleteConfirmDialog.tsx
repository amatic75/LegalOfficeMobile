import { Modal, View, Text, Pressable } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../theme/tokens";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

interface DeleteConfirmDialogProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  body?: string;
  confirmLabel: string;
}

export function DeleteConfirmDialog({
  visible,
  onCancel,
  onConfirm,
  title,
  body,
  confirmLabel,
}: DeleteConfirmDialogProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onCancel}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
        <View style={{ backgroundColor: "#FFFFFF", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 + insets.bottom }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: "700", color: colors.navy.DEFAULT }}>{title}</Text>
            <Pressable onPress={onCancel}>
              <Ionicons name={"close" as IoniconsName} size={24} color="#AAA" />
            </Pressable>
          </View>

          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: "#FDECEA",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
              alignSelf: "flex-start",
            }}
          >
            <Ionicons name={"trash-outline" as IoniconsName} size={28} color="#C62828" />
          </View>

          {body && (
            <Text style={{ fontSize: 14, lineHeight: 20, color: "#6B6558", marginBottom: 20 }}>{body}</Text>
          )}

          <Pressable
            onPress={onConfirm}
            style={{
              backgroundColor: "#C62828",
              borderRadius: 12,
              paddingVertical: 14,
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#FFFFFF" }}>{confirmLabel}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
