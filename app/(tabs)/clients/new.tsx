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
import { useState } from "react";
import { useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useServices } from "../../../src/hooks/useServices";
import { colors } from "../../../src/theme/tokens";
import type { Client } from "../../../src/services/types";
import {
  validateJMBG,
  validatePIB,
  validateMB,
  validateEmail,
  validatePhone,
  validateRequired,
} from "../../../src/utils/validators";

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

const STEP_LABELS: Array<{ key: string; icon: IoniconsName }> = [
  { key: "contact", icon: "person-outline" as IoniconsName },
  { key: "conflictCheck", icon: "search-outline" as IoniconsName },
  { key: "consultation", icon: "chatbubble-ellipses-outline" as IoniconsName },
  { key: "onboarding", icon: "checkmark-circle-outline" as IoniconsName },
];

function FormField({
  label,
  value,
  onChangeText,
  error,
  placeholder,
  keyboardType,
  maxLength,
  autoCapitalize,
  multiline,
  numberOfLines,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string | null;
  placeholder?: string;
  keyboardType?: "default" | "numeric" | "email-address" | "phone-pad";
  maxLength?: number;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  multiline?: boolean;
  numberOfLines?: number;
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
        multiline={multiline}
        numberOfLines={numberOfLines}
        textAlignVertical={multiline ? "top" : undefined}
        style={{
          backgroundColor: "#FFFFFF",
          borderRadius: 10,
          paddingHorizontal: 14,
          paddingVertical: 12,
          fontSize: 15,
          color: colors.navy.DEFAULT,
          borderWidth: 1,
          borderColor: error ? "#E53935" : "#F0EAE0",
          minHeight: multiline ? 100 : undefined,
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

function StepIndicator({ currentStep }: { currentStep: number }) {
  const { t } = useTranslation("clients");

  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 24, paddingHorizontal: 8 }}>
      {STEP_LABELS.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        const isActive = isCompleted || isCurrent;

        return (
          <View key={step.key} style={{ flexDirection: "row", alignItems: "center", flex: index < STEP_LABELS.length - 1 ? 1 : 0 }}>
            <View style={{ alignItems: "center" }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: isActive ? colors.golden.DEFAULT : "#E5E5E5",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {isCompleted ? (
                  <Ionicons name={"checkmark" as IoniconsName} size={18} color="#FFFFFF" />
                ) : (
                  <Ionicons name={step.icon} size={16} color={isCurrent ? "#FFFFFF" : "#AAA"} />
                )}
              </View>
              <Text
                style={{
                  fontSize: 9,
                  fontWeight: "600",
                  color: isActive ? colors.golden.DEFAULT : "#AAA",
                  marginTop: 4,
                  textAlign: "center",
                  width: 60,
                }}
                numberOfLines={1}
              >
                {t("intake." + step.key)}
              </Text>
            </View>
            {index < STEP_LABELS.length - 1 && (
              <View
                style={{
                  flex: 1,
                  height: 2,
                  backgroundColor: index < currentStep ? colors.golden.DEFAULT : "#E5E5E5",
                  marginHorizontal: 4,
                  marginBottom: 16,
                }}
              />
            )}
          </View>
        );
      })}
    </View>
  );
}

