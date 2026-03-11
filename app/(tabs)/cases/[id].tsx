import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert } from "react-native";
import { useTranslation } from "react-i18next";
import { useEffect, useState, useCallback } from "react";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useServices } from "../../../src/hooks/useServices";
import { colors } from "../../../src/theme/tokens";
import type { CaseSummary, CaseStatus } from "../../../src/services/types";
import { STATUS_COLORS, STATUS_TRANSITIONS } from "../../../src/services/types";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

const STATUS_ICONS: Record<CaseStatus, IoniconsName> = {
  new: "sparkles-outline" as IoniconsName,
  active: "play-circle-outline" as IoniconsName,
  pending: "pause-circle-outline" as IoniconsName,
  closed: "checkmark-circle-outline" as IoniconsName,
  archived: "archive-outline" as IoniconsName,
};

function InfoRow({ icon, label, value, onPress, linkColor }: {
  icon: IoniconsName;
  label: string;
  value?: string;
  onPress?: () => void;
  linkColor?: string;
}) {
  if (!value) return null;
  const content = (
    <View style={{ flexDirection: "row", alignItems: "flex-start", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F5F0E8" }}>
      <View style={{ width: 32, alignItems: "center", marginTop: 2 }}>
        <Ionicons name={icon} size={16} color={linkColor ?? "#AAA"} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 12, color: "#AAA", marginBottom: 2 }}>{label}</Text>
        <Text style={{ fontSize: 14, color: linkColor ?? colors.navy.DEFAULT, fontWeight: linkColor ? "600" : "400", textDecorationLine: linkColor ? "underline" : "none" }}>
          {value}
        </Text>
      </View>
      {onPress && (
        <Ionicons name={"chevron-forward" as IoniconsName} size={14} color="#DDD" style={{ marginTop: 8 }} />
      )}
    </View>
  );

  if (onPress) {
    return <Pressable onPress={onPress}>{content}</Pressable>;
  }
  return content;
}

