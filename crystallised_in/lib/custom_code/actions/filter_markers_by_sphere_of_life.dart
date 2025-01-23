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

Future<List<LatLng>?> filterMarkersBySphereOfLife(
  dynamic jsonList,
  String sphereOfLife,
) async {
  List<LatLng> filteredMarkers = [];

  for (var jsonObject in jsonList) {
    var exchanges = jsonObject['exchanges'] as List<dynamic>?;

    // Фильтруем exchanges, ищем нужный sphere_of_life.
    if (exchanges != null &&
        exchanges.any((exchange) => exchange['values'].any((value) =>
            value['sphere_of_life'].toString().toLowerCase() ==
            sphereOfLife.toLowerCase()))) {
      double? latitude = jsonObject['location']['_latitude']?.toDouble();
      double? longitude = jsonObject['location']['_longitude']?.toDouble();

      if (latitude != null && longitude != null) {
        filteredMarkers.add(LatLng(latitude, longitude));
      }
    }
  }

  return filteredMarkers.isNotEmpty ? filteredMarkers : null;
}

// Set your action name, define your arguments and return parameter,
// and then add the boilerplate code using the green button on the right!
