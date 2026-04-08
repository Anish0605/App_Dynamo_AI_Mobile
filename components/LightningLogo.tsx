import React from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";

interface Props {
  size?: number;
  borderRadius?: number;
}

export function LightningLogo({ size = 40, borderRadius = 10 }: Props) {
  const iconSize = size * 0.55;
  return (
    <View style={[styles.container, { width: size, height: size, borderRadius }]}>
      <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24">
        <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="#000000" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ffdb00",
    alignItems: "center",
    justifyContent: "center",
  },
});
