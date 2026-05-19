import { useLocalSearchParams, useRouter } from "expo-router";
import AddMedicineScreen from "../../../components/medicine-scanner/AddMedicineScreen";

export default function AddMedicineRoute() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const navigation = {
    navigate(name: string) {
      if (name === "AiMedicineScanner") {
        router.push({
          pathname: "/patient/[id]/ai-medicine-scanner",
          params: { id: String(id) },
        });
      }

      if (name === "ManualMedicineInput") {
        router.push({
          pathname: "/patient/[id]/manual-medicine-input",
          params: { id: String(id) },
        });
      }

      if (name === "Medication") {
        router.replace({
          pathname: "/patient/[id]",
          params: { id: String(id) },
        });
      }
    },

    goBack() {
      router.back();
    },
  };

  return <AddMedicineScreen navigation={navigation} />;
}