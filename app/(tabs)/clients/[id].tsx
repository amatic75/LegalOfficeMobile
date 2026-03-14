import { View, Text, ScrollView, Pressable, ActivityIndicator, Linking, Modal, TextInput, Alert } from "react-native";
import { useTranslation } from "react-i18next";
import { useEffect, useState, useCallback } from "react";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useServices } from "../../../src/hooks/useServices";
import { colors } from "../../../src/theme/tokens";
import type { Client, CaseSummary, CommunicationEntry, ClientDocument } from "../../../src/services/types";
import { STATUS_COLORS, CLIENT_DOC_TYPES } from "../../../src/services/types";

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

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation("clients");
  const services = useServices();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [client, setClient] = useState<Client | null>(null);
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [communications, setCommunications] = useState<CommunicationEntry[]>([]);
  const [clientDocs, setClientDocs] = useState<ClientDocument[]>([]);
  const [loading, setLoading] = useState(true);

  // Communication modal state
  const [showCommModal, setShowCommModal] = useState(false);
  const [commType, setCommType] = useState<CommunicationEntry['type']>("call");
  const [commSubject, setCommSubject] = useState("");
  const [commContent, setCommContent] = useState("");

  // Client document modal state
  const [showDocModal, setShowDocModal] = useState(false);
  const [docType, setDocType] = useState<ClientDocument['type']>("id-card");
  const [docName, setDocName] = useState("");

  // Add contact modal state (corporate)
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactRole, setContactRole] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  const loadData = useCallback(async () => {
    if (!id) return;
    const [clientData, casesData, commsData, docsData] = await Promise.all([
      services.clients.getClientById(id),
      services.cases.getCasesByClientId(id),
      services.communications.getByClientId(id),
      services.clientDocuments.getByClientId(id),
    ]);
    setClient(clientData);
    setCases(casesData);
    setCommunications(commsData);
    setClientDocs(docsData);
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

  const handleAddClientDoc = async () => {
    if (!id || !docName.trim()) return;
    await services.clientDocuments.create({
      clientId: id,
      type: docType,
      name: docName.trim(),
      uri: `file://mock/${docName.trim().replace(/\s/g, '-').toLowerCase()}.pdf`,
    });
    const refreshed = await services.clientDocuments.getByClientId(id);
    setClientDocs(refreshed);
    setShowDocModal(false);
    setDocName("");
    setDocType("id-card");
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

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: displayName,
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
              {t("clientDocuments.clientDocuments")}
            </Text>
            <Pressable
              onPress={() => setShowDocModal(true)}
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
              <Text style={{ fontSize: 11, fontWeight: "600", color: "#FFFFFF" }}>{t("clientDocuments.addDocument")}</Text>
            </Pressable>
          </View>
          {clientDocs.length > 0 ? (
            clientDocs.map((doc, index) => (
              <View
                key={doc.id}
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
              </View>
            ))
          ) : (
            <View style={{ alignItems: "center", paddingVertical: 20 }}>
              <Ionicons name={"document-outline" as IoniconsName} size={24} color="#DDD" />
              <Text style={{ fontSize: 13, color: "#AAA", marginTop: 6 }}>{t("clientDocuments.noClientDocuments")}</Text>
            </View>
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
                  onPress={() => router.push('/(tabs)/cases/' + caseItem.id)}
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

      {/* Client Document Modal */}
      <Modal visible={showDocModal} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: "#FFFFFF", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 + insets.bottom }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: "700", color: colors.navy.DEFAULT }}>
                {t("clientDocuments.addDocument")}
              </Text>
              <Pressable onPress={() => setShowDocModal(false)}>
                <Ionicons name={"close" as IoniconsName} size={24} color="#AAA" />
              </Pressable>
            </View>

            {/* Type selector */}
            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.navy.DEFAULT, marginBottom: 8 }}>
              Document Type
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              {CLIENT_DOC_TYPES.map((dt) => {
                const isActive = docType === dt;
                const labelKey = dt === "id-card" ? "idCard" : dt === "power-of-attorney" ? "powerOfAttorney" : dt === "engagement-letter" ? "engagementLetter" : dt;
                return (
                  <Pressable
                    key={dt}
                    onPress={() => setDocType(dt)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 8,
                      backgroundColor: isActive ? colors.golden[50] : "#F5F5F5",
                      borderWidth: 1,
                      borderColor: isActive ? colors.golden.DEFAULT : "#E5E5E5",
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: "600", color: isActive ? colors.golden.DEFAULT : "#888" }}>
                      {t("clientDocuments." + labelKey)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={{ fontSize: 13, fontWeight: "600", color: colors.navy.DEFAULT, marginBottom: 6 }}>
              Document Name
            </Text>
            <TextInput
              value={docName}
              onChangeText={setDocName}
              placeholder="Enter document name"
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
                marginBottom: 16,
              }}
            />

            <Pressable
              onPress={handleAddClientDoc}
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
