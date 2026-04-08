import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Platform,
} from "react-native";
import Svg, { Path, Polyline, Circle, Rect, Ellipse, Line } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function IconFile() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#3b82f6" strokeWidth={1.8} />
      <Polyline points="14 2 14 8 20 8" stroke="#3b82f6" strokeWidth={1.8} />
    </Svg>
  );
}

function IconPhoto() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={3} width={18} height={18} rx={3} stroke="#10b981" strokeWidth={1.8} />
      <Circle cx={8.5} cy={8.5} r={1.5} stroke="#10b981" strokeWidth={1.8} />
      <Polyline points="21 15 16 10 5 21" stroke="#10b981" strokeWidth={1.8} />
    </Svg>
  );
}

function IconCamera() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="#f59e0b" strokeWidth={1.8} />
      <Circle cx={12} cy={13} r={4} stroke="#f59e0b" strokeWidth={1.8} />
    </Svg>
  );
}

function IconZap() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="#eab308" strokeWidth={1.8} />
    </Svg>
  );
}

function IconBrain() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5a3 3 0 1 0-5.995.142A3 3 0 0 0 3 8.5a3.5 3.5 0 0 0 .5 1.75A4 4 0 0 0 4 17a5 5 0 0 0 8 0 4 4 0 0 0-.5-6.75A3.5 3.5 0 0 0 12 8.5a3 3 0 0 0-5.995.142" stroke="#8b5cf6" strokeWidth={1.8} />
      <Path d="M12 5a3 3 0 1 1 5.995.142A3 3 0 0 1 21 8.5a3.5 3.5 0 0 1-.5 1.75A4 4 0 0 1 20 17a5 5 0 0 1-8 0" stroke="#8b5cf6" strokeWidth={1.8} />
    </Svg>
  );
}

function IconSummarize() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#3b82f6" strokeWidth={1.8} />
      <Line x1={8} y1={13} x2={16} y2={13} stroke="#3b82f6" strokeWidth={1.8} />
      <Line x1={8} y1={17} x2={16} y2={17} stroke="#3b82f6" strokeWidth={1.8} />
    </Svg>
  );
}

function IconBulb() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Line x1={9} y1={18} x2={15} y2={18} stroke="#f97316" strokeWidth={1.8} />
      <Line x1={10} y1={22} x2={14} y2={22} stroke="#f97316" strokeWidth={1.8} />
      <Path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" stroke="#f97316" strokeWidth={1.8} />
    </Svg>
  );
}

function IconMemory() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Ellipse cx={12} cy={5} rx={9} ry={3} stroke="#a855f7" strokeWidth={1.8} />
      <Path d="M3 5v6c0 1.66 4.03 3 9 3s9-1.34 9-3V5" stroke="#a855f7" strokeWidth={1.8} />
      <Path d="M3 11v6c0 1.66 4.03 3 9 3s9-1.34 9-3v-6" stroke="#a855f7" strokeWidth={1.8} />
    </Svg>
  );
}

function IconExport() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="#10b981" strokeWidth={1.8} />
      <Polyline points="17 8 12 3 7 8" stroke="#10b981" strokeWidth={1.8} />
      <Line x1={12} y1={3} x2={12} y2={15} stroke="#10b981" strokeWidth={1.8} />
    </Svg>
  );
}

function IconGlobe() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={10} stroke="#06b6d4" strokeWidth={1.8} />
      <Line x1={2} y1={12} x2={22} y2={12} stroke="#06b6d4" strokeWidth={1.8} />
      <Path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="#06b6d4" strokeWidth={1.8} />
    </Svg>
  );
}

function IconChevron() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Polyline points="9 18 15 12 9 6" stroke="#bbb" strokeWidth={2} />
    </Svg>
  );
}

const EXPORT_FORMATS = ["PDF", "Word", "PPT"] as const;
type ExportFormat = "pdf" | "word" | "ppt";

interface ToolsSheetProps {
  visible: boolean;
  onClose: () => void;
  activeMode: string;
  onModeChange: (mode: string) => void;
  webSearch: boolean;
  onWebSearchToggle: () => void;
  onPickFile?: () => void;
  onPickPhoto?: () => void;
  onPickCamera?: () => void;
  onFastMode?: () => void;
  onDeepThink?: () => void;
  onSummarize?: () => void;
  onExplain?: () => void;
  onAIMemory?: () => void;
  onExport?: (format: ExportFormat) => void;
}

