import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function AddMedicineScreen({ navigation }) {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Pressable onPress={() => navigation.goBack()} accessibilityRole="button">
        <Text style={styles.backText}>Back</Text>
      </Pressable>

      <Text style={styles.title}>Add Medicine</Text>
      <Text style={styles.subtitle}>
        Choose how you want to register a medicine in MaVie.
      </Text>

      <Pressable
        style={styles.optionCard}
        onPress={() => navigation.navigate("AiMedicineScanner")}
        accessibilityRole="button"
        accessibilityLabel="Use AI Medicine Scanner"
      >
        <Text style={styles.optionTitle}>AI Medicine Scanner</Text>
        <Text style={styles.optionText}>
          Take or upload a medicine photo. MaVie will suggest medicine information using image recognition and OCR.
        </Text>
      </Pressable>

      <Pressable
        style={styles.optionCard}
        onPress={() => navigation.navigate("ManualMedicineInput")}
        accessibilityRole="button"
        accessibilityLabel="Input medicine manually"
      >
        <Text style={styles.optionTitle}>Input Manually</Text>
        <Text style={styles.optionText}>
          Type the medicine name, strength, schedule, and notes yourself.
        </Text>
      </Pressable>

      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerTitle}>Medical safety reminder</Text>
        <Text style={styles.disclaimerText}>
          MaVie does not replace medical advice. Only save a schedule after confirming the medicine information with a prescription, doctor, pharmacist, nurse, or caregiver.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F4F8FC"
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 64,
    paddingBottom: 36
  },
  backText: {
    color: "#0A8B7B",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 18
  },
  title: {
    color: "#071326",
    fontSize: 34,
    fontWeight: "900"
  },
  subtitle: {
    color: "#68707D",
    fontSize: 16,
    marginTop: 8,
    marginBottom: 22
  },
  optionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#203040",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3
  },
  optionTitle: {
    color: "#071326",
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 8
  },
  optionText: {
    color: "#66707D",
    fontSize: 15,
    lineHeight: 22
  },
  disclaimer: {
    backgroundColor: "#FFF4D9",
    borderRadius: 18,
    padding: 16,
    marginTop: 10
  },
  disclaimerTitle: {
    color: "#725000",
    fontSize: 16,
    fontWeight: "900"
  },
  disclaimerText: {
    color: "#725000",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6
  }
});
