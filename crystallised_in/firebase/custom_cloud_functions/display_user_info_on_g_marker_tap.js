const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Инициализируем Firebase Admin если он еще не был инициализирован
if (admin.apps.length === 0) {
  admin.initializeApp();
}

exports.displayUserInfoOnGMarkerTap = functions.https.onRequest(
  async (req, res) => {
    // Даем доступ к функции из любого источника
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, POST");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
      // Предварительный ответ на запрос CORS
      res.status(204).send("");
      return;
    }

    // Разрешить методы GET и POST
    if (req.method !== "GET" && req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    try {
      const usersSnapshot = await admin.firestore().collection("users").get();
      const usersDataPromises = usersSnapshot.docs.map(async (userDoc) => {
        const userData = userDoc.data();
        let locationData = {};
        let exchangeData = [];

        if (userData.show_live_location) {
          const locationSnapshot = await admin
            .firestore()
            .collection("users")
            .doc(userDoc.id)
            .collection("locations")
            .orderBy("updated_at", "desc")
            .limit(1)
            .get();

          if (!locationSnapshot.empty) {
            const locationDoc = locationSnapshot.docs[0];
            locationData = locationDoc.data().latitude_longitude;
          }

          try {
            const exchangeSnapshot = await admin
              .firestore()
              .collection("users")
              .doc(userDoc.id)
              .collection("exchanges")
              .orderBy("created_at", "desc")
              .limit(7)
              .get();

            if (!exchangeSnapshot.empty) {
              exchangeData = exchangeSnapshot.docs.map((exchangeDoc) => {
                const exchange = exchangeDoc.data();
                return {
                  ...exchange,
                  created_at: exchange.created_at.toDate().toISOString(), // Пример преобразования timestamp в строку ISO
                };
              });
            }
          } catch (e) {
            console.error(
              `Error fetching exchange data for user ${userDoc.id}:`,
              e,
            );
            // В зависимости от желаемого поведения, можно добавить обработку ошибки
          }
        }

        return {
          id: userDoc.id,
          displayName: userData.display_name,
          photoUrl: userData.photo_url,
          aboutMe: userData.about_me,
          location: locationData,
          exchanges: exchangeData,
        };
      });

      // Дожидаемся выполнения всех обещаний (promises)
      const usersData = await Promise.all(usersDataPromises);
      res.status(200).json({ users: usersData });
    } catch (error) {
      console.error("Error fetching user data:", error);
      res.status(500).send(error);
    }
  },
);
