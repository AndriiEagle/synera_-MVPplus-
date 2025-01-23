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

Future<List<NoteStruct>> extractNotesFromJson(String notesJSON) async {
  List<NoteStruct> notes = [];
  try {
    // Remove all the literal newline characters and extra spaces if they are present
    String jsonString = notesJSON.replaceAll(r'\n', '').replaceAll(r'\', '');

    final decoded = jsonDecode(jsonString);

    // Assuming the JSON structure has a 'notes' key containing an array of note objects
    if (decoded['notes'] is List) {
      for (var noteData in decoded['notes']) {
        // Create a map with all the fields from the JSON data
        Map<String, dynamic> noteMap = {
          'text_value': noteData['text_value'] ?? '',
          'sphere_of_life': noteData['sphere_of_life'] ?? '',
          'participants': List<String>.from(noteData['participants'] ?? []),
          'location': noteData['location'] ?? '',
          'description': noteData['description'] ?? '',
          'key_points': List<String>.from(noteData['key_points'] ?? []),
          'actions': List<String>.from(noteData['actions'] ?? []),
          'related_notes': List<String>.from(noteData['related_notes'] ?? []),
          'notes': noteData['notes'] ?? '',
          'files_links': List<String>.from(noteData['files_links'] ?? []),
        };

        // Use the fromMap method to create a NoteStruct and add it to the list
        notes.add(NoteStruct.fromMap(noteMap));
      }
    }
  } catch (e) {
    print('Error parsing JSON: $e');
  }

  return notes;
}
