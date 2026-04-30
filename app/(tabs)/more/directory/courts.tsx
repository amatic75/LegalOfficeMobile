import { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
  Linking,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useServices } from "../../../../src/hooks/useServices";
import { useReturnBack } from "../../../../src/hooks/useReturnBack";
import { colors } from "../../../../src/theme/tokens";
import type { Court } from "../../../../src/services/types";
import { DeleteConfirmDialog } from "../../../../src/components/ui/DeleteConfirmDialog";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

const SECTION_CARD = {
  backgroundColor: "#FFFFFF" as const,
  borderRadius: 16,
  paddingHorizontal: 16,
  paddingVertical: 12,
  marginBottom: 12,
  shadowColor: "#000" as const,
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.04,
  shadowRadius: 4,
  elevation: 1,
  borderWidth: 1,
  borderColor: "#FFF3E0" as const,
};

function EditableInfoRow({
  icon,
  label,
  value,
  placeholder,
  onSave,
  multiline,
  keyboardType,
  actionIcon,
  onAction,
}: {
  icon: IoniconsName;
  label: string;
  value?: string;
  placeholder: string;
  onSave: (newValue: string) => void;
  multiline?: boolean;
  keyboardType?: "default" | "phone-pad" | "email-address";
  actionIcon?: IoniconsName;
  onAction?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value ?? "");

  const handleSave = () => {
    onSave(editValue.trim());
    setEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value ?? "");
    setEditing(false);
  };

  if (editing) {
    return (
      <View
        style={{
          paddingVertical: 10,
          borderBottomWidth: 1,
          borderBottomColor: colors.golden.DEFAULT,
          backgroundColor: colors.golden[50] + "40",
          paddingHorizontal: 4,
          borderRadius: 4,
          marginHorizontal: -4,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
          <View style={{ width: 32, alignItems: "center", marginTop: 2 }}>
            <Ionicons name={icon} size={16} color={colors.golden.DEFAULT} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 12,
                color: colors.golden.DEFAULT,
                marginBottom: 2,
              }}
            >
              {label}
            </Text>
            <TextInput
              style={{
                fontSize: 14,
                color: colors.navy.DEFAULT,
                padding: 0,
                minHeight: multiline ? 60 : 20,
              }}
              value={editValue}
              onChangeText={setEditValue}
              autoFocus={true}
              placeholder={placeholder}
              placeholderTextColor="#CCC"
              multiline={multiline}
              keyboardType={keyboardType}
            />
          </View>
        </View>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "flex-end",
            gap: 12,
            marginTop: 8,
            paddingRight: 4,
          }}
        >
          <Pressable
            onPress={handleCancel}
            style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
          >
            <Ionicons
              name={"close-outline" as IoniconsName}
              size={18}
              color="#AAA"
            />
          </Pressable>
          <Pressable
            onPress={handleSave}
            style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
          >
            <Ionicons
              name={"checkmark-outline" as IoniconsName}
              size={18}
              color={colors.golden.DEFAULT}
            />
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#F5F0E8",
      }}
    >
      <Pressable
        onPress={() => {
          setEditValue(value ?? "");
          setEditing(true);
        }}
        style={{ flexDirection: "row", alignItems: "flex-start", flex: 1 }}
      >
        <View style={{ width: 32, alignItems: "center", marginTop: 2 }}>
          <Ionicons
            name={icon}
            size={16}
            color={value ? "#AAA" : "#CCC"}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, color: "#AAA", marginBottom: 2 }}>
            {label}
          </Text>
          {value ? (
            <Text style={{ fontSize: 14, color: colors.navy.DEFAULT }}>
              {value}
            </Text>
          ) : (
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              <Text
                style={{ fontSize: 14, color: "#CCC", fontStyle: "italic" }}
              >
                {placeholder}
              </Text>
              <Ionicons
                name={"pencil-outline" as IoniconsName}
                size={12}
                color="#CCC"
              />
            </View>
          )}
        </View>
      </Pressable>
      {actionIcon && onAction && value ? (
        <Pressable
          onPress={onAction}
          style={{ paddingLeft: 8, paddingTop: 10 }}
        >
          <Ionicons
            name={actionIcon}
            size={18}
            color={colors.golden.DEFAULT}
          />
        </Pressable>
      ) : null}
    </View>
  );
}

