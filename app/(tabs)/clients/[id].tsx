import { View, Text, ScrollView, Pressable, ActivityIndicator, Linking } from "react-native";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useServices } from "../../../src/hooks/useServices";
import { colors } from "../../../src/theme/tokens";
import type { Client, CaseSummary } from "../../../src/services/types";
import { STATUS_COLORS } from "../../../src/services/types";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

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

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation("clients");
  const services = useServices();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [client, setClient] = useState<Client | null>(null);
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      services.clients.getClientById(id),
      services.cases.getCasesByClientId(id),
    ]).then(([clientData, casesData]) => {
      setClient(clientData);
      setCases(casesData);
      setLoading(false);
    });
  }, [id, services]);

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
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 16,
            paddingHorizontal: 16,
            paddingVertical: 4,
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
          <Text style={{ fontSize: 14, fontWeight: "700", color: colors.navy.DEFAULT, paddingTop: 12, paddingBottom: 4 }}>
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
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 16,
            paddingHorizontal: 16,
            paddingVertical: 4,
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
          <Text style={{ fontSize: 14, fontWeight: "700", color: colors.navy.DEFAULT, paddingTop: 12, paddingBottom: 4 }}>
            {t("detail.contact")}
          </Text>
          <ContactRow
            icon={"call-outline" as IoniconsName}
            label={t("form.phone")}
            value={client.phone}
            type="phone"
          />
          <ContactRow
            icon={"mail-outline" as IoniconsName}
            label={t("form.email")}
            value={client.email}
            type="email"
          />
        </View>

        {/* Representatives Section (Corporate only) */}
        {!isIndividual && client.representatives && client.representatives.length > 0 && (
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 16,
              paddingHorizontal: 16,
              paddingVertical: 4,
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
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.navy.DEFAULT, paddingTop: 12, paddingBottom: 4 }}>
              {t("detail.representatives")}
            </Text>
            {client.representatives.map((rep, index) => (
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
                  <View style={{ backgroundColor: colors.navy[50], borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
                    <Text style={{ fontSize: 10, fontWeight: "600", color: colors.navy.DEFAULT }}>{rep.role}</Text>
                  </View>
                </View>
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
            ))}
          </View>
        )}

        {/* Linked Cases Section */}
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 16,
            paddingHorizontal: 16,
            paddingVertical: 4,
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
          <Text style={{ fontSize: 14, fontWeight: "700", color: colors.navy.DEFAULT, paddingTop: 12, paddingBottom: 4 }}>
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
    </>
  );
}
