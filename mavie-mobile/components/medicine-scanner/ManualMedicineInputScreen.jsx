import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { saveUserMedication } from "./medicineApi";

const frequencyOptions = ["once daily", "twice daily", "three times daily", "once weekly", "as written on prescription"];
const mealTimingOptions = ["before meal", "after meal", "with meal", "with food", "no specific timing", "as written on prescription"];

export default function ManualMedicineInputScreen({ navigation }) {
  const [form, setForm] = useState({
    medicineName: "",
    strength: "",
    frequency: "",
    mealTiming: "",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: "",
    notes: ""
  });
  const [confirmed, setConfirmed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    const validationError = validateForm(form, confirmed);

    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);
    setError("");

  try {
   Alert.alert("Manual screen test", "handleSave is running");

   const savedResult = await saveUserMedication({
    medicationName: form.medicineName.trim(),
    genericName: form.medicineName.trim(),
    dosageStrength: form.strength.trim(),
    frequency: form.frequency,
    mealTiming: form.mealTiming,
    instruction: "",
    notes: form.notes.trim(),
    startDate: form.startDate.trim(),
    endDate: form.endDate.trim() || null,
    source: "MANUAL",
    confirmedByUser: true
  });

  Alert.alert(
    "Saved result",
    JSON.stringify(savedResult, null, 2).slice(0, 900)
  );
      navigation.navigate("Medication");
    } catch (error) {
      console.log("Manual save error:", error);
      Alert.alert("Save error", error.message || String(error));
      setError(
	error.message ||
		"Could not save this medicine. Please check the backend connection and try again."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Pressable onPress={() => navigation.goBack()} accessibilityRole="button">
        <Text style={styles.backText}>Back</Text>
      </Pressable>

      <Text style={styles.title}>Input Medicine</Text>
      <Text style={styles.subtitle}>
        Enter medicine details manually after checking the prescription or medicine label.
      </Text>

      <View style={styles.card}>
        <Input label="Medicine name" value={form.medicineName} onChangeText={(value) => setFormValue(setForm, "medicineName", value)} />
        <Input label="Strength" value={form.strength} onChangeText={(value) => setFormValue(setForm, "strength", value)} placeholder="Example: 500mg" />
        <OptionGroup label="Frequency" value={form.frequency} options={frequencyOptions} onChange={(value) => setFormValue(setForm, "frequency", value)} />
        <OptionGroup label="Meal timing" value={form.mealTiming} options={mealTimingOptions} onChange={(value) => setFormValue(setForm, "mealTiming", value)} />
        <Input label="Start date" value={form.startDate} onChangeText={(value) => setFormValue(setForm, "startDate", value)} placeholder="YYYY-MM-DD" />
        <Input label="End date optional" value={form.endDate} onChangeText={(value) => setFormValue(setForm, "endDate", value)} placeholder="YYYY-MM-DD" />
        <Input label="Notes optional" value={form.notes} onChangeText={(value) => setFormValue(setForm, "notes", value)} multiline />

        <Pressable style={styles.confirmRow} onPress={() => setConfirmed((value) => !value)}>
          <View style={[styles.checkbox, confirmed && styles.checkboxChecked]} />
          <Text style={styles.confirmText}>
            I have manually confirmed the medicine name, dosage strength, frequency, meal timing, and start date.
          </Text>
        </Pressable>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Pressable style={styles.primaryButton} onPress={handleSave} disabled={isSaving}>
          {isSaving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Confirm and Add to Schedule</Text>}
        </Pressable>
      </View>

      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerTitle}>Medical safety reminder</Text>
        <Text style={styles.disclaimerText}>
          MaVie does not replace medical advice. Confirm medicine information with a prescription, doctor, pharmacist, nurse, or caregiver before saving.
        </Text>
      </View>
    </ScrollView>
  );
}

function Input({ label, value, onChangeText, placeholder, multiline = false }) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.textArea]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9AA2AF"
        multiline={multiline}
      />
    </View>
  );
}

function OptionGroup({ label, value, options, onChange }) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.optionWrap}>
        {options.map((option) => (
          <Pressable
            key={option}
            style={[styles.optionPill, value === option && styles.optionPillActive]}
            onPress={() => onChange(option)}
          >
            <Text style={[styles.optionText, value === option && styles.optionTextActive]}>{option}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function setFormValue(setForm, key, value) {
  setForm((current) => ({ ...current, [key]: value }));
}

function validateForm(form, confirmed) {
  if (!form.medicineName.trim()) return "Please enter the medicine name.";
  if (!form.strength.trim()) return "Please enter the dosage strength.";
  if (!form.frequency) return "Please select the frequency.";
  if (!form.mealTiming) return "Please select the meal timing.";
  if (!form.startDate.trim()) return "Please enter the start date.";
  if (!confirmed) return "Please tick the confirmation checkbox before saving.";
  return "";
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F4F8FC"
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 64,
    paddingBottom: 44
  },
  backText: {
    color: "#0A8B7B",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 18
  },
  title: {
    color: "#071326",
    fontSize: 32,
    fontWeight: "900"
  },
  subtitle: {
    color: "#68707D",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
    marginBottom: 16
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 18,
    shadowColor: "#203040",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3
  },
  inputGroup: {
    marginBottom: 13
  },
  label: {
    color: "#071326",
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 7
  },
  input: {
    backgroundColor: "#F7FAFD",
    borderColor: "#E3EAF2",
    borderWidth: 1,
    borderRadius: 14,
    minHeight: 48,
    paddingHorizontal: 14,
    color: "#071326",
    fontSize: 15
  },
  textArea: {
    minHeight: 88,
    paddingTop: 12,
    textAlignVertical: "top"
  },
  optionWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  optionPill: {
    borderColor: "#DCE5EE",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: "#FFFFFF"
  },
  optionPillActive: {
    borderColor: "#0A8B7B",
    backgroundColor: "#E9FFFA"
  },
  optionText: {
    color: "#66707D",
    fontSize: 13,
    fontWeight: "700"
  },
  optionTextActive: {
    color: "#08756F"
  },
  confirmRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    marginTop: 4
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#0A8B7B",
    marginTop: 2
  },
  checkboxChecked: {
    backgroundColor: "#0A8B7B"
  },
  confirmText: {
    flex: 1,
    color: "#323B49",
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "700"
  },
  errorText: {
    color: "#B42318",
    fontSize: 14,
    fontWeight: "800",
    marginTop: 12
  },
  primaryButton: {
    backgroundColor: "#0A8B7B",
    borderRadius: 16,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900"
  },
  disclaimer: {
    backgroundColor: "#FFF4D9",
    borderRadius: 18,
    padding: 15,
    marginTop: 16
  },
  disclaimerTitle: {
    color: "#725000",
    fontSize: 15,
    fontWeight: "900"
  },
  disclaimerText: {
    color: "#725000",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5
  }
});
