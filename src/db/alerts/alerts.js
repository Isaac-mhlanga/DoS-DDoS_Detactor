import { rtdb } from "../../config/Config";
import { ref, onValue } from "firebase/database";

export const subscribeToAlerts = (callback) => {
  try {
    if (!rtdb) {
      console.error("Realtime Database not initialized");
      return () => {};
    }

    const alertsRef = ref(rtdb, "alerts");

    return onValue(
      alertsRef,
      (snapshot) => {
        const data = snapshot.val();
        const parsed = data
          ? Object.entries(data)
              .map(([key, val]) => ({ id: key, ...val }))
              .reverse()
          : [];
        callback(parsed);
      },
      (error) => {
        console.error("Database read failed:", error);
        callback([]);
      }
    );
  } catch (error) {
    console.error("Error in subscribeToAlerts:", error);
    callback([]);
    return () => {};
  }
};
