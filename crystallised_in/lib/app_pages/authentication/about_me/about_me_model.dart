import '/backend/api_requests/api_calls.dart';
import '/flutter_flow/flutter_flow_util.dart';
import 'about_me_widget.dart' show AboutMeWidget;
import 'package:flutter/material.dart';
import 'package:record/record.dart';

class AboutMeModel extends FlutterFlowModel<AboutMeWidget> {
  ///  Local state fields for this page.

  bool record = false;

  ///  State fields for stateful widgets in this page.

  AudioRecorder? audioRecorder;
  String? audioOutput;
  FFUploadedFile recordedFileBytes =
      FFUploadedFile(bytes: Uint8List.fromList([]));
  // Stores action output result for [Custom Action - bytesFromAudioPath] action in Icon widget.
  FFUploadedFile? mp3;
  // Stores action output result for [Backend Call - API (speeechToText)] action in Icon widget.
  ApiCallResponse? whisper;
  // Stores action output result for [Backend Call - API (textToTextAboutMe)] action in Icon widget.
  ApiCallResponse? aboutMe;

  @override
  void initState(BuildContext context) {}

  @override
  void dispose() {}
}
