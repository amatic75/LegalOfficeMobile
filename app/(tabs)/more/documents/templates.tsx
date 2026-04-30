import { View, Text, FlatList, Pressable, ActivityIndicator, Alert, ScrollView, Modal, Linking, Platform } from "react-native";
import { useTranslation } from "react-i18next";
import { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";
import * as IntentLauncher from "expo-intent-launcher";
import * as FileSystem from "expo-file-system/legacy";
import { useServices } from "../../../../src/hooks/useServices";
import { colors } from "../../../../src/theme/tokens";
import type { DocumentTemplate, DocumentTemplateCategory } from "../../../../src/services/types";
import { DOCUMENT_TEMPLATE_CATEGORIES, formatFileSize } from "../../../../src/services/types";
import { DeleteConfirmDialog } from "../../../../src/components/ui/DeleteConfirmDialog";

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

const CATEGORY_ICONS: Record<DocumentTemplateCategory, IoniconsName> = {
  ugovor: "document-text-outline" as IoniconsName,
  zalba: "return-up-back-outline" as IoniconsName,
  tuzba: "hammer-outline" as IoniconsName,
  punomocje: "create-outline" as IoniconsName,
  predlog: "bulb-outline" as IoniconsName,
  odluka: "checkmark-done-outline" as IoniconsName,
  odgovor: "chatbox-ellipses-outline" as IoniconsName,
  other: "document-outline" as IoniconsName,
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

export default function DocumentTemplatesScreen() {
  const { t } = useTranslation("moreDocuments");
  const services = useServices();

  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<"all" | DocumentTemplateCategory>("all");

  // After picking a file the user chooses its category before save.
  type PendingTemplate = { uri: string; name: string; type: "word" | "text"; mimeType: string; size: number };
  const [pendingTemplate, setPendingTemplate] = useState<PendingTemplate | null>(null);
  const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState<DocumentTemplate | null>(null);
  // Speed-dial FAB opens just one action (Add template) — kept for visual parity.
  const [fabOpen, setFabOpen] = useState(false);

  const loadData = useCallback(async () => {
    const all = await services.documentTemplates.getAll();
    setTemplates(all);
    setLoading(false);
  }, [services]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const filtered = templates.filter((tpl) => filterCategory === "all" || tpl.category === filterCategory);

  const handlePickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: [
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/rtf",
        "text/plain",
        "text/*",
      ],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets || result.assets.length === 0) return;
    const asset = result.assets[0];
    const mime = asset.mimeType ?? mimeFromName(asset.name);
    const isWord =
      mime === "application/msword"
      || mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      || mime === "application/rtf"
      || /\.(doc|docx|rtf)$/i.test(asset.name);
    const isText = mime.startsWith("text/") || /\.(txt|md|csv|log)$/i.test(asset.name);
    if (!isWord && !isText) {
      Alert.alert(t("templates.title"), t("templates.selectFile"));
      return;
    }
    setPendingTemplate({
      uri: asset.uri,
      name: asset.name,
      type: isWord ? "word" : "text",
      mimeType: mime || (isWord ? "application/rtf" : "text/plain"),
      size: asset.size ?? 0,
    });
    setCategoryPickerVisible(true);
  };

  const handleCategorySelected = async (category: DocumentTemplateCategory) => {
    setCategoryPickerVisible(false);
    if (!pendingTemplate) return;
    const a = pendingTemplate;
    setPendingTemplate(null);
    await services.documentTemplates.create({
      name: a.name,
      type: a.type,
      mimeType: a.mimeType,
      size: a.size,
      uri: a.uri,
      category,
    });
    await loadData();
  };

  const confirmDeleteTemplate = async () => {
    if (!deleteConfirm) return;
    const id = deleteConfirm.id;
    setDeleteConfirm(null);
    await services.documentTemplates.delete(id);
    await loadData();
  };

  const handleOpenTemplate = async (tpl: DocumentTemplate) => {
    if (!tpl.uri || tpl.uri.startsWith("file://mock/")) {
      Alert.alert(t("templates.title"), tpl.name);
      return;
    }
    const mimeType = tpl.mimeType || mimeFromName(tpl.name);
    try {
      if (Platform.OS === "android") {
        const contentUri = tpl.uri.startsWith("file://") ? await FileSystem.getContentUriAsync(tpl.uri) : tpl.uri;
        await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
          data: contentUri,
          flags: 1,
          type: mimeType,
        });
        return;
      }
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(tpl.uri, { mimeType, dialogTitle: tpl.name, UTI: mimeType });
        return;
      }
      const supported = await Linking.canOpenURL(tpl.uri);
      if (supported) await Linking.openURL(tpl.uri);
    } catch {
      // Silently fall through; user already saw the file in the list.
    }
  };

  const filterChips: { key: "all" | DocumentTemplateCategory; label: string; icon: IoniconsName }[] = [
    { key: "all", label: t("templates.filterAll"), icon: "albums-outline" as IoniconsName },
    ...DOCUMENT_TEMPLATE_CATEGORIES.map((c) => ({
      key: c,
      label: t("templates.categories." + c),
      icon: CATEGORY_ICONS[c],
    })),
  ];

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.cream.DEFAULT, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={colors.golden.DEFAULT} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream.DEFAULT }}>
      {/* Category filter chips — 2 rows that scroll horizontally if overflow */}
      <View style={{ ...SECTION_CARD, marginTop: 12 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ gap: 8 }}>
            {(() => {
              const perRow = Math.ceil(filterChips.length / 2);
              return [0, 1].map((rowIdx) => (
                <View key={rowIdx} style={{ flexDirection: "row", gap: 8 }}>
                  {filterChips.slice(rowIdx * perRow, (rowIdx + 1) * perRow).map((opt) => {
                    const isActive = filterCategory === opt.key;
                    return (
                      <Pressable
                        key={opt.key}
                        onPress={() => setFilterCategory(opt.key)}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                          borderRadius: 20,
                          backgroundColor: isActive ? colors.navy.DEFAULT : "#F5F5F5",
                          gap: 6,
                        }}
                      >
                        <Ionicons name={opt.icon} size={16} color={isActive ? "#FFFFFF" : colors.navy.DEFAULT} />
                        <Text style={{ fontSize: 13, fontWeight: "600", color: isActive ? "#FFFFFF" : colors.navy.DEFAULT }}>
                          {opt.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ));
            })()}
          </View>
        </ScrollView>
      </View>

      {filtered.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
          <View
            style={{
              borderWidth: 2,
              borderStyle: "dashed",
              borderColor: "#DDD",
              borderRadius: 16,
              paddingVertical: 40,
              paddingHorizontal: 32,
              alignItems: "center",
              width: "100%",
            }}
          >
            <Ionicons name={"library-outline" as IoniconsName} size={48} color="#DDD" />
            <Text style={{ fontSize: 15, color: "#AAA", marginTop: 12, textAlign: "center" }}>
              {t("templates.noTemplates")}
            </Text>
          </View>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => handleOpenTemplate(item)}
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 12,
                flexDirection: "row",
                alignItems: "center",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.04,
                shadowRadius: 4,
                elevation: 1,
                borderWidth: 1,
                borderColor: "#FFF3E0",
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  backgroundColor: colors.golden[50],
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                <Ionicons name={CATEGORY_ICONS[item.category]} size={26} color={colors.golden.DEFAULT} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: colors.navy.DEFAULT, marginBottom: 2 }} numberOfLines={1}>
                  {item.name}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <View style={{ backgroundColor: colors.golden[50], borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
                    <Text style={{ fontSize: 10, fontWeight: "700", color: colors.golden.DEFAULT }}>
                      {t("templates.categories." + item.category)}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 11, color: "#999" }}>{formatDate(item.createdAt)}</Text>
                  <Text style={{ fontSize: 11, color: "#A89F8F" }}>· {item.type === "word" ? "Word" : "Text"}</Text>
                </View>
              </View>
              <Text style={{ fontSize: 11, color: "#BBB", marginLeft: 8 }}>{formatFileSize(item.size)}</Text>
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  setDeleteConfirm(item);
                }}
                hitSlop={8}
                style={{ marginLeft: 8, padding: 4 }}
              >
                <Ionicons name={"trash-outline" as IoniconsName} size={18} color="#E57373" />
              </Pressable>
            </Pressable>
          )}
        />
      )}

      {/* Speed-dial FAB — single "Add template" action for now */}
      {fabOpen && (
        <>
          <Pressable
            onPress={() => setFabOpen(false)}
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.3)" }}
          />
          <Pressable
            onPress={() => {
              setFabOpen(false);
              handlePickFile();
            }}
            style={{
              position: "absolute",
              bottom: 88,
              right: 20,
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#FFFFFF",
              borderRadius: 28,
              paddingVertical: 10,
              paddingHorizontal: 14,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 6,
              elevation: 4,
            }}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: colors.golden[50],
                alignItems: "center",
                justifyContent: "center",
                marginRight: 10,
              }}
            >
              <Ionicons name={"document-attach-outline" as IoniconsName} size={18} color={colors.golden.DEFAULT} />
            </View>
            <Text style={{ fontSize: 14, fontWeight: "600", color: colors.navy.DEFAULT }}>
              {t("templates.addTemplate")}
            </Text>
          </Pressable>
        </>
      )}

      <Pressable
        onPress={() => setFabOpen((p) => !p)}
        style={{
          position: "absolute",
          bottom: 24,
          right: 20,
          width: 52,
          height: 52,
          borderRadius: 26,
          backgroundColor: colors.golden.DEFAULT,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: colors.golden.DEFAULT,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.35,
          shadowRadius: 8,
          elevation: 6,
          zIndex: 10,
        }}
      >
        <Ionicons name={(fabOpen ? "close" : "add") as IoniconsName} size={28} color="#FFFFFF" />
      </Pressable>

      {/* Category picker — opens after the user picks a file */}
      <Modal
        visible={categoryPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCategoryPickerVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" }}>
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingTop: 20,
              paddingBottom: 40,
              paddingHorizontal: 20,
            }}
          >
            <Text style={{ fontSize: 17, fontWeight: "700", color: colors.navy.DEFAULT, marginBottom: 16, textAlign: "center" }}>
              {t("templates.selectCategory")}
            </Text>
            {DOCUMENT_TEMPLATE_CATEGORIES.map((c) => (
              <Pressable
                key={c}
                onPress={() => handleCategorySelected(c)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 14,
                  paddingHorizontal: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: "#F0F0F0",
                  gap: 12,
                }}
              >
                <Ionicons name={CATEGORY_ICONS[c]} size={22} color={colors.navy.DEFAULT} />
                <Text style={{ fontSize: 15, color: colors.navy.DEFAULT, fontWeight: "500" }}>
                  {t("templates.categories." + c)}
                </Text>
              </Pressable>
            ))}
            <Pressable
              onPress={() => {
                setCategoryPickerVisible(false);
                setPendingTemplate(null);
              }}
              style={{
                marginTop: 12,
                alignItems: "center",
                paddingVertical: 14,
                backgroundColor: "#F5F5F5",
                borderRadius: 12,
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: "600", color: "#999" }}>×</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <DeleteConfirmDialog
        visible={deleteConfirm !== null}
        onCancel={() => setDeleteConfirm(null)}
        onConfirm={confirmDeleteTemplate}
        title={t("templates.deleteConfirmTitle")}
        body={deleteConfirm ? t("templates.deleteConfirmMessage", { name: deleteConfirm.name }) : ""}
        confirmLabel={t("templates.deleteConfirmTitle")}
      />
    </View>
  );
}

function mimeFromName(name: string): string {
  const ext = name.toLowerCase().split(".").pop() ?? "";
  switch (ext) {
    case "doc": return "application/msword";
    case "docx": return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case "rtf": return "application/rtf";
    case "txt": return "text/plain";
    case "csv": return "text/csv";
    default: return "application/octet-stream";
  }
}
