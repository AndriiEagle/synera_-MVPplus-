import 'dart:async';

import 'package:collection/collection.dart';

import '/backend/schema/util/firestore_util.dart';

import 'index.dart';
import '/flutter_flow/flutter_flow_util.dart';

class UsersRecord extends FirestoreRecord {
  UsersRecord._(
    super.reference,
    super.data,
  ) {
    _initializeFields();
  }

  // "email" field.
  String? _email;
  String get email => _email ?? '';
  bool hasEmail() => _email != null;

  // "display_name" field.
  String? _displayName;
  String get displayName => _displayName ?? '';
  bool hasDisplayName() => _displayName != null;

  // "photo_url" field.
  String? _photoUrl;
  String get photoUrl => _photoUrl ?? '';
  bool hasPhotoUrl() => _photoUrl != null;

  // "uid" field.
  String? _uid;
  String get uid => _uid ?? '';
  bool hasUid() => _uid != null;

  // "created_time" field.
  DateTime? _createdTime;
  DateTime? get createdTime => _createdTime;
  bool hasCreatedTime() => _createdTime != null;

  // "phone_number" field.
  String? _phoneNumber;
  String get phoneNumber => _phoneNumber ?? '';
  bool hasPhoneNumber() => _phoneNumber != null;

  // "show_live_location" field.
  bool? _showLiveLocation;
  bool get showLiveLocation => _showLiveLocation ?? false;
  bool hasShowLiveLocation() => _showLiveLocation != null;

  // "is_deleted" field.
  bool? _isDeleted;
  bool get isDeleted => _isDeleted ?? false;
  bool hasIsDeleted() => _isDeleted != null;

  // "deleted_time" field.
  DateTime? _deletedTime;
  DateTime? get deletedTime => _deletedTime;
  bool hasDeletedTime() => _deletedTime != null;

  // "updated_at" field.
  DateTime? _updatedAt;
  DateTime? get updatedAt => _updatedAt;
  bool hasUpdatedAt() => _updatedAt != null;

  // "locations" field.
  DocumentReference? _locations;
  DocumentReference? get locations => _locations;
  bool hasLocations() => _locations != null;

  // "exchanges" field.
  DocumentReference? _exchanges;
  DocumentReference? get exchanges => _exchanges;
  bool hasExchanges() => _exchanges != null;

  // "about_me" field.
  String? _aboutMe;
  String get aboutMe => _aboutMe ?? '';
  bool hasAboutMe() => _aboutMe != null;

  void _initializeFields() {
    _email = snapshotData['email'] as String?;
    _displayName = snapshotData['display_name'] as String?;
    _photoUrl = snapshotData['photo_url'] as String?;
    _uid = snapshotData['uid'] as String?;
    _createdTime = snapshotData['created_time'] as DateTime?;
    _phoneNumber = snapshotData['phone_number'] as String?;
    _showLiveLocation = snapshotData['show_live_location'] as bool?;
    _isDeleted = snapshotData['is_deleted'] as bool?;
    _deletedTime = snapshotData['deleted_time'] as DateTime?;
    _updatedAt = snapshotData['updated_at'] as DateTime?;
    _locations = snapshotData['locations'] as DocumentReference?;
    _exchanges = snapshotData['exchanges'] as DocumentReference?;
    _aboutMe = snapshotData['about_me'] as String?;
  }

  static CollectionReference get collection =>
      FirebaseFirestore.instance.collection('users');

  static Stream<UsersRecord> getDocument(DocumentReference ref) =>
      ref.snapshots().map((s) => UsersRecord.fromSnapshot(s));

  static Future<UsersRecord> getDocumentOnce(DocumentReference ref) =>
      ref.get().then((s) => UsersRecord.fromSnapshot(s));

  static UsersRecord fromSnapshot(DocumentSnapshot snapshot) => UsersRecord._(
        snapshot.reference,
        mapFromFirestore(snapshot.data() as Map<String, dynamic>),
      );

  static UsersRecord getDocumentFromData(
    Map<String, dynamic> data,
    DocumentReference reference,
  ) =>
      UsersRecord._(reference, mapFromFirestore(data));

  @override
  String toString() =>
      'UsersRecord(reference: ${reference.path}, data: $snapshotData)';

  @override
  int get hashCode => reference.path.hashCode;

  @override
  bool operator ==(other) =>
      other is UsersRecord &&
      reference.path.hashCode == other.reference.path.hashCode;
}

Map<String, dynamic> createUsersRecordData({
  String? email,
  String? displayName,
  String? photoUrl,
  String? uid,
  DateTime? createdTime,
  String? phoneNumber,
  bool? showLiveLocation,
  bool? isDeleted,
  DateTime? deletedTime,
  DateTime? updatedAt,
  DocumentReference? locations,
  DocumentReference? exchanges,
  String? aboutMe,
}) {
  final firestoreData = mapToFirestore(
    <String, dynamic>{
      'email': email,
      'display_name': displayName,
      'photo_url': photoUrl,
      'uid': uid,
      'created_time': createdTime,
      'phone_number': phoneNumber,
      'show_live_location': showLiveLocation,
      'is_deleted': isDeleted,
      'deleted_time': deletedTime,
      'updated_at': updatedAt,
      'locations': locations,
      'exchanges': exchanges,
      'about_me': aboutMe,
    }.withoutNulls,
  );

  return firestoreData;
}

class UsersRecordDocumentEquality implements Equality<UsersRecord> {
  const UsersRecordDocumentEquality();

  @override
  bool equals(UsersRecord? e1, UsersRecord? e2) {
    return e1?.email == e2?.email &&
        e1?.displayName == e2?.displayName &&
        e1?.photoUrl == e2?.photoUrl &&
        e1?.uid == e2?.uid &&
        e1?.createdTime == e2?.createdTime &&
        e1?.phoneNumber == e2?.phoneNumber &&
        e1?.showLiveLocation == e2?.showLiveLocation &&
        e1?.isDeleted == e2?.isDeleted &&
        e1?.deletedTime == e2?.deletedTime &&
        e1?.updatedAt == e2?.updatedAt &&
        e1?.locations == e2?.locations &&
        e1?.exchanges == e2?.exchanges &&
        e1?.aboutMe == e2?.aboutMe;
  }

  @override
  int hash(UsersRecord? e) => const ListEquality().hash([
        e?.email,
        e?.displayName,
        e?.photoUrl,
        e?.uid,
        e?.createdTime,
        e?.phoneNumber,
        e?.showLiveLocation,
        e?.isDeleted,
        e?.deletedTime,
        e?.updatedAt,
        e?.locations,
        e?.exchanges,
        e?.aboutMe
      ]);

  @override
  bool isValidKey(Object? o) => o is UsersRecord;
}
