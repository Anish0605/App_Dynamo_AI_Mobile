import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { useAuth } from "@/contexts/AuthContext";
import { LightningLogo } from "@/components/LightningLogo";

export default function SplashScreen() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/(tabs)");
    }
  }, [user, loading]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#ffdb00" size="large" />
      </View>
    );
  }

  if (user) return null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.centerContent}>
        <LightningLogo size={80} borderRadius={18} />
        <Text style={styles.title}>Dynamo AI</Text>
      </View>

      <View style={[styles.buttons, { paddingBottom: Math.max(insets.bottom + 20, 60) }]}>
        <Pressable
          style={styles.primaryBtn}
          onPress={() => router.push("/signup")}
        >
          <Text style={styles.primaryBtnText}>Create an account</Text>
        </Pressable>
        <Pressable
          style={styles.secondaryBtn}
          onPress={() => router.push("/login")}
        >
          <Text style={styles.secondaryBtnText}>I already have an account</Text>
        </Pressable>
      </View>

      <View style={[styles.homeIndicator, { bottom: Math.max(insets.bottom - 8, 8) }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    marginBottom: 140,
  },
  title: {
    fontSize: 36,
    fontWeight: "900" as const,
    color: "#000",
    letterSpacing: -1,
    lineHeight: 40,
  },
  buttons: {
    position: "absolute",
    bottom: 0,
    left: 32,
    right: 32,
    gap: 12,
  },
  primaryBtn: {
    width: "100%",
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: "#000",
    alignItems: "center",
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700" as const,
    letterSpacing: -0.3,
  },
  secondaryBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#000",
    alignItems: "center",
  },
  secondaryBtnText: {
    color: "#000",
    fontSize: 15,
    fontWeight: "600" as const,
  },
  homeIndicator: {
    position: "absolute",
    left: "50%",
    marginLeft: -67,
    width: 134,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#ddd",
  },
});
