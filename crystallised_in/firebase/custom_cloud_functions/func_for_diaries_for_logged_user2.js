const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Инициализируем Firebase Admin, если он еще не был инициализирован
if (admin.apps.length === 0) {
  admin.initializeApp();
}

exports.funcForDiariesForLoggedUser2 = functions.https.onRequest(
  async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, POST");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    if (req.method !== "GET" && req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    try {
      // Ожидаем, что User UID будет передан в теле запроса или как параметр
      const userId = req.body.userId || req.query.userId;

      if (!userId) {
        res.status(400).send("User ID is required");
        return;
      }

      // Получение данных пользователя и его дневников
      const userDoc = await admin
        .firestore()
        .collection("users")
        .doc(userId)
        .get();
      if (!userDoc.exists) {
        res.status(404).send("User not found");
        return;
      }

      const userData = userDoc.data();
      let diariesData = [];

      const diariesSnapshot = await admin
        .firestore()
        .collection("users")
        .doc(userId)
        .collection("diaries")
        .orderBy("created_at", "desc")
        .get();

      if (!diariesSnapshot.empty) {
        diariesData = diariesSnapshot.docs.map((diaryDoc) => {
          const diaryData = diaryDoc.data();
          return {
            created_at: diaryData.created_at.toDate().toISOString(),
            notes: diaryData.notes
              ? diaryData.notes.map((note) => ({
                  actions: note.actions || [],
                  actions_inPlanning: note.actions_inPlanning || [],
                  files_links: note.files_links || [],
                  key_points: note.key_points || [],
                  location: note.location || "",
                  notes: note.notes || "",
                  participants: note.participants || [],
                  related_notes: note.related_notes || [],
                  sphere_of_life:
                    note.sphere_of_life || "No sphere of life provided",
                }))
              : [],
          };
        });
      }

      res.status(200).json({
        id: userDoc.id,
        displayName: userData.display_name,
        photoUrl: userData.photo_url,
        aboutMe: userData.about_me,
        diaries: diariesData,
      });
    } catch (error) {
      console.error("Error fetching user diaries:", error);
      res.status(500).send(error);
    }
  },
);
