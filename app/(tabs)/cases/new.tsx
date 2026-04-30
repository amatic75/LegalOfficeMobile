import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useServices } from "../../../src/hooks/useServices";
import { useReturnBack } from "../../../src/hooks/useReturnBack";
import { colors } from "../../../src/theme/tokens";
import type { CaseType, CaseSubtype, Client, Court } from "../../../src/services/types";
import { CASE_TYPE_SUBTYPES } from "../../../src/services/types";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

const TYPE_ICONS: Record<CaseType, IoniconsName> = {
  civil: "document-text-outline" as IoniconsName,
  criminal: "shield-outline" as IoniconsName,
  family: "people-outline" as IoniconsName,
  corporate: "business-outline" as IoniconsName,
};

const TYPE_COLORS: Record<CaseType, string> = {
  civil: '#1565C0',
  criminal: '#C62828',
  family: '#6A1B9A',
  corporate: '#00695C',
};

function getClientDisplayName(client: Client): string {
  if (client.type === 'individual') {
    return `${client.firstName ?? ''} ${client.lastName ?? ''}`.trim();
  }
  return client.companyName ?? '';
}

export default function NewCaseScreen() {
  const { t } = useTranslation("cases");
  const services = useServices();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // Optional pre-selected client from the client overview's "+ new case" button.
  const { clientId: preselectedClientId } = useLocalSearchParams<{ clientId?: string }>();
  // Honors `?returnTo=...` so a back tap lands on the originating screen
  // (e.g. the client overview) even when the cases stack is otherwise empty.
  const { goBack, returnTo } = useReturnBack();

  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Selections
  const [selectedType, setSelectedType] = useState<CaseType | null>(null);
  const [selectedSubtype, setSelectedSubtype] = useState<CaseSubtype | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(preselectedClientId ?? null);
  const [selectedCourtId, setSelectedCourtId] = useState<string | null>(null);

  // Text fields
  const [caseNumber, setCaseNumber] = useState('P ' + Math.floor(100 + Math.random() * 900) + '/2025');
  const [title, setTitle] = useState('');
  const [opposingParty, setOpposingParty] = useState('');
  const [description, setDescription] = useState('');

  // Data
  const [clients, setClients] = useState<Client[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [clientSearch, setClientSearch] = useState('');

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    Promise.all([
      services.clients.getClients(),
      services.directory.getCourts(),
    ]).then(([clientsData, courtsData]) => {
      setClients(clientsData);
      setCourts(courtsData);
      setLoadingData(false);
    });
  }, [services]);

  const filteredClients = clientSearch
    ? clients.filter((c) => {
        const name = getClientDisplayName(c);
        return name.toLowerCase().includes(clientSearch.toLowerCase());
      })
    : clients;

  const selectedClient = clients.find((c) => c.id === selectedClientId);
  const selectedCourt = courts.find((c) => c.id === selectedCourtId);

  const handleTypeSelect = (type: CaseType) => {
    setSelectedType(type);
    setSelectedSubtype(null);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!selectedType) newErrors.type = t("form.selectType");
    if (!title.trim()) newErrors.title = t("form.title");
    if (!selectedClientId) newErrors.client = t("form.selectClient");
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      const clientName = selectedClient ? getClientDisplayName(selectedClient) : '';
      const created = await services.cases.createCase({
        caseNumber: caseNumber.trim(),
        title: title.trim(),
        clientName,
        clientId: selectedClientId!,
        status: 'new',
        caseType: selectedType!,
        caseSubtype: selectedSubtype ?? undefined,
        opposingParty: opposingParty.trim() || undefined,
        court: selectedCourt?.name ?? undefined,
        courtId: selectedCourtId ?? undefined,
        description: description.trim() || undefined,
        lawyerId: 'u1',
        lawyerName: 'Marko Petrovic',
      });
      // Land on the new case's overview. `replace` so the user doesn't
      // back-swipe into the empty form.
      router.replace({ pathname: "/(tabs)/cases/[id]", params: { id: created.id } });
    } catch {
      Alert.alert('Error', 'Failed to create case');
    } finally {
      setSaving(false);
    }
  };

  if (loadingData) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.cream.DEFAULT, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={colors.golden.DEFAULT} />
      </View>
    );
  }

  const caseTypes: CaseType[] = ['civil', 'criminal', 'family', 'corporate'];

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.cream.DEFAULT }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
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
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 + insets.bottom }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Section 1: Case Type */}
        <Text style={{ fontSize: 15, fontWeight: "700", color: colors.navy.DEFAULT, marginBottom: 12 }}>
          {t("form.selectType")} *
        </Text>
        {errors.type && (
          <Text style={{ fontSize: 12, color: "#E53935", marginBottom: 8, marginLeft: 4 }}>
            {errors.type}
          </Text>
        )}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 }}>
          {caseTypes.map((type) => {
            const isSelected = selectedType === type;
            const typeColor = TYPE_COLORS[type];
            return (
              <Pressable
                key={type}
                onPress={() => handleTypeSelect(type)}
                style={{
                  width: '47%',
                  backgroundColor: "#FFFFFF",
                  borderRadius: 14,
                  padding: 16,
                  alignItems: "center",
                  borderWidth: 2,
                  borderColor: isSelected ? colors.golden.DEFAULT : "#F0EAE0",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.03,
                  shadowRadius: 3,
                  elevation: 1,
                }}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    backgroundColor: typeColor + '15',
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 8,
                  }}
                >
                  <Ionicons name={TYPE_ICONS[type]} size={22} color={typeColor} />
                </View>
                <Text style={{ fontSize: 13, fontWeight: "600", color: colors.navy.DEFAULT, textAlign: "center" }}>
                  {t('type.' + type)}
                </Text>
                {isSelected && (
                  <View style={{ position: "absolute", top: 8, right: 8 }}>
                    <Ionicons name={"checkmark-circle" as IoniconsName} size={20} color={colors.golden.DEFAULT} />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Subtype Picker */}
        {selectedType && (
          <>
            <Text style={{ fontSize: 15, fontWeight: "700", color: colors.navy.DEFAULT, marginBottom: 10 }}>
              {t("form.selectSubtype")}
            </Text>
            <View
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 14,
                borderWidth: 1,
                borderColor: "#F0EAE0",
                marginBottom: 20,
                overflow: "hidden",
              }}
            >
              {CASE_TYPE_SUBTYPES[selectedType].map((subtype, index) => {
                const isSelected = selectedSubtype === subtype;
                return (
                  <Pressable
                    key={subtype}
                    onPress={() => setSelectedSubtype(subtype)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                      backgroundColor: isSelected ? colors.golden[50] : "transparent",
                      borderBottomWidth: index < CASE_TYPE_SUBTYPES[selectedType].length - 1 ? 1 : 0,
                      borderBottomColor: "#F5F0E8",
                    }}
                  >
                    <Text style={{ flex: 1, fontSize: 14, color: colors.navy.DEFAULT, fontWeight: isSelected ? "600" : "400" }}>
                      {t('subtype.' + subtype)}
                    </Text>
                    {isSelected && (
                      <Ionicons name={"checkmark-circle" as IoniconsName} size={18} color={colors.golden.DEFAULT} />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        {/* Section 2: Basic Info */}
        <View style={{ height: 1, backgroundColor: "#F0EAE0", marginBottom: 20 }} />

        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: colors.navy.DEFAULT, marginBottom: 6 }}>
            {t("form.caseNumber")}
          </Text>
          <TextInput
            value={caseNumber}
            onChangeText={setCaseNumber}
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 10,
              paddingHorizontal: 14,
              paddingVertical: 12,
              fontSize: 15,
              color: colors.navy.DEFAULT,
              borderWidth: 1,
              borderColor: "#F0EAE0",
            }}
          />
        </View>

        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: colors.navy.DEFAULT, marginBottom: 6 }}>
            {t("form.title")} *
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 10,
              paddingHorizontal: 14,
              paddingVertical: 12,
              fontSize: 15,
              color: colors.navy.DEFAULT,
              borderWidth: 1,
              borderColor: errors.title ? "#E53935" : "#F0EAE0",
            }}
          />
          {errors.title && (
            <Text style={{ fontSize: 12, color: "#E53935", marginTop: 4, marginLeft: 4 }}>
              {errors.title}
            </Text>
          )}
        </View>

        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: colors.navy.DEFAULT, marginBottom: 6 }}>
            {t("form.opposingParty")}
          </Text>
          <TextInput
            value={opposingParty}
            onChangeText={setOpposingParty}
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 10,
              paddingHorizontal: 14,
              paddingVertical: 12,
              fontSize: 15,
              color: colors.navy.DEFAULT,
              borderWidth: 1,
              borderColor: "#F0EAE0",
            }}
          />
        </View>

        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: colors.navy.DEFAULT, marginBottom: 6 }}>
            {t("form.description")}
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 10,
              paddingHorizontal: 14,
              paddingVertical: 12,
              fontSize: 15,
              color: colors.navy.DEFAULT,
              borderWidth: 1,
              borderColor: "#F0EAE0",
              minHeight: 100,
            }}
          />
        </View>

        {/* Section 3: Client Picker */}
        <View style={{ height: 1, backgroundColor: "#F0EAE0", marginBottom: 20 }} />

        <Text style={{ fontSize: 15, fontWeight: "700", color: colors.navy.DEFAULT, marginBottom: 10 }}>
          {t("form.selectClient")} *
        </Text>
        {errors.client && (
          <Text style={{ fontSize: 12, color: "#E53935", marginBottom: 8, marginLeft: 4 }}>
            {errors.client}
          </Text>
        )}

        {/* Client search */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#FFFFFF",
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 8,
            marginBottom: 8,
            borderWidth: 1,
            borderColor: "#F0EAE0",
          }}
        >
          <Ionicons name={"search-outline" as IoniconsName} size={16} color="#AAA" />
          <TextInput
            placeholder={t("list.searchPlaceholder")}
            placeholderTextColor="#CCC"
            value={clientSearch}
            onChangeText={setClientSearch}
            style={{ flex: 1, marginLeft: 8, fontSize: 14, color: colors.navy.DEFAULT }}
            autoCapitalize="none"
          />
        </View>

        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 14,
            borderWidth: 1,
            borderColor: errors.client ? "#E53935" : "#F0EAE0",
            marginBottom: 20,
            maxHeight: 200,
            overflow: "hidden",
          }}
        >
          <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }}>
            {filteredClients.map((client, index) => {
              const name = getClientDisplayName(client);
              const isSelected = selectedClientId === client.id;
              return (
                <Pressable
                  key={client.id}
                  onPress={() => setSelectedClientId(client.id)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    backgroundColor: isSelected ? colors.golden[50] : "transparent",
                    borderBottomWidth: index < filteredClients.length - 1 ? 1 : 0,
                    borderBottomColor: "#F5F0E8",
                  }}
                >
                  <Ionicons
                    name={(client.type === 'individual' ? "person-outline" : "business-outline") as IoniconsName}
                    size={16}
                    color={isSelected ? colors.golden.DEFAULT : "#AAA"}
                    style={{ marginRight: 10 }}
                  />
                  <Text style={{ flex: 1, fontSize: 14, color: colors.navy.DEFAULT, fontWeight: isSelected ? "600" : "400" }}>
                    {name}
                  </Text>
                  {isSelected && (
                    <Ionicons name={"checkmark-circle" as IoniconsName} size={18} color={colors.golden.DEFAULT} />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Section 4: Court Picker */}
        <Text style={{ fontSize: 15, fontWeight: "700", color: colors.navy.DEFAULT, marginBottom: 10 }}>
          {t("form.selectCourt")}
        </Text>
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 14,
            borderWidth: 1,
            borderColor: "#F0EAE0",
            marginBottom: 24,
            overflow: "hidden",
          }}
        >
          {courts.map((court, index) => {
            const isSelected = selectedCourtId === court.id;
            return (
              <Pressable
                key={court.id}
                onPress={() => setSelectedCourtId(court.id)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  backgroundColor: isSelected ? colors.golden[50] : "transparent",
                  borderBottomWidth: index < courts.length - 1 ? 1 : 0,
                  borderBottomColor: "#F5F0E8",
                }}
              >
                <Ionicons
                  name={"business-outline" as IoniconsName}
                  size={16}
                  color={isSelected ? colors.golden.DEFAULT : "#AAA"}
                  style={{ marginRight: 10 }}
                />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, color: colors.navy.DEFAULT, fontWeight: isSelected ? "600" : "400" }}>
                    {court.name}
                  </Text>
                  <Text style={{ fontSize: 11, color: "#AAA", marginTop: 2 }}>
                    {court.city}
                  </Text>
                </View>
                {isSelected && (
                  <Ionicons name={"checkmark-circle" as IoniconsName} size={18} color={colors.golden.DEFAULT} />
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Save Button */}
        <Pressable
          onPress={handleSave}
          disabled={saving}
          style={{
            backgroundColor: saving ? colors.golden.light : colors.golden.DEFAULT,
            borderRadius: 12,
            paddingVertical: 16,
            alignItems: "center",
            marginTop: 8,
            shadowColor: colors.golden.DEFAULT,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#FFFFFF" }}>
            {saving ? "..." : t("form.save")}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
