// app/index.tsx

import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { useAuth } from "@/context/AuthContext";

export default function Index() {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#F4F7FB",
        }}
      >
        <ActivityIndicator size="large" color="#0F766E" />
      </View>
    );
  }

  return <Redirect href={token ? "/(tabs)" : "/login"} />;
}
