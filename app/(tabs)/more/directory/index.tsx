import { useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useFocusEffect } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import { ScreenContainer } from "../../../../src/components/ui";
import { useServices } from "../../../../src/hooks/useServices";
import { colors } from "../../../../src/theme/tokens";
import type { Lawyer, Judge, Court } from "../../../../src/services/types";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];
type TabKey = "lawyers" | "judges" | "courts";

export default function DirectoryScreen() {
  const { t } = useTranslation("directory");
  const services = useServices();

  const [activeTab, setActiveTab] = useState<TabKey>("lawyers");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [lawyersList, setLawyersList] = useState<Lawyer[]>([]);
  const [judgesList, setJudgesList] = useState<Judge[]>([]);
  const [courtsList, setCourtsList] = useState<Court[]>([]);

  useFocusEffect(
    useCallback(() => {
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
    }, [services])
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

  const renderLawyerItem = ({ item }: { item: Lawyer }) => (
    <View
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
    </View>
  );

  const renderJudgeItem = ({ item }: { item: Judge }) => (
    <View
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
    </View>
  );

  const renderCourtItem = ({ item }: { item: Court }) => (
    <View
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
    </View>
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
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </ScreenContainer>
  );
}
