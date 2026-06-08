import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { saveUserMedication, scanMedicineImageWithBackend } from "./medicineApi";

const frequencyOptions = ["once daily", "twice daily", "three times daily", "once weekly", "as written on prescription"];
const mealTimingOptions = ["before meal", "after meal", "with meal", "with food", "no specific timing", "as written on prescription"];

export default function AiMedicineScannerScreen({ navigation }) {
  const [imageAsset, setImageAsset] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [form, setForm] = useState(createEmptyForm());

  const canShowResults = Boolean(scanResult);

  async function pickImage() {
    setError("");
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.85
    });

    if (!result.canceled) {
      setImageAsset(result.assets[0]);
      setScanResult(null);
      setSuccess("");
    }
  }

  async function takePhoto() {
    setError("");
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      setError("Camera permission is needed to take a medicine photo.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.85
    });

    if (!result.canceled) {
      setImageAsset(result.assets[0]);
      setScanResult(null);
      setSuccess("");
    }
  }

  async function handleScan() {
    if (!imageAsset) {
      setError("Please take or upload a medicine image first.");
      return;
    }

    setIsScanning(true);
    setError("");
    setSuccess("");

    try {
      const result = await scanMedicineImageWithBackend(imageAsset);
      console.log("Backend scan result:", result);

      setScanResult(result);
      setConfirmed(false);
      setForm(createFormFromScan(result));
    } catch (error) {
      console.log("Scan error:", error);
      setError(error.message || "MaVie could not scan this image. Please try another photo or enter the information manually.");
    } finally {
      setIsScanning(false);
    }
  }

  async function handleSave() {
    const validationError = validateForm(form, confirmed);

    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);
    setError("");

    const payload = {
      medicationName: form.medicineName.trim(),
      genericName:
        scanResult?.extractedMedications?.[0]?.genericName ||
        scanResult?.extractedMedications?.[0]?.name ||
        form.medicineName.trim(),
      dosageStrength: form.strength.trim(),
      frequency: form.frequency,
      mealTiming: form.mealTiming,
      instruction: form.instruction.trim(),
      notes: form.notes.trim(),
      startDate: form.startDate.trim(),
      endDate: form.endDate.trim() || null,
      source: "AI_SCAN",
      confirmedByUser: true,
      scanSummary: {
      detectedText: scanResult?.extractedMedications
        ?.map((med) => med.name)
        .join(", ") || "",
      confidenceScore: scanResult?.extractedMedications?.[0]?.confidence || "unknown",
      matchSource: "OPENAI_PRESCRIPTION_SCAN",
      interactionStatus: scanResult?.interactionCheck?.overallStatus || "UNKNOWN",
      interactionCount: scanResult?.interactionCheck?.interactionCount || 0
    }
    };

  try {
    Alert.alert("AI screen test", "handleSave is running");
    console.log("AI handleSave payload:", payload);

    const savedResult = await saveUserMedication(payload);

    Alert.alert(
      "Saved result",
      JSON.stringify(savedResult, null, 2).slice(0, 900)
  );

    setSuccess("Medicine added to schedule.");
    navigation.navigate("Medication");
}   catch (error) {
    console.log("AI save error:", error);
    Alert.alert("Save error", error.message || String(error));
    setError(
      error.message ||
        "Could not save this medicine. Please check the backend connection and try again."
  );
} finally {
  setIsSaving(false);
}
  }

  const topPredictionText = useMemo(() => {
    if (!scanResult?.cnnPredictions?.length) {
      return "No visual prediction yet.";
    }

    const top = scanResult.cnnPredictions[0];
    return `${top.label} - ${Math.round(top.confidence * 100)}%`;
  }, [scanResult]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Pressable onPress={() => navigation.goBack()} accessibilityRole="button">
        <Text style={styles.backText}>Back</Text>
      </Pressable>

      <Text style={styles.title}>AI Medicine Scanner</Text>
      <Text style={styles.subtitle}>
        Take or upload a medicine photo. MaVie will use image recognition and OCR to suggest medicine information.
      </Text>

      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerTitle}>Medical safety disclaimer</Text>
        <Text style={styles.disclaimerText}>
          This feature provides AI-assisted medicine recognition only. It may be incorrect. Always confirm with your prescription, doctor, pharmacist, or caregiver before taking or changing medication.
        </Text>
      </View>

      <View style={styles.uploadCard}>
        {imageAsset?.uri ? (
          <Image source={{ uri: imageAsset.uri }} style={styles.previewImage} />
        ) : (
          <View style={styles.emptyPreview}>
            <Text style={styles.emptyPreviewText}>No medicine photo selected</Text>
          </View>
        )}

        <View style={styles.row}>
          <Pressable style={styles.secondaryButton} onPress={takePhoto}>
            <Text style={styles.secondaryButtonText}>Take Photo</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={pickImage}>
            <Text style={styles.secondaryButtonText}>Upload</Text>
          </Pressable>
        </View>

        <Pressable style={styles.primaryButton} onPress={handleScan} disabled={isScanning}>
          {isScanning ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Scan Medicine</Text>}
        </Pressable>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {success ? <Text style={styles.successText}>{success}</Text> : null}

      {canShowResults ? (
        <>
          <ResultCard title="A. Extracted Medications">
            {scanResult.extractedMedications?.map((med, index) => (
              <Text key={`${med.name}-${index}`} style={styles.infoLine}>
                {index + 1}. {med.name}
                {med.strength ? ` - ${med.strength}` : ""}
                {med.genericName ? ` | Generic: ${med.genericName}` : ""}
              </Text>
            ))}
          </ResultCard>

          <ResultCard title="B. Interaction Check">
            <Text style={styles.infoLine}>
              Status: {scanResult.interactionCheck?.overallStatus}
            </Text>
            <Text style={styles.infoLine}>
              Interaction count: {scanResult.interactionCheck?.interactionCount || 0}
            </Text>

            {scanResult.interactionCheck?.interactions?.length ? (
              scanResult.interactionCheck.interactions.map((item, index) => (
                <View key={`${item.matchedDrug1}-${item.matchedDrug2}-${index}`}>
                  <Text style={styles.warningText}>
                    {index + 1}. {item.matchedDrug1} + {item.matchedDrug2}
                  </Text>
                  <Text style={styles.infoLine}>
                    {item.interactionDescription}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.warningText}>
                No known interaction found in this database. This does not guarantee the combination is safe.
              </Text>
            )}
          </ResultCard>

          <ResultCard title="C. Safety Note">
            <Text style={styles.warningText}>
              {scanResult.safetyNote}
            </Text>
          </ResultCard>

          <ResultCard title="D. Confirmation Form">
            <Input
              label="Medicine name"
              value={form.medicineName}
              onChangeText={(value) => setFormValue(setForm, "medicineName", value)}
            />

            <Input
              label="Strength"
              value={form.strength}
              onChangeText={(value) => setFormValue(setForm, "strength", value)}
            />

            <OptionGroup
              label="Frequency"
              value={form.frequency}
              options={frequencyOptions}
              onChange={(value) => setFormValue(setForm, "frequency", value)}
            />

            <OptionGroup
              label="Meal timing"
              value={form.mealTiming}
              options={mealTimingOptions}
              onChange={(value) => setFormValue(setForm, "mealTiming", value)}
            />

            <Input
              label="Start date"
              value={form.startDate}
              onChangeText={(value) => setFormValue(setForm, "startDate", value)}
              placeholder="YYYY-MM-DD"
            />

            <Input
              label="End date optional"
              value={form.endDate}
              onChangeText={(value) => setFormValue(setForm, "endDate", value)}
              placeholder="YYYY-MM-DD"
            />

            <Input
              label="Instruction text optional"
              value={form.instruction}
              onChangeText={(value) => setFormValue(setForm, "instruction", value)}
              multiline
            />

            <Input
              label="Notes optional"
              value={form.notes}
              onChangeText={(value) => setFormValue(setForm, "notes", value)}
              multiline
            />

            <Pressable
              style={styles.confirmRow}
              onPress={() => setConfirmed((value) => !value)}
            >
              <View style={[styles.checkbox, confirmed && styles.checkboxChecked]} />
              <Text style={styles.confirmText}>
                I have manually confirmed the medicine name, dosage strength, frequency, meal timing, and start date.
              </Text>
            </Pressable>

            <Pressable
              style={styles.primaryButton}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Confirm and Add to Schedule</Text>
              )}
            </Pressable>
          </ResultCard>
        </>
      ) : null}
    </ScrollView>
  );
}

