// ignore_for_file: unnecessary_getters_setters

import 'package:cloud_firestore/cloud_firestore.dart';

import '/backend/schema/util/firestore_util.dart';
import '/backend/schema/util/schema_util.dart';

import 'index.dart';
import '/flutter_flow/flutter_flow_util.dart';

class NoteStruct extends FFFirebaseStruct {
  NoteStruct({
    String? textValue,
    String? sphereOfLife,
    List<String>? participants,
    String? location,
    String? description,
    List<String>? keyPoints,
    List<String>? actions,
    List<String>? relatedNotes,
    String? notes,
    List<String>? filesLinks,
    String? tags,
    FirestoreUtilData firestoreUtilData = const FirestoreUtilData(),
  })  : _textValue = textValue,
        _sphereOfLife = sphereOfLife,
        _participants = participants,
        _location = location,
        _description = description,
        _keyPoints = keyPoints,
        _actions = actions,
        _relatedNotes = relatedNotes,
        _notes = notes,
        _filesLinks = filesLinks,
        _tags = tags,
        super(firestoreUtilData);

  // "text_value" field.
  String? _textValue;
  String get textValue => _textValue ?? '';
  set textValue(String? val) => _textValue = val;

  bool hasTextValue() => _textValue != null;

  // "sphere_of_life" field.
  String? _sphereOfLife;
  String get sphereOfLife => _sphereOfLife ?? '';
  set sphereOfLife(String? val) => _sphereOfLife = val;

  bool hasSphereOfLife() => _sphereOfLife != null;

  // "participants" field.
  List<String>? _participants;
  List<String> get participants => _participants ?? const [];
  set participants(List<String>? val) => _participants = val;

  void updateParticipants(Function(List<String>) updateFn) {
    updateFn(_participants ??= []);
  }

  bool hasParticipants() => _participants != null;

  // "location" field.
  String? _location;
  String get location => _location ?? '';
  set location(String? val) => _location = val;

  bool hasLocation() => _location != null;

  // "description" field.
  String? _description;
  String get description => _description ?? '';
  set description(String? val) => _description = val;

  bool hasDescription() => _description != null;

  // "key_points" field.
  List<String>? _keyPoints;
  List<String> get keyPoints => _keyPoints ?? const [];
  set keyPoints(List<String>? val) => _keyPoints = val;

  void updateKeyPoints(Function(List<String>) updateFn) {
    updateFn(_keyPoints ??= []);
  }

  bool hasKeyPoints() => _keyPoints != null;

  // "actions" field.
  List<String>? _actions;
  List<String> get actions => _actions ?? const [];
  set actions(List<String>? val) => _actions = val;

  void updateActions(Function(List<String>) updateFn) {
    updateFn(_actions ??= []);
  }

  bool hasActions() => _actions != null;

  // "related_notes" field.
  List<String>? _relatedNotes;
  List<String> get relatedNotes => _relatedNotes ?? const [];
  set relatedNotes(List<String>? val) => _relatedNotes = val;

  void updateRelatedNotes(Function(List<String>) updateFn) {
    updateFn(_relatedNotes ??= []);
  }

  bool hasRelatedNotes() => _relatedNotes != null;

  // "notes" field.
  String? _notes;
  String get notes => _notes ?? '';
  set notes(String? val) => _notes = val;

  bool hasNotes() => _notes != null;

  // "files_links" field.
  List<String>? _filesLinks;
  List<String> get filesLinks => _filesLinks ?? const [];
  set filesLinks(List<String>? val) => _filesLinks = val;

  void updateFilesLinks(Function(List<String>) updateFn) {
    updateFn(_filesLinks ??= []);
  }

  bool hasFilesLinks() => _filesLinks != null;

  // "tags" field.
  String? _tags;
  String get tags => _tags ?? '';
  set tags(String? val) => _tags = val;

  bool hasTags() => _tags != null;

  static NoteStruct fromMap(Map<String, dynamic> data) => NoteStruct(
        textValue: data['text_value'] as String?,
        sphereOfLife: data['sphere_of_life'] as String?,
        participants: getDataList(data['participants']),
        location: data['location'] as String?,
        description: data['description'] as String?,
        keyPoints: getDataList(data['key_points']),
        actions: getDataList(data['actions']),
        relatedNotes: getDataList(data['related_notes']),
        notes: data['notes'] as String?,
        filesLinks: getDataList(data['files_links']),
        tags: data['tags'] as String?,
      );

  static NoteStruct? maybeFromMap(dynamic data) =>
      data is Map ? NoteStruct.fromMap(data.cast<String, dynamic>()) : null;

  Map<String, dynamic> toMap() => {
        'text_value': _textValue,
        'sphere_of_life': _sphereOfLife,
        'participants': _participants,
        'location': _location,
        'description': _description,
        'key_points': _keyPoints,
        'actions': _actions,
        'related_notes': _relatedNotes,
        'notes': _notes,
        'files_links': _filesLinks,
        'tags': _tags,
      }.withoutNulls;

