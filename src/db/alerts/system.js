import { getDatabase, ref, onValue } from "firebase/database";

export function listenToSystemStats(callback) {
  const db = getDatabase();
  const statsRef = ref(db, "system_stats");

  return onValue(statsRef, (snapshot) => {
    const stats = [];
    snapshot.forEach((child) => {
      stats.push(child.val());
    });
    callback(stats);
  });
}
