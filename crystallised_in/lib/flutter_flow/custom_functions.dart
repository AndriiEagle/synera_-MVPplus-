import 'dart:convert';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:timeago/timeago.dart' as timeago;
import 'lat_lng.dart';
import 'place.dart';
import 'uploaded_file.dart';
import '/backend/backend.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '/backend/schema/structs/index.dart';
import '/auth/firebase_auth/auth_util.dart';

dynamic findObjectByLatLng(
  dynamic jsonList,
  LatLng? targetLatLng,
) {
  if (jsonList is! List<dynamic>) {
    return null; // Invalid input type
  }

  for (var jsonObject in jsonList) {
    // Adjust the field names to match the JSON structure with underscores
    var location = jsonObject['location'];
    if (location is! Map<String, dynamic>) {
      continue; // Skip if location is not a Map
    }

    double? latitude = (location['_latitude'] as num?)?.toDouble();
    double? longitude = (location['_longitude'] as num?)?.toDouble();

    if (latitude != null && longitude != null) {
      if (targetLatLng != null &&
          latitude == targetLatLng.latitude &&
          longitude == targetLatLng.longitude) {
        return jsonObject;
      }
    }
  }

  return null; // Object not found or invalid input type
}

List<LatLng>? jsonListToLatlngForMarkers(dynamic jsonList) {
  if (jsonList is List<dynamic>) {
    List<LatLng> latLngList = [];

    for (var jsonObject in jsonList) {
      double? latitude = jsonObject['location']['_latitude']?.toDouble();
      double? longitude = jsonObject['location']['_longitude']?.toDouble();

      if (latitude != null && longitude != null) {
        LatLng latLng = LatLng(latitude, longitude);
        latLngList.add(latLng);
      }
    }

    return latLngList;
  }

  return null; // Invalid input type
}

List<LatLng>? jsonListFilteredbyEducation(
  dynamic jsonList,
  String? filterbySpheres,
) {
  if (jsonList is List<dynamic>) {
    List<LatLng> latLngList = [];

    for (var jsonObject in jsonList) {
      var exchanges = jsonObject['exchanges'] as List<dynamic>?;

      // Проверяем, есть ли в exchanges объект с нужным sphere_of_life.
      if (exchanges != null &&
          exchanges.any((exchange) {
            return exchange['values'].any((value) {
              return value['sphere_of_life'].toString().toLowerCase() ==
                  (filterbySpheres ?? '').toLowerCase();
            });
          })) {
        double? latitude = jsonObject['location']['_latitude']?.toDouble();
        double? longitude = jsonObject['location']['_longitude']?.toDouble();

        if (latitude != null && longitude != null) {
          LatLng latLng = LatLng(latitude, longitude);
          latLngList.add(latLng);
        }
      }
    }

    return latLngList;
  }

  return null; // Invalid input type
}

List<LatLng>? jsonListFilteredByGiveTake(
  dynamic jsonList,
  List<String>? giveSpheres,
  List<String>? takeSpheres,
) {
  if (jsonList is List<dynamic>) {
    List<LatLng> latLngList = [];

    for (var jsonObject in jsonList) {
      var exchanges = jsonObject['exchanges'] as List<dynamic>?;

      if (exchanges != null) {
        var gives =
            exchanges.where((e) => e['exchange_type'] == 'take').toList();
        var takes =
            exchanges.where((e) => e['exchange_type'] == 'give').toList();

        bool hasGive = giveSpheres == null ||
            giveSpheres.isEmpty ||
            gives.any((give) => give['values'].any((value) =>
                giveSpheres.contains(value['sphere_of_life'].toString())));

        bool hasTake = takeSpheres == null ||
            takeSpheres.isEmpty ||
            takes.any((take) => take['values'].any((value) =>
                takeSpheres.contains(value['sphere_of_life'].toString())));

        if (hasGive && hasTake) {
          double? latitude = jsonObject['location']['_latitude']?.toDouble();
          double? longitude = jsonObject['location']['_longitude']?.toDouble();

          if (latitude != null && longitude != null) {
            LatLng latLng = LatLng(latitude, longitude);
            latLngList.add(latLng);
          }
        }
      }
    }

    return latLngList;
  }

  return null;
}

List<String>? jsonListFilteredByUserPhotoUrl(
  dynamic jsonList,
  List<String>? giveSpheres,
  List<String>? takeSpheres,
) {
  if (jsonList is List<dynamic>) {
    List<String> photoUrls = [];

    for (var user in jsonList) {
      var exchanges = user['exchanges'] as List<dynamic>?;
      var photoUrl = user['photoUrl'] as String?;

      if (exchanges != null && photoUrl != null) {
        var gives =
            exchanges.where((e) => e['exchange_type'] == 'give').toList();
        var takes =
            exchanges.where((e) => e['exchange_type'] == 'take').toList();

        bool hasGive = giveSpheres == null ||
            giveSpheres.isEmpty ||
            gives.any((give) => give['values'].any((value) =>
                giveSpheres.contains(value['sphere_of_life'].toString())));

        bool hasTake = takeSpheres == null ||
            takeSpheres.isEmpty ||
            takes.any((take) => take['values'].any((value) =>
                takeSpheres.contains(value['sphere_of_life'].toString())));

        if (hasGive && hasTake) {
          photoUrls.add(photoUrl);
        }
      }
    }

    return photoUrls;
  }

  return null;
}

