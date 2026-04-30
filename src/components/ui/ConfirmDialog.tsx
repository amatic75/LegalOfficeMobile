import { Modal, View, Text, Pressable } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../theme/tokens";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

export type ConfirmTone = "default" | "success" | "warning" | "destructive";

interface ConfirmDialogProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
  body?: string;
  confirmLabel: string;
  /** Kept for API back-compat; no longer rendered as a separate button. The X in the header dismisses the dialog. */
  cancelLabel?: string;
  icon?: IoniconsName;
  tone?: ConfirmTone;
  /** Optional secondary action — when provided, renders a neutral button next to Confirm. */
  secondaryLabel?: string;
  onSecondary?: () => void;
}

const TONE_MAP: Record<
  ConfirmTone,
  { badgeBg: string; badgeFg: string; confirmBg: string }
> = {
  default: { badgeBg: colors.golden[50], badgeFg: colors.golden.DEFAULT, confirmBg: colors.golden.DEFAULT },
  success: { badgeBg: "#E8F5E9", badgeFg: "#2E7D32", confirmBg: colors.golden.DEFAULT },
  warning: { badgeBg: "#FFF8E1", badgeFg: "#E65100", confirmBg: colors.golden.DEFAULT },
  destructive: { badgeBg: "#FDECEA", badgeFg: "#C62828", confirmBg: colors.golden.DEFAULT },
};

export function ConfirmDialog({
  visible,
  onCancel,
  onConfirm,
  title,
  body,
  confirmLabel,
  icon,
  tone = "default",
  secondaryLabel,
  onSecondary,
}: ConfirmDialogProps) {
  const insets = useSafeAreaInsets();
  const palette = TONE_MAP[tone];

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

          {icon && (
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: palette.badgeBg,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
                alignSelf: "flex-start",
              }}
            >
              <Ionicons name={icon} size={28} color={palette.badgeFg} />
            </View>
          )}

          {body && (
            <Text style={{ fontSize: 14, lineHeight: 20, color: "#6B6558", marginBottom: 20 }}>{body}</Text>
          )}

          <View style={{ flexDirection: "row", gap: 10 }}>
            {secondaryLabel && onSecondary && (
              <Pressable
                onPress={onSecondary}
                style={{
                  flex: 1,
                  backgroundColor: "#F5F0E8",
                  borderRadius: 12,
                  paddingVertical: 14,
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: "700", color: colors.navy.DEFAULT }}>{secondaryLabel}</Text>
              </Pressable>
            )}
            <Pressable
              onPress={onConfirm}
              style={{
                flex: 1,
                backgroundColor: palette.confirmBg,
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#FFFFFF" }}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
