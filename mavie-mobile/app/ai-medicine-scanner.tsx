import { useRouter } from "expo-router";
import AiMedicineScannerScreen from "../components/medicine-scanner/AiMedicineScannerScreen";

export default function AiMedicineScannerRoute() {
  const router = useRouter();

  const navigation = {
    navigate(name: string) {
      if (name === "Medication") {
        router.replace("/" as any);
      }

      if (name === "AddMedicine") {
        router.push("/add-medicine" as any);
      }

      if (name === "ManualMedicineInput") {
        router.push("/manual-medicine-input" as any);
      }
    },

    goBack() {
      router.back();
    },
  };

  return <AiMedicineScannerScreen navigation={navigation} />;
}