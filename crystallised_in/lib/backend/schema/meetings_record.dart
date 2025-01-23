import 'dart:async';

import 'package:collection/collection.dart';

import '/backend/schema/util/firestore_util.dart';

import 'index.dart';
import '/flutter_flow/flutter_flow_util.dart';

class MeetingsRecord extends FirestoreRecord {
  MeetingsRecord._(
    super.reference,
    super.data,
  ) {
    _initializeFields();
  }

  // "meeting_type" field.
  String? _meetingType;
  String get meetingType => _meetingType ?? '';
  bool hasMeetingType() => _meetingType != null;

  // "status" field.
  String? _status;
  String get status => _status ?? '';
  bool hasStatus() => _status != null;

  // "updated_at" field.
  DateTime? _updatedAt;
  DateTime? get updatedAt => _updatedAt;
  bool hasUpdatedAt() => _updatedAt != null;

  // "date" field.
  DateTime? _date;
  DateTime? get date => _date;
  bool hasDate() => _date != null;

  // "time" field.
  DateTime? _time;
  DateTime? get time => _time;
  bool hasTime() => _time != null;

  // "requester_id" field.
  DocumentReference? _requesterId;
  DocumentReference? get requesterId => _requesterId;
  bool hasRequesterId() => _requesterId != null;

  // "requestee_id" field.
  DocumentReference? _requesteeId;
  DocumentReference? get requesteeId => _requesteeId;
  bool hasRequesteeId() => _requesteeId != null;

  // "place" field.
  String? _place;
  String get place => _place ?? '';
  bool hasPlace() => _place != null;

  // "mesagge" field.
  String? _mesagge;
  String get mesagge => _mesagge ?? '';
  bool hasMesagge() => _mesagge != null;

  void _initializeFields() {
    _meetingType = snapshotData['meeting_type'] as String?;
    _status = snapshotData['status'] as String?;
    _updatedAt = snapshotData['updated_at'] as DateTime?;
    _date = snapshotData['date'] as DateTime?;
    _time = snapshotData['time'] as DateTime?;
    _requesterId = snapshotData['requester_id'] as DocumentReference?;
    _requesteeId = snapshotData['requestee_id'] as DocumentReference?;
    _place = snapshotData['place'] as String?;
    _mesagge = snapshotData['mesagge'] as String?;
  }

  static CollectionReference get collection =>
      FirebaseFirestore.instance.collection('meetings');

  static Stream<MeetingsRecord> getDocument(DocumentReference ref) =>
      ref.snapshots().map((s) => MeetingsRecord.fromSnapshot(s));

  static Future<MeetingsRecord> getDocumentOnce(DocumentReference ref) =>
      ref.get().then((s) => MeetingsRecord.fromSnapshot(s));

  static MeetingsRecord fromSnapshot(DocumentSnapshot snapshot) =>
      MeetingsRecord._(
        snapshot.reference,
        mapFromFirestore(snapshot.data() as Map<String, dynamic>),
      );

  static MeetingsRecord getDocumentFromData(
    Map<String, dynamic> data,
    DocumentReference reference,
  ) =>
      MeetingsRecord._(reference, mapFromFirestore(data));

  @override
  String toString() =>
      'MeetingsRecord(reference: ${reference.path}, data: $snapshotData)';

  @override
  int get hashCode => reference.path.hashCode;

  @override
  bool operator ==(other) =>
      other is MeetingsRecord &&
      reference.path.hashCode == other.reference.path.hashCode;
}

Map<String, dynamic> createMeetingsRecordData({
  String? meetingType,
  String? status,
  DateTime? updatedAt,
  DateTime? date,
  DateTime? time,
  DocumentReference? requesterId,
  DocumentReference? requesteeId,
  String? place,
  String? mesagge,
}) {
  final firestoreData = mapToFirestore(
    <String, dynamic>{
      'meeting_type': meetingType,
      'status': status,
      'updated_at': updatedAt,
      'date': date,
      'time': time,
      'requester_id': requesterId,
      'requestee_id': requesteeId,
      'place': place,
      'mesagge': mesagge,
    }.withoutNulls,
  );

  return firestoreData;
}

class MeetingsRecordDocumentEquality implements Equality<MeetingsRecord> {
  const MeetingsRecordDocumentEquality();

  @override
  bool equals(MeetingsRecord? e1, MeetingsRecord? e2) {
    return e1?.meetingType == e2?.meetingType &&
        e1?.status == e2?.status &&
        e1?.updatedAt == e2?.updatedAt &&
        e1?.date == e2?.date &&
        e1?.time == e2?.time &&
        e1?.requesterId == e2?.requesterId &&
        e1?.requesteeId == e2?.requesteeId &&
        e1?.place == e2?.place &&
        e1?.mesagge == e2?.mesagge;
  }

  @override
  int hash(MeetingsRecord? e) => const ListEquality().hash([
        e?.meetingType,
        e?.status,
        e?.updatedAt,
        e?.date,
        e?.time,
        e?.requesterId,
        e?.requesteeId,
        e?.place,
        e?.mesagge
      ]);

  @override
  bool isValidKey(Object? o) => o is MeetingsRecord;
}
