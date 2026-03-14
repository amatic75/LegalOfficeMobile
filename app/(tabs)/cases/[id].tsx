import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert, TextInput } from "react-native";
import { useTranslation } from "react-i18next";
import { useState, useCallback } from "react";
import { useLocalSearchParams, useRouter, Stack, useFocusEffect } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useServices } from "../../../src/hooks/useServices";
import { colors } from "../../../src/theme/tokens";
import type { CaseSummary, CaseStatus, Document, CalendarEvent, CaseNote } from "../../../src/services/types";
import { STATUS_COLORS, STATUS_TRANSITIONS, formatFileSize, DOC_TYPE_ICONS, EVENT_TYPE_COLORS, PREDEFINED_TAGS, CASE_TYPE_SUBTYPES_TREE } from "../../../src/services/types";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

const STATUS_ICONS: Record<CaseStatus, IoniconsName> = {
  new: "sparkles-outline" as IoniconsName,
  active: "play-circle-outline" as IoniconsName,
  pending: "pause-circle-outline" as IoniconsName,
  closed: "checkmark-circle-outline" as IoniconsName,
  archived: "archive-outline" as IoniconsName,
};

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

function EditableInfoRow({ icon, label, value, placeholder, onSave }: {
  icon: IoniconsName;
  label: string;
  value?: string;
  placeholder: string;
  onSave: (newValue: string) => void;
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
      <View style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.golden.DEFAULT, backgroundColor: colors.golden[50] + "40", paddingHorizontal: 4, borderRadius: 4, marginHorizontal: -4 }}>
        <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
          <View style={{ width: 32, alignItems: "center", marginTop: 2 }}>
            <Ionicons name={icon} size={16} color={colors.golden.DEFAULT} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, color: colors.golden.DEFAULT, marginBottom: 2 }}>{label}</Text>
            <TextInput
              style={{ fontSize: 14, color: colors.navy.DEFAULT, padding: 0, minHeight: 20 }}
              value={editValue}
              onChangeText={setEditValue}
              autoFocus={true}
              placeholder={placeholder}
              placeholderTextColor="#CCC"
            />
          </View>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 12, marginTop: 8, paddingRight: 4 }}>
          <Pressable onPress={handleCancel} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Ionicons name={"close-outline" as IoniconsName} size={18} color="#AAA" />
          </Pressable>
          <Pressable onPress={handleSave} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Ionicons name={"checkmark-outline" as IoniconsName} size={18} color={colors.golden.DEFAULT} />
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <Pressable onPress={() => { setEditValue(value ?? ""); setEditing(true); }}>
      <View style={{ flexDirection: "row", alignItems: "flex-start", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F5F0E8" }}>
        <View style={{ width: 32, alignItems: "center", marginTop: 2 }}>
          <Ionicons name={icon} size={16} color={value ? "#AAA" : "#CCC"} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, color: "#AAA", marginBottom: 2 }}>{label}</Text>
          {value ? (
            <Text style={{ fontSize: 14, color: colors.navy.DEFAULT }}>{value}</Text>
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Text style={{ fontSize: 14, color: "#CCC", fontStyle: "italic" }}>{placeholder}</Text>
              <Ionicons name={"pencil-outline" as IoniconsName} size={12} color="#CCC" />
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

export default function CaseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation("cases");
  const services = useServices();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { t: td } = useTranslation("documents");
  const { t: tc } = useTranslation("calendar");

  const [caseData, setCaseData] = useState<CaseSummary | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [caseEvents, setCaseEvents] = useState<CalendarEvent[]>([]);
  const [notes, setNotes] = useState<CaseNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);

  // Notes state
  const [addingNote, setAddingNote] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteContent, setEditNoteContent] = useState("");

  // Tags state
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [customTagText, setCustomTagText] = useState("");

  // Tree picker state
  const [showTreePicker, setShowTreePicker] = useState(false);

  const loadCase = useCallback(async () => {
    if (!id) return;
    const [data, docs, events, caseNotes] = await Promise.all([
      services.cases.getCaseById(id),
      services.documents.getDocumentsByCaseId(id),
      services.calendarEvents.getEventsByCaseId(id),
      services.caseNotes.getNotesByCaseId(id),
    ]);
    setCaseData(data);
    setDocuments(docs);
    setCaseEvents(events);
    setNotes(caseNotes);
    setLoading(false);
  }, [id, services]);

  useFocusEffect(
    useCallback(() => {
      loadCase();
    }, [loadCase])
  );

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

  const handleInlineFieldSave = async (field: string, newValue: string) => {
    if (!id) return;
    const updated = await services.cases.updateCase(id, { [field]: newValue || undefined });
    if (updated) setCaseData(updated);
  };

  // Notes handlers
  const handleAddNote = async () => {
    if (!id || !newNoteContent.trim()) return;
    await services.caseNotes.createNote({ caseId: id, type: 'text', content: newNoteContent.trim() });
    const refreshed = await services.caseNotes.getNotesByCaseId(id);
    setNotes(refreshed);
    setNewNoteContent("");
    setAddingNote(false);
  };

  const handleEditNote = async (noteId: string) => {
    if (!editNoteContent.trim()) return;
    await services.caseNotes.updateNote(noteId, editNoteContent.trim());
    if (id) {
      const refreshed = await services.caseNotes.getNotesByCaseId(id);
      setNotes(refreshed);
    }
    setEditingNoteId(null);
    setEditNoteContent("");
  };

  const handleDeleteNote = (noteId: string) => {
    Alert.alert(
      t('notes.deleteNote'),
      t('notes.deleteConfirm'),
      [
        { text: t('notes.cancel'), style: 'cancel' },
        {
          text: t('notes.deleteNote'),
          style: 'destructive',
          onPress: async () => {
            await services.caseNotes.deleteNote(noteId);
            if (id) {
              const refreshed = await services.caseNotes.getNotesByCaseId(id);
              setNotes(refreshed);
            }
          },
        },
      ]
    );
  };

  // Tags handlers
  const handleToggleTag = async (tag: string) => {
    if (!id || !caseData) return;
    const currentTags = caseData.tags ?? [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter((t) => t !== tag)
      : [...currentTags, tag];
    const updated = await services.cases.updateCase(id, { tags: newTags });
    if (updated) setCaseData(updated);
  };

  const handleRemoveTag = async (tag: string) => {
    if (!id || !caseData) return;
    const newTags = (caseData.tags ?? []).filter((t) => t !== tag);
    const updated = await services.cases.updateCase(id, { tags: newTags });
    if (updated) setCaseData(updated);
  };

  const handleAddCustomTag = async () => {
    if (!id || !caseData || !customTagText.trim()) return;
    const tag = customTagText.trim().toLowerCase();
    const currentTags = caseData.tags ?? [];
    if (currentTags.includes(tag)) { setCustomTagText(""); return; }
    const newTags = [...currentTags, tag];
    const updated = await services.cases.updateCase(id, { tags: newTags });
    if (updated) setCaseData(updated);
    setCustomTagText("");
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
  const caseTags = caseData.tags ?? [];

  // Tree picker data
  const treeData = caseData.caseType ? CASE_TYPE_SUBTYPES_TREE[caseData.caseType] : null;

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
            <Pressable onPress={() => setShowTreePicker(!showTreePicker)}>
              <View style={{ flexDirection: "row", alignItems: "flex-start", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#F5F0E8" }}>
                <View style={{ width: 32, alignItems: "center", marginTop: 2 }}>
                  <Ionicons name={"layers-outline" as IoniconsName} size={16} color={colors.golden.DEFAULT} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: "#AAA", marginBottom: 2 }}>{t("detail.subtype")}</Text>
                  <Text style={{ fontSize: 14, color: colors.golden.DEFAULT, fontWeight: "600" }}>
                    {t('subtype.' + caseData.caseSubtype)}
                  </Text>
                </View>
                <Ionicons name={(showTreePicker ? "chevron-up" : "chevron-down") as IoniconsName} size={14} color={colors.golden.DEFAULT} style={{ marginTop: 8 }} />
              </View>
            </Pressable>
          )}

          {/* Tree Picker (inline expandable) */}
          {showTreePicker && treeData && (
            <View style={{ paddingVertical: 8, paddingLeft: 32, borderBottomWidth: 1, borderBottomColor: "#F5F0E8" }}>
              <Text style={{ fontSize: 12, color: "#AAA", marginBottom: 6 }}>{t("detail.selectSubtypeDetails")}</Text>
              {Object.entries(treeData.subtypes).map(([subtypeKey, subtypeData]) => {
                const isSelected = caseData.caseSubtype === subtypeKey;
                return (
                  <View key={subtypeKey} style={{ marginBottom: 6 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Ionicons
                        name={(isSelected ? "radio-button-on" : "radio-button-off") as IoniconsName}
                        size={14}
                        color={isSelected ? colors.golden.DEFAULT : "#CCC"}
                      />
                      <Text style={{ fontSize: 13, fontWeight: isSelected ? "600" : "400", color: isSelected ? colors.navy.DEFAULT : "#888" }}>
                        {subtypeData.label}
                      </Text>
                    </View>
                    {isSelected && (
                      <View style={{ paddingLeft: 22, marginTop: 4 }}>
                        {subtypeData.items.map((item) => (
                          <View key={item} style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 2 }}>
                            <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.golden[500] }} />
                            <Text style={{ fontSize: 12, color: "#888" }}>{item}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
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

          {/* Inline Editable: Opposing Party Representative */}
          <EditableInfoRow
            icon={"person-add-outline" as IoniconsName}
            label={t("detail.opposingPartyRep")}
            value={caseData.opposingPartyRepresentative}
            placeholder={t("detail.tapToEdit")}
            onSave={(v) => handleInlineFieldSave("opposingPartyRepresentative", v)}
          />

          {caseData.court && (
            <InfoRow
              icon={"business-outline" as IoniconsName}
              label={t("detail.court")}
              value={caseData.court}
            />
          )}

          {/* Inline Editable: Court Case Number */}
          <EditableInfoRow
            icon={"barcode-outline" as IoniconsName}
            label={t("detail.courtCaseNumber")}
            value={caseData.courtCaseNumber}
            placeholder={t("detail.tapToEdit")}
            onSave={(v) => handleInlineFieldSave("courtCaseNumber", v)}
          />

          {/* Inline Editable: Judge */}
          <EditableInfoRow
            icon={"podium-outline" as IoniconsName}
            label={t("detail.judge")}
            value={caseData.judge}
            placeholder={t("detail.tapToEdit")}
            onSave={(v) => handleInlineFieldSave("judge", v)}
          />

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
        <View style={SECTION_CARD}>
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

        {/* Tags Section */}
        <View style={SECTION_CARD}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
            <Ionicons name={"pricetag-outline" as IoniconsName} size={18} color={colors.navy.DEFAULT} style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.navy.DEFAULT, flex: 1 }}>
              {t("tags.title")}
            </Text>
            <Pressable onPress={() => setShowTagPicker(!showTagPicker)}>
              <Ionicons name={(showTagPicker ? "close-outline" : "add-outline") as IoniconsName} size={22} color={colors.golden.DEFAULT} />
            </Pressable>
          </View>

          {caseTags.length > 0 ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: showTagPicker ? 12 : 0 }}>
              {caseTags.map((tag) => {
                const predefinedKey = PREDEFINED_TAGS.includes(tag as any) ? tag : null;
                const displayLabel = predefinedKey ? t(`tags.predefined.${predefinedKey}`) : tag;
                return (
                  <View
                    key={tag}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: colors.golden[50],
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 16,
                      gap: 6,
                    }}
                  >
                    <Text style={{ fontSize: 13, color: colors.golden[700], fontWeight: "500" }}>{displayLabel}</Text>
                    <Pressable onPress={() => handleRemoveTag(tag)}>
                      <Ionicons name={"close-circle" as IoniconsName} size={16} color={colors.golden[500]} />
                    </Pressable>
                  </View>
                );
              })}
            </View>
          ) : (
            !showTagPicker && (
              <View
                style={{
                  borderWidth: 1,
                  borderStyle: "dashed",
                  borderColor: "#DDD",
                  borderRadius: 10,
                  paddingVertical: 16,
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 13, color: "#AAA" }}>{t("tags.addTag")}</Text>
              </View>
            )
          )}

          {/* Tag Picker (inline) */}
          {showTagPicker && (
            <View>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                {PREDEFINED_TAGS.map((tag) => {
                  const isActive = caseTags.includes(tag);
                  return (
                    <Pressable key={tag} onPress={() => handleToggleTag(tag)}>
                      <View
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 16,
                          borderWidth: 1,
                          borderColor: isActive ? colors.golden.DEFAULT : "#DDD",
                          backgroundColor: isActive ? colors.golden[50] : "#FFF",
                        }}
                      >
                        <Text style={{ fontSize: 12, color: isActive ? colors.golden[700] : "#888" }}>
                          {t(`tags.predefined.${tag}`)}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <TextInput
                  style={{
                    flex: 1,
                    fontSize: 13,
                    borderWidth: 1,
                    borderColor: "#DDD",
                    borderRadius: 8,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    color: colors.navy.DEFAULT,
                  }}
                  placeholder={t("tags.customTag")}
                  placeholderTextColor="#CCC"
                  value={customTagText}
                  onChangeText={setCustomTagText}
                  onSubmitEditing={handleAddCustomTag}
                />
                <Pressable
                  onPress={handleAddCustomTag}
                  style={{
                    backgroundColor: colors.golden[50],
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: "600", color: colors.golden.DEFAULT }}>{t("tags.addTag")}</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>

        {/* Notes Section */}
        <View style={SECTION_CARD}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
            <Ionicons name={"notebook-outline" as IoniconsName} size={18} color={colors.navy.DEFAULT} style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.navy.DEFAULT, flex: 1 }}>
              {t("notes.title")} ({notes.length})
            </Text>
            <Pressable onPress={() => setAddingNote(!addingNote)} style={{ marginRight: 8 }}>
              <Ionicons name={(addingNote ? "close-outline" : "add-outline") as IoniconsName} size={22} color={colors.golden.DEFAULT} />
            </Pressable>
            <Pressable disabled style={{ opacity: 0.4 }}>
              <Ionicons name={"mic-outline" as IoniconsName} size={20} color={colors.navy.DEFAULT} />
            </Pressable>
          </View>

          {/* Add Note Form */}
          {addingNote && (
            <View style={{ marginBottom: 12, backgroundColor: colors.golden[50] + "40", borderRadius: 8, padding: 12 }}>
              <TextInput
                style={{
                  fontSize: 14,
                  color: colors.navy.DEFAULT,
                  borderWidth: 1,
                  borderColor: colors.golden[100],
                  borderRadius: 8,
                  padding: 10,
                  minHeight: 60,
                  textAlignVertical: "top",
                  backgroundColor: "#FFF",
                }}
                multiline
                placeholder={t("notes.placeholder")}
                placeholderTextColor="#CCC"
                value={newNoteContent}
                onChangeText={setNewNoteContent}
                autoFocus
              />
              <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 12, marginTop: 8 }}>
                <Pressable onPress={() => { setAddingNote(false); setNewNoteContent(""); }}>
                  <Text style={{ fontSize: 13, color: "#AAA" }}>{t("notes.cancel")}</Text>
                </Pressable>
                <Pressable onPress={handleAddNote}>
                  <Text style={{ fontSize: 13, fontWeight: "600", color: colors.golden.DEFAULT }}>{t("notes.save")}</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* Notes List */}
          {notes.length > 0 ? (
            notes.map((note) => {
              const isVoice = note.type === 'voice';
              const isEditing = editingNoteId === note.id;
              const noteDate = new Date(note.createdAt);
              const dateStr = noteDate.toLocaleDateString('sr-Latn-RS', { day: '2-digit', month: '2-digit', year: 'numeric' });
              const timeStr = noteDate.toLocaleTimeString('sr-Latn-RS', { hour: '2-digit', minute: '2-digit' });

              return (
                <View
                  key={note.id}
                  style={{
                    backgroundColor: "#FFF",
                    borderRadius: 10,
                    padding: 12,
                    marginBottom: 8,
                    borderLeftWidth: 3,
                    borderLeftColor: isVoice ? '#42A5F5' : colors.golden.DEFAULT,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.03,
                    shadowRadius: 2,
                    elevation: 1,
                  }}
                >
                  {isEditing ? (
                    <>
                      <TextInput
                        style={{
                          fontSize: 13,
                          color: colors.navy.DEFAULT,
                          borderWidth: 1,
                          borderColor: colors.golden[100],
                          borderRadius: 6,
                          padding: 8,
                          minHeight: 50,
                          textAlignVertical: "top",
                          backgroundColor: colors.golden[50] + "40",
                        }}
                        multiline
                        value={editNoteContent}
                        onChangeText={setEditNoteContent}
                        autoFocus
                      />
                      <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 12, marginTop: 6 }}>
                        <Pressable onPress={() => { setEditingNoteId(null); setEditNoteContent(""); }}>
                          <Ionicons name={"close-outline" as IoniconsName} size={18} color="#AAA" />
                        </Pressable>
                        <Pressable onPress={() => handleEditNote(note.id)}>
                          <Ionicons name={"checkmark-outline" as IoniconsName} size={18} color={colors.golden.DEFAULT} />
                        </Pressable>
                      </View>
                    </>
                  ) : isVoice ? (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Ionicons name={"mic-outline" as IoniconsName} size={20} color="#42A5F5" />
                      <Text style={{ fontSize: 13, color: "#888", flex: 1 }}>
                        {t("notes.voiceNote")} ({note.audioDuration ? `${Math.floor(note.audioDuration / 60)}:${String(note.audioDuration % 60).padStart(2, '0')}` : '--:--'})
                      </Text>
                      <Pressable disabled style={{ opacity: 0.4 }}>
                        <Ionicons name={"play-circle-outline" as IoniconsName} size={24} color="#42A5F5" />
                      </Pressable>
                    </View>
                  ) : (
                    <>
                      <Text style={{ fontSize: 13, color: colors.navy.DEFAULT, lineHeight: 18 }} numberOfLines={editingNoteId ? undefined : 2}>
                        {note.content}
                      </Text>
                      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
                        <Text style={{ fontSize: 11, color: "#BBB" }}>
                          {dateStr} {timeStr}
                          {note.updatedAt ? ' *' : ''}
                        </Text>
                        <View style={{ flexDirection: "row", gap: 12 }}>
                          <Pressable onPress={() => { setEditingNoteId(note.id); setEditNoteContent(note.content ?? ""); }}>
                            <Ionicons name={"pencil-outline" as IoniconsName} size={16} color="#AAA" />
                          </Pressable>
                          <Pressable onPress={() => handleDeleteNote(note.id)}>
                            <Ionicons name={"trash-outline" as IoniconsName} size={16} color="#E57373" />
                          </Pressable>
                        </View>
                      </View>
                    </>
                  )}
                </View>
              );
            })
          ) : (
            !addingNote && (
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
                <Ionicons name={"document-text-outline" as IoniconsName} size={28} color="#DDD" />
                <Text style={{ fontSize: 13, color: "#AAA", marginTop: 8, textAlign: "center", paddingHorizontal: 16 }}>
                  {t("notes.emptyState")}
                </Text>
              </View>
            )
          )}
        </View>

        {/* Documents Section */}
        <View style={SECTION_CARD}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
            <Ionicons name={"document-outline" as IoniconsName} size={18} color={colors.navy.DEFAULT} style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.navy.DEFAULT, flex: 1 }}>
              {td("documentCount", { count: documents.length })}
            </Text>
          </View>
          {documents.length > 0 ? (
            <>
              {documents.slice(0, 3).map((doc) => {
                const iconInfo = DOC_TYPE_ICONS[doc.type];
                return (
                  <View
                    key={doc.id}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: 8,
                      borderBottomWidth: 1,
                      borderBottomColor: "#F5F0E8",
                    }}
                  >
                    <Ionicons
                      name={iconInfo.icon as IoniconsName}
                      size={20}
                      color={iconInfo.color}
                      style={{ marginRight: 10 }}
                    />
                    <Text
                      style={{ flex: 1, fontSize: 13, color: colors.navy.DEFAULT }}
                      numberOfLines={1}
                    >
                      {doc.name}
                    </Text>
                    <Text style={{ fontSize: 12, color: "#BBB", marginLeft: 8 }}>
                      {formatFileSize(doc.size)}
                    </Text>
                  </View>
                );
              })}
              <Pressable
                onPress={() => router.push('/(tabs)/cases/documents/' + id as any)}
                style={{
                  marginTop: 10,
                  paddingVertical: 8,
                  alignItems: "center",
                  backgroundColor: colors.golden[50],
                  borderRadius: 8,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: "600", color: colors.golden.DEFAULT }}>
                  {td("viewAll")}
                </Text>
              </Pressable>
            </>
          ) : (
            <>
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
                  {td("noDocsYet")}
                </Text>
              </View>
              <Pressable
                onPress={() => router.push('/(tabs)/cases/documents/' + id as any)}
                style={{
                  marginTop: 10,
                  paddingVertical: 8,
                  alignItems: "center",
                  backgroundColor: colors.golden[50],
                  borderRadius: 8,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: "600", color: colors.golden.DEFAULT }}>
                  {td("addDocument")}
                </Text>
              </Pressable>
            </>
          )}
        </View>

        {/* Calendar Events Section */}
        <View style={SECTION_CARD}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
            <Ionicons name={"calendar-outline" as IoniconsName} size={18} color={colors.navy.DEFAULT} style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 14, fontWeight: "700", color: colors.navy.DEFAULT, flex: 1 }}>
              {t("detail.linkedEvents")} ({caseEvents.length})
            </Text>
          </View>
          {caseEvents.length > 0 ? (
            <>
              {caseEvents
                .sort((a, b) => a.date.localeCompare(b.date))
                .slice(0, 3)
                .map((evt) => {
                  const evtColor = EVENT_TYPE_COLORS[evt.type];
                  return (
                    <View
                      key={evt.id}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingVertical: 8,
                        borderBottomWidth: 1,
                        borderBottomColor: "#F5F0E8",
                      }}
                    >
                      <View
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: evtColor.dot,
                          marginRight: 10,
                        }}
                      />
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{ fontSize: 13, color: colors.navy.DEFAULT }}
                          numberOfLines={1}
                        >
                          {evt.title}
                        </Text>
                        <Text style={{ fontSize: 11, color: "#AAA", marginTop: 2 }}>
                          {evt.date.split("-").reverse().join(".")} {evt.startTime && evt.endTime ? `${evt.startTime} - ${evt.endTime}` : tc("allDay")}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              <Pressable
                onPress={() => router.push("/(tabs)/calendar" as any)}
                style={{
                  marginTop: 10,
                  paddingVertical: 8,
                  alignItems: "center",
                  backgroundColor: colors.golden[50],
                  borderRadius: 8,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: "600", color: colors.golden.DEFAULT }}>
                  {tc("viewAll")}
                </Text>
              </Pressable>
            </>
          ) : (
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
          )}
        </View>
      </ScrollView>
    </>
  );
}
