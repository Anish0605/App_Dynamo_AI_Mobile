import { useRouter } from "expo-router";
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  Platform,
  Linking,
  AppState,
  AppStateStatus,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/contexts/AuthContext";
import { api, UserInfo } from "@/lib/api";

const plans = [
  {
    id: "free",
    name: "Free",
    price: "Free",
    features: [
      "50 messages/month",
      "10 image generations",
      "5 web searches",
    ],
    cta: "Current Plan",
  },
  {
    id: "plus",
    name: "Plus",
    price: "₹199/mo",
    features: [
      "500 messages/month",
      "50 image generations",
      "Unlimited searches",
      "All AI models",
    ],
    cta: "Upgrade",
  },
  {
    id: "pro",
    name: "Pro",
    price: "₹499/mo",
    features: [
      "Unlimited messages",
      "Unlimited generations",
      "Priority processing",
      "API access",
    ],
    cta: "Upgrade",
  },
];

export default function PricingScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [upgrading, setUpgrading] = useState<string | null>(null);

  const pendingOrderRef = useRef<{
    orderId: string;
    plan: string;
  } | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const { data: userInfo } = useQuery<UserInfo | null>({
    queryKey: ["userInfo", user?.uid],
    queryFn: () => api.getUser(user!.uid, user?.email ?? undefined, user?.displayName ?? undefined),
    enabled: !!user,
    staleTime: 30000,
  });

  const currentPlan = userInfo?.plan ?? "free";

  useEffect(() => {
    const appStateSub = AppState.addEventListener("change", handleAppStateChange);

    const linkingSub = Linking.addEventListener("url", ({ url }) => {
      handleDeepLink(url);
    });

    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });

    return () => {
      appStateSub.remove();
      linkingSub.remove();
    };
  }, []);

  async function handleDeepLink(url: string) {
    if (!url || !pendingOrderRef.current || !user) return;
    try {
      const parsed = new URL(url);
      const paymentId = parsed.searchParams.get("payment_id") ?? parsed.searchParams.get("razorpay_payment_id") ?? "";
      const signature = parsed.searchParams.get("signature") ?? parsed.searchParams.get("razorpay_signature") ?? "";
      const orderId = parsed.searchParams.get("order_id") ?? parsed.searchParams.get("razorpay_order_id") ?? pendingOrderRef.current.orderId;

      if (paymentId) {
        const plan = pendingOrderRef.current?.plan ?? "";
        pendingOrderRef.current = null;
        setUpgrading(null);
        const ok = await api.verifyPayment(user.uid, orderId, paymentId, signature, plan);
        if (ok) {
          await qc.invalidateQueries({ queryKey: ["userInfo"] });
          Alert.alert("Success", "Your plan has been upgraded!");
        } else {
          qc.invalidateQueries({ queryKey: ["userInfo"] });
          Alert.alert("Payment Pending", "Your payment is being processed. Your plan will update shortly.");
        }
      }
    } catch {}
  }

  async function handleAppStateChange(nextState: AppStateStatus) {
    if (
      appStateRef.current.match(/inactive|background/) &&
      nextState === "active" &&
      pendingOrderRef.current !== null &&
      user
    ) {
      const { orderId } = pendingOrderRef.current;
      pendingOrderRef.current = null;
      setUpgrading(null);

      Alert.alert(
        "Verify Payment",
        "Did you complete the payment?",
        [
          { text: "No", style: "cancel" },
          {
            text: "Yes, Verify",
            onPress: async () => {
              const ok = await api.verifyPayment(user.uid, orderId, "", "", pendingOrderRef.current?.plan ?? "");
              if (ok) {
                await qc.invalidateQueries({ queryKey: ["userInfo"] });
                Alert.alert("Success", "Your plan has been upgraded!");
              } else {
                qc.invalidateQueries({ queryKey: ["userInfo"] });
                Alert.alert(
                  "Payment Pending",
                  "Your payment is processing. Your plan will update automatically once confirmed.",
                );
              }
            },
          },
        ],
      );
    }
    appStateRef.current = nextState;
  }

  async function handleUpgrade(planId: string) {
    if (planId === "free" || planId === currentPlan) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setUpgrading(planId);
    try {
      const order = await api.createOrder(user!.uid, planId as "plus" | "pro");
      if (!order) {
        Alert.alert("Error", "Could not initiate payment. Please try again.");
        setUpgrading(null);
        return;
      }

      pendingOrderRef.current = { orderId: order.order_id, plan: planId };

      const razorpayKeyId = process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || "";
      const payUrl = `https://checkout.razorpay.com/?key_id=${encodeURIComponent(razorpayKeyId)}&order_id=${encodeURIComponent(order.order_id)}&prefill[email]=${encodeURIComponent(user!.email ?? "")}&prefill[contact]=${encodeURIComponent(user!.phoneNumber ?? "")}&redirect_url=dynamo-mobile://payment-complete?order_id=${encodeURIComponent(order.order_id)}`;
      await Linking.openURL(payUrl);
    } catch {
      Alert.alert("Error", "Payment initiation failed. Please try again.");
      setUpgrading(null);
    }
  }

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, Platform.OS === "web" ? 67 : 0) }]}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Pricing</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom + 20, 40) }]}
        showsVerticalScrollIndicator={false}
      >
        {plans.map((plan) => {
          const isCurrent = plan.id === currentPlan;
          return (
            <View
              key={plan.id}
              style={[styles.planCard, isCurrent && styles.planCardActive]}
            >
              <View style={styles.planHeader}>
                <Text style={styles.planName}>{plan.name}</Text>
                <Text style={styles.planPrice}>{plan.price}</Text>
              </View>

              <View style={styles.features}>
                {plan.features.map((feat) => (
                  <View key={feat} style={styles.featureRow}>
                    <Text style={styles.checkmark}>✓</Text>
                    <Text style={styles.featureText}>{feat}</Text>
                  </View>
                ))}
              </View>

              <Pressable
                style={[
                  styles.ctaBtn,
                  isCurrent && styles.ctaBtnCurrent,
                  !isCurrent && plan.id !== "free" && styles.ctaBtnUpgrade,
                  upgrading === plan.id && { opacity: 0.6 },
                ]}
                onPress={() => !isCurrent && handleUpgrade(plan.id)}
                disabled={isCurrent || upgrading !== null}
              >
                {upgrading === plan.id ? (
                  <ActivityIndicator color="#000" size="small" />
                ) : (
                  <Text style={[styles.ctaBtnText, isCurrent && styles.ctaBtnTextCurrent]}>
                    {isCurrent ? "Current Plan" : plan.cta}
                  </Text>
                )}
              </Pressable>
            </View>
          );
        })}

        <Text style={styles.disclaimer}>
          Payments are processed securely via Razorpay. Cancel anytime from your account settings.
        </Text>
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
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#000",
  },
  content: {
    padding: 16,
  },
  planCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    marginBottom: 12,
  },
  planCardActive: {
    backgroundColor: "#f8f8f8",
    borderWidth: 2,
    borderColor: "#ffdb00",
  },
  planHeader: {
    marginBottom: 12,
  },
  planName: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#000",
  },
  planPrice: {
    fontSize: 20,
    fontWeight: "900" as const,
    color: "#000",
    marginTop: 4,
  },
  features: {
    marginBottom: 12,
    gap: 6,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checkmark: {
    color: "#22c55e",
    fontSize: 14,
    fontWeight: "700" as const,
  },
  featureText: {
    fontSize: 13,
    color: "#666",
  },
  ctaBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  ctaBtnCurrent: {
    backgroundColor: "#f8f8f8",
    borderColor: "#e0e0e0",
  },
  ctaBtnUpgrade: {
    backgroundColor: "#ffdb00",
    borderWidth: 0,
  },
  ctaBtnText: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: "#000",
  },
  ctaBtnTextCurrent: {
    color: "#666",
  },
  disclaimer: {
    fontSize: 11,
    color: "#999",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 16,
  },
});
