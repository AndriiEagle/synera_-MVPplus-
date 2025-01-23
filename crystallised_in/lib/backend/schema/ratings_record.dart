import 'dart:async';

import 'package:collection/collection.dart';

import '/backend/schema/util/firestore_util.dart';

import 'index.dart';
import '/flutter_flow/flutter_flow_util.dart';

class RatingsRecord extends FirestoreRecord {
  RatingsRecord._(
    super.reference,
    super.data,
  ) {
    _initializeFields();
  }

  // "companion_level" field.
  int? _companionLevel;
  int get companionLevel => _companionLevel ?? 0;
  bool hasCompanionLevel() => _companionLevel != null;

  // "question_answer_level" field.
  int? _questionAnswerLevel;
  int get questionAnswerLevel => _questionAnswerLevel ?? 0;
  bool hasQuestionAnswerLevel() => _questionAnswerLevel != null;

  // "general_application_level" field.
  int? _generalApplicationLevel;
  int get generalApplicationLevel => _generalApplicationLevel ?? 0;
  bool hasGeneralApplicationLevel() => _generalApplicationLevel != null;

  DocumentReference get parentReference => reference.parent.parent!;

  void _initializeFields() {
    _companionLevel = castToType<int>(snapshotData['companion_level']);
    _questionAnswerLevel =
        castToType<int>(snapshotData['question_answer_level']);
    _generalApplicationLevel =
        castToType<int>(snapshotData['general_application_level']);
  }

  static Query<Map<String, dynamic>> collection([DocumentReference? parent]) =>
      parent != null
          ? parent.collection('ratings')
          : FirebaseFirestore.instance.collectionGroup('ratings');

  static DocumentReference createDoc(DocumentReference parent, {String? id}) =>
      parent.collection('ratings').doc(id);

  static Stream<RatingsRecord> getDocument(DocumentReference ref) =>
      ref.snapshots().map((s) => RatingsRecord.fromSnapshot(s));

  static Future<RatingsRecord> getDocumentOnce(DocumentReference ref) =>
      ref.get().then((s) => RatingsRecord.fromSnapshot(s));

  static RatingsRecord fromSnapshot(DocumentSnapshot snapshot) =>
      RatingsRecord._(
        snapshot.reference,
        mapFromFirestore(snapshot.data() as Map<String, dynamic>),
      );

  static RatingsRecord getDocumentFromData(
    Map<String, dynamic> data,
    DocumentReference reference,
  ) =>
      RatingsRecord._(reference, mapFromFirestore(data));

  @override
  String toString() =>
      'RatingsRecord(reference: ${reference.path}, data: $snapshotData)';

  @override
  int get hashCode => reference.path.hashCode;

  @override
  bool operator ==(other) =>
      other is RatingsRecord &&
      reference.path.hashCode == other.reference.path.hashCode;
}

Map<String, dynamic> createRatingsRecordData({
  int? companionLevel,
  int? questionAnswerLevel,
  int? generalApplicationLevel,
}) {
  final firestoreData = mapToFirestore(
    <String, dynamic>{
      'companion_level': companionLevel,
      'question_answer_level': questionAnswerLevel,
      'general_application_level': generalApplicationLevel,
    }.withoutNulls,
  );

  return firestoreData;
}

class RatingsRecordDocumentEquality implements Equality<RatingsRecord> {
  const RatingsRecordDocumentEquality();

  @override
  bool equals(RatingsRecord? e1, RatingsRecord? e2) {
    return e1?.companionLevel == e2?.companionLevel &&
        e1?.questionAnswerLevel == e2?.questionAnswerLevel &&
        e1?.generalApplicationLevel == e2?.generalApplicationLevel;
  }

  @override
  int hash(RatingsRecord? e) => const ListEquality().hash(
      [e?.companionLevel, e?.questionAnswerLevel, e?.generalApplicationLevel]);

  @override
  bool isValidKey(Object? o) => o is RatingsRecord;
}