export default function CourtDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation("directory");
  const services = useServices();
  const router = useRouter();
  const { goBack, returnTo } = useReturnBack();

  const [court, setCourt] = useState<Court | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      setLoading(true);
      services.directory.getCourtById(id).then((data) => {
        setCourt(data);
        setLoading(false);
      });
    }, [id, services])
  );

  const handleUpdate = async (field: string, value: string) => {
    if (!id || !court) return;
    const updated = await services.directory.updateCourt(id, {
      [field]: value,
    });
    if (updated) setCourt(updated);
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    setShowDeleteConfirm(false);
    if (!id) return;
    await services.directory.deleteCourt(id);
    router.back();
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#FAF9F6",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" color={colors.golden.DEFAULT} />
      </View>
    );
  }

  if (!court) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#FAF9F6",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontSize: 16, color: "#8E8E93" }}>
          {t("courts.noCourts")}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#FAF9F6" }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
    >
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
      {/* Header Card */}
      <View style={SECTION_CARD}>
        <View style={{ alignItems: "center", paddingVertical: 8 }}>
          <View
            style={{
              width: 60,
              height: 60,
              borderRadius: 30,
              backgroundColor: "#FDF8EC",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 10,
            }}
          >
            <Ionicons
              name={"business-outline" as IoniconsName}
              size={28}
              color={colors.golden.DEFAULT}
            />
          </View>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "700",
              color: colors.navy.DEFAULT,
              textAlign: "center",
            }}
          >
            {court.name}
          </Text>
        </View>
      </View>

      {/* Details Card */}
      <View style={SECTION_CARD}>
        <EditableInfoRow
          icon={"location-outline" as IoniconsName}
          label={t("courts.address")}
          value={court.address}
          placeholder={t("courts.address")}
          onSave={(v) => handleUpdate("address", v)}
        />
        <EditableInfoRow
          icon={"navigate-outline" as IoniconsName}
          label={t("courts.city")}
          value={court.city}
          placeholder={t("courts.city")}
          onSave={(v) => handleUpdate("city", v)}
        />
        <EditableInfoRow
          icon={"shield-outline" as IoniconsName}
          label={t("courts.jurisdiction")}
          value={court.jurisdiction}
          placeholder={t("courts.jurisdiction")}
          onSave={(v) => handleUpdate("jurisdiction", v)}
        />
        <EditableInfoRow
          icon={"call-outline" as IoniconsName}
          label={t("courts.phone")}
          value={court.phone}
          placeholder={t("courts.phone")}
          onSave={(v) => handleUpdate("phone", v)}
          keyboardType="phone-pad"
          actionIcon={"call-outline" as IoniconsName}
          onAction={() => {
            if (court.phone) Linking.openURL(`tel:${court.phone}`);
          }}
        />
        <EditableInfoRow
          icon={"globe-outline" as IoniconsName}
          label={t("courts.website")}
          value={court.website}
          placeholder={t("courts.website")}
          onSave={(v) => handleUpdate("website", v)}
          actionIcon={"open-outline" as IoniconsName}
          onAction={() => {
            if (court.website) {
              const url = court.website.startsWith("http")
                ? court.website
                : `https://${court.website}`;
              Linking.openURL(url);
            }
          }}
        />
        <EditableInfoRow
          icon={"document-text-outline" as IoniconsName}
          label={t("courts.notes")}
          value={court.notes}
          placeholder={t("courts.notes")}
          onSave={(v) => handleUpdate("notes", v)}
          multiline
        />
      </View>

      {/* Delete Button */}
      <Pressable
        onPress={handleDelete}
        style={{
          alignItems: "center",
          paddingVertical: 14,
          marginTop: 8,
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: "600", color: "#E53935" }}>
          {t("courts.deleteCourt")}
        </Text>
      </Pressable>

      <DeleteConfirmDialog
        visible={showDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title={t("courts.deleteCourt")}
        body={t("courts.confirmDelete")}
        confirmLabel={t("courts.deleteCourt")}
      />
    </ScrollView>
  );
}
