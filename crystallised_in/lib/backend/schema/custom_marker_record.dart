import 'dart:async';

import 'package:collection/collection.dart';

import '/backend/schema/util/firestore_util.dart';

import 'index.dart';
import '/flutter_flow/flutter_flow_util.dart';

class CustomMarkerRecord extends FirestoreRecord {
  CustomMarkerRecord._(
    super.reference,
    super.data,
  ) {
    _initializeFields();
  }

  // "title" field.
  String? _title;
  String get title => _title ?? '';
  bool hasTitle() => _title != null;

  // "description" field.
  String? _description;
  String get description => _description ?? '';
  bool hasDescription() => _description != null;

  // "geopoint" field.
  LatLng? _geopoint;
  LatLng? get geopoint => _geopoint;
  bool hasGeopoint() => _geopoint != null;

  // "Image_url" field.
  String? _imageUrl;
  String get imageUrl => _imageUrl ?? '';
  bool hasImageUrl() => _imageUrl != null;

  DocumentReference get parentReference => reference.parent.parent!;

  void _initializeFields() {
    _title = snapshotData['title'] as String?;
    _description = snapshotData['description'] as String?;
    _geopoint = snapshotData['geopoint'] as LatLng?;
    _imageUrl = snapshotData['Image_url'] as String?;
  }

  static Query<Map<String, dynamic>> collection([DocumentReference? parent]) =>
      parent != null
          ? parent.collection('customMarker')
          : FirebaseFirestore.instance.collectionGroup('customMarker');

  static DocumentReference createDoc(DocumentReference parent, {String? id}) =>
      parent.collection('customMarker').doc(id);

  static Stream<CustomMarkerRecord> getDocument(DocumentReference ref) =>
      ref.snapshots().map((s) => CustomMarkerRecord.fromSnapshot(s));

  static Future<CustomMarkerRecord> getDocumentOnce(DocumentReference ref) =>
      ref.get().then((s) => CustomMarkerRecord.fromSnapshot(s));

  static CustomMarkerRecord fromSnapshot(DocumentSnapshot snapshot) =>
      CustomMarkerRecord._(
        snapshot.reference,
        mapFromFirestore(snapshot.data() as Map<String, dynamic>),
      );

  static CustomMarkerRecord getDocumentFromData(
    Map<String, dynamic> data,
    DocumentReference reference,
  ) =>
      CustomMarkerRecord._(reference, mapFromFirestore(data));

  @override
  String toString() =>
      'CustomMarkerRecord(reference: ${reference.path}, data: $snapshotData)';

  @override
  int get hashCode => reference.path.hashCode;

  @override
  bool operator ==(other) =>
      other is CustomMarkerRecord &&
      reference.path.hashCode == other.reference.path.hashCode;
}

Map<String, dynamic> createCustomMarkerRecordData({
  String? title,
  String? description,
  LatLng? geopoint,
  String? imageUrl,
}) {
  final firestoreData = mapToFirestore(
    <String, dynamic>{
      'title': title,
      'description': description,
      'geopoint': geopoint,
      'Image_url': imageUrl,
    }.withoutNulls,
  );

  return firestoreData;
}

class CustomMarkerRecordDocumentEquality
    implements Equality<CustomMarkerRecord> {
  const CustomMarkerRecordDocumentEquality();

  @override
  bool equals(CustomMarkerRecord? e1, CustomMarkerRecord? e2) {
    return e1?.title == e2?.title &&
        e1?.description == e2?.description &&
        e1?.geopoint == e2?.geopoint &&
        e1?.imageUrl == e2?.imageUrl;
  }

  @override
  int hash(CustomMarkerRecord? e) => const ListEquality()
      .hash([e?.title, e?.description, e?.geopoint, e?.imageUrl]);

  @override
  bool isValidKey(Object? o) => o is CustomMarkerRecord;
}