export default function CaseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation("cases");
  const services = useServices();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [caseData, setCaseData] = useState<CaseSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const loadCase = useCallback(async () => {
    if (!id) return;
    const data = await services.cases.getCaseById(id);
    setCaseData(data);
    setLoading(false);
  }, [id, services]);

  useEffect(() => {
    loadCase();
  }, [loadCase]);

  const handleStatusChange = async (newStatus: CaseStatus) => {
    if (!id || statusUpdating) return;
    setStatusUpdating(true);
    try {
      const updated = await services.cases.updateCaseStatus(id, newStatus);
      if (updated) {
        setCaseData(updated);
        Alert.alert(t('detail.statusChanged'));
      }
    } catch {
      Alert.alert('Error', 'Failed to update status');
    } finally {
      setStatusUpdating(false);
    }
  };

  if (loading || !caseData) {
    return (
      <>
        <Stack.Screen options={{ headerTitle: "" }} />
        <View style={{ flex: 1, backgroundColor: colors.cream.DEFAULT, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.golden.DEFAULT} />
        </View>
      </>
    );
  }

  const statusColor = STATUS_COLORS[caseData.status] ?? STATUS_COLORS.active;
  const statusIcon = STATUS_ICONS[caseData.status] ?? ("help-circle-outline" as IoniconsName);
  const allowedTransitions = STATUS_TRANSITIONS[caseData.status] ?? [];

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: caseData.caseNumber,
          headerRight: () => (
            <Pressable
              onPress={() => router.push('/(tabs)/cases/edit/' + id)}
              style={{ marginRight: 4 }}
            >
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
        {/* Status Banner */}
        <View
          style={{
            backgroundColor: statusColor.bg,
            paddingVertical: 14,
            paddingHorizontal: 20,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <Ionicons name={statusIcon} size={20} color={statusColor.text} />
          <Text style={{ fontSize: 16, fontWeight: "700", color: statusColor.text }}>
            {t('status.' + caseData.status)}
          </Text>
        </View>

        {/* Case Info Card */}
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 16,
            paddingHorizontal: 16,
            paddingVertical: 4,
            margin: 16,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 2,
            borderWidth: 1,
            borderColor: "#FFF3E0",
          }}
        >
          <InfoRow
            icon={"document-text-outline" as IoniconsName}
            label={t("detail.caseNumber")}
            value={caseData.caseNumber}
          />
          <InfoRow
            icon={"text-outline" as IoniconsName}
            label={t("form.title")}
            value={caseData.title}
          />
          <InfoRow
            icon={"briefcase-outline" as IoniconsName}
            label={t("detail.type")}
            value={t('type.' + caseData.caseType)}
          />
          {caseData.caseSubtype && (
            <InfoRow
              icon={"layers-outline" as IoniconsName}
              label={t("detail.subtype")}
              value={t('subtype.' + caseData.caseSubtype)}
            />
          )}
          <InfoRow
            icon={"person-outline" as IoniconsName}
            label={t("detail.client")}
            value={caseData.clientName}
            onPress={() => router.push('/(tabs)/clients/' + caseData.clientId)}
            linkColor={colors.golden.DEFAULT}
          />
          {caseData.opposingParty && (
            <InfoRow
              icon={"people-outline" as IoniconsName}
              label={t("detail.opposingParty")}
              value={caseData.opposingParty}
            />
          )}
          {caseData.court && (
            <InfoRow
              icon={"business-outline" as IoniconsName}
              label={t("detail.court")}
              value={caseData.court}
            />
          )}
          {caseData.lawyerName && (
            <InfoRow
              icon={"shield-outline" as IoniconsName}
              label={t("detail.lawyer")}
              value={caseData.lawyerName}
            />
          )}
          {caseData.description && (
            <InfoRow
              icon={"reader-outline" as IoniconsName}
              label={t("detail.description")}
              value={caseData.description}
            />
          )}
        </View>

        {/* Status Workflow Section */}
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
          <Text style={{ fontSize: 14, fontWeight: "700", color: colors.navy.DEFAULT, marginBottom: 12 }}>
            {t("detail.changeStatus")}
          </Text>
          {allowedTransitions.length > 0 ? (
            <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
              {allowedTransitions.map((targetStatus) => {
                const targetColor = STATUS_COLORS[targetStatus] ?? STATUS_COLORS.active;
                const targetIcon = STATUS_ICONS[targetStatus] ?? ("help-circle-outline" as IoniconsName);
                return (
                  <Pressable
                    key={targetStatus}
                    onPress={() => handleStatusChange(targetStatus)}
                    disabled={statusUpdating}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: targetColor.bg,
                      borderRadius: 10,
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      gap: 6,
                      opacity: statusUpdating ? 0.6 : 1,
                    }}
                  >
                    <Ionicons name={targetIcon} size={16} color={targetColor.text} />
                    <Text style={{ fontSize: 13, fontWeight: "600", color: targetColor.text }}>
                      {t('status.' + targetStatus)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 4 }}>
              <Ionicons name={"lock-closed-outline" as IoniconsName} size={16} color="#AAA" />
              <Text style={{ fontSize: 13, color: "#AAA", fontStyle: "italic" }}>
                {t('status.archived')}
              </Text>
            </View>
          )}
        </View>

        {/* Linked Documents Placeholder */}
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
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
            <Ionicons name={"document-outline" as IoniconsName} size={18} color={colors.navy.DEFAULT} style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.navy.DEFAULT }}>
              {t("detail.linkedDocs")}
            </Text>
          </View>
          <View
            style={{
              borderWidth: 1,
              borderStyle: "dashed",
              borderColor: "#DDD",
              borderRadius: 10,
              paddingVertical: 20,
              alignItems: "center",
            }}
          >
            <Ionicons name={"cloud-upload-outline" as IoniconsName} size={28} color="#DDD" />
            <Text style={{ fontSize: 13, color: "#AAA", marginTop: 8, textAlign: "center", paddingHorizontal: 16 }}>
              {t("detail.noDocsYet")}
            </Text>
          </View>
        </View>

        {/* Linked Calendar Events Placeholder */}
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
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
            <Ionicons name={"calendar-outline" as IoniconsName} size={18} color={colors.navy.DEFAULT} style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.navy.DEFAULT }}>
              {t("detail.linkedEvents")}
            </Text>
          </View>
          <View
            style={{
              borderWidth: 1,
              borderStyle: "dashed",
              borderColor: "#DDD",
              borderRadius: 10,
              paddingVertical: 20,
              alignItems: "center",
            }}
          >
            <Ionicons name={"time-outline" as IoniconsName} size={28} color="#DDD" />
            <Text style={{ fontSize: 13, color: "#AAA", marginTop: 8, textAlign: "center", paddingHorizontal: 16 }}>
              {t("detail.noEventsYet")}
            </Text>
          </View>
        </View>
      </ScrollView>
    </>
  );
}
