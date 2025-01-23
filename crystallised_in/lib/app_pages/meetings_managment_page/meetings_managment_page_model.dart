import '/components/navigation/bootom_navigation_component/bootom_navigation_component_widget.dart';
import '/flutter_flow/flutter_flow_util.dart';
import 'meetings_managment_page_widget.dart' show MeetingsManagmentPageWidget;
import 'package:flutter/material.dart';

class MeetingsManagmentPageModel
    extends FlutterFlowModel<MeetingsManagmentPageWidget> {
  ///  Local state fields for this page.

  Color? container1color = const Color(0xff393e48);

  Color? contaner3Color = const Color(0xff393e48);

  Color? container2Color = const Color(0xffe7bd87);

  Color? text1 = const Color(0xff919191);

  Color? text3 = const Color(0xff919191);

  Color? text2 = const Color(0xff000000);

  ///  State fields for stateful widgets in this page.

  // Model for BootomNavigationComponent component.
  late BootomNavigationComponentModel bootomNavigationComponentModel;
  // State field(s) for PageView widget.
  PageController? pageViewController;

  int get pageViewCurrentIndex => pageViewController != null &&
          pageViewController!.hasClients &&
          pageViewController!.page != null
      ? pageViewController!.page!.round()
      : 0;

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
