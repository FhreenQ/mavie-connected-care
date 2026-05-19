import { useLocalSearchParams, useRouter } from "expo-router";
import AiMedicineScannerScreen from "../../../components/medicine-scanner/AiMedicineScannerScreen";

export default function AiMedicineScannerRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const navigation = {
    navigate(name: string) {
      if (name === "Medication") {
        router.replace({
          pathname: "/patient/[id]",
          params: { id: String(id) },
        });
      }

      if (name === "AddMedicine") {
        router.push({
          pathname: "/patient/[id]/add-medicine",
          params: { id: String(id) },
        });
      }

      if (name === "ManualMedicineInput") {
        router.push({
          pathname: "/patient/[id]/manual-medicine-input",
          params: { id: String(id) },
        });
      }
    },

    goBack() {
      router.back();
    },
  };

  return <AiMedicineScannerScreen navigation={navigation} />;
}