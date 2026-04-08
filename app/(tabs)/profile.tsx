import { useRouter } from "expo-router";
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Platform,
} from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/contexts/AuthContext";
import { api, UserInfo, PLAN_LIMITS } from "@/lib/api";

function InfoIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={10} stroke="#3b82f6" strokeWidth={2} />
      <Path d="M12 16v-4M12 8h.01" stroke="#3b82f6" strokeWidth={2} />
    </Svg>
  );
}

function MemoryIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={8} r={5} stroke="#a855f7" strokeWidth={2} />
      <Path d="M3 21c0-4.418 4.03-8 9-8s9 3.582 9 8" stroke="#a855f7" strokeWidth={2} />
    </Svg>
  );
}

function LogoutIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5m0 0l-5-5m5 5H9" stroke="#e74c3c" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();

  const { data: userInfo } = useQuery<UserInfo | null>({
    queryKey: ["userInfo", user?.uid],
    queryFn: () => api.getUser(user!.uid, user?.email ?? undefined, user?.displayName ?? undefined),
    enabled: !!user,
    staleTime: 30000,
  });

  const plan = (userInfo?.plan ?? "free") as "free" | "plus" | "pro";
  const planLabel = plan.toUpperCase();
  const messagesUsed = userInfo?.messages_used ?? 0;
  const messagesLimit = userInfo?.messages_limit ?? PLAN_LIMITS[plan];
  const imagesUsed = userInfo?.images_used ?? 0;
  const imagesLimit = userInfo?.images_limit ?? 0;
  const videosUsed = userInfo?.videos_used ?? 0;
  const videosLimit = userInfo?.videos_limit ?? 0;

  const displayName = user?.displayName ?? userInfo?.name ?? "User";
  const email = user?.email ?? userInfo?.email ?? "";
  const initial = displayName.charAt(0).toUpperCase();

  function msgBarPercent(): `${number}%` {
    if (!messagesLimit) return "0%";
    const pct = Math.min(Math.round((messagesUsed / messagesLimit) * 100), 100);
    return `${pct}%`;
  }

  async function handleLogout() {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          qc.clear();
          await signOut();
        },
      },
    ]);
  }

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, Platform.OS === "web" ? 67 : 0) }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom + 80, 100) }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{displayName}</Text>
            <View style={styles.planBadge}>
              <Text style={styles.planBadgeText}>{planLabel}</Text>
            </View>
          </View>
        </View>

        {email ? <Text style={styles.emailText}>{email}</Text> : null}

        <View style={styles.creditsCard}>
          <View style={styles.creditsHeader}>
            <Text style={styles.creditsTitle}>Credits</Text>
            <View style={styles.planPill}>
              <Text style={styles.planPillText}>{plan.charAt(0).toUpperCase() + plan.slice(1)}</Text>
            </View>
          </View>
          <View style={styles.creditItems}>
            <View style={styles.creditBlock}>
              <View style={styles.creditRow}>
                <Text style={styles.creditLabel}>💬 Messages</Text>
                <Text style={styles.creditValue}>{messagesUsed}/{messagesLimit}</Text>
              </View>
              {messagesLimit > 0 && (
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: msgBarPercent() }]} />
                </View>
              )}
            </View>
            <View style={styles.creditRow}>
              <Text style={styles.creditLabel}>🖼️ Images</Text>
              <Text style={styles.creditValue}>{imagesUsed}/{imagesLimit}</Text>
            </View>
            <View style={styles.creditRow}>
              <Text style={styles.creditLabel}>🎬 Videos</Text>
              <Text style={styles.creditValue}>{videosUsed}/{videosLimit}</Text>
            </View>
          </View>
          <Text style={styles.resetText}>Resets daily at 5:30 AM IST</Text>
        </View>

        <Pressable style={styles.upgradeBtn} onPress={() => router.push("/pricing")}>
          <Text style={styles.upgradeBtnText}>Upgrade Plan</Text>
        </Pressable>

        <View style={styles.menuList}>
          <Pressable style={styles.menuItem}>
            <InfoIcon />
            <Text style={styles.menuLabel}>Support</Text>
          </Pressable>
          <Pressable style={styles.menuItem} onPress={() => router.push("/memory")}>
            <MemoryIcon />
            <Text style={styles.menuLabel}>AI Memory</Text>
          </Pressable>
          <Pressable style={[styles.menuItem, styles.menuItemDanger]} onPress={handleLogout}>
            <LogoutIcon />
            <Text style={[styles.menuLabel, { color: "#e74c3c" }]}>Log out</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800" as const,
    color: "#000",
  },
  content: {
    paddingHorizontal: 16,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#f8f8f8",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    marginTop: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: "#ffdb00",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: "800" as const,
    color: "#000",
  },
  userName: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#000",
  },
  planBadge: {
    marginTop: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 100,
    backgroundColor: "#ffdb00",
  },
  planBadgeText: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: "#000",
  },
  emailText: {
    fontSize: 12,
    color: "#999",
    paddingHorizontal: 4,
    marginTop: 6,
  },
  creditsCard: {
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#f8f8f8",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  creditsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  creditsTitle: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  planPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 100,
    backgroundColor: "#fff9e6",
  },
  planPillText: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: "#d97706",
  },
  creditItems: {
    gap: 10,
  },
  creditBlock: {
    gap: 6,
  },
  creditRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  creditLabel: {
    fontSize: 13,
    color: "#666",
  },
  creditValue: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: "#000",
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "#e0e0e0",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#ffdb00",
    borderRadius: 2,
  },
  resetText: {
    fontSize: 11,
    color: "#999",
    textAlign: "center",
    marginTop: 10,
  },
  upgradeBtn: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#ffdb00",
    alignItems: "center",
  },
  upgradeBtnText: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: "#000",
  },
  menuList: {
    marginTop: 16,
    gap: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "#f8f8f8",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  menuItemDanger: {
    backgroundColor: "#fff",
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#000",
  },
});
