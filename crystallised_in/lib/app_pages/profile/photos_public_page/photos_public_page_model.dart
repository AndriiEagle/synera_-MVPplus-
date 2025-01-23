import '/components/navigation/bootom_navigation_component/bootom_navigation_component_widget.dart';
import '/flutter_flow/flutter_flow_util.dart';
import 'photos_public_page_widget.dart' show PhotosPublicPageWidget;
import 'package:flutter/material.dart';

class PhotosPublicPageModel extends FlutterFlowModel<PhotosPublicPageWidget> {
  ///  State fields for stateful widgets in this page.

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
