import { View, Text, FlatList, Pressable, ActivityIndicator, Alert } from "react-native";
import { useTranslation } from "react-i18next";
import { useEffect, useState, useCallback } from "react";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { useServices } from "../../../../src/hooks/useServices";
import { useDocumentStore } from "../../../../src/stores/document-store";
import { colors } from "../../../../src/theme/tokens";
import type { Document, CaseSummary } from "../../../../src/services/types";
import { formatFileSize, DOC_TYPE_ICONS } from "../../../../src/services/types";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

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
  const [caseData, setCaseData] = useState<CaseSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!caseId) return;
    const [docs, cs] = await Promise.all([
      services.documents.getDocumentsByCaseId(caseId),
      services.cases.getCaseById(caseId),
    ]);
    setDocuments(docs);
    setCaseData(cs);
    setLoading(false);
  }, [caseId, services]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredDocs = documents.filter((doc) => {
    if (filterType === "all") return true;
    return doc.type === filterType;
  });

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
      await services.documents.addDocument({
        caseId: caseId!,
        name: "Photo_" + Date.now() + ".jpg",
        type: "image",
        mimeType: asset.mimeType ?? "image/jpeg",
        size: asset.fileSize ?? 0,
        uri: asset.uri,
      });
      await loadData();
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

      await services.documents.addDocument({
        caseId: caseId!,
        name: asset.name,
        type: docType,
        mimeType: mime,
        size: asset.size ?? 0,
        uri: asset.uri,
      });
      await loadData();
    }
  };

  const filterOptions: { key: "all" | "pdf" | "image"; label: string }[] = [
    { key: "all", label: t("filter.all") },
    { key: "pdf", label: t("filter.pdf") },
    { key: "image", label: t("filter.image") },
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
        {/* Filter Chips */}
        <View style={{ flexDirection: "row", paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}>
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
                  </View>

                  {/* File Size */}
                  <Text style={{ fontSize: 12, color: "#BBB", marginLeft: 8 }}>
                    {formatFileSize(item.size)}
                  </Text>

                  <Ionicons
                    name={"chevron-forward" as IoniconsName}
                    size={16}
                    color="#DDD"
                    style={{ marginLeft: 4 }}
                  />
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
      </View>
    </>
  );
}
