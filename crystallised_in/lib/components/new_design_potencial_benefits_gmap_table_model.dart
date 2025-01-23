import '/components/navigation/bootom_navigation_component/bootom_navigation_component_widget.dart';
import '/flutter_flow/flutter_flow_util.dart';
import 'new_design_potencial_benefits_gmap_table_widget.dart'
    show NewDesignPotencialBenefitsGmapTableWidget;
import 'package:flutter/material.dart';

class NewDesignPotencialBenefitsGmapTableModel
    extends FlutterFlowModel<NewDesignPotencialBenefitsGmapTableWidget> {
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
