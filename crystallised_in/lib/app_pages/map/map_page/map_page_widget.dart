import '/auth/firebase_auth/auth_util.dart';
import '/backend/backend.dart';
import '/components/navigation/bootom_navigation_component/bootom_navigation_component_widget.dart';
import '/components/new_design_spheres_filter/new_design_spheres_filter_widget.dart';
import '/components/on_marker_click_new_design_widget.dart';
import '/flutter_flow/flutter_flow_google_map.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/custom_functions.dart' as functions;
import 'package:aligned_dialog/aligned_dialog.dart';
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';
import 'package:provider/provider.dart';
import 'map_page_model.dart';
export 'map_page_model.dart';

class MapPageWidget extends StatefulWidget {
  const MapPageWidget({
    super.key,
    required this.jasonStethem,
  });

  final dynamic jasonStethem;

  @override
  State<MapPageWidget> createState() => _MapPageWidgetState();
}

class _MapPageWidgetState extends State<MapPageWidget> {
  late MapPageModel _model;

  final scaffoldKey = GlobalKey<ScaffoldState>();
  LatLng? currentUserLocationValue;

  @override
  void initState() {
    super.initState();
    _model = createModel(context, () => MapPageModel());

    // On page load action.
    SchedulerBinding.instance.addPostFrameCallback((_) async {
      currentUserLocationValue =
          await getCurrentUserLocation(defaultLocation: const LatLng(0.0, 0.0));

      await LocationsRecord.createDoc(currentUserReference!)
          .set(createLocationsRecordData(
        latitudeLongitude: currentUserLocationValue,
        updatedAt: dateTimeFromSecondsSinceEpoch(
            getCurrentTimestamp.secondsSinceEpoch),
      ));
      FFAppState().FilterbySpherersForGmap = [];
      safeSetState(() {});
    });

    getCurrentUserLocation(defaultLocation: const LatLng(0.0, 0.0), cached: true)
        .then((loc) => safeSetState(() => currentUserLocationValue = loc));
    WidgetsBinding.instance.addPostFrameCallback((_) => safeSetState(() {}));
  }

  @override
  void dispose() {
    _model.dispose();

    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    context.watch<FFAppState>();
    if (currentUserLocationValue == null) {
      return Container(
        color: FlutterFlowTheme.of(context).primaryBackground,
        child: Center(
          child: SizedBox(
            width: 50.0,
            height: 50.0,
            child: SpinKitFadingCircle(
              color: FlutterFlowTheme.of(context).primary,
              size: 50.0,
            ),
          ),
        ),
      );
    }

    return GestureDetector(
      onTap: () => FocusScope.of(context).unfocus(),
      child: Scaffold(
        key: scaffoldKey,
        resizeToAvoidBottomInset: false,
        body: SafeArea(
          top: true,
          child: Align(
            alignment: const AlignmentDirectional(0.0, 0.0),
            child: Stack(
              alignment: const AlignmentDirectional(0.0, 0.0),
              children: [
                Align(
                  alignment: const AlignmentDirectional(0.0, 0.0),
                  child: Stack(
                    alignment: const AlignmentDirectional(0.0, 0.0),
                    children: [
                      Align(
                        alignment: const AlignmentDirectional(0.0, 0.0),
                        child: Column(
                          mainAxisSize: MainAxisSize.max,
                          children: [
                            Expanded(
                              child: Builder(
                                builder: (context) => FlutterFlowGoogleMap(
                                  controller: _model.googleMapsController,
                                  onCameraIdle: (latLng) => safeSetState(
                                      () => _model.googleMapsCenter = latLng),
                                  initialLocation: _model.googleMapsCenter ??=
                                      currentUserLocationValue!,
                                  markers: (functions
                                              .jsonListFilteredByGiveTake(
                                                  getJsonField(
                                                    FFAppState()
                                                        .jsonUsersAppstate,
                                                    r'''$.users''',
                                                  ),
                                                  FFAppState()
                                                      .ListGiveTakeValuesforFilteronGmap
                                                      .toList(),
                                                  FFAppState()
                                                      .ListTAKEvaluesForFilterGmap
                                                      .toList()) ??
                                          [])
                                      .map(
                                        (marker) => FlutterFlowMarker(
                                          marker.serialize(),
                                          marker,
                                          () async {
                                            await showAlignedDialog(
                                              context: context,
                                              isGlobal: false,
                                              avoidOverflow: true,
                                              targetAnchor:
                                                  const AlignmentDirectional(
                                                          0.0, -1.0)
                                                      .resolve(
                                                          Directionality.of(
                                                              context)),
                                              followerAnchor:
                                                  const AlignmentDirectional(
                                                          0.0, -1.0)
                                                      .resolve(
                                                          Directionality.of(
                                                              context)),
                                              builder: (dialogContext) {
                                                return Material(
                                                  color: Colors.transparent,
                                                  child: GestureDetector(
                                                    onTap: () => FocusScope.of(
                                                            dialogContext)
                                                        .unfocus(),
                                                    child: SizedBox(
                                                      height: MediaQuery.sizeOf(
                                                                  context)
                                                              .height *
                                                          1.0,
                                                      width: MediaQuery.sizeOf(
                                                                  context)
                                                              .width *
                                                          1.0,
                                                      child:
                                                          OnMarkerClickNewDesignWidget(
                                                        jsonOnMarker: functions
                                                            .findObjectByLatLng(
                                                                getJsonField(
                                                                  widget
                                                                      .jasonStethem,
                                                                  r'''$.users''',
                                                                ),
                                                                _model
                                                                    .googleMapsCenter)!,
                                                      ),
                                                    ),
                                                  ),
                                                );
                                              },
                                            );
                                          },
                                        ),
                                      )
                                      .toList(),
                                  markerColor: GoogleMarkerColor.violet,
                                  markerImage: const MarkerImage(
                                    imagePath: 'assets/images/Icon_beacon.svg',
                                    isAssetImage: true,
                                    size: 50.0 ?? 20,
                                  ),
                                  mapType: MapType.normal,
                                  style: GoogleMapStyle.night,
                                  initialZoom: 10.0,
                                  allowInteraction: true,
                                  allowZoom: true,
                                  showZoomControls: false,
                                  showLocation: true,
                                  showCompass: false,
                                  showMapToolbar: false,
                                  showTraffic: false,
                                  centerMapOnMarkerTap: true,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      Align(
                        alignment: const AlignmentDirectional(0.0, 1.0),
                        child: wrapWithModel(
                          model: _model.bootomNavigationComponentModel,
                          updateCallback: () => safeSetState(() {}),
                          child: const BootomNavigationComponentWidget(
                            selectedPageIndex: 3,
                            hidden: false,
                          ),
                        ),
                      ),
                      wrapWithModel(
                        model: _model.newDesignSpheresFilterModel,
                        updateCallback: () => safeSetState(() {}),
                        child: const NewDesignSpheresFilterWidget(),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
