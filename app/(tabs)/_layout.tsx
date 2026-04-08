import { Tabs, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { View, Text, Pressable, StyleSheet, Platform, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";

function CustomTabBar({ state, descriptors, navigation }: {
  state: { index: number; routes: { key: string; name: string }[] };
  descriptors: Record<string, { options: { title?: string } }>;
  navigation: { emit: (e: { type: string; target?: string; canPreventDefault?: boolean }) => { defaultPrevented: boolean }; navigate: (name: string) => void };
}) {
  const insets = useSafeAreaInsets();

  const tabLabels: Record<string, string> = {
    chats: "Chat",
    index: "Home",
    profile: "Profile",
  };

  return (
    <View style={[
      styles.tabBar,
      {
        paddingBottom: Platform.OS === "web" ? 34 : Math.max(insets.bottom, 8),
        height: Platform.OS === "web" ? 84 : Math.max(insets.bottom, 8) + 52,
      },
    ]}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const label = tabLabels[route.name] ?? route.name;

        function onPress() {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        }

        return (
          <Pressable key={route.key} style={styles.tab} onPress={onPress}>
            <Text style={[
              styles.tabLabel,
              {
                color: isFocused ? "#000" : "#999",
                fontWeight: isFocused ? "700" : "500",
                backgroundColor: isFocused ? "#ffdb00" : "transparent",
                paddingHorizontal: isFocused ? 14 : 6,
                paddingVertical: 3,
                borderRadius: 8,
              },
            ]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/");
    }
  }, [user, loading]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#ffdb00" size="large" />
      </View>
    );
  }

  if (!user) return null;

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...(props as Parameters<typeof CustomTabBar>[0])} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="chats" />
      <Tabs.Screen name="index" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 10,
  },
  tabLabel: {
    fontSize: 12,
    overflow: "hidden",
  },
});
