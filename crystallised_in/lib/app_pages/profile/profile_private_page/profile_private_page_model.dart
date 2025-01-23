import '/components/navigation/bootom_navigation_component/bootom_navigation_component_widget.dart';
import '/components/navigation/top_navigation/top_navigation_widget.dart';
import '/flutter_flow/flutter_flow_util.dart';
import 'profile_private_page_widget.dart' show ProfilePrivatePageWidget;
import 'package:carousel_slider/carousel_slider.dart' as carousel_slider;
import 'package:flutter/material.dart';

class ProfilePrivatePageModel
    extends FlutterFlowModel<ProfilePrivatePageWidget> {
  ///  Local state fields for this page.

  bool changePhoto = false;

  bool seeAll = false;

  ///  State fields for stateful widgets in this page.

  // Model for TopNavigation component.
  late TopNavigationModel topNavigationModel;
  // State field(s) for Carousel widget.
  carousel_slider.CarouselController? carouselController;

  int carouselCurrentIndex = 1;

  // Model for BootomNavigationComponent component.
  late BootomNavigationComponentModel bootomNavigationComponentModel;

  @override
  void initState(BuildContext context) {
    topNavigationModel = createModel(context, () => TopNavigationModel());
    bootomNavigationComponentModel =
        createModel(context, () => BootomNavigationComponentModel());
    carouselController = carousel_slider.CarouselController();
  }

  @override
  void dispose() {
    topNavigationModel.dispose();
    bootomNavigationComponentModel.dispose();
  }
}
