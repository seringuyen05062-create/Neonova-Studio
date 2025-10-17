"use client";
import { Text } from "@react-three/drei";

export default function SimpleTestText() {
  return (
    <Text
      position={[0, 2, -3]}
      fontSize={1}
      color="red"
    >
      TEST TEXT
    </Text>
  );
}