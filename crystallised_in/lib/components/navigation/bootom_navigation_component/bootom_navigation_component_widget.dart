import '/auth/firebase_auth/auth_util.dart';
import '/backend/api_requests/api_calls.dart';
import '/flutter_flow/flutter_flow_animations.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import 'dart:async';
import '/flutter_flow/custom_functions.dart' as functions;
import '/flutter_flow/permissions_util.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:provider/provider.dart';
import 'bootom_navigation_component_model.dart';
export 'bootom_navigation_component_model.dart';

class BootomNavigationComponentWidget extends StatefulWidget {
  const BootomNavigationComponentWidget({
    super.key,
    int? selectedPageIndex,
    bool? hidden,
  })  : selectedPageIndex = selectedPageIndex ?? 1,
        hidden = hidden ?? false;

  final int selectedPageIndex;
  final bool hidden;

  @override
  State<BootomNavigationComponentWidget> createState() =>
      _BootomNavigationComponentWidgetState();
}

class _BootomNavigationComponentWidgetState
    extends State<BootomNavigationComponentWidget>
    with TickerProviderStateMixin {
  late BootomNavigationComponentModel _model;

  final animationsMap = <String, AnimationInfo>{};

  @override
  void setState(VoidCallback callback) {
    super.setState(callback);
    _model.onUpdate();
  }

  @override
  void initState() {
    super.initState();
    _model = createModel(context, () => BootomNavigationComponentModel());

    animationsMap.addAll({
      'containerOnPageLoadAnimation1': AnimationInfo(
        trigger: AnimationTrigger.onPageLoad,
        effectsBuilder: () => [
          ScaleEffect(
            curve: Curves.easeInOut,
            delay: 0.0.ms,
            duration: 150.0.ms,
            begin: const Offset(0.5, 1.0),
            end: const Offset(1.0, 1.0),
          ),
          FadeEffect(
            curve: Curves.easeInOut,
            delay: 0.0.ms,
            duration: 150.0.ms,
            begin: 0.0,
            end: 1.0,
          ),
        ],
      ),
      'containerOnPageLoadAnimation2': AnimationInfo(
        trigger: AnimationTrigger.onPageLoad,
        effectsBuilder: () => [
          ScaleEffect(
            curve: Curves.easeInOut,
            delay: 0.0.ms,
            duration: 150.0.ms,
            begin: const Offset(0.5, 1.0),
            end: const Offset(1.0, 1.0),
          ),
          FadeEffect(
            curve: Curves.easeInOut,
            delay: 0.0.ms,
            duration: 150.0.ms,
            begin: 0.0,
            end: 1.0,
          ),
        ],
      ),
      'containerOnPageLoadAnimation3': AnimationInfo(
        trigger: AnimationTrigger.onPageLoad,
        effectsBuilder: () => [
          ScaleEffect(
            curve: Curves.easeInOut,
            delay: 0.0.ms,
            duration: 150.0.ms,
            begin: const Offset(0.5, 1.0),
            end: const Offset(1.0, 1.0),
          ),
          FadeEffect(
            curve: Curves.easeInOut,
            delay: 0.0.ms,
            duration: 150.0.ms,
            begin: 0.0,
            end: 1.0,
          ),
        ],
      ),
      'containerOnPageLoadAnimation4': AnimationInfo(
        trigger: AnimationTrigger.onPageLoad,
        effectsBuilder: () => [
          ScaleEffect(
            curve: Curves.easeInOut,
            delay: 0.0.ms,
            duration: 150.0.ms,
            begin: const Offset(0.5, 1.0),
            end: const Offset(1.0, 1.0),
          ),
          FadeEffect(
            curve: Curves.easeInOut,
            delay: 0.0.ms,
            duration: 150.0.ms,
            begin: 0.0,
            end: 1.0,
          ),
        ],
      ),
      'containerOnPageLoadAnimation5': AnimationInfo(
        trigger: AnimationTrigger.onPageLoad,
        effectsBuilder: () => [
          ScaleEffect(
            curve: Curves.easeInOut,
            delay: 0.0.ms,
            duration: 150.0.ms,
            begin: const Offset(0.5, 1.0),
            end: const Offset(1.0, 1.0),
          ),
          FadeEffect(
            curve: Curves.easeInOut,
            delay: 0.0.ms,
            duration: 150.0.ms,
            begin: 0.0,
            end: 1.0,
          ),
        ],
      ),
    });

    WidgetsBinding.instance.addPostFrameCallback((_) => safeSetState(() {}));
  }

  @override
  void dispose() {
    _model.maybeDispose();

    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    context.watch<FFAppState>();

    return Padding(
      padding: const EdgeInsetsDirectional.fromSTEB(15.0, 0.0, 15.0, 15.0),
      child: Container(
        height: 72.0,
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFF2B3138), Color(0xFF2A3137)],
            stops: [0.0, 1.0],
            begin: AlignmentDirectional(1.0, 1.0),
            end: AlignmentDirectional(-1.0, -1.0),
          ),
          borderRadius: BorderRadius.circular(24.0),
        ),
        alignment: const AlignmentDirectional(0.0, 0.0),
        child: Row(
          mainAxisSize: MainAxisSize.max,
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Align(
              alignment: const AlignmentDirectional(0.0, 0.0),
              child: Container(
                width: 66.0,
                height: MediaQuery.sizeOf(context).height * 1.0,
                decoration: const BoxDecoration(),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  mainAxisAlignment: MainAxisAlignment.start,
                  children: [
                    if (widget.selectedPageIndex == 1)
                      Container(
                        width: 50.0,
                        height: 3.0,
                        decoration: const BoxDecoration(
                          color: Color(0xFFE7BD87),
                          boxShadow: [
                            BoxShadow(
                              blurRadius: 15.0,
                              color: Color(0xFFE7BD87),
                              offset: Offset(
                                0.0,
                                5.0,
                              ),
                            )
                          ],
                          borderRadius: BorderRadius.only(
                            bottomLeft: Radius.circular(40.0),
                            bottomRight: Radius.circular(40.0),
                            topLeft: Radius.circular(0.0),
                            topRight: Radius.circular(0.0),
                          ),
                        ),
                      ).animateOnPageLoad(
                          animationsMap['containerOnPageLoadAnimation1']!),
                    Opacity(
                      opacity: widget.selectedPageIndex == 1 ? 1.0 : 0.5,
                      child: Padding(
                        padding:
                            const EdgeInsetsDirectional.fromSTEB(0.0, 20.0, 0.0, 0.0),
                        child: InkWell(
                          splashColor: Colors.transparent,
                          focusColor: Colors.transparent,
                          hoverColor: Colors.transparent,
                          highlightColor: Colors.transparent,
                          onTap: () async {
                            context.pushNamed(
                              'ProfilePrivatePage',
                              extra: <String, dynamic>{
                                kTransitionInfoKey: const TransitionInfo(
                                  hasTransition: true,
                                  transitionType: PageTransitionType.fade,
                                  duration: Duration(milliseconds: 0),
                                ),
                              },
                            );
                          },
                          child: const FaIcon(
                            FontAwesomeIcons.userAlt,
                            color: Color(0xFFE7BD87),
                            size: 30.0,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            Align(
              alignment: const AlignmentDirectional(0.0, 0.0),
              child: Container(
                width: 66.0,
                height: MediaQuery.sizeOf(context).height * 1.0,
                decoration: const BoxDecoration(),
                child: Padding(
                  padding: const EdgeInsetsDirectional.fromSTEB(0.0, 0.0, 0.0, 4.0),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    mainAxisAlignment: MainAxisAlignment.start,
                    children: [
                      if (widget.selectedPageIndex == 2)
                        Container(
                          width: 50.0,
                          height: 3.0,
                          decoration: const BoxDecoration(
                            color: Color(0xFFE7BD87),
                            boxShadow: [
                              BoxShadow(
                                blurRadius: 15.0,
                                color: Color(0xFFE7BD87),
                                offset: Offset(
                                  0.0,
                                  5.0,
                                ),
                              )
                            ],
                            borderRadius: BorderRadius.only(
                              bottomLeft: Radius.circular(40.0),
                              bottomRight: Radius.circular(40.0),
                              topLeft: Radius.circular(0.0),
                              topRight: Radius.circular(0.0),
                            ),
                          ),
                        ).animateOnPageLoad(
                            animationsMap['containerOnPageLoadAnimation2']!),
                      Opacity(
                        opacity: widget.selectedPageIndex == 2 ? 1.0 : 0.5,
                        child: Align(
                          alignment: const AlignmentDirectional(0.0, 0.0),
                          child: Padding(
                            padding: const EdgeInsetsDirectional.fromSTEB(
                                0.0, 20.0, 0.0, 0.0),
                            child: FFButtonWidget(
                              onPressed: () async {
                                _model.cloudoutPutCopy =
                                    await FuncForDiariesForLoggedUserCall.call(
                                  auth: currentUserReference?.id,
                                );

                                FFAppState().BalanceAnalisysList = functions
                                    .balanceDeviationsProcentage(FFAppState()
                                        .listOfDieariesAmount
                                        .toList())!
                                    .toList()
                                    .cast<double>();
                                FFAppState().update(() {});
                                FFAppState().removeNegativeSignsForDiaryAnalis =
                                    functions
                                        .removeNegativeSigns(FFAppState()
                                            .BalanceAnalisysList
                                            .toList())
                                        .toList()
                                        .cast<double>();
                                FFAppState().update(() {});
                                FFAppState().ListProgreBarPercentageValues =
                                    functions
                                        .limitValues(FFAppState()
                                            .removeNegativeSignsForDiaryAnalis
                                            .toList())
                                        .toList()
                                        .cast<double>();
                                FFAppState().update(() {});
                                if ((_model.cloudoutPutCopy?.succeeded ??
                                        true) ==
                                    true) {
                                  FFAppState().listOfDieariesAmount = functions
                                      .countSphereOfLife(
                                          (_model.cloudoutPutCopy?.jsonBody ??
                                              ''))
                                      .toList()
                                      .cast<int>();
                                  FFAppState().update(() {});
                                } else {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      content: Text(
                                        'Cloud was lazy',
                                        style: TextStyle(
                                          color: FlutterFlowTheme.of(context)
                                              .primaryText,
                                        ),
                                      ),
                                      duration: const Duration(milliseconds: 4750),
                                      backgroundColor:
                                          FlutterFlowTheme.of(context)
                                              .secondary,
                                    ),
                                  );
                                }

                                context.pushNamed('OptimizerPage');

                                safeSetState(() {});
                              },
                              text: FFLocalizations.of(context).getText(
                                '0h8odf1l' /*  */,
                              ),
                              icon: const Icon(
                                FFIcons.k3f4zbtozihpm0vfi79e,
                                color: Color(0xFFE7BD87),
                                size: 30.0,
                              ),
                              options: FFButtonOptions(
                                width: 30.0,
                                height: 30.0,
                                padding: const EdgeInsetsDirectional.fromSTEB(
                                    0.0, 0.0, 0.0, 0.0),
                                iconPadding: const EdgeInsetsDirectional.fromSTEB(
                                    0.0, 0.0, 0.0, 0.0),
                                color: const Color(0x00984BB6),
                                textStyle: FlutterFlowTheme.of(context)
                                    .titleSmall
                                    .override(
                                      fontFamily: 'Montserrat',
                                      color: Colors.white,
                                      letterSpacing: 0.0,
                                    ),
                                elevation: 55.0,
                                borderSide: const BorderSide(
                                  color: Colors.transparent,
                                  width: 1.0,
                                ),
                                borderRadius: BorderRadius.circular(8.0),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            Align(
              alignment: const AlignmentDirectional(0.0, 0.0),
              child: Container(
                width: 66.0,
                height: MediaQuery.sizeOf(context).height * 1.0,
                decoration: const BoxDecoration(),
                child: Padding(
                  padding: const EdgeInsetsDirectional.fromSTEB(0.0, 0.0, 0.0, 3.0),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    mainAxisAlignment: MainAxisAlignment.start,
                    children: [
                      if (widget.selectedPageIndex == 3)
                        Container(
                          width: 50.0,
                          height: 3.0,
                          decoration: const BoxDecoration(
                            color: Color(0xFFE7BD87),
                            boxShadow: [
                              BoxShadow(
                                blurRadius: 15.0,
                                color: Color(0xFFE7BD87),
                                offset: Offset(
                                  0.0,
                                  5.0,
                                ),
                              )
                            ],
                            borderRadius: BorderRadius.only(
                              bottomLeft: Radius.circular(40.0),
                              bottomRight: Radius.circular(40.0),
                              topLeft: Radius.circular(0.0),
                              topRight: Radius.circular(0.0),
                            ),
                          ),
                        ).animateOnPageLoad(
                            animationsMap['containerOnPageLoadAnimation3']!),
                      Opacity(
                        opacity: widget.selectedPageIndex == 3 ? 1.0 : 0.5,
                        child: Align(
                          alignment: const AlignmentDirectional(0.0, 0.0),
                          child: Padding(
                            padding: const EdgeInsetsDirectional.fromSTEB(
                                0.0, 20.0, 0.0, 0.0),
                            child: FFButtonWidget(
                              onPressed: () async {
                                _model.jasonStethemOutputCopy =
                                    await CloudFunctionForLocationCall.call();

                                FFAppState().jsonUsersAppstate =
                                    (_model.jasonStethemOutputCopy?.jsonBody ??
                                        '');
                                safeSetState(() {});
                                await Future.wait([
                                  Future(() async {
                                    context.pushNamed(
                                      'MapPage',
                                      queryParameters: {
                                        'jasonStethem': serializeParam(
                                          (_model.jasonStethemOutputCopy
                                                  ?.jsonBody ??
                                              ''),
                                          ParamType.JSON,
                                        ),
                                      }.withoutNulls,
                                    );
                                  }),
                                  Future(() async {
                                    unawaited(
                                      () async {
                                        await requestPermission(
                                            locationPermission);
                                      }(),
                                    );
                                  }),
                                ]);

                                safeSetState(() {});
                              },
                              text: FFLocalizations.of(context).getText(
                                'jg9jln8l' /*  */,
                              ),
                              icon: const Icon(
                                FFIcons.kmapIcon,
                                color: Color(0xFFE7BD87),
                                size: 30.0,
                              ),
                              options: FFButtonOptions(
                                width: 30.0,
                                height: 30.0,
                                padding: const EdgeInsetsDirectional.fromSTEB(
                                    0.0, 0.0, 0.0, 0.0),
                                iconPadding: const EdgeInsetsDirectional.fromSTEB(
                                    0.0, 0.0, 0.0, 0.0),
                                color: const Color(0x00984BB6),
                                textStyle: FlutterFlowTheme.of(context)
                                    .titleSmall
                                    .override(
                                      fontFamily: 'Montserrat',
                                      color: Colors.white,
                                      letterSpacing: 0.0,
                                    ),
                                elevation: 55.0,
                                borderSide: const BorderSide(
                                  color: Colors.transparent,
                                  width: 1.0,
                                ),
                                borderRadius: BorderRadius.circular(8.0),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            Align(
              alignment: const AlignmentDirectional(0.0, 0.0),
              child: Container(
                width: 66.0,
                height: MediaQuery.sizeOf(context).height * 1.0,
                decoration: const BoxDecoration(),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  mainAxisAlignment: MainAxisAlignment.start,
                  children: [
                    if (widget.selectedPageIndex == 4)
                      Container(
                        width: 50.0,
                        height: 3.0,
                        decoration: const BoxDecoration(
                          color: Color(0xFFE7BD87),
                          boxShadow: [
                            BoxShadow(
                              blurRadius: 15.0,
                              color: Color(0xFFE7BD87),
                              offset: Offset(
                                0.0,
                                5.0,
                              ),
                            )
                          ],
                          borderRadius: BorderRadius.only(
                            bottomLeft: Radius.circular(40.0),
                            bottomRight: Radius.circular(40.0),
                            topLeft: Radius.circular(0.0),
                            topRight: Radius.circular(0.0),
                          ),
                        ),
                      ).animateOnPageLoad(
                          animationsMap['containerOnPageLoadAnimation4']!),
                    Opacity(
                      opacity: FFAppState().RecordOptionsComponent ||
                              FFAppState().RecordComponentProfile ||
                              FFAppState().RecordComponentDiary
                          ? 1.0
                          : 0.5,
                      child: Padding(
                        padding:
                            const EdgeInsetsDirectional.fromSTEB(0.0, 20.0, 0.0, 0.0),
                        child: InkWell(
                          splashColor: Colors.transparent,
                          focusColor: Colors.transparent,
                          hoverColor: Colors.transparent,
                          highlightColor: Colors.transparent,
                          onTap: () async {
                            context.pushNamed('RecordPage');
                          },
                          child: const Icon(
                            FFIcons.k2dlsv93n1em0vgpip3,
                            color: Color(0xFFE7BD87),
                            size: 30.0,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            Align(
              alignment: const AlignmentDirectional(0.0, 0.0),
              child: Container(
                width: 66.0,
                height: MediaQuery.sizeOf(context).height * 1.0,
                decoration: const BoxDecoration(),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  mainAxisAlignment: MainAxisAlignment.start,
                  children: [
                    if (widget.selectedPageIndex == 5)
                      Container(
                        width: 50.0,
                        height: 3.0,
                        decoration: const BoxDecoration(
                          color: Color(0xFFE7BD87),
                          boxShadow: [
                            BoxShadow(
                              blurRadius: 15.0,
                              color: Color(0xFFE7BD87),
                              offset: Offset(
                                0.0,
                                5.0,
                              ),
                            )
                          ],
                          borderRadius: BorderRadius.only(
                            bottomLeft: Radius.circular(40.0),
                            bottomRight: Radius.circular(40.0),
                            topLeft: Radius.circular(0.0),
                            topRight: Radius.circular(0.0),
                          ),
                        ),
                      ).animateOnPageLoad(
                          animationsMap['containerOnPageLoadAnimation5']!),
                    Opacity(
                      opacity: FFAppState().RecordOptionsComponent ||
                              FFAppState().RecordComponentProfile ||
                              FFAppState().RecordComponentDiary
                          ? 1.0
                          : 0.5,
                      child: Padding(
                        padding:
                            const EdgeInsetsDirectional.fromSTEB(0.0, 20.0, 0.0, 0.0),
                        child: InkWell(
                          splashColor: Colors.transparent,
                          focusColor: Colors.transparent,
                          hoverColor: Colors.transparent,
                          highlightColor: Colors.transparent,
                          onTap: () async {
                            GoRouter.of(context).prepareAuthEvent();
                            await authManager.signOut();
                            GoRouter.of(context).clearRedirectLocation();

                            context.goNamedAuth(
                                'Authentication', context.mounted);
                          },
                          child: const Icon(
                            Icons.logout,
                            color: Color(0xFFE7BD87),
                            size: 30.0,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