dynamic listJsonFilteredbyTakeGive(
  dynamic jsonList,
  List<String>? giveSpheres,
  List<String>? takeSpheres,
) {
  List<Map<String, dynamic>> filteredList = [];

  if (jsonList is List<dynamic>) {
    for (var jsonObject in jsonList) {
      var exchanges = jsonObject['exchanges'] as List<dynamic>? ?? [];

      // Обеспечиваем, что exchanges действительно список перед преобразованием
      if (exchanges != null) {
        var gives = exchanges
            .where((e) => e['exchange_type'] == 'give' && e['values'] != null)
            .expand((e) => e['values'])
            .where((value) =>
                giveSpheres?.contains(value['sphere_of_life'].toString()) ??
                false)
            .toList();

        var takes = exchanges
            .where((e) => e['exchange_type'] == 'take' && e['values'] != null)
            .expand((e) => e['values'])
            .where((value) =>
                takeSpheres?.contains(value['sphere_of_life'].toString()) ??
                false)
            .toList();

        if (gives.isNotEmpty &&
            (takeSpheres == null || takeSpheres.isEmpty || takes.isNotEmpty)) {
          filteredList.add({
            'id': jsonObject['id'],
            'displayName': jsonObject['displayName'],
            'photoUrl': jsonObject['photoUrl'],
            'aboutMe': jsonObject['aboutMe'],
            'location': jsonObject['location'],
            'gives': [gives],
            'takes': [takes],
            //'gives': gives.isNotEmpty ? gives : [],
            //'takes': takes.isNotEmpty ? takes : [],
          });
        }
      }
    }
  }

  return filteredList; // Только не ЕНКОДЕ - return jsonEncode(filteredList);
}

String? fromListOfStringsToOneString(List<String>? stringList) {
// Используем метод join из класса List для объединения строк с пробелом между ними.
  return stringList?.join(', ');
}

int getGivesLength(dynamic givesJsonForLengthCalculation) {
// Преобразование JSON в список
  List<dynamic> givesList = givesJsonForLengthCalculation as List<dynamic>;
  // Возвращение длины списка
  return givesList.length;
}

List<int> countSphereOfLife(dynamic json) {
  // Инициализируем счётчики для всех сфер жизни
  int familyCount = 0;
  int intellectCount = 0;
  int emotionsCount = 0;
  int loveCount = 0;
  int financesCount = 0;
  int healthCount = 0;
  int networkingCount = 0;
  int driveChillCount = 0;
  int spiritCount = 0;
  int characterCount = 0;
  //int businessCount = 0;
  int balanceCount = 0;
  int careerCount = 0;

  // Проверяем наличие дневников в JSON
  if (json['diaries'] != null) {
    List<dynamic> diaries = json['diaries'];

    // Проходим по каждому дневнику
    for (var diary in diaries) {
      if (diary['notes'] != null) {
        List<dynamic> notes = diary['notes'];

        // Проходим по каждой заметке в дневнике
        for (var note in notes) {
          String sphere = (note['sphere_of_life'] ?? '').trim().toLowerCase();

          // Проверяем значение 'sphere_of_life' и увеличиваем соответствующий счётчик
          switch (sphere) {
            case 'family':
              familyCount++;
              break;
            case 'intellect':
              intellectCount++;
              break;
            case 'emotions':
              emotionsCount++;
              break;
            case 'love':
              loveCount++;
              break;
            case 'finances':
              financesCount++;
              break;
            case 'health':
              healthCount++;
              break;
            case 'networking':
              networkingCount++;
              break;
            case 'drive&chill':
            case 'drive& chill':
            case 'drive & chill':
              driveChillCount++;
              break;
            case 'spirit':
              spiritCount++;
              break;
            case 'character':
              characterCount++;
              break;
            // case 'business':
            //   businessCount++;
            //   break;
            case 'balance':
              balanceCount++;
              break;
            case 'career':
              careerCount++;
              break;
            default:
              print('Неизвестная сфера жизни: $sphere');
          }
        }
      } else {
        print('Заметки отсутствуют в дневнике.');
      }
    }
  } else {
    print('Дневники отсутствуют в JSON.');
  }

  // Возвращаем результаты
  return [
    familyCount,
    intellectCount,
    emotionsCount,
    loveCount,
    financesCount,
    healthCount,
    networkingCount,
    driveChillCount,
    spiritCount,
    characterCount,
    // businessCount,
    balanceCount,
    careerCount
  ];
}

List<double>? balanceDeviationsProcentage(List<int>? listOfNotes) {
  /// Проверяем, что список не пустой
  if (listOfNotes == null || listOfNotes.isEmpty) {
    print("Список пустой или null");
    return null;
  }

  /// 1. Считаем сумму всех чисел в списке.
  int sum = listOfNotes.fold(0, (acc, val) => acc + val);

  /// 2. Считаем среднее значение, деля сумму на 12 и округляем до 2 знаков.
  double average =
      double.parse((sum / 12).toStringAsFixed(2)); // Округление до 2 знаков

  /// 3. Создаём список для отклонений всех элементов от среднего.
  List<double> deviations = listOfNotes.map((element) {
    /// Округляем результат до 2 знаков после запятой
    double deviation = (element - average) / average;
    return double.parse(deviation.toStringAsFixed(2)); // Округление до 2 знаков
  }).toList();

  /// 4. Возвращаем новый список:
  /// - сумма
  /// - округлённое среднее
  /// - отклонения каждого элемента (в долях)
  return [
    sum.toDouble(), // 1-й элемент: сумма всех чисел
    average, // 2-й элемент: округлённое среднее значение
    ...deviations // Округлённые отклонения для каждого элемента
  ];
}

List<double> removeNegativeSigns(List<double> inputList) {
  // Iterate through the list and remove minus signs from negative values
  return inputList.map((value) => value.abs()).toList();
}

List<double> limitValues(List<double> inputList) {
  // Проходим по каждому элементу списка и если число больше 0.99, то присваиваем 0.99, иначе оставляем как есть
  return inputList.map((value) => value > 0.99 ? 0.99 : value).toList();
}
