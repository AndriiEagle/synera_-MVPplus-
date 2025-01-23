import '/components/navigation/bootom_navigation_component/bootom_navigation_component_widget.dart';
import '/flutter_flow/flutter_flow_util.dart';
import 'photos_private_page_widget.dart' show PhotosPrivatePageWidget;
import 'package:flutter/material.dart';

class PhotosPrivatePageModel extends FlutterFlowModel<PhotosPrivatePageWidget> {
  ///  State fields for stateful widgets in this page.

  bool isDataUploading = false;
  FFUploadedFile uploadedLocalFile =
      FFUploadedFile(bytes: Uint8List.fromList([]));
  String uploadedFileUrl = '';

  // Model for BootomNavigationComponent component.
  late BootomNavigationComponentModel bootomNavigationComponentModel;

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
