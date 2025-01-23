import 'dart:async';

import 'package:collection/collection.dart';

import '/backend/schema/util/firestore_util.dart';

import 'index.dart';
import '/flutter_flow/flutter_flow_util.dart';

class DiariesRecord extends FirestoreRecord {
  DiariesRecord._(
    super.reference,
    super.data,
  ) {
    _initializeFields();
  }

  // "created_at" field.
  DateTime? _createdAt;
  DateTime? get createdAt => _createdAt;
  bool hasCreatedAt() => _createdAt != null;

  // "notes" field.
  List<NoteStruct>? _notes;
  List<NoteStruct> get notes => _notes ?? const [];
  bool hasNotes() => _notes != null;

  DocumentReference get parentReference => reference.parent.parent!;

  void _initializeFields() {
    _createdAt = snapshotData['created_at'] as DateTime?;
    _notes = getStructList(
      snapshotData['notes'],
      NoteStruct.fromMap,
    );
  }

  static Query<Map<String, dynamic>> collection([DocumentReference? parent]) =>
      parent != null
          ? parent.collection('diaries')
          : FirebaseFirestore.instance.collectionGroup('diaries');

  static DocumentReference createDoc(DocumentReference parent, {String? id}) =>
      parent.collection('diaries').doc(id);

  static Stream<DiariesRecord> getDocument(DocumentReference ref) =>
      ref.snapshots().map((s) => DiariesRecord.fromSnapshot(s));

  static Future<DiariesRecord> getDocumentOnce(DocumentReference ref) =>
      ref.get().then((s) => DiariesRecord.fromSnapshot(s));

  static DiariesRecord fromSnapshot(DocumentSnapshot snapshot) =>
      DiariesRecord._(
        snapshot.reference,
        mapFromFirestore(snapshot.data() as Map<String, dynamic>),
      );

  static DiariesRecord getDocumentFromData(
    Map<String, dynamic> data,
    DocumentReference reference,
  ) =>
      DiariesRecord._(reference, mapFromFirestore(data));

  @override
  String toString() =>
      'DiariesRecord(reference: ${reference.path}, data: $snapshotData)';

  @override
  int get hashCode => reference.path.hashCode;

  @override
  bool operator ==(other) =>
      other is DiariesRecord &&
      reference.path.hashCode == other.reference.path.hashCode;
}

Map<String, dynamic> createDiariesRecordData({
  DateTime? createdAt,
}) {
  final firestoreData = mapToFirestore(
    <String, dynamic>{
      'created_at': createdAt,
    }.withoutNulls,
  );

  return firestoreData;
}

class DiariesRecordDocumentEquality implements Equality<DiariesRecord> {
  const DiariesRecordDocumentEquality();

  @override
  bool equals(DiariesRecord? e1, DiariesRecord? e2) {
    const listEquality = ListEquality();
    return e1?.createdAt == e2?.createdAt &&
        listEquality.equals(e1?.notes, e2?.notes);
  }

  @override
  int hash(DiariesRecord? e) =>
      const ListEquality().hash([e?.createdAt, e?.notes]);

  @override
  bool isValidKey(Object? o) => o is DiariesRecord;
}