function ResultCard({ title, children }) {
  return (
    <View style={styles.resultCard}>
      <Text style={styles.resultTitle}>{title}</Text>
      {children}
    </View>
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

function createEmptyForm() {
  return {
    medicineName: "",
    strength: "",
    frequency: "",
    mealTiming: "",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: "",
    instruction: "",
    notes: ""
  };
}

function createFormFromScan(result) {
  const firstMedicine = result?.extractedMedications?.[0] || {};

  return {
    medicineName:
      firstMedicine.genericName ||
      firstMedicine.name ||
      firstMedicine.rawName ||
      "",
    strength: firstMedicine.strength || "",
    frequency: normalizeFrequency(firstMedicine.frequency),
    mealTiming: "",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: "",
    instruction: firstMedicine.dosage || "",
    notes: result?.safetyNote || ""
  };
}

function normalizeFrequency(value) {
  if (value === "3 times daily") {
    return "three times daily";
  }

  return value || "";
}

function normalizeMealTiming(value) {
  const map = {
    "before meals": "before meal",
    "after meals": "after meal",
    "with meals": "with meal"
  };

  return map[value] || value || "";
}

function setFormValue(setForm, key, value) {
  setForm((current) => ({ ...current, [key]: value }));
}

function validateForm(form, confirmed) {
  if (!form.medicineName.trim()) return "Please confirm the medicine name.";
  if (!form.strength.trim()) return "Please confirm the dosage strength.";
  if (!form.frequency) return "Please confirm the frequency.";
  if (!form.mealTiming) return "Please confirm the meal timing.";
  if (!form.startDate.trim()) return "Please confirm the start date.";
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
  disclaimer: {
    backgroundColor: "#FFF4D9",
    borderRadius: 18,
    padding: 15,
    marginBottom: 16
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
  },
  uploadCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#203040",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3
  },
  previewImage: {
    width: "100%",
    height: 220,
    borderRadius: 16,
    marginBottom: 14
  },
  emptyPreview: {
    height: 190,
    borderRadius: 16,
    backgroundColor: "#E9FFFA",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14
  },
  emptyPreviewText: {
    color: "#08756F",
    fontSize: 15,
    fontWeight: "700"
  },
  row: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10
  },
  primaryButton: {
    backgroundColor: "#0A8B7B",
    borderRadius: 16,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900"
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: "#E9FFFA",
    borderRadius: 14,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center"
  },
  secondaryButtonText: {
    color: "#08756F",
    fontSize: 15,
    fontWeight: "900"
  },
  errorText: {
    color: "#B42318",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 12
  },
  successText: {
    color: "#087A4F",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 12
  },
  resultCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    shadowColor: "#203040",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3
  },
  resultTitle: {
    color: "#071326",
    fontSize: 19,
    fontWeight: "900",
    marginBottom: 10
  },
  muted: {
    color: "#68707D",
    fontSize: 14,
    lineHeight: 20
  },
  predictionText: {
    color: "#071326",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 7
  },
  ocrText: {
    color: "#071326",
    backgroundColor: "#F4F8FC",
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8
  },
  infoLine: {
    color: "#323B49",
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 8
  },
  warningText: {
    color: "#725000",
    backgroundColor: "#FFF4D9",
    borderRadius: 12,
    padding: 10,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8
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
  }
});
