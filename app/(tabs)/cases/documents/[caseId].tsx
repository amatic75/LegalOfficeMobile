import { View, Text, FlatList, Pressable, ActivityIndicator, Alert, ScrollView, Modal } from "react-native";
import { useTranslation } from "react-i18next";
import { useState, useCallback } from "react";
import { useLocalSearchParams, useRouter, Stack, useFocusEffect } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { useServices } from "../../../../src/hooks/useServices";
import { useDocumentStore } from "../../../../src/stores/document-store";
import { colors } from "../../../../src/theme/tokens";
import type { Document, CaseSummary, DocumentFolder, DocumentFolderCategory } from "../../../../src/services/types";
import { formatFileSize, DOC_TYPE_ICONS, DOCUMENT_FOLDER_CATEGORIES, FOLDER_ICONS } from "../../../../src/services/types";

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

function formatDate(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

export default function DocumentListScreen() {
  const { caseId } = useLocalSearchParams<{ caseId: string }>();
  const { t } = useTranslation("documents");
  const services = useServices();
  const router = useRouter();

  const { filterType, setFilterType } = useDocumentStore();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [folders, setFolders] = useState<DocumentFolder[]>([]);
  const [caseData, setCaseData] = useState<CaseSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFolder, setSelectedFolder] = useState<string>("all");
  const [enhancing, setEnhancing] = useState(false);
  const [folderModalVisible, setFolderModalVisible] = useState(false);
  const [pendingPhotoAsset, setPendingPhotoAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);

  const loadData = useCallback(async () => {
    if (!caseId) return;
    const [docs, cs, fldrs] = await Promise.all([
      services.documents.getDocumentsByCaseId(caseId),
      services.cases.getCaseById(caseId),
      services.documents.getDocumentFolders(caseId),
    ]);
    setDocuments(docs);
    setCaseData(cs);
    setFolders(fldrs);
    setLoading(false);
  }, [caseId, services]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const filteredDocs = documents.filter((doc) => {
    if (filterType !== "all" && doc.type !== filterType) return false;
    if (selectedFolder !== "all" && doc.folderId !== selectedFolder) return false;
    return true;
  });

  const saveDocumentWithFolder = async (
    asset: { uri: string; name: string; type: Document["type"]; mimeType: string; size: number },
    folderId: string,
  ) => {
    await services.documents.addDocument({
      caseId: caseId!,
      name: asset.name,
      type: asset.type,
      mimeType: asset.mimeType,
      size: asset.size,
      uri: asset.uri,
      folderId,
    });
    await loadData();
  };

  const showFolderPicker = (asset: { uri: string; name: string; type: Document["type"]; mimeType: string; size: number }) => {
    setPendingPhotoAsset(asset as any);
    setFolderModalVisible(true);
  };

  const handleFolderSelected = async (folderId: string) => {
    setFolderModalVisible(false);
    if (pendingPhotoAsset) {
      const asset = pendingPhotoAsset;
      setPendingPhotoAsset(null);
      await saveDocumentWithFolder(
        {
          uri: asset.uri,
          name: (asset as any).name || "Photo_" + Date.now() + ".jpg",
          type: (asset as any).docType || "image",
          mimeType: asset.mimeType ?? "image/jpeg",
          size: asset.fileSize ?? 0,
        },
        folderId,
      );
    }
  };

  const handleCapturePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(t("permissionRequired"), t("permissionDenied"));
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      // MOB-01: Show confirmation prompt
      Alert.alert(
        t("scanning.scanConfirmTitle"),
        t("scanning.scanConfirmMessage"),
        [
          {
            text: t("scanning.retake"),
            style: "cancel",
            onPress: () => handleCapturePhoto(),
          },
          {
            text: t("scanning.usePhoto"),
            onPress: () => {
              // Show enhancing overlay
              setEnhancing(true);
              setTimeout(() => {
                setEnhancing(false);
                // Show folder picker
                const enrichedAsset = Object.assign(asset, {
                  name: "Photo_" + Date.now() + ".jpg",
                  docType: "image" as const,
                });
                showFolderPicker({
                  uri: enrichedAsset.uri,
                  name: enrichedAsset.name,
                  type: "image",
                  mimeType: enrichedAsset.mimeType ?? "image/jpeg",
                  size: enrichedAsset.fileSize ?? 0,
                });
              }, 1500);
            },
          },
        ],
      );
    }
  };

  const handleUploadFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "image/jpeg", "image/png"],
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      const mime = asset.mimeType ?? "";
      let docType: Document["type"] = "other";
      if (mime.startsWith("image/")) docType = "image";
      else if (mime === "application/pdf") docType = "pdf";

      showFolderPicker({
        uri: asset.uri,
        name: asset.name,
        type: docType,
        mimeType: mime,
        size: asset.size ?? 0,
      });
    }
  };

  const handleDeleteDocument = (doc: Document) => {
    Alert.alert(
      t("deleteConfirmTitle"),
      t("deleteConfirmMessage", { name: doc.name }),
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("deleteDocument"),
          style: "destructive",
          onPress: async () => {
            await services.documents.deleteDocument(doc.id);
            await loadData();
          },
        },
      ]
    );
  };

  const filterOptions: { key: "all" | "pdf" | "image"; label: string }[] = [
    { key: "all", label: t("filter.all") },
    { key: "pdf", label: t("filter.pdf") },
    { key: "image", label: t("filter.image") },
  ];

  const folderOptions: { key: string; label: string; icon: string }[] = [
    { key: "all", label: t("folders.all"), icon: "albums-outline" },
    ...DOCUMENT_FOLDER_CATEGORIES.map((cat) => ({
      key: cat,
      label: t("folders." + cat),
      icon: FOLDER_ICONS[cat],
    })),
  ];

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerTitle: t("title") }} />
        <View style={{ flex: 1, backgroundColor: colors.cream.DEFAULT, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.golden.DEFAULT} />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: caseData ? `${t("title")} - ${caseData.caseNumber}` : t("title"),
        }}
      />
      <View style={{ flex: 1, backgroundColor: colors.cream.DEFAULT }}>
        {/* Enhancing Overlay */}
        {enhancing && (
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              zIndex: 999,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <View
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 16,
                padding: 32,
                alignItems: "center",
              }}
            >
              <ActivityIndicator size="large" color={colors.golden.DEFAULT} />
              <Text style={{ fontSize: 15, color: colors.navy.DEFAULT, marginTop: 12, fontWeight: "600" }}>
                {t("scanning.enhancing")}
              </Text>
            </View>
          </View>
        )}

        {/* Folder Chips */}
        <View style={{ ...SECTION_CARD, marginTop: 12 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
          >
            {folderOptions.map((opt) => {
              const isActive = selectedFolder === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  onPress={() => setSelectedFolder(opt.key)}
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
                  <Ionicons
                    name={opt.icon as IoniconsName}
                    size={16}
                    color={isActive ? "#FFFFFF" : colors.navy.DEFAULT}
                  />
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "600",
                      color: isActive ? "#FFFFFF" : colors.navy.DEFAULT,
                    }}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Filter Chips */}
        <View style={{ flexDirection: "row", paddingHorizontal: 16, paddingBottom: 8, gap: 8 }}>
          {filterOptions.map((opt) => {
            const isActive = filterType === opt.key;
            return (
              <Pressable
                key={opt.key}
                onPress={() => setFilterType(opt.key)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: isActive ? colors.navy.DEFAULT : "#FFFFFF",
                  borderWidth: 1,
                  borderColor: isActive ? colors.navy.DEFAULT : "#E0E0E0",
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: isActive ? "#FFFFFF" : colors.navy.DEFAULT,
                  }}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Document List */}
        {filteredDocs.length === 0 ? (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 32,
            }}
          >
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
              <Ionicons name={"cloud-upload-outline" as IoniconsName} size={48} color="#DDD" />
              <Text
                style={{
                  fontSize: 15,
                  color: "#AAA",
                  marginTop: 12,
                  textAlign: "center",
                }}
              >
                {t("noDocuments")}
              </Text>
            </View>
          </View>
        ) : (
          <FlatList
            data={filteredDocs}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            renderItem={({ item }) => {
              const iconInfo = DOC_TYPE_ICONS[item.type];
              return (
                <Pressable
                  onPress={() =>
                    router.push("/(tabs)/cases/documents/preview/" + item.id as any)
                  }
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
                  {/* File Type Icon */}
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      backgroundColor: iconInfo.color + "15",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 12,
                    }}
                  >
                    <Ionicons
                      name={iconInfo.icon as IoniconsName}
                      size={28}
                      color={iconInfo.color}
                    />
                  </View>

                  {/* Document Info */}
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: colors.navy.DEFAULT,
                        marginBottom: 2,
                      }}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                    <Text style={{ fontSize: 12, color: "#999" }}>
                      {formatDate(item.createdAt)} {" \u00B7 "} {t("fileTypes." + item.type)}
                    </Text>
                    {/* Tags and Description */}
                    {(item.tags && item.tags.length > 0) || item.description ? (
                      <View style={{ marginTop: 4 }}>
                        {item.tags && item.tags.length > 0 && (
                          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4, marginBottom: item.description ? 2 : 0 }}>
                            {item.tags.map((tag) => (
                              <View
                                key={tag}
                                style={{
                                  backgroundColor: colors.golden[50],
                                  borderRadius: 8,
                                  paddingHorizontal: 6,
                                  paddingVertical: 2,
                                }}
                              >
                                <Text style={{ fontSize: 10, color: colors.golden.dark, fontWeight: "600" }}>
                                  {tag}
                                </Text>
                              </View>
                            ))}
                          </View>
                        )}
                        {item.description && (
                          <Text style={{ fontSize: 11, color: "#BBB" }} numberOfLines={1}>
                            {item.description}
                          </Text>
                        )}
                      </View>
                    ) : null}
                  </View>

                  {/* File Size */}
                  <Text style={{ fontSize: 12, color: "#BBB", marginLeft: 8 }}>
                    {formatFileSize(item.size)}
                  </Text>

                  {/* Delete Button */}
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDeleteDocument(item);
                    }}
                    hitSlop={8}
                    style={{ marginLeft: 8, padding: 4 }}
                  >
                    <Ionicons
                      name={"trash-outline" as IoniconsName}
                      size={18}
                      color="#E57373"
                    />
                  </Pressable>
                </Pressable>
              );
            }}
          />
        )}

        {/* Bottom Action Bar */}
        <View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            flexDirection: "row",
            backgroundColor: "#FFFFFF",
            paddingHorizontal: 16,
            paddingVertical: 12,
            paddingBottom: 28,
            gap: 12,
            borderTopWidth: 1,
            borderTopColor: "#F0E8D8",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <Pressable
            onPress={handleCapturePhoto}
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.navy.DEFAULT,
              borderRadius: 12,
              paddingVertical: 14,
              gap: 8,
            }}
          >
            <Ionicons name={"camera-outline" as IoniconsName} size={20} color="#FFFFFF" />
            <Text style={{ fontSize: 14, fontWeight: "600", color: "#FFFFFF" }}>
              {t("capturePhoto")}
            </Text>
          </Pressable>

          <Pressable
            onPress={handleUploadFile}
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.golden.DEFAULT,
              borderRadius: 12,
              paddingVertical: 14,
              gap: 8,
            }}
          >
            <Ionicons name={"document-attach-outline" as IoniconsName} size={20} color="#FFFFFF" />
            <Text style={{ fontSize: 14, fontWeight: "600", color: "#FFFFFF" }}>
              {t("uploadFile")}
            </Text>
          </Pressable>
        </View>

        {/* Folder Selection Modal */}
        <Modal
          visible={folderModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setFolderModalVisible(false)}
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
              <Text
                style={{
                  fontSize: 17,
                  fontWeight: "700",
                  color: colors.navy.DEFAULT,
                  marginBottom: 16,
                  textAlign: "center",
                }}
              >
                {t("selectFolder")}
              </Text>
              {DOCUMENT_FOLDER_CATEGORIES.map((cat) => (
                <Pressable
                  key={cat}
                  onPress={() => handleFolderSelected(cat)}
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
                  <Ionicons
                    name={FOLDER_ICONS[cat] as IoniconsName}
                    size={22}
                    color={colors.navy.DEFAULT}
                  />
                  <Text style={{ fontSize: 15, color: colors.navy.DEFAULT, fontWeight: "500" }}>
                    {t("folders." + cat)}
                  </Text>
                </Pressable>
              ))}
              <Pressable
                onPress={() => {
                  setFolderModalVisible(false);
                  setPendingPhotoAsset(null);
                }}
                style={{
                  marginTop: 12,
                  alignItems: "center",
                  paddingVertical: 14,
                  backgroundColor: "#F5F5F5",
                  borderRadius: 12,
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: "600", color: "#999" }}>
                  {t("cancel")}
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </View>
    </>
  );
}
