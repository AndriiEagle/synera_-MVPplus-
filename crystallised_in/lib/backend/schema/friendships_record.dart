import 'dart:async';

import 'package:collection/collection.dart';

import '/backend/schema/util/firestore_util.dart';

import 'index.dart';
import '/flutter_flow/flutter_flow_util.dart';

class FriendshipsRecord extends FirestoreRecord {
  FriendshipsRecord._(
    super.reference,
    super.data,
  ) {
    _initializeFields();
  }

  // "requester_id" field.
  DocumentReference? _requesterId;
  DocumentReference? get requesterId => _requesterId;
  bool hasRequesterId() => _requesterId != null;

  // "requestee_id" field.
  DocumentReference? _requesteeId;
  DocumentReference? get requesteeId => _requesteeId;
  bool hasRequesteeId() => _requesteeId != null;

  // "status" field.
  String? _status;
  String get status => _status ?? '';
  bool hasStatus() => _status != null;

  // "created_at" field.
  DateTime? _createdAt;
  DateTime? get createdAt => _createdAt;
  bool hasCreatedAt() => _createdAt != null;

  // "updated_at" field.
  DateTime? _updatedAt;
  DateTime? get updatedAt => _updatedAt;
  bool hasUpdatedAt() => _updatedAt != null;

  void _initializeFields() {
    _requesterId = snapshotData['requester_id'] as DocumentReference?;
    _requesteeId = snapshotData['requestee_id'] as DocumentReference?;
    _status = snapshotData['status'] as String?;
    _createdAt = snapshotData['created_at'] as DateTime?;
    _updatedAt = snapshotData['updated_at'] as DateTime?;
  }

  static CollectionReference get collection =>
      FirebaseFirestore.instance.collection('friendships');

  static Stream<FriendshipsRecord> getDocument(DocumentReference ref) =>
      ref.snapshots().map((s) => FriendshipsRecord.fromSnapshot(s));

  static Future<FriendshipsRecord> getDocumentOnce(DocumentReference ref) =>
      ref.get().then((s) => FriendshipsRecord.fromSnapshot(s));

  static FriendshipsRecord fromSnapshot(DocumentSnapshot snapshot) =>
      FriendshipsRecord._(
        snapshot.reference,
        mapFromFirestore(snapshot.data() as Map<String, dynamic>),
      );

  static FriendshipsRecord getDocumentFromData(
    Map<String, dynamic> data,
    DocumentReference reference,
  ) =>
      FriendshipsRecord._(reference, mapFromFirestore(data));

  @override
  String toString() =>
      'FriendshipsRecord(reference: ${reference.path}, data: $snapshotData)';

  @override
  int get hashCode => reference.path.hashCode;

  @override
  bool operator ==(other) =>
      other is FriendshipsRecord &&
      reference.path.hashCode == other.reference.path.hashCode;
}

Map<String, dynamic> createFriendshipsRecordData({
  DocumentReference? requesterId,
  DocumentReference? requesteeId,
  String? status,
  DateTime? createdAt,
  DateTime? updatedAt,
}) {
  final firestoreData = mapToFirestore(
    <String, dynamic>{
      'requester_id': requesterId,
      'requestee_id': requesteeId,
      'status': status,
      'created_at': createdAt,
      'updated_at': updatedAt,
    }.withoutNulls,
  );

  return firestoreData;
}

class FriendshipsRecordDocumentEquality implements Equality<FriendshipsRecord> {
  const FriendshipsRecordDocumentEquality();

  @override
  bool equals(FriendshipsRecord? e1, FriendshipsRecord? e2) {
    return e1?.requesterId == e2?.requesterId &&
        e1?.requesteeId == e2?.requesteeId &&
        e1?.status == e2?.status &&
        e1?.createdAt == e2?.createdAt &&
        e1?.updatedAt == e2?.updatedAt;
  }

  @override
  int hash(FriendshipsRecord? e) => const ListEquality().hash(
      [e?.requesterId, e?.requesteeId, e?.status, e?.createdAt, e?.updatedAt]);

  @override
  bool isValidKey(Object? o) => o is FriendshipsRecord;
}
