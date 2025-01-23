import 'dart:async';

import 'package:collection/collection.dart';

import '/backend/schema/util/firestore_util.dart';

import 'index.dart';
import '/flutter_flow/flutter_flow_util.dart';

class LocationsRecord extends FirestoreRecord {
  LocationsRecord._(
    super.reference,
    super.data,
  ) {
    _initializeFields();
  }

  // "latitude_longitude" field.
  LatLng? _latitudeLongitude;
  LatLng? get latitudeLongitude => _latitudeLongitude;
  bool hasLatitudeLongitude() => _latitudeLongitude != null;

  // "updated_at" field.
  DateTime? _updatedAt;
  DateTime? get updatedAt => _updatedAt;
  bool hasUpdatedAt() => _updatedAt != null;

  // "userReference" field.
  DocumentReference? _userReference;
  DocumentReference? get userReference => _userReference;
  bool hasUserReference() => _userReference != null;

  // "userRefExanges" field.
  DocumentReference? _userRefExanges;
  DocumentReference? get userRefExanges => _userRefExanges;
  bool hasUserRefExanges() => _userRefExanges != null;

  DocumentReference get parentReference => reference.parent.parent!;

  void _initializeFields() {
    _latitudeLongitude = snapshotData['latitude_longitude'] as LatLng?;
    _updatedAt = snapshotData['updated_at'] as DateTime?;
    _userReference = snapshotData['userReference'] as DocumentReference?;
    _userRefExanges = snapshotData['userRefExanges'] as DocumentReference?;
  }

  static Query<Map<String, dynamic>> collection([DocumentReference? parent]) =>
      parent != null
          ? parent.collection('locations')
          : FirebaseFirestore.instance.collectionGroup('locations');

  static DocumentReference createDoc(DocumentReference parent, {String? id}) =>
      parent.collection('locations').doc(id);

  static Stream<LocationsRecord> getDocument(DocumentReference ref) =>
      ref.snapshots().map((s) => LocationsRecord.fromSnapshot(s));

  static Future<LocationsRecord> getDocumentOnce(DocumentReference ref) =>
      ref.get().then((s) => LocationsRecord.fromSnapshot(s));

  static LocationsRecord fromSnapshot(DocumentSnapshot snapshot) =>
      LocationsRecord._(
        snapshot.reference,
        mapFromFirestore(snapshot.data() as Map<String, dynamic>),
      );

  static LocationsRecord getDocumentFromData(
    Map<String, dynamic> data,
    DocumentReference reference,
  ) =>
      LocationsRecord._(reference, mapFromFirestore(data));

  @override
  String toString() =>
      'LocationsRecord(reference: ${reference.path}, data: $snapshotData)';

  @override
  int get hashCode => reference.path.hashCode;

  @override
  bool operator ==(other) =>
      other is LocationsRecord &&
      reference.path.hashCode == other.reference.path.hashCode;
}

Map<String, dynamic> createLocationsRecordData({
  LatLng? latitudeLongitude,
  DateTime? updatedAt,
  DocumentReference? userReference,
  DocumentReference? userRefExanges,
}) {
  final firestoreData = mapToFirestore(
    <String, dynamic>{
      'latitude_longitude': latitudeLongitude,
      'updated_at': updatedAt,
      'userReference': userReference,
      'userRefExanges': userRefExanges,
    }.withoutNulls,
  );

  return firestoreData;
}

class LocationsRecordDocumentEquality implements Equality<LocationsRecord> {
  const LocationsRecordDocumentEquality();

  @override
  bool equals(LocationsRecord? e1, LocationsRecord? e2) {
    return e1?.latitudeLongitude == e2?.latitudeLongitude &&
        e1?.updatedAt == e2?.updatedAt &&
        e1?.userReference == e2?.userReference &&
        e1?.userRefExanges == e2?.userRefExanges;
  }

  @override
  int hash(LocationsRecord? e) => const ListEquality().hash([
        e?.latitudeLongitude,
        e?.updatedAt,
        e?.userReference,
        e?.userRefExanges
      ]);

  @override
  bool isValidKey(Object? o) => o is LocationsRecord;
}
