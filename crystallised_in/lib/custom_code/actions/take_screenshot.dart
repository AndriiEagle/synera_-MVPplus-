// Automatic FlutterFlow imports
import '/backend/backend.dart';
import '/backend/schema/structs/index.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import 'index.dart'; // Imports other custom actions
import '/flutter_flow/custom_functions.dart'; // Imports custom functions
import 'package:flutter/material.dart';
// Begin custom action code
// DO NOT REMOVE OR MODIFY THE CODE ABOVE!

import 'package:screenshot/screenshot.dart';
import 'package:path_provider/path_provider.dart';
import 'dart:io'; // Этот импорт должен быть

Future<String?> takeScreenshot() async {
  ScreenshotController screenshotController = ScreenshotController();
  try {
    final image = await screenshotController.capture();
    if (image == null) return null;

    // Сохранение во временный каталог
    final directory = await getTemporaryDirectory();
    final imagePath = '${directory.path}/screenshot.png';
    final file = File(imagePath);
    await file.writeAsBytes(image);

    return imagePath;
  } catch (e) {
    print(e);
    return null;
  }
}
