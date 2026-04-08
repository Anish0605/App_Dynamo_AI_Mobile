import { useRouter } from "expo-router";
import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import Svg, { Circle, Path, Polyline } from "react-native-svg";
import { Swipeable } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { api, Conversation } from "@/lib/api";
import { LightningLogo } from "@/components/LightningLogo";

function IconSearch() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Circle cx={11} cy={11} r={8} stroke="#999" strokeWidth={2} />
      <Path d="M21 21l-4.35-4.35" stroke="#999" strokeWidth={2} />
    </Svg>
  );
}

function IconPin() {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="#f59e0b">
      <Path d="M12 2l2.4 6.4H21l-5.3 3.8 2 6.2L12 14.5 6.3 18.4l2-6.2L3 8.4h6.6z" fill="#f59e0b" />
    </Svg>
  );
}

export default function ChatsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const swipeableRefs = useRef<Map<string, Swipeable | null>>(new Map());

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ["conversations", user?.uid],
    queryFn: () => api.getConversations(user!.uid),
    enabled: !!user,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.deleteConversation(user!.uid, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["conversations"] }),
    onError: () => Alert.alert("Error", "Could not delete chat."),
  });

  const filtered = conversations.filter((c) =>
    (c.title ?? "").toLowerCase().includes(search.toLowerCase())
  );

  function openChat(id: string) {
    setOpenMenuId(null);
    router.push(`/chat/${id}`);
  }

  function handleDelete(id: string) {
    setOpenMenuId(null);
    swipeableRefs.current.get(id)?.close();
    Alert.alert("Delete Chat", "Are you sure you want to delete this chat?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteMut.mutate(id) },
    ]);
  }

  function renderRightActions(id: string) {
    return (
      <Pressable
        style={styles.deleteSwipe}
        onPress={() => handleDelete(id)}
      >
        <Text style={styles.deleteSwipeText}>Delete</Text>
      </Pressable>
    );
  }

  function renderItem({ item }: { item: Conversation }) {
    const isOpen = openMenuId === item.id;
    return (
      <View style={styles.convItemWrapper}>
        <Swipeable
          ref={(ref) => {
            swipeableRefs.current.set(item.id, ref);
          }}
          renderRightActions={() => renderRightActions(item.id)}
          rightThreshold={60}
          friction={2}
          overshootRight={false}
        >
          <View style={styles.convItem}>
            <Pressable
              style={styles.convCard}
              onPress={() => { setOpenMenuId(null); openChat(item.id); }}
            >
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={styles.convRow}>
                  <Text style={styles.convTitle} numberOfLines={1}>{item.title ?? "Chat"}</Text>
                  <Text style={styles.convTime}>{item.updatedAt ? formatTime(item.updatedAt) : ""}</Text>
                </View>
              </View>

              <Pressable
                style={styles.dotsBtn}
                onPress={(e) => {
                  e.stopPropagation();
                  setOpenMenuId(isOpen ? null : item.id);
                }}
              >
                <Text style={styles.dotsText}>···</Text>
              </Pressable>
            </Pressable>

            {isOpen && (
              <Pressable
                style={{ ...StyleSheet.absoluteFillObject, zIndex: 5 }}
                onPress={() => setOpenMenuId(null)}
              />
            )}
            {isOpen && (
              <View style={styles.menu}>
                <Pressable
                  style={[styles.menuItem, styles.menuBorder]}
                  onPress={() => setOpenMenuId(null)}
                >
                  <Text style={styles.menuLabel}>Rename</Text>
                </Pressable>
                <Pressable
                  style={styles.menuItem}
                  onPress={() => handleDelete(item.id)}
                >
                  <Text style={[styles.menuLabel, { color: "#ef4444" }]}>Delete</Text>
                </Pressable>
              </View>
            )}
          </View>
        </Swipeable>
      </View>
    );
  }

  return (
    <Pressable style={{ flex: 1 }} onPress={() => setOpenMenuId(null)}>
      <View style={[styles.container, { paddingTop: Math.max(insets.top, Platform.OS === "web" ? 67 : 0) }]}>
        <View style={styles.header}>
          <LightningLogo size={32} borderRadius={10} />
          <Text style={styles.headerTitle}>Dynamo AI</Text>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <IconSearch />
            <TextInput
              style={styles.searchInput}
              placeholder="Search chats..."
              placeholderTextColor="#999"
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>

        <View style={styles.newChatRow}>
          <Pressable style={styles.newChatBtn} onPress={() => router.push("/(tabs)")}>
            <Text style={styles.newChatPlus}>+</Text>
            <Text style={styles.newChatLabel}>New Chat</Text>
          </Pressable>
        </View>

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color="#ffdb00" />
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.emptyText}>No chats yet</Text>
            <Text style={styles.emptySubText}>Start a new conversation from Home</Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
        )}
      </View>
    </Pressable>
  );
}

function formatTime(ts: string | number): string {
  try {
    const date = new Date(typeof ts === "number" ? ts : ts);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(diff / 3600000);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(diff / 86400000);
    if (days === 1) return "Yesterday";
    return `${days}d ago`;
  } catch {
    return "";
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800" as const,
    color: "#000",
  },
  searchRow: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#f8f8f8",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#000",
    backgroundColor: "transparent",
  },
  newChatRow: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  newChatBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  newChatPlus: {
    fontSize: 18,
    fontWeight: "400" as const,
    color: "#000",
  },
  newChatLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#000",
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: "#333",
  },
  emptySubText: {
    fontSize: 13,
    color: "#999",
  },
  convItemWrapper: {
    marginBottom: 8,
  },
  convItem: {
    position: "relative",
  },
  convCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#f8f8f8",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  convRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  convTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#000",
    flex: 1,
  },
  convTime: {
    fontSize: 11,
    color: "#999",
    marginLeft: 8,
    flexShrink: 0,
  },
  convPreview: {
    fontSize: 12,
    color: "#666",
  },
  dotsBtn: {
    flexShrink: 0,
    paddingHorizontal: 2,
    paddingTop: 1,
  },
  dotsText: {
    fontSize: 16,
    fontWeight: "900" as const,
    color: "#ffdb00",
    letterSpacing: 1,
  },
  deleteSwipe: {
    backgroundColor: "#ef4444",
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    borderRadius: 12,
    marginLeft: 8,
    marginBottom: 0,
  },
  deleteSwipeText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700" as const,
  },
  menu: {
    position: "absolute",
    top: 8,
    right: 36,
    backgroundColor: "#fff",
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 30,
    elevation: 10,
    zIndex: 10,
    minWidth: 150,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  menuBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#000",
  },
});
