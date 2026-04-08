import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  Platform,
} from "react-native";
import Svg, { Path, Polyline } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/contexts/AuthContext";
import { api, Memory } from "@/lib/api";

function IconDelete() {
  return (
    <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
      <Polyline points="3 6 5 6 21 6" stroke="#ef4444" strokeWidth={2} />
      <Path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="#ef4444" strokeWidth={2} />
      <Path d="M10 11v6M14 11v6" stroke="#ef4444" strokeWidth={2} />
      <Path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke="#ef4444" strokeWidth={2} />
    </Svg>
  );
}

const MEMORY_ICONS = ["💡", "📝", "📋", "🎯", "🔖", "📌"];

export default function MemoryScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();

  const [showAdd, setShowAdd] = useState(false);
  const [newContent, setNewContent] = useState("");

  const { data: memories = [], isLoading } = useQuery({
    queryKey: ["memory", user?.uid],
    queryFn: () => api.getMemory(user!.uid),
    enabled: !!user,
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.deleteMemory(user!.uid, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["memory"] }),
    onError: () => Alert.alert("Error", "Could not delete memory."),
  });

  const addMut = useMutation({
    mutationFn: (content: string) => api.addMemory(user!.uid, content),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["memory"] });
      setNewContent("");
      setShowAdd(false);
    },
    onError: () => Alert.alert("Error", "Could not save memory."),
  });

  function handleDelete(id: string) {
    Alert.alert("Delete Memory", "Remove this memory?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          deleteMut.mutate(id);
        },
      },
    ]);
  }

  function handleAdd() {
    if (!newContent.trim()) return;
    addMut.mutate(newContent.trim());
  }

  function formatDate(iso?: string): string {
    if (!iso) return "";
    try {
      const date = new Date(iso);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const days = Math.floor(diff / 86400000);
      if (days === 0) return "Today";
      if (days === 1) return "Yesterday";
      return `${days} days ago`;
    } catch {
      return "";
    }
  }

  function renderItem({ item, index }: { item: Memory; index: number }) {
    const icon = MEMORY_ICONS[index % MEMORY_ICONS.length];
    return (
      <View style={styles.memoryCard}>
        <Text style={styles.memoryIcon}>{icon}</Text>
        <View style={{ flex: 1 }}>
          <View style={styles.memoryHeader}>
            <Text style={styles.memoryContent} numberOfLines={2}>{item.content}</Text>
            <Text style={styles.memoryDate}>{formatDate(item.created_at)}</Text>
          </View>
        </View>
        <Pressable style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
          <IconDelete />
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, Platform.OS === "web" ? 67 : 0) }]}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>←</Text>
        </Pressable>
        <View>
          <Text style={styles.headerTitle}>AI Memory</Text>
          <Text style={styles.headerSub}>Saved memories</Text>
        </View>
        <Pressable style={styles.addBtn} onPress={() => setShowAdd(true)}>
          <Text style={styles.addBtnText}>+</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#ffdb00" />
        </View>
      ) : memories.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No memories yet</Text>
          <Text style={styles.emptySubText}>Tap + to add your first memory</Text>
        </View>
      ) : (
        <FlatList
          data={memories}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal visible={showAdd} transparent animationType="fade" onRequestClose={() => setShowAdd(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowAdd(false)} />
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Add Memory</Text>
          <TextInput
            style={styles.modalInput}
            placeholder="What should I remember?"
            placeholderTextColor="#999"
            value={newContent}
            onChangeText={setNewContent}
            multiline
            autoFocus
            maxLength={500}
          />
          <View style={styles.modalBtns}>
            <Pressable style={styles.modalCancel} onPress={() => { setShowAdd(false); setNewContent(""); }}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.modalSave, (!newContent.trim() || addMut.isPending) && { opacity: 0.5 }]}
              onPress={handleAdd}
              disabled={!newContent.trim() || addMut.isPending}
            >
              {addMut.isPending ? (
                <ActivityIndicator color="#000" size="small" />
              ) : (
                <Text style={styles.modalSaveText}>Save</Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
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
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#f8f8f8",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    alignItems: "center",
    justifyContent: "center",
  },
  backBtnText: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#000",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800" as const,
    color: "#000",
  },
  headerSub: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  addBtn: {
    marginLeft: "auto",
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#ffdb00",
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnText: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: "#000",
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
  list: {
    padding: 16,
    gap: 8,
  },
  memoryCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#f8f8f8",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    marginBottom: 8,
  },
  memoryIcon: {
    fontSize: 18,
    flexShrink: 0,
  },
  memoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  memoryContent: {
    flex: 1,
    fontSize: 14,
    color: "#000",
    lineHeight: 20,
  },
  memoryDate: {
    fontSize: 11,
    color: "#999",
    flexShrink: 0,
  },
  deleteBtn: {
    flexShrink: 0,
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#fff0f0",
    borderWidth: 1,
    borderColor: "#fecaca",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalCard: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -155 }, { translateY: -120 }],
    width: 310,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800" as const,
    color: "#000",
    textAlign: "center",
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: "#000",
    minHeight: 80,
    textAlignVertical: "top",
  },
  modalBtns: {
    flexDirection: "row",
    gap: 10,
  },
  modalCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#e0e0e0",
    backgroundColor: "#f8f8f8",
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: "#000",
  },
  modalSave: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#ffdb00",
    alignItems: "center",
  },
  modalSaveText: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: "#000",
  },
});
