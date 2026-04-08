import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  ActivityIndicator,
  Platform,
  Alert,
  Linking,
} from "react-native";
import Svg, { Path, Rect } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useQuery } from "@tanstack/react-query";
import Markdown from "react-native-markdown-display";
import * as Haptics from "expo-haptics";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { Audio } from "expo-av";
import { useAuth } from "@/contexts/AuthContext";
import { api, Message } from "@/lib/api";
import { ToolsSheet } from "@/components/ToolsSheet";

type LocalMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const mdStyles = StyleSheet.create({
  body: { color: "#000", fontSize: 14, lineHeight: 21 },
  code_inline: { backgroundColor: "#f0f0f0", borderRadius: 4, fontFamily: "monospace", fontSize: 12 },
  code_block: { backgroundColor: "#f0f0f0", borderRadius: 8, padding: 8, fontFamily: "monospace", fontSize: 12 },
  fence: { backgroundColor: "#f0f0f0", borderRadius: 8, padding: 8, fontFamily: "monospace", fontSize: 12 },
  heading1: { fontWeight: "800" as const, fontSize: 18, marginBottom: 8 },
  heading2: { fontWeight: "700" as const, fontSize: 16, marginBottom: 6 },
  heading3: { fontWeight: "700" as const, fontSize: 15, marginBottom: 4 },
  bullet_list: { marginVertical: 4 },
  ordered_list: { marginVertical: 4 },
  list_item: { flexDirection: "row" as const, marginBottom: 2 },
  strong: { fontWeight: "700" as const },
  em: { fontStyle: "italic" as const },
});

