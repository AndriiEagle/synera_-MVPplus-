import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';

Future initFirebase() async {
  if (kIsWeb) {
    await Firebase.initializeApp(
        options: const FirebaseOptions(
            apiKey: "AIzaSyC6RmieKeI0bSs0wGxhLFJDoMXlezKize4",
            authDomain: "crystalisedin.firebaseapp.com",
            projectId: "crystalisedin",
            storageBucket: "crystalisedin.appspot.com",
            messagingSenderId: "531353109436",
            appId: "1:531353109436:web:f7a1b4f6a12e1219b261b9",
            measurementId: "G-35DFTWH1VM"));
  } else {
    await Firebase.initializeApp();
  }
}
