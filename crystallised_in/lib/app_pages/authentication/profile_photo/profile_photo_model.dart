import '/flutter_flow/flutter_flow_util.dart';
import 'profile_photo_widget.dart' show ProfilePhotoWidget;
import 'package:flutter/material.dart';

class ProfilePhotoModel extends FlutterFlowModel<ProfilePhotoWidget> {
  ///  Local state fields for this page.

  bool imageUpload = false;

  ///  State fields for stateful widgets in this page.

  bool isDataUploading1 = false;
  FFUploadedFile uploadedLocalFile1 =
      FFUploadedFile(bytes: Uint8List.fromList([]));

  bool isDataUploading2 = false;
  FFUploadedFile uploadedLocalFile2 =
      FFUploadedFile(bytes: Uint8List.fromList([]));
  String uploadedFileUrl2 = '';

  @override
  void initState(BuildContext context) {}

  @override
  void dispose() {}
}
