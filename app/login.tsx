import { useRouter } from "expo-router";
import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { LightningLogo } from "@/components/LightningLogo";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { signIn, signInWithGoogle, error, clearError } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const passwordRef = useRef<TextInput>(null);

  const [, response, promptAsync] = Google.useAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    clientId: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  });

  React.useEffect(() => {
    if (response?.type === "success") {
      const token = response.authentication?.idToken;
      if (token) {
        setGoogleLoading(true);
        signInWithGoogle(token).then(() => {
          router.replace("/(tabs)");
        }).catch(() => {
          setGoogleLoading(false);
        });
      }
    }
  }, [response]);

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert("Missing fields", "Please enter your email and password.");
      return;
    }
    setLoading(true);
    clearError();
    try {
      await signIn(email, password);
      router.replace("/(tabs)");
    } catch {
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    await promptAsync();
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#fff" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: Math.max(insets.top + 20, 60), paddingBottom: Math.max(insets.bottom + 20, 40) },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Pressable style={styles.closeBtn} onPress={() => router.back()}>
            <Text style={styles.closeBtnText}>×</Text>
          </Pressable>

          <LightningLogo size={48} borderRadius={10} />

          <Text style={styles.title}>Welcome Back</Text>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TextInput
            style={styles.input}
            placeholder="Email Address"
            placeholderTextColor="#999"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            value={email}
            onChangeText={setEmail}
            onSubmitEditing={() => passwordRef.current?.focus()}
            editable={!loading}
          />

          <TextInput
            ref={passwordRef}
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#999"
            secureTextEntry
            returnKeyType="done"
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={handleLogin}
            editable={!loading}
          />

          <Pressable
            style={styles.forgotRow}
            onPress={async () => {
              if (!email.trim()) {
                Alert.alert("Reset Password", "Enter your email address above, then tap 'Forgot password?' to receive a reset link.");
                return;
              }
              try {
                await sendPasswordResetEmail(auth, email.trim());
                Alert.alert("Check your email", `A password reset link has been sent to ${email.trim()}.`);
              } catch {
                Alert.alert("Error", "Could not send reset email. Please check the email address and try again.");
              }
            }}
          >
            <Text style={styles.forgotText}>Forgot password?</Text>
          </Pressable>

          <Pressable
            style={[styles.primaryBtn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>Continue</Text>
            )}
          </Pressable>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <Pressable
            style={[styles.googleBtn, googleLoading && styles.btnDisabled]}
            onPress={handleGoogle}
            disabled={googleLoading}
          >
            {googleLoading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <>
                <Text style={styles.googleG}>G</Text>
                <Text style={styles.googleText}>Continue with Google</Text>
              </>
            )}
          </Pressable>

          <View style={styles.bottomRow}>
            <Text style={styles.bottomText}>New to Dynamo? </Text>
            <Pressable onPress={() => router.replace("/signup")}>
              <Text style={styles.bottomLink}>Sign up</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    padding: 28,
    paddingTop: 20,
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  closeBtn: {
    alignSelf: "flex-end",
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnText: {
    fontSize: 24,
    color: "#999",
    lineHeight: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "900" as const,
    color: "#000",
    marginBottom: 4,
    marginTop: 4,
  },
  errorBox: {
    width: "100%",
    backgroundColor: "#fee2e2",
    borderRadius: 8,
    padding: 10,
  },
  errorText: {
    fontSize: 13,
    color: "#ef4444",
    textAlign: "center",
  },
  input: {
    width: "100%",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    fontSize: 15,
    color: "#000",
    backgroundColor: "#fff",
  },
  forgotRow: {
    width: "100%",
    alignItems: "flex-end",
  },
  forgotText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "600" as const,
  },
  primaryBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#000",
    alignItems: "center",
    marginTop: 4,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700" as const,
  },
  dividerRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e0e0e0",
  },
  dividerText: {
    fontSize: 12,
    color: "#999",
    fontWeight: "500" as const,
  },
  googleBtn: {
    width: "100%",
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  googleG: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#000",
  },
  googleText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#000",
  },
  bottomRow: {
    flexDirection: "row",
    marginTop: 6,
  },
  bottomText: {
    fontSize: 13,
    color: "#666",
  },
  bottomLink: {
    fontSize: 13,
    color: "#000",
    fontWeight: "700" as const,
  },
});
