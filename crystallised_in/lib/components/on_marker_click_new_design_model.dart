import '/components/navigation/bootom_navigation_component/bootom_navigation_component_widget.dart';
import '/flutter_flow/flutter_flow_util.dart';
import 'on_marker_click_new_design_widget.dart'
    show OnMarkerClickNewDesignWidget;
import 'package:flutter/material.dart';

class OnMarkerClickNewDesignModel
    extends FlutterFlowModel<OnMarkerClickNewDesignWidget> {
  ///  State fields for stateful widgets in this component.

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
