import 'dart:async';

import 'package:collection/collection.dart';

import '/backend/schema/util/firestore_util.dart';

import 'index.dart';
import '/flutter_flow/flutter_flow_util.dart';

class MetricsRecord extends FirestoreRecord {
  MetricsRecord._(
    super.reference,
    super.data,
  ) {
    _initializeFields();
  }

  // "metric_name" field.
  String? _metricName;
  String get metricName => _metricName ?? '';
  bool hasMetricName() => _metricName != null;

  // "metirc_value" field.
  int? _metircValue;
  int get metircValue => _metircValue ?? 0;
  bool hasMetircValue() => _metircValue != null;

  // "created_at" field.
  DateTime? _createdAt;
  DateTime? get createdAt => _createdAt;
  bool hasCreatedAt() => _createdAt != null;

  DocumentReference get parentReference => reference.parent.parent!;

  void _initializeFields() {
    _metricName = snapshotData['metric_name'] as String?;
    _metircValue = castToType<int>(snapshotData['metirc_value']);
    _createdAt = snapshotData['created_at'] as DateTime?;
  }

  static Query<Map<String, dynamic>> collection([DocumentReference? parent]) =>
      parent != null
          ? parent.collection('metrics')
          : FirebaseFirestore.instance.collectionGroup('metrics');

  static DocumentReference createDoc(DocumentReference parent, {String? id}) =>
      parent.collection('metrics').doc(id);

  static Stream<MetricsRecord> getDocument(DocumentReference ref) =>
      ref.snapshots().map((s) => MetricsRecord.fromSnapshot(s));

  static Future<MetricsRecord> getDocumentOnce(DocumentReference ref) =>
      ref.get().then((s) => MetricsRecord.fromSnapshot(s));

  static MetricsRecord fromSnapshot(DocumentSnapshot snapshot) =>
      MetricsRecord._(
        snapshot.reference,
        mapFromFirestore(snapshot.data() as Map<String, dynamic>),
      );

  static MetricsRecord getDocumentFromData(
    Map<String, dynamic> data,
    DocumentReference reference,
  ) =>
      MetricsRecord._(reference, mapFromFirestore(data));

  @override
  String toString() =>
      'MetricsRecord(reference: ${reference.path}, data: $snapshotData)';

  @override
  int get hashCode => reference.path.hashCode;

  @override
  bool operator ==(other) =>
      other is MetricsRecord &&
      reference.path.hashCode == other.reference.path.hashCode;
}

Map<String, dynamic> createMetricsRecordData({
  String? metricName,
  int? metircValue,
  DateTime? createdAt,
}) {
  final firestoreData = mapToFirestore(
    <String, dynamic>{
      'metric_name': metricName,
      'metirc_value': metircValue,
      'created_at': createdAt,
    }.withoutNulls,
  );

  return firestoreData;
}

class MetricsRecordDocumentEquality implements Equality<MetricsRecord> {
  const MetricsRecordDocumentEquality();

  @override
  bool equals(MetricsRecord? e1, MetricsRecord? e2) {
    return e1?.metricName == e2?.metricName &&
        e1?.metircValue == e2?.metircValue &&
        e1?.createdAt == e2?.createdAt;
  }

  @override
  int hash(MetricsRecord? e) =>
      const ListEquality().hash([e?.metricName, e?.metircValue, e?.createdAt]);

  @override
  bool isValidKey(Object? o) => o is MetricsRecord;
}
