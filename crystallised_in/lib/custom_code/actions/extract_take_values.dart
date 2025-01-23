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

import 'dart:convert';

Future<List<ValuesStruct>> extractTakeValues(String profileJSON) async {
  List<ValuesStruct> takeValues = [];
  try {
    // Remove all the literal newline characters and extra spaces if they are present
    String jsonString = profileJSON.replaceAll(r'\n', '').replaceAll(r'\', '');

    final decoded = jsonDecode(jsonString);

    if (decoded['values'] != null && decoded['values']['take'] != null) {
      final List<dynamic> takeList = decoded['values']['take'];
      for (var item in takeList) {
        takeValues.add(ValuesStruct.fromMap(item));
      }
    }
  } on FormatException catch (e) {
    print('Error parsing JSON: $e');
  }

  return takeValues;
}
