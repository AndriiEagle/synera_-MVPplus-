import 'dart:async';

import 'package:collection/collection.dart';

import '/backend/schema/util/firestore_util.dart';

import 'index.dart';
import '/flutter_flow/flutter_flow_util.dart';

class OptiomizersRecord extends FirestoreRecord {
  OptiomizersRecord._(
    super.reference,
    super.data,
  ) {
    _initializeFields();
  }

  // "category" field.
  String? _category;
  String get category => _category ?? '';
  bool hasCategory() => _category != null;

  // "description" field.
  String? _description;
  String get description => _description ?? '';
  bool hasDescription() => _description != null;

  // "points" field.
  int? _points;
  int get points => _points ?? 0;
  bool hasPoints() => _points != null;

  // "created_at" field.
  DateTime? _createdAt;
  DateTime? get createdAt => _createdAt;
  bool hasCreatedAt() => _createdAt != null;

  DocumentReference get parentReference => reference.parent.parent!;

  void _initializeFields() {
    _category = snapshotData['category'] as String?;
    _description = snapshotData['description'] as String?;
    _points = castToType<int>(snapshotData['points']);
    _createdAt = snapshotData['created_at'] as DateTime?;
  }

  static Query<Map<String, dynamic>> collection([DocumentReference? parent]) =>
      parent != null
          ? parent.collection('optiomizers')
          : FirebaseFirestore.instance.collectionGroup('optiomizers');

  static DocumentReference createDoc(DocumentReference parent, {String? id}) =>
      parent.collection('optiomizers').doc(id);

  static Stream<OptiomizersRecord> getDocument(DocumentReference ref) =>
      ref.snapshots().map((s) => OptiomizersRecord.fromSnapshot(s));

  static Future<OptiomizersRecord> getDocumentOnce(DocumentReference ref) =>
      ref.get().then((s) => OptiomizersRecord.fromSnapshot(s));

  static OptiomizersRecord fromSnapshot(DocumentSnapshot snapshot) =>
      OptiomizersRecord._(
        snapshot.reference,
        mapFromFirestore(snapshot.data() as Map<String, dynamic>),
      );

  static OptiomizersRecord getDocumentFromData(
    Map<String, dynamic> data,
    DocumentReference reference,
  ) =>
      OptiomizersRecord._(reference, mapFromFirestore(data));

  @override
  String toString() =>
      'OptiomizersRecord(reference: ${reference.path}, data: $snapshotData)';

  @override
  int get hashCode => reference.path.hashCode;

  @override
  bool operator ==(other) =>
      other is OptiomizersRecord &&
      reference.path.hashCode == other.reference.path.hashCode;
}

Map<String, dynamic> createOptiomizersRecordData({
  String? category,
  String? description,
  int? points,
  DateTime? createdAt,
}) {
  final firestoreData = mapToFirestore(
    <String, dynamic>{
      'category': category,
      'description': description,
      'points': points,
      'created_at': createdAt,
    }.withoutNulls,
  );

  return firestoreData;
}

class OptiomizersRecordDocumentEquality implements Equality<OptiomizersRecord> {
  const OptiomizersRecordDocumentEquality();

  @override
  bool equals(OptiomizersRecord? e1, OptiomizersRecord? e2) {
    return e1?.category == e2?.category &&
        e1?.description == e2?.description &&
        e1?.points == e2?.points &&
        e1?.createdAt == e2?.createdAt;
  }

  @override
  int hash(OptiomizersRecord? e) => const ListEquality()
      .hash([e?.category, e?.description, e?.points, e?.createdAt]);

  @override
  bool isValidKey(Object? o) => o is OptiomizersRecord;
}
