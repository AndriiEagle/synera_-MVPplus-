import '/components/navigation/bootom_navigation_component/bootom_navigation_component_widget.dart';
import '/flutter_flow/flutter_flow_util.dart';
import 'optimizer_page_widget.dart' show OptimizerPageWidget;
import 'package:flutter/material.dart';

class OptimizerPageModel extends FlutterFlowModel<OptimizerPageWidget> {
  ///  Local state fields for this page.

  bool analysisDivider = false;

  bool diariesDivider = true;

  Color? colorOn = const Color(0xffe7bd87);

  Color? colorOf = const Color(0xff919191);

  ///  State fields for stateful widgets in this page.

  // State field(s) for PageView widget.
  PageController? pageViewController;

  int get pageViewCurrentIndex => pageViewController != null &&
          pageViewController!.hasClients &&
          pageViewController!.page != null
      ? pageViewController!.page!.round()
      : 0;
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