export function ToolsSheet({
  visible,
  onClose,
  activeMode,
  onModeChange,
  webSearch,
  onWebSearchToggle,
  onPickFile,
  onPickPhoto,
  onPickCamera,
  onFastMode,
  onDeepThink,
  onSummarize,
  onExplain,
  onAIMemory,
  onExport,
}: ToolsSheetProps) {
  const insets = useSafeAreaInsets();
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<"PDF" | "Word" | "PPT">("PDF");

  if (!visible) return null;

  function handleFastMode() {
    onModeChange("fast");
    onFastMode?.();
    onClose();
  }

  function handleDeepThink() {
    onModeChange("deep");
    onDeepThink?.();
    onClose();
  }

  const listItems = [
    {
      icon: <IconZap />,
      label: "Fast Mode",
      value: activeMode === "fast" ? "✓ Active" : "",
      action: handleFastMode,
    },
    {
      icon: <IconBrain />,
      label: "DeepThink",
      value: activeMode === "deep" ? "✓ Active" : "",
      action: handleDeepThink,
    },
    {
      icon: <IconSummarize />,
      label: "Summarize chat",
      value: "",
      action: () => { onSummarize?.(); onClose(); },
    },
    {
      icon: <IconBulb />,
      label: "Explain simply",
      value: "",
      action: () => { onExplain?.(); onClose(); },
    },
    {
      icon: <IconMemory />,
      label: "AI Memory",
      value: "",
      action: () => { onAIMemory?.(); onClose(); },
    },
    {
      icon: <IconExport />,
      label: "Export chat",
      value: "",
      action: () => setShowExportModal(true),
    },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.handle} />

        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Add to Chat</Text>
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>✕</Text>
          </Pressable>
        </View>

        <View style={styles.fileTiles}>
          {[
            { icon: <IconFile />, label: "File", action: onPickFile },
            { icon: <IconPhoto />, label: "Photo", action: onPickPhoto },
            { icon: <IconCamera />, label: "Camera", action: onPickCamera },
          ].map((t) => (
            <Pressable
              key={t.label}
              style={styles.fileTile}
              onPress={() => { t.action?.(); onClose(); }}
            >
              {t.icon}
              <Text style={styles.fileTileLabel}>{t.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.divider} />

        {listItems.map((item, i) => (
          <View key={i}>
            <Pressable style={styles.listItem} onPress={item.action}>
              {item.icon}
              <Text style={styles.listItemLabel}>{item.label}</Text>
              {item.value ? <Text style={styles.listItemValue}>{item.value}</Text> : null}
              <IconChevron />
            </Pressable>
            {i < listItems.length - 1 && <View style={styles.listDivider} />}
          </View>
        ))}

        <View style={styles.listDivider} />
        <View style={[styles.listItem, { opacity: activeMode === "fast" ? 0.4 : 1 }]}>
          <IconGlobe />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.listItemLabel}>Web search</Text>
            {activeMode === "fast" && (
              <Text style={styles.listItemSub}>Not available in Fast mode</Text>
            )}
          </View>
          <Pressable
            onPress={() => activeMode !== "fast" && onWebSearchToggle()}
            style={[styles.toggle, { backgroundColor: webSearch && activeMode !== "fast" ? "#000" : "#ddd" }]}
          >
            <View style={[styles.toggleKnob, { left: webSearch && activeMode !== "fast" ? 21 : 3 }]} />
          </Pressable>
        </View>
      </View>

      {showExportModal && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setShowExportModal(false)}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowExportModal(false)} />
          <View style={styles.modalCard}>
            <Text style={styles.modalEmoji}>📄</Text>
            <Text style={styles.modalTitle}>Export Chat</Text>
            <Text style={styles.modalSub}>Choose a format to export your conversation</Text>
            <View style={styles.formatRow}>
              {EXPORT_FORMATS.map((f) => (
                <Pressable
                  key={f}
                  onPress={() => setSelectedFormat(f)}
                  style={[styles.formatBtn, selectedFormat === f && styles.formatBtnActive]}
                >
                  <Text style={[styles.formatBtnText, selectedFormat === f && styles.formatBtnTextActive]}>
                    {f}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.modalBtns}>
              <Pressable
                style={styles.modalCancel}
                onPress={() => setShowExportModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.modalExport}
                onPress={() => {
                  setShowExportModal(false);
                  onClose();
                  const fmt = selectedFormat.toLowerCase() as ExportFormat;
                  onExport?.(fmt);
                }}
              >
                <Text style={styles.modalExportText}>Export {selectedFormat}</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    alignSelf: "center",
    marginTop: 12,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 12,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#000",
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnText: {
    fontSize: 14,
    color: "#555",
  },
  fileTiles: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  fileTile: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 14,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    gap: 8,
  },
  fileTileLabel: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: "#333",
  },
  divider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginHorizontal: 16,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  listItemLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500" as const,
    color: "#111",
  },
  listItemValue: {
    fontSize: 12,
    color: "#888",
  },
  listItemSub: {
    fontSize: 11,
    color: "#999",
    marginTop: 2,
  },
  listDivider: {
    height: 1,
    backgroundColor: "#f5f5f5",
    marginHorizontal: 20,
  },
  toggle: {
    width: 44,
    height: 26,
    borderRadius: 13,
    position: "relative",
  },
  toggleKnob: {
    position: "absolute",
    top: 3,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#fff",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalCard: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -155 }, { translateY: -140 }],
    width: 310,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  modalEmoji: {
    fontSize: 32,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800" as const,
    color: "#000",
  },
  modalSub: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
    marginBottom: 8,
  },
  formatRow: {
    flexDirection: "row",
    gap: 8,
    width: "100%",
    marginBottom: 8,
  },
  formatBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#e0e0e0",
    backgroundColor: "#f8f8f8",
    alignItems: "center",
  },
  formatBtnActive: {
    borderColor: "#ffdb00",
    backgroundColor: "#ffdb00",
  },
  formatBtnText: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: "#333",
  },
  formatBtnTextActive: {
    color: "#000",
  },
  modalBtns: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
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
  modalExport: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#ffdb00",
    alignItems: "center",
  },
  modalExportText: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: "#000",
  },
});
