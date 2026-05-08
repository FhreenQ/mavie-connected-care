import { useRouter } from "expo-router";
import ManualMedicineInputScreen from "../components/medicine-scanner/ManualMedicineInputScreen";

export default function ManualMedicineInputRoute() {
  const router = useRouter();

  const navigation = {
    navigate(name: string) {
      if (name === "Medication") {
        router.replace("/" as any);
      }

      if (name === "AddMedicine") {
        router.push("/add-medicine" as any);
      }

      if (name === "AiMedicineScanner") {
        router.push("/ai-medicine-scanner" as any);
      }
    },

    goBack() {
      router.back();
    },
  };

  return <ManualMedicineInputScreen navigation={navigation} />;
}