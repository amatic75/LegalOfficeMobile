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
import type { Lawyer } from "../../../../src/services/types";

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

export default function LawyerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation("directory");
  const services = useServices();
  const router = useRouter();
  const { goBack, returnTo } = useReturnBack();

  const [lawyer, setLawyer] = useState<Lawyer | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      setLoading(true);
      services.directory.getLawyerById(id).then((data) => {
        setLawyer(data);
        setLoading(false);
      });
    }, [id, services])
  );

  const handleUpdate = async (field: string, value: string | boolean) => {
    if (!id || !lawyer) return;
    const updated = await services.directory.updateLawyer(id, {
      [field]: value,
    });
    if (updated) setLawyer(updated);
  };

  const handleDelete = () => {
    Alert.alert(
      t("lawyers.deleteLawyer"),
      t("lawyers.confirmDelete"),
      [
        { text: t("actions.no"), style: "cancel" },
        {
          text: t("actions.yes"),
          style: "destructive",
          onPress: async () => {
            await services.directory.deleteLawyer(id!);
            router.back();
          },
        },
      ]
    );
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

  if (!lawyer) {
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
          {t("lawyers.noLawyers")}
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
              name={"person-outline" as IoniconsName}
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
            {lawyer.displayName}
          </Text>
          <View
            style={{
              backgroundColor: lawyer.isInternal ? "#E8F5E9" : "#FFF3E0",
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 4,
              marginTop: 8,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: lawyer.isInternal ? "#2E7D32" : "#E65100",
              }}
            >
              {lawyer.isInternal
                ? t("lawyers.internal")
                : t("lawyers.external")}
            </Text>
          </View>
        </View>
      </View>

      {/* Details Card */}
      <View style={SECTION_CARD}>
        <EditableInfoRow
          icon={"business-outline" as IoniconsName}
          label={t("lawyers.firm")}
          value={lawyer.firm}
          placeholder={t("lawyers.firm")}
          onSave={(v) => handleUpdate("firm", v)}
        />
        <EditableInfoRow
          icon={"card-outline" as IoniconsName}
          label={t("lawyers.barNumber")}
          value={lawyer.barNumber}
          placeholder={t("lawyers.barNumber")}
          onSave={(v) => handleUpdate("barNumber", v)}
        />
        <EditableInfoRow
          icon={"call-outline" as IoniconsName}
          label={t("lawyers.phone")}
          value={lawyer.phone}
          placeholder={t("lawyers.phone")}
          onSave={(v) => handleUpdate("phone", v)}
          keyboardType="phone-pad"
          actionIcon={"call-outline" as IoniconsName}
          onAction={() => {
            if (lawyer.phone) Linking.openURL(`tel:${lawyer.phone}`);
          }}
        />
        <EditableInfoRow
          icon={"mail-outline" as IoniconsName}
          label={t("lawyers.email")}
          value={lawyer.email}
          placeholder={t("lawyers.email")}
          onSave={(v) => handleUpdate("email", v)}
          keyboardType="email-address"
          actionIcon={"mail-outline" as IoniconsName}
          onAction={() => {
            if (lawyer.email) Linking.openURL(`mailto:${lawyer.email}`);
          }}
        />
        <EditableInfoRow
          icon={"ribbon-outline" as IoniconsName}
          label={t("lawyers.specialty")}
          value={lawyer.specialty}
          placeholder={t("lawyers.specialty")}
          onSave={(v) => handleUpdate("specialty", v)}
        />

        {/* Internal toggle row */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderBottomColor: "#F5F0E8",
          }}
        >
          <View style={{ width: 32, alignItems: "center" }}>
            <Ionicons
              name={"shield-outline" as IoniconsName}
              size={16}
              color="#AAA"
            />
          </View>
          <Text
            style={{
              flex: 1,
              fontSize: 14,
              color: colors.navy.DEFAULT,
            }}
          >
            {t("lawyers.isInternal")}
          </Text>
          <Pressable
            onPress={() => handleUpdate("isInternal", !lawyer.isInternal)}
            style={{
              width: 48,
              height: 28,
              borderRadius: 14,
              backgroundColor: lawyer.isInternal
                ? colors.golden.DEFAULT
                : "#E0E0E0",
              justifyContent: "center",
              paddingHorizontal: 2,
            }}
          >
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: "#FFFFFF",
                alignSelf: lawyer.isInternal ? "flex-end" : "flex-start",
              }}
            />
          </Pressable>
        </View>

        <EditableInfoRow
          icon={"document-text-outline" as IoniconsName}
          label={t("lawyers.notes")}
          value={lawyer.notes}
          placeholder={t("lawyers.notes")}
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
          {t("lawyers.deleteLawyer")}
        </Text>
      </Pressable>
    </ScrollView>
  );
}
