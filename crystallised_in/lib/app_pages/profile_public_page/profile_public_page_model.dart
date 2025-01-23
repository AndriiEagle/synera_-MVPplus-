import '/components/match_widget.dart';
import '/components/navigation/bootom_navigation_component/bootom_navigation_component_widget.dart';
import '/flutter_flow/flutter_flow_util.dart';
import 'profile_public_page_widget.dart' show ProfilePublicPageWidget;
import 'package:carousel_slider/carousel_slider.dart'as carousel_slider;
import 'package:flutter/material.dart';

class ProfilePublicPageModel extends FlutterFlowModel<ProfilePublicPageWidget> {
  ///  Local state fields for this page.

  bool changePhoto = false;

  bool seeAll = false;

  ///  State fields for stateful widgets in this page.

  // Model for Match component.
  late MatchModel matchModel;
  // State field(s) for Carousel widget.
  CarouselController? carouselController;
  int carouselCurrentIndex = 1;

  // Model for BootomNavigationComponent component.
  late BootomNavigationComponentModel bootomNavigationComponentModel;

  @override
  void initState(BuildContext context) {
    matchModel = createModel(context, () => MatchModel());
    bootomNavigationComponentModel =
        createModel(context, () => BootomNavigationComponentModel());
  }

  @override
  void dispose() {
    matchModel.dispose();
    bootomNavigationComponentModel.dispose();
  }
}
