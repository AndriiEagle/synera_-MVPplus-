// ignore_for_file: unnecessary_getters_setters

import 'package:cloud_firestore/cloud_firestore.dart';

import '/backend/schema/util/firestore_util.dart';

import '/flutter_flow/flutter_flow_util.dart';

class ValuesStruct extends FFFirebaseStruct {
  ValuesStruct({
    String? stringRepresentation,
    String? sphereOfLife,
    String? improvedRepresentation,
    String? whyRepresentation,
    String? sphereOfLifeExplanation,
    String? translatedText,
    FirestoreUtilData firestoreUtilData = const FirestoreUtilData(),
  })  : _stringRepresentation = stringRepresentation,
        _sphereOfLife = sphereOfLife,
        _improvedRepresentation = improvedRepresentation,
        _whyRepresentation = whyRepresentation,
        _sphereOfLifeExplanation = sphereOfLifeExplanation,
        _translatedText = translatedText,
        super(firestoreUtilData);

  // "string_representation" field.
  String? _stringRepresentation;
  String get stringRepresentation => _stringRepresentation ?? '';
  set stringRepresentation(String? val) => _stringRepresentation = val;

  bool hasStringRepresentation() => _stringRepresentation != null;

  // "sphere_of_life" field.
  String? _sphereOfLife;
  String get sphereOfLife => _sphereOfLife ?? '';
  set sphereOfLife(String? val) => _sphereOfLife = val;

  bool hasSphereOfLife() => _sphereOfLife != null;

  // "improved_representation" field.
  String? _improvedRepresentation;
  String get improvedRepresentation => _improvedRepresentation ?? '';
  set improvedRepresentation(String? val) => _improvedRepresentation = val;

  bool hasImprovedRepresentation() => _improvedRepresentation != null;

  // "why_representation" field.
  String? _whyRepresentation;
  String get whyRepresentation => _whyRepresentation ?? '';
  set whyRepresentation(String? val) => _whyRepresentation = val;

  bool hasWhyRepresentation() => _whyRepresentation != null;

  // "sphere_of_lifeExplanation" field.
  String? _sphereOfLifeExplanation;
  String get sphereOfLifeExplanation => _sphereOfLifeExplanation ?? '';
  set sphereOfLifeExplanation(String? val) => _sphereOfLifeExplanation = val;

  bool hasSphereOfLifeExplanation() => _sphereOfLifeExplanation != null;

  // "translated_text" field.
  String? _translatedText;
  String get translatedText => _translatedText ?? '';
  set translatedText(String? val) => _translatedText = val;

  bool hasTranslatedText() => _translatedText != null;

  static ValuesStruct fromMap(Map<String, dynamic> data) => ValuesStruct(
        stringRepresentation: data['string_representation'] as String?,
        sphereOfLife: data['sphere_of_life'] as String?,
        improvedRepresentation: data['improved_representation'] as String?,
        whyRepresentation: data['why_representation'] as String?,
        sphereOfLifeExplanation: data['sphere_of_lifeExplanation'] as String?,
        translatedText: data['translated_text'] as String?,
      );

  static ValuesStruct? maybeFromMap(dynamic data) =>
      data is Map ? ValuesStruct.fromMap(data.cast<String, dynamic>()) : null;

  Map<String, dynamic> toMap() => {
        'string_representation': _stringRepresentation,
        'sphere_of_life': _sphereOfLife,
        'improved_representation': _improvedRepresentation,
        'why_representation': _whyRepresentation,
        'sphere_of_lifeExplanation': _sphereOfLifeExplanation,
        'translated_text': _translatedText,
      }.withoutNulls;

  @override
  Map<String, dynamic> toSerializableMap() => {
        'string_representation': serializeParam(
          _stringRepresentation,
          ParamType.String,
        ),
        'sphere_of_life': serializeParam(
          _sphereOfLife,
          ParamType.String,
        ),
        'improved_representation': serializeParam(
          _improvedRepresentation,
          ParamType.String,
        ),
        'why_representation': serializeParam(
          _whyRepresentation,
          ParamType.String,
        ),
        'sphere_of_lifeExplanation': serializeParam(
          _sphereOfLifeExplanation,
          ParamType.String,
        ),
        'translated_text': serializeParam(
          _translatedText,
          ParamType.String,
        ),
      }.withoutNulls;

