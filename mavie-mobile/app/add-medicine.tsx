import { useRouter } from "expo-router";
import AddMedicineScreen from "../components/medicine-scanner/AddMedicineScreen";

export default function AddMedicineRoute() {
  const router = useRouter();

  const navigation = {
    navigate(name: string) {
      if (name === "AiMedicineScanner") {
        router.push("/ai-medicine-scanner" as any);
      }

      if (name === "ManualMedicineInput") {
        router.push("/manual-medicine-input" as any);
      }

      if (name === "Medication") {
        router.replace("/" as any);
      }
    },

    goBack() {
      router.back();
    },
  };

  return <AddMedicineScreen navigation={navigation} />;
}