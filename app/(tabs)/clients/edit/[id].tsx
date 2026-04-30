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
import { useState, useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useServices } from "../../../../src/hooks/useServices";
import { colors } from "../../../../src/theme/tokens";
import {
  validateJMBG,
  validatePIB,
  validateMB,
  validateEmail,
  validatePhone,
  validateRequired,
} from "../../../../src/utils/validators";
import type { Client } from "../../../../src/services/types";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

interface FormErrors {
  firstName?: string | null;
  lastName?: string | null;
  companyName?: string | null;
  jmbg?: string | null;
  pib?: string | null;
  mb?: string | null;
  email?: string | null;
  phone?: string | null;
}

function FormField({
  label,
  value,
  onChangeText,
  error,
  placeholder,
  keyboardType,
  maxLength,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string | null;
  placeholder?: string;
  keyboardType?: "default" | "numeric" | "email-address" | "phone-pad";
  maxLength?: number;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
}) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 13, fontWeight: "600", color: colors.navy.DEFAULT, marginBottom: 6 }}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#CCC"
        keyboardType={keyboardType ?? "default"}
        maxLength={maxLength}
        autoCapitalize={autoCapitalize ?? "sentences"}
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: 10,
          paddingHorizontal: 14,
          paddingVertical: 12,
          fontSize: 15,
          color: colors.navy.DEFAULT,
          borderWidth: 1,
          borderColor: error ? "#E53935" : "#F0EAE0",
        }}
      />
      {error ? (
        <Text style={{ fontSize: 12, color: "#E53935", marginTop: 4, marginLeft: 4 }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

export default function EditClientScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation("clients");
  const services = useServices();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [clientType, setClientType] = useState<"individual" | "corporate">("individual");

  // Individual fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [jmbg, setJmbg] = useState("");

  // Corporate fields
  const [companyName, setCompanyName] = useState("");
  const [pib, setPib] = useState("");
  const [mb, setMb] = useState("");

  // Common fields
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");

  useEffect(() => {
    if (!id) return;
    services.clients.getClientById(id).then((client: Client | null) => {
      if (!client) {
        setLoading(false);
        return;
      }
      setClientType(client.type);
      if (client.type === "individual") {
        setFirstName(client.firstName ?? "");
        setLastName(client.lastName ?? "");
        setJmbg(client.jmbg ?? "");
      } else {
        setCompanyName(client.companyName ?? "");
        setPib(client.pib ?? "");
        setMb(client.mb ?? "");
      }
      setPhone(client.phone ?? "");
      setEmail(client.email ?? "");
      setAddress(client.address ?? "");
      setCity(client.city ?? "");
      setLoading(false);
    });
  }, [id, services]);

  const isIndividual = clientType === "individual";

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (isIndividual) {
      newErrors.firstName = validateRequired(firstName, t("form.firstName"));
      newErrors.lastName = validateRequired(lastName, t("form.lastName"));
      newErrors.jmbg = validateJMBG(jmbg);
    } else {
      newErrors.companyName = validateRequired(companyName, t("form.companyName"));
      newErrors.pib = validatePIB(pib);
      newErrors.mb = validateMB(mb);
    }

    newErrors.email = validateEmail(email);
    newErrors.phone = validatePhone(phone);

    setErrors(newErrors);

    return !Object.values(newErrors).some((e) => e !== null && e !== undefined);
  };

  const handleSave = async () => {
    if (!validateForm() || !id) return;

    setSaving(true);
    try {
      const data: Partial<Client> = {
        phone: phone || undefined,
        email: email || undefined,
        address: address || undefined,
        city: city || undefined,
      };

      if (isIndividual) {
        data.firstName = firstName.trim();
        data.lastName = lastName.trim();
        data.jmbg = jmbg || undefined;
      } else {
        data.companyName = companyName.trim();
        data.pib = pib || undefined;
        data.mb = mb || undefined;
      }

      await services.clients.updateClient(id, data);
      router.back();
    } catch {
      Alert.alert("Error", "Failed to update client");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.cream.DEFAULT, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={colors.golden.DEFAULT} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.cream.DEFAULT }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 + insets.bottom }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Type Indicator (read-only) */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#FFFFFF",
            borderRadius: 12,
            padding: 14,
            marginBottom: 24,
            borderWidth: 1,
            borderColor: "#F0EAE0",
          }}
        >
          <Ionicons
            name={(isIndividual ? "person-outline" : "business-outline") as IoniconsName}
            size={18}
            color={colors.golden.DEFAULT}
            style={{ marginRight: 8 }}
          />
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.navy.DEFAULT }}>
            {t(isIndividual ? "type.individual" : "type.corporate")}
          </Text>
        </View>

        {/* Type-specific fields */}
        {isIndividual ? (
          <>
            <FormField
              label={t("form.firstName") + " *"}
              value={firstName}
              onChangeText={setFirstName}
              error={errors.firstName}
              autoCapitalize="words"
            />
            <FormField
              label={t("form.lastName") + " *"}
              value={lastName}
              onChangeText={setLastName}
              error={errors.lastName}
              autoCapitalize="words"
            />
            <FormField
              label={t("form.jmbg")}
              value={jmbg}
              onChangeText={setJmbg}
              error={errors.jmbg}
              keyboardType="numeric"
              maxLength={13}
            />
          </>
        ) : (
          <>
            <FormField
              label={t("form.companyName") + " *"}
              value={companyName}
              onChangeText={setCompanyName}
              error={errors.companyName}
            />
            <FormField
              label={t("form.pib")}
              value={pib}
              onChangeText={setPib}
              error={errors.pib}
              keyboardType="numeric"
              maxLength={9}
            />
            <FormField
              label={t("form.mb")}
              value={mb}
              onChangeText={setMb}
              error={errors.mb}
              keyboardType="numeric"
              maxLength={8}
            />
          </>
        )}

        {/* Common fields */}
        <View style={{ height: 1, backgroundColor: "#F0EAE0", marginBottom: 16 }} />

        <FormField
          label={t("form.phone")}
          value={phone}
          onChangeText={setPhone}
          error={errors.phone}
          keyboardType="phone-pad"
        />
        <FormField
          label={t("form.email")}
          value={email}
          onChangeText={setEmail}
          error={errors.email}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <FormField
          label={t("form.address")}
          value={address}
          onChangeText={setAddress}
        />
        <FormField
          label={t("form.city")}
          value={city}
          onChangeText={setCity}
          autoCapitalize="words"
        />

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
