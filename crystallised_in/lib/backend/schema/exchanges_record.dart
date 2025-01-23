import 'dart:async';

import 'package:collection/collection.dart';

import '/backend/schema/util/firestore_util.dart';

import 'index.dart';
import '/flutter_flow/flutter_flow_util.dart';

class ExchangesRecord extends FirestoreRecord {
  ExchangesRecord._(
    super.reference,
    super.data,
  ) {
    _initializeFields();
  }

  // "exchange_type" field.
  String? _exchangeType;
  String get exchangeType => _exchangeType ?? '';
  bool hasExchangeType() => _exchangeType != null;

  // "created_at" field.
  DateTime? _createdAt;
  DateTime? get createdAt => _createdAt;
  bool hasCreatedAt() => _createdAt != null;

  // "values" field.
  List<ValuesStruct>? _values;
  List<ValuesStruct> get values => _values ?? const [];
  bool hasValues() => _values != null;

  DocumentReference get parentReference => reference.parent.parent!;

  void _initializeFields() {
    _exchangeType = snapshotData['exchange_type'] as String?;
    _createdAt = snapshotData['created_at'] as DateTime?;
    _values = getStructList(
      snapshotData['values'],
      ValuesStruct.fromMap,
    );
  }

  static Query<Map<String, dynamic>> collection([DocumentReference? parent]) =>
      parent != null
          ? parent.collection('exchanges')
          : FirebaseFirestore.instance.collectionGroup('exchanges');

  static DocumentReference createDoc(DocumentReference parent, {String? id}) =>
      parent.collection('exchanges').doc(id);

  static Stream<ExchangesRecord> getDocument(DocumentReference ref) =>
      ref.snapshots().map((s) => ExchangesRecord.fromSnapshot(s));

  static Future<ExchangesRecord> getDocumentOnce(DocumentReference ref) =>
      ref.get().then((s) => ExchangesRecord.fromSnapshot(s));

  static ExchangesRecord fromSnapshot(DocumentSnapshot snapshot) =>
      ExchangesRecord._(
        snapshot.reference,
        mapFromFirestore(snapshot.data() as Map<String, dynamic>),
      );

  static ExchangesRecord getDocumentFromData(
    Map<String, dynamic> data,
    DocumentReference reference,
  ) =>
      ExchangesRecord._(reference, mapFromFirestore(data));

  @override
  String toString() =>
      'ExchangesRecord(reference: ${reference.path}, data: $snapshotData)';

  @override
  int get hashCode => reference.path.hashCode;

  @override
  bool operator ==(other) =>
      other is ExchangesRecord &&
      reference.path.hashCode == other.reference.path.hashCode;
}

Map<String, dynamic> createExchangesRecordData({
  String? exchangeType,
  DateTime? createdAt,
}) {
  final firestoreData = mapToFirestore(
    <String, dynamic>{
      'exchange_type': exchangeType,
      'created_at': createdAt,
    }.withoutNulls,
  );

  return firestoreData;
}

class ExchangesRecordDocumentEquality implements Equality<ExchangesRecord> {
  const ExchangesRecordDocumentEquality();

  @override
  bool equals(ExchangesRecord? e1, ExchangesRecord? e2) {
    const listEquality = ListEquality();
    return e1?.exchangeType == e2?.exchangeType &&
        e1?.createdAt == e2?.createdAt &&
        listEquality.equals(e1?.values, e2?.values);
  }

  @override
  int hash(ExchangesRecord? e) =>
      const ListEquality().hash([e?.exchangeType, e?.createdAt, e?.values]);

  @override
  bool isValidKey(Object? o) => o is ExchangesRecord;
}