export default function ChatScreen() {
  const { id, initialMessage, mode: initialMode, fileUri, fileName, fileMime } = useLocalSearchParams<{
    id: string;
    initialMessage?: string;
    mode?: string;
    fileUri?: string;
    fileName?: string;
    fileMime?: string;
  }>();
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [message, setMessage] = useState("");
  const [activeMode, setActiveMode] = useState(initialMode ?? "fast");
  const [webSearch, setWebSearch] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [followUps, setFollowUps] = useState<string[]>([]);
  const isSmartActionRef = useRef(false);

  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);

  const inputRef = useRef<TextInput>(null);
  const abortRef = useRef<AbortController | null>(null);
  const lastAiMessage = useRef("");

  const { data: serverMessages } = useQuery({
    queryKey: ["messages", id],
    queryFn: () => api.getMessages(user!.uid, id),
    enabled: !!user && !!id && messages.length === 0,
    staleTime: 0,
  });

  useEffect(() => {
    if (serverMessages && serverMessages.length > 0 && messages.length === 0) {
      const mapped: LocalMessage[] = serverMessages.map((m: Message) => ({
        id: m.id,
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      }));
      setMessages(mapped);
    }
  }, [serverMessages]);

  useEffect(() => {
    if (fileUri && fileName) {
      handleFileUpload(fileUri, fileName, fileMime ?? "application/octet-stream");
    } else if (initialMessage && messages.length === 0) {
      sendMessage(initialMessage);
    }
  }, []);

  async function startRecording() {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Microphone access is required for voice input.");
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      recordingRef.current = recording;
      setIsRecording(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      Alert.alert("Error", "Could not start recording. Please try again.");
    }
  }

  async function stopRecording() {
    if (!recordingRef.current) return;
    setIsRecording(false);
    setIsTranscribing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await recordingRef.current.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      if (!uri) { setIsTranscribing(false); return; }
      const transcribed = await api.transcribeAudio(uri);
      if (transcribed) {
        setMessage((prev) => (prev ? prev + " " + transcribed : transcribed));
      } else {
        Alert.alert("Transcription failed", "Could not transcribe audio. Please try typing instead.");
      }
    } catch {
      Alert.alert("Error", "Voice transcription failed. Please try again.");
    } finally {
      setIsTranscribing(false);
    }
  }

  function getModeParams(): { useSearch: boolean; deepDive: boolean } {
    if (activeMode === "research") return { useSearch: true, deepDive: false };
    if (activeMode === "deep") return { useSearch: false, deepDive: true };
    return { useSearch: false, deepDive: false };
  }

  function handleModeChange(mode: string) {
    setActiveMode(mode);
    if (mode === "research") setWebSearch(true);
    else setWebSearch(false);
  }

  function genId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 6);
  }

  async function sendMessage(text: string, smartAction?: boolean) {
    if (!text.trim() || !user || isSending) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const userMsg: LocalMessage = {
      id: genId(),
      role: "user",
      content: text.trim(),
    };

    setMessages((prev) => [userMsg, ...prev]);
    setMessage("");
    setFollowUps([]);
    setIsSending(true);
    setStreamingContent("");
    isSmartActionRef.current = !!smartAction;

    const controller = new AbortController();
    abortRef.current = controller;

    const { useSearch, deepDive } = getModeParams();
    let fullContent = "";

    await api.streamChat(
      user.uid,
      id,
      text.trim(),
      useSearch,
      deepDive,
      (chunk) => {
        fullContent += chunk;
        setStreamingContent(fullContent);
      },
      () => {
        const finalContent = fullContent || "Sorry, I couldn't generate a response.";
        const aiMsg: LocalMessage = {
          id: genId(),
          role: "assistant",
          content: finalContent,
        };
        lastAiMessage.current = finalContent;
        setMessages((prev) => [aiMsg, ...prev]);
        setStreamingContent("");
        setIsSending(false);
        inputRef.current?.focus();
        api.saveMessages(id, user!.uid, [
          { id: userMsg.id, role: "user", content: text.trim() },
          { id: aiMsg.id, role: "assistant", content: finalContent },
        ]);
        if (!isSmartActionRef.current) {
          fetchFollowUps(text.trim(), finalContent);
        }
      },
      (err) => {
        const errMsg: LocalMessage = {
          id: genId(),
          role: "assistant",
          content: err.toLowerCase().includes("limit") || err.toLowerCase().includes("quota")
            ? "You've reached your daily message limit. Upgrade your plan to continue."
            : "Something went wrong. Please try again.",
        };
        setMessages((prev) => [errMsg, ...prev]);
        setStreamingContent("");
        setIsSending(false);
      },
      controller.signal,
      smartAction,
    );
  }

  async function fetchFollowUps(userMessage: string, aiResponse: string) {
    if (!user) return;
    try {
      const suggestions = await api.getFollowUps(user.uid, id, aiResponse, userMessage);
      if (suggestions.length > 0) setFollowUps(suggestions.slice(0, 3));
    } catch {}
  }

  async function handleFileUpload(
    fileUri: string,
    fileName: string,
    mimeType: string,
  ) {
    if (!user || isSending) return;
    setIsSending(true);
    setFollowUps([]);
    const userMsg: LocalMessage = {
      id: genId(),
      role: "user",
      content: `📎 ${fileName}`,
    };
    setMessages((prev) => [userMsg, ...prev]);

    try {
      const result = await api.uploadFileAndChat(user.uid, id, fileUri, fileName, mimeType);
      const aiMsg: LocalMessage = {
        id: genId(),
        role: "assistant",
        content: result?.response ?? "File received. How can I help you with it?",
      };
      setMessages((prev) => [aiMsg, ...prev]);
      fetchFollowUps(fileName, result?.response ?? "");
    } catch {
      const errMsg: LocalMessage = {
        id: genId(),
        role: "assistant",
        content: "Failed to process the file. Please try again.",
      };
      setMessages((prev) => [errMsg, ...prev]);
    } finally {
      setIsSending(false);
    }
  }

  const modes = [
    { id: "fast", label: "Fast" },
    { id: "research", label: "Research" },
    { id: "deep", label: "DeepThink" },
  ];

  const allMessages = streamingContent
    ? [{ id: "streaming", role: "assistant" as const, content: streamingContent }, ...messages]
    : messages;

  function renderMessage({ item }: { item: LocalMessage }) {
    const isUser = item.role === "user";
    const isStreaming = item.id === "streaming";

    if (isUser) {
      return (
        <View style={[styles.msgRow, styles.msgRowUser]}>
          <View style={[styles.bubble, styles.bubbleUser]}>
            <Text style={styles.bubbleTextUser}>{item.content}</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.msgRow, styles.msgRowAI]}>
        <View style={[styles.bubble, styles.bubbleAI]}>
          {isStreaming ? (
            <Text style={styles.bubbleTextAI}>
              {item.content}
              <Text style={styles.cursor}>▋</Text>
            </Text>
          ) : (
            <Markdown style={mdStyles}>{item.content}</Markdown>
          )}
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#fff" }}
      behavior="padding"
      keyboardVerticalOffset={0}
    >
      <View style={[styles.container, { paddingTop: Math.max(insets.top, Platform.OS === "web" ? 67 : 0) }]}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>←</Text>
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>Chat</Text>
        </View>

        <FlatList
          data={allMessages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          inverted
          contentContainerStyle={styles.messageList}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            isSending && !streamingContent ? (
              <View style={styles.typingRow}>
                <View style={styles.typingBubble}>
                  <ActivityIndicator color="#999" size="small" />
                </View>
              </View>
            ) : null
          }
          ListHeaderComponent={
            followUps.length > 0 && !isSending ? (
              <View style={styles.followUps}>
                {followUps.map((fu, i) => (
                  <Pressable
                    key={i}
                    style={styles.followUpChip}
                    onPress={() => sendMessage(fu)}
                  >
                    <Text style={styles.followUpText} numberOfLines={2}>{fu}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null
          }
        />

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
            <Pressable style={styles.iconBtn} onPress={() => setShowTools(true)}>
              <Text style={styles.iconPlus}>+</Text>
            </Pressable>
            <TextInput
              ref={inputRef}
              style={styles.textInput}
              placeholder="Ask anything..."
              placeholderTextColor="#999"
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={4000}
              returnKeyType="default"
              editable={!isSending && !isRecording && !isTranscribing}
            />
            {isTranscribing ? (
              <View style={styles.iconBtn}>
                <ActivityIndicator size="small" color="#e74c3c" />
              </View>
            ) : (
              <Pressable
                style={[styles.iconBtn, isRecording && styles.iconBtnRecording]}
                onPressIn={startRecording}
                onPressOut={stopRecording}
                disabled={isSending}
              >
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                  {isRecording ? (
                    <Rect x={6} y={6} width={12} height={12} rx={2} fill="#e74c3c" />
                  ) : (
                    <>
                      <Rect x={9} y={2} width={6} height={11} rx={3} stroke={isSending ? "#ccc" : "#e74c3c"} strokeWidth={2} />
                      <Path d="M5 10a7 7 0 0 0 14 0M12 19v3M8 22h8" stroke={isSending ? "#ccc" : "#e74c3c"} strokeWidth={2} />
                    </>
                  )}
                </Svg>
              </Pressable>
            )}
            <Pressable
              style={[styles.sendBtn, (!message.trim() || isSending || isRecording) && styles.sendBtnDisabled]}
              onPress={() => sendMessage(message)}
              disabled={!message.trim() || isSending || isRecording}
            >
              {isSending ? (
                <ActivityIndicator color="#000" size="small" />
              ) : (
                <Text style={styles.sendArrow}>↑</Text>
              )}
            </Pressable>
          </View>
          <View style={{ height: Math.max(insets.bottom - 52, 4) }} />
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
            if (!result.canceled && result.assets[0]) {
              const asset = result.assets[0];
              await handleFileUpload(asset.uri, asset.name, asset.mimeType ?? "application/octet-stream");
            }
          } catch {}
        }}
        onPickPhoto={async () => {
          try {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              quality: 0.8,
            });
            if (!result.canceled && result.assets[0]) {
              const asset = result.assets[0];
              const name = asset.fileName ?? "image.jpg";
              await handleFileUpload(asset.uri, name, asset.mimeType ?? "image/jpeg");
            }
          } catch {}
        }}
        onPickCamera={async () => {
          try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status === "granted") {
              const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
              if (!result.canceled && result.assets[0]) {
                const asset = result.assets[0];
                await handleFileUpload(asset.uri, "camera.jpg", "image/jpeg");
              }
            }
          } catch {}
        }}
        onFastMode={() => {
          sendMessage("Switch to fast mode and respond with a quick, concise answer.", true);
        }}
        onDeepThink={() => {
          sendMessage("Use deep thinking mode and provide a thorough, well-reasoned response.", true);
        }}
        onSummarize={() => {
          sendMessage("Please summarize our conversation so far in bullet points.", true);
        }}
        onExplain={() => {
          sendMessage("Please explain your last response in much simpler terms.", true);
        }}
        onAIMemory={() => {
          sendMessage("Show me what you remember about me from our previous conversations.", true);
        }}
        onExport={async (format) => {
          if (!user) return;
          const url = await api.exportChat(user.uid, id, format as "pdf" | "word" | "ppt");
          if (url) {
            Linking.openURL(url);
          } else {
            Alert.alert("Export failed", "Could not export the chat. Please try again.");
          }
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
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
    fontSize: 15,
    fontWeight: "700" as const,
    color: "#000",
    flex: 1,
  },
  messageList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  msgRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  msgRowUser: {
    justifyContent: "flex-end",
  },
  msgRowAI: {
    justifyContent: "flex-start",
  },
  bubble: {
    maxWidth: "80%",
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  bubbleUser: {
    backgroundColor: "#000",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 4,
  },
  bubbleAI: {
    backgroundColor: "#f0f0f0",
    borderTopLeftRadius: 4,
    borderTopRightRadius: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  bubbleTextUser: {
    color: "#fff",
    fontSize: 14,
    lineHeight: 21,
  },
  bubbleTextAI: {
    color: "#000",
    fontSize: 14,
    lineHeight: 21,
  },
  cursor: {
    color: "#999",
    opacity: 0.6,
  },
  typingRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  typingBubble: {
    backgroundColor: "#f0f0f0",
    borderRadius: 16,
    padding: 12,
    paddingHorizontal: 16,
  },
  followUps: {
    gap: 8,
    marginBottom: 8,
  },
  followUpChip: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: "#f8f8f8",
  },
  followUpText: {
    fontSize: 13,
    color: "#333",
    fontWeight: "500" as const,
  },
  inputArea: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
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
  iconBtn: {
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
  iconBtnRecording: {
    backgroundColor: "#fee2e2",
    borderColor: "#e74c3c",
  },
  iconPlus: {
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
  sendArrow: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#000",
  },
});
