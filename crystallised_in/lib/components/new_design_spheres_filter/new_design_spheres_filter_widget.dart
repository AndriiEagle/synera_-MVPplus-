import '/components/g_map_values_table_widget.dart';
import '/flutter_flow/flutter_flow_animations.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import 'dart:ui';
import '/flutter_flow/custom_functions.dart' as functions;
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import 'new_design_spheres_filter_model.dart';
export 'new_design_spheres_filter_model.dart';

class NewDesignSpheresFilterWidget extends StatefulWidget {
  const NewDesignSpheresFilterWidget({super.key});

  @override
  State<NewDesignSpheresFilterWidget> createState() =>
      _NewDesignSpheresFilterWidgetState();
}

class _NewDesignSpheresFilterWidgetState
    extends State<NewDesignSpheresFilterWidget> with TickerProviderStateMixin {
  late NewDesignSpheresFilterModel _model;

  final animationsMap = <String, AnimationInfo>{};

  @override
  void setState(VoidCallback callback) {
    super.setState(callback);
    _model.onUpdate();
  }

  @override
  void initState() {
    super.initState();
    _model = createModel(context, () => NewDesignSpheresFilterModel());

    // On component load action.
    SchedulerBinding.instance.addPostFrameCallback((_) async {
      FFAppState().ListGiveTakeValuesforFilteronGmap = [];
      FFAppState().update(() {});
    });

    animationsMap.addAll({
      'circleImageOnPageLoadAnimation1': AnimationInfo(
        loop: true,
        reverse: true,
        trigger: AnimationTrigger.onPageLoad,
        effectsBuilder: () => [
          ScaleEffect(
            curve: Curves.easeInOut,
            delay: 0.0.ms,
            duration: 1010.0.ms,
            begin: const Offset(1.0, 1.0),
            end: const Offset(1.2, 1.2),
          ),
        ],
      ),
      'circleImageOnPageLoadAnimation2': AnimationInfo(
        loop: true,
        reverse: true,
        trigger: AnimationTrigger.onPageLoad,
        effectsBuilder: () => [
          ScaleEffect(
            curve: Curves.easeInOut,
            delay: 0.0.ms,
            duration: 1010.0.ms,
            begin: const Offset(1.0, 1.0),
            end: const Offset(1.2, 1.2),
          ),
        ],
      ),
      'circleImageOnPageLoadAnimation3': AnimationInfo(
        loop: true,
        reverse: true,
        trigger: AnimationTrigger.onPageLoad,
        effectsBuilder: () => [
          ScaleEffect(
            curve: Curves.easeInOut,
            delay: 0.0.ms,
            duration: 1010.0.ms,
            begin: const Offset(1.0, 1.0),
            end: const Offset(1.2, 1.2),
          ),
        ],
      ),
      'circleImageOnPageLoadAnimation4': AnimationInfo(
        loop: true,
        reverse: true,
        trigger: AnimationTrigger.onPageLoad,
        effectsBuilder: () => [
          ScaleEffect(
            curve: Curves.easeInOut,
            delay: 0.0.ms,
            duration: 1010.0.ms,
            begin: const Offset(1.0, 1.0),
            end: const Offset(1.2, 1.2),
          ),
        ],
      ),
      'circleImageOnPageLoadAnimation5': AnimationInfo(
        loop: true,
        reverse: true,
        trigger: AnimationTrigger.onPageLoad,
        effectsBuilder: () => [
          ScaleEffect(
            curve: Curves.easeInOut,
            delay: 0.0.ms,
            duration: 1010.0.ms,
            begin: const Offset(1.0, 1.0),
            end: const Offset(1.2, 1.2),
          ),
        ],
      ),
      'circleImageOnPageLoadAnimation6': AnimationInfo(
        loop: true,
        reverse: true,
        trigger: AnimationTrigger.onPageLoad,
        effectsBuilder: () => [
          ScaleEffect(
            curve: Curves.easeInOut,
            delay: 0.0.ms,
            duration: 1010.0.ms,
            begin: const Offset(1.0, 1.0),
            end: const Offset(1.2, 1.2),
          ),
        ],
      ),
      'circleImageOnPageLoadAnimation7': AnimationInfo(
        loop: true,
        reverse: true,
        trigger: AnimationTrigger.onPageLoad,
        effectsBuilder: () => [
          ScaleEffect(
            curve: Curves.easeInOut,
            delay: 0.0.ms,
            duration: 1010.0.ms,
            begin: const Offset(1.0, 1.0),
            end: const Offset(1.2, 1.2),
          ),
        ],
      ),
      'circleImageOnPageLoadAnimation8': AnimationInfo(
        loop: true,
        reverse: true,
        trigger: AnimationTrigger.onPageLoad,
        effectsBuilder: () => [
          ScaleEffect(
            curve: Curves.easeInOut,
            delay: 0.0.ms,
            duration: 1010.0.ms,
            begin: const Offset(1.0, 1.0),
            end: const Offset(1.2, 1.2),
          ),
        ],
      ),
      'circleImageOnPageLoadAnimation9': AnimationInfo(
        loop: true,
        reverse: true,
        trigger: AnimationTrigger.onPageLoad,
        effectsBuilder: () => [
          ScaleEffect(
            curve: Curves.easeInOut,
            delay: 0.0.ms,
            duration: 1010.0.ms,
            begin: const Offset(1.0, 1.0),
            end: const Offset(1.2, 1.2),
          ),
        ],
      ),
      'circleImageOnPageLoadAnimation10': AnimationInfo(
        loop: true,
        reverse: true,
        trigger: AnimationTrigger.onPageLoad,
        effectsBuilder: () => [
          ScaleEffect(
            curve: Curves.easeInOut,
            delay: 0.0.ms,
            duration: 1010.0.ms,
            begin: const Offset(1.0, 1.0),
            end: const Offset(1.2, 1.2),
          ),
        ],
      ),
      'circleImageOnPageLoadAnimation11': AnimationInfo(
        loop: true,
        reverse: true,
        trigger: AnimationTrigger.onPageLoad,
        effectsBuilder: () => [
          ScaleEffect(
            curve: Curves.easeInOut,
            delay: 0.0.ms,
            duration: 1010.0.ms,
            begin: const Offset(1.0, 1.0),
            end: const Offset(1.2, 1.2),
          ),
        ],
      ),
      'circleImageOnPageLoadAnimation12': AnimationInfo(
        trigger: AnimationTrigger.onPageLoad,
        effectsBuilder: () => [
          ScaleEffect(
            curve: Curves.easeInOut,
            delay: 0.0.ms,
            duration: 1010.0.ms,
            begin: const Offset(1.0, 1.0),
            end: const Offset(1.2, 1.2),
          ),
        ],
      ),
      'circleImageOnPageLoadAnimation13': AnimationInfo(
        loop: true,
        reverse: true,
        trigger: AnimationTrigger.onPageLoad,
        effectsBuilder: () => [
          ScaleEffect(
            curve: Curves.easeInOut,
            delay: 0.0.ms,
            duration: 1010.0.ms,
            begin: const Offset(1.0, 1.0),
            end: const Offset(1.2, 1.2),
          ),
        ],
      ),
      'circleImageOnPageLoadAnimation14': AnimationInfo(
        loop: true,
        reverse: true,
        trigger: AnimationTrigger.onPageLoad,
        effectsBuilder: () => [
          ScaleEffect(
            curve: Curves.easeInOut,
            delay: 0.0.ms,
            duration: 1010.0.ms,
            begin: const Offset(1.0, 1.0),
            end: const Offset(1.2, 1.2),
          ),
        ],
      ),
      'circleImageOnPageLoadAnimation15': AnimationInfo(
        loop: true,
        reverse: true,
        trigger: AnimationTrigger.onPageLoad,
        effectsBuilder: () => [
          ScaleEffect(
            curve: Curves.easeInOut,
            delay: 0.0.ms,
            duration: 1010.0.ms,
            begin: const Offset(1.0, 1.0),
            end: const Offset(1.2, 1.2),
          ),
        ],
      ),
      'circleImageOnPageLoadAnimation16': AnimationInfo(
        loop: true,
        reverse: true,
        trigger: AnimationTrigger.onPageLoad,
        effectsBuilder: () => [
          ScaleEffect(
            curve: Curves.easeInOut,
            delay: 0.0.ms,
            duration: 1010.0.ms,
            begin: const Offset(1.0, 1.0),
            end: const Offset(1.2, 1.2),
          ),
        ],
      ),
      'circleImageOnPageLoadAnimation17': AnimationInfo(
        loop: true,
        reverse: true,
        trigger: AnimationTrigger.onPageLoad,
        effectsBuilder: () => [
          ScaleEffect(
            curve: Curves.easeInOut,
            delay: 0.0.ms,
            duration: 1010.0.ms,
            begin: const Offset(1.0, 1.0),
            end: const Offset(1.2, 1.2),
          ),
        ],
      ),
      'circleImageOnPageLoadAnimation18': AnimationInfo(
        loop: true,
        reverse: true,
        trigger: AnimationTrigger.onPageLoad,
        effectsBuilder: () => [
          ScaleEffect(
            curve: Curves.easeInOut,
            delay: 0.0.ms,
            duration: 1010.0.ms,
            begin: const Offset(1.0, 1.0),
            end: const Offset(1.2, 1.2),
          ),
        ],
      ),
      'circleImageOnPageLoadAnimation19': AnimationInfo(
        loop: true,
        reverse: true,
        trigger: AnimationTrigger.onPageLoad,
        effectsBuilder: () => [
          ScaleEffect(
            curve: Curves.easeInOut,
            delay: 0.0.ms,
            duration: 1010.0.ms,
            begin: const Offset(1.0, 1.0),
            end: const Offset(1.2, 1.2),
          ),
        ],
      ),
      'circleImageOnPageLoadAnimation20': AnimationInfo(
        loop: true,
        reverse: true,
        trigger: AnimationTrigger.onPageLoad,
        effectsBuilder: () => [
          ScaleEffect(
            curve: Curves.easeInOut,
            delay: 0.0.ms,
            duration: 1010.0.ms,
            begin: const Offset(1.0, 1.0),
            end: const Offset(1.2, 1.2),
          ),
        ],
      ),
      'circleImageOnPageLoadAnimation21': AnimationInfo(
        loop: true,
        reverse: true,
        trigger: AnimationTrigger.onPageLoad,
        effectsBuilder: () => [
          ScaleEffect(
            curve: Curves.easeInOut,
            delay: 0.0.ms,
            duration: 1010.0.ms,
            begin: const Offset(1.0, 1.0),
            end: const Offset(1.2, 1.2),
          ),
        ],
      ),
      'circleImageOnPageLoadAnimation22': AnimationInfo(
        loop: true,
        reverse: true,
        trigger: AnimationTrigger.onPageLoad,
        effectsBuilder: () => [
          ScaleEffect(
            curve: Curves.easeInOut,
            delay: 0.0.ms,
            duration: 1010.0.ms,
            begin: const Offset(1.0, 1.0),
            end: const Offset(1.2, 1.2),
          ),
        ],
      ),
      'circleImageOnPageLoadAnimation23': AnimationInfo(
        loop: true,
        reverse: true,
        trigger: AnimationTrigger.onPageLoad,
        effectsBuilder: () => [
          ScaleEffect(
            curve: Curves.easeInOut,
            delay: 0.0.ms,
            duration: 1010.0.ms,
            begin: const Offset(1.0, 1.0),
            end: const Offset(1.2, 1.2),
          ),
        ],
      ),
      'circleImageOnPageLoadAnimation24': AnimationInfo(
        loop: true,
        reverse: true,
        trigger: AnimationTrigger.onPageLoad,
        effectsBuilder: () => [
          ScaleEffect(
            curve: Curves.easeInOut,
            delay: 0.0.ms,
            duration: 1010.0.ms,
            begin: const Offset(1.0, 1.0),
            end: const Offset(1.2, 1.2),
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

    return Align(
      alignment: const AlignmentDirectional(0.0, 0.0),
      child: Padding(
        padding: const EdgeInsetsDirectional.fromSTEB(1.0, 0.0, 1.0, 0.0),
        child: SizedBox(
          width: MediaQuery.sizeOf(context).width * 1.0,
          height: MediaQuery.sizeOf(context).height * 1.0,
          child: Stack(
            alignment: const AlignmentDirectional(0.0, 0.0),
            children: [
              Align(
                alignment: const AlignmentDirectional(0.0, 0.0),
                child: Column(
                  mainAxisSize: MainAxisSize.max,
                  mainAxisAlignment: MainAxisAlignment.start,
                  children: [
                    Container(
                      width: MediaQuery.sizeOf(context).width * 1.0,
                      height: 55.0,
                      decoration: const BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            Color(0xFF2B3138),
                            Color(0xFF24252F),
                            Color(0xFF303240),
                            Color(0xFF2A3137)
                          ],
                          stops: [0.0, 1.0, 1.0, 1.0],
                          begin: AlignmentDirectional(1.0, 0.0),
                          end: AlignmentDirectional(-1.0, 0),
                        ),
                        borderRadius: BorderRadius.only(
                          bottomLeft: Radius.circular(0.0),
                          bottomRight: Radius.circular(0.0),
                          topLeft: Radius.circular(24.0),
                          topRight: Radius.circular(24.0),
                        ),
                      ),
                      child: Padding(
                        padding:
                            const EdgeInsetsDirectional.fromSTEB(0.0, 10.0, 0.0, 0.0),
                        child: Column(
                          mainAxisSize: MainAxisSize.max,
                          children: [
                            Row(
                              mainAxisSize: MainAxisSize.max,
                              children: [
                                if (!FFAppState().ToggleMapOnList)
                                  Align(
                                    alignment: const AlignmentDirectional(0.0, 0.0),
                                    child: Container(
                                      width: 394.0,
                                      height: 44.0,
                                      decoration: const BoxDecoration(
                                        color: Colors.transparent,
                                      ),
                                      child: Stack(
                                        children: [
                                          Row(
                                            mainAxisSize: MainAxisSize.max,
                                            mainAxisAlignment:
                                                MainAxisAlignment.center,
                                            children: [
                                              Align(
                                                alignment: const AlignmentDirectional(
                                                    0.0, 0.0),
                                                child: FFButtonWidget(
                                                  onPressed: () async {
                                                    if (!(FFAppState()
                                                        .ListGiveTakeValuesforFilteronGmap
                                                        .isNotEmpty)) {
                                                      await showDialog(
                                                        context: context,
                                                        builder:
                                                            (alertDialogContext) {
                                                          return AlertDialog(
                                                            content: const Text(
                                                                'Please, pick up Give and Take values.'),
                                                            actions: [
                                                              TextButton(
                                                                onPressed: () =>
                                                                    Navigator.pop(
                                                                        alertDialogContext),
                                                                child: const Text(
                                                                    'Ok ;)'),
                                                              ),
                                                            ],
                                                          );
                                                        },
                                                      );
                                                      return;
                                                    } else {
                                                      if (FFAppState()
                                                          .ListTAKEvaluesForFilterGmap
                                                          .isNotEmpty) {
                                                        FFAppState().FilteredJsonByGiveTake = functions
                                                            .listJsonFilteredbyTakeGive(
                                                                getJsonField(
                                                                  FFAppState()
                                                                      .jsonUsersAppstate,
                                                                  r'''$.users''',
                                                                ),
                                                                FFAppState()
                                                                    .ListTAKEvaluesForFilterGmap
                                                                    .toList(),
                                                                FFAppState()
                                                                    .ListGiveTakeValuesforFilteronGmap
                                                                    .toList())!;
                                                        FFAppState()
                                                            .update(() {});
                                                        FFAppState()
                                                                .ToggleMapOnList =
                                                            !(FFAppState()
                                                                    .ToggleMapOnList ??
                                                                true);
                                                        FFAppState()
                                                            .update(() {});
                                                        await showModalBottomSheet(
                                                          isScrollControlled:
                                                              true,
                                                          backgroundColor:
                                                              Colors
                                                                  .transparent,
                                                          enableDrag: false,
                                                          context: context,
                                                          builder: (context) {
                                                            return Padding(
                                                              padding: MediaQuery
                                                                  .viewInsetsOf(
                                                                      context),
                                                              child:
                                                                  const GMapValuesTableWidget(),
                                                            );
                                                          },
                                                        ).then((value) =>
                                                            safeSetState(
                                                                () {}));
                                                      } else {
                                                        await showDialog(
                                                          context: context,
                                                          builder:
                                                              (alertDialogContext) {
                                                            return AlertDialog(
                                                              content: const Text(
                                                                  'And now please, pick up Take values.'),
                                                              actions: [
                                                                TextButton(
                                                                  onPressed: () =>
                                                                      Navigator.pop(
                                                                          alertDialogContext),
                                                                  child: const Text(
                                                                      'Ok ;)'),
                                                                ),
                                                              ],
                                                            );
                                                          },
                                                        );
                                                        return;
                                                      }
                                                    }
                                                  },
                                                  text: FFLocalizations.of(
                                                          context)
                                                      .getText(
                                                    'lex4dzuh' /* on List */,
                                                  ),
                                                  options: FFButtonOptions(
                                                    width: 224.0,
                                                    height: 42.0,
                                                    padding:
                                                        const EdgeInsetsDirectional
                                                            .fromSTEB(110.0,
                                                                0.0, 0.0, 0.0),
                                                    iconPadding:
                                                        const EdgeInsetsDirectional
                                                            .fromSTEB(0.0, 0.0,
                                                                0.0, 0.0),
                                                    color: FlutterFlowTheme.of(
                                                            context)
                                                        .secondaryBackground,
                                                    textStyle: FlutterFlowTheme
                                                            .of(context)
                                                        .titleSmall
                                                        .override(
                                                          fontFamily:
                                                              'Montserrat',
                                                          color:
                                                              const Color(0xFF919191),
                                                          letterSpacing: 0.0,
                                                          fontWeight:
                                                              FontWeight.w600,
                                                        ),
                                                    borderRadius:
                                                        BorderRadius.circular(
                                                            16.0),
                                                  ),
                                                ),
                                              ),
                                            ].divide(const SizedBox(width: 4.0)),
                                          ),
                                          Align(
                                            alignment:
                                                const AlignmentDirectional(0.0, 0.0),
                                            child: Padding(
                                              padding: const EdgeInsetsDirectional
                                                  .fromSTEB(
                                                      0.0, 0.0, 110.0, 0.0),
                                              child: Stack(
                                                children: [
                                                  Container(
                                                    width: 112.0,
                                                    height: 42.0,
                                                    decoration: BoxDecoration(
                                                      gradient: LinearGradient(
                                                        colors: [
                                                          FlutterFlowTheme.of(
                                                                  context)
                                                              .primary,
                                                          FlutterFlowTheme.of(
                                                                  context)
                                                              .secondary
                                                        ],
                                                        stops: const [0.0, 1.0],
                                                        begin:
                                                            const AlignmentDirectional(
                                                                0.0, -1.0),
                                                        end:
                                                            const AlignmentDirectional(
                                                                0, 1.0),
                                                      ),
                                                      borderRadius:
                                                          BorderRadius.circular(
                                                              16.0),
                                                    ),
                                                    alignment:
                                                        const AlignmentDirectional(
                                                            0.0, 0.0),
                                                    child: Align(
                                                      alignment:
                                                          const AlignmentDirectional(
                                                              0.0, 0.0),
                                                      child: Text(
                                                        FFLocalizations.of(
                                                                context)
                                                            .getText(
                                                          'nv0pgb83' /* Map */,
                                                        ),
                                                        style:
                                                            FlutterFlowTheme.of(
                                                                    context)
                                                                .bodyMedium
                                                                .override(
                                                                  fontFamily:
                                                                      'Montserrat',
                                                                  color: FlutterFlowTheme.of(
                                                                          context)
                                                                      .primaryBackground,
                                                                  fontSize:
                                                                      15.0,
                                                                  letterSpacing:
                                                                      0.0,
                                                                  fontWeight:
                                                                      FontWeight
                                                                          .w600,
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
                                  ),
                              ],
                            ),
                            Row(
                              mainAxisSize: MainAxisSize.max,
                              children: [
                                if (FFAppState().ToggleMapOnList)
                                  Align(
                                    alignment: const AlignmentDirectional(0.0, 0.0),
                                    child: Container(
                                      width: 394.0,
                                      height: 44.0,
                                      decoration: const BoxDecoration(),
                                      child: Stack(
                                        children: [
                                          Row(
                                            mainAxisSize: MainAxisSize.max,
                                            mainAxisAlignment:
                                                MainAxisAlignment.center,
                                            children: [
                                              Align(
                                                alignment: const AlignmentDirectional(
                                                    0.0, 0.0),
                                                child: FFButtonWidget(
                                                  onPressed: () async {
                                                    if (!(FFAppState()
                                                        .ListGiveTakeValuesforFilteronGmap
                                                        .isNotEmpty)) {
                                                      await showDialog(
                                                        context: context,
                                                        builder:
                                                            (alertDialogContext) {
                                                          return AlertDialog(
                                                            content: const Text(
                                                                'Please, pick up Give and Take values.'),
                                                            actions: [
                                                              TextButton(
                                                                onPressed: () =>
                                                                    Navigator.pop(
                                                                        alertDialogContext),
                                                                child: const Text(
                                                                    'Ok ;)'),
                                                              ),
                                                            ],
                                                          );
                                                        },
                                                      );
                                                      FFAppState()
                                                              .ToggleMapOnList =
                                                          !(FFAppState()
                                                                  .ToggleMapOnList ??
                                                              true);
                                                      FFAppState()
                                                          .update(() {});
                                                      return;
                                                    } else {
                                                      FFAppState()
                                                              .ToggleMapOnList =
                                                          !(FFAppState()
                                                                  .ToggleMapOnList ??
                                                              true);
                                                      FFAppState()
                                                          .update(() {});
                                                      if (FFAppState()
                                                          .ListTAKEvaluesForFilterGmap
                                                          .isNotEmpty) {
                                                        FFAppState().FilteredJsonByGiveTake = functions
                                                            .listJsonFilteredbyTakeGive(
                                                                getJsonField(
                                                                  FFAppState()
                                                                      .jsonUsersAppstate,
                                                                  r'''$.users''',
                                                                ),
                                                                FFAppState()
                                                                    .ListTAKEvaluesForFilterGmap
                                                                    .toList(),
                                                                FFAppState()
                                                                    .ListGiveTakeValuesforFilteronGmap
                                                                    .toList())!;
                                                        FFAppState()
                                                            .update(() {});
                                                      } else {
                                                        await showDialog(
                                                          context: context,
                                                          builder:
                                                              (alertDialogContext) {
                                                            return AlertDialog(
                                                              content: const Text(
                                                                  'And now please, pick up Take values.'),
                                                              actions: [
                                                                TextButton(
                                                                  onPressed: () =>
                                                                      Navigator.pop(
                                                                          alertDialogContext),
                                                                  child: const Text(
                                                                      'Ok ;)'),
                                                                ),
                                                              ],
                                                            );
                                                          },
                                                        );
                                                        return;
                                                      }
                                                    }
                                                  },
                                                  text: FFLocalizations.of(
                                                          context)
                                                      .getText(
                                                    'd2ib56mg' /* Map */,
                                                  ),
                                                  options: FFButtonOptions(
                                                    width: 224.0,
                                                    height: 42.0,
                                                    padding:
                                                        const EdgeInsetsDirectional
                                                            .fromSTEB(0.0, 0.0,
                                                                110.0, 0.0),
                                                    iconPadding:
                                                        const EdgeInsetsDirectional
                                                            .fromSTEB(0.0, 0.0,
                                                                0.0, 0.0),
                                                    color: FlutterFlowTheme.of(
                                                            context)
                                                        .secondaryBackground,
                                                    textStyle: FlutterFlowTheme
                                                            .of(context)
                                                        .titleSmall
                                                        .override(
                                                          fontFamily:
                                                              'Montserrat',
                                                          color:
                                                              const Color(0xFF919191),
                                                          letterSpacing: 0.0,
                                                          fontWeight:
                                                              FontWeight.w600,
                                                        ),
                                                    borderRadius:
                                                        BorderRadius.circular(
                                                            16.0),
                                                  ),
                                                ),
                                              ),
                                            ].divide(const SizedBox(width: 4.0)),
                                          ),
                                          Align(
                                            alignment:
                                                const AlignmentDirectional(0.0, 0.0),
                                            child: Padding(
                                              padding: const EdgeInsetsDirectional
                                                  .fromSTEB(
                                                      110.0, 0.0, 0.0, 0.0),
                                              child: Stack(
                                                children: [
                                                  Container(
                                                    width: 112.0,
                                                    height: 42.0,
                                                    decoration: BoxDecoration(
                                                      gradient: LinearGradient(
                                                        colors: [
                                                          FlutterFlowTheme.of(
                                                                  context)
                                                              .primary,
                                                          FlutterFlowTheme.of(
                                                                  context)
                                                              .secondary
                                                        ],
                                                        stops: const [0.0, 1.0],
                                                        begin:
                                                            const AlignmentDirectional(
                                                                0.0, -1.0),
                                                        end:
                                                            const AlignmentDirectional(
                                                                0, 1.0),
                                                      ),
                                                      borderRadius:
                                                          BorderRadius.circular(
                                                              16.0),
                                                    ),
                                                    alignment:
                                                        const AlignmentDirectional(
                                                            0.0, 0.0),
                                                    child: Align(
                                                      alignment:
                                                          const AlignmentDirectional(
                                                              0.0, 0.0),
                                                      child: Text(
                                                        FFLocalizations.of(
                                                                context)
                                                            .getText(
                                                          '2laxtjfs' /* on List */,
                                                        ),
                                                        style:
                                                            FlutterFlowTheme.of(
                                                                    context)
                                                                .bodyMedium
                                                                .override(
                                                                  fontFamily:
                                                                      'Montserrat',
                                                                  color: FlutterFlowTheme.of(
                                                                          context)
                                                                      .primaryBackground,
                                                                  fontSize:
                                                                      15.0,
                                                                  letterSpacing:
                                                                      0.0,
                                                                  fontWeight:
                                                                      FontWeight
                                                                          .w600,
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
                                  ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              Column(
                mainAxisSize: MainAxisSize.max,
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Padding(
                    padding:
                        const EdgeInsetsDirectional.fromSTEB(0.0, 60.0, 0.0, 0.0),
                    child: Column(
                      mainAxisSize: MainAxisSize.max,
                      mainAxisAlignment: MainAxisAlignment.start,
                      children: [
                        Align(
                          alignment: const AlignmentDirectional(0.0, 0.0),
                          child: Padding(
                            padding: const EdgeInsetsDirectional.fromSTEB(
                                10.0, 0.0, 0.0, 10.0),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Align(
                                  alignment: const AlignmentDirectional(0.0, 0.0),
                                  child: Container(
                                    width: 56.0,
                                    height: 66.0,
                                    decoration: BoxDecoration(
                                      gradient: LinearGradient(
                                        colors: [
                                          FlutterFlowTheme.of(context).primary,
                                          FlutterFlowTheme.of(context).secondary
                                        ],
                                        stops: const [0.0, 1.0],
                                        begin: const AlignmentDirectional(0.0, -1.0),
                                        end: const AlignmentDirectional(0, 1.0),
                                      ),
                                      borderRadius: const BorderRadius.only(
                                        bottomLeft: Radius.circular(20.0),
                                        bottomRight: Radius.circular(0.0),
                                        topLeft: Radius.circular(20.0),
                                        topRight: Radius.circular(0.0),
                                      ),
                                    ),
                                    alignment: const AlignmentDirectional(0.0, 0.0),
                                    child: Column(
                                      mainAxisSize: MainAxisSize.max,
                                      mainAxisAlignment:
                                          MainAxisAlignment.spaceAround,
                                      children: [
                                        Row(
                                          mainAxisSize: MainAxisSize.min,
                                          mainAxisAlignment:
                                              MainAxisAlignment.center,
                                          crossAxisAlignment:
                                              CrossAxisAlignment.center,
                                          children: [
                                            Align(
                                              alignment: const AlignmentDirectional(
                                                  0.0, 0.0),
                                              child: Text(
                                                FFLocalizations.of(context)
                                                    .getText(
                                                  'zt7hemkq' /* I Give */,
                                                ),
                                                textAlign: TextAlign.center,
                                                style:
                                                    FlutterFlowTheme.of(context)
                                                        .bodyMedium
                                                        .override(
                                                          fontFamily:
                                                              'Montserrat',
                                                          color: FlutterFlowTheme
                                                                  .of(context)
                                                              .primaryBackground,
                                                          letterSpacing: 0.0,
                                                          fontWeight:
                                                              FontWeight.w600,
                                                        ),
                                              ),
                                            ),
                                          ],
                                        ),
                                        Row(
                                          mainAxisSize: MainAxisSize.min,
                                          mainAxisAlignment:
                                              MainAxisAlignment.center,
                                          children: [
                                            ClipRRect(
                                              borderRadius:
                                                  BorderRadius.circular(8.0),
                                              child: Image.asset(
                                                'assets/images/Icon_I_Take.png',
                                                width: 24.0,
                                                height: 24.0,
                                                fit: BoxFit.cover,
                                                alignment: const Alignment(0.0, 0.0),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                                Align(
                                  alignment: const AlignmentDirectional(0.0, 0.0),
                                  child: Padding(
                                    padding: const EdgeInsetsDirectional.fromSTEB(
                                        1.0, 0.0, 1.0, 0.0),
                                    child: Container(
                                      width: 338.0,
                                      height: 66.0,
                                      decoration: const BoxDecoration(),
                                      child: Column(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Stack(
                                            children: [
                                              Align(
                                                alignment: const AlignmentDirectional(
                                                    0.0, 0.0),
                                                child: ClipRRect(
                                                  borderRadius:
                                                      BorderRadius.circular(
                                                          0.0),
                                                  child: BackdropFilter(
                                                    filter: ImageFilter.blur(
                                                      sigmaX: 5.0,
                                                      sigmaY: 5.0,
                                                    ),
                                                    child: Container(
                                                      width: 338.0,
                                                      height: 66.0,
                                                      decoration: const BoxDecoration(
                                                        color:
                                                            Color(0x6A2B3138),
                                                      ),
                                                    ),
                                                  ),
                                                ),
                                              ),
                                              Container(
                                                width: 338.0,
                                                height: 66.0,
                                                decoration: const BoxDecoration(
                                                  color: Color(0x02000000),
                                                ),
                                                child: SingleChildScrollView(
                                                  scrollDirection:
                                                      Axis.horizontal,
                                                  child: Row(
                                                    mainAxisSize:
                                                        MainAxisSize.max,
                                                    children: [
                                                      Align(
                                                        alignment:
                                                            const AlignmentDirectional(
                                                                0.0, 0.0),
                                                        child: Padding(
                                                          padding:
                                                              const EdgeInsetsDirectional
                                                                  .fromSTEB(
                                                                      7.0,
                                                                      0.0,
                                                                      7.0,
                                                                      0.0),
                                                          child: Column(
                                                            mainAxisSize:
                                                                MainAxisSize
                                                                    .min,
                                                            mainAxisAlignment:
                                                                MainAxisAlignment
                                                                    .center,
                                                            children: [
                                                              Expanded(
                                                                child: Align(
                                                                  alignment:
                                                                      const AlignmentDirectional(
                                                                          0.0,
                                                                          0.0),
                                                                  child: Stack(
                                                                    alignment:
                                                                        const AlignmentDirectional(
                                                                            0.0,
                                                                            0.0),
                                                                    children: [
                                                                      if (FFAppState()
                                                                          .MapSphereFilterImageIsHighlighted[2])
                                                                        Align(
                                                                          alignment: const AlignmentDirectional(
                                                                              0.0,
                                                                              0.0),
                                                                          child:
                                                                              Container(
                                                                            width:
                                                                                60.0,
                                                                            height:
                                                                                40.0,
                                                                            decoration:
                                                                                BoxDecoration(
                                                                              color: FlutterFlowTheme.of(context).primaryText,
                                                                              borderRadius: BorderRadius.circular(30.0),
                                                                            ),
                                                                          ),
                                                                        ),
                                                                      Opacity(
                                                                        opacity:
                                                                            FFAppState().SphereIconsReactionOnPressListGive[2],
                                                                        child:
                                                                            Align(
                                                                          alignment: const AlignmentDirectional(
                                                                              0.0,
                                                                              0.0),
                                                                          child:
                                                                              InkWell(
                                                                            splashColor:
                                                                                Colors.transparent,
                                                                            focusColor:
                                                                                Colors.transparent,
                                                                            hoverColor:
                                                                                Colors.transparent,
                                                                            highlightColor:
                                                                                Colors.transparent,
                                                                            onTap:
                                                                                () async {
                                                                              if (FFAppState().ListGiveTakeValuesforFilteronGmap.contains(valueOrDefault<String>(
                                                                                        'Intellect',
                                                                                        'error',
                                                                                      )) ==
                                                                                  true) {
                                                                                FFAppState().removeFromListGiveTakeValuesforFilteronGmap('Intellect');
                                                                                FFAppState().updateSphereIconsReactionOnPressListGiveAtIndex(
                                                                                  2,
                                                                                  (_) => 0.8,
                                                                                );
                                                                                FFAppState().update(() {});
                                                                                FFAppState().updateMapSphereFilterImageIsHighlightedAtIndex(
                                                                                  2,
                                                                                  (_) => false,
                                                                                );
                                                                                FFAppState().update(() {});
                                                                              } else {
                                                                                FFAppState().addToListGiveTakeValuesforFilteronGmap('Intellect');
                                                                                FFAppState().updateSphereIconsReactionOnPressListGiveAtIndex(
                                                                                  2,
                                                                                  (_) => 1.0,
                                                                                );
                                                                                FFAppState().update(() {});
                                                                                FFAppState().updateMapSphereFilterImageIsHighlightedAtIndex(
                                                                                  2,
                                                                                  (_) => true,
                                                                                );
                                                                                FFAppState().update(() {});
                                                                              }
                                                                            },
                                                                            child:
                                                                                ClipRRect(
                                                                              borderRadius: BorderRadius.circular(30.0),
                                                                              child: Image.asset(
                                                                                'assets/images/IntellectForGmapPage.png',
                                                                                width: 57.0,
                                                                                height: 37.0,
                                                                                fit: BoxFit.cover,
                                                                                alignment: const Alignment(0.0, 0.0),
                                                                              ),
                                                                            ),
                                                                          ),
                                                                        ),
                                                                      ),
                                                                    ],
                                                                  ),
                                                                ),
                                                              ),
                                                              Align(
                                                                alignment:
                                                                    const AlignmentDirectional(
                                                                        0.0,
                                                                        0.0),
                                                                child: Padding(
                                                                  padding: const EdgeInsetsDirectional
                                                                      .fromSTEB(
                                                                          1.0,
                                                                          0.0,
                                                                          1.0,
                                                                          0.0),
                                                                  child: Text(
                                                                    FFLocalizations.of(
                                                                            context)
                                                                        .getText(
                                                                      '0f5s986y' /* Intellect */,
                                                                    ),
                                                                    textAlign:
                                                                        TextAlign
                                                                            .center,
                                                                    style: FlutterFlowTheme.of(
                                                                            context)
                                                                        .bodyMedium
                                                                        .override(
                                                                          fontFamily:
                                                                              'Montserrat',
                                                                          fontSize:
                                                                              12.0,
                                                                          letterSpacing:
                                                                              0.0,
                                                                          fontWeight:
                                                                              FontWeight.w600,
                                                                        ),
                                                                  ),
                                                                ),
                                                              ),
                                                            ],
                                                          ),
                                                        ),
                                                      ),
                                                      Align(
                                                        alignment:
                                                            const AlignmentDirectional(
                                                                0.0, 0.0),
                                                        child: Padding(
                                                          padding:
                                                              const EdgeInsetsDirectional
                                                                  .fromSTEB(
                                                                      7.0,
                                                                      0.0,
                                                                      7.0,
                                                                      0.0),
                                                          child: Column(
                                                            mainAxisSize:
                                                                MainAxisSize
                                                                    .min,
                                                            mainAxisAlignment:
                                                                MainAxisAlignment
                                                                    .center,
                                                            children: [
                                                              Expanded(
                                                                child: Align(
                                                                  alignment:
                                                                      const AlignmentDirectional(
                                                                          0.0,
                                                                          0.0),
                                                                  child: Stack(
                                                                    alignment:
                                                                        const AlignmentDirectional(
                                                                            0.0,
                                                                            0.0),
                                                                    children: [
                                                                      if (FFAppState()
                                                                          .MapSphereFilterImageIsHighlighted[1])
                                                                        Align(
                                                                          alignment: const AlignmentDirectional(
                                                                              0.0,
                                                                              0.0),
                                                                          child:
                                                                              Container(
                                                                            width:
                                                                                60.0,
                                                                            height:
                                                                                40.0,
                                                                            decoration:
                                                                                BoxDecoration(
                                                                              color: FlutterFlowTheme.of(context).primaryText,
                                                                              borderRadius: BorderRadius.circular(30.0),
                                                                            ),
                                                                          ),
                                                                        ),
                                                                      Opacity(
                                                                        opacity:
                                                                            FFAppState().SphereIconsReactionOnPressListGive[1],
                                                                        child:
                                                                            Align(
                                                                          alignment: const AlignmentDirectional(
                                                                              0.0,
                                                                              0.0),
                                                                          child:
                                                                              InkWell(
                                                                            splashColor:
                                                                                Colors.transparent,
                                                                            focusColor:
                                                                                Colors.transparent,
                                                                            hoverColor:
                                                                                Colors.transparent,
                                                                            highlightColor:
                                                                                Colors.transparent,
                                                                            onTap:
                                                                                () async {
                                                                              if (FFAppState().ListGiveTakeValuesforFilteronGmap.contains(valueOrDefault<String>(
                                                                                        'Health',
                                                                                        'error',
                                                                                      )) ==
                                                                                  true) {
                                                                                FFAppState().removeFromListGiveTakeValuesforFilteronGmap('Health');
                                                                                FFAppState().updateSphereIconsReactionOnPressListGiveAtIndex(
                                                                                  1,
                                                                                  (_) => 0.8,
                                                                                );
                                                                                FFAppState().update(() {});
                                                                                FFAppState().updateMapSphereFilterImageIsHighlightedAtIndex(
                                                                                  1,
                                                                                  (_) => false,
                                                                                );
                                                                                FFAppState().update(() {});
                                                                              } else {
                                                                                FFAppState().addToListGiveTakeValuesforFilteronGmap('Health');
                                                                                FFAppState().updateSphereIconsReactionOnPressListGiveAtIndex(
                                                                                  1,
                                                                                  (_) => 1.0,
                                                                                );
                                                                                FFAppState().update(() {});
                                                                                FFAppState().updateMapSphereFilterImageIsHighlightedAtIndex(
                                                                                  1,
                                                                                  (_) => true,
                                                                                );
                                                                                FFAppState().update(() {});
                                                                              }
                                                                            },
                                                                            child:
                                                                                ClipRRect(
                                                                              borderRadius: BorderRadius.circular(30.0),
                                                                              child: Image.asset(
                                                                                'assets/images/Health.png',
                                                                                width: 57.0,
                                                                                height: 37.0,
                                                                                fit: BoxFit.cover,
                                                                                alignment: const Alignment(0.0, 0.0),
                                                                              ),
                                                                            ),
                                                                          ),
                                                                        ),
                                                                      ),
                                                                    ],
                                                                  ),
                                                                ),
                                                              ),
                                                              Align(
                                                                alignment:
                                                                    const AlignmentDirectional(
                                                                        0.0,
                                                                        0.0),
                                                                child: Padding(
                                                                  padding: const EdgeInsetsDirectional
                                                                      .fromSTEB(
                                                                          1.0,
                                                                          0.0,
                                                                          1.0,
                                                                          0.0),
                                                                  child: Text(
                                                                    FFLocalizations.of(
                                                                            context)
                                                                        .getText(
                                                                      'lekyp58m' /* Health */,
                                                                    ),
                                                                    textAlign:
                                                                        TextAlign
                                                                            .center,
                                                                    style: FlutterFlowTheme.of(
                                                                            context)
                                                                        .bodyMedium
                                                                        .override(
                                                                          fontFamily:
                                                                              'Montserrat',
                                                                          fontSize:
                                                                              12.0,
                                                                          letterSpacing:
                                                                              0.0,
                                                                          fontWeight:
                                                                              FontWeight.w600,
                                                                        ),
                                                                  ),
                                                                ),
                                                              ),
                                                            ],
                                                          ),
                                                        ),
                                                      ),
                                                      Align(
                                                        alignment:
                                                            const AlignmentDirectional(
                                                                0.0, 0.0),
                                                        child: Padding(
                                                          padding:
                                                              const EdgeInsetsDirectional
                                                                  .fromSTEB(
                                                                      7.0,
                                                                      0.0,
                                                                      7.0,
                                                                      0.0),
                                                          child: Column(
                                                            mainAxisSize:
                                                                MainAxisSize
                                                                    .min,
                                                            mainAxisAlignment:
                                                                MainAxisAlignment
                                                                    .center,
                                                            children: [
                                                              Expanded(
                                                                child: Align(
                                                                  alignment:
                                                                      const AlignmentDirectional(
                                                                          0.0,
                                                                          0.0),
                                                                  child: Stack(
                                                                    alignment:
                                                                        const AlignmentDirectional(
                                                                            0.0,
                                                                            0.0),
                                                                    children: [
                                                                      if (FFAppState()
                                                                          .MapSphereFilterImageIsHighlighted[6])
                                                                        Align(
                                                                          alignment: const AlignmentDirectional(
                                                                              0.0,
                                                                              0.0),
                                                                          child:
                                                                              Container(
                                                                            width:
                                                                                60.0,
                                                                            height:
                                                                                40.0,
                                                                            decoration:
                                                                                BoxDecoration(
                                                                              color: FlutterFlowTheme.of(context).primaryText,
                                                                              borderRadius: BorderRadius.circular(30.0),
                                                                            ),
                                                                          ),
                                                                        ),
                                                                      Opacity(
                                                                        opacity:
                                                                            FFAppState().SphereIconsReactionOnPressListGive[6],
                                                                        child:
                                                                            Align(
                                                                          alignment: const AlignmentDirectional(
                                                                              0.0,
                                                                              0.0),
                                                                          child:
                                                                              InkWell(
                                                                            splashColor:
                                                                                Colors.transparent,
                                                                            focusColor:
                                                                                Colors.transparent,
                                                                            hoverColor:
                                                                                Colors.transparent,
                                                                            highlightColor:
                                                                                Colors.transparent,
                                                                            onTap:
                                                                                () async {
                                                                              if (FFAppState().ListGiveTakeValuesforFilteronGmap.contains(valueOrDefault<String>(
                                                                                        'Career',
                                                                                        'error',
                                                                                      )) ==
                                                                                  true) {
                                                                                FFAppState().removeFromListGiveTakeValuesforFilteronGmap('Career');
                                                                                FFAppState().updateSphereIconsReactionOnPressListGiveAtIndex(
                                                                                  6,
                                                                                  (_) => 0.8,
                                                                                );
                                                                                FFAppState().update(() {});
                                                                                FFAppState().updateMapSphereFilterImageIsHighlightedAtIndex(
                                                                                  6,
                                                                                  (_) => false,
                                                                                );
                                                                                FFAppState().update(() {});
                                                                              } else {
                                                                                FFAppState().addToListGiveTakeValuesforFilteronGmap('Career');
                                                                                FFAppState().updateSphereIconsReactionOnPressListGiveAtIndex(
                                                                                  6,
                                                                                  (_) => 1.0,
                                                                                );
                                                                                FFAppState().update(() {});
                                                                                FFAppState().updateMapSphereFilterImageIsHighlightedAtIndex(
                                                                                  6,
                                                                                  (_) => true,
                                                                                );
                                                                                FFAppState().update(() {});
                                                                              }
                                                                            },
                                                                            child:
                                                                                ClipRRect(
                                                                              borderRadius: BorderRadius.circular(30.0),
                                                                              child: Image.asset(
                                                                                'assets/images/image_3.png',
                                                                                width: 57.0,
                                                                                height: 37.0,
                                                                                fit: BoxFit.cover,
                                                                                alignment: const Alignment(0.0, 0.0),
                                                                              ),
                                                                            ),
                                                                          ),
                                                                        ),
                                                                      ),
                                                                    ],
                                                                  ),
                                                                ),
                                                              ),
                                                              Align(
                                                                alignment:
                                                                    const AlignmentDirectional(
                                                                        0.0,
                                                                        0.0),
                                                                child: Padding(
                                                                  padding: const EdgeInsetsDirectional
                                                                      .fromSTEB(
                                                                          1.0,
                                                                          0.0,
                                                                          1.0,
                                                                          0.0),
                                                                  child: Text(
                                                                    FFLocalizations.of(
                                                                            context)
                                                                        .getText(
                                                                      'lal82xgk' /* Career */,
                                                                    ),
                                                                    textAlign:
                                                                        TextAlign
                                                                            .center,
                                                                    style: FlutterFlowTheme.of(
                                                                            context)
                                                                        .bodyMedium
                                                                        .override(
                                                                          fontFamily:
                                                                              'Montserrat',
                                                                          fontSize:
                                                                              12.0,
                                                                          letterSpacing:
                                                                              0.0,
                                                                          fontWeight:
                                                                              FontWeight.w600,
                                                                        ),
                                                                  ),
                                                                ),
                                                              ),
                                                            ],
                                                          ),
                                                        ),
                                                      ),
                                                      Align(
                                                        alignment:
                                                            const AlignmentDirectional(
                                                                0.0, 0.0),
                                                        child: Padding(
                                                          padding:
                                                              const EdgeInsetsDirectional
                                                                  .fromSTEB(
                                                                      7.0,
                                                                      0.0,
                                                                      7.0,
                                                                      0.0),
                                                          child: Column(
                                                            mainAxisSize:
                                                                MainAxisSize
                                                                    .min,
                                                            mainAxisAlignment:
                                                                MainAxisAlignment
                                                                    .center,
                                                            children: [
                                                              Expanded(
                                                                child: Align(
                                                                  alignment:
                                                                      const AlignmentDirectional(
                                                                          0.0,
                                                                          0.0),
                                                                  child: Stack(
                                                                    alignment:
                                                                        const AlignmentDirectional(
                                                                            0.0,
                                                                            0.0),
                                                                    children: [
                                                                      if (FFAppState()
                                                                          .MapSphereFilterImageIsHighlighted[0])
                                                                        Align(
                                                                          alignment: const AlignmentDirectional(
                                                                              0.0,
                                                                              0.0),
                                                                          child:
                                                                              Container(
                                                                            width:
                                                                                60.0,
                                                                            height:
                                                                                40.0,
                                                                            decoration:
                                                                                BoxDecoration(
                                                                              color: FlutterFlowTheme.of(context).primaryText,
                                                                              borderRadius: BorderRadius.circular(30.0),
                                                                            ),
                                                                            alignment:
                                                                                const AlignmentDirectional(0.0, 0.0),
                                                                          ),
                                                                        ),
                                                                      Opacity(
                                                                        opacity:
                                                                            FFAppState().SphereIconsReactionOnPressListGive[0],
                                                                        child:
                                                                            Align(
                                                                          alignment: const AlignmentDirectional(
                                                                              0.0,
                                                                              0.0),
                                                                          child:
                                                                              InkWell(
                                                                            splashColor:
                                                                                Colors.transparent,
                                                                            focusColor:
                                                                                Colors.transparent,
                                                                            hoverColor:
                                                                                Colors.transparent,
                                                                            highlightColor:
                                                                                Colors.transparent,
                                                                            onTap:
                                                                                () async {
                                                                              if (FFAppState().ListGiveTakeValuesforFilteronGmap.contains(valueOrDefault<String>(
                                                                                        'Balance',
                                                                                        'error',
                                                                                      )) ==
                                                                                  true) {
                                                                                FFAppState().removeFromListGiveTakeValuesforFilteronGmap('Balance');
                                                                                FFAppState().updateSphereIconsReactionOnPressListGiveAtIndex(
                                                                                  0,
                                                                                  (_) => 0.8,
                                                                                );
                                                                                FFAppState().update(() {});
                                                                                FFAppState().updateMapSphereFilterImageIsHighlightedAtIndex(
                                                                                  0,
                                                                                  (_) => false,
                                                                                );
                                                                                FFAppState().update(() {});
                                                                              } else {
                                                                                FFAppState().addToListGiveTakeValuesforFilteronGmap('Balance');
                                                                                FFAppState().updateSphereIconsReactionOnPressListGiveAtIndex(
                                                                                  0,
                                                                                  (_) => 1.0,
                                                                                );
                                                                                FFAppState().update(() {});
                                                                                FFAppState().updateMapSphereFilterImageIsHighlightedAtIndex(
                                                                                  0,
                                                                                  (_) => true,
                                                                                );
                                                                                FFAppState().update(() {});
                                                                              }
                                                                            },
                                                                            child:
                                                                                ClipRRect(
                                                                              borderRadius: BorderRadius.circular(28.0),
                                                                              child: Image.asset(
                                                                                'assets/images/Balance.png',
                                                                                width: 57.0,
                                                                                height: 37.0,
                                                                                fit: BoxFit.cover,
                                                                                alignment: const Alignment(0.0, 0.0),
                                                                              ),
                                                                            ),
                                                                          ),
                                                                        ),
                                                                      ),
                                                                    ],
                                                                  ),
                                                                ),
                                                              ),
                                                              Align(
                                                                alignment:
                                                                    const AlignmentDirectional(
                                                                        0.0,
                                                                        0.0),
                                                                child: Padding(
                                                                  padding: const EdgeInsetsDirectional
                                                                      .fromSTEB(
                                                                          1.0,
                                                                          0.0,
                                                                          1.0,
                                                                          0.0),
                                                                  child: Text(
                                                                    FFLocalizations.of(
                                                                            context)
                                                                        .getText(
                                                                      'azokhie9' /* Balance */,
                                                                    ),
                                                                    style: FlutterFlowTheme.of(
                                                                            context)
                                                                        .bodyMedium
                                                                        .override(
                                                                          fontFamily:
                                                                              'Montserrat',
                                                                          fontSize:
                                                                              12.0,
                                                                          letterSpacing:
                                                                              0.0,
                                                                          fontWeight:
                                                                              FontWeight.w600,
                                                                        ),
                                                                  ),
                                                                ),
                                                              ),
                                                            ],
                                                          ),
                                                        ),
                                                      ),
                                                      Align(
                                                        alignment:
                                                            const AlignmentDirectional(
                                                                0.0, 0.0),
                                                        child: Padding(
                                                          padding:
                                                              const EdgeInsetsDirectional
                                                                  .fromSTEB(
                                                                      7.0,
                                                                      0.0,
                                                                      7.0,
                                                                      0.0),
                                                          child: Column(
                                                            mainAxisSize:
                                                                MainAxisSize
                                                                    .min,
                                                            mainAxisAlignment:
                                                                MainAxisAlignment
                                                                    .center,
                                                            children: [
                                                              Expanded(
                                                                child: Align(
                                                                  alignment:
                                                                      const AlignmentDirectional(
                                                                          0.0,
                                                                          0.0),
                                                                  child: Stack(
                                                                    alignment:
                                                                        const AlignmentDirectional(
                                                                            0.0,
                                                                            0.0),
                                                                    children: [
                                                                      if (FFAppState()
                                                                          .MapSphereFilterImageIsHighlighted[11])
                                                                        Align(
                                                                          alignment: const AlignmentDirectional(
                                                                              0.0,
                                                                              0.0),
                                                                          child:
                                                                              Container(
                                                                            width:
                                                                                60.0,
                                                                            height:
                                                                                40.0,
                                                                            decoration:
                                                                                BoxDecoration(
                                                                              color: FlutterFlowTheme.of(context).primaryText,
                                                                              borderRadius: BorderRadius.circular(30.0),
                                                                            ),
                                                                            alignment:
                                                                                const AlignmentDirectional(0.0, 0.0),
                                                                          ),
                                                                        ),
                                                                      Opacity(
                                                                        opacity:
                                                                            FFAppState().SphereIconsReactionOnPressListGive[11],
                                                                        child:
                                                                            InkWell(
                                                                          splashColor:
                                                                              Colors.transparent,
                                                                          focusColor:
                                                                              Colors.transparent,
                                                                          hoverColor:
                                                                              Colors.transparent,
                                                                          highlightColor:
                                                                              Colors.transparent,
                                                                          onTap:
                                                                              () async {
                                                                            if (FFAppState().ListGiveTakeValuesforFilteronGmap.contains(valueOrDefault<String>(
                                                                                      'Love',
                                                                                      'error',
                                                                                    )) ==
                                                                                true) {
                                                                              FFAppState().removeFromListGiveTakeValuesforFilteronGmap('Love');
                                                                              FFAppState().update(() {});
                                                                              FFAppState().updateSphereIconsReactionOnPressListGiveAtIndex(
                                                                                11,
                                                                                (_) => 0.8,
                                                                              );
                                                                              safeSetState(() {});
                                                                              FFAppState().updateMapSphereFilterImageIsHighlightedAtIndex(
                                                                                11,
                                                                                (_) => false,
                                                                              );
                                                                              FFAppState().update(() {});
                                                                            } else {
                                                                              FFAppState().addToListGiveTakeValuesforFilteronGmap('Love');
                                                                              FFAppState().update(() {});
                                                                              FFAppState().updateSphereIconsReactionOnPressListGiveAtIndex(
                                                                                11,
                                                                                (_) => 1.0,
                                                                              );
                                                                              safeSetState(() {});
                                                                              FFAppState().updateMapSphereFilterImageIsHighlightedAtIndex(
                                                                                11,
                                                                                (_) => true,
                                                                              );
                                                                              FFAppState().update(() {});
                                                                            }
                                                                          },
                                                                          child:
                                                                              ClipRRect(
                                                                            borderRadius:
                                                                                BorderRadius.circular(24.0),
                                                                            child:
                                                                                Image.asset(
                                                                              'assets/images/LoveMap_.png',
                                                                              width: 57.0,
                                                                              height: 37.0,
                                                                              fit: BoxFit.cover,
                                                                              alignment: const Alignment(0.0, 0.0),
                                                                            ),
                                                                          ),
                                                                        ),
                                                                      ),
                                                                    ],
                                                                  ),
                                                                ),
                                                              ),
                                                              Align(
                                                                alignment:
                                                                    const AlignmentDirectional(
                                                                        0.0,
                                                                        0.0),
                                                                child: Padding(
                                                                  padding: const EdgeInsetsDirectional
                                                                      .fromSTEB(
                                                                          1.0,
                                                                          0.0,
                                                                          1.0,
                                                                          0.0),
                                                                  child: Text(
                                                                    FFLocalizations.of(
                                                                            context)
                                                                        .getText(
                                                                      'xqt0l0p0' /* Love */,
                                                                    ),
                                                                    style: FlutterFlowTheme.of(
                                                                            context)
                                                                        .bodyMedium
                                                                        .override(
                                                                          fontFamily:
                                                                              'Montserrat',
                                                                          fontSize:
                                                                              12.0,
                                                                          letterSpacing:
                                                                              0.0,
                                                                          fontWeight:
                                                                              FontWeight.w600,
                                                                        ),
                                                                  ),
                                                                ),
                                                              ),
                                                            ],
                                                          ),
                                                        ),
                                                      ),
                                                      Align(
                                                        alignment:
                                                            const AlignmentDirectional(
                                                                0.0, 0.0),
                                                        child: Column(
                                                          mainAxisSize:
                                                              MainAxisSize.min,
                                                          children: [
                                                            Expanded(
                                                              child: Align(
                                                                alignment:
                                                                    const AlignmentDirectional(
                                                                        0.0,
                                                                        0.0),
                                                                child: Stack(
                                                                  alignment:
                                                                      const AlignmentDirectional(
                                                                          0.0,
                                                                          0.0),
                                                                  children: [
                                                                    if (FFAppState()
                                                                        .MapSphereFilterImageIsHighlighted[10])
                                                                      Align(
                                                                        alignment: const AlignmentDirectional(
                                                                            0.0,
                                                                            0.0),
                                                                        child:
                                                                            Container(
                                                                          width:
                                                                              60.0,
                                                                          height:
                                                                              40.0,
                                                                          decoration:
                                                                              BoxDecoration(
                                                                            color:
                                                                                FlutterFlowTheme.of(context).primaryText,
                                                                            borderRadius:
                                                                                BorderRadius.circular(30.0),
                                                                          ),
                                                                          alignment: const AlignmentDirectional(
                                                                              0.0,
                                                                              0.0),
                                                                        ),
                                                                      ),
                                                                    Opacity(
                                                                      opacity:
                                                                          FFAppState()
                                                                              .SphereIconsReactionOnPressListGive[10],
                                                                      child:
                                                                          Align(
                                                                        alignment: const AlignmentDirectional(
                                                                            0.0,
                                                                            0.0),
                                                                        child:
                                                                            InkWell(
                                                                          splashColor:
                                                                              Colors.transparent,
                                                                          focusColor:
                                                                              Colors.transparent,
                                                                          hoverColor:
                                                                              Colors.transparent,
                                                                          highlightColor:
                                                                              Colors.transparent,
                                                                          onTap:
                                                                              () async {
                                                                            if (FFAppState().ListGiveTakeValuesforFilteronGmap.contains(valueOrDefault<String>(
                                                                                      'Character',
                                                                                      'error',
                                                                                    )) ==
                                                                                true) {
                                                                              FFAppState().removeFromListGiveTakeValuesforFilteronGmap('Character');
                                                                              FFAppState().update(() {});
                                                                              FFAppState().updateSphereIconsReactionOnPressListGiveAtIndex(
                                                                                10,
                                                                                (_) => 0.8,
                                                                              );
                                                                              safeSetState(() {});
                                                                              FFAppState().updateMapSphereFilterImageIsHighlightedAtIndex(
                                                                                10,
                                                                                (_) => false,
                                                                              );
                                                                              FFAppState().update(() {});
                                                                            } else {
                                                                              FFAppState().addToListGiveTakeValuesforFilteronGmap('Character');
                                                                              FFAppState().update(() {});
                                                                              FFAppState().updateSphereIconsReactionOnPressListGiveAtIndex(
                                                                                10,
                                                                                (_) => 1.0,
                                                                              );
                                                                              safeSetState(() {});
                                                                              FFAppState().updateMapSphereFilterImageIsHighlightedAtIndex(
                                                                                10,
                                                                                (_) => true,
                                                                              );
                                                                              FFAppState().update(() {});
                                                                            }
                                                                          },
                                                                          child:
                                                                              ClipRRect(
                                                                            borderRadius:
                                                                                BorderRadius.circular(24.0),
                                                                            child:
                                                                                Image.asset(
                                                                              'assets/images/CharacterMap.png',
                                                                              width: 57.0,
                                                                              height: 37.0,
                                                                              fit: BoxFit.cover,
                                                                              alignment: const Alignment(0.0, 0.0),
                                                                            ),
                                                                          ),
                                                                        ),
                                                                      ),
                                                                    ),
                                                                  ],
                                                                ),
                                                              ),
                                                            ),
                                                            Align(
                                                              alignment:
                                                                  const AlignmentDirectional(
                                                                      0.0, 0.0),
                                                              child: Padding(
                                                                padding:
                                                                    const EdgeInsetsDirectional
                                                                        .fromSTEB(
                                                                            1.0,
                                                                            0.0,
                                                                            1.0,
                                                                            0.0),
                                                                child: Text(
                                                                  FFLocalizations.of(
                                                                          context)
                                                                      .getText(
                                                                    'sozo1m9n' /* Character */,
                                                                  ),
                                                                  style: FlutterFlowTheme.of(
                                                                          context)
                                                                      .bodyMedium
                                                                      .override(
                                                                        fontFamily:
                                                                            'Montserrat',
                                                                        fontSize:
                                                                            12.0,
                                                                        letterSpacing:
                                                                            0.0,
                                                                        fontWeight:
                                                                            FontWeight.w600,
                                                                      ),
                                                                ),
                                                              ),
                                                            ),
                                                          ],
                                                        ),
                                                      ),
                                                      Align(
                                                        alignment:
                                                            const AlignmentDirectional(
                                                                0.0, 0.0),
                                                        child: Padding(
                                                          padding:
                                                              const EdgeInsetsDirectional
                                                                  .fromSTEB(
                                                                      7.0,
                                                                      0.0,
                                                                      7.0,
                                                                      0.0),
                                                          child: Column(
                                                            mainAxisSize:
                                                                MainAxisSize
                                                                    .max,
                                                            mainAxisAlignment:
                                                                MainAxisAlignment
                                                                    .center,
                                                            children: [
                                                              Expanded(
                                                                child: Align(
                                                                  alignment:
                                                                      const AlignmentDirectional(
                                                                          0.0,
                                                                          0.0),
                                                                  child: Stack(
                                                                    alignment:
                                                                        const AlignmentDirectional(
                                                                            0.0,
                                                                            0.0),
                                                                    children: [
                                                                      if (FFAppState()
                                                                          .MapSphereFilterImageIsHighlighted[9])
                                                                        Align(
                                                                          alignment: const AlignmentDirectional(
                                                                              0.0,
                                                                              0.0),
                                                                          child:
                                                                              Container(
                                                                            width:
                                                                                60.0,
                                                                            height:
                                                                                40.0,
                                                                            decoration:
                                                                                BoxDecoration(
                                                                              color: FlutterFlowTheme.of(context).primaryText,
                                                                              borderRadius: BorderRadius.circular(30.0),
                                                                            ),
                                                                            alignment:
                                                                                const AlignmentDirectional(0.0, 0.0),
                                                                          ),
                                                                        ),
                                                                      Opacity(
                                                                        opacity:
                                                                            FFAppState().SphereIconsReactionOnPressListGive[9],
                                                                        child:
                                                                            Align(
                                                                          alignment: const AlignmentDirectional(
                                                                              0.0,
                                                                              0.0),
                                                                          child:
                                                                              InkWell(
                                                                            splashColor:
                                                                                Colors.transparent,
                                                                            focusColor:
                                                                                Colors.transparent,
                                                                            hoverColor:
                                                                                Colors.transparent,
                                                                            highlightColor:
                                                                                Colors.transparent,
                                                                            onTap:
                                                                                () async {
                                                                              if (FFAppState().ListGiveTakeValuesforFilteronGmap.contains(valueOrDefault<String>(
                                                                                        'Family',
                                                                                        'error',
                                                                                      )) ==
                                                                                  true) {
                                                                                FFAppState().removeFromListGiveTakeValuesforFilteronGmap('Family');
                                                                                FFAppState().update(() {});
                                                                                FFAppState().updateSphereIconsReactionOnPressListGiveAtIndex(
                                                                                  9,
                                                                                  (_) => 0.8,
                                                                                );
                                                                                safeSetState(() {});
                                                                                FFAppState().updateMapSphereFilterImageIsHighlightedAtIndex(
                                                                                  9,
                                                                                  (_) => false,
                                                                                );
                                                                                FFAppState().update(() {});
                                                                              } else {
                                                                                FFAppState().addToListGiveTakeValuesforFilteronGmap('Family');
                                                                                FFAppState().update(() {});
                                                                                FFAppState().updateSphereIconsReactionOnPressListGiveAtIndex(
                                                                                  9,
                                                                                  (_) => 1.0,
                                                                                );
                                                                                safeSetState(() {});
                                                                                FFAppState().updateMapSphereFilterImageIsHighlightedAtIndex(
                                                                                  9,
                                                                                  (_) => true,
                                                                                );
                                                                                FFAppState().update(() {});
                                                                              }
                                                                            },
                                                                            child:
                                                                                ClipRRect(
                                                                              borderRadius: BorderRadius.circular(24.0),
                                                                              child: Image.asset(
                                                                                'assets/images/FamilyMap.png',
                                                                                width: 57.0,
                                                                                height: 37.0,
                                                                                fit: BoxFit.cover,
                                                                                alignment: const Alignment(0.0, 0.0),
                                                                              ),
                                                                            ),
                                                                          ),
                                                                        ),
                                                                      ),
                                                                    ],
                                                                  ),
                                                                ),
                                                              ),
                                                              Align(
                                                                alignment:
                                                                    const AlignmentDirectional(
                                                                        0.0,
                                                                        0.0),
                                                                child: Text(
                                                                  FFLocalizations.of(
                                                                          context)
                                                                      .getText(
                                                                    'h31uxo0g' /* Family */,
                                                                  ),
                                                                  style: FlutterFlowTheme.of(
                                                                          context)
                                                                      .bodyMedium
                                                                      .override(
                                                                        fontFamily:
                                                                            'Montserrat',
                                                                        fontSize:
                                                                            12.0,
                                                                        letterSpacing:
                                                                            0.0,
                                                                        fontWeight:
                                                                            FontWeight.w600,
                                                                      ),
                                                                ),
                                                              ),
                                                            ],
                                                          ),
                                                        ),
                                                      ),
                                                      Align(
                                                        alignment:
                                                            const AlignmentDirectional(
                                                                0.0, 0.0),
                                                        child: Padding(
                                                          padding:
                                                              const EdgeInsetsDirectional
                                                                  .fromSTEB(
                                                                      7.0,
                                                                      0.0,
                                                                      7.0,
                                                                      0.0),
                                                          child: Column(
                                                            mainAxisSize:
                                                                MainAxisSize
                                                                    .max,
                                                            mainAxisAlignment:
                                                                MainAxisAlignment
                                                                    .center,
                                                            children: [
                                                              Expanded(
                                                                child: Align(
                                                                  alignment:
                                                                      const AlignmentDirectional(
                                                                          0.0,
                                                                          0.0),
                                                                  child: Stack(
                                                                    alignment:
                                                                        const AlignmentDirectional(
                                                                            0.0,
                                                                            0.0),
                                                                    children: [
                                                                      if (FFAppState()
                                                                          .MapSphereFilterImageIsHighlighted[8])
                                                                        Align(
                                                                          alignment: const AlignmentDirectional(
                                                                              0.0,
                                                                              0.0),
                                                                          child:
                                                                              Container(
                                                                            width:
                                                                                60.0,
                                                                            height:
                                                                                40.0,
                                                                            decoration:
                                                                                BoxDecoration(
                                                                              color: FlutterFlowTheme.of(context).primaryText,
                                                                              borderRadius: BorderRadius.circular(30.0),
                                                                            ),
                                                                            alignment:
                                                                                const AlignmentDirectional(0.0, 0.0),
                                                                          ),
                                                                        ),
                                                                      Opacity(
                                                                        opacity:
                                                                            FFAppState().SphereIconsReactionOnPressListGive[8],
                                                                        child:
                                                                            InkWell(
                                                                          splashColor:
                                                                              Colors.transparent,
                                                                          focusColor:
                                                                              Colors.transparent,
                                                                          hoverColor:
                                                                              Colors.transparent,
                                                                          highlightColor:
                                                                              Colors.transparent,
                                                                          onTap:
                                                                              () async {
                                                                            if (FFAppState().ListGiveTakeValuesforFilteronGmap.contains(valueOrDefault<String>(
                                                                                      'Drive&Chill',
                                                                                      'error',
                                                                                    )) ==
                                                                                true) {
                                                                              FFAppState().removeFromListGiveTakeValuesforFilteronGmap('Drive&Chill');
                                                                              FFAppState().update(() {});
                                                                              FFAppState().updateSphereIconsReactionOnPressListGiveAtIndex(
                                                                                8,
                                                                                (_) => 0.8,
                                                                              );
                                                                              safeSetState(() {});
                                                                              FFAppState().updateMapSphereFilterImageIsHighlightedAtIndex(
                                                                                8,
                                                                                (_) => false,
                                                                              );
                                                                              FFAppState().update(() {});
                                                                            } else {
                                                                              FFAppState().addToListGiveTakeValuesforFilteronGmap('Drive&Chill');
                                                                              FFAppState().update(() {});
                                                                              FFAppState().updateSphereIconsReactionOnPressListGiveAtIndex(
                                                                                8,
                                                                                (_) => 1.0,
                                                                              );
                                                                              safeSetState(() {});
                                                                              FFAppState().updateMapSphereFilterImageIsHighlightedAtIndex(
                                                                                8,
                                                                                (_) => true,
                                                                              );
                                                                              FFAppState().update(() {});
                                                                            }
                                                                          },
                                                                          child:
                                                                              ClipRRect(
                                                                            borderRadius:
                                                                                BorderRadius.circular(30.0),
                                                                            child:
                                                                                Image.asset(
                                                                              'assets/images/image_14@2x.png',
                                                                              width: 57.0,
                                                                              height: 37.0,
                                                                              fit: BoxFit.cover,
                                                                              alignment: const Alignment(0.0, 0.0),
                                                                            ),
                                                                          ),
                                                                        ),
                                                                      ),
                                                                    ],
                                                                  ),
                                                                ),
                                                              ),
                                                              Align(
                                                                alignment:
                                                                    const AlignmentDirectional(
                                                                        0.0,
                                                                        0.0),
                                                                child: Padding(
                                                                  padding: const EdgeInsetsDirectional
                                                                      .fromSTEB(
                                                                          1.0,
                                                                          0.0,
                                                                          1.0,
                                                                          0.0),
                                                                  child: Text(
                                                                    FFLocalizations.of(
                                                                            context)
                                                                        .getText(
                                                                      '4keeafi1' /* Drive&Chill */,
                                                                    ),
                                                                    style: FlutterFlowTheme.of(
                                                                            context)
                                                                        .bodyMedium
                                                                        .override(
                                                                          fontFamily:
                                                                              'Montserrat',
                                                                          fontSize:
                                                                              12.0,
                                                                          letterSpacing:
                                                                              0.0,
                                                                          fontWeight:
                                                                              FontWeight.w600,
                                                                        ),
                                                                  ),
                                                                ),
                                                              ),
                                                            ],
                                                          ),
                                                        ),
                                                      ),
                                                      Column(
                                                        mainAxisSize:
                                                            MainAxisSize.max,
                                                        children: [
                                                          Expanded(
                                                            child: Align(
                                                              alignment:
                                                                  const AlignmentDirectional(
                                                                      0.0, 0.0),
                                                              child: Stack(
                                                                alignment:
                                                                    const AlignmentDirectional(
                                                                        0.0,
                                                                        0.0),
                                                                children: [
                                                                  if (FFAppState()
                                                                      .MapSphereFilterImageIsHighlighted[7])
                                                                    Align(
                                                                      alignment:
                                                                          const AlignmentDirectional(
                                                                              0.0,
                                                                              0.0),
                                                                      child:
                                                                          Container(
                                                                        width:
                                                                            60.0,
                                                                        height:
                                                                            40.0,
                                                                        decoration:
                                                                            BoxDecoration(
                                                                          color:
                                                                              FlutterFlowTheme.of(context).primaryText,
                                                                          borderRadius:
                                                                              BorderRadius.circular(30.0),
                                                                        ),
                                                                        alignment: const AlignmentDirectional(
                                                                            0.0,
                                                                            0.0),
                                                                      ),
                                                                    ),
                                                                  Opacity(
                                                                    opacity:
                                                                        FFAppState()
                                                                            .SphereIconsReactionOnPressListGive[7],
                                                                    child:
                                                                        Align(
                                                                      alignment:
                                                                          const AlignmentDirectional(
                                                                              0.0,
                                                                              0.0),
                                                                      child:
                                                                          InkWell(
                                                                        splashColor:
                                                                            Colors.transparent,
                                                                        focusColor:
                                                                            Colors.transparent,
                                                                        hoverColor:
                                                                            Colors.transparent,
                                                                        highlightColor:
                                                                            Colors.transparent,
                                                                        onTap:
                                                                            () async {
                                                                          if (FFAppState().ListGiveTakeValuesforFilteronGmap.contains(valueOrDefault<String>(
                                                                                    'Networking',
                                                                                    'error',
                                                                                  )) ==
                                                                              true) {
                                                                            FFAppState().removeFromListGiveTakeValuesforFilteronGmap('Networking');
                                                                            FFAppState().update(() {});
                                                                            FFAppState().updateSphereIconsReactionOnPressListGiveAtIndex(
                                                                              7,
                                                                              (_) => 0.8,
                                                                            );
                                                                            safeSetState(() {});
                                                                            FFAppState().updateMapSphereFilterImageIsHighlightedAtIndex(
                                                                              7,
                                                                              (_) => false,
                                                                            );
                                                                            FFAppState().update(() {});
                                                                          } else {
                                                                            FFAppState().addToListGiveTakeValuesforFilteronGmap('Networking');
                                                                            FFAppState().update(() {});
                                                                            FFAppState().updateSphereIconsReactionOnPressListGiveAtIndex(
                                                                              7,
                                                                              (_) => 1.0,
                                                                            );
                                                                            safeSetState(() {});
                                                                            FFAppState().updateMapSphereFilterImageIsHighlightedAtIndex(
                                                                              7,
                                                                              (_) => true,
                                                                            );
                                                                            FFAppState().update(() {});
                                                                          }
                                                                        },
                                                                        child:
                                                                            ClipRRect(
                                                                          borderRadius:
                                                                              BorderRadius.circular(24.0),
                                                                          child:
                                                                              Image.asset(
                                                                            'assets/images/NetworkingMap.png',
                                                                            width:
                                                                                57.0,
                                                                            height:
                                                                                37.0,
                                                                            fit:
                                                                                BoxFit.cover,
                                                                            alignment:
                                                                                const Alignment(0.0, 0.0),
                                                                          ),
                                                                        ),
                                                                      ),
                                                                    ),
                                                                  ),
                                                                ],
                                                              ),
                                                            ),
                                                          ),
                                                          Align(
                                                            alignment:
                                                                const AlignmentDirectional(
                                                                    0.0, 0.0),
                                                            child: Padding(
                                                              padding:
                                                                  const EdgeInsetsDirectional
                                                                      .fromSTEB(
                                                                          1.0,
                                                                          0.0,
                                                                          1.0,
                                                                          0.0),
                                                              child: Text(
                                                                FFLocalizations.of(
                                                                        context)
                                                                    .getText(
                                                                  'ds6ju2bb' /* Networking */,
                                                                ),
                                                                style: FlutterFlowTheme.of(
                                                                        context)
                                                                    .bodyMedium
                                                                    .override(
                                                                      fontFamily:
                                                                          'Montserrat',
                                                                      fontSize:
                                                                          12.0,
                                                                      letterSpacing:
                                                                          0.0,
                                                                      fontWeight:
                                                                          FontWeight
                                                                              .w600,
                                                                    ),
                                                              ),
                                                            ),
                                                          ),
                                                        ],
                                                      ),
                                                      Align(
                                                        alignment:
                                                            const AlignmentDirectional(
                                                                0.0, 0.0),
                                                        child: Padding(
                                                          padding:
                                                              const EdgeInsetsDirectional
                                                                  .fromSTEB(
                                                                      7.0,
                                                                      0.0,
                                                                      7.0,
                                                                      0.0),
                                                          child: Column(
                                                            mainAxisSize:
                                                                MainAxisSize
                                                                    .max,
                                                            mainAxisAlignment:
                                                                MainAxisAlignment
                                                                    .center,
                                                            children: [
                                                              Expanded(
                                                                child: Align(
                                                                  alignment:
                                                                      const AlignmentDirectional(
                                                                          0.0,
                                                                          0.0),
                                                                  child: Stack(
                                                                    alignment:
                                                                        const AlignmentDirectional(
                                                                            0.0,
                                                                            0.0),
                                                                    children: [
                                                                      if (FFAppState()
                                                                          .MapSphereFilterImageIsHighlighted[5])
                                                                        Align(
                                                                          alignment: const AlignmentDirectional(
                                                                              0.0,
                                                                              0.0),
                                                                          child:
                                                                              Container(
                                                                            width:
                                                                                60.0,
                                                                            height:
                                                                                40.0,
                                                                            decoration:
                                                                                BoxDecoration(
                                                                              color: FlutterFlowTheme.of(context).primaryText,
                                                                              borderRadius: BorderRadius.circular(30.0),
                                                                            ),
                                                                            alignment:
                                                                                const AlignmentDirectional(0.0, 0.0),
                                                                          ),
                                                                        ),
                                                                      Opacity(
                                                                        opacity:
                                                                            FFAppState().SphereIconsReactionOnPressListGive[5],
                                                                        child:
                                                                            Align(
                                                                          alignment: const AlignmentDirectional(
                                                                              0.0,
                                                                              0.0),
                                                                          child:
                                                                              InkWell(
                                                                            splashColor:
                                                                                Colors.transparent,
                                                                            focusColor:
                                                                                Colors.transparent,
                                                                            hoverColor:
                                                                                Colors.transparent,
                                                                            highlightColor:
                                                                                Colors.transparent,
                                                                            onTap:
                                                                                () async {
                                                                              if (FFAppState().ListGiveTakeValuesforFilteronGmap.contains(valueOrDefault<String>(
                                                                                        'Emotions',
                                                                                        'error',
                                                                                      )) ==
                                                                                  true) {
                                                                                FFAppState().removeFromListGiveTakeValuesforFilteronGmap('Emotions');
                                                                                FFAppState().update(() {});
                                                                                FFAppState().updateSphereIconsReactionOnPressListGiveAtIndex(
                                                                                  5,
                                                                                  (_) => 0.8,
                                                                                );
                                                                                safeSetState(() {});
                                                                                FFAppState().updateMapSphereFilterImageIsHighlightedAtIndex(
                                                                                  5,
                                                                                  (_) => false,
                                                                                );
                                                                                FFAppState().update(() {});
                                                                              } else {
                                                                                FFAppState().addToListGiveTakeValuesforFilteronGmap('Emotions');
                                                                                FFAppState().update(() {});
                                                                                FFAppState().updateSphereIconsReactionOnPressListGiveAtIndex(
                                                                                  5,
                                                                                  (_) => 1.0,
                                                                                );
                                                                                safeSetState(() {});
                                                                                FFAppState().updateMapSphereFilterImageIsHighlightedAtIndex(
                                                                                  5,
                                                                                  (_) => true,
                                                                                );
                                                                                FFAppState().update(() {});
                                                                              }
                                                                            },
                                                                            child:
                                                                                ClipRRect(
                                                                              borderRadius: BorderRadius.circular(30.0),
                                                                              child: Image.asset(
                                                                                'assets/images/EmotionsMap.png',
                                                                                width: 57.0,
                                                                                height: 37.0,
                                                                                fit: BoxFit.cover,
                                                                                alignment: const Alignment(0.0, 0.0),
                                                                              ),
                                                                            ),
                                                                          ),
                                                                        ),
                                                                      ),
                                                                    ],
                                                                  ),
                                                                ),
                                                              ),
                                                              Align(
                                                                alignment:
                                                                    const AlignmentDirectional(
                                                                        0.0,
                                                                        0.0),
                                                                child: Padding(
                                                                  padding: const EdgeInsetsDirectional
                                                                      .fromSTEB(
                                                                          1.0,
                                                                          0.0,
                                                                          1.0,
                                                                          0.0),
                                                                  child: Text(
                                                                    FFLocalizations.of(
                                                                            context)
                                                                        .getText(
                                                                      '9x4yue00' /* Emotions */,
                                                                    ),
                                                                    style: FlutterFlowTheme.of(
                                                                            context)
                                                                        .bodyMedium
                                                                        .override(
                                                                          fontFamily:
                                                                              'Montserrat',
                                                                          fontSize:
                                                                              12.0,
                                                                          letterSpacing:
                                                                              0.0,
                                                                          fontWeight:
                                                                              FontWeight.w600,
                                                                        ),
                                                                  ),
                                                                ),
                                                              ),
                                                            ],
                                                          ),
                                                        ),
                                                      ),
                                                      Align(
                                                        alignment:
                                                            const AlignmentDirectional(
                                                                0.0, 0.0),
                                                        child: Padding(
                                                          padding:
                                                              const EdgeInsetsDirectional
                                                                  .fromSTEB(
                                                                      7.0,
                                                                      0.0,
                                                                      7.0,
                                                                      0.0),
                                                          child: Column(
                                                            mainAxisSize:
                                                                MainAxisSize
                                                                    .max,
                                                            mainAxisAlignment:
                                                                MainAxisAlignment
                                                                    .center,
                                                            children: [
                                                              Expanded(
                                                                child: Align(
                                                                  alignment:
                                                                      const AlignmentDirectional(
                                                                          0.0,
                                                                          0.0),
                                                                  child: Stack(
                                                                    alignment:
                                                                        const AlignmentDirectional(
                                                                            0.0,
                                                                            0.0),
                                                                    children: [
                                                                      if (FFAppState()
                                                                          .MapSphereFilterImageIsHighlighted[4])
                                                                        Align(
                                                                          alignment: const AlignmentDirectional(
                                                                              0.0,
                                                                              0.0),
                                                                          child:
                                                                              Container(
                                                                            width:
                                                                                60.0,
                                                                            height:
                                                                                40.0,
                                                                            decoration:
                                                                                BoxDecoration(
                                                                              color: FlutterFlowTheme.of(context).primaryText,
                                                                              borderRadius: BorderRadius.circular(30.0),
                                                                            ),
                                                                            alignment:
                                                                                const AlignmentDirectional(0.0, 0.0),
                                                                          ),
                                                                        ),
                                                                      Opacity(
                                                                        opacity:
                                                                            FFAppState().SphereIconsReactionOnPressListGive[4],
                                                                        child:
                                                                            InkWell(
                                                                          splashColor:
                                                                              Colors.transparent,
                                                                          focusColor:
                                                                              Colors.transparent,
                                                                          hoverColor:
                                                                              Colors.transparent,
                                                                          highlightColor:
                                                                              Colors.transparent,
                                                                          onTap:
                                                                              () async {
                                                                            if (FFAppState().ListGiveTakeValuesforFilteronGmap.contains(valueOrDefault<String>(
                                                                                      'Spirit',
                                                                                      'error',
                                                                                    )) ==
                                                                                true) {
                                                                              FFAppState().removeFromListGiveTakeValuesforFilteronGmap('Spirit');
                                                                              FFAppState().update(() {});
                                                                              FFAppState().updateSphereIconsReactionOnPressListGiveAtIndex(
                                                                                4,
                                                                                (_) => 0.8,
                                                                              );
                                                                              safeSetState(() {});
                                                                              FFAppState().updateMapSphereFilterImageIsHighlightedAtIndex(
                                                                                4,
                                                                                (_) => false,
                                                                              );
                                                                              FFAppState().update(() {});
                                                                            } else {
                                                                              FFAppState().addToListGiveTakeValuesforFilteronGmap('Spirit');
                                                                              FFAppState().update(() {});
                                                                              FFAppState().updateSphereIconsReactionOnPressListGiveAtIndex(
                                                                                4,
                                                                                (_) => 1.0,
                                                                              );
                                                                              safeSetState(() {});
                                                                              FFAppState().updateMapSphereFilterImageIsHighlightedAtIndex(
                                                                                4,
                                                                                (_) => true,
                                                                              );
                                                                              FFAppState().update(() {});
                                                                            }
                                                                          },
                                                                          child:
                                                                              ClipRRect(
                                                                            borderRadius:
                                                                                BorderRadius.circular(30.0),
                                                                            child:
                                                                                Image.asset(
                                                                              'assets/images/SpiritMap.png',
                                                                              width: 57.0,
                                                                              height: 37.0,
                                                                              fit: BoxFit.cover,
                                                                              alignment: const Alignment(0.0, 0.0),
                                                                            ),
                                                                          ),
                                                                        ),
                                                                      ),
                                                                    ],
                                                                  ),
                                                                ),
                                                              ),
                                                              Align(
                                                                alignment:
                                                                    const AlignmentDirectional(
                                                                        0.0,
                                                                        0.0),
                                                                child: Text(
                                                                  FFLocalizations.of(
                                                                          context)
                                                                      .getText(
                                                                    'u63ycljh' /* Spirit */,
                                                                  ),
                                                                  style: FlutterFlowTheme.of(
                                                                          context)
                                                                      .bodyMedium
                                                                      .override(
                                                                        fontFamily:
                                                                            'Montserrat',
                                                                        fontSize:
                                                                            12.0,
                                                                        letterSpacing:
                                                                            0.0,
                                                                        fontWeight:
                                                                            FontWeight.w600,
                                                                      ),
                                                                ),
                                                              ),
                                                            ],
                                                          ),
                                                        ),
                                                      ),
                                                      Align(
                                                        alignment:
                                                            const AlignmentDirectional(
                                                                0.0, 0.0),
                                                        child: Padding(
                                                          padding:
                                                              const EdgeInsetsDirectional
                                                                  .fromSTEB(
                                                                      7.0,
                                                                      0.0,
                                                                      30.0,
                                                                      0.0),
                                                          child: Column(
                                                            mainAxisSize:
                                                                MainAxisSize
                                                                    .max,
                                                            mainAxisAlignment:
                                                                MainAxisAlignment
                                                                    .center,
                                                            children: [
                                                              Expanded(
                                                                child: Align(
                                                                  alignment:
                                                                      const AlignmentDirectional(
                                                                          0.0,
                                                                          0.0),
                                                                  child: Stack(
                                                                    alignment:
                                                                        const AlignmentDirectional(
                                                                            0.0,
                                                                            0.0),
                                                                    children: [
                                                                      if (FFAppState()
                                                                          .MapSphereFilterImageIsHighlighted[3])
                                                                        Align(
                                                                          alignment: const AlignmentDirectional(
                                                                              0.0,
                                                                              0.0),
                                                                          child:
                                                                              Container(
                                                                            width:
                                                                                60.0,
                                                                            height:
                                                                                40.0,
                                                                            decoration:
                                                                                BoxDecoration(
                                                                              color: FlutterFlowTheme.of(context).primaryText,
                                                                              borderRadius: BorderRadius.circular(30.0),
                                                                            ),
                                                                            alignment:
                                                                                const AlignmentDirectional(0.0, 0.0),
                                                                          ),
                                                                        ),
                                                                      Opacity(
                                                                        opacity:
                                                                            FFAppState().SphereIconsReactionOnPressListGive[3],
                                                                        child:
                                                                            Align(
                                                                          alignment: const AlignmentDirectional(
                                                                              0.0,
                                                                              0.0),
                                                                          child:
                                                                              InkWell(
                                                                            splashColor:
                                                                                Colors.transparent,
                                                                            focusColor:
                                                                                Colors.transparent,
                                                                            hoverColor:
                                                                                Colors.transparent,
                                                                            highlightColor:
                                                                                Colors.transparent,
                                                                            onTap:
                                                                                () async {
                                                                              if (FFAppState().ListGiveTakeValuesforFilteronGmap.contains(valueOrDefault<String>(
                                                                                        'Finances',
                                                                                        'error',
                                                                                      )) ==
                                                                                  true) {
                                                                                FFAppState().removeFromListGiveTakeValuesforFilteronGmap('Finances');
                                                                                FFAppState().updateSphereIconsReactionOnPressListGiveAtIndex(
                                                                                  3,
                                                                                  (_) => 0.8,
                                                                                );
                                                                                FFAppState().update(() {});
                                                                                FFAppState().updateMapSphereFilterImageIsHighlightedAtIndex(
                                                                                  3,
                                                                                  (_) => false,
                                                                                );
                                                                                FFAppState().update(() {});
                                                                              } else {
                                                                                FFAppState().addToListGiveTakeValuesforFilteronGmap('Finances');
                                                                                FFAppState().updateSphereIconsReactionOnPressListGiveAtIndex(
                                                                                  3,
                                                                                  (_) => 1.0,
                                                                                );
                                                                                FFAppState().update(() {});
                                                                                FFAppState().updateMapSphereFilterImageIsHighlightedAtIndex(
                                                                                  3,
                                                                                  (_) => true,
                                                                                );
                                                                                FFAppState().update(() {});
                                                                              }
                                                                            },
                                                                            child:
                                                                                ClipRRect(
                                                                              borderRadius: BorderRadius.circular(30.0),
                                                                              child: Image.asset(
                                                                                'assets/images/Finances.png',
                                                                                width: 57.0,
                                                                                height: 37.0,
                                                                                fit: BoxFit.cover,
                                                                                alignment: const Alignment(0.0, 0.0),
                                                                              ),
                                                                            ),
                                                                          ),
                                                                        ),
                                                                      ),
                                                                    ],
                                                                  ),
                                                                ),
                                                              ),
                                                              Align(
                                                                alignment:
                                                                    const AlignmentDirectional(
                                                                        0.0,
                                                                        0.0),
                                                                child: Text(
                                                                  FFLocalizations.of(
                                                                          context)
                                                                      .getText(
                                                                    '2iadqlz8' /* Finances */,
                                                                  ),
                                                                  style: FlutterFlowTheme.of(
                                                                          context)
                                                                      .bodyMedium
                                                                      .override(
                                                                        fontFamily:
                                                                            'Montserrat',
                                                                        fontSize:
                                                                            12.0,
                                                                        letterSpacing:
                                                                            0.0,
                                                                        fontWeight:
                                                                            FontWeight.w600,
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
                                              ),
                                            ],
                                          ),
                                        ],
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
                          child: SizedBox(
                            width: 350.0,
                            height: 30.0,
                            child: Stack(
                              alignment: const AlignmentDirectional(0.0, 0.0),
                              children: [
                                if ((FFAppState()
                                        .ListGiveTakeValuesforFilteronGmap
                                        .isNotEmpty) ==
                                    true)
                                  Align(
                                    alignment: const AlignmentDirectional(0.0, 0.0),
                                    child: ClipRRect(
                                      borderRadius: BorderRadius.circular(0.0),
                                      child: BackdropFilter(
                                        filter: ImageFilter.blur(
                                          sigmaX: 5.0,
                                          sigmaY: 5.0,
                                        ),
                                        child: Align(
                                          alignment:
                                              const AlignmentDirectional(0.0, 0.0),
                                          child: Container(
                                            width: 338.0,
                                            height: 66.0,
                                            decoration: const BoxDecoration(
                                              color: Color(0x6A2B3138),
                                              borderRadius: BorderRadius.only(
                                                bottomLeft:
                                                    Radius.circular(30.0),
                                                bottomRight:
                                                    Radius.circular(30.0),
                                                topLeft: Radius.circular(30.0),
                                                topRight: Radius.circular(30.0),
                                              ),
                                            ),
                                            alignment:
                                                const AlignmentDirectional(0.0, 0.0),
                                          ),
                                        ),
                                      ),
                                    ),
                                  ),
                                if ((FFAppState()
                                        .ListGiveTakeValuesforFilteronGmap
                                        .isNotEmpty) ==
                                    true)
                                  Align(
                                    alignment: const AlignmentDirectional(0.0, 0.0),
                                    child: Container(
                                      decoration: const BoxDecoration(
                                        color: Colors.transparent,
                                        borderRadius: BorderRadius.only(
                                          bottomLeft: Radius.circular(30.0),
                                          bottomRight: Radius.circular(30.0),
                                          topLeft: Radius.circular(30.0),
                                          topRight: Radius.circular(30.0),
                                        ),
                                      ),
                                      child: Align(
                                        alignment:
                                            const AlignmentDirectional(0.0, 0.0),
                                        child: Row(
                                          mainAxisSize: MainAxisSize.max,
                                          mainAxisAlignment:
                                              MainAxisAlignment.center,
                                          children: [
                                            if (FFAppState()
                                                    .ListGiveTakeValuesforFilteronGmap
                                                    .contains(
                                                        valueOrDefault<String>(
                                                      'Networking',
                                                      'error',
                                                    )) ==
                                                true)
                                              Align(
                                                alignment: const AlignmentDirectional(
                                                    0.0, 0.0),
                                                child: Container(
                                                  width: 23.0,
                                                  height: 23.0,
                                                  decoration: BoxDecoration(
                                                    color: FlutterFlowTheme.of(
                                                            context)
                                                        .primaryText,
                                                    shape: BoxShape.circle,
                                                  ),
                                                  child: Visibility(
                                                    visible: FFAppState()
                                                            .ListGiveTakeValuesforFilteronGmap
                                                            .contains(
                                                                valueOrDefault<
                                                                    String>(
                                                              'Networking',
                                                              'error',
                                                            )) ==
                                                        true,
                                                    child: Align(
                                                      alignment:
                                                          const AlignmentDirectional(
                                                              0.0, 0.0),
                                                      child: Container(
                                                        width: 21.0,
                                                        height: 21.0,
                                                        clipBehavior:
                                                            Clip.antiAlias,
                                                        decoration:
                                                            const BoxDecoration(
                                                          shape:
                                                              BoxShape.circle,
                                                        ),
                                                        child: Image.asset(
                                                          'assets/images/NetworkingMap.png',
                                                          fit: BoxFit.cover,
                                                          alignment: const Alignment(
                                                              0.0, 0.0),
                                                        ),
                                                      ).animateOnPageLoad(
                                                          animationsMap[
                                                              'circleImageOnPageLoadAnimation1']!),
                                                    ),
                                                  ),
                                                ),
                                              ),
                                            if (FFAppState()
                                                    .ListGiveTakeValuesforFilteronGmap
                                                    .contains(
                                                        valueOrDefault<String>(
                                                      'Spirit',
                                                      'error',
                                                    )) ==
                                                true)
                                              Align(
                                                alignment: const AlignmentDirectional(
                                                    0.0, 0.0),
                                                child: Container(
                                                  width: 23.0,
                                                  height: 23.0,
                                                  decoration: BoxDecoration(
                                                    color: FlutterFlowTheme.of(
                                                            context)
                                                        .primaryText,
                                                    shape: BoxShape.circle,
                                                  ),
                                                  alignment:
                                                      const AlignmentDirectional(
                                                          0.0, 0.0),
                                                  child: Visibility(
                                                    visible: FFAppState()
                                                            .ListGiveTakeValuesforFilteronGmap
                                                            .contains(
                                                                valueOrDefault<
                                                                    String>(
                                                              'Spirit',
                                                              'error',
                                                            )) ==
                                                        true,
                                                    child: Align(
                                                      alignment:
                                                          const AlignmentDirectional(
                                                              0.0, 0.0),
                                                      child: Container(
                                                        width: 21.0,
                                                        height: 21.0,
                                                        clipBehavior:
                                                            Clip.antiAlias,
                                                        decoration:
                                                            const BoxDecoration(
                                                          shape:
                                                              BoxShape.circle,
                                                        ),
                                                        child: Image.asset(
                                                          'assets/images/SpiritMap.png',
                                                          fit: BoxFit.cover,
                                                          alignment: const Alignment(
                                                              0.0, 0.0),
                                                        ),
                                                      ).animateOnPageLoad(
                                                          animationsMap[
                                                              'circleImageOnPageLoadAnimation2']!),
                                                    ),
                                                  ),
                                                ),
                                              ),
                                            if (FFAppState()
                                                    .ListGiveTakeValuesforFilteronGmap
                                                    .contains(
                                                        valueOrDefault<String>(
                                                      'Finances',
                                                      'error',
                                                    )) ==
                                                true)
                                              Align(
                                                alignment: const AlignmentDirectional(
                                                    0.0, 0.0),
                                                child: Container(
                                                  width: 23.0,
                                                  height: 23.0,
                                                  decoration: BoxDecoration(
                                                    color: FlutterFlowTheme.of(
                                                            context)
                                                        .primaryText,
                                                    shape: BoxShape.circle,
                                                  ),
                                                  alignment:
                                                      const AlignmentDirectional(
                                                          0.0, 0.0),
                                                  child: Visibility(
                                                    visible: FFAppState()
                                                            .ListGiveTakeValuesforFilteronGmap
                                                            .contains(
                                                                valueOrDefault<
                                                                    String>(
                                                              'Finances',
                                                              'error',
                                                            )) ==
                                                        true,
                                                    child: Align(
                                                      alignment:
                                                          const AlignmentDirectional(
                                                              0.0, 0.0),
                                                      child: Container(
                                                        width: 21.0,
                                                        height: 21.0,
                                                        clipBehavior:
                                                            Clip.antiAlias,
                                                        decoration:
                                                            const BoxDecoration(
                                                          shape:
                                                              BoxShape.circle,
                                                        ),
                                                        child: Image.asset(
                                                          'assets/images/Finances.png',
                                                          fit: BoxFit.cover,
                                                          alignment: const Alignment(
                                                              0.0, 0.0),
                                                        ),
                                                      ).animateOnPageLoad(
                                                          animationsMap[
                                                              'circleImageOnPageLoadAnimation3']!),
                                                    ),
                                                  ),
                                                ),
                                              ),
                                            if (FFAppState()
                                                    .ListGiveTakeValuesforFilteronGmap
                                                    .contains(
                                                        valueOrDefault<String>(
                                                      'Emotions',
                                                      'error',
                                                    )) ==
                                                true)
                                              Align(
                                                alignment: const AlignmentDirectional(
                                                    0.0, 0.0),
                                                child: Container(
                                                  width: 23.0,
                                                  height: 23.0,
                                                  decoration: BoxDecoration(
                                                    color: FlutterFlowTheme.of(
                                                            context)
                                                        .primaryText,
                                                    shape: BoxShape.circle,
                                                  ),
                                                  alignment:
                                                      const AlignmentDirectional(
                                                          0.0, 0.0),
                                                  child: Visibility(
                                                    visible: FFAppState()
                                                            .ListGiveTakeValuesforFilteronGmap
                                                            .contains(
                                                                valueOrDefault<
                                                                    String>(
                                                              'Emotions',
                                                              'error',
                                                            )) ==
                                                        true,
                                                    child: Container(
                                                      width: 21.0,
                                                      height: 21.0,
                                                      clipBehavior:
                                                          Clip.antiAlias,
                                                      decoration: const BoxDecoration(
                                                        shape: BoxShape.circle,
                                                      ),
                                                      child: Image.asset(
                                                        'assets/images/EmotionsMap.png',
                                                        fit: BoxFit.cover,
                                                      ),
                                                    ).animateOnPageLoad(
                                                        animationsMap[
                                                            'circleImageOnPageLoadAnimation4']!),
                                                  ),
                                                ),
                                              ),
                                            if (FFAppState()
                                                    .ListGiveTakeValuesforFilteronGmap
                                                    .contains(
                                                        valueOrDefault<String>(
                                                      'Health',
                                                      'error',
                                                    )) ==
                                                true)
                                              Align(
                                                alignment: const AlignmentDirectional(
                                                    0.0, 0.0),
                                                child: Container(
                                                  width: 23.0,
                                                  height: 23.0,
                                                  decoration: BoxDecoration(
                                                    color: FlutterFlowTheme.of(
                                                            context)
                                                        .primaryText,
                                                    shape: BoxShape.circle,
                                                  ),
                                                  alignment:
                                                      const AlignmentDirectional(
                                                          0.0, 0.0),
                                                  child: Visibility(
                                                    visible: FFAppState()
                                                            .ListGiveTakeValuesforFilteronGmap
                                                            .contains(
                                                                valueOrDefault<
                                                                    String>(
                                                              'Health',
                                                              'error',
                                                            )) ==
                                                        true,
                                                    child: Container(
                                                      width: 21.0,
                                                      height: 21.0,
                                                      clipBehavior:
                                                          Clip.antiAlias,
                                                      decoration: const BoxDecoration(
                                                        shape: BoxShape.circle,
                                                      ),
                                                      child: Image.asset(
                                                        'assets/images/Health.png',
                                                        fit: BoxFit.cover,
                                                        alignment:
                                                            const Alignment(0.0, 0.0),
                                                      ),
                                                    ).animateOnPageLoad(
                                                        animationsMap[
                                                            'circleImageOnPageLoadAnimation5']!),
                                                  ),
                                                ),
                                              ),
                                            if (FFAppState()
                                                    .ListGiveTakeValuesforFilteronGmap
                                                    .contains(
                                                        valueOrDefault<String>(
                                                      'Intellect',
                                                      'error',
                                                    )) ==
                                                true)
                                              Align(
                                                alignment: const AlignmentDirectional(
                                                    0.0, 0.0),
                                                child: Container(
                                                  width: 23.0,
                                                  height: 23.0,
                                                  decoration: BoxDecoration(
                                                    color: FlutterFlowTheme.of(
                                                            context)
                                                        .secondaryText,
                                                    shape: BoxShape.circle,
                                                  ),
                                                  child: Visibility(
                                                    visible: FFAppState()
                                                            .ListGiveTakeValuesforFilteronGmap
                                                            .contains(
                                                                valueOrDefault<
                                                                    String>(
                                                              'Intellect',
                                                              'error',
                                                            )) ==
                                                        true,
                                                    child: Align(
                                                      alignment:
                                                          const AlignmentDirectional(
                                                              0.0, 0.0),
                                                      child: Container(
                                                        width: 21.0,
                                                        height: 21.0,
                                                        clipBehavior:
                                                            Clip.antiAlias,
                                                        decoration:
                                                            const BoxDecoration(
                                                          shape:
                                                              BoxShape.circle,
                                                        ),
                                                        child: Image.asset(
                                                          'assets/images/IntellectForGmapPage.png',
                                                          fit: BoxFit.cover,
                                                        ),
                                                      ).animateOnPageLoad(
                                                          animationsMap[
                                                              'circleImageOnPageLoadAnimation6']!),
                                                    ),
                                                  ),
                                                ),
                                              ),
                                            if (FFAppState()
                                                    .ListGiveTakeValuesforFilteronGmap
                                                    .contains(
                                                        valueOrDefault<String>(
                                                      'Career',
                                                      'error',
                                                    )) ==
                                                true)
                                              Align(
                                                alignment: const AlignmentDirectional(
                                                    0.0, 0.0),
                                                child: Container(
                                                  width: 23.0,
                                                  height: 23.0,
                                                  decoration: BoxDecoration(
                                                    color: FlutterFlowTheme.of(
                                                            context)
                                                        .primaryText,
                                                    shape: BoxShape.circle,
                                                  ),
                                                  alignment:
                                                      const AlignmentDirectional(
                                                          0.0, 0.0),
                                                  child: Visibility(
                                                    visible: FFAppState()
                                                            .ListGiveTakeValuesforFilteronGmap
                                                            .contains(
                                                                valueOrDefault<
                                                                    String>(
                                                              'Career',
                                                              'error',
                                                            )) ==
                                                        true,
                                                    child: Container(
                                                      width: 21.0,
                                                      height: 21.0,
                                                      clipBehavior:
                                                          Clip.antiAlias,
                                                      decoration: const BoxDecoration(
                                                        shape: BoxShape.circle,
                                                      ),
                                                      child: Image.asset(
                                                        'assets/images/image_3.png',
                                                        fit: BoxFit.cover,
                                                        alignment:
                                                            const Alignment(0.0, 0.0),
                                                      ),
                                                    ).animateOnPageLoad(
                                                        animationsMap[
                                                            'circleImageOnPageLoadAnimation7']!),
                                                  ),
                                                ),
                                              ),
                                            if (FFAppState()
                                                    .ListGiveTakeValuesforFilteronGmap
                                                    .contains(
                                                        valueOrDefault<String>(
                                                      'Balance',
                                                      'error',
                                                    )) ==
                                                true)
                                              Align(
                                                alignment: const AlignmentDirectional(
                                                    0.0, 0.0),
                                                child: Container(
                                                  width: 23.0,
                                                  height: 23.0,
                                                  decoration: BoxDecoration(
                                                    color: FlutterFlowTheme.of(
                                                            context)
                                                        .primaryText,
                                                    shape: BoxShape.circle,
                                                  ),
                                                  alignment:
                                                      const AlignmentDirectional(
                                                          0.0, 0.0),
                                                  child: Visibility(
                                                    visible: FFAppState()
                                                            .ListGiveTakeValuesforFilteronGmap
                                                            .contains(
                                                                valueOrDefault<
                                                                    String>(
                                                              'Balance',
                                                              'error',
                                                            )) ==
                                                        true,
                                                    child: Align(
                                                      alignment:
                                                          const AlignmentDirectional(
                                                              0.0, 0.0),
                                                      child: Container(
                                                        width: 21.0,
                                                        height: 21.0,
                                                        clipBehavior:
                                                            Clip.antiAlias,
                                                        decoration:
                                                            const BoxDecoration(
                                                          shape:
                                                              BoxShape.circle,
                                                        ),
                                                        child: Image.asset(
                                                          'assets/images/Balance.png',
                                                          fit: BoxFit.cover,
                                                          alignment: const Alignment(
                                                              0.0, 0.0),
                                                        ),
                                                      ).animateOnPageLoad(
                                                          animationsMap[
                                                              'circleImageOnPageLoadAnimation8']!),
                                                    ),
                                                  ),
                                                ),
                                              ),
                                            if (FFAppState()
                                                    .ListGiveTakeValuesforFilteronGmap
                                                    .contains(
                                                        valueOrDefault<String>(
                                                      'Drive&Chill',
                                                      'error',
                                                    )) ==
                                                true)
                                              Align(
                                                alignment: const AlignmentDirectional(
                                                    0.0, 0.0),
                                                child: Container(
                                                  width: 23.0,
                                                  height: 23.0,
                                                  decoration: BoxDecoration(
                                                    color: FlutterFlowTheme.of(
                                                            context)
                                                        .primaryText,
                                                    shape: BoxShape.circle,
                                                  ),
                                                  alignment:
                                                      const AlignmentDirectional(
                                                          0.0, 0.0),
                                                  child: Visibility(
                                                    visible: FFAppState()
                                                            .ListGiveTakeValuesforFilteronGmap
                                                            .contains(
                                                                valueOrDefault<
                                                                    String>(
                                                              'Drive&Chill',
                                                              'error',
                                                            )) ==
                                                        true,
                                                    child: Align(
                                                      alignment:
                                                          const AlignmentDirectional(
                                                              0.0, 0.0),
                                                      child: Container(
                                                        width: 21.0,
                                                        height: 21.0,
                                                        clipBehavior:
                                                            Clip.antiAlias,
                                                        decoration:
                                                            const BoxDecoration(
                                                          shape:
                                                              BoxShape.circle,
                                                        ),
                                                        child: Image.asset(
                                                          'assets/images/image_14@2x.png',
                                                          fit: BoxFit.cover,
                                                          alignment: const Alignment(
                                                              0.0, 0.0),
                                                        ),
                                                      ).animateOnPageLoad(
                                                          animationsMap[
                                                              'circleImageOnPageLoadAnimation9']!),
                                                    ),
                                                  ),
                                                ),
                                              ),
                                            if (FFAppState()
                                                    .ListGiveTakeValuesforFilteronGmap
                                                    .contains(
                                                        valueOrDefault<String>(
                                                      'Family',
                                                      'error',
                                                    )) ==
                                                true)
                                              Align(
                                                alignment: const AlignmentDirectional(
                                                    0.0, 0.0),
                                                child: Container(
                                                  width: 23.0,
                                                  height: 23.0,
                                                  decoration: BoxDecoration(
                                                    color: FlutterFlowTheme.of(
                                                            context)
                                                        .primaryText,
                                                    shape: BoxShape.circle,
                                                  ),
                                                  alignment:
                                                      const AlignmentDirectional(
                                                          0.0, 0.0),
                                                  child: Visibility(
                                                    visible: FFAppState()
                                                            .ListGiveTakeValuesforFilteronGmap
                                                            .contains(
                                                                valueOrDefault<
                                                                    String>(
                                                              'Family',
                                                              'error',
                                                            )) ==
                                                        true,
                                                    child: Align(
                                                      alignment:
                                                          const AlignmentDirectional(
                                                              0.0, 0.0),
                                                      child: Container(
                                                        width: 21.0,
                                                        height: 21.0,
                                                        clipBehavior:
                                                            Clip.antiAlias,
                                                        decoration:
                                                            const BoxDecoration(
                                                          shape:
                                                              BoxShape.circle,
                                                        ),
                                                        child: Image.asset(
                                                          'assets/images/FamilyMap.png',
                                                          fit: BoxFit.cover,
                                                          alignment: const Alignment(
                                                              0.0, 0.0),
                                                        ),
                                                      ).animateOnPageLoad(
                                                          animationsMap[
                                                              'circleImageOnPageLoadAnimation10']!),
                                                    ),
                                                  ),
                                                ),
                                              ),
                                            if (FFAppState()
                                                    .ListGiveTakeValuesforFilteronGmap
                                                    .contains(
                                                        valueOrDefault<String>(
                                                      'Character',
                                                      'error',
                                                    )) ==
                                                true)
                                              Align(
                                                alignment: const AlignmentDirectional(
                                                    0.0, 0.0),
                                                child: Container(
                                                  width: 23.0,
                                                  height: 23.0,
                                                  decoration: BoxDecoration(
                                                    color: FlutterFlowTheme.of(
                                                            context)
                                                        .primaryText,
                                                    shape: BoxShape.circle,
                                                  ),
                                                  alignment:
                                                      const AlignmentDirectional(
                                                          0.0, 0.0),
                                                  child: Visibility(
                                                    visible: FFAppState()
                                                            .ListGiveTakeValuesforFilteronGmap
                                                            .contains(
                                                                valueOrDefault<
                                                                    String>(
                                                              'Character',
                                                              'error',
                                                            )) ==
                                                        true,
                                                    child: Align(
                                                      alignment:
                                                          const AlignmentDirectional(
                                                              0.0, 0.0),
                                                      child: Container(
                                                        width: 21.0,
                                                        height: 21.0,
                                                        clipBehavior:
                                                            Clip.antiAlias,
                                                        decoration:
                                                            const BoxDecoration(
                                                          shape:
                                                              BoxShape.circle,
                                                        ),
                                                        child: Image.asset(
                                                          'assets/images/CharacterMap.png',
                                                          fit: BoxFit.cover,
                                                          alignment: const Alignment(
                                                              0.0, 0.0),
                                                        ),
                                                      ).animateOnPageLoad(
                                                          animationsMap[
                                                              'circleImageOnPageLoadAnimation11']!),
                                                    ),
                                                  ),
                                                ),
                                              ),
                                            if (FFAppState()
                                                    .ListGiveTakeValuesforFilteronGmap
                                                    .contains(
                                                        valueOrDefault<String>(
                                                      'Love',
                                                      'error',
                                                    )) ==
                                                true)
                                              Align(
                                                alignment: const AlignmentDirectional(
                                                    0.0, 0.0),
                                                child: Container(
                                                  width: 23.0,
                                                  height: 23.0,
                                                  decoration: BoxDecoration(
                                                    color: FlutterFlowTheme.of(
                                                            context)
                                                        .primaryText,
                                                    shape: BoxShape.circle,
                                                  ),
                                                  alignment:
                                                      const AlignmentDirectional(
                                                          0.0, 0.0),
                                                  child: Visibility(
                                                    visible: FFAppState()
                                                            .ListGiveTakeValuesforFilteronGmap
                                                            .contains(
                                                                valueOrDefault<
                                                                    String>(
                                                              'Love',
                                                              'error',
                                                            )) ==
                                                        true,
                                                    child: Align(
                                                      alignment:
                                                          const AlignmentDirectional(
                                                              0.0, 0.0),
                                                      child: Container(
                                                        width: 21.0,
                                                        height: 21.0,
                                                        clipBehavior:
                                                            Clip.antiAlias,
                                                        decoration:
                                                            const BoxDecoration(
                                                          shape:
                                                              BoxShape.circle,
                                                        ),
                                                        child: Image.asset(
                                                          'assets/images/LoveMap_.png',
                                                          fit: BoxFit.cover,
                                                        ),
                                                      ).animateOnPageLoad(
                                                          animationsMap[
                                                              'circleImageOnPageLoadAnimation12']!),
                                                    ),
                                                  ),
                                                ),
                                              ),
                                          ].divide(const SizedBox(width: 6.0)),
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
                  Padding(
                    padding:
                        const EdgeInsetsDirectional.fromSTEB(0.0, 0.0, 0.0, 90.0),
                    child: Column(
                      mainAxisSize: MainAxisSize.max,
                      mainAxisAlignment: MainAxisAlignment.start,
                      children: [
                        Align(
                          alignment: const AlignmentDirectional(0.0, -1.0),
                          child: SizedBox(
                            width: 350.0,
                            height: 30.0,
                            child: Stack(
                              alignment: const AlignmentDirectional(0.0, 0.0),
                              children: [
                                if ((FFAppState()
                                        .ListTAKEvaluesForFilterGmap
                                        .isNotEmpty) ==
                                    true)
                                  Align(
                                    alignment: const AlignmentDirectional(0.0, 0.0),
                                    child: ClipRRect(
                                      borderRadius: BorderRadius.circular(0.0),
                                      child: BackdropFilter(
                                        filter: ImageFilter.blur(
                                          sigmaX: 5.0,
                                          sigmaY: 5.0,
                                        ),
                                        child: Align(
                                          alignment:
                                              const AlignmentDirectional(0.0, 0.0),
                                          child: Container(
                                            width: 338.0,
                                            height: 66.0,
                                            decoration: const BoxDecoration(
                                              color: Color(0x6A2B3138),
                                              borderRadius: BorderRadius.only(
                                                bottomLeft:
                                                    Radius.circular(30.0),
                                                bottomRight:
                                                    Radius.circular(30.0),
                                                topLeft: Radius.circular(30.0),
                                                topRight: Radius.circular(30.0),
                                              ),
                                            ),
                                            alignment:
                                                const AlignmentDirectional(0.0, 0.0),
                                          ),
                                        ),
                                      ),
                                    ),
                                  ),
                                if ((FFAppState()
                                        .ListTAKEvaluesForFilterGmap
                                        .isNotEmpty) ==
                                    true)
                                  Align(
                                    alignment: const AlignmentDirectional(0.0, 0.0),
                                    child: Container(
                                      constraints: const BoxConstraints(
                                        minWidth: 40.0,
                                        minHeight: 20.0,
                                      ),
                                      decoration: const BoxDecoration(
                                        color: Colors.transparent,
                                        borderRadius: BorderRadius.only(
                                          bottomLeft: Radius.circular(30.0),
                                          bottomRight: Radius.circular(30.0),
                                          topLeft: Radius.circular(30.0),
                                          topRight: Radius.circular(30.0),
                                        ),
                                      ),
                                      alignment: const AlignmentDirectional(0.0, 0.0),
                                      child: Align(
                                        alignment:
                                            const AlignmentDirectional(0.0, 0.0),
                                        child: Row(
                                          mainAxisSize: MainAxisSize.max,
                                          mainAxisAlignment:
                                              MainAxisAlignment.center,
                                          children: [
                                            if (FFAppState()
                                                    .ListTAKEvaluesForFilterGmap
                                                    .contains('Spirit') ==
                                                true)
                                              Align(
                                                alignment: const AlignmentDirectional(
                                                    0.0, 0.0),
                                                child: Container(
                                                  width: 23.0,
                                                  height: 23.0,
                                                  decoration: BoxDecoration(
                                                    color: FlutterFlowTheme.of(
                                                            context)
                                                        .primaryText,
                                                    shape: BoxShape.circle,
                                                  ),
                                                  alignment:
                                                      const AlignmentDirectional(
                                                          0.0, 0.0),
                                                  child: Visibility(
                                                    visible: FFAppState()
                                                            .ListTAKEvaluesForFilterGmap
                                                            .contains(
                                                                'Spirit') ==
                                                        true,
                                                    child: Align(
                                                      alignment:
                                                          const AlignmentDirectional(
                                                              0.0, 0.0),
                                                      child: Container(
                                                        width: 21.0,
                                                        height: 21.0,
                                                        clipBehavior:
                                                            Clip.antiAlias,
                                                        decoration:
                                                            const BoxDecoration(
                                                          shape:
                                                              BoxShape.circle,
                                                        ),
                                                        child: Image.asset(
                                                          'assets/images/SpiritMap.png',
                                                          fit: BoxFit.cover,
                                                          alignment: const Alignment(
                                                              0.0, 0.0),
                                                        ),
                                                      ).animateOnPageLoad(
                                                          animationsMap[
                                                              'circleImageOnPageLoadAnimation13']!),
                                                    ),
                                                  ),
                                                ),
                                              ),
                                            if (FFAppState()
                                                    .ListTAKEvaluesForFilterGmap
                                                    .contains('Finances') ==
                                                true)
                                              Align(
                                                alignment: const AlignmentDirectional(
                                                    0.0, 0.0),
                                                child: Container(
                                                  width: 23.0,
                                                  height: 23.0,
                                                  decoration: BoxDecoration(
                                                    color: FlutterFlowTheme.of(
                                                            context)
                                                        .primaryText,
                                                    shape: BoxShape.circle,
                                                  ),
                                                  alignment:
                                                      const AlignmentDirectional(
                                                          0.0, 0.0),
                                                  child: Visibility(
                                                    visible: FFAppState()
                                                            .ListTAKEvaluesForFilterGmap
                                                            .contains(
                                                                'Finances') ==
                                                        true,
                                                    child: Align(
                                                      alignment:
                                                          const AlignmentDirectional(
                                                              0.0, 0.0),
                                                      child: Container(
                                                        width: 21.0,
                                                        height: 21.0,
                                                        clipBehavior:
                                                            Clip.antiAlias,
                                                        decoration:
                                                            const BoxDecoration(
                                                          shape:
                                                              BoxShape.circle,
                                                        ),
                                                        child: Image.asset(
                                                          'assets/images/Finances.png',
                                                          fit: BoxFit.cover,
                                                          alignment: const Alignment(
                                                              0.0, 0.0),
                                                        ),
                                                      ).animateOnPageLoad(
                                                          animationsMap[
                                                              'circleImageOnPageLoadAnimation14']!),
                                                    ),
                                                  ),
                                                ),
                                              ),
                                            if (FFAppState()
                                                    .ListTAKEvaluesForFilterGmap
                                                    .contains('Emotions') ==
                                                true)
                                              Align(
                                                alignment: const AlignmentDirectional(
                                                    0.0, 0.0),
                                                child: Container(
                                                  width: 23.0,
                                                  height: 23.0,
                                                  decoration: BoxDecoration(
                                                    color: FlutterFlowTheme.of(
                                                            context)
                                                        .primaryText,
                                                    shape: BoxShape.circle,
                                                  ),
                                                  alignment:
                                                      const AlignmentDirectional(
                                                          0.0, 0.0),
                                                  child: Visibility(
                                                    visible: FFAppState()
                                                            .ListTAKEvaluesForFilterGmap
                                                            .contains(
                                                                'Emotions') ==
                                                        true,
                                                    child: Container(
                                                      width: 21.0,
                                                      height: 21.0,
                                                      clipBehavior:
                                                          Clip.antiAlias,
                                                      decoration: const BoxDecoration(
                                                        shape: BoxShape.circle,
                                                      ),
                                                      child: Image.asset(
                                                        'assets/images/EmotionsMap.png',
                                                        fit: BoxFit.cover,
                                                      ),
                                                    ).animateOnPageLoad(
                                                        animationsMap[
                                                            'circleImageOnPageLoadAnimation15']!),
                                                  ),
                                                ),
                                              ),
                                            if (FFAppState()
                                                    .ListTAKEvaluesForFilterGmap
                                                    .contains('Health') ==
                                                true)
                                              Align(
                                                alignment: const AlignmentDirectional(
                                                    0.0, 0.0),
                                                child: Container(
                                                  width: 23.0,
                                                  height: 23.0,
                                                  decoration: BoxDecoration(
                                                    color: FlutterFlowTheme.of(
                                                            context)
                                                        .primaryText,
                                                    shape: BoxShape.circle,
                                                  ),
                                                  alignment:
                                                      const AlignmentDirectional(
                                                          0.0, 0.0),
                                                  child: Visibility(
                                                    visible: FFAppState()
                                                            .ListTAKEvaluesForFilterGmap
                                                            .contains(
                                                                'Health') ==
                                                        true,
                                                    child: Container(
                                                      width: 21.0,
                                                      height: 21.0,
                                                      clipBehavior:
                                                          Clip.antiAlias,
                                                      decoration: const BoxDecoration(
                                                        shape: BoxShape.circle,
                                                      ),
                                                      child: Image.asset(
                                                        'assets/images/Health.png',
                                                        fit: BoxFit.cover,
                                                        alignment:
                                                            const Alignment(0.0, 0.0),
                                                      ),
                                                    ).animateOnPageLoad(
                                                        animationsMap[
                                                            'circleImageOnPageLoadAnimation16']!),
                                                  ),
                                                ),
                                              ),
                                            if (FFAppState()
                                                    .ListTAKEvaluesForFilterGmap
                                                    .contains('Networking') ==
                                                true)
                                              Align(
                                                alignment: const AlignmentDirectional(
                                                    0.0, 0.0),
                                                child: Container(
                                                  width: 23.0,
                                                  height: 23.0,
                                                  decoration: BoxDecoration(
                                                    color: FlutterFlowTheme.of(
                                                            context)
                                                        .secondaryText,
                                                    shape: BoxShape.circle,
                                                  ),
                                                  child: Visibility(
                                                    visible: FFAppState()
                                                            .ListTAKEvaluesForFilterGmap
                                                            .contains(
                                                                'Networking') ==
                                                        true,
                                                    child: Align(
                                                      alignment:
                                                          const AlignmentDirectional(
                                                              0.0, 0.0),
                                                      child: Container(
                                                        width: 21.0,
                                                        height: 21.0,
                                                        clipBehavior:
                                                            Clip.antiAlias,
                                                        decoration:
                                                            const BoxDecoration(
                                                          shape:
                                                              BoxShape.circle,
                                                        ),
                                                        child: Image.asset(
                                                          'assets/images/NetworkingMap.png',
                                                          fit: BoxFit.cover,
                                                        ),
                                                      ).animateOnPageLoad(
                                                          animationsMap[
                                                              'circleImageOnPageLoadAnimation17']!),
                                                    ),
                                                  ),
                                                ),
                                              ),
                                            if (FFAppState()
                                                    .ListTAKEvaluesForFilterGmap
                                                    .contains('Love') ==
                                                true)
                                              Align(
                                                alignment: const AlignmentDirectional(
                                                    0.0, 0.0),
                                                child: Container(
                                                  width: 23.0,
                                                  height: 23.0,
                                                  decoration: BoxDecoration(
                                                    color: FlutterFlowTheme.of(
                                                            context)
                                                        .secondaryText,
                                                    shape: BoxShape.circle,
                                                  ),
                                                  child: Visibility(
                                                    visible: FFAppState()
                                                            .ListTAKEvaluesForFilterGmap
                                                            .contains('Love') ==
                                                        true,
                                                    child: Align(
                                                      alignment:
                                                          const AlignmentDirectional(
                                                              0.0, 0.0),
                                                      child: Container(
                                                        width: 21.0,
                                                        height: 21.0,
                                                        clipBehavior:
                                                            Clip.antiAlias,
                                                        decoration:
                                                            const BoxDecoration(
                                                          shape:
                                                              BoxShape.circle,
                                                        ),
                                                        child: Image.asset(
                                                          'assets/images/LoveMap_.png',
                                                          fit: BoxFit.cover,
                                                        ),
                                                      ).animateOnPageLoad(
                                                          animationsMap[
                                                              'circleImageOnPageLoadAnimation18']!),
                                                    ),
                                                  ),
                                                ),
                                              ),
                                            if (FFAppState()
                                                    .ListTAKEvaluesForFilterGmap
                                                    .contains('Drive&Chill') ==
                                                true)
                                              Align(
                                                alignment: const AlignmentDirectional(
                                                    0.0, 0.0),
                                                child: Container(
                                                  width: 23.0,
                                                  height: 23.0,
                                                  decoration: BoxDecoration(
                                                    color: FlutterFlowTheme.of(
                                                            context)
                                                        .secondaryText,
                                                    shape: BoxShape.circle,
                                                  ),
                                                  child: Visibility(
                                                    visible: FFAppState()
                                                            .ListTAKEvaluesForFilterGmap
                                                            .contains(
                                                                'Drive&Chill') ==
                                                        true,
                                                    child: Align(
                                                      alignment:
                                                          const AlignmentDirectional(
                                                              0.0, 0.0),
                                                      child: Container(
                                                        width: 21.0,
                                                        height: 21.0,
                                                        clipBehavior:
                                                            Clip.antiAlias,
                                                        decoration:
                                                            const BoxDecoration(
                                                          shape:
                                                              BoxShape.circle,
                                                        ),
                                                        child: Image.asset(
                                                          'assets/images/image_14@2x.png',
                                                          fit: BoxFit.cover,
                                                        ),
                                                      ).animateOnPageLoad(
                                                          animationsMap[
                                                              'circleImageOnPageLoadAnimation19']!),
                                                    ),
                                                  ),
                                                ),
                                              ),
                                            if (FFAppState()
                                                    .ListTAKEvaluesForFilterGmap
                                                    .contains('Family') ==
                                                true)
                                              Align(
                                                alignment: const AlignmentDirectional(
                                                    0.0, 0.0),
                                                child: Container(
                                                  width: 23.0,
                                                  height: 23.0,
                                                  decoration: BoxDecoration(
                                                    color: FlutterFlowTheme.of(
                                                            context)
                                                        .secondaryText,
                                                    shape: BoxShape.circle,
                                                  ),
                                                  child: Visibility(
                                                    visible: FFAppState()
                                                            .ListTAKEvaluesForFilterGmap
                                                            .contains(
                                                                'Family') ==
                                                        true,
                                                    child: Align(
                                                      alignment:
                                                          const AlignmentDirectional(
                                                              0.0, 0.0),
                                                      child: Container(
                                                        width: 21.0,
                                                        height: 21.0,
                                                        clipBehavior:
                                                            Clip.antiAlias,
                                                        decoration:
                                                            const BoxDecoration(
                                                          shape:
                                                              BoxShape.circle,
                                                        ),
                                                        child: Image.asset(
                                                          'assets/images/FamilyMap.png',
                                                          fit: BoxFit.cover,
                                                        ),
                                                      ).animateOnPageLoad(
                                                          animationsMap[
                                                              'circleImageOnPageLoadAnimation20']!),
                                                    ),
                                                  ),
                                                ),
                                              ),
                                            if (FFAppState()
                                                    .ListTAKEvaluesForFilterGmap
                                                    .contains('Character') ==
                                                true)
                                              Align(
                                                alignment: const AlignmentDirectional(
                                                    0.0, 0.0),
                                                child: Container(
                                                  width: 23.0,
                                                  height: 23.0,
                                                  decoration: BoxDecoration(
                                                    color: FlutterFlowTheme.of(
                                                            context)
                                                        .secondaryText,
                                                    shape: BoxShape.circle,
                                                  ),
                                                  child: Visibility(
                                                    visible: FFAppState()
                                                            .ListTAKEvaluesForFilterGmap
                                                            .contains(
                                                                'Character') ==
                                                        true,
                                                    child: Align(
                                                      alignment:
                                                          const AlignmentDirectional(
                                                              0.0, 0.0),
                                                      child: Container(
                                                        width: 21.0,
                                                        height: 21.0,
                                                        clipBehavior:
                                                            Clip.antiAlias,
                                                        decoration:
                                                            const BoxDecoration(
                                                          shape:
                                                              BoxShape.circle,
                                                        ),
                                                        child: Image.asset(
                                                          'assets/images/CharacterMap.png',
                                                          fit: BoxFit.cover,
                                                        ),
                                                      ).animateOnPageLoad(
                                                          animationsMap[
                                                              'circleImageOnPageLoadAnimation21']!),
                                                    ),
                                                  ),
                                                ),
                                              ),
                                            if (FFAppState()
                                                    .ListTAKEvaluesForFilterGmap
                                                    .contains('Intellect') ==
                                                true)
                                              Align(
                                                alignment: const AlignmentDirectional(
                                                    0.0, 0.0),
                                                child: Container(
                                                  width: 23.0,
                                                  height: 23.0,
                                                  decoration: BoxDecoration(
                                                    color: FlutterFlowTheme.of(
                                                            context)
                                                        .secondaryText,
                                                    shape: BoxShape.circle,
                                                  ),
                                                  child: Visibility(
                                                    visible: FFAppState()
                                                            .ListTAKEvaluesForFilterGmap
                                                            .contains(
                                                                'Intellect') ==
                                                        true,
                                                    child: Align(
                                                      alignment:
                                                          const AlignmentDirectional(
                                                              0.0, 0.0),
                                                      child: Container(
                                                        width: 21.0,
                                                        height: 21.0,
                                                        clipBehavior:
                                                            Clip.antiAlias,
                                                        decoration:
                                                            const BoxDecoration(
                                                          shape:
                                                              BoxShape.circle,
                                                        ),
                                                        child: Image.asset(
                                                          'assets/images/IntellectForGmapPage.png',
                                                          fit: BoxFit.cover,
                                                        ),
                                                      ).animateOnPageLoad(
                                                          animationsMap[
                                                              'circleImageOnPageLoadAnimation22']!),
                                                    ),
                                                  ),
                                                ),
                                              ),
                                            if (FFAppState()
                                                    .ListTAKEvaluesForFilterGmap
                                                    .contains('Career') ==
                                                true)
                                              Align(
                                                alignment: const AlignmentDirectional(
                                                    0.0, 0.0),
                                                child: Container(
                                                  width: 23.0,
                                                  height: 23.0,
                                                  decoration: BoxDecoration(
                                                    color: FlutterFlowTheme.of(
                                                            context)
                                                        .primaryText,
                                                    shape: BoxShape.circle,
                                                  ),
                                                  alignment:
                                                      const AlignmentDirectional(
                                                          0.0, 0.0),
                                                  child: Visibility(
                                                    visible: FFAppState()
                                                            .ListTAKEvaluesForFilterGmap
                                                            .contains(
                                                                'Career') ==
                                                        true,
                                                    child: Container(
                                                      width: 21.0,
                                                      height: 21.0,
                                                      clipBehavior:
                                                          Clip.antiAlias,
                                                      decoration: const BoxDecoration(
                                                        shape: BoxShape.circle,
                                                      ),
                                                      child: Image.asset(
                                                        'assets/images/image_3.png',
                                                        fit: BoxFit.cover,
                                                        alignment:
                                                            const Alignment(0.0, 0.0),
                                                      ),
                                                    ).animateOnPageLoad(
                                                        animationsMap[
                                                            'circleImageOnPageLoadAnimation23']!),
                                                  ),
                                                ),
                                              ),
                                            if (FFAppState()
                                                    .ListTAKEvaluesForFilterGmap
                                                    .contains('Balance') ==
                                                true)
                                              Align(
                                                alignment: const AlignmentDirectional(
                                                    0.0, 0.0),
                                                child: Container(
                                                  width: 23.0,
                                                  height: 23.0,
                                                  decoration: BoxDecoration(
                                                    color: FlutterFlowTheme.of(
                                                            context)
                                                        .primaryText,
                                                    shape: BoxShape.circle,
                                                  ),
                                                  alignment:
                                                      const AlignmentDirectional(
                                                          0.0, 0.0),
                                                  child: Visibility(
                                                    visible: FFAppState()
                                                            .ListTAKEvaluesForFilterGmap
                                                            .contains(
                                                                'Balance') ==
                                                        true,
                                                    child: Align(
                                                      alignment:
                                                          const AlignmentDirectional(
                                                              0.0, 0.0),
                                                      child: Container(
                                                        width: 21.0,
                                                        height: 21.0,
                                                        clipBehavior:
                                                            Clip.antiAlias,
                                                        decoration:
                                                            const BoxDecoration(
                                                          shape:
                                                              BoxShape.circle,
                                                        ),
                                                        child: Image.asset(
                                                          'assets/images/Balance.png',
                                                          fit: BoxFit.cover,
                                                          alignment: const Alignment(
                                                              0.0, 0.0),
                                                        ),
                                                      ).animateOnPageLoad(
                                                          animationsMap[
                                                              'circleImageOnPageLoadAnimation24']!),
                                                    ),
                                                  ),
                                                ),
                                              ),
                                          ].divide(const SizedBox(width: 6.0)),
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
                          child: Padding(
                            padding: const EdgeInsetsDirectional.fromSTEB(
                                10.0, 10.0, 0.0, 10.0),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Align(
                                  alignment: const AlignmentDirectional(0.0, 0.0),
                                  child: Container(
                                    width: 56.0,
                                    height: 66.0,
                                    decoration: BoxDecoration(
                                      gradient: LinearGradient(
                                        colors: [
                                          FlutterFlowTheme.of(context).primary,
                                          FlutterFlowTheme.of(context).secondary
                                        ],
                                        stops: const [0.0, 1.0],
                                        begin: const AlignmentDirectional(0.0, -1.0),
                                        end: const AlignmentDirectional(0, 1.0),
                                      ),
                                      borderRadius: const BorderRadius.only(
                                        bottomLeft: Radius.circular(20.0),
                                        bottomRight: Radius.circular(0.0),
                                        topLeft: Radius.circular(20.0),
                                        topRight: Radius.circular(0.0),
                                      ),
                                    ),
                                    alignment: const AlignmentDirectional(0.0, 0.0),
                                    child: Column(
                                      mainAxisSize: MainAxisSize.max,
                                      mainAxisAlignment:
                                          MainAxisAlignment.spaceAround,
                                      children: [
                                        Row(
                                          mainAxisSize: MainAxisSize.min,
                                          mainAxisAlignment:
                                              MainAxisAlignment.center,
                                          crossAxisAlignment:
                                              CrossAxisAlignment.center,
                                          children: [
                                            Align(
                                              alignment: const AlignmentDirectional(
                                                  0.0, 0.0),
                                              child: Text(
                                                FFLocalizations.of(context)
                                                    .getText(
                                                  'eupcknbb' /* I Take */,
                                                ),
                                                textAlign: TextAlign.center,
                                                style:
                                                    FlutterFlowTheme.of(context)
                                                        .bodyMedium
                                                        .override(
                                                          fontFamily:
                                                              'Montserrat',
                                                          color: FlutterFlowTheme
                                                                  .of(context)
                                                              .primaryBackground,
                                                          letterSpacing: 0.0,
                                                          fontWeight:
                                                              FontWeight.w600,
                                                        ),
                                              ),
                                            ),
                                          ],
                                        ),
                                        Row(
                                          mainAxisSize: MainAxisSize.min,
                                          mainAxisAlignment:
                                              MainAxisAlignment.center,
                                          children: [
                                            // replace
                                            ClipRRect(
                                              borderRadius:
                                                  BorderRadius.circular(8.0),
                                              child: Image.asset(
                                                'assets/images/Icon_I_Take.png',
                                                width: 24.0,
                                                height: 24.0,
                                                fit: BoxFit.cover,
                                                alignment: const Alignment(0.0, 0.0),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                                Align(
                                  alignment: const AlignmentDirectional(0.0, 0.0),
                                  child: Padding(
                                    padding: const EdgeInsetsDirectional.fromSTEB(
                                        1.0, 0.0, 1.0, 0.0),
                                    child: Container(
                                      width: 338.0,
                                      height: 66.0,
                                      decoration: const BoxDecoration(),
                                      child: Column(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Stack(
                                            children: [
                                              Align(
                                                alignment: const AlignmentDirectional(
                                                    0.0, 0.0),
                                                child: ClipRRect(
                                                  borderRadius:
                                                      BorderRadius.circular(
                                                          0.0),
                                                  child: BackdropFilter(
                                                    filter: ImageFilter.blur(
                                                      sigmaX: 5.0,
                                                      sigmaY: 5.0,
                                                    ),
                                                    child: Container(
                                                      width: 338.0,
                                                      height: 66.0,
                                                      decoration: const BoxDecoration(
                                                        color:
                                                            Color(0x6A2B3138),
                                                      ),
                                                    ),
                                                  ),
                                                ),
                                              ),
                                              Container(
                                                width: 338.0,
                                                height: 66.0,
                                                decoration: const BoxDecoration(),
                                                child: SingleChildScrollView(
                                                  scrollDirection:
                                                      Axis.horizontal,
                                                  child: Row(
                                                    mainAxisSize:
                                                        MainAxisSize.max,
                                                    children: [
                                                      Align(
                                                        alignment:
                                                            const AlignmentDirectional(
                                                                0.0, 0.0),
                                                        child: Padding(
                                                          padding:
                                                              const EdgeInsetsDirectional
                                                                  .fromSTEB(
                                                                      7.0,
                                                                      0.0,
                                                                      7.0,
                                                                      0.0),
                                                          child: Column(
                                                            mainAxisSize:
                                                                MainAxisSize
                                                                    .max,
                                                            mainAxisAlignment:
                                                                MainAxisAlignment
                                                                    .center,
                                                            children: [
                                                              Expanded(
                                                                child: Align(
                                                                  alignment:
                                                                      const AlignmentDirectional(
                                                                          0.0,
                                                                          0.0),
                                                                  child: Stack(
                                                                    alignment:
                                                                        const AlignmentDirectional(
                                                                            0.0,
                                                                            0.0),
                                                                    children: [
                                                                      if (FFAppState()
                                                                          .MapSphereFilterImageTAKEisHighted[11])
                                                                        Align(
                                                                          alignment: const AlignmentDirectional(
                                                                              0.0,
                                                                              0.0),
                                                                          child:
                                                                              Container(
                                                                            width:
                                                                                60.0,
                                                                            height:
                                                                                40.0,
                                                                            decoration:
                                                                                BoxDecoration(
                                                                              color: FlutterFlowTheme.of(context).primaryText,
                                                                              borderRadius: BorderRadius.circular(30.0),
                                                                            ),
                                                                            alignment:
                                                                                const AlignmentDirectional(0.0, 0.0),
                                                                          ),
                                                                        ),
                                                                      Opacity(
                                                                        opacity:
                                                                            FFAppState().SphereIconsReactionOnPressListTake[11],
                                                                        child:
                                                                            InkWell(
                                                                          splashColor:
                                                                              Colors.transparent,
                                                                          focusColor:
                                                                              Colors.transparent,
                                                                          hoverColor:
                                                                              Colors.transparent,
                                                                          highlightColor:
                                                                              Colors.transparent,
                                                                          onTap:
                                                                              () async {
                                                                            if (FFAppState().ListTAKEvaluesForFilterGmap.contains('Love') ==
                                                                                true) {
                                                                              FFAppState().removeFromListTAKEvaluesForFilterGmap('Love');
                                                                              FFAppState().updateSphereIconsReactionOnPressListTakeAtIndex(
                                                                                11,
                                                                                (_) => 0.8,
                                                                              );
                                                                              FFAppState().update(() {});
                                                                              FFAppState().updateMapSphereFilterImageTAKEisHightedAtIndex(
                                                                                11,
                                                                                (_) => false,
                                                                              );
                                                                              FFAppState().update(() {});
                                                                            } else {
                                                                              FFAppState().addToListTAKEvaluesForFilterGmap('Love');
                                                                              FFAppState().updateSphereIconsReactionOnPressListTakeAtIndex(
                                                                                11,
                                                                                (_) => 1.0,
                                                                              );
                                                                              FFAppState().update(() {});
                                                                              FFAppState().updateMapSphereFilterImageTAKEisHightedAtIndex(
                                                                                11,
                                                                                (_) => true,
                                                                              );
                                                                              FFAppState().update(() {});
                                                                            }
                                                                          },
                                                                          child:
                                                                              ClipRRect(
                                                                            borderRadius:
                                                                                BorderRadius.circular(30.0),
                                                                            child:
                                                                                Image.asset(
                                                                              'assets/images/LoveMap_.png',
                                                                              width: 57.0,
                                                                              height: 37.0,
                                                                              fit: BoxFit.cover,
                                                                              alignment: const Alignment(0.0, 0.0),
                                                                            ),
                                                                          ),
                                                                        ),
                                                                      ),
                                                                    ],
                                                                  ),
                                                                ),
                                                              ),
                                                              Align(
                                                                alignment:
                                                                    const AlignmentDirectional(
                                                                        0.0,
                                                                        0.0),
                                                                child: Text(
                                                                  FFLocalizations.of(
                                                                          context)
                                                                      .getText(
                                                                    'p588bnya' /* Love */,
                                                                  ),
                                                                  style: FlutterFlowTheme.of(
                                                                          context)
                                                                      .bodyMedium
                                                                      .override(
                                                                        fontFamily:
                                                                            'Montserrat',
                                                                        fontSize:
                                                                            12.0,
                                                                        letterSpacing:
                                                                            0.0,
                                                                        fontWeight:
                                                                            FontWeight.w600,
                                                                      ),
                                                                ),
                                                              ),
                                                            ],
                                                          ),
                                                        ),
                                                      ),
                                                      Align(
                                                        alignment:
                                                            const AlignmentDirectional(
                                                                0.0, 0.0),
                                                        child: Padding(
                                                          padding:
                                                              const EdgeInsetsDirectional
                                                                  .fromSTEB(
                                                                      7.0,
                                                                      0.0,
                                                                      7.0,
                                                                      0.0),
                                                          child: Column(
                                                            mainAxisSize:
                                                                MainAxisSize
                                                                    .max,
                                                            mainAxisAlignment:
                                                                MainAxisAlignment
                                                                    .center,
                                                            children: [
                                                              Expanded(
                                                                child: Align(
                                                                  alignment:
                                                                      const AlignmentDirectional(
                                                                          0.0,
                                                                          0.0),
                                                                  child: Stack(
                                                                    alignment:
                                                                        const AlignmentDirectional(
                                                                            0.0,
                                                                            0.0),
                                                                    children: [
                                                                      if (FFAppState()
                                                                          .MapSphereFilterImageTAKEisHighted[10])
                                                                        Align(
                                                                          alignment: const AlignmentDirectional(
                                                                              0.0,
                                                                              0.0),
                                                                          child:
                                                                              Container(
                                                                            width:
                                                                                60.0,
                                                                            height:
                                                                                40.0,
                                                                            decoration:
                                                                                BoxDecoration(
                                                                              color: FlutterFlowTheme.of(context).primaryText,
                                                                              borderRadius: BorderRadius.circular(30.0),
                                                                            ),
                                                                            alignment:
                                                                                const AlignmentDirectional(0.0, 0.0),
                                                                          ),
                                                                        ),
                                                                      Opacity(
                                                                        opacity:
                                                                            FFAppState().SphereIconsReactionOnPressListTake[10],
                                                                        child:
                                                                            InkWell(
                                                                          splashColor:
                                                                              Colors.transparent,
                                                                          focusColor:
                                                                              Colors.transparent,
                                                                          hoverColor:
                                                                              Colors.transparent,
                                                                          highlightColor:
                                                                              Colors.transparent,
                                                                          onTap:
                                                                              () async {
                                                                            if (FFAppState().ListTAKEvaluesForFilterGmap.contains('Character') ==
                                                                                true) {
                                                                              FFAppState().removeFromListTAKEvaluesForFilterGmap('Character');
                                                                              FFAppState().updateSphereIconsReactionOnPressListTakeAtIndex(
                                                                                10,
                                                                                (_) => 0.8,
                                                                              );
                                                                              FFAppState().update(() {});
                                                                              FFAppState().updateMapSphereFilterImageTAKEisHightedAtIndex(
                                                                                10,
                                                                                (_) => false,
                                                                              );
                                                                              FFAppState().update(() {});
                                                                            } else {
                                                                              FFAppState().addToListTAKEvaluesForFilterGmap('Character');
                                                                              FFAppState().updateSphereIconsReactionOnPressListTakeAtIndex(
                                                                                10,
                                                                                (_) => 1.0,
                                                                              );
                                                                              FFAppState().update(() {});
                                                                              FFAppState().updateMapSphereFilterImageTAKEisHightedAtIndex(
                                                                                10,
                                                                                (_) => true,
                                                                              );
                                                                              FFAppState().update(() {});
                                                                            }
                                                                          },
                                                                          child:
                                                                              ClipRRect(
                                                                            borderRadius:
                                                                                BorderRadius.circular(30.0),
                                                                            child:
                                                                                Image.asset(
                                                                              'assets/images/CharacterMap.png',
                                                                              width: 57.0,
                                                                              height: 37.0,
                                                                              fit: BoxFit.cover,
                                                                              alignment: const Alignment(0.0, 0.0),
                                                                            ),
                                                                          ),
                                                                        ),
                                                                      ),
                                                                    ],
                                                                  ),
                                                                ),
                                                              ),
                                                              Align(
                                                                alignment:
                                                                    const AlignmentDirectional(
                                                                        0.0,
                                                                        0.0),
                                                                child: Text(
                                                                  FFLocalizations.of(
                                                                          context)
                                                                      .getText(
                                                                    'ymadzg24' /* Character */,
                                                                  ),
                                                                  style: FlutterFlowTheme.of(
                                                                          context)
                                                                      .bodyMedium
                                                                      .override(
                                                                        fontFamily:
                                                                            'Montserrat',
                                                                        fontSize:
                                                                            12.0,
                                                                        letterSpacing:
                                                                            0.0,
                                                                        fontWeight:
                                                                            FontWeight.w600,
                                                                      ),
                                                                ),
                                                              ),
                                                            ],
                                                          ),
                                                        ),
                                                      ),
                                                      Align(
                                                        alignment:
                                                            const AlignmentDirectional(
                                                                0.0, 0.0),
                                                        child: Padding(
                                                          padding:
                                                              const EdgeInsetsDirectional
                                                                  .fromSTEB(
                                                                      7.0,
                                                                      0.0,
                                                                      7.0,
                                                                      0.0),
                                                          child: Column(
                                                            mainAxisSize:
                                                                MainAxisSize
                                                                    .max,
                                                            mainAxisAlignment:
                                                                MainAxisAlignment
                                                                    .center,
                                                            children: [
                                                              Expanded(
                                                                child: Align(
                                                                  alignment:
                                                                      const AlignmentDirectional(
                                                                          0.0,
                                                                          0.0),
                                                                  child: Stack(
                                                                    alignment:
                                                                        const AlignmentDirectional(
                                                                            0.0,
                                                                            0.0),
                                                                    children: [
                                                                      if (FFAppState()
                                                                          .MapSphereFilterImageTAKEisHighted[9])
                                                                        Align(
                                                                          alignment: const AlignmentDirectional(
                                                                              0.0,
                                                                              0.0),
                                                                          child:
                                                                              Container(
                                                                            width:
                                                                                60.0,
                                                                            height:
                                                                                40.0,
                                                                            decoration:
                                                                                BoxDecoration(
                                                                              color: FlutterFlowTheme.of(context).primaryText,
                                                                              borderRadius: BorderRadius.circular(30.0),
                                                                            ),
                                                                            alignment:
                                                                                const AlignmentDirectional(0.0, 0.0),
                                                                          ),
                                                                        ),
                                                                      Opacity(
                                                                        opacity:
                                                                            FFAppState().SphereIconsReactionOnPressListTake[9],
                                                                        child:
                                                                            InkWell(
                                                                          splashColor:
                                                                              Colors.transparent,
                                                                          focusColor:
                                                                              Colors.transparent,
                                                                          hoverColor:
                                                                              Colors.transparent,
                                                                          highlightColor:
                                                                              Colors.transparent,
                                                                          onTap:
                                                                              () async {
                                                                            if (FFAppState().ListTAKEvaluesForFilterGmap.contains('Family') ==
                                                                                true) {
                                                                              FFAppState().removeFromListTAKEvaluesForFilterGmap('Family');
                                                                              FFAppState().updateSphereIconsReactionOnPressListTakeAtIndex(
                                                                                9,
                                                                                (_) => 0.8,
                                                                              );
                                                                              FFAppState().update(() {});
                                                                              FFAppState().updateMapSphereFilterImageTAKEisHightedAtIndex(
                                                                                9,
                                                                                (_) => false,
                                                                              );
                                                                              FFAppState().update(() {});
                                                                            } else {
                                                                              FFAppState().addToListTAKEvaluesForFilterGmap('Family');
                                                                              FFAppState().updateSphereIconsReactionOnPressListTakeAtIndex(
                                                                                9,
                                                                                (_) => 1.0,
                                                                              );
                                                                              FFAppState().update(() {});
                                                                              FFAppState().updateMapSphereFilterImageTAKEisHightedAtIndex(
                                                                                9,
                                                                                (_) => true,
                                                                              );
                                                                              FFAppState().update(() {});
                                                                            }
                                                                          },
                                                                          child:
                                                                              ClipRRect(
                                                                            borderRadius:
                                                                                BorderRadius.circular(30.0),
                                                                            child:
                                                                                Image.asset(
                                                                              'assets/images/FamilyMap.png',
                                                                              width: 57.0,
                                                                              height: 37.0,
                                                                              fit: BoxFit.cover,
                                                                              alignment: const Alignment(0.0, 0.0),
                                                                            ),
                                                                          ),
                                                                        ),
                                                                      ),
                                                                    ],
                                                                  ),
                                                                ),
                                                              ),
                                                              Align(
                                                                alignment:
                                                                    const AlignmentDirectional(
                                                                        0.0,
                                                                        0.0),
                                                                child: Text(
                                                                  FFLocalizations.of(
                                                                          context)
                                                                      .getText(
                                                                    'stzys0d3' /* Family */,
                                                                  ),
                                                                  style: FlutterFlowTheme.of(
                                                                          context)
                                                                      .bodyMedium
                                                                      .override(
                                                                        fontFamily:
                                                                            'Montserrat',
                                                                        fontSize:
                                                                            12.0,
                                                                        letterSpacing:
                                                                            0.0,
                                                                        fontWeight:
                                                                            FontWeight.w600,
                                                                      ),
                                                                ),
                                                              ),
                                                            ],
                                                          ),
                                                        ),
                                                      ),
                                                      Align(
                                                        alignment:
                                                            const AlignmentDirectional(
                                                                0.0, 0.0),
                                                        child: Padding(
                                                          padding:
                                                              const EdgeInsetsDirectional
                                                                  .fromSTEB(
                                                                      7.0,
                                                                      0.0,
                                                                      7.0,
                                                                      0.0),
                                                          child: Column(
                                                            mainAxisSize:
                                                                MainAxisSize
                                                                    .max,
                                                            mainAxisAlignment:
                                                                MainAxisAlignment
                                                                    .center,
                                                            children: [
                                                              Expanded(
                                                                child: Align(
                                                                  alignment:
                                                                      const AlignmentDirectional(
                                                                          0.0,
                                                                          0.0),
                                                                  child: Stack(
                                                                    alignment:
                                                                        const AlignmentDirectional(
                                                                            0.0,
                                                                            0.0),
                                                                    children: [
                                                                      if (FFAppState()
                                                                          .MapSphereFilterImageTAKEisHighted[8])
                                                                        Align(
                                                                          alignment: const AlignmentDirectional(
                                                                              0.0,
                                                                              0.0),
                                                                          child:
                                                                              Container(
                                                                            width:
                                                                                60.0,
                                                                            height:
                                                                                40.0,
                                                                            decoration:
                                                                                BoxDecoration(
                                                                              color: FlutterFlowTheme.of(context).primaryText,
                                                                              borderRadius: BorderRadius.circular(30.0),
                                                                            ),
                                                                            alignment:
                                                                                const AlignmentDirectional(0.0, 0.0),
                                                                          ),
                                                                        ),
                                                                      Opacity(
                                                                        opacity:
                                                                            FFAppState().SphereIconsReactionOnPressListTake[8],
                                                                        child:
                                                                            InkWell(
                                                                          splashColor:
                                                                              Colors.transparent,
                                                                          focusColor:
                                                                              Colors.transparent,
                                                                          hoverColor:
                                                                              Colors.transparent,
                                                                          highlightColor:
                                                                              Colors.transparent,
                                                                          onTap:
                                                                              () async {
                                                                            if (FFAppState().ListTAKEvaluesForFilterGmap.contains('Drive&Chill') ==
                                                                                true) {
                                                                              FFAppState().removeFromListTAKEvaluesForFilterGmap('Drive&Chill');
                                                                              FFAppState().updateSphereIconsReactionOnPressListTakeAtIndex(
                                                                                8,
                                                                                (_) => 0.8,
                                                                              );
                                                                              FFAppState().update(() {});
                                                                              FFAppState().updateMapSphereFilterImageTAKEisHightedAtIndex(
                                                                                8,
                                                                                (_) => false,
                                                                              );
                                                                              FFAppState().update(() {});
                                                                            } else {
                                                                              FFAppState().addToListTAKEvaluesForFilterGmap('Drive&Chill');
                                                                              FFAppState().updateSphereIconsReactionOnPressListTakeAtIndex(
                                                                                8,
                                                                                (_) => 1.0,
                                                                              );
                                                                              FFAppState().update(() {});
                                                                              FFAppState().updateMapSphereFilterImageTAKEisHightedAtIndex(
                                                                                8,
                                                                                (_) => true,
                                                                              );
                                                                              FFAppState().update(() {});
                                                                            }
                                                                          },
                                                                          child:
                                                                              ClipRRect(
                                                                            borderRadius:
                                                                                BorderRadius.circular(30.0),
                                                                            child:
                                                                                Image.asset(
                                                                              'assets/images/image_14@2x.png',
                                                                              width: 57.0,
                                                                              height: 37.0,
                                                                              fit: BoxFit.cover,
                                                                              alignment: const Alignment(0.0, 0.0),
                                                                            ),
                                                                          ),
                                                                        ),
                                                                      ),
                                                                    ],
                                                                  ),
                                                                ),
                                                              ),
                                                              Align(
                                                                alignment:
                                                                    const AlignmentDirectional(
                                                                        0.0,
                                                                        0.0),
                                                                child: Text(
                                                                  FFLocalizations.of(
                                                                          context)
                                                                      .getText(
                                                                    '5mq75fe3' /* Drive&Chill */,
                                                                  ),
                                                                  style: FlutterFlowTheme.of(
                                                                          context)
                                                                      .bodyMedium
                                                                      .override(
                                                                        fontFamily:
                                                                            'Montserrat',
                                                                        fontSize:
                                                                            12.0,
                                                                        letterSpacing:
                                                                            0.0,
                                                                        fontWeight:
                                                                            FontWeight.w600,
                                                                      ),
                                                                ),
                                                              ),
                                                            ],
                                                          ),
                                                        ),
                                                      ),
                                                      Align(
                                                        alignment:
                                                            const AlignmentDirectional(
                                                                0.0, 0.0),
                                                        child: Padding(
                                                          padding:
                                                              const EdgeInsetsDirectional
                                                                  .fromSTEB(
                                                                      7.0,
                                                                      0.0,
                                                                      7.0,
                                                                      0.0),
                                                          child: Column(
                                                            mainAxisSize:
                                                                MainAxisSize
                                                                    .max,
                                                            mainAxisAlignment:
                                                                MainAxisAlignment
                                                                    .center,
                                                            children: [
                                                              Expanded(
                                                                child: Align(
                                                                  alignment:
                                                                      const AlignmentDirectional(
                                                                          0.0,
                                                                          0.0),
                                                                  child: Stack(
                                                                    alignment:
                                                                        const AlignmentDirectional(
                                                                            0.0,
                                                                            0.0),
                                                                    children: [
                                                                      if (FFAppState()
                                                                          .MapSphereFilterImageTAKEisHighted[7])
                                                                        Align(
                                                                          alignment: const AlignmentDirectional(
                                                                              0.0,
                                                                              0.0),
                                                                          child:
                                                                              Container(
                                                                            width:
                                                                                60.0,
                                                                            height:
                                                                                40.0,
                                                                            decoration:
                                                                                BoxDecoration(
                                                                              color: FlutterFlowTheme.of(context).primaryText,
                                                                              borderRadius: BorderRadius.circular(30.0),
                                                                            ),
                                                                            alignment:
                                                                                const AlignmentDirectional(0.0, 0.0),
                                                                          ),
                                                                        ),
                                                                      Opacity(
                                                                        opacity:
                                                                            FFAppState().SphereIconsReactionOnPressListTake[7],
                                                                        child:
                                                                            InkWell(
                                                                          splashColor:
                                                                              Colors.transparent,
                                                                          focusColor:
                                                                              Colors.transparent,
                                                                          hoverColor:
                                                                              Colors.transparent,
                                                                          highlightColor:
                                                                              Colors.transparent,
                                                                          onTap:
                                                                              () async {
                                                                            if (FFAppState().ListTAKEvaluesForFilterGmap.contains('Networking') ==
                                                                                true) {
                                                                              FFAppState().removeFromListTAKEvaluesForFilterGmap('Networking');
                                                                              FFAppState().updateSphereIconsReactionOnPressListTakeAtIndex(
                                                                                7,
                                                                                (_) => 0.8,
                                                                              );
                                                                              FFAppState().update(() {});
                                                                              FFAppState().updateMapSphereFilterImageTAKEisHightedAtIndex(
                                                                                7,
                                                                                (_) => false,
                                                                              );
                                                                              FFAppState().update(() {});
                                                                            } else {
                                                                              FFAppState().addToListTAKEvaluesForFilterGmap('Networking');
                                                                              FFAppState().updateSphereIconsReactionOnPressListTakeAtIndex(
                                                                                7,
                                                                                (_) => 1.0,
                                                                              );
                                                                              FFAppState().update(() {});
                                                                              FFAppState().updateMapSphereFilterImageTAKEisHightedAtIndex(
                                                                                7,
                                                                                (_) => true,
                                                                              );
                                                                              FFAppState().update(() {});
                                                                            }
                                                                          },
                                                                          child:
                                                                              ClipRRect(
                                                                            borderRadius:
                                                                                BorderRadius.circular(30.0),
                                                                            child:
                                                                                Image.asset(
                                                                              'assets/images/NetworkingMap.png',
                                                                              width: 57.0,
                                                                              height: 37.0,
                                                                              fit: BoxFit.cover,
                                                                              alignment: const Alignment(0.0, 0.0),
                                                                            ),
                                                                          ),
                                                                        ),
                                                                      ),
                                                                    ],
                                                                  ),
                                                                ),
                                                              ),
                                                              Align(
                                                                alignment:
                                                                    const AlignmentDirectional(
                                                                        0.0,
                                                                        0.0),
                                                                child: Text(
                                                                  FFLocalizations.of(
                                                                          context)
                                                                      .getText(
                                                                    'hkjax50q' /* Networking */,
                                                                  ),
                                                                  style: FlutterFlowTheme.of(
                                                                          context)
                                                                      .bodyMedium
                                                                      .override(
                                                                        fontFamily:
                                                                            'Montserrat',
                                                                        fontSize:
                                                                            12.0,
                                                                        letterSpacing:
                                                                            0.0,
                                                                        fontWeight:
                                                                            FontWeight.w600,
                                                                      ),
                                                                ),
                                                              ),
                                                            ],
                                                          ),
                                                        ),
                                                      ),
                                                      Align(
                                                        alignment:
                                                            const AlignmentDirectional(
                                                                0.0, 0.0),
                                                        child: Padding(
                                                          padding:
                                                              const EdgeInsetsDirectional
                                                                  .fromSTEB(
                                                                      7.0,
                                                                      0.0,
                                                                      7.0,
                                                                      0.0),
                                                          child: Column(
                                                            mainAxisSize:
                                                                MainAxisSize
                                                                    .max,
                                                            mainAxisAlignment:
                                                                MainAxisAlignment
                                                                    .center,
                                                            children: [
                                                              Expanded(
                                                                child: Align(
                                                                  alignment:
                                                                      const AlignmentDirectional(
                                                                          0.0,
                                                                          0.0),
                                                                  child: Stack(
                                                                    alignment:
                                                                        const AlignmentDirectional(
                                                                            0.0,
                                                                            0.0),
                                                                    children: [
                                                                      if (FFAppState()
                                                                          .MapSphereFilterImageTAKEisHighted[5])
                                                                        Align(
                                                                          alignment: const AlignmentDirectional(
                                                                              0.0,
                                                                              0.0),
                                                                          child:
                                                                              Container(
                                                                            width:
                                                                                60.0,
                                                                            height:
                                                                                40.0,
                                                                            decoration:
                                                                                BoxDecoration(
                                                                              color: FlutterFlowTheme.of(context).primaryText,
                                                                              borderRadius: BorderRadius.circular(30.0),
                                                                            ),
                                                                            alignment:
                                                                                const AlignmentDirectional(0.0, 0.0),
                                                                          ),
                                                                        ),
                                                                      Opacity(
                                                                        opacity:
                                                                            FFAppState().SphereIconsReactionOnPressListTake[5],
                                                                        child:
                                                                            InkWell(
                                                                          splashColor:
                                                                              Colors.transparent,
                                                                          focusColor:
                                                                              Colors.transparent,
                                                                          hoverColor:
                                                                              Colors.transparent,
                                                                          highlightColor:
                                                                              Colors.transparent,
                                                                          onTap:
                                                                              () async {
                                                                            if (FFAppState().ListTAKEvaluesForFilterGmap.contains('Emotions') ==
                                                                                true) {
                                                                              FFAppState().removeFromListTAKEvaluesForFilterGmap('Emotions');
                                                                              FFAppState().updateSphereIconsReactionOnPressListTakeAtIndex(
                                                                                5,
                                                                                (_) => 0.8,
                                                                              );
                                                                              FFAppState().update(() {});
                                                                              FFAppState().updateMapSphereFilterImageTAKEisHightedAtIndex(
                                                                                5,
                                                                                (_) => false,
                                                                              );
                                                                              FFAppState().update(() {});
                                                                            } else {
                                                                              FFAppState().addToListTAKEvaluesForFilterGmap('Emotions');
                                                                              FFAppState().updateSphereIconsReactionOnPressListTakeAtIndex(
                                                                                5,
                                                                                (_) => 1.0,
                                                                              );
                                                                              FFAppState().update(() {});
                                                                              FFAppState().updateMapSphereFilterImageTAKEisHightedAtIndex(
                                                                                5,
                                                                                (_) => true,
                                                                              );
                                                                              FFAppState().update(() {});
                                                                            }
                                                                          },
                                                                          child:
                                                                              ClipRRect(
                                                                            borderRadius:
                                                                                BorderRadius.circular(30.0),
                                                                            child:
                                                                                Image.asset(
                                                                              'assets/images/EmotionsMap.png',
                                                                              width: 57.0,
                                                                              height: 37.0,
                                                                              fit: BoxFit.cover,
                                                                              alignment: const Alignment(0.0, 0.0),
                                                                            ),
                                                                          ),
                                                                        ),
                                                                      ),
                                                                    ],
                                                                  ),
                                                                ),
                                                              ),
                                                              Align(
                                                                alignment:
                                                                    const AlignmentDirectional(
                                                                        0.0,
                                                                        0.0),
                                                                child: Text(
                                                                  FFLocalizations.of(
                                                                          context)
                                                                      .getText(
                                                                    'is34800s' /* Emotions */,
                                                                  ),
                                                                  style: FlutterFlowTheme.of(
                                                                          context)
                                                                      .bodyMedium
                                                                      .override(
                                                                        fontFamily:
                                                                            'Montserrat',
                                                                        fontSize:
                                                                            12.0,
                                                                        letterSpacing:
                                                                            0.0,
                                                                        fontWeight:
                                                                            FontWeight.w600,
                                                                      ),
                                                                ),
                                                              ),
                                                            ],
                                                          ),
                                                        ),
                                                      ),
                                                      Align(
                                                        alignment:
                                                            const AlignmentDirectional(
                                                                0.0, 0.0),
                                                        child: Padding(
                                                          padding:
                                                              const EdgeInsetsDirectional
                                                                  .fromSTEB(
                                                                      7.0,
                                                                      0.0,
                                                                      7.0,
                                                                      0.0),
                                                          child: Column(
                                                            mainAxisSize:
                                                                MainAxisSize
                                                                    .max,
                                                            mainAxisAlignment:
                                                                MainAxisAlignment
                                                                    .center,
                                                            children: [
                                                              Expanded(
                                                                child: Align(
                                                                  alignment:
                                                                      const AlignmentDirectional(
                                                                          0.0,
                                                                          0.0),
                                                                  child: Stack(
                                                                    alignment:
                                                                        const AlignmentDirectional(
                                                                            0.0,
                                                                            0.0),
                                                                    children: [
                                                                      if (FFAppState()
                                                                          .MapSphereFilterImageTAKEisHighted[4])
                                                                        Align(
                                                                          alignment: const AlignmentDirectional(
                                                                              0.0,
                                                                              0.0),
                                                                          child:
                                                                              Container(
                                                                            width:
                                                                                60.0,
                                                                            height:
                                                                                40.0,
                                                                            decoration:
                                                                                BoxDecoration(
                                                                              color: FlutterFlowTheme.of(context).primaryText,
                                                                              borderRadius: BorderRadius.circular(30.0),
                                                                            ),
                                                                            alignment:
                                                                                const AlignmentDirectional(0.0, 0.0),
                                                                          ),
                                                                        ),
                                                                      Opacity(
                                                                        opacity:
                                                                            FFAppState().SphereIconsReactionOnPressListTake[4],
                                                                        child:
                                                                            InkWell(
                                                                          splashColor:
                                                                              Colors.transparent,
                                                                          focusColor:
                                                                              Colors.transparent,
                                                                          hoverColor:
                                                                              Colors.transparent,
                                                                          highlightColor:
                                                                              Colors.transparent,
                                                                          onTap:
                                                                              () async {
                                                                            if (FFAppState().ListTAKEvaluesForFilterGmap.contains('Spirit') ==
                                                                                true) {
                                                                              FFAppState().removeFromListTAKEvaluesForFilterGmap('Spirit');
                                                                              FFAppState().updateSphereIconsReactionOnPressListTakeAtIndex(
                                                                                4,
                                                                                (_) => 0.8,
                                                                              );
                                                                              FFAppState().update(() {});
                                                                              FFAppState().updateMapSphereFilterImageTAKEisHightedAtIndex(
                                                                                4,
                                                                                (_) => false,
                                                                              );
                                                                              FFAppState().update(() {});
                                                                            } else {
                                                                              FFAppState().addToListTAKEvaluesForFilterGmap('Spirit');
                                                                              FFAppState().updateSphereIconsReactionOnPressListTakeAtIndex(
                                                                                4,
                                                                                (_) => 1.0,
                                                                              );
                                                                              FFAppState().update(() {});
                                                                              FFAppState().updateMapSphereFilterImageTAKEisHightedAtIndex(
                                                                                4,
                                                                                (_) => true,
                                                                              );
                                                                              FFAppState().update(() {});
                                                                            }
                                                                          },
                                                                          child:
                                                                              ClipRRect(
                                                                            borderRadius:
                                                                                BorderRadius.circular(30.0),
                                                                            child:
                                                                                Image.asset(
                                                                              'assets/images/SpiritMap.png',
                                                                              width: 57.0,
                                                                              height: 37.0,
                                                                              fit: BoxFit.cover,
                                                                              alignment: const Alignment(0.0, 0.0),
                                                                            ),
                                                                          ),
                                                                        ),
                                                                      ),
                                                                    ],
                                                                  ),
                                                                ),
                                                              ),
                                                              Align(
                                                                alignment:
                                                                    const AlignmentDirectional(
                                                                        0.0,
                                                                        0.0),
                                                                child: Text(
                                                                  FFLocalizations.of(
                                                                          context)
                                                                      .getText(
                                                                    '8s2btnvn' /* Spirit */,
                                                                  ),
                                                                  style: FlutterFlowTheme.of(
                                                                          context)
                                                                      .bodyMedium
                                                                      .override(
                                                                        fontFamily:
                                                                            'Montserrat',
                                                                        fontSize:
                                                                            12.0,
                                                                        letterSpacing:
                                                                            0.0,
                                                                        fontWeight:
                                                                            FontWeight.w600,
                                                                      ),
                                                                ),
                                                              ),
                                                            ],
                                                          ),
                                                        ),
                                                      ),
                                                      Align(
                                                        alignment:
                                                            const AlignmentDirectional(
                                                                0.0, 0.0),
                                                        child: Padding(
                                                          padding:
                                                              const EdgeInsetsDirectional
                                                                  .fromSTEB(
                                                                      7.0,
                                                                      0.0,
                                                                      7.0,
                                                                      0.0),
                                                          child: Column(
                                                            mainAxisSize:
                                                                MainAxisSize
                                                                    .max,
                                                            mainAxisAlignment:
                                                                MainAxisAlignment
                                                                    .center,
                                                            children: [
                                                              Expanded(
                                                                child: Align(
                                                                  alignment:
                                                                      const AlignmentDirectional(
                                                                          0.0,
                                                                          0.0),
                                                                  child: Stack(
                                                                    alignment:
                                                                        const AlignmentDirectional(
                                                                            0.0,
                                                                            0.0),
                                                                    children: [
                                                                      if (FFAppState()
                                                                          .MapSphereFilterImageTAKEisHighted[3])
                                                                        Align(
                                                                          alignment: const AlignmentDirectional(
                                                                              0.0,
                                                                              0.0),
                                                                          child:
                                                                              Container(
                                                                            width:
                                                                                60.0,
                                                                            height:
                                                                                40.0,
                                                                            decoration:
                                                                                BoxDecoration(
                                                                              color: FlutterFlowTheme.of(context).primaryText,
                                                                              borderRadius: BorderRadius.circular(30.0),
                                                                            ),
                                                                            alignment:
                                                                                const AlignmentDirectional(0.0, 0.0),
                                                                          ),
                                                                        ),
                                                                      Opacity(
                                                                        opacity:
                                                                            FFAppState().SphereIconsReactionOnPressListTake[3],
                                                                        child:
                                                                            Align(
                                                                          alignment: const AlignmentDirectional(
                                                                              0.0,
                                                                              0.0),
                                                                          child:
                                                                              InkWell(
                                                                            splashColor:
                                                                                Colors.transparent,
                                                                            focusColor:
                                                                                Colors.transparent,
                                                                            hoverColor:
                                                                                Colors.transparent,
                                                                            highlightColor:
                                                                                Colors.transparent,
                                                                            onTap:
                                                                                () async {
                                                                              if (FFAppState().ListTAKEvaluesForFilterGmap.contains('Finances') == true) {
                                                                                FFAppState().removeFromListTAKEvaluesForFilterGmap('Finances');
                                                                                FFAppState().updateSphereIconsReactionOnPressListTakeAtIndex(
                                                                                  3,
                                                                                  (_) => 0.8,
                                                                                );
                                                                                FFAppState().update(() {});
                                                                                FFAppState().updateMapSphereFilterImageTAKEisHightedAtIndex(
                                                                                  3,
                                                                                  (_) => false,
                                                                                );
                                                                                FFAppState().update(() {});
                                                                              } else {
                                                                                FFAppState().addToListTAKEvaluesForFilterGmap('Finances');
                                                                                FFAppState().updateSphereIconsReactionOnPressListTakeAtIndex(
                                                                                  3,
                                                                                  (_) => 1.0,
                                                                                );
                                                                                FFAppState().update(() {});
                                                                                FFAppState().updateMapSphereFilterImageTAKEisHightedAtIndex(
                                                                                  3,
                                                                                  (_) => true,
                                                                                );
                                                                                FFAppState().update(() {});
                                                                              }
                                                                            },
                                                                            child:
                                                                                ClipRRect(
                                                                              borderRadius: BorderRadius.circular(30.0),
                                                                              child: Image.asset(
                                                                                'assets/images/Finances.png',
                                                                                width: 57.0,
                                                                                height: 37.0,
                                                                                fit: BoxFit.cover,
                                                                                alignment: const Alignment(0.0, 0.0),
                                                                              ),
                                                                            ),
                                                                          ),
                                                                        ),
                                                                      ),
                                                                    ],
                                                                  ),
                                                                ),
                                                              ),
                                                              Align(
                                                                alignment:
                                                                    const AlignmentDirectional(
                                                                        0.0,
                                                                        0.0),
                                                                child: Text(
                                                                  FFLocalizations.of(
                                                                          context)
                                                                      .getText(
                                                                    'uqgpdjad' /* Finances */,
                                                                  ),
                                                                  style: FlutterFlowTheme.of(
                                                                          context)
                                                                      .bodyMedium
                                                                      .override(
                                                                        fontFamily:
                                                                            'Montserrat',
                                                                        fontSize:
                                                                            12.0,
                                                                        letterSpacing:
                                                                            0.0,
                                                                        fontWeight:
                                                                            FontWeight.w600,
                                                                      ),
                                                                ),
                                                              ),
                                                            ],
                                                          ),
                                                        ),
                                                      ),
                                                      Align(
                                                        alignment:
                                                            const AlignmentDirectional(
                                                                0.0, 0.0),
                                                        child: Padding(
                                                          padding:
                                                              const EdgeInsetsDirectional
                                                                  .fromSTEB(
                                                                      7.0,
                                                                      0.0,
                                                                      7.0,
                                                                      0.0),
                                                          child: Column(
                                                            mainAxisSize:
                                                                MainAxisSize
                                                                    .min,
                                                            mainAxisAlignment:
                                                                MainAxisAlignment
                                                                    .center,
                                                            children: [
                                                              Expanded(
                                                                child: Align(
                                                                  alignment:
                                                                      const AlignmentDirectional(
                                                                          0.0,
                                                                          0.0),
                                                                  child: Stack(
                                                                    alignment:
                                                                        const AlignmentDirectional(
                                                                            0.0,
                                                                            0.0),
                                                                    children: [
                                                                      if (FFAppState()
                                                                          .MapSphereFilterImageTAKEisHighted[2])
                                                                        Align(
                                                                          alignment: const AlignmentDirectional(
                                                                              0.0,
                                                                              0.0),
                                                                          child:
                                                                              Container(
                                                                            width:
                                                                                60.0,
                                                                            height:
                                                                                40.0,
                                                                            decoration:
                                                                                BoxDecoration(
                                                                              color: FlutterFlowTheme.of(context).primaryText,
                                                                              borderRadius: BorderRadius.circular(30.0),
                                                                            ),
                                                                          ),
                                                                        ),
                                                                      Opacity(
                                                                        opacity:
                                                                            FFAppState().SphereIconsReactionOnPressListTake[2],
                                                                        child:
                                                                            Align(
                                                                          alignment: const AlignmentDirectional(
                                                                              0.0,
                                                                              0.0),
                                                                          child:
                                                                              InkWell(
                                                                            splashColor:
                                                                                Colors.transparent,
                                                                            focusColor:
                                                                                Colors.transparent,
                                                                            hoverColor:
                                                                                Colors.transparent,
                                                                            highlightColor:
                                                                                Colors.transparent,
                                                                            onTap:
                                                                                () async {
                                                                              if (FFAppState().ListTAKEvaluesForFilterGmap.contains('Intellect') == true) {
                                                                                FFAppState().removeFromListTAKEvaluesForFilterGmap('Intellect');
                                                                                FFAppState().updateSphereIconsReactionOnPressListTakeAtIndex(
                                                                                  2,
                                                                                  (_) => 0.8,
                                                                                );
                                                                                FFAppState().update(() {});
                                                                                FFAppState().updateMapSphereFilterImageTAKEisHightedAtIndex(
                                                                                  2,
                                                                                  (_) => false,
                                                                                );
                                                                                FFAppState().update(() {});
                                                                              } else {
                                                                                FFAppState().addToListTAKEvaluesForFilterGmap('Intellect');
                                                                                FFAppState().updateSphereIconsReactionOnPressListTakeAtIndex(
                                                                                  2,
                                                                                  (_) => 1.0,
                                                                                );
                                                                                FFAppState().update(() {});
                                                                                FFAppState().updateMapSphereFilterImageTAKEisHightedAtIndex(
                                                                                  2,
                                                                                  (_) => true,
                                                                                );
                                                                                FFAppState().update(() {});
                                                                              }
                                                                            },
                                                                            child:
                                                                                ClipRRect(
                                                                              borderRadius: BorderRadius.circular(30.0),
                                                                              child: Image.asset(
                                                                                'assets/images/IntellectForGmapPage.png',
                                                                                width: 57.0,
                                                                                height: 37.0,
                                                                                fit: BoxFit.cover,
                                                                                alignment: const Alignment(0.0, 0.0),
                                                                              ),
                                                                            ),
                                                                          ),
                                                                        ),
                                                                      ),
                                                                    ],
                                                                  ),
                                                                ),
                                                              ),
                                                              Align(
                                                                alignment:
                                                                    const AlignmentDirectional(
                                                                        0.0,
                                                                        0.0),
                                                                child: Padding(
                                                                  padding: const EdgeInsetsDirectional
                                                                      .fromSTEB(
                                                                          1.0,
                                                                          0.0,
                                                                          1.0,
                                                                          0.0),
                                                                  child: Text(
                                                                    FFLocalizations.of(
                                                                            context)
                                                                        .getText(
                                                                      '2pqtglvu' /* Intellect */,
                                                                    ),
                                                                    textAlign:
                                                                        TextAlign
                                                                            .center,
                                                                    style: FlutterFlowTheme.of(
                                                                            context)
                                                                        .bodyMedium
                                                                        .override(
                                                                          fontFamily:
                                                                              'Montserrat',
                                                                          fontSize:
                                                                              12.0,
                                                                          letterSpacing:
                                                                              0.0,
                                                                          fontWeight:
                                                                              FontWeight.w600,
                                                                        ),
                                                                  ),
                                                                ),
                                                              ),
                                                            ],
                                                          ),
                                                        ),
                                                      ),
                                                      Align(
                                                        alignment:
                                                            const AlignmentDirectional(
                                                                0.0, 0.0),
                                                        child: Padding(
                                                          padding:
                                                              const EdgeInsetsDirectional
                                                                  .fromSTEB(
                                                                      7.0,
                                                                      0.0,
                                                                      7.0,
                                                                      0.0),
                                                          child: Column(
                                                            mainAxisSize:
                                                                MainAxisSize
                                                                    .min,
                                                            mainAxisAlignment:
                                                                MainAxisAlignment
                                                                    .center,
                                                            children: [
                                                              Expanded(
                                                                child: Align(
                                                                  alignment:
                                                                      const AlignmentDirectional(
                                                                          0.0,
                                                                          0.0),
                                                                  child: Stack(
                                                                    alignment:
                                                                        const AlignmentDirectional(
                                                                            0.0,
                                                                            0.0),
                                                                    children: [
                                                                      if (FFAppState()
                                                                          .MapSphereFilterImageTAKEisHighted[1])
                                                                        Align(
                                                                          alignment: const AlignmentDirectional(
                                                                              0.0,
                                                                              0.0),
                                                                          child:
                                                                              Container(
                                                                            width:
                                                                                60.0,
                                                                            height:
                                                                                40.0,
                                                                            decoration:
                                                                                BoxDecoration(
                                                                              color: FlutterFlowTheme.of(context).primaryText,
                                                                              borderRadius: BorderRadius.circular(30.0),
                                                                            ),
                                                                          ),
                                                                        ),
                                                                      Opacity(
                                                                        opacity:
                                                                            FFAppState().SphereIconsReactionOnPressListTake[1],
                                                                        child:
                                                                            Align(
                                                                          alignment: const AlignmentDirectional(
                                                                              0.0,
                                                                              0.0),
                                                                          child:
                                                                              InkWell(
                                                                            splashColor:
                                                                                Colors.transparent,
                                                                            focusColor:
                                                                                Colors.transparent,
                                                                            hoverColor:
                                                                                Colors.transparent,
                                                                            highlightColor:
                                                                                Colors.transparent,
                                                                            onTap:
                                                                                () async {
                                                                              if (FFAppState().ListTAKEvaluesForFilterGmap.contains('Health') == true) {
                                                                                FFAppState().removeFromListTAKEvaluesForFilterGmap('Health');
                                                                                FFAppState().updateSphereIconsReactionOnPressListTakeAtIndex(
                                                                                  1,
                                                                                  (_) => 0.8,
                                                                                );
                                                                                FFAppState().update(() {});
                                                                                FFAppState().updateMapSphereFilterImageTAKEisHightedAtIndex(
                                                                                  1,
                                                                                  (_) => false,
                                                                                );
                                                                                FFAppState().update(() {});
                                                                              } else {
                                                                                FFAppState().addToListTAKEvaluesForFilterGmap('Health');
                                                                                FFAppState().updateSphereIconsReactionOnPressListTakeAtIndex(
                                                                                  1,
                                                                                  (_) => 1.0,
                                                                                );
                                                                                FFAppState().update(() {});
                                                                                FFAppState().updateMapSphereFilterImageTAKEisHightedAtIndex(
                                                                                  1,
                                                                                  (_) => true,
                                                                                );
                                                                                FFAppState().update(() {});
                                                                              }
                                                                            },
                                                                            child:
                                                                                ClipRRect(
                                                                              borderRadius: BorderRadius.circular(30.0),
                                                                              child: Image.asset(
                                                                                'assets/images/Health.png',
                                                                                width: 57.0,
                                                                                height: 37.0,
                                                                                fit: BoxFit.cover,
                                                                                alignment: const Alignment(0.0, 0.0),
                                                                              ),
                                                                            ),
                                                                          ),
                                                                        ),
                                                                      ),
                                                                    ],
                                                                  ),
                                                                ),
                                                              ),
                                                              Align(
                                                                alignment:
                                                                    const AlignmentDirectional(
                                                                        0.0,
                                                                        0.0),
                                                                child: Padding(
                                                                  padding: const EdgeInsetsDirectional
                                                                      .fromSTEB(
                                                                          1.0,
                                                                          0.0,
                                                                          1.0,
                                                                          0.0),
                                                                  child: Text(
                                                                    FFLocalizations.of(
                                                                            context)
                                                                        .getText(
                                                                      'f9x5u104' /* Health */,
                                                                    ),
                                                                    textAlign:
                                                                        TextAlign
                                                                            .center,
                                                                    style: FlutterFlowTheme.of(
                                                                            context)
                                                                        .bodyMedium
                                                                        .override(
                                                                          fontFamily:
                                                                              'Montserrat',
                                                                          fontSize:
                                                                              12.0,
                                                                          letterSpacing:
                                                                              0.0,
                                                                          fontWeight:
                                                                              FontWeight.w600,
                                                                        ),
                                                                  ),
                                                                ),
                                                              ),
                                                            ],
                                                          ),
                                                        ),
                                                      ),
                                                      Align(
                                                        alignment:
                                                            const AlignmentDirectional(
                                                                0.0, 0.0),
                                                        child: Padding(
                                                          padding:
                                                              const EdgeInsetsDirectional
                                                                  .fromSTEB(
                                                                      7.0,
                                                                      0.0,
                                                                      7.0,
                                                                      0.0),
                                                          child: Column(
                                                            mainAxisSize:
                                                                MainAxisSize
                                                                    .min,
                                                            mainAxisAlignment:
                                                                MainAxisAlignment
                                                                    .center,
                                                            children: [
                                                              Expanded(
                                                                child: Align(
                                                                  alignment:
                                                                      const AlignmentDirectional(
                                                                          0.0,
                                                                          0.0),
                                                                  child: Stack(
                                                                    alignment:
                                                                        const AlignmentDirectional(
                                                                            0.0,
                                                                            0.0),
                                                                    children: [
                                                                      if (FFAppState()
                                                                          .MapSphereFilterImageTAKEisHighted[6])
                                                                        Align(
                                                                          alignment: const AlignmentDirectional(
                                                                              0.0,
                                                                              0.0),
                                                                          child:
                                                                              Container(
                                                                            width:
                                                                                60.0,
                                                                            height:
                                                                                40.0,
                                                                            decoration:
                                                                                BoxDecoration(
                                                                              color: FlutterFlowTheme.of(context).primaryText,
                                                                              borderRadius: BorderRadius.circular(30.0),
                                                                            ),
                                                                          ),
                                                                        ),
                                                                      Opacity(
                                                                        opacity:
                                                                            FFAppState().SphereIconsReactionOnPressListTake[6],
                                                                        child:
                                                                            Align(
                                                                          alignment: const AlignmentDirectional(
                                                                              0.0,
                                                                              0.0),
                                                                          child:
                                                                              InkWell(
                                                                            splashColor:
                                                                                Colors.transparent,
                                                                            focusColor:
                                                                                Colors.transparent,
                                                                            hoverColor:
                                                                                Colors.transparent,
                                                                            highlightColor:
                                                                                Colors.transparent,
                                                                            onTap:
                                                                                () async {
                                                                              if (FFAppState().ListTAKEvaluesForFilterGmap.contains('Career') == true) {
                                                                                FFAppState().removeFromListTAKEvaluesForFilterGmap('Career');
                                                                                FFAppState().updateSphereIconsReactionOnPressListTakeAtIndex(
                                                                                  6,
                                                                                  (_) => 0.8,
                                                                                );
                                                                                FFAppState().update(() {});
                                                                                FFAppState().updateMapSphereFilterImageTAKEisHightedAtIndex(
                                                                                  6,
                                                                                  (_) => false,
                                                                                );
                                                                                FFAppState().update(() {});
                                                                              } else {
                                                                                FFAppState().addToListTAKEvaluesForFilterGmap('Career');
                                                                                FFAppState().updateSphereIconsReactionOnPressListTakeAtIndex(
                                                                                  6,
                                                                                  (_) => 1.0,
                                                                                );
                                                                                FFAppState().update(() {});
                                                                                FFAppState().updateMapSphereFilterImageTAKEisHightedAtIndex(
                                                                                  6,
                                                                                  (_) => true,
                                                                                );
                                                                                FFAppState().update(() {});
                                                                              }
                                                                            },
                                                                            child:
                                                                                ClipRRect(
                                                                              borderRadius: BorderRadius.circular(30.0),
                                                                              child: Image.asset(
                                                                                'assets/images/image_3.png',
                                                                                width: 57.0,
                                                                                height: 37.0,
                                                                                fit: BoxFit.cover,
                                                                                alignment: const Alignment(0.0, 0.0),
                                                                              ),
                                                                            ),
                                                                          ),
                                                                        ),
                                                                      ),
                                                                    ],
                                                                  ),
                                                                ),
                                                              ),
                                                              Align(
                                                                alignment:
                                                                    const AlignmentDirectional(
                                                                        0.0,
                                                                        0.0),
                                                                child: Padding(
                                                                  padding: const EdgeInsetsDirectional
                                                                      .fromSTEB(
                                                                          1.0,
                                                                          0.0,
                                                                          1.0,
                                                                          0.0),
                                                                  child: Text(
                                                                    FFLocalizations.of(
                                                                            context)
                                                                        .getText(
                                                                      'u3r2t3lk' /* Career */,
                                                                    ),
                                                                    textAlign:
                                                                        TextAlign
                                                                            .center,
                                                                    style: FlutterFlowTheme.of(
                                                                            context)
                                                                        .bodyMedium
                                                                        .override(
                                                                          fontFamily:
                                                                              'Montserrat',
                                                                          fontSize:
                                                                              12.0,
                                                                          letterSpacing:
                                                                              0.0,
                                                                          fontWeight:
                                                                              FontWeight.w600,
                                                                        ),
                                                                  ),
                                                                ),
                                                              ),
                                                            ],
                                                          ),
                                                        ),
                                                      ),
                                                      Align(
                                                        alignment:
                                                            const AlignmentDirectional(
                                                                0.0, 0.0),
                                                        child: Padding(
                                                          padding:
                                                              const EdgeInsetsDirectional
                                                                  .fromSTEB(
                                                                      7.0,
                                                                      0.0,
                                                                      30.0,
                                                                      0.0),
                                                          child: Column(
                                                            mainAxisSize:
                                                                MainAxisSize
                                                                    .min,
                                                            mainAxisAlignment:
                                                                MainAxisAlignment
                                                                    .center,
                                                            children: [
                                                              Expanded(
                                                                child: Align(
                                                                  alignment:
                                                                      const AlignmentDirectional(
                                                                          0.0,
                                                                          0.0),
                                                                  child: Stack(
                                                                    alignment:
                                                                        const AlignmentDirectional(
                                                                            0.0,
                                                                            0.0),
                                                                    children: [
                                                                      if (FFAppState()
                                                                          .MapSphereFilterImageTAKEisHighted[0])
                                                                        Align(
                                                                          alignment: const AlignmentDirectional(
                                                                              0.0,
                                                                              0.0),
                                                                          child:
                                                                              Container(
                                                                            width:
                                                                                60.0,
                                                                            height:
                                                                                40.0,
                                                                            decoration:
                                                                                BoxDecoration(
                                                                              color: FlutterFlowTheme.of(context).primaryText,
                                                                              borderRadius: BorderRadius.circular(30.0),
                                                                            ),
                                                                            alignment:
                                                                                const AlignmentDirectional(0.0, 0.0),
                                                                          ),
                                                                        ),
                                                                      Opacity(
                                                                        opacity:
                                                                            FFAppState().SphereIconsReactionOnPressListTake[0],
                                                                        child:
                                                                            Align(
                                                                          alignment: const AlignmentDirectional(
                                                                              0.0,
                                                                              0.0),
                                                                          child:
                                                                              InkWell(
                                                                            splashColor:
                                                                                Colors.transparent,
                                                                            focusColor:
                                                                                Colors.transparent,
                                                                            hoverColor:
                                                                                Colors.transparent,
                                                                            highlightColor:
                                                                                Colors.transparent,
                                                                            onTap:
                                                                                () async {
                                                                              if (FFAppState().ListTAKEvaluesForFilterGmap.contains('Balance') == true) {
                                                                                FFAppState().removeFromListTAKEvaluesForFilterGmap('Balance');
                                                                                FFAppState().updateSphereIconsReactionOnPressListTakeAtIndex(
                                                                                  0,
                                                                                  (_) => 0.8,
                                                                                );
                                                                                FFAppState().update(() {});
                                                                                FFAppState().updateMapSphereFilterImageTAKEisHightedAtIndex(
                                                                                  0,
                                                                                  (_) => false,
                                                                                );
                                                                                FFAppState().update(() {});
                                                                              } else {
                                                                                FFAppState().addToListTAKEvaluesForFilterGmap('Balance');
                                                                                FFAppState().updateSphereIconsReactionOnPressListTakeAtIndex(
                                                                                  0,
                                                                                  (_) => 1.0,
                                                                                );
                                                                                FFAppState().update(() {});
                                                                                FFAppState().updateMapSphereFilterImageTAKEisHightedAtIndex(
                                                                                  0,
                                                                                  (_) => true,
                                                                                );
                                                                                FFAppState().update(() {});
                                                                              }
                                                                            },
                                                                            child:
                                                                                ClipRRect(
                                                                              borderRadius: BorderRadius.circular(28.0),
                                                                              child: Image.asset(
                                                                                'assets/images/Balance.png',
                                                                                width: 57.0,
                                                                                height: 37.0,
                                                                                fit: BoxFit.cover,
                                                                                alignment: const Alignment(0.0, 0.0),
                                                                              ),
                                                                            ),
                                                                          ),
                                                                        ),
                                                                      ),
                                                                    ],
                                                                  ),
                                                                ),
                                                              ),
                                                              Align(
                                                                alignment:
                                                                    const AlignmentDirectional(
                                                                        0.0,
                                                                        0.0),
                                                                child: Padding(
                                                                  padding: const EdgeInsetsDirectional
                                                                      .fromSTEB(
                                                                          1.0,
                                                                          0.0,
                                                                          1.0,
                                                                          0.0),
                                                                  child: Text(
                                                                    FFLocalizations.of(
                                                                            context)
                                                                        .getText(
                                                                      'w25ko5v9' /* Balance */,
                                                                    ),
                                                                    style: FlutterFlowTheme.of(
                                                                            context)
                                                                        .bodyMedium
                                                                        .override(
                                                                          fontFamily:
                                                                              'Montserrat',
                                                                          fontSize:
                                                                              12.0,
                                                                          letterSpacing:
                                                                              0.0,
                                                                          fontWeight:
                                                                              FontWeight.w600,
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
                                              ),
                                            ],
                                          ),
                                        ],
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
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