  static ValuesStruct fromSerializableMap(Map<String, dynamic> data) =>
      ValuesStruct(
        stringRepresentation: deserializeParam(
          data['string_representation'],
          ParamType.String,
          false,
        ),
        sphereOfLife: deserializeParam(
          data['sphere_of_life'],
          ParamType.String,
          false,
        ),
        improvedRepresentation: deserializeParam(
          data['improved_representation'],
          ParamType.String,
          false,
        ),
        whyRepresentation: deserializeParam(
          data['why_representation'],
          ParamType.String,
          false,
        ),
        sphereOfLifeExplanation: deserializeParam(
          data['sphere_of_lifeExplanation'],
          ParamType.String,
          false,
        ),
        translatedText: deserializeParam(
          data['translated_text'],
          ParamType.String,
          false,
        ),
      );

  @override
  String toString() => 'ValuesStruct(${toMap()})';

  @override
  bool operator ==(Object other) {
    return other is ValuesStruct &&
        stringRepresentation == other.stringRepresentation &&
        sphereOfLife == other.sphereOfLife &&
        improvedRepresentation == other.improvedRepresentation &&
        whyRepresentation == other.whyRepresentation &&
        sphereOfLifeExplanation == other.sphereOfLifeExplanation &&
        translatedText == other.translatedText;
  }

  @override
  int get hashCode => const ListEquality().hash([
        stringRepresentation,
        sphereOfLife,
        improvedRepresentation,
        whyRepresentation,
        sphereOfLifeExplanation,
        translatedText
      ]);
}

ValuesStruct createValuesStruct({
  String? stringRepresentation,
  String? sphereOfLife,
  String? improvedRepresentation,
  String? whyRepresentation,
  String? sphereOfLifeExplanation,
  String? translatedText,
  Map<String, dynamic> fieldValues = const {},
  bool clearUnsetFields = true,
  bool create = false,
  bool delete = false,
}) =>
    ValuesStruct(
      stringRepresentation: stringRepresentation,
      sphereOfLife: sphereOfLife,
      improvedRepresentation: improvedRepresentation,
      whyRepresentation: whyRepresentation,
      sphereOfLifeExplanation: sphereOfLifeExplanation,
      translatedText: translatedText,
      firestoreUtilData: FirestoreUtilData(
        clearUnsetFields: clearUnsetFields,
        create: create,
        delete: delete,
        fieldValues: fieldValues,
      ),
    );

ValuesStruct? updateValuesStruct(
  ValuesStruct? values, {
  bool clearUnsetFields = true,
  bool create = false,
}) =>
    values
      ?..firestoreUtilData = FirestoreUtilData(
        clearUnsetFields: clearUnsetFields,
        create: create,
      );

void addValuesStructData(
  Map<String, dynamic> firestoreData,
  ValuesStruct? values,
  String fieldName, [
  bool forFieldValue = false,
]) {
  firestoreData.remove(fieldName);
  if (values == null) {
    return;
  }
  if (values.firestoreUtilData.delete) {
    firestoreData[fieldName] = FieldValue.delete();
    return;
  }
  final clearFields =
      !forFieldValue && values.firestoreUtilData.clearUnsetFields;
  if (clearFields) {
    firestoreData[fieldName] = <String, dynamic>{};
  }
  final valuesData = getValuesFirestoreData(values, forFieldValue);
  final nestedData = valuesData.map((k, v) => MapEntry('$fieldName.$k', v));

  final mergeFields = values.firestoreUtilData.create || clearFields;
  firestoreData
      .addAll(mergeFields ? mergeNestedFields(nestedData) : nestedData);
}

Map<String, dynamic> getValuesFirestoreData(
  ValuesStruct? values, [
  bool forFieldValue = false,
]) {
  if (values == null) {
    return {};
  }
  final firestoreData = mapToFirestore(values.toMap());

  // Add any Firestore field values
  values.firestoreUtilData.fieldValues.forEach((k, v) => firestoreData[k] = v);

  return forFieldValue ? mergeNestedFields(firestoreData) : firestoreData;
}

List<Map<String, dynamic>> getValuesListFirestoreData(
  List<ValuesStruct>? valuess,
) =>
    valuess?.map((e) => getValuesFirestoreData(e, true)).toList() ?? [];
