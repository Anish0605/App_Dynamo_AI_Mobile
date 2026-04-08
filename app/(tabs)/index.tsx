import { useRouter } from "expo-router";
import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import Svg, { Path, Circle, Rect, Polyline, Line, Ellipse } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { ToolsSheet } from "@/components/ToolsSheet";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { LightningLogo } from "@/components/LightningLogo";

function IconMic() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Rect x={9} y={2} width={6} height={11} rx={3} stroke="#e74c3c" strokeWidth={2} />
      <Path d="M5 10a7 7 0 0 0 14 0M12 19v3M8 22h8" stroke="#e74c3c" strokeWidth={2} />
    </Svg>
  );
}

function IconUp() {
  return (
    <Text style={{ color: "#000", fontSize: 18, fontWeight: "700" as const }}>↑</Text>
  );
}

const suggestions = [
  { emoji: "✍️", label: "Write", desc: "Draft emails, essays & more" },
  { emoji: "🔍", label: "Analyze", desc: "Data, documents & trends" },
  { emoji: "🖼️", label: "Generate Image", desc: "Create visuals with AI" },
  { emoji: "🌐", label: "Research", desc: "Summarize any topic fast" },
];

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [message, setMessage] = useState("");
  const [activeMode, setActiveMode] = useState("fast");
  const [webSearch, setWebSearch] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [creating, setCreating] = useState(false);

  const modes = [
    { id: "fast", label: "Fast" },
    { id: "research", label: "Research" },
    { id: "deep", label: "DeepThink" },
  ];

  function handleModeChange(id: string) {
    setActiveMode(id);
    if (id === "research") setWebSearch(true);
    else setWebSearch(false);
  }

  async function handleSend() {
    if (!message.trim() || !user || creating) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCreating(true);
    try {
      const chatId = await api.createConversation(user.uid, message.trim().slice(0, 50));
      if (chatId) {
        router.push({ pathname: `/chat/[id]`, params: { id: chatId, initialMessage: message.trim(), mode: activeMode } });
        setMessage("");
      } else {
        Alert.alert("Error", "Could not create conversation. Please try again.");
      }
    } catch {
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  function handleSuggestion(s: typeof suggestions[0]) {
    setMessage(s.label + ": ");
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#fff" }}
      behavior="padding"
      keyboardVerticalOffset={0}
    >
      <View style={[styles.container, { paddingTop: Math.max(insets.top, Platform.OS === "web" ? 67 : 0) }]}>
        <View style={styles.welcome}>
          <LightningLogo size={64} borderRadius={18} />
          <Text style={styles.welcomeTitle}>{"What can I help\nyou with today?"}</Text>
          <Text style={styles.welcomeSub}>Ask me anything — I'm ready</Text>

          <View style={styles.suggestionsGrid}>
            {suggestions.map((s) => (
              <Pressable key={s.label} style={styles.suggCard} onPress={() => handleSuggestion(s)}>
                <Text style={styles.suggEmoji}>{s.emoji}</Text>
                <Text style={styles.suggLabel}>{s.label}</Text>
                <Text style={styles.suggDesc}>{s.desc}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.inputArea}>
          <View style={styles.modePills}>
            {modes.map((m) => (
              <Pressable
                key={m.id}
                style={[styles.modePill, activeMode === m.id && styles.modePillActive]}
                onPress={() => handleModeChange(m.id)}
              >
                <Text style={[styles.modePillText, activeMode === m.id && styles.modePillTextActive]}>
                  {m.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.inputBar}>
            <Pressable style={styles.inputIconBtn} onPress={() => setShowTools(true)}>
              <Text style={styles.inputIconPlus}>+</Text>
            </Pressable>
            <Pressable style={styles.inputIconBtn}>
              <IconMic />
            </Pressable>
            <TextInput
              style={styles.textInput}
              placeholder="Ask anything..."
              placeholderTextColor="#999"
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={4000}
              returnKeyType="default"
              onSubmitEditing={handleSend}
            />
            <Pressable
              style={[styles.sendBtn, (!message.trim() || creating) && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!message.trim() || creating}
            >
              {creating ? <ActivityIndicator color="#000" size="small" /> : <IconUp />}
            </Pressable>
          </View>

          <View style={{ height: Math.max(insets.bottom - 52, 0) }} />
        </View>
      </View>

      <ToolsSheet
        visible={showTools}
        onClose={() => setShowTools(false)}
        activeMode={activeMode}
        onModeChange={handleModeChange}
        webSearch={webSearch}
        onWebSearchToggle={() => setWebSearch((v) => !v)}
        onPickFile={async () => {
          try {
            const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
            if (result.canceled || !result.assets?.[0]) return;
            const asset = result.assets[0];
            if (!user) return;
            setShowTools(false);
            const chatId = await api.createConversation(user.uid, asset.name ?? "File Chat");
            if (chatId) {
              router.push({ pathname: `/chat/[id]`, params: { id: chatId, fileUri: asset.uri, fileName: asset.name ?? "file", fileMime: asset.mimeType ?? "application/octet-stream" } });
            }
          } catch {}
        }}
        onPickPhoto={async () => {
          try {
            const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
            if (result.canceled || !result.assets?.[0]) return;
            const asset = result.assets[0];
            if (!user) return;
            setShowTools(false);
            const chatId = await api.createConversation(user.uid, "Image Chat");
            if (chatId) {
              router.push({ pathname: `/chat/[id]`, params: { id: chatId, fileUri: asset.uri, fileName: asset.fileName ?? "image.jpg", fileMime: asset.mimeType ?? "image/jpeg" } });
            }
          } catch {}
        }}
        onPickCamera={async () => {
          try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== "granted") { Alert.alert("Permission required", "Camera access is needed to take photos."); return; }
            const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
            if (result.canceled || !result.assets?.[0]) return;
            const asset = result.assets[0];
            if (!user) return;
            setShowTools(false);
            const chatId = await api.createConversation(user.uid, "Photo Chat");
            if (chatId) {
              router.push({ pathname: `/chat/[id]`, params: { id: chatId, fileUri: asset.uri, fileName: asset.fileName ?? "photo.jpg", fileMime: asset.mimeType ?? "image/jpeg" } });
            }
          } catch {}
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  welcome: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: "800" as const,
    textAlign: "center",
    color: "#000",
    lineHeight: 28,
    marginTop: 20,
  },
  welcomeSub: {
    fontSize: 13,
    color: "#999",
    marginTop: 8,
    marginBottom: 24,
  },
  suggestionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    width: "100%",
  },
  suggCard: {
    width: "47%",
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#f8f8f8",
    borderWidth: 1.5,
    borderColor: "#eee",
    gap: 5,
  },
  suggEmoji: {
    fontSize: 20,
  },
  suggLabel: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: "#000",
  },
  suggDesc: {
    fontSize: 11,
    color: "#999",
    lineHeight: 14,
  },
  inputArea: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: 0,
  },
  modePills: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 6,
  },
  modePill: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#e0e0e0",
    backgroundColor: "#f8f8f8",
  },
  modePillActive: {
    borderColor: "#000",
    backgroundColor: "#ffdb00",
  },
  modePillText: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: "#666",
  },
  modePillTextActive: {
    color: "#000",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f8f8f8",
    borderWidth: 2,
    borderColor: "#ffdb00",
    borderRadius: 16,
    padding: 8,
    paddingHorizontal: 10,
  },
  inputIconBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  inputIconPlus: {
    fontSize: 18,
    color: "#555",
    lineHeight: 22,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: "#000",
    backgroundColor: "transparent",
    maxHeight: 100,
    minHeight: 20,
  },
  sendBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#ffdb00",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
});
