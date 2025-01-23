import '/components/navigation/bootom_navigation_component/bootom_navigation_component_widget.dart';
import '/flutter_flow/flutter_flow_util.dart';
import 'diaries_page_widget.dart' show DiariesPageWidget;
import 'package:flutter/material.dart';

class DiariesPageModel extends FlutterFlowModel<DiariesPageWidget> {
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
