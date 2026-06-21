import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";

type NurseTab = "home" | "emergency-log" | "nurse-information";

type NurseBottomNavigationProps = {
  activeTab: NurseTab;
};

const tabs: { key: NurseTab; label: string; icon: string; route: string }[] = [
  { key: "home", label: "Home", icon: "🏠", route: "/nurse-dashboard" },
  { key: "emergency-log", label: "Emergency Log", icon: "🚨", route: "/emergency-log" },
  { key: "nurse-information", label: "Nurse Info", icon: "👩‍⚕️", route: "/nurse-information" },
];

export default function NurseBottomNavigation({ activeTab }: NurseBottomNavigationProps) {
  return (
    <View style={styles.bottomNav} accessibilityRole="tablist">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={tab.label}
            style={styles.navItem}
            onPress={() => {
              if (!isActive) router.replace(tab.route as never);
            }}
          >
            <Text style={styles.navIcon}>{tab.icon}</Text>
            <Text numberOfLines={1} style={[styles.navText, isActive && styles.navTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
  },
  navIcon: {
    fontSize: 20,
  },
  navText: {
    fontSize: 10,
    color: "#9CA3AF",
    marginTop: 3,
    fontWeight: "700",
  },
  navTextActive: {
    color: "#0F766E",
  },
});
