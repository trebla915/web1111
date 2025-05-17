import * as Updates from "expo-updates";
import { useEffect } from "react";

export default function RootLayout() {
  useEffect(() => {
    async function checkForUpdate() {
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      } catch (e) {
        // Optionally handle update errors
        console.log("Update check failed", e);
      }
    }
    checkForUpdate();
  }, []);
} 