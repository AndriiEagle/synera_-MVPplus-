import '/backend/api_requests/api_calls.dart';
import '/components/navigation/bootom_navigation_component/bootom_navigation_component_widget.dart';
import '/flutter_flow/flutter_flow_util.dart';
import 'potnential_mutual_benifits_page_widget.dart'
    show PotnentialMutualBenifitsPageWidget;
import 'package:flutter/material.dart';

class PotnentialMutualBenifitsPageModel
    extends FlutterFlowModel<PotnentialMutualBenifitsPageWidget> {
  ///  Local state fields for this page.

  String? aiBetaAnswer;

  ///  State fields for stateful widgets in this page.

  // Stores action output result for [Backend Call - API (AiMatchBeta)] action in GenerateContainer widget.
  ApiCallResponse? apiResultb4h;
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