  @override
  Map<String, dynamic> toSerializableMap() => {
        'text_value': serializeParam(
          _textValue,
          ParamType.String,
        ),
        'sphere_of_life': serializeParam(
          _sphereOfLife,
          ParamType.String,
        ),
        'participants': serializeParam(
          _participants,
          ParamType.String,
          isList: true,
        ),
        'location': serializeParam(
          _location,
          ParamType.String,
        ),
        'description': serializeParam(
          _description,
          ParamType.String,
        ),
        'key_points': serializeParam(
          _keyPoints,
          ParamType.String,
          isList: true,
        ),
        'actions': serializeParam(
          _actions,
          ParamType.String,
          isList: true,
        ),
        'related_notes': serializeParam(
          _relatedNotes,
          ParamType.String,
          isList: true,
        ),
        'notes': serializeParam(
          _notes,
          ParamType.String,
        ),
        'files_links': serializeParam(
          _filesLinks,
          ParamType.String,
          isList: true,
        ),
        'tags': serializeParam(
          _tags,
          ParamType.String,
        ),
      }.withoutNulls;

  static NoteStruct fromSerializableMap(Map<String, dynamic> data) =>
      NoteStruct(
        textValue: deserializeParam(
          data['text_value'],
          ParamType.String,
          false,
        ),
        sphereOfLife: deserializeParam(
          data['sphere_of_life'],
          ParamType.String,
          false,
        ),
        participants: deserializeParam<String>(
          data['participants'],
          ParamType.String,
          true,
        ),
        location: deserializeParam(
          data['location'],
          ParamType.String,
          false,
        ),
        description: deserializeParam(
          data['description'],
          ParamType.String,
          false,
        ),
        keyPoints: deserializeParam<String>(
          data['key_points'],
          ParamType.String,
          true,
        ),
        actions: deserializeParam<String>(
          data['actions'],
          ParamType.String,
          true,
        ),
        relatedNotes: deserializeParam<String>(
          data['related_notes'],
          ParamType.String,
          true,
        ),
        notes: deserializeParam(
          data['notes'],
          ParamType.String,
          false,
        ),
        filesLinks: deserializeParam<String>(
          data['files_links'],
          ParamType.String,
          true,
        ),
        tags: deserializeParam(
          data['tags'],
          ParamType.String,
          false,
        ),
      );

  @override
  String toString() => 'NoteStruct(${toMap()})';

  @override
  bool operator ==(Object other) {
    const listEquality = ListEquality();
    return other is NoteStruct &&
        textValue == other.textValue &&
        sphereOfLife == other.sphereOfLife &&
        listEquality.equals(participants, other.participants) &&
        location == other.location &&
        description == other.description &&
        listEquality.equals(keyPoints, other.keyPoints) &&
        listEquality.equals(actions, other.actions) &&
        listEquality.equals(relatedNotes, other.relatedNotes) &&
        notes == other.notes &&
        listEquality.equals(filesLinks, other.filesLinks) &&
        tags == other.tags;
  }

  @override
  int get hashCode => const ListEquality().hash([
        textValue,
        sphereOfLife,
        participants,
        location,
        description,
        keyPoints,
        actions,
        relatedNotes,
        notes,
        filesLinks,
        tags
      ]);
}

NoteStruct createNoteStruct({
  String? textValue,
  String? sphereOfLife,
  String? location,
  String? description,
  String? notes,
  String? tags,
  Map<String, dynamic> fieldValues = const {},
  bool clearUnsetFields = true,
  bool create = false,
  bool delete = false,
}) =>
    NoteStruct(
      textValue: textValue,
      sphereOfLife: sphereOfLife,
      location: location,
      description: description,
      notes: notes,
      tags: tags,
      firestoreUtilData: FirestoreUtilData(
        clearUnsetFields: clearUnsetFields,
        create: create,
        delete: delete,
        fieldValues: fieldValues,
      ),
    );

NoteStruct? updateNoteStruct(
  NoteStruct? note, {
  bool clearUnsetFields = true,
  bool create = false,
}) =>
    note
      ?..firestoreUtilData = FirestoreUtilData(
        clearUnsetFields: clearUnsetFields,
        create: create,
      );

void addNoteStructData(
  Map<String, dynamic> firestoreData,
  NoteStruct? note,
  String fieldName, [
  bool forFieldValue = false,
]) {
  firestoreData.remove(fieldName);
  if (note == null) {
    return;
  }
  if (note.firestoreUtilData.delete) {
    firestoreData[fieldName] = FieldValue.delete();
    return;
  }
  final clearFields = !forFieldValue && note.firestoreUtilData.clearUnsetFields;
  if (clearFields) {
    firestoreData[fieldName] = <String, dynamic>{};
  }
  final noteData = getNoteFirestoreData(note, forFieldValue);
  final nestedData = noteData.map((k, v) => MapEntry('$fieldName.$k', v));

  final mergeFields = note.firestoreUtilData.create || clearFields;
  firestoreData
      .addAll(mergeFields ? mergeNestedFields(nestedData) : nestedData);
}

Map<String, dynamic> getNoteFirestoreData(
  NoteStruct? note, [
  bool forFieldValue = false,
]) {
  if (note == null) {
    return {};
  }
  final firestoreData = mapToFirestore(note.toMap());

  // Add any Firestore field values
  note.firestoreUtilData.fieldValues.forEach((k, v) => firestoreData[k] = v);

  return forFieldValue ? mergeNestedFields(firestoreData) : firestoreData;
}

List<Map<String, dynamic>> getNoteListFirestoreData(
  List<NoteStruct>? notes,
) =>
    notes?.map((e) => getNoteFirestoreData(e, true)).toList() ?? [];
