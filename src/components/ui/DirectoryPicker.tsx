import { Modal, View, Text, TextInput, Pressable, FlatList, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useCallback, useMemo } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useServices } from "../../hooks/useServices";
import { colors } from "../../theme/tokens";
import type { Lawyer, Judge, Court } from "../../services/types";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

export type DirectoryPickerKind = "lawyer" | "judge" | "court";

export type DirectoryEntry =
  | { kind: "lawyer"; id: string; displayName: string; entry: Lawyer }
  | { kind: "judge"; id: string; displayName: string; entry: Judge }
  | { kind: "court"; id: string; displayName: string; entry: Court };

interface DirectoryPickerProps {
  visible: boolean;
  onClose: () => void;
  kind: DirectoryPickerKind;
  lawyerFilter?: "internal" | "external" | "all";
  currentId?: string | null;
  onSelect: (entry: DirectoryEntry) => void;
  onClear?: () => void;
}

const KIND_ICON: Record<DirectoryPickerKind, IoniconsName> = {
  lawyer: "person-outline" as IoniconsName,
  judge: "podium-outline" as IoniconsName,
  court: "business-outline" as IoniconsName,
};

export function DirectoryPicker({
  visible,
  onClose,
  kind,
  lawyerFilter = "all",
  currentId,
  onSelect,
  onClear,
}: DirectoryPickerProps) {
  const { t } = useTranslation("directory");
  const services = useServices();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [judges, setJudges] = useState<Judge[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  // Inline create form state
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newLawyerFirm, setNewLawyerFirm] = useState("");
  const [newLawyerInternal, setNewLawyerInternal] = useState(false);
  const [newJudgeCourt, setNewJudgeCourt] = useState("");
  const [newCourtCity, setNewCourtCity] = useState("");

  const title = useMemo(() => {
    if (kind === "lawyer") return t("lawyers.title");
    if (kind === "judge") return t("judges.title");
    return t("courts.title");
  }, [kind, t]);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    try {
      if (kind === "lawyer") {
        setLawyers(await services.directory.getLawyers());
      } else if (kind === "judge") {
        setJudges(await services.directory.getJudges());
      } else {
        setCourts(await services.directory.getCourts());
      }
    } finally {
      setLoading(false);
    }
  }, [kind, services]);

  useEffect(() => {
    if (!visible) return;
    setQuery("");
    setCreating(false);
    setNewDisplayName("");
    setNewLawyerFirm("");
    setNewLawyerInternal(lawyerFilter === "internal");
    setNewJudgeCourt("");
    setNewCourtCity("");
    loadEntries();
  }, [visible, loadEntries, lawyerFilter]);

  const normalizedQuery = query.trim().toLowerCase();

  const filteredEntries = useMemo<DirectoryEntry[]>(() => {
    if (kind === "lawyer") {
      return lawyers
        .filter((l) => {
          if (lawyerFilter === "internal" && !l.isInternal) return false;
          if (lawyerFilter === "external" && l.isInternal) return false;
          if (!normalizedQuery) return true;
          const hay = `${l.displayName} ${l.firm ?? ""} ${l.specialty ?? ""}`.toLowerCase();
          return hay.includes(normalizedQuery);
        })
        .map((l) => ({ kind: "lawyer" as const, id: l.id, displayName: l.displayName, entry: l }));
    }
    if (kind === "judge") {
      return judges
        .filter((j) => {
          if (!normalizedQuery) return true;
          const hay = `${j.displayName} ${j.court ?? ""} ${j.chamber ?? ""}`.toLowerCase();
          return hay.includes(normalizedQuery);
        })
        .map((j) => ({ kind: "judge" as const, id: j.id, displayName: j.displayName, entry: j }));
    }
    return courts
      .filter((c) => {
        if (!normalizedQuery) return true;
        const hay = `${c.name} ${c.city ?? ""} ${c.jurisdiction ?? ""}`.toLowerCase();
        return hay.includes(normalizedQuery);
      })
      .map((c) => ({ kind: "court" as const, id: c.id, displayName: c.name, entry: c }));
  }, [kind, lawyers, judges, courts, lawyerFilter, normalizedQuery]);

  const showEmptyCreateHint = !loading && filteredEntries.length === 0 && !creating;

  const openCreate = () => {
    setNewDisplayName(query.trim());
    setCreating(true);
  };

  const handleCreate = async () => {
    const name = newDisplayName.trim();
    if (!name) return;
    setSaving(true);
    try {
      let newEntry: DirectoryEntry;
      if (kind === "lawyer") {
        const created = await services.directory.createLawyer({
          displayName: name,
          firm: newLawyerFirm.trim() || undefined,
          isInternal: newLawyerInternal,
        });
        newEntry = { kind: "lawyer", id: created.id, displayName: created.displayName, entry: created };
      } else if (kind === "judge") {
        const created = await services.directory.createJudge({
          displayName: name,
          court: newJudgeCourt.trim() || undefined,
        });
        newEntry = { kind: "judge", id: created.id, displayName: created.displayName, entry: created };
      } else {
        const created = await services.directory.createCourt({
          name,
          address: "",
          city: newCourtCity.trim(),
        });
        newEntry = { kind: "court", id: created.id, displayName: created.name, entry: created };
      }
      onSelect(newEntry);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const renderListItem = ({ item }: { item: DirectoryEntry }) => {
    const isCurrent = item.id === currentId;
    let secondary: string | undefined;
    if (item.kind === "lawyer") {
      const parts: string[] = [];
      if (item.entry.firm) parts.push(item.entry.firm);
      parts.push(item.entry.isInternal ? t("lawyers.internal") : t("lawyers.external"));
      secondary = parts.join(" · ");
    } else if (item.kind === "judge") {
      const parts: string[] = [];
      if (item.entry.court) parts.push(item.entry.court);
      if (item.entry.chamber) parts.push(item.entry.chamber);
      secondary = parts.join(" · ") || undefined;
    } else {
      secondary = item.entry.city || undefined;
    }

    return (
      <Pressable
        onPress={() => {
          onSelect(item);
          onClose();
        }}
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 12,
          paddingHorizontal: 16,
          backgroundColor: isCurrent ? colors.golden[50] : "transparent",
          borderBottomWidth: 1,
          borderBottomColor: "#F5F0E8",
        }}
      >
        <Ionicons
          name={KIND_ICON[kind]}
          size={18}
          color={isCurrent ? colors.golden.DEFAULT : "#AAA"}
          style={{ marginRight: 12 }}
        />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, color: colors.navy.DEFAULT, fontWeight: isCurrent ? "600" : "500" }}>
            {item.displayName}
          </Text>
          {secondary && (
            <Text style={{ fontSize: 12, color: "#AAA", marginTop: 2 }}>{secondary}</Text>
          )}
        </View>
        {isCurrent && (
          <Ionicons name={"checkmark-circle" as IoniconsName} size={18} color={colors.golden.DEFAULT} />
        )}
      </Pressable>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{
            backgroundColor: colors.cream.DEFAULT,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            maxHeight: "85%",
            paddingBottom: insets.bottom + 12,
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingTop: 16,
              paddingBottom: 12,
              borderBottomWidth: 1,
              borderBottomColor: "#F0EAE0",
            }}
          >
            <Text style={{ flex: 1, fontSize: 17, fontWeight: "700", color: colors.navy.DEFAULT }}>
              {creating
                ? kind === "lawyer"
                  ? t("lawyers.addLawyer")
                  : kind === "judge"
                    ? t("judges.addJudge")
                    : t("courts.addCourt")
                : title}
            </Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name={"close-outline" as IoniconsName} size={26} color="#888" />
            </Pressable>
          </View>

          {creating ? (
            <View style={{ padding: 16 }}>
              {/* Display name (required) */}
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.navy.DEFAULT, marginBottom: 6 }}>
                {kind === "court" ? t("courts.name") : t("lawyers.displayName")} *
              </Text>
              <TextInput
                value={newDisplayName}
                onChangeText={setNewDisplayName}
                autoFocus
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  fontSize: 15,
                  color: colors.navy.DEFAULT,
                  borderWidth: 1,
                  borderColor: "#F0EAE0",
                  marginBottom: 12,
                }}
              />

              {kind === "lawyer" && (
                <>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: colors.navy.DEFAULT, marginBottom: 6 }}>
                    {t("lawyers.firm")}
                  </Text>
                  <TextInput
                    value={newLawyerFirm}
                    onChangeText={setNewLawyerFirm}
                    style={{
                      backgroundColor: "#FFFFFF",
                      borderRadius: 10,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      fontSize: 15,
                      color: colors.navy.DEFAULT,
                      borderWidth: 1,
                      borderColor: "#F0EAE0",
                      marginBottom: 12,
                    }}
                  />
                  <Pressable
                    onPress={() => setNewLawyerInternal((v) => !v)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: 10,
                      marginBottom: 12,
                    }}
                  >
                    <Ionicons
                      name={(newLawyerInternal ? "checkbox-outline" : "square-outline") as IoniconsName}
                      size={22}
                      color={newLawyerInternal ? colors.golden.DEFAULT : "#AAA"}
                    />
                    <Text style={{ marginLeft: 10, fontSize: 14, color: colors.navy.DEFAULT }}>
                      {t("lawyers.isInternal")}
                    </Text>
                  </Pressable>
                </>
              )}

              {kind === "judge" && (
                <>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: colors.navy.DEFAULT, marginBottom: 6 }}>
                    {t("judges.court")}
                  </Text>
                  <TextInput
                    value={newJudgeCourt}
                    onChangeText={setNewJudgeCourt}
                    style={{
                      backgroundColor: "#FFFFFF",
                      borderRadius: 10,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      fontSize: 15,
                      color: colors.navy.DEFAULT,
                      borderWidth: 1,
                      borderColor: "#F0EAE0",
                      marginBottom: 12,
                    }}
                  />
                </>
              )}

              {kind === "court" && (
                <>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: colors.navy.DEFAULT, marginBottom: 6 }}>
                    {t("courts.city")}
                  </Text>
                  <TextInput
                    value={newCourtCity}
                    onChangeText={setNewCourtCity}
                    style={{
                      backgroundColor: "#FFFFFF",
                      borderRadius: 10,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      fontSize: 15,
                      color: colors.navy.DEFAULT,
                      borderWidth: 1,
                      borderColor: "#F0EAE0",
                      marginBottom: 12,
                    }}
                  />
                </>
              )}

              <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
                <Pressable
                  onPress={() => setCreating(false)}
                  style={{
                    flex: 1,
                    backgroundColor: "#FFFFFF",
                    borderRadius: 12,
                    paddingVertical: 14,
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: "#E0D9CC",
                  }}
                >
                  <Text style={{ fontSize: 15, fontWeight: "600", color: colors.navy.DEFAULT }}>
                    {t("actions.cancel")}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleCreate}
                  disabled={!newDisplayName.trim() || saving}
                  style={{
                    flex: 1,
                    backgroundColor: !newDisplayName.trim() || saving ? colors.golden.light : colors.golden.DEFAULT,
                    borderRadius: 12,
                    paddingVertical: 14,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontSize: 15, fontWeight: "700", color: "#FFFFFF" }}>
                    {saving ? "..." : t("actions.save")}
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <>
              {/* Search */}
              <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "#FFFFFF",
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderWidth: 1,
                    borderColor: "#F0EAE0",
                  }}
                >
                  <Ionicons name={"search-outline" as IoniconsName} size={16} color="#AAA" />
                  <TextInput
                    placeholder={t("search.placeholder")}
                    placeholderTextColor="#CCC"
                    value={query}
                    onChangeText={setQuery}
                    style={{ flex: 1, marginLeft: 8, fontSize: 14, color: colors.navy.DEFAULT }}
                    autoCapitalize="none"
                  />
                  {query.length > 0 && (
                    <Pressable onPress={() => setQuery("")} hitSlop={8}>
                      <Ionicons name={"close-circle" as IoniconsName} size={16} color="#CCC" />
                    </Pressable>
                  )}
                </View>
              </View>

              {/* List */}
              {loading ? (
                <View style={{ paddingVertical: 40, alignItems: "center" }}>
                  <ActivityIndicator color={colors.golden.DEFAULT} />
                </View>
              ) : (
                <FlatList
                  data={filteredEntries}
                  keyExtractor={(item) => item.id}
                  renderItem={renderListItem}
                  keyboardShouldPersistTaps="handled"
                  style={{ maxHeight: 360 }}
                  ListEmptyComponent={
                    showEmptyCreateHint ? (
                      <View style={{ padding: 24, alignItems: "center" }}>
                        <Text style={{ fontSize: 13, color: "#AAA", marginBottom: 4 }}>
                          {t("search.noResults")}
                        </Text>
                      </View>
                    ) : null
                  }
                />
              )}

              {/* Footer actions */}
              <View
                style={{
                  borderTopWidth: 1,
                  borderTopColor: "#F0EAE0",
                  paddingHorizontal: 16,
                  paddingTop: 12,
                  paddingBottom: 4,
                  gap: 8,
                }}
              >
                {currentId && onClear && (
                  <Pressable
                    onPress={() => {
                      onClear();
                      onClose();
                    }}
                    style={{
                      paddingVertical: 12,
                      alignItems: "center",
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: "#E0D9CC",
                      backgroundColor: "#FFFFFF",
                    }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: "600", color: "#888" }}>
                      {t("picker.clear")}
                    </Text>
                  </Pressable>
                )}
                <Pressable
                  onPress={openCreate}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    paddingVertical: 12,
                    borderRadius: 10,
                    backgroundColor: colors.golden.DEFAULT,
                  }}
                >
                  <Ionicons name={"add-outline" as IoniconsName} size={18} color="#FFFFFF" />
                  <Text style={{ fontSize: 14, fontWeight: "700", color: "#FFFFFF", marginLeft: 6 }}>
                    {kind === "lawyer"
                      ? t("lawyers.addLawyer")
                      : kind === "judge"
                        ? t("judges.addJudge")
                        : t("courts.addCourt")}
                  </Text>
                </Pressable>
              </View>
            </>
          )}
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
