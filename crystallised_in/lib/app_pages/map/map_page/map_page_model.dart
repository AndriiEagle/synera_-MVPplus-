import '/backend/backend.dart';
import '/components/navigation/bootom_navigation_component/bootom_navigation_component_widget.dart';
import '/components/new_design_spheres_filter/new_design_spheres_filter_widget.dart';
import '/flutter_flow/flutter_flow_google_map.dart';
import '/flutter_flow/flutter_flow_util.dart';
import 'map_page_widget.dart' show MapPageWidget;
import 'package:flutter/material.dart';

class MapPageModel extends FlutterFlowModel<MapPageWidget> {
  ///  Local state fields for this page.

  CustomMarkerRecord? place;

  ///  State fields for stateful widgets in this page.

  // State field(s) for GoogleMap widget.
  LatLng? googleMapsCenter;
  final googleMapsController = Completer<GoogleMapController>();
  // Model for BootomNavigationComponent component.
  late BootomNavigationComponentModel bootomNavigationComponentModel;
  // Model for NewDesignSpheresFilter component.
  late NewDesignSpheresFilterModel newDesignSpheresFilterModel;

  @override
  void initState(BuildContext context) {
    bootomNavigationComponentModel =
        createModel(context, () => BootomNavigationComponentModel());
    newDesignSpheresFilterModel =
        createModel(context, () => NewDesignSpheresFilterModel());
  }

  @override
  void dispose() {
    bootomNavigationComponentModel.dispose();
    newDesignSpheresFilterModel.dispose();
  }

  /// Action blocks.
  Future actionBlockTest(BuildContext context) async {}
}
