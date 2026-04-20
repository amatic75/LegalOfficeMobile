import { View, Text, ScrollView, Pressable, ActivityIndicator, Linking, Modal, TextInput, Alert } from "react-native";
import { useTranslation } from "react-i18next";
import { useEffect, useState, useCallback } from "react";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { useServices } from "../../../src/hooks/useServices";
import { useReturnBack } from "../../../src/hooks/useReturnBack";
import { colors } from "../../../src/theme/tokens";
import type { Client, CaseSummary, CommunicationEntry, ClientDocument, ClientActivity, ClientExpenseItem, ClientOutstandingSummary } from "../../../src/services/types";
import { STATUS_COLORS, ACTIVITY_TYPE_ICONS } from "../../../src/services/types";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

const SECTION_CARD = {
  backgroundColor: "#FFFFFF" as const,
  borderRadius: 16,
  paddingHorizontal: 16,
  paddingVertical: 12,
  marginHorizontal: 16,
  marginBottom: 12,
  shadowColor: "#000" as const,
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.04,
  shadowRadius: 4,
  elevation: 1,
  borderWidth: 1,
  borderColor: "#FFF3E0" as const,
};

const COMM_TYPE_ICONS: Record<CommunicationEntry['type'], IoniconsName> = {
  call: "call-outline" as IoniconsName,
  meeting: "people-outline" as IoniconsName,
  email: "mail-outline" as IoniconsName,
  note: "document-text-outline" as IoniconsName,
};

const DOC_TYPE_ICONS_MAP: Record<ClientDocument['type'], IoniconsName> = {
  "id-card": "card-outline" as IoniconsName,
  passport: "globe-outline" as IoniconsName,
  "power-of-attorney": "document-text-outline" as IoniconsName,
  "engagement-letter": "create-outline" as IoniconsName,
  other: "document-outline" as IoniconsName,
};

function getClientDisplayName(client: Client): string {
  if (client.type === 'individual') {
    return `${client.firstName ?? ''} ${client.lastName ?? ''}`.trim();
  }
  return client.companyName ?? '';
}

function InfoRow({ icon, label, value }: { icon: IoniconsName; label: string; value?: string }) {
  if (!value) return null;
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F5F0E8" }}>
      <View style={{ width: 32, alignItems: "center", marginTop: 2 }}>
        <Ionicons name={icon} size={16} color="#AAA" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 12, color: "#AAA", marginBottom: 2 }}>{label}</Text>
        <Text style={{ fontSize: 14, color: colors.navy.DEFAULT }}>{value}</Text>
      </View>
    </View>
  );
}

