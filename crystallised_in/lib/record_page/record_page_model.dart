import '/backend/api_requests/api_calls.dart';
import '/backend/backend.dart';
import '/backend/schema/structs/index.dart';
import '/components/navigation/bootom_navigation_component/bootom_navigation_component_widget.dart';
import '/flutter_flow/flutter_flow_util.dart';
import 'record_page_widget.dart' show RecordPageWidget;
import 'package:flutter/material.dart';
import 'package:record/record.dart';

class RecordPageModel extends FlutterFlowModel<RecordPageWidget> {
  ///  Local state fields for this page.

  Color? container1color = const Color(0xff393e48);

  Color? contaner3Color = const Color(0xff393e48);

  Color? container2Color = const Color(0xffe7bd87);

  Color? text1 = const Color(0xff919191);

  Color? text3 = const Color(0xff919191);

  Color? text2 = const Color(0xff000000);

  bool record = false;

  ///  State fields for stateful widgets in this page.

  // Model for BootomNavigationComponent component.
  late BootomNavigationComponentModel bootomNavigationComponentModel;
  // State field(s) for PageView widget.
  PageController? pageViewController;

  int get pageViewCurrentIndex => pageViewController != null &&
          pageViewController!.hasClients &&
          pageViewController!.page != null
      ? pageViewController!.page!.round()
      : 0;
  AudioRecorder? audioRecorder1;
  String? recordedAudio;
  FFUploadedFile recordedFileBytes1 =
      FFUploadedFile(bytes: Uint8List.fromList([]));
  // Stores action output result for [Custom Action - bytesFromAudioPath] action in Icon widget.
  FFUploadedFile? mp3;
  // Stores action output result for [Backend Call - API (speeechToText)] action in Icon widget.
  ApiCallResponse? transcriptWhisperAPI;
  // Stores action output result for [Backend Call - API (textToTextJsonProfile)] action in Icon widget.
  ApiCallResponse? apiJson;
  // Stores action output result for [Custom Action - extractGiveValues] action in Icon widget.
  List<ValuesStruct>? giveValues;
  // Stores action output result for [Custom Action - extractTakeValues] action in Icon widget.
  List<ValuesStruct>? takeValues;
  AudioRecorder? audioRecorder2;
  String? recordedAudioSecond;
  FFUploadedFile recordedFileBytes2 =
      FFUploadedFile(bytes: Uint8List.fromList([]));
  // Stores action output result for [Custom Action - bytesFromAudioPath] action in Icon widget.
  FFUploadedFile? mp3Copy;
  // Stores action output result for [Backend Call - API (speeechToText)] action in Icon widget.
  ApiCallResponse? transcriptWhisperAPICopy;
  // Stores action output result for [Backend Call - API (diaryNoteGeneratorJson)] action in Icon widget.
  ApiCallResponse? listOfNotesJson;
  // Stores action output result for [Custom Action - extractNotesFromJson] action in Icon widget.
  List<NoteStruct>? listOfNotes;

  @override
  void initState(BuildContext context) {
    bootomNavigationComponentModel =
        createModel(context, () => BootomNavigationComponentModel());
  }

  @override
  void dispose() {
    bootomNavigationComponentModel.dispose();
  }
}