export default function NewClientScreen() {
  const { t } = useTranslation("clients");
  const services = useServices();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // Client type
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

  // Conflict check state
  const [conflictResults, setConflictResults] = useState<Client[]>([]);
  const [conflictSearching, setConflictSearching] = useState(false);
  const [conflictChecked, setConflictChecked] = useState(false);

  // Consultation state
  const [consultationNotes, setConsultationNotes] = useState("");
  const [consultationDate, setConsultationDate] = useState(new Date().toISOString().split("T")[0]);
  const [retainerSigned, setRetainerSigned] = useState(false);

  const isIndividual = clientType === "individual";

  const getClientName = (): string => {
    if (isIndividual) {
      return `${firstName} ${lastName}`.trim();
    }
    return companyName.trim();
  };

  const validateStep0 = (): boolean => {
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

  const handleNext = async () => {
    if (step === 0) {
      if (!validateStep0()) return;
      // Trigger conflict check when moving to step 1
      setConflictSearching(true);
      try {
        const name = getClientName();
        const results = await services.clients.searchClients(name);
        setConflictResults(results);
      } catch {
        setConflictResults([]);
      } finally {
        setConflictSearching(false);
        setConflictChecked(true);
      }
    }
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      const created = isIndividual
        ? await services.clients.createClient({
            type: "individual",
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            jmbg: jmbg || undefined,
            phone: phone || undefined,
            email: email || undefined,
            address: address || undefined,
            city: city || undefined,
          })
        : await services.clients.createClient({
            type: "corporate",
            companyName: companyName.trim(),
            pib: pib || undefined,
            mb: mb || undefined,
            phone: phone || undefined,
            email: email || undefined,
            address: address || undefined,
            city: city || undefined,
          });
      // Land on the new client's overview. `replace` so the back gesture doesn't
      // return the user to the empty form.
      router.replace({ pathname: "/(tabs)/clients/[id]", params: { id: created.id } });
    } catch {
      Alert.alert("Error", "Failed to create client");
    } finally {
      setSaving(false);
    }
  };

  const renderStep0 = () => (
    <>
      {/* Type Toggle */}
      <View
        style={{
          flexDirection: "row",
          backgroundColor: "#FFFFFF",
          borderRadius: 12,
          padding: 4,
          marginBottom: 24,
          borderWidth: 1,
          borderColor: "#F0EAE0",
        }}
      >
        <Pressable
          onPress={() => setClientType("individual")}
          style={{
            flex: 1,
            paddingVertical: 12,
            borderRadius: 10,
            backgroundColor: isIndividual ? colors.golden.DEFAULT : "transparent",
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <Ionicons name={"person-outline" as IoniconsName} size={16} color={isIndividual ? "#FFFFFF" : "#888"} />
          <Text style={{ fontSize: 14, fontWeight: "600", color: isIndividual ? "#FFFFFF" : "#888" }}>
            {t("type.individual")}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setClientType("corporate")}
          style={{
            flex: 1,
            paddingVertical: 12,
            borderRadius: 10,
            backgroundColor: !isIndividual ? colors.golden.DEFAULT : "transparent",
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <Ionicons name={"business-outline" as IoniconsName} size={16} color={!isIndividual ? "#FFFFFF" : "#888"} />
          <Text style={{ fontSize: 14, fontWeight: "600", color: !isIndividual ? "#FFFFFF" : "#888" }}>
            {t("type.corporate")}
          </Text>
        </Pressable>
      </View>

      {/* Type-specific fields */}
      {isIndividual ? (
        <>
          <FormField label={t("form.firstName") + " *"} value={firstName} onChangeText={setFirstName} error={errors.firstName} autoCapitalize="words" />
          <FormField label={t("form.lastName") + " *"} value={lastName} onChangeText={setLastName} error={errors.lastName} autoCapitalize="words" />
          <FormField label={t("form.jmbg")} value={jmbg} onChangeText={setJmbg} error={errors.jmbg} keyboardType="numeric" maxLength={13} />
        </>
      ) : (
        <>
          <FormField label={t("form.companyName") + " *"} value={companyName} onChangeText={setCompanyName} error={errors.companyName} />
          <FormField label={t("form.pib")} value={pib} onChangeText={setPib} error={errors.pib} keyboardType="numeric" maxLength={9} />
          <FormField label={t("form.mb")} value={mb} onChangeText={setMb} error={errors.mb} keyboardType="numeric" maxLength={8} />
        </>
      )}

      {/* Common fields */}
      <View style={{ height: 1, backgroundColor: "#F0EAE0", marginBottom: 16 }} />
      <FormField label={t("form.phone")} value={phone} onChangeText={setPhone} error={errors.phone} keyboardType="phone-pad" />
      <FormField label={t("form.email")} value={email} onChangeText={setEmail} error={errors.email} keyboardType="email-address" autoCapitalize="none" />
      <FormField label={t("form.address")} value={address} onChangeText={setAddress} />
      <FormField label={t("form.city")} value={city} onChangeText={setCity} autoCapitalize="words" />
    </>
  );

  const renderStep1 = () => (
    <View style={SECTION_CARD}>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
        <Ionicons name={"search-outline" as IoniconsName} size={20} color={colors.navy.DEFAULT} style={{ marginRight: 8 }} />
        <Text style={{ fontSize: 16, fontWeight: "700", color: colors.navy.DEFAULT }}>
          {t("intake.conflictCheck")}
        </Text>
      </View>

      {conflictSearching ? (
        <View style={{ alignItems: "center", paddingVertical: 24 }}>
          <ActivityIndicator size="large" color={colors.golden.DEFAULT} />
          <Text style={{ fontSize: 13, color: "#AAA", marginTop: 10 }}>Searching...</Text>
        </View>
      ) : conflictChecked ? (
        <>
          {conflictResults.length > 0 ? (
            <>
              <View
                style={{
                  backgroundColor: "#FFF8E1",
                  borderRadius: 10,
                  padding: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 12,
                }}
              >
                <Ionicons name={"warning-outline" as IoniconsName} size={20} color="#F9A825" style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 13, fontWeight: "600", color: "#F57F17", flex: 1 }}>
                  Potential conflict detected
                </Text>
              </View>
              {conflictResults.map((c) => {
                const name = c.type === "individual" ? `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim() : c.companyName ?? "";
                return (
                  <View key={c.id} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#F5F0E8" }}>
                    <Ionicons
                      name={(c.type === "individual" ? "person-outline" : "business-outline") as IoniconsName}
                      size={16}
                      color={colors.navy.DEFAULT}
                      style={{ marginRight: 10 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: "500", color: colors.navy.DEFAULT }}>{name}</Text>
                      <Text style={{ fontSize: 12, color: "#AAA" }}>{c.email || c.phone || ""}</Text>
                    </View>
                  </View>
                );
              })}
            </>
          ) : (
            <View style={{ alignItems: "center", paddingVertical: 20 }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: "#E8F5E9",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 10,
                }}
              >
                <Ionicons name={"checkmark-circle" as IoniconsName} size={28} color="#43A047" />
              </View>
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#43A047" }}>No conflicts found</Text>
            </View>
          )}
        </>
      ) : null}
    </View>
  );

  const renderStep2 = () => (
    <View style={SECTION_CARD}>
      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
        <Ionicons name={"chatbubble-ellipses-outline" as IoniconsName} size={20} color={colors.navy.DEFAULT} style={{ marginRight: 8 }} />
        <Text style={{ fontSize: 16, fontWeight: "700", color: colors.navy.DEFAULT }}>
          {t("intake.consultation")}
        </Text>
      </View>

      <FormField
        label="Consultation Notes"
        value={consultationNotes}
        onChangeText={setConsultationNotes}
        placeholder="Enter consultation notes..."
        multiline
        numberOfLines={5}
      />

      <FormField
        label="Consultation Date"
        value={consultationDate}
        onChangeText={setConsultationDate}
        placeholder="YYYY-MM-DD"
      />

      <Pressable
        onPress={() => setRetainerSigned(!retainerSigned)}
        style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}
      >
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            borderWidth: 2,
            borderColor: retainerSigned ? colors.golden.DEFAULT : "#DDD",
            backgroundColor: retainerSigned ? colors.golden.DEFAULT : "transparent",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 10,
          }}
        >
          {retainerSigned && <Ionicons name={"checkmark" as IoniconsName} size={16} color="#FFFFFF" />}
        </View>
        <Text style={{ fontSize: 14, color: colors.navy.DEFAULT }}>Retainer agreement signed</Text>
      </Pressable>
    </View>
  );

  const renderStep3 = () => {
    const name = getClientName();
    return (
      <View>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
          <Ionicons name={"document-text-outline" as IoniconsName} size={20} color={colors.navy.DEFAULT} style={{ marginRight: 8 }} />
          <Text style={{ fontSize: 16, fontWeight: "700", color: colors.navy.DEFAULT }}>
            {t("intake.onboarding")}
          </Text>
        </View>

        {/* Client Info Summary */}
        <View style={SECTION_CARD}>
          <Text style={{ fontSize: 13, fontWeight: "700", color: colors.navy.DEFAULT, marginBottom: 10 }}>
            {t("detail.profile")}
          </Text>
          <SummaryRow label={t("type.individual")} value={isIndividual ? t("type.individual") : t("type.corporate")} icon={"person-outline" as IoniconsName} />
          <SummaryRow label={isIndividual ? t("form.firstName") + " " + t("form.lastName") : t("form.companyName")} value={name} icon={(isIndividual ? "person" : "business") as IoniconsName} />
          {isIndividual && jmbg ? <SummaryRow label={t("form.jmbg")} value={jmbg} icon={"card-outline" as IoniconsName} /> : null}
          {!isIndividual && pib ? <SummaryRow label={t("form.pib")} value={pib} icon={"document-text-outline" as IoniconsName} /> : null}
          {!isIndividual && mb ? <SummaryRow label={t("form.mb")} value={mb} icon={"barcode-outline" as IoniconsName} /> : null}
        </View>

        {/* Contact Summary */}
        <View style={SECTION_CARD}>
          <Text style={{ fontSize: 13, fontWeight: "700", color: colors.navy.DEFAULT, marginBottom: 10 }}>
            {t("detail.contact")}
          </Text>
          {phone ? <SummaryRow label={t("form.phone")} value={phone} icon={"call-outline" as IoniconsName} /> : null}
          {email ? <SummaryRow label={t("form.email")} value={email} icon={"mail-outline" as IoniconsName} /> : null}
          {address ? <SummaryRow label={t("form.address")} value={address} icon={"location-outline" as IoniconsName} /> : null}
          {city ? <SummaryRow label={t("form.city")} value={city} icon={"navigate-outline" as IoniconsName} /> : null}
        </View>

        {/* Consultation Summary */}
        {(consultationNotes || retainerSigned) && (
          <View style={SECTION_CARD}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: colors.navy.DEFAULT, marginBottom: 10 }}>
              {t("intake.consultation")}
            </Text>
            {consultationNotes ? <SummaryRow label="Notes" value={consultationNotes} icon={"chatbubble-outline" as IoniconsName} /> : null}
            <SummaryRow label="Date" value={consultationDate} icon={"calendar-outline" as IoniconsName} />
            <SummaryRow label="Retainer" value={retainerSigned ? "Signed" : "Not signed"} icon={"document-outline" as IoniconsName} />
          </View>
        )}

        {/* Conflict Check Summary */}
        <View style={SECTION_CARD}>
          <Text style={{ fontSize: 13, fontWeight: "700", color: colors.navy.DEFAULT, marginBottom: 10 }}>
            {t("intake.conflictCheck")}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons
              name={(conflictResults.length > 0 ? "warning-outline" : "checkmark-circle-outline") as IoniconsName}
              size={18}
              color={conflictResults.length > 0 ? "#F9A825" : "#43A047"}
              style={{ marginRight: 8 }}
            />
            <Text style={{ fontSize: 14, color: conflictResults.length > 0 ? "#F57F17" : "#43A047" }}>
              {conflictResults.length > 0 ? `${conflictResults.length} potential conflict(s)` : "No conflicts found"}
            </Text>
          </View>
        </View>
      </View>
    );
  };

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
        <StepIndicator currentStep={step} />

        {step === 0 && renderStep0()}
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}

        {/* Navigation Buttons */}
        <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
          {step > 0 && (
            <Pressable
              onPress={handleBack}
              style={{
                flex: 1,
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: "center",
                borderWidth: 1,
                borderColor: "#E5E5E5",
                flexDirection: "row",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <Ionicons name={"arrow-back" as IoniconsName} size={18} color="#888" />
              <Text style={{ fontSize: 15, fontWeight: "600", color: "#888" }}>
                {t("intake.previousStep")}
              </Text>
            </Pressable>
          )}
          <Pressable
            onPress={step === 3 ? handleCreate : handleNext}
            disabled={saving}
            style={{
              flex: 1,
              backgroundColor: saving ? colors.golden.light : colors.golden.DEFAULT,
              borderRadius: 12,
              paddingVertical: 14,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 6,
              shadowColor: colors.golden.DEFAULT,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text style={{ fontSize: 15, fontWeight: "700", color: "#FFFFFF" }}>
                  {step === 3 ? t("intake.completeIntake") : t("intake.nextStep")}
                </Text>
                {step < 3 && <Ionicons name={"arrow-forward" as IoniconsName} size={18} color="#FFFFFF" />}
              </>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function SummaryRow({ label, value, icon }: { label: string; value: string; icon: IoniconsName }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", paddingVertical: 6 }}>
      <View style={{ width: 28, alignItems: "center", marginTop: 2 }}>
        <Ionicons name={icon} size={14} color="#AAA" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 11, color: "#AAA" }}>{label}</Text>
        <Text style={{ fontSize: 13, color: colors.navy.DEFAULT }}>{value}</Text>
      </View>
    </View>
  );
}