function ContactRow({ icon, label, value, type }: { icon: IoniconsName; label: string; value?: string; type: 'phone' | 'email' }) {
  if (!value) return null;

  const handlePress = async () => {
    const url = type === 'phone' ? `tel:${value}` : `mailto:${value}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch {
      // silently fail if linking not supported
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      style={{ flexDirection: "row", alignItems: "flex-start", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F5F0E8" }}
    >
      <View style={{ width: 32, alignItems: "center", marginTop: 2 }}>
        <Ionicons name={icon} size={16} color={colors.golden.DEFAULT} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 12, color: "#AAA", marginBottom: 2 }}>{label}</Text>
        <Text style={{ fontSize: 14, color: colors.golden.DEFAULT, fontWeight: "500" }}>{value}</Text>
      </View>
      <Ionicons name={"chevron-forward" as IoniconsName} size={14} color="#DDD" style={{ marginTop: 8 }} />
    </Pressable>
  );
}

function formatDateDisplay(dateStr: string): string {
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

function EmptyState({ icon, text }: { icon: IoniconsName; text: string }) {
  return (
    <View style={{ alignItems: "center", paddingVertical: 20 }}>
      <Ionicons name={icon} size={24} color="#DDD" />
      <Text style={{ fontSize: 13, color: "#AAA", marginTop: 6 }}>{text}</Text>
    </View>
  );
}

function ActivityItem({ item, isLast }: { item: ClientActivity; isLast: boolean }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        paddingVertical: 10,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: "#F5F0E8",
      }}
    >
      <View style={{ width: 32, alignItems: "center", marginTop: 2 }}>
        <Ionicons name={item.icon as IoniconsName} size={16} color={colors.golden.DEFAULT} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, fontWeight: "600", color: colors.navy.DEFAULT }}>
          {item.title}
        </Text>
        <Text style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
          {item.caseName} ({item.caseNumber})
        </Text>
        <Text style={{ fontSize: 11, color: "#AAA", marginTop: 2 }}>
          {formatDateDisplay(item.date)}
        </Text>
      </View>
      <Ionicons name={"chevron-forward" as IoniconsName} size={14} color="#DDD" style={{ marginTop: 8 }} />
    </View>
  );
}

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation("clients");
  const services = useServices();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { goBack, returnTo } = useReturnBack();

  const [client, setClient] = useState<Client | null>(null);
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [communications, setCommunications] = useState<CommunicationEntry[]>([]);
  const [clientDocs, setClientDocs] = useState<ClientDocument[]>([]);
  const [recentActivity, setRecentActivity] = useState<ClientActivity[]>([]);
  const [upcomingActivity, setUpcomingActivity] = useState<ClientActivity[]>([]);
  const [expenses, setExpenses] = useState<ClientExpenseItem[]>([]);
  const [outstandingSummary, setOutstandingSummary] = useState<ClientOutstandingSummary | null>(null);
  const [showOutstandingModal, setShowOutstandingModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Communication modal state
  const [showCommModal, setShowCommModal] = useState(false);
  const [commType, setCommType] = useState<CommunicationEntry['type']>("call");
  const [commSubject, setCommSubject] = useState("");
  const [commContent, setCommContent] = useState("");

  // Client document add-options state
  const [showAddDocOptions, setShowAddDocOptions] = useState(false);

  // Add contact modal state (corporate)
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactRole, setContactRole] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  const loadData = useCallback(async () => {
    if (!id) return;
    const [clientData, casesData, commsData, docsData, recentAct, upcomingAct, expensesData, outstandingData] = await Promise.all([
      services.clients.getClientById(id),
      services.cases.getCasesByClientId(id),
      services.communications.getByClientId(id),
      services.clientDocuments.getByClientId(id),
      services.clientAggregation.getRecentActivity(id, 3),
      services.clientAggregation.getUpcomingActivity(id, 3),
      services.clientAggregation.getExpenses(id),
      services.clientAggregation.getOutstandingSummary(id),
    ]);
    setClient(clientData);
    setCases(casesData);
    setCommunications(commsData);
    setClientDocs(docsData);
    setRecentActivity(recentAct);
    setUpcomingActivity(upcomingAct);
    setExpenses(expensesData);
    setOutstandingSummary(outstandingData);
    setLoading(false);
  }, [id, services]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleAddCommunication = async () => {
    if (!id || !commSubject.trim()) return;
    await services.communications.create({
      clientId: id,
      type: commType,
      subject: commSubject.trim(),
      content: commContent.trim() || undefined,
      date: new Date().toISOString().split("T")[0],
    });
    const refreshed = await services.communications.getByClientId(id);
    setCommunications(refreshed);
    setShowCommModal(false);
    setCommSubject("");
    setCommContent("");
    setCommType("call");
  };

  const handleOpenDoc = async (doc: ClientDocument) => {
    if (!doc.uri || doc.uri.startsWith("file://mock/")) {
      Alert.alert(t("documents.cannotOpenTitle"), t("documents.cannotOpenMessage"));
      return;
    }
    try {
      const supported = await Linking.canOpenURL(doc.uri);
      if (supported) {
        await Linking.openURL(doc.uri);
      } else {
        Alert.alert(t("documents.cannotOpenTitle"), t("documents.cannotOpenMessage"));
      }
    } catch {
      Alert.alert(t("documents.cannotOpenTitle"), t("documents.cannotOpenMessage"));
    }
  };

  const handleDeleteClientDoc = (docId: string, docNameStr: string) => {
    Alert.alert(
      "Delete Document",
      `Are you sure you want to delete "${docNameStr}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await services.clientDocuments.delete(docId);
            if (id) {
              const refreshed = await services.clientDocuments.getByClientId(id);
              setClientDocs(refreshed);
            }
          },
        },
      ]
    );
  };

  const handleUploadFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "image/jpeg", "image/png"],
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      await services.clientDocuments.create({
        clientId: id!,
        type: "other",
        name: asset.name,
        uri: asset.uri,
      });
      if (id) {
        const refreshed = await services.clientDocuments.getByClientId(id);
        setClientDocs(refreshed);
      }
      setShowAddDocOptions(false);
    }
  };

  const handleCapturePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        t("documents.permissionRequired"),
        t("documents.permissionDenied"),
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      const name = `Photo_${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
      await services.clientDocuments.create({
        clientId: id!,
        type: "other",
        name,
        uri: asset.uri,
      });
      if (id) {
        const refreshed = await services.clientDocuments.getByClientId(id);
        setClientDocs(refreshed);
      }
      setShowAddDocOptions(false);
    }
  };

  const handleAddContact = async () => {
    if (!id || !client || !contactName.trim() || !contactRole.trim()) return;
    const existingReps = client.representatives ?? [];
    const newRep = {
      name: contactName.trim(),
      role: contactRole.trim(),
      phone: contactPhone.trim() || undefined,
      email: contactEmail.trim() || undefined,
    };
    await services.clients.updateClient(id, { representatives: [...existingReps, newRep] });
    const refreshed = await services.clients.getClientById(id);
    if (refreshed) setClient(refreshed);
    setShowContactModal(false);
    setContactName("");
    setContactRole("");
    setContactPhone("");
    setContactEmail("");
  };

  if (loading || !client) {
    return (
      <>
        <Stack.Screen options={{ headerTitle: "" }} />
        <View style={{ flex: 1, backgroundColor: colors.cream.DEFAULT, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.golden.DEFAULT} />
        </View>
      </>
    );
  }

  const displayName = getClientDisplayName(client);
  const isIndividual = client.type === 'individual';

  function formatRSD(amount: number): string {
    const parts = amount.toFixed(2).split(".");
    const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `${intPart},${parts[1]} RSD`;
  }

  async function handleToggleExpensePaid(item: ClientExpenseItem) {
    if (item.type !== "expense") return;
    // Extract original expense ID from cexp-exp-{id} format
    const originalId = item.id.replace("cexp-exp-", "");
    await services.expenses.updateExpense(originalId, { paid: !item.paid });
    const refreshed = await services.clientAggregation.getExpenses(id);
    setExpenses(refreshed);
  }

  function groupExpensesByCase(items: ClientExpenseItem[]) {
    const groups: Record<string, { caseName: string; caseNumber: string; items: ClientExpenseItem[] }> = {};
    for (const item of items) {
      if (!groups[item.caseId]) {
        groups[item.caseId] = { caseName: item.caseName, caseNumber: item.caseNumber, items: [] };
      }
      groups[item.caseId].items.push(item);
    }
    return Object.entries(groups).map(([caseId, group]) => (
      <View key={caseId} style={{ marginBottom: 8 }}>
        <Text style={{ fontSize: 12, fontWeight: "700", color: colors.navy.DEFAULT, marginBottom: 6 }}>
          {group.caseName} ({group.caseNumber})
        </Text>
        {group.items.map((exp, idx) => {
          const isPaid = exp.paid === true;
          const isExpenseType = exp.type === "expense";
          return (
            <View
              key={exp.id}
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                paddingVertical: 8,
                paddingLeft: 8,
                borderLeftWidth: 3,
                borderLeftColor: isPaid ? "#CCC" : (exp.type === "time-entry" ? colors.golden.DEFAULT : "#43A047"),
                marginBottom: idx < group.items.length - 1 ? 6 : 0,
                backgroundColor: "#FAFAFA",
                borderRadius: 6,
                paddingHorizontal: 10,
              }}
            >
              {isExpenseType && (
                <Pressable
                  onPress={() => handleToggleExpensePaid(exp)}
                  hitSlop={8}
                  style={{ marginRight: 8, marginTop: 4 }}
                >
                  <Ionicons
                    name={(isPaid ? "checkmark-circle" : "ellipse-outline") as IoniconsName}
                    size={18}
                    color={isPaid ? "#2E7D32" : "#CCC"}
                  />
                </Pressable>
              )}
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 }}>
                  <View style={{
                    backgroundColor: exp.type === "time-entry" ? colors.golden[50] : "#E8F5E9",
                    borderRadius: 4,
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                  }}>
                    <Text style={{
                      fontSize: 9,
                      fontWeight: "700",
                      color: exp.type === "time-entry" ? colors.golden.DEFAULT : "#2E7D32",
                    }}>
                      {t(exp.type === "time-entry" ? "expenses.timeEntry" : "expenses.expense")}
                    </Text>
                  </View>
                  {isPaid && (
                    <View style={{
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 8,
                      backgroundColor: "#E8F5E9",
                    }}>
                      <Text style={{ fontSize: 9, fontWeight: "700", color: "#2E7D32" }}>
                        {t("expenses.paid")}
                      </Text>
                    </View>
                  )}
                  {exp.hours != null && (
                    <Text style={{ fontSize: 10, color: "#888" }}>{exp.hours}h</Text>
                  )}
                  {exp.category && (
                    <Text style={{ fontSize: 10, color: isPaid ? "#BBB" : "#888" }}>{exp.category}</Text>
                  )}
                </View>
                <Text style={{
                  fontSize: 12,
                  color: isPaid ? "#AAA" : colors.navy.DEFAULT,
                  textDecorationLine: isPaid ? "line-through" : "none",
                }}>{exp.description}</Text>
                <Text style={{ fontSize: 10, color: "#AAA", marginTop: 2 }}>{formatDateDisplay(exp.date)}</Text>
              </View>
              <Text style={{ fontSize: 13, fontWeight: "700", color: isPaid ? "#AAA" : colors.navy.DEFAULT, marginLeft: 8, marginTop: 4 }}>
                {formatRSD(exp.amount)}
              </Text>
            </View>
          );
        })}
      </View>
    ));
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: displayName,
          headerLeft: returnTo
            ? () => (
                <Pressable onPress={goBack} style={{ marginLeft: 4, padding: 4 }}>
                  <Ionicons name={"arrow-back" as IoniconsName} size={24} color="#FFFFFF" />
                </Pressable>
              )
            : undefined,
          headerRight: () => (
            <Pressable
              onPress={() => router.push('/(tabs)/clients/edit/' + id)}
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
        {/* Profile Card */}
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 16,
            padding: 20,
            margin: 16,
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 2,
            borderWidth: 1,
            borderColor: "#FFF3E0",
          }}
        >
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              backgroundColor: isIndividual ? "#FDF8EC" : colors.navy[50],
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 12,
            }}
          >
            <Ionicons
              name={(isIndividual ? "person" : "business") as IoniconsName}
              size={28}
              color={isIndividual ? colors.golden.DEFAULT : colors.navy.DEFAULT}
            />
          </View>
          <Text style={{ fontSize: 20, fontWeight: "700", color: colors.navy.DEFAULT, textAlign: "center", marginBottom: 4 }}>
            {displayName}
          </Text>
          <View
            style={{
              backgroundColor: isIndividual ? colors.golden[50] : colors.navy[50],
              borderRadius: 6,
              paddingHorizontal: 10,
              paddingVertical: 4,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: isIndividual ? colors.golden.DEFAULT : colors.navy.DEFAULT,
              }}
            >
              {t(isIndividual ? 'type.individual' : 'type.corporate')}
            </Text>
          </View>
        </View>

        {/* Info Section */}
        <View style={SECTION_CARD}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: colors.navy.DEFAULT, marginBottom: 4 }}>
            {t("detail.profile")}
          </Text>
          {isIndividual ? (
            <>
              <InfoRow icon={"card-outline" as IoniconsName} label="JMBG" value={client.jmbg} />
              <InfoRow icon={"location-outline" as IoniconsName} label={t("form.address")} value={client.address} />
              <InfoRow icon={"navigate-outline" as IoniconsName} label={t("form.city")} value={client.city} />
            </>
          ) : (
            <>
              <InfoRow icon={"document-text-outline" as IoniconsName} label="PIB" value={client.pib} />
              <InfoRow icon={"barcode-outline" as IoniconsName} label={t("form.mb")} value={client.mb} />
              <InfoRow icon={"location-outline" as IoniconsName} label={t("form.address")} value={client.address} />
              <InfoRow icon={"navigate-outline" as IoniconsName} label={t("form.city")} value={client.city} />
            </>
          )}
        </View>

        {/* Contact Section */}
        <View style={SECTION_CARD}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: colors.navy.DEFAULT, marginBottom: 4 }}>
            {t("detail.contact")}
          </Text>
          <ContactRow icon={"call-outline" as IoniconsName} label={t("form.phone")} value={client.phone} type="phone" />
          <ContactRow icon={"mail-outline" as IoniconsName} label={t("form.email")} value={client.email} type="email" />
        </View>

        {/* Representatives / Contacts Section (Corporate only) */}
        {!isIndividual && (
          <View style={SECTION_CARD}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.navy.DEFAULT }}>
                {t("contacts.contacts")}
              </Text>
              <Pressable
                onPress={() => setShowContactModal(true)}
                style={{
                  backgroundColor: colors.golden.DEFAULT,
                  borderRadius: 6,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Ionicons name={"add" as IoniconsName} size={14} color="#FFFFFF" />
                <Text style={{ fontSize: 11, fontWeight: "600", color: "#FFFFFF" }}>{t("contacts.addContact")}</Text>
              </Pressable>
            </View>
            {client.representatives && client.representatives.length > 0 ? (
              client.representatives.map((rep, index) => (
                <View
                  key={index}
                  style={{
                    paddingVertical: 10,
                    borderBottomWidth: index < (client.representatives?.length ?? 0) - 1 ? 1 : 0,
                    borderBottomColor: "#F5F0E8",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
                    <Ionicons name={"person-circle-outline" as IoniconsName} size={18} color={colors.navy.DEFAULT} style={{ marginRight: 8 }} />
                    <Text style={{ fontSize: 14, fontWeight: "600", color: colors.navy.DEFAULT, flex: 1 }}>
                      {rep.name}
                    </Text>
                    {rep.isPrimary && (
                      <Ionicons name={"star" as IoniconsName} size={16} color={colors.golden.DEFAULT} style={{ marginRight: 6 }} />
                    )}
                    <View style={{ backgroundColor: colors.navy[50], borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
                      <Text style={{ fontSize: 10, fontWeight: "600", color: colors.navy.DEFAULT }}>{rep.role}</Text>
                    </View>
                  </View>
                  {rep.isPrimary && (
                    <Text style={{ fontSize: 11, color: colors.golden.DEFAULT, fontWeight: "600", marginLeft: 26, marginBottom: 2 }}>
                      {t("contacts.primaryContact")}
                    </Text>
                  )}
                  {rep.phone && (
                    <Pressable
                      onPress={() => Linking.openURL(`tel:${rep.phone}`)}
                      style={{ flexDirection: "row", alignItems: "center", marginLeft: 26, marginTop: 2 }}
                    >
                      <Ionicons name={"call-outline" as IoniconsName} size={12} color={colors.golden.DEFAULT} style={{ marginRight: 6 }} />
                      <Text style={{ fontSize: 13, color: colors.golden.DEFAULT }}>{rep.phone}</Text>
                    </Pressable>
                  )}
                  {rep.email && (
                    <Pressable
                      onPress={() => Linking.openURL(`mailto:${rep.email}`)}
                      style={{ flexDirection: "row", alignItems: "center", marginLeft: 26, marginTop: 2 }}
                    >
                      <Ionicons name={"mail-outline" as IoniconsName} size={12} color={colors.golden.DEFAULT} style={{ marginRight: 6 }} />
                      <Text style={{ fontSize: 13, color: colors.golden.DEFAULT }}>{rep.email}</Text>
                    </Pressable>
                  )}
                </View>
              ))
            ) : (
              <View style={{ alignItems: "center", paddingVertical: 20 }}>
                <Ionicons name={"people-outline" as IoniconsName} size={24} color="#DDD" />
                <Text style={{ fontSize: 13, color: "#AAA", marginTop: 6 }}>No contacts yet</Text>
              </View>
            )}
          </View>
        )}

        {/* Communication History Section */}
        <View style={SECTION_CARD}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.navy.DEFAULT }}>
              {t("communication.communicationHistory")}
            </Text>
            <Pressable
              onPress={() => setShowCommModal(true)}
              style={{
                backgroundColor: colors.golden.DEFAULT,
                borderRadius: 6,
                paddingHorizontal: 10,
                paddingVertical: 5,
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Ionicons name={"add" as IoniconsName} size={14} color="#FFFFFF" />
              <Text style={{ fontSize: 11, fontWeight: "600", color: "#FFFFFF" }}>{t("communication.addCommunication")}</Text>
            </Pressable>
          </View>
          {communications.length > 0 ? (
            communications.map((comm, index) => (
              <View
                key={comm.id}
                style={{
                  flexDirection: "row",
                  paddingVertical: 10,
                  borderBottomWidth: index < communications.length - 1 ? 1 : 0,
                  borderBottomColor: "#F5F0E8",
                }}
              >
                <View style={{ width: 32, alignItems: "center", marginTop: 2 }}>
                  <Ionicons name={COMM_TYPE_ICONS[comm.type]} size={16} color={colors.golden.DEFAULT} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: colors.navy.DEFAULT }}>
                    {comm.subject}
                  </Text>
                  <Text style={{ fontSize: 11, color: "#AAA", marginTop: 2 }}>
                    {formatDateDisplay(comm.date)}
                  </Text>
                  {comm.content && (
                    <Text numberOfLines={2} style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
                      {comm.content}
                    </Text>
                  )}
                </View>
              </View>
            ))
          ) : (
            <View style={{ alignItems: "center", paddingVertical: 20 }}>
              <Ionicons name={"chatbubbles-outline" as IoniconsName} size={24} color="#DDD" />
              <Text style={{ fontSize: 13, color: "#AAA", marginTop: 6 }}>{t("communication.noCommunications")}</Text>
            </View>
          )}
        </View>

        {/* Client Documents Section */}
        <View style={SECTION_CARD}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.navy.DEFAULT }}>
              {t("documents.title")}
            </Text>
            <Pressable
              onPress={() => setShowAddDocOptions((v) => !v)}
              style={{
                backgroundColor: colors.golden.DEFAULT,
                borderRadius: 6,
                paddingHorizontal: 10,
                paddingVertical: 5,
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Ionicons name={(showAddDocOptions ? "close" : "add") as IoniconsName} size={14} color="#FFFFFF" />
              <Text style={{ fontSize: 11, fontWeight: "600", color: "#FFFFFF" }}>{t("clientDocuments.addDocument")}</Text>
            </Pressable>
          </View>
          {clientDocs.length > 0 ? (
            clientDocs.map((doc, index) => (
              <Pressable
                key={doc.id}
                onPress={() => handleOpenDoc(doc)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 10,
                  borderBottomWidth: index < clientDocs.length - 1 ? 1 : 0,
                  borderBottomColor: "#F5F0E8",
                }}
              >
                <View style={{ width: 32, alignItems: "center" }}>
                  <Ionicons name={DOC_TYPE_ICONS_MAP[doc.type] || ("document-outline" as IoniconsName)} size={16} color={colors.navy.DEFAULT} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: colors.navy.DEFAULT }}>
                    {doc.name}
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", marginTop: 3, gap: 8 }}>
                    <View style={{ backgroundColor: colors.golden[50], borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
                      <Text style={{ fontSize: 10, fontWeight: "600", color: colors.golden.DEFAULT }}>
                        {t("clientDocuments." + (doc.type === "id-card" ? "idCard" : doc.type === "power-of-attorney" ? "powerOfAttorney" : doc.type === "engagement-letter" ? "engagementLetter" : doc.type))}
                      </Text>
                    </View>
                    {doc.expiresAt && (
                      <Text style={{ fontSize: 11, color: "#AAA" }}>
                        {t("clientDocuments.expiresAt")}: {formatDateDisplay(doc.expiresAt)}
                      </Text>
                    )}
                  </View>
                </View>
                <Pressable
                  onPress={() => handleDeleteClientDoc(doc.id, doc.name)}
                  style={{ padding: 6 }}
                >
                  <Ionicons name={"trash-outline" as IoniconsName} size={16} color="#E53935" />
                </Pressable>
              </Pressable>
            ))
          ) : (
            <View style={{ alignItems: "center", paddingVertical: 20 }}>
              <Ionicons name={"document-outline" as IoniconsName} size={24} color="#DDD" />
              <Text style={{ fontSize: 13, color: "#AAA", marginTop: 6 }}>{t("documents.noDocuments")}</Text>
            </View>
          )}
          {/* Upload File / Take Photo action bar (gated behind Add Document toggle) */}
          {showAddDocOptions && (
            <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
              <Pressable
                onPress={handleUploadFile}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: colors.golden[50],
                  borderWidth: 1,
                  borderColor: colors.golden.DEFAULT,
                }}
              >
                <Ionicons name={"cloud-upload-outline" as IoniconsName} size={16} color={colors.golden.DEFAULT} />
                <Text style={{ fontSize: 12, fontWeight: "600", color: colors.golden.DEFAULT }}>{t("documents.uploadFile")}</Text>
              </Pressable>
              <Pressable
                onPress={handleCapturePhoto}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: colors.golden[50],
                  borderWidth: 1,
                  borderColor: colors.golden.DEFAULT,
                }}
              >
                <Ionicons name={"camera-outline" as IoniconsName} size={16} color={colors.golden.DEFAULT} />
                <Text style={{ fontSize: 12, fontWeight: "600", color: colors.golden.DEFAULT }}>{t("documents.takePhoto")}</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Recent Activity Section */}
        <View style={SECTION_CARD}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.navy.DEFAULT }}>
              {t("recentActivity.title")}
            </Text>
            {recentActivity.length > 0 && (
              <Pressable onPress={() => router.push({ pathname: "/(tabs)/clients/activity", params: { clientId: id, mode: "recent", clientName: displayName } })}>
                <Text style={{ fontSize: 12, fontWeight: "600", color: colors.golden.DEFAULT }}>{t("recentActivity.seeAll")}</Text>
              </Pressable>
            )}
          </View>
          {recentActivity.length > 0 ? (
            recentActivity.map((item, idx) => <ActivityItem key={item.id} item={item} isLast={idx === recentActivity.length - 1} />)
          ) : (
            <EmptyState icon={"time-outline" as IoniconsName} text={t("recentActivity.noActivity")} />
          )}
        </View>

        {/* Upcoming Activity Section */}
        <View style={SECTION_CARD}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.navy.DEFAULT }}>
              {t("upcomingActivity.title")}
            </Text>
            {upcomingActivity.length > 0 && (
              <Pressable onPress={() => router.push({ pathname: "/(tabs)/clients/activity", params: { clientId: id, mode: "upcoming", clientName: displayName } })}>
                <Text style={{ fontSize: 12, fontWeight: "600", color: colors.golden.DEFAULT }}>{t("upcomingActivity.seeAll")}</Text>
              </Pressable>
            )}
          </View>
          {upcomingActivity.length > 0 ? (
            upcomingActivity.map((item, idx) => <ActivityItem key={item.id} item={item} isLast={idx === upcomingActivity.length - 1} />)
          ) : (
            <EmptyState icon={"calendar-outline" as IoniconsName} text={t("upcomingActivity.noActivity")} />
          )}
        </View>

        {/* Expenses & Billing Section (merged) */}
        <View style={SECTION_CARD}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: colors.navy.DEFAULT, marginBottom: 4 }}>
            {t("expenses.expensesAndBilling")}
          </Text>
          {outstandingSummary && outstandingSummary.totalOutstanding > 0 && (
            <View style={{ backgroundColor: "#FFF5F5", borderRadius: 8, padding: 10, marginBottom: 12 }}>
              <Text style={{ fontSize: 12, color: "#888" }}>{t("outstanding.grandTotal")}</Text>
              <Text style={{ fontSize: 18, fontWeight: "700", color: "#E53935" }}>
                {formatRSD(outstandingSummary.totalOutstanding)}
              </Text>
              <Pressable
                onPress={() => setShowOutstandingModal(true)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: 8,
                  borderRadius: 8,
                  backgroundColor: colors.golden[50],
                  borderWidth: 1,
                  borderColor: colors.golden.DEFAULT,
                  gap: 6,
                  marginTop: 8,
                }}
              >
                <Ionicons name={"list-outline" as IoniconsName} size={16} color={colors.golden.DEFAULT} />
                <Text style={{ fontSize: 13, fontWeight: "600", color: colors.golden.DEFAULT }}>
                  {t("expenses.viewInvoices")}
                </Text>
              </Pressable>
            </View>
          )}
          {expenses.length > 0 ? (
            <>
              {/* Total sum */}
              <View style={{ backgroundColor: colors.golden[50], borderRadius: 8, padding: 10, marginBottom: 12, alignItems: "center" }}>
                <Text style={{ fontSize: 12, color: "#888" }}>{t("expenses.total")}</Text>
                <Text style={{ fontSize: 18, fontWeight: "700", color: colors.navy.DEFAULT }}>
                  {formatRSD(expenses.reduce((sum, e) => sum + e.amount, 0))}
                </Text>
              </View>
              {/* Group by case */}
              {groupExpensesByCase(expenses)}
            </>
          ) : (
            !(outstandingSummary && outstandingSummary.totalOutstanding > 0) && (
              <EmptyState icon={"receipt-outline" as IoniconsName} text={t("expenses.noExpenses")} />
            )
          )}
        </View>

        {/* Linked Cases Section */}
        <View style={SECTION_CARD}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: colors.navy.DEFAULT, marginBottom: 4 }}>
            {t("detail.linkedCases")}
          </Text>
          {cases.length === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: 20 }}>
              <Ionicons name={"folder-open-outline" as IoniconsName} size={24} color="#DDD" />
              <Text style={{ fontSize: 13, color: "#AAA", marginTop: 6 }}>{t("detail.noCases")}</Text>
            </View>
          ) : (
            cases.map((caseItem, index) => {
              const statusColor = STATUS_COLORS[caseItem.status] ?? STATUS_COLORS.active;
              return (
                <Pressable
                  key={caseItem.id}
                  onPress={() => router.push({ pathname: '/(tabs)/cases/[id]', params: { id: caseItem.id, returnTo: `/(tabs)/clients/${id}` } })}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 10,
                    borderBottomWidth: index < cases.length - 1 ? 1 : 0,
                    borderBottomColor: "#F5F0E8",
                  }}
                >
                  <View style={{ width: 32, alignItems: "center" }}>
                    <Ionicons name={"folder-outline" as IoniconsName} size={16} color={colors.golden.DEFAULT} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: "600", color: colors.navy.DEFAULT, marginBottom: 2 }}>
                      {caseItem.caseNumber}
                    </Text>
                    <Text numberOfLines={1} style={{ fontSize: 12, color: "#888" }}>
                      {caseItem.title}
                    </Text>
                  </View>
                  <View
                    style={{
                      backgroundColor: statusColor.bg,
                      borderRadius: 6,
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      marginLeft: 8,
                    }}
                  >
                    <Text style={{ fontSize: 10, fontWeight: "600", color: statusColor.text }}>
                      {caseItem.status.toUpperCase()}
                    </Text>
                  </View>
                  <Ionicons name={"chevron-forward" as IoniconsName} size={14} color="#DDD" style={{ marginLeft: 4 }} />
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Communication Modal */}
      <Modal visible={showCommModal} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: "#FFFFFF", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 + insets.bottom }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: "700", color: colors.navy.DEFAULT }}>
                {t("communication.addCommunication")}
              </Text>
              <Pressable onPress={() => setShowCommModal(false)}>
                <Ionicons name={"close" as IoniconsName} size={24} color="#AAA" />
              </Pressable>
            </View>

            {/* Type chips */}
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
              {(["call", "meeting", "email", "note"] as CommunicationEntry['type'][]).map((ct) => {
                const isActive = commType === ct;
                return (
                  <Pressable
                    key={ct}
                    onPress={() => setCommType(ct)}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 8,
                      backgroundColor: isActive ? colors.golden[50] : "#F5F5F5",
                      borderWidth: 1,
                      borderColor: isActive ? colors.golden.DEFAULT : "#E5E5E5",
                      alignItems: "center",
                    }}
                  >
                    <Ionicons name={COMM_TYPE_ICONS[ct]} size={18} color={isActive ? colors.golden.DEFAULT : "#888"} />
                    <Text style={{ fontSize: 11, fontWeight: "600", color: isActive ? colors.golden.DEFAULT : "#888", marginTop: 4 }}>
                      {t("communication." + ct)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.navy.DEFAULT, marginBottom: 6 }}>
              {t("communication.subject")}
            </Text>
            <TextInput
              value={commSubject}
              onChangeText={setCommSubject}
              placeholder={t("communication.subject")}
              placeholderTextColor="#CCC"
              style={{
                backgroundColor: "#F9F9F9",
                borderRadius: 10,
                paddingHorizontal: 14,
                paddingVertical: 12,
                fontSize: 14,
                color: colors.navy.DEFAULT,
                borderWidth: 1,
                borderColor: "#E5E5E5",
                marginBottom: 12,
              }}
            />

            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.navy.DEFAULT, marginBottom: 6 }}>
              {t("communication.content")}
            </Text>
            <TextInput
              value={commContent}
              onChangeText={setCommContent}
              placeholder={t("communication.content")}
              placeholderTextColor="#CCC"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              style={{
                backgroundColor: "#F9F9F9",
                borderRadius: 10,
                paddingHorizontal: 14,
                paddingVertical: 12,
                fontSize: 14,
                color: colors.navy.DEFAULT,
                borderWidth: 1,
                borderColor: "#E5E5E5",
                marginBottom: 16,
                minHeight: 80,
              }}
            />

            <Pressable
              onPress={handleAddCommunication}
              style={{
                backgroundColor: colors.golden.DEFAULT,
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#FFFFFF" }}>{t("form.save")}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Outstanding Drill-down Modal */}
      <Modal visible={showOutstandingModal} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: "#FFFFFF", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 + insets.bottom, maxHeight: "70%" }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: "700", color: colors.navy.DEFAULT }}>
                {t("outstanding.invoiceDetail")}
              </Text>
              <Pressable onPress={() => setShowOutstandingModal(false)}>
                <Ionicons name={"close" as IoniconsName} size={24} color="#AAA" />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {outstandingSummary?.invoices.map((inv) => (
                <View key={inv.id} style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#F5F0E8" }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                    <Text style={{ fontSize: 14, fontWeight: "600", color: colors.navy.DEFAULT }}>{inv.invoiceNumber}</Text>
                    <Text style={{ fontSize: 14, fontWeight: "700", color: "#E53935" }}>{formatRSD(inv.outstanding)}</Text>
                  </View>
                  <Text style={{ fontSize: 12, color: "#888", marginBottom: 2 }}>{inv.caseName}</Text>
                  <View style={{ flexDirection: "row", gap: 12 }}>
                    <Text style={{ fontSize: 11, color: "#AAA" }}>{t("outstanding.issued")}: {formatDateDisplay(inv.issuedDate)}</Text>
                    <Text style={{ fontSize: 11, color: "#AAA" }}>{t("outstanding.due")}: {formatDateDisplay(inv.dueDate)}</Text>
                  </View>
                  <View style={{ flexDirection: "row", gap: 12, marginTop: 4 }}>
                    <Text style={{ fontSize: 11, color: "#888" }}>{t("outstanding.paid")}: {formatRSD(inv.paidAmount)}</Text>
                    <Text style={{ fontSize: 11, color: "#E53935" }}>{t("outstanding.remaining")}: {formatRSD(inv.outstanding)}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Add Contact Modal (Corporate) */}
      <Modal visible={showContactModal} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: "#FFFFFF", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 + insets.bottom }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: "700", color: colors.navy.DEFAULT }}>
                {t("contacts.addContact")}
              </Text>
              <Pressable onPress={() => setShowContactModal(false)}>
                <Ionicons name={"close" as IoniconsName} size={24} color="#AAA" />
              </Pressable>
            </View>

            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.navy.DEFAULT, marginBottom: 6 }}>
              {t("form.representativeName")} *
            </Text>
            <TextInput
              value={contactName}
              onChangeText={setContactName}
              placeholder={t("form.representativeName")}
              placeholderTextColor="#CCC"
              style={{
                backgroundColor: "#F9F9F9",
                borderRadius: 10,
                paddingHorizontal: 14,
                paddingVertical: 12,
                fontSize: 14,
                color: colors.navy.DEFAULT,
                borderWidth: 1,
                borderColor: "#E5E5E5",
                marginBottom: 12,
              }}
            />

            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.navy.DEFAULT, marginBottom: 6 }}>
              {t("form.representativeRole")} *
            </Text>
            <TextInput
              value={contactRole}
              onChangeText={setContactRole}
              placeholder={t("form.representativeRole")}
              placeholderTextColor="#CCC"
              style={{
                backgroundColor: "#F9F9F9",
                borderRadius: 10,
                paddingHorizontal: 14,
                paddingVertical: 12,
                fontSize: 14,
                color: colors.navy.DEFAULT,
                borderWidth: 1,
                borderColor: "#E5E5E5",
                marginBottom: 12,
              }}
            />

            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.navy.DEFAULT, marginBottom: 6 }}>
              {t("form.phone")}
            </Text>
            <TextInput
              value={contactPhone}
              onChangeText={setContactPhone}
              placeholder={t("form.phone")}
              placeholderTextColor="#CCC"
              keyboardType="phone-pad"
              style={{
                backgroundColor: "#F9F9F9",
                borderRadius: 10,
                paddingHorizontal: 14,
                paddingVertical: 12,
                fontSize: 14,
                color: colors.navy.DEFAULT,
                borderWidth: 1,
                borderColor: "#E5E5E5",
                marginBottom: 12,
              }}
            />

            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.navy.DEFAULT, marginBottom: 6 }}>
              {t("form.email")}
            </Text>
            <TextInput
              value={contactEmail}
              onChangeText={setContactEmail}
              placeholder={t("form.email")}
              placeholderTextColor="#CCC"
              keyboardType="email-address"
              autoCapitalize="none"
              style={{
                backgroundColor: "#F9F9F9",
                borderRadius: 10,
                paddingHorizontal: 14,
                paddingVertical: 12,
                fontSize: 14,
                color: colors.navy.DEFAULT,
                borderWidth: 1,
                borderColor: "#E5E5E5",
                marginBottom: 16,
              }}
            />

            <Pressable
              onPress={handleAddContact}
              style={{
                backgroundColor: colors.golden.DEFAULT,
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "700", color: "#FFFFFF" }}>{t("form.save")}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}
