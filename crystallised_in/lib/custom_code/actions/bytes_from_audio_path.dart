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

// Set your action name, define your arguments and return parameter,
// and then add the boilerplate code using the green button on the right!

import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:dio/dio.dart';

Future<FFUploadedFile> bytesFromAudioPath(String? audioPath) async {
  if (audioPath == null) {
    throw Exception("Audio path is null");
  }

  try {
    Uint8List bytes;
    String fileName;

    if (kIsWeb) {
      // If the platform is web, use Dio to fetch the bytes
      final response = await Dio().get<List<int>>(
        audioPath,
        options: Options(responseType: ResponseType.bytes),
      );
      bytes = Uint8List.fromList(response.data ?? []);
      fileName = 'recording.webm';
    } else {
      // For Android or iOS, use dart:io to read the file as bytes
      final file = File(audioPath);
      bytes = await file.readAsBytes();
      fileName = file.uri.pathSegments.last;
    }

    final uploadedFile = FFUploadedFile(
      name: fileName,
      bytes: bytes,
      height: null,
      width: null,
      blurHash: null,
    );

    return uploadedFile;
  } catch (e) {
    print("Error handling audio file: $e");
    throw Exception("Failed to handle audio file: $e");
  }
}
// Set your action name, define your arguments and return parameter,
// and then add the boilerplate code using the green button on the right!
