import { useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  FlatList,
  ActivityIndicator,
  Modal,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useFocusEffect, useRouter } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { ScreenContainer } from "../../../../src/components/ui";
import { DeleteConfirmDialog } from "../../../../src/components/ui/DeleteConfirmDialog";
import { useServices } from "../../../../src/hooks/useServices";
import { colors } from "../../../../src/theme/tokens";
import type { Lawyer, Judge, Court } from "../../../../src/services/types";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];
type TabKey = "lawyers" | "judges" | "courts";

export default function DirectoryScreen() {
  const { t } = useTranslation("directory");
  const services = useServices();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabKey>("lawyers");
  const [deleteConfirm, setDeleteConfirm] = useState<{ entity: TabKey; id: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [lawyersList, setLawyersList] = useState<Lawyer[]>([]);
  const [judgesList, setJudgesList] = useState<Judge[]>([]);
  const [courtsList, setCourtsList] = useState<Court[]>([]);

  // Add modal state
  const [addModalVisible, setAddModalVisible] = useState(false);
  // Lawyer form fields
  const [formDisplayName, setFormDisplayName] = useState("");
  const [formFirm, setFormFirm] = useState("");
  const [formBarNumber, setFormBarNumber] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formSpecialty, setFormSpecialty] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formIsInternal, setFormIsInternal] = useState(false);
  // Judge form fields
  const [formCourt, setFormCourt] = useState("");
  const [formChamber, setFormChamber] = useState("");
  // Court form fields
  const [formName, setFormName] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formJurisdiction, setFormJurisdiction] = useState("");
  const [formWebsite, setFormWebsite] = useState("");

  const refreshData = useCallback(() => {
    setLoading(true);
    Promise.all([
      services.directory.getLawyers(),
      services.directory.getJudges(),
      services.directory.getCourts(),
    ]).then(([l, j, c]) => {
      setLawyersList(l);
      setJudgesList(j);
      setCourtsList(c);
      setLoading(false);
    });
  }, [services]);

  useFocusEffect(
    useCallback(() => {
      refreshData();
    }, [refreshData])
  );

  const q = searchQuery.toLowerCase();

  const filteredLawyers = lawyersList.filter((l) => {
    if (!q) return true;
    return (
      l.displayName.toLowerCase().includes(q) ||
      (l.firm ?? "").toLowerCase().includes(q) ||
      (l.specialty ?? "").toLowerCase().includes(q) ||
      (l.email ?? "").toLowerCase().includes(q)
    );
  });

  const filteredJudges = judgesList.filter((j) => {
    if (!q) return true;
    return (
      j.displayName.toLowerCase().includes(q) ||
      (j.court ?? "").toLowerCase().includes(q) ||
      (j.chamber ?? "").toLowerCase().includes(q)
    );
  });

  const filteredCourts = courtsList.filter((c) => {
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q) ||
      (c.jurisdiction ?? "").toLowerCase().includes(q)
    );
  });

  const handleTabSwitch = (tab: TabKey) => {
    setActiveTab(tab);
    setSearchQuery("");
  };

  const resetForm = () => {
    setFormDisplayName("");
    setFormFirm("");
    setFormBarNumber("");
    setFormPhone("");
    setFormEmail("");
    setFormSpecialty("");
    setFormNotes("");
    setFormIsInternal(false);
    setFormCourt("");
    setFormChamber("");
    setFormName("");
    setFormAddress("");
    setFormCity("");
    setFormJurisdiction("");
    setFormWebsite("");
  };

  const openAddModal = () => {
    resetForm();
    setAddModalVisible(true);
  };

  const handleSave = async () => {
    if (activeTab === "lawyers") {
      await services.directory.createLawyer({
        displayName: formDisplayName.trim(),
        firm: formFirm.trim() || undefined,
        barNumber: formBarNumber.trim() || undefined,
        phone: formPhone.trim() || undefined,
        email: formEmail.trim() || undefined,
        specialty: formSpecialty.trim() || undefined,
        notes: formNotes.trim() || undefined,
        isInternal: formIsInternal,
      });
    } else if (activeTab === "judges") {
      await services.directory.createJudge({
        displayName: formDisplayName.trim(),
        court: formCourt.trim() || undefined,
        chamber: formChamber.trim() || undefined,
        phone: formPhone.trim() || undefined,
        notes: formNotes.trim() || undefined,
      });
    } else {
      await services.directory.createCourt({
        name: formName.trim(),
        address: formAddress.trim(),
        city: formCity.trim(),
        jurisdiction: formJurisdiction.trim() || undefined,
        phone: formPhone.trim() || undefined,
        website: formWebsite.trim() || undefined,
        notes: formNotes.trim() || undefined,
      });
    }
    setAddModalVisible(false);
    refreshData();
  };

  const isSaveDisabled = () => {
    if (activeTab === "courts") return !formName.trim();
    return !formDisplayName.trim();
  };

  const handleDeleteItem = (entity: TabKey, id: string, _name: string) => {
    setDeleteConfirm({ entity, id });
  };

  const confirmDeleteItem = async () => {
    if (!deleteConfirm) return;
    const { entity, id: itemId } = deleteConfirm;
    setDeleteConfirm(null);
    if (entity === "lawyers") await services.directory.deleteLawyer(itemId);
    else if (entity === "judges") await services.directory.deleteJudge(itemId);
    else await services.directory.deleteCourt(itemId);
    refreshData();
  };

  const deleteDialogCopy = (() => {
    switch (deleteConfirm?.entity) {
      case "lawyers":
        return { title: t("lawyers.deleteLawyer"), body: t("lawyers.confirmDelete"), confirm: t("lawyers.deleteLawyer") };
      case "judges":
        return { title: t("judges.deleteJudge"), body: t("judges.confirmDelete"), confirm: t("judges.deleteJudge") };
      case "courts":
        return { title: t("courts.deleteCourt"), body: t("courts.confirmDelete"), confirm: t("courts.deleteCourt") };
      default:
        return { title: "", body: "", confirm: "" };
    }
  })();

  const getAddTitle = () => {
    if (activeTab === "lawyers") return t("lawyers.addLawyer");
    if (activeTab === "judges") return t("judges.addJudge");
    return t("courts.addCourt");
  };

  const renderLawyerItem = ({ item }: { item: Lawyer }) => (
    <Pressable
      onPress={() =>
        router.push({
          pathname: "/(tabs)/more/directory/lawyers",
          params: { id: item.id, returnTo: "/(tabs)/more/directory" },
        })
      }
      onLongPress={() =>
        handleDeleteItem("lawyers", item.id, item.displayName)
      }
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: "#FFF3E0",
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: "#FDF8EC",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons
          name={"person-outline" as IoniconsName}
          size={18}
          color={colors.golden.DEFAULT}
        />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text
            style={{
              fontSize: 15,
              fontWeight: "600",
              color: colors.navy.DEFAULT,
              flex: 1,
            }}
            numberOfLines={1}
          >
            {item.displayName}
          </Text>
          <View
            style={{
              backgroundColor: item.isInternal ? "#E8F5E9" : "#FFF3E0",
              borderRadius: 8,
              paddingHorizontal: 8,
              paddingVertical: 2,
              marginLeft: 8,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: "600",
                color: item.isInternal ? "#2E7D32" : "#E65100",
              }}
            >
              {item.isInternal
                ? t("lawyers.internal")
                : t("lawyers.external")}
            </Text>
          </View>
        </View>
        {item.firm ? (
          <Text
            style={{ fontSize: 13, color: "#8E8E93", marginTop: 2 }}
            numberOfLines={1}
          >
            {item.firm}
          </Text>
        ) : null}
        {item.specialty ? (
          <Text
            style={{ fontSize: 12, color: "#AAAAAA", marginTop: 1 }}
            numberOfLines={1}
          >
            {item.specialty}
          </Text>
        ) : null}
      </View>
      <Ionicons
        name={"chevron-forward" as IoniconsName}
        size={18}
        color="#CCCCCC"
        style={{ marginLeft: 8 }}
      />
    </Pressable>
  );

  const renderJudgeItem = ({ item }: { item: Judge }) => (
    <Pressable
      onPress={() =>
        router.push({
          pathname: "/(tabs)/more/directory/judges",
          params: { id: item.id, returnTo: "/(tabs)/more/directory" },
        })
      }
      onLongPress={() =>
        handleDeleteItem("judges", item.id, item.displayName)
      }
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: "#FFF3E0",
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: "#FDF8EC",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons
          name={"hammer-outline" as IoniconsName}
          size={18}
          color={colors.golden.DEFAULT}
        />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text
          style={{
            fontSize: 15,
            fontWeight: "600",
            color: colors.navy.DEFAULT,
          }}
          numberOfLines={1}
        >
          {item.displayName}
        </Text>
        {item.court ? (
          <Text
            style={{ fontSize: 13, color: "#8E8E93", marginTop: 2 }}
            numberOfLines={1}
          >
            {item.court}
          </Text>
        ) : null}
        {item.chamber ? (
          <Text
            style={{ fontSize: 12, color: "#AAAAAA", marginTop: 1 }}
            numberOfLines={1}
          >
            {item.chamber}
          </Text>
        ) : null}
      </View>
      <Ionicons
        name={"chevron-forward" as IoniconsName}
        size={18}
        color="#CCCCCC"
        style={{ marginLeft: 8 }}
      />
    </Pressable>
  );

  const renderCourtItem = ({ item }: { item: Court }) => (
    <Pressable
      onPress={() =>
        router.push({
          pathname: "/(tabs)/more/directory/courts",
          params: { id: item.id, returnTo: "/(tabs)/more/directory" },
        })
      }
      onLongPress={() => handleDeleteItem("courts", item.id, item.name)}
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: "#FFF3E0",
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: "#FDF8EC",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons
          name={"business-outline" as IoniconsName}
          size={18}
          color={colors.golden.DEFAULT}
        />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text
          style={{
            fontSize: 15,
            fontWeight: "600",
            color: colors.navy.DEFAULT,
          }}
          numberOfLines={1}
        >
          {item.name}
        </Text>
        {item.city ? (
          <Text
            style={{ fontSize: 13, color: "#8E8E93", marginTop: 2 }}
            numberOfLines={1}
          >
            {item.city}
          </Text>
        ) : null}
        {item.jurisdiction ? (
          <Text
            style={{ fontSize: 12, color: "#AAAAAA", marginTop: 1 }}
            numberOfLines={1}
          >
            {item.jurisdiction}
          </Text>
        ) : null}
      </View>
      <Ionicons
        name={"chevron-forward" as IoniconsName}
        size={18}
        color="#CCCCCC"
        style={{ marginLeft: 8 }}
      />
    </Pressable>
  );

  const getEmptyMessage = () => {
    if (searchQuery) return t("search.noResults");
    if (activeTab === "lawyers") return t("lawyers.noLawyers");
    if (activeTab === "judges") return t("judges.noJudges");
    return t("courts.noCourts");
  };

  const renderEmpty = () => (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        paddingTop: 60,
      }}
    >
      <Ionicons
        name={"search-outline" as IoniconsName}
        size={40}
        color="#CCCCCC"
      />
      <Text style={{ fontSize: 15, color: "#8E8E93", marginTop: 12 }}>
        {getEmptyMessage()}
      </Text>
    </View>
  );

  const getData = () => {
    if (activeTab === "lawyers") return filteredLawyers;
    if (activeTab === "judges") return filteredJudges;
    return filteredCourts;
  };

  const getRenderItem = () => {
    if (activeTab === "lawyers")
      return renderLawyerItem as (info: { item: any }) => React.JSX.Element;
    if (activeTab === "judges")
      return renderJudgeItem as (info: { item: any }) => React.JSX.Element;
    return renderCourtItem as (info: { item: any }) => React.JSX.Element;
  };

  const renderFormField = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    options?: {
      required?: boolean;
      keyboardType?: "default" | "phone-pad" | "email-address";
      multiline?: boolean;
    }
  ) => (
    <View style={{ marginBottom: 14 }}>
      <Text
        style={{
          fontSize: 13,
          fontWeight: "600",
          color: colors.navy.DEFAULT,
          marginBottom: 4,
        }}
      >
        {label}
        {options?.required ? " *" : ""}
      </Text>
      <TextInput
        style={{
          backgroundColor: "#F8F7F4",
          borderRadius: 8,
          borderWidth: 1,
          borderColor: "#E0E0E0",
          paddingHorizontal: 12,
          paddingVertical: 10,
          fontSize: 14,
          color: colors.navy.DEFAULT,
          minHeight: options?.multiline ? 70 : undefined,
          textAlignVertical: options?.multiline ? "top" : undefined,
        }}
        value={value}
        onChangeText={onChange}
        keyboardType={options?.keyboardType}
        multiline={options?.multiline}
        placeholderTextColor="#BBBBBB"
      />
    </View>
  );

  return (
    <ScreenContainer>
      {/* Top Tab Bar */}
      <View
        style={{
          flexDirection: "row",
          borderBottomWidth: 1,
          borderBottomColor: "#E0E0E0",
        }}
      >
        {(["lawyers", "judges", "courts"] as const).map((tab) => {
          const isActive = activeTab === tab;
          return (
            <Pressable
              key={tab}
              onPress={() => handleTabSwitch(tab)}
              style={{
                flex: 1,
                paddingVertical: 12,
                alignItems: "center",
                borderBottomWidth: 2,
                borderBottomColor: isActive
                  ? colors.golden.DEFAULT
                  : "transparent",
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: isActive ? "700" : "500",
                  color: isActive ? colors.golden.DEFAULT : "#8E8E93",
                }}
              >
                {t(`tabs.${tab}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Search Bar */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: "#FFFFFF",
          borderRadius: 10,
          borderWidth: 1,
          borderColor: "#E0E0E0",
          paddingHorizontal: 12,
          marginTop: 12,
          marginBottom: 12,
          height: 42,
        }}
      >
        <Ionicons
          name={"search-outline" as IoniconsName}
          size={18}
          color="#8E8E93"
        />
        <TextInput
          style={{
            flex: 1,
            marginLeft: 8,
            fontSize: 15,
            color: colors.navy.DEFAULT,
          }}
          placeholder={t("search.placeholder")}
          placeholderTextColor="#8E8E93"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* Content */}
      {loading ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingTop: 60,
          }}
        >
          <ActivityIndicator size="large" color={colors.golden.DEFAULT} />
        </View>
      ) : (
        <FlatList
          data={getData()}
          keyExtractor={(item: any) => item.id}
          renderItem={getRenderItem()}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      )}

      {/* Floating Action Button */}
      <Pressable
        onPress={openAddModal}
        style={{
          position: "absolute",
          bottom: 24,
          right: 20,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: colors.golden.DEFAULT,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
          elevation: 4,
        }}
      >
        <Ionicons name={"add" as IoniconsName} size={28} color="#FFFFFF" />
      </Pressable>

      {/* Add Modal */}
      <Modal
        visible={addModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.4)",
            justifyContent: "flex-end",
          }}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <View
              style={{
                backgroundColor: "#FFFFFF",
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                maxHeight: "85%",
              }}
            >
              {/* Modal Header */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingHorizontal: 20,
                  paddingVertical: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: "#F0F0F0",
                }}
              >
                <Pressable onPress={() => setAddModalVisible(false)}>
                  <Text style={{ fontSize: 15, color: "#8E8E93" }}>
                    {t("actions.cancel")}
                  </Text>
                </Pressable>
                <Text
                  style={{
                    fontSize: 17,
                    fontWeight: "700",
                    color: colors.navy.DEFAULT,
                  }}
                >
                  {getAddTitle()}
                </Text>
                <Pressable
                  onPress={handleSave}
                  disabled={isSaveDisabled()}
                >
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "600",
                      color: isSaveDisabled()
                        ? "#CCCCCC"
                        : colors.golden.DEFAULT,
                    }}
                  >
                    {t("actions.save")}
                  </Text>
                </Pressable>
              </View>

              {/* Modal Form */}
              <ScrollView
                style={{ paddingHorizontal: 20, paddingTop: 16 }}
                contentContainerStyle={{ paddingBottom: 40 }}
                keyboardShouldPersistTaps="handled"
              >
                {activeTab === "lawyers" && (
                  <>
                    {renderFormField(
                      t("lawyers.displayName"),
                      formDisplayName,
                      setFormDisplayName,
                      { required: true }
                    )}
                    {renderFormField(t("lawyers.firm"), formFirm, setFormFirm)}
                    {renderFormField(
                      t("lawyers.barNumber"),
                      formBarNumber,
                      setFormBarNumber
                    )}
                    {renderFormField(
                      t("lawyers.phone"),
                      formPhone,
                      setFormPhone,
                      { keyboardType: "phone-pad" }
                    )}
                    {renderFormField(
                      t("lawyers.email"),
                      formEmail,
                      setFormEmail,
                      { keyboardType: "email-address" }
                    )}
                    {renderFormField(
                      t("lawyers.specialty"),
                      formSpecialty,
                      setFormSpecialty
                    )}
                    {renderFormField(
                      t("lawyers.notes"),
                      formNotes,
                      setFormNotes,
                      { multiline: true }
                    )}
                    {/* Internal toggle */}
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 14,
                      }}
                    >
                      <Text
                        style={{
                          flex: 1,
                          fontSize: 13,
                          fontWeight: "600",
                          color: colors.navy.DEFAULT,
                        }}
                      >
                        {t("lawyers.isInternal")}
                      </Text>
                      <Pressable
                        onPress={() => setFormIsInternal(!formIsInternal)}
                        style={{
                          width: 48,
                          height: 28,
                          borderRadius: 14,
                          backgroundColor: formIsInternal
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
                            alignSelf: formIsInternal
                              ? "flex-end"
                              : "flex-start",
                          }}
                        />
                      </Pressable>
                    </View>
                  </>
                )}

                {activeTab === "judges" && (
                  <>
                    {renderFormField(
                      t("judges.displayName"),
                      formDisplayName,
                      setFormDisplayName,
                      { required: true }
                    )}
                    {renderFormField(
                      t("judges.court"),
                      formCourt,
                      setFormCourt
                    )}
                    {renderFormField(
                      t("judges.chamber"),
                      formChamber,
                      setFormChamber
                    )}
                    {renderFormField(
                      t("judges.phone"),
                      formPhone,
                      setFormPhone,
                      { keyboardType: "phone-pad" }
                    )}
                    {renderFormField(
                      t("judges.notes"),
                      formNotes,
                      setFormNotes,
                      { multiline: true }
                    )}
                  </>
                )}

                {activeTab === "courts" && (
                  <>
                    {renderFormField(
                      t("courts.name"),
                      formName,
                      setFormName,
                      { required: true }
                    )}
                    {renderFormField(
                      t("courts.address"),
                      formAddress,
                      setFormAddress
                    )}
                    {renderFormField(
                      t("courts.city"),
                      formCity,
                      setFormCity
                    )}
                    {renderFormField(
                      t("courts.jurisdiction"),
                      formJurisdiction,
                      setFormJurisdiction
                    )}
                    {renderFormField(
                      t("courts.phone"),
                      formPhone,
                      setFormPhone,
                      { keyboardType: "phone-pad" }
                    )}
                    {renderFormField(
                      t("courts.website"),
                      formWebsite,
                      setFormWebsite
                    )}
                    {renderFormField(
                      t("courts.notes"),
                      formNotes,
                      setFormNotes,
                      { multiline: true }
                    )}
                  </>
                )}
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <DeleteConfirmDialog
        visible={deleteConfirm !== null}
        onCancel={() => setDeleteConfirm(null)}
        onConfirm={confirmDeleteItem}
        title={deleteDialogCopy.title}
        body={deleteDialogCopy.body}
        confirmLabel={deleteDialogCopy.confirm}
      />
    </ScreenContainer>
  );
}
