// ignore_for_file: unnecessary_getters_setters

import 'package:cloud_firestore/cloud_firestore.dart';

import '/backend/schema/util/firestore_util.dart';

import '/flutter_flow/flutter_flow_util.dart';

class DocRefStruct extends FFFirebaseStruct {
  DocRefStruct({
    DocumentReference? id,
    FirestoreUtilData firestoreUtilData = const FirestoreUtilData(),
  })  : _id = id,
        super(firestoreUtilData);

  // "id" field.
  DocumentReference? _id;
  DocumentReference? get id => _id;
  set id(DocumentReference? val) => _id = val;

  bool hasId() => _id != null;

  static DocRefStruct fromMap(Map<String, dynamic> data) => DocRefStruct(
        id: data['id'] as DocumentReference?,
      );

  static DocRefStruct? maybeFromMap(dynamic data) =>
      data is Map ? DocRefStruct.fromMap(data.cast<String, dynamic>()) : null;

  Map<String, dynamic> toMap() => {
        'id': _id,
      }.withoutNulls;

  @override
  Map<String, dynamic> toSerializableMap() => {
        'id': serializeParam(
          _id,
          ParamType.DocumentReference,
        ),
      }.withoutNulls;

  static DocRefStruct fromSerializableMap(Map<String, dynamic> data) =>
      DocRefStruct(
        id: deserializeParam(
          data['id'],
          ParamType.DocumentReference,
          false,
          collectionNamePath: ['users'],
        ),
      );

  @override
  String toString() => 'DocRefStruct(${toMap()})';

  @override
  bool operator ==(Object other) {
    return other is DocRefStruct && id == other.id;
  }

  @override
  int get hashCode => const ListEquality().hash([id]);
}

DocRefStruct createDocRefStruct({
  DocumentReference? id,
  Map<String, dynamic> fieldValues = const {},
  bool clearUnsetFields = true,
  bool create = false,
  bool delete = false,
}) =>
    DocRefStruct(
      id: id,
      firestoreUtilData: FirestoreUtilData(
        clearUnsetFields: clearUnsetFields,
        create: create,
        delete: delete,
        fieldValues: fieldValues,
      ),
    );

DocRefStruct? updateDocRefStruct(
  DocRefStruct? docRef, {
  bool clearUnsetFields = true,
  bool create = false,
}) =>
    docRef
      ?..firestoreUtilData = FirestoreUtilData(
        clearUnsetFields: clearUnsetFields,
        create: create,
      );

void addDocRefStructData(
  Map<String, dynamic> firestoreData,
  DocRefStruct? docRef,
  String fieldName, [
  bool forFieldValue = false,
]) {
  firestoreData.remove(fieldName);
  if (docRef == null) {
    return;
  }
  if (docRef.firestoreUtilData.delete) {
    firestoreData[fieldName] = FieldValue.delete();
    return;
  }
  final clearFields =
      !forFieldValue && docRef.firestoreUtilData.clearUnsetFields;
  if (clearFields) {
    firestoreData[fieldName] = <String, dynamic>{};
  }
  final docRefData = getDocRefFirestoreData(docRef, forFieldValue);
  final nestedData = docRefData.map((k, v) => MapEntry('$fieldName.$k', v));

  final mergeFields = docRef.firestoreUtilData.create || clearFields;
  firestoreData
      .addAll(mergeFields ? mergeNestedFields(nestedData) : nestedData);
}

Map<String, dynamic> getDocRefFirestoreData(
  DocRefStruct? docRef, [
  bool forFieldValue = false,
]) {
  if (docRef == null) {
    return {};
  }
  final firestoreData = mapToFirestore(docRef.toMap());

  // Add any Firestore field values
  docRef.firestoreUtilData.fieldValues.forEach((k, v) => firestoreData[k] = v);

  return forFieldValue ? mergeNestedFields(firestoreData) : firestoreData;
}

List<Map<String, dynamic>> getDocRefListFirestoreData(
  List<DocRefStruct>? docRefs,
) =>
    docRefs?.map((e) => getDocRefFirestoreData(e, true)).toList() ?? [];
