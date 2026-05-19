import { useLocalSearchParams, useRouter } from "expo-router";
import ManualMedicineInputScreen from "../../../components/medicine-scanner/ManualMedicineInputScreen";

export default function ManualMedicineInputRoute() {
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

      if (name === "AiMedicineScanner") {
        router.push({
          pathname: "/patient/[id]/ai-medicine-scanner",
          params: { id: String(id) },
        });
      }
    },

    goBack() {
      router.back();
    },
  };

  return <ManualMedicineInputScreen navigation={navigation} />;
}