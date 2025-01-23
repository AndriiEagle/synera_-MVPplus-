import '/auth/firebase_auth/auth_util.dart';
import '/backend/api_requests/api_calls.dart';
import '/backend/backend.dart';
import '/components/new_design_potencial_benefits_gmap_table_widget.dart';
import '/flutter_flow/flutter_flow_animations.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import '/flutter_flow/custom_functions.dart' as functions;
import 'package:aligned_dialog/aligned_dialog.dart';
import 'package:auto_size_text/auto_size_text.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:collection/collection.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import 'g_map_values_table_model.dart';
export 'g_map_values_table_model.dart';

class GMapValuesTableWidget extends StatefulWidget {
  const GMapValuesTableWidget({super.key});

  @override
  State<GMapValuesTableWidget> createState() => _GMapValuesTableWidgetState();
}

class _GMapValuesTableWidgetState extends State<GMapValuesTableWidget>
    with TickerProviderStateMixin {
  late GMapValuesTableModel _model;

  final animationsMap = <String, AnimationInfo>{};

  @override
  void setState(VoidCallback callback) {
    super.setState(callback);
    _model.onUpdate();
  }

  @override
  void initState() {
    super.initState();
    _model = createModel(context, () => GMapValuesTableModel());

    animationsMap.addAll({
      'textOnPageLoadAnimation1': AnimationInfo(
        loop: true,
        reverse: true,
        trigger: AnimationTrigger.onPageLoad,
        effectsBuilder: () => [
          ShimmerEffect(
            curve: Curves.easeInOut,
            delay: 2000.0.ms,
            duration: 5920.0.ms,
            color: FlutterFlowTheme.of(context).secondary,
            angle: 0.524,
          ),
        ],
      ),
      'textOnPageLoadAnimation2': AnimationInfo(
        loop: true,
        reverse: true,
        trigger: AnimationTrigger.onPageLoad,
        effectsBuilder: () => [
          ShimmerEffect(
            curve: Curves.easeInOut,
            delay: 2000.0.ms,
            duration: 5920.0.ms,
            color: FlutterFlowTheme.of(context).secondary,
            angle: 0.524,
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
      padding: const EdgeInsetsDirectional.fromSTEB(0.0, 10.0, 0.0, 0.0),
      child: Stack(
        children: [
          if (FFAppState().GMapTableBool == false)
            Container(
              width: MediaQuery.sizeOf(context).width * 1.0,
              height: MediaQuery.sizeOf(context).height * 1.0,
              decoration: BoxDecoration(
                color: FlutterFlowTheme.of(context).primaryBackground,
                borderRadius: const BorderRadius.only(
                  bottomLeft: Radius.circular(0.0),
                  bottomRight: Radius.circular(0.0),
                  topLeft: Radius.circular(24.0),
                  topRight: Radius.circular(24.0),
                ),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.max,
                children: [
                  Align(
                    alignment: const AlignmentDirectional(1.0, 0.0),
                    child: Padding(
                      padding:
                          const EdgeInsetsDirectional.fromSTEB(0.0, 35.0, 30.0, 0.0),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          Align(
                            alignment: const AlignmentDirectional(1.0, 0.0),
                            child: InkWell(
                              splashColor: Colors.transparent,
                              focusColor: Colors.transparent,
                              hoverColor: Colors.transparent,
                              highlightColor: Colors.transparent,
                              onTap: () async {
                                Navigator.pop(context);
                              },
                              child: const Icon(
                                Icons.close,
                                color: Colors.white,
                                size: 24.0,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  Padding(
                    padding:
                        const EdgeInsetsDirectional.fromSTEB(0.0, 5.0, 0.0, 10.0),
                    child: Row(
                      mainAxisSize: MainAxisSize.max,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Align(
                          alignment: const AlignmentDirectional(0.0, 0.0),
                          child: InkWell(
                            splashColor: Colors.transparent,
                            focusColor: Colors.transparent,
                            hoverColor: Colors.transparent,
                            highlightColor: Colors.transparent,
                            onTap: () async {
                              FFAppState().GMapTableBool =
                                  !(FFAppState().GMapTableBool ?? true);
                              FFAppState().update(() {});
                            },
                            child: Container(
                              width: 112.0,
                              height: 48.0,
                              decoration: BoxDecoration(
                                color: FlutterFlowTheme.of(context)
                                    .secondaryBackground,
                                borderRadius: const BorderRadius.only(
                                  bottomLeft: Radius.circular(16.0),
                                  bottomRight: Radius.circular(3.0),
                                  topLeft: Radius.circular(16.0),
                                  topRight: Radius.circular(3.0),
                                ),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.max,
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Text(
                                    FFLocalizations.of(context).getText(
                                      'dgj6bf0i' /* I Take */,
                                    ),
                                    style: FlutterFlowTheme.of(context)
                                        .bodyMedium
                                        .override(
                                          fontFamily: 'Montserrat',
                                          color: FlutterFlowTheme.of(context)
                                              .primaryText,
                                          letterSpacing: 0.0,
                                          fontWeight: FontWeight.w600,
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
                            width: 112.0,
                            height: 48.0,
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
                                bottomLeft: Radius.circular(3.0),
                                bottomRight: Radius.circular(16.0),
                                topLeft: Radius.circular(3.0),
                                topRight: Radius.circular(16.0),
                              ),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.max,
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(
                                  FFLocalizations.of(context).getText(
                                    '29dz3v65' /* I Give */,
                                  ),
                                  style: FlutterFlowTheme.of(context)
                                      .bodyMedium
                                      .override(
                                        fontFamily: 'Montserrat',
                                        color: FlutterFlowTheme.of(context)
                                            .primaryText,
                                        letterSpacing: 0.0,
                                        fontWeight: FontWeight.w600,
                                      ),
                                ).animateOnPageLoad(
                                    animationsMap['textOnPageLoadAnimation1']!),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsetsDirectional.fromSTEB(0.0, 7.0, 0.0, 0.0),
                    child: Builder(
                      builder: (context) {
                        final take = getJsonField(
                          FFAppState().FilteredJsonByGiveTake,
                          r'''$''',
                        ).toList();

                        return ListView.builder(
                          padding: EdgeInsets.zero,
                          shrinkWrap: true,
                          scrollDirection: Axis.vertical,
                          itemCount: take.length,
                          itemBuilder: (context, takeIndex) {
                            final takeItem = take[takeIndex];
                            return Column(
                              mainAxisSize: MainAxisSize.max,
                              children: [
                                Align(
                                  alignment: const AlignmentDirectional(0.0, -1.0),
                                  child: Padding(
                                    padding: const EdgeInsetsDirectional.fromSTEB(
                                        16.0, 10.0, 16.0, 1.0),
                                    child: Container(
                                      width: 350.0,
                                      height: 140.0,
                                      decoration: BoxDecoration(
                                        color: FlutterFlowTheme.of(context)
                                            .secondaryBackground,
                                        boxShadow: const [
                                          BoxShadow(
                                            blurRadius: 40.0,
                                            color: Color(0xEC140144),
                                            offset: Offset(
                                              1.0,
                                              1.0,
                                            ),
                                            spreadRadius: 3.0,
                                          )
                                        ],
                                        borderRadius: const BorderRadius.only(
                                          bottomLeft: Radius.circular(3.0),
                                          bottomRight: Radius.circular(16.0),
                                          topLeft: Radius.circular(16.0),
                                          topRight: Radius.circular(3.0),
                                        ),
                                      ),
                                      child: Align(
                                        alignment:
                                            const AlignmentDirectional(0.0, 0.0),
                                        child: Padding(
                                          padding:
                                              const EdgeInsetsDirectional.fromSTEB(
                                                  2.0, 0.0, 10.0, 0.0),
                                          child: Row(
                                            mainAxisSize: MainAxisSize.max,
                                            crossAxisAlignment:
                                                CrossAxisAlignment.start,
                                            children: [
                                              Expanded(
                                                flex: 4,
                                                child: Padding(
                                                  padding: const EdgeInsetsDirectional
                                                      .fromSTEB(
                                                          0.0, 0.0, 0.0, 12.0),
                                                  child: Row(
                                                    mainAxisSize:
                                                        MainAxisSize.max,
                                                    crossAxisAlignment:
                                                        CrossAxisAlignment
                                                            .start,
                                                    children: [
                                                      Align(
                                                        alignment:
                                                            const AlignmentDirectional(
                                                                -1.0, -1.0),
                                                        child: Column(
                                                          mainAxisSize:
                                                              MainAxisSize.min,
                                                          mainAxisAlignment:
                                                              MainAxisAlignment
                                                                  .start,
                                                          crossAxisAlignment:
                                                              CrossAxisAlignment
                                                                  .start,
                                                          children: [
                                                            Align(
                                                              alignment:
                                                                  const AlignmentDirectional(
                                                                      -1.0,
                                                                      -1.0),
                                                              child: Padding(
                                                                padding:
                                                                    const EdgeInsetsDirectional
                                                                        .fromSTEB(
                                                                            0.0,
                                                                            2.0,
                                                                            0.0,
                                                                            0.0),
                                                                child:
                                                                    Container(
                                                                  width: 65.0,
                                                                  height: 65.0,
                                                                  decoration:
                                                                      const BoxDecoration(
                                                                    color: Colors
                                                                        .transparent,
                                                                    boxShadow: [
                                                                      BoxShadow(
                                                                        blurRadius:
                                                                            40.0,
                                                                        color: Color(
                                                                            0xAAE7BD87),
                                                                        offset:
                                                                            Offset(
                                                                          0.0,
                                                                          2.0,
                                                                        ),
                                                                        spreadRadius:
                                                                            1.0,
                                                                      )
                                                                    ],
                                                                    borderRadius:
                                                                        BorderRadius
                                                                            .only(
                                                                      bottomLeft:
                                                                          Radius.circular(
                                                                              0.0),
                                                                      bottomRight:
                                                                          Radius.circular(
                                                                              16.0),
                                                                      topLeft: Radius
                                                                          .circular(
                                                                              16.0),
                                                                      topRight:
                                                                          Radius.circular(
                                                                              0.0),
                                                                    ),
                                                                    shape: BoxShape
                                                                        .rectangle,
                                                                  ),
                                                                  child:
                                                                      ClipRRect(
                                                                    borderRadius:
                                                                        const BorderRadius
                                                                            .only(
                                                                      bottomLeft:
                                                                          Radius.circular(
                                                                              0.0),
                                                                      bottomRight:
                                                                          Radius.circular(
                                                                              16.0),
                                                                      topLeft: Radius
                                                                          .circular(
                                                                              16.0),
                                                                      topRight:
                                                                          Radius.circular(
                                                                              0.0),
                                                                    ),
                                                                    child:
                                                                        CachedNetworkImage(
                                                                      fadeInDuration:
                                                                          const Duration(
                                                                              milliseconds: 500),
                                                                      fadeOutDuration:
                                                                          const Duration(
                                                                              milliseconds: 500),
                                                                      imageUrl:
                                                                          getJsonField(
                                                                        takeItem,
                                                                        r'''$.photoUrl''',
                                                                      ).toString(),
                                                                      width:
                                                                          65.0,
                                                                      height:
                                                                          65.0,
                                                                      fit: BoxFit
                                                                          .cover,
                                                                    ),
                                                                  ),
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
                                                                            0.0,
                                                                            5.0,
                                                                            0.0,
                                                                            0.0),
                                                                child:
                                                                    Container(
                                                                  width: 80.0,
                                                                  decoration:
                                                                      const BoxDecoration(
                                                                    color: Colors
                                                                        .transparent,
                                                                  ),
                                                                  child: Align(
                                                                    alignment:
                                                                        const AlignmentDirectional(
                                                                            -1.0,
                                                                            0.0),
                                                                    child:
                                                                        AutoSizeText(
                                                                      getJsonField(
                                                                        takeItem,
                                                                        r'''$.displayName''',
                                                                      ).toString(),
                                                                      textAlign:
                                                                          TextAlign
                                                                              .center,
                                                                      maxLines:
                                                                          2,
                                                                      minFontSize:
                                                                          10.0,
                                                                      style: FlutterFlowTheme.of(
                                                                              context)
                                                                          .bodyMedium
                                                                          .override(
                                                                            fontFamily:
                                                                                'Montserrat',
                                                                            color:
                                                                                FlutterFlowTheme.of(context).primaryText,
                                                                            fontSize:
                                                                                12.0,
                                                                            letterSpacing:
                                                                                0.0,
                                                                          ),
                                                                    ),
                                                                  ),
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
                                                                            15.0,
                                                                            5.0,
                                                                            0.0,
                                                                            0.0),
                                                                child:
                                                                    Container(
                                                                  width: 40.0,
                                                                  height: 30.0,
                                                                  decoration:
                                                                      const BoxDecoration(
                                                                    color: Colors
                                                                        .transparent,
                                                                  ),
                                                                  alignment:
                                                                      const AlignmentDirectional(
                                                                          0.0,
                                                                          0.0),
                                                                  child: Align(
                                                                    alignment:
                                                                        const AlignmentDirectional(
                                                                            0.0,
                                                                            0.0),
                                                                    child:
                                                                        Builder(
                                                                      builder:
                                                                          (context) =>
                                                                              FFButtonWidget(
                                                                        onPressed:
                                                                            () async {
                                                                          FFAppState().UserOnListAbout =
                                                                              getJsonField(
                                                                            takeItem,
                                                                            r'''$.aboutMe''',
                                                                          ).toString();
                                                                          safeSetState(
                                                                              () {});
                                                                          FFAppState().userOnListName =
                                                                              getJsonField(
                                                                            takeItem,
                                                                            r'''$.displayName''',
                                                                          ).toString();
                                                                          safeSetState(
                                                                              () {});
                                                                          FFAppState().mainUserName =
                                                                              currentUserDisplayName;
                                                                          safeSetState(
                                                                              () {});
                                                                          FFAppState().AIMatchComponentShowClickedUserPhotoUrl =
                                                                              getJsonField(
                                                                            takeItem,
                                                                            r'''$.photoUrl''',
                                                                          ).toString();
                                                                          safeSetState(
                                                                              () {});
                                                                          _model.mainUserGiveLis2 =
                                                                              await queryExchangesRecordOnce(
                                                                            parent:
                                                                                currentUserReference,
                                                                            queryBuilder: (exchangesRecord) =>
                                                                                exchangesRecord.where(
                                                                              'exchange_type',
                                                                              isEqualTo: 'give',
                                                                            ),
                                                                            singleRecord:
                                                                                true,
                                                                          ).then((s) => s.firstOrNull);
                                                                          _model.mainUseTakeLis2 =
                                                                              await queryExchangesRecordOnce(
                                                                            parent:
                                                                                currentUserReference,
                                                                            queryBuilder: (exchangesRecord) =>
                                                                                exchangesRecord.where(
                                                                              'exchange_type',
                                                                              isEqualTo: 'take',
                                                                            ),
                                                                            singleRecord:
                                                                                true,
                                                                          ).then((s) => s.firstOrNull);
                                                                          FFAppState().MainUserGiveList = _model
                                                                              .mainUserGiveLis!
                                                                              .values
                                                                              .map((e) => valueOrDefault<String>(
                                                                                    e.improvedRepresentation,
                                                                                    'bla it does not work',
                                                                                  ))
                                                                              .toList()
                                                                              .cast<String>();
                                                                          safeSetState(
                                                                              () {});
                                                                          FFAppState().MainUserTakeList = _model
                                                                              .mainUseTakeLis!
                                                                              .values
                                                                              .map((e) => valueOrDefault<String>(
                                                                                    e.improvedRepresentation,
                                                                                    'ddc',
                                                                                  ))
                                                                              .toList()
                                                                              .cast<String>();
                                                                          safeSetState(
                                                                              () {});
                                                                          FFAppState().MainUserGiveAndTakes =
                                                                              valueOrDefault<String>(
                                                                            functions.fromListOfStringsToOneString(FFAppState().MainUserGiveList.toList()),
                                                                            'errorrr=))',
                                                                          );
                                                                          safeSetState(
                                                                              () {});
                                                                          FFAppState().MainUserTakes =
                                                                              valueOrDefault<String>(
                                                                            functions.fromListOfStringsToOneString(FFAppState().MainUserTakeList.toList()),
                                                                            'I am default variable value, so...',
                                                                          );
                                                                          safeSetState(
                                                                              () {});
                                                                          FFAppState()
                                                                              .UserOnListGiveList = (getJsonField(
                                                                            takeItem,
                                                                            r'''$.gives[0][*].string_representation''',
                                                                            true,
                                                                          ) as List)
                                                                              .map<String>((s) => s.toString())
                                                                              .toList()
                                                                              .toList()
                                                                              .cast<String>();
                                                                          safeSetState(
                                                                              () {});
                                                                          FFAppState()
                                                                              .UserOnListTakeList = (getJsonField(
                                                                            takeItem,
                                                                            r'''$.takes[0][*].string_representation''',
                                                                            true,
                                                                          ) as List)
                                                                              .map<String>((s) => s.toString())
                                                                              .toList()
                                                                              .toList()
                                                                              .cast<String>();
                                                                          safeSetState(
                                                                              () {});
                                                                          FFAppState().UserOnListGive =
                                                                              valueOrDefault<String>(
                                                                            functions.fromListOfStringsToOneString(FFAppState().UserOnListGiveList.toList()),
                                                                            'бляяя',
                                                                          );
                                                                          safeSetState(
                                                                              () {});
                                                                          FFAppState().UserOnListTake =
                                                                              valueOrDefault<String>(
                                                                            functions.fromListOfStringsToOneString(FFAppState().UserOnListTakeList.toList()),
                                                                            'bla',
                                                                          );
                                                                          safeSetState(
                                                                              () {});
                                                                          _model.aiBetaResponse =
                                                                              await AiMatchBetaOriginalCall.call(
                                                                            user1About:
                                                                                FFAppState().MainUserAbout,
                                                                            user2About:
                                                                                FFAppState().UserOnListAbout,
                                                                            user1Give:
                                                                                FFAppState().MainUserGiveAndTakes,
                                                                            user1Take:
                                                                                FFAppState().MainUserTakes,
                                                                            user2Give:
                                                                                FFAppState().UserOnListGive,
                                                                            user2Take:
                                                                                FFAppState().UserOnListTake,
                                                                            user1Name:
                                                                                currentUserDisplayName,
                                                                            user2Name:
                                                                                FFAppState().userOnListName,
                                                                          );

                                                                          if ((_model.aiBetaResponse2?.succeeded ??
                                                                              true)) {
                                                                            FFAppState().AiBetaAnswer =
                                                                                getJsonField(
                                                                              (_model.aiBetaResponse2?.jsonBody ?? ''),
                                                                              r'''$.choices[:].message.content''',
                                                                            ).toString();
                                                                            safeSetState(() {});
                                                                          } else {
                                                                            await showDialog(
                                                                              context: context,
                                                                              builder: (alertDialogContext) {
                                                                                return AlertDialog(
                                                                                  title: const Text('Гггггг'),
                                                                                  actions: [
                                                                                    TextButton(
                                                                                      onPressed: () => Navigator.pop(alertDialogContext),
                                                                                      child: const Text('Ok'),
                                                                                    ),
                                                                                  ],
                                                                                );
                                                                              },
                                                                            );
                                                                          }

                                                                          await showAlignedDialog(
                                                                            context:
                                                                                context,
                                                                            isGlobal:
                                                                                false,
                                                                            avoidOverflow:
                                                                                true,
                                                                            targetAnchor:
                                                                                const AlignmentDirectional(0.0, -1.0).resolve(Directionality.of(context)),
                                                                            followerAnchor:
                                                                                const AlignmentDirectional(0.0, 0.0).resolve(Directionality.of(context)),
                                                                            builder:
                                                                                (dialogContext) {
                                                                              return const Material(
                                                                                color: Colors.transparent,
                                                                                child: NewDesignPotencialBenefitsGmapTableWidget(),
                                                                              );
                                                                            },
                                                                          );

                                                                          safeSetState(
                                                                              () {});
                                                                        },
                                                                        text: FFLocalizations.of(context)
                                                                            .getText(
                                                                          'v4pjtxfs' /*  */,
                                                                        ),
                                                                        icon:
                                                                            Icon(
                                                                          Icons
                                                                              .handshake_outlined,
                                                                          color:
                                                                              FlutterFlowTheme.of(context).primary,
                                                                          size:
                                                                              20.0,
                                                                        ),
                                                                        options:
                                                                            FFButtonOptions(
                                                                          width:
                                                                              60.0,
                                                                          height:
                                                                              20.0,
                                                                          padding: const EdgeInsetsDirectional.fromSTEB(
                                                                              0.0,
                                                                              0.0,
                                                                              0.0,
                                                                              0.0),
                                                                          iconPadding: const EdgeInsetsDirectional.fromSTEB(
                                                                              7.0,
                                                                              0.0,
                                                                              0.0,
                                                                              0.0),
                                                                          color:
                                                                              FlutterFlowTheme.of(context).primaryBackground,
                                                                          textStyle: FlutterFlowTheme.of(context)
                                                                              .titleSmall
                                                                              .override(
                                                                                fontFamily: 'Montserrat',
                                                                                color: Colors.white,
                                                                                letterSpacing: 0.0,
                                                                              ),
                                                                          elevation:
                                                                              0.0,
                                                                          borderRadius:
                                                                              const BorderRadius.only(
                                                                            bottomLeft:
                                                                                Radius.circular(0.0),
                                                                            bottomRight:
                                                                                Radius.circular(16.0),
                                                                            topLeft:
                                                                                Radius.circular(16.0),
                                                                            topRight:
                                                                                Radius.circular(0.0),
                                                                          ),
                                                                          hoverColor:
                                                                              FlutterFlowTheme.of(context).secondaryBackground,
                                                                          hoverTextColor:
                                                                              FlutterFlowTheme.of(context).primaryText,
                                                                        ),
                                                                      ),
                                                                    ),
                                                                  ),
                                                                ),
                                                              ),
                                                            ),
                                                          ],
                                                        ),
                                                      ),
                                                      Expanded(
                                                        child: Align(
                                                          alignment:
                                                              const AlignmentDirectional(
                                                                  -1.0, 0.0),
                                                          child: Padding(
                                                            padding:
                                                                const EdgeInsetsDirectional
                                                                    .fromSTEB(
                                                                        4.0,
                                                                        9.0,
                                                                        0.0,
                                                                        0.0),
                                                            child: Builder(
                                                              builder:
                                                                  (context) {
                                                                final take2 =
                                                                    getJsonField(
                                                                  takeItem,
                                                                  r'''$..takes[*]''',
                                                                ).toList();

                                                                return SingleChildScrollView(
                                                                  child: Column(
                                                                    mainAxisSize:
                                                                        MainAxisSize
                                                                            .min,
                                                                    mainAxisAlignment:
                                                                        MainAxisAlignment
                                                                            .center,
                                                                    crossAxisAlignment:
                                                                        CrossAxisAlignment
                                                                            .start,
                                                                    children: List.generate(
                                                                        take2
                                                                            .length,
                                                                        (take2Index) {
                                                                      final take2Item =
                                                                          take2[
                                                                              take2Index];
                                                                      return Align(
                                                                        alignment: const AlignmentDirectional(
                                                                            0.0,
                                                                            0.0),
                                                                        child:
                                                                            Padding(
                                                                          padding: const EdgeInsetsDirectional.fromSTEB(
                                                                              0.0,
                                                                              5.0,
                                                                              0.0,
                                                                              5.0),
                                                                          child:
                                                                              Row(
                                                                            mainAxisSize:
                                                                                MainAxisSize.max,
                                                                            mainAxisAlignment:
                                                                                MainAxisAlignment.center,
                                                                            crossAxisAlignment:
                                                                                CrossAxisAlignment.center,
                                                                            children: [
                                                                              Align(
                                                                                alignment: const AlignmentDirectional(-1.0, 0.0),
                                                                                child: Container(
                                                                                  width: 230.0,
                                                                                  height: 114.0,
                                                                                  decoration: BoxDecoration(
                                                                                    color: Colors.transparent,
                                                                                    borderRadius: BorderRadius.circular(16.0),
                                                                                    border: Border.all(
                                                                                      color: FlutterFlowTheme.of(context).primaryBackground,
                                                                                    ),
                                                                                  ),
                                                                                  alignment: const AlignmentDirectional(0.0, -1.0),
                                                                                  child: Align(
                                                                                    alignment: const AlignmentDirectional(0.0, -1.0),
                                                                                    child: Padding(
                                                                                      padding: const EdgeInsetsDirectional.fromSTEB(9.0, 6.0, 9.0, 6.0),
                                                                                      child: Text(
                                                                                        getJsonField(
                                                                                          take2Item,
                                                                                          r'''$..improved_representation''',
                                                                                        ).toString().maybeHandleOverflow(
                                                                                              maxChars: 190,
                                                                                              replacement: '…',
                                                                                            ),
                                                                                        textAlign: TextAlign.center,
                                                                                        style: FlutterFlowTheme.of(context).labelSmall.override(
                                                                                              fontFamily: 'Montserrat',
                                                                                              color: FlutterFlowTheme.of(context).primary,
                                                                                              fontSize: 12.0,
                                                                                              letterSpacing: 0.0,
                                                                                            ),
                                                                                      ),
                                                                                    ),
                                                                                  ),
                                                                                ),
                                                                              ),
                                                                            ],
                                                                          ),
                                                                        ),
                                                                      );
                                                                    }),
                                                                  ),
                                                                );
                                                              },
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
                                    ),
                                  ),
                                ),
                              ],
                            );
                          },
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),
          if (FFAppState().GMapTableBool == true)
            Container(
              width: MediaQuery.sizeOf(context).width * 1.0,
              height: MediaQuery.sizeOf(context).height * 1.0,
              decoration: BoxDecoration(
                color: FlutterFlowTheme.of(context).primaryBackground,
                borderRadius: const BorderRadius.only(
                  bottomLeft: Radius.circular(0.0),
                  bottomRight: Radius.circular(0.0),
                  topLeft: Radius.circular(24.0),
                  topRight: Radius.circular(24.0),
                ),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.max,
                children: [
                  Align(
                    alignment: const AlignmentDirectional(1.0, 0.0),
                    child: Padding(
                      padding:
                          const EdgeInsetsDirectional.fromSTEB(0.0, 35.0, 30.0, 0.0),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          Align(
                            alignment: const AlignmentDirectional(1.0, 0.0),
                            child: InkWell(
                              splashColor: Colors.transparent,
                              focusColor: Colors.transparent,
                              hoverColor: Colors.transparent,
                              highlightColor: Colors.transparent,
                              onTap: () async {
                                Navigator.pop(context);
                              },
                              child: const Icon(
                                Icons.close,
                                color: Colors.white,
                                size: 24.0,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  Padding(
                    padding:
                        const EdgeInsetsDirectional.fromSTEB(0.0, 5.0, 0.0, 10.0),
                    child: Row(
                      mainAxisSize: MainAxisSize.max,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Align(
                          alignment: const AlignmentDirectional(0.0, 0.0),
                          child: Container(
                            width: 112.0,
                            height: 48.0,
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
                                bottomLeft: Radius.circular(16.0),
                                bottomRight: Radius.circular(3.0),
                                topLeft: Radius.circular(16.0),
                                topRight: Radius.circular(3.0),
                              ),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.max,
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(
                                  FFLocalizations.of(context).getText(
                                    'w97hkeww' /* I Take */,
                                  ),
                                  style: FlutterFlowTheme.of(context)
                                      .bodyMedium
                                      .override(
                                        fontFamily: 'Montserrat',
                                        color: FlutterFlowTheme.of(context)
                                            .primaryBackground,
                                        letterSpacing: 0.0,
                                        fontWeight: FontWeight.w600,
                                      ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        Align(
                          alignment: const AlignmentDirectional(0.0, 0.0),
                          child: InkWell(
                            splashColor: Colors.transparent,
                            focusColor: Colors.transparent,
                            hoverColor: Colors.transparent,
                            highlightColor: Colors.transparent,
                            onTap: () async {
                              FFAppState().GMapTableBool =
                                  !(FFAppState().GMapTableBool ?? true);
                              FFAppState().update(() {});
                            },
                            child: Container(
                              width: 112.0,
                              height: 48.0,
                              decoration: const BoxDecoration(
                                color: Colors.transparent,
                                boxShadow: [
                                  BoxShadow(
                                    blurRadius: 4.0,
                                    color: Color(0x0CFFFFFF),
                                    offset: Offset(
                                      0.0,
                                      2.0,
                                    ),
                                  )
                                ],
                                borderRadius: BorderRadius.only(
                                  bottomLeft: Radius.circular(3.0),
                                  bottomRight: Radius.circular(16.0),
                                  topLeft: Radius.circular(3.0),
                                  topRight: Radius.circular(16.0),
                                ),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.max,
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Text(
                                    FFLocalizations.of(context).getText(
                                      'amie6gsl' /* I Give */,
                                    ),
                                    style: FlutterFlowTheme.of(context)
                                        .bodyMedium
                                        .override(
                                          fontFamily: 'Montserrat',
                                          color: FlutterFlowTheme.of(context)
                                              .primaryText,
                                          letterSpacing: 0.0,
                                          fontWeight: FontWeight.w600,
                                        ),
                                  ).animateOnPageLoad(animationsMap[
                                      'textOnPageLoadAnimation2']!),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsetsDirectional.fromSTEB(0.0, 7.0, 0.0, 0.0),
                    child: Builder(
                      builder: (context) {
                        final take = getJsonField(
                          FFAppState().FilteredJsonByGiveTake,
                          r'''$''',
                        ).toList();

                        return ListView.builder(
                          padding: EdgeInsets.zero,
                          shrinkWrap: true,
                          scrollDirection: Axis.vertical,
                          itemCount: take.length,
                          itemBuilder: (context, takeIndex) {
                            final takeItem = take[takeIndex];
                            return Column(
                              mainAxisSize: MainAxisSize.max,
                              children: [
                                Align(
                                  alignment: const AlignmentDirectional(0.0, -1.0),
                                  child: Padding(
                                    padding: const EdgeInsetsDirectional.fromSTEB(
                                        16.0, 10.0, 16.0, 1.0),
                                    child: Container(
                                      width: 350.0,
                                      height: 140.0,
                                      decoration: BoxDecoration(
                                        color: FlutterFlowTheme.of(context)
                                            .secondaryBackground,
                                        boxShadow: const [
                                          BoxShadow(
                                            blurRadius: 40.0,
                                            color: Color(0xB6190144),
                                            offset: Offset(
                                              1.0,
                                              1.0,
                                            ),
                                            spreadRadius: 3.0,
                                          )
                                        ],
                                        borderRadius: const BorderRadius.only(
                                          bottomLeft: Radius.circular(3.0),
                                          bottomRight: Radius.circular(16.0),
                                          topLeft: Radius.circular(16.0),
                                          topRight: Radius.circular(3.0),
                                        ),
                                      ),
                                      child: Align(
                                        alignment:
                                            const AlignmentDirectional(0.0, 0.0),
                                        child: Padding(
                                          padding:
                                              const EdgeInsetsDirectional.fromSTEB(
                                                  2.0, 0.0, 10.0, 0.0),
                                          child: Row(
                                            mainAxisSize: MainAxisSize.max,
                                            crossAxisAlignment:
                                                CrossAxisAlignment.start,
                                            children: [
                                              Expanded(
                                                flex: 4,
                                                child: Row(
                                                  mainAxisSize:
                                                      MainAxisSize.max,
                                                  crossAxisAlignment:
                                                      CrossAxisAlignment.start,
                                                  children: [
                                                    Align(
                                                      alignment:
                                                          const AlignmentDirectional(
                                                              -1.0, -1.0),
                                                      child: Column(
                                                        mainAxisSize:
                                                            MainAxisSize.min,
                                                        mainAxisAlignment:
                                                            MainAxisAlignment
                                                                .start,
                                                        crossAxisAlignment:
                                                            CrossAxisAlignment
                                                                .start,
                                                        children: [
                                                          Align(
                                                            alignment:
                                                                const AlignmentDirectional(
                                                                    -1.0, -1.0),
                                                            child: Padding(
                                                              padding:
                                                                  const EdgeInsetsDirectional
                                                                      .fromSTEB(
                                                                          0.0,
                                                                          2.0,
                                                                          0.0,
                                                                          0.0),
                                                              child: Container(
                                                                width: 65.0,
                                                                height: 65.0,
                                                                decoration:
                                                                    const BoxDecoration(
                                                                  color: Colors
                                                                      .transparent,
                                                                  boxShadow: [
                                                                    BoxShadow(
                                                                      blurRadius:
                                                                          40.0,
                                                                      color: Color(
                                                                          0xAAE7BD87),
                                                                      offset:
                                                                          Offset(
                                                                        0.0,
                                                                        2.0,
                                                                      ),
                                                                      spreadRadius:
                                                                          1.0,
                                                                    )
                                                                  ],
                                                                  borderRadius:
                                                                      BorderRadius
                                                                          .only(
                                                                    bottomLeft:
                                                                        Radius.circular(
                                                                            0.0),
                                                                    bottomRight:
                                                                        Radius.circular(
                                                                            16.0),
                                                                    topLeft: Radius
                                                                        .circular(
                                                                            16.0),
                                                                    topRight: Radius
                                                                        .circular(
                                                                            0.0),
                                                                  ),
                                                                  shape: BoxShape
                                                                      .rectangle,
                                                                ),
                                                                child:
                                                                    ClipRRect(
                                                                  borderRadius:
                                                                      const BorderRadius
                                                                          .only(
                                                                    bottomLeft:
                                                                        Radius.circular(
                                                                            0.0),
                                                                    bottomRight:
                                                                        Radius.circular(
                                                                            16.0),
                                                                    topLeft: Radius
                                                                        .circular(
                                                                            16.0),
                                                                    topRight: Radius
                                                                        .circular(
                                                                            0.0),
                                                                  ),
                                                                  child:
                                                                      CachedNetworkImage(
                                                                    fadeInDuration:
                                                                        const Duration(
                                                                            milliseconds:
                                                                                500),
                                                                    fadeOutDuration:
                                                                        const Duration(
                                                                            milliseconds:
                                                                                500),
                                                                    imageUrl:
                                                                        getJsonField(
                                                                      takeItem,
                                                                      r'''$.photoUrl''',
                                                                    ).toString(),
                                                                    width: 65.0,
                                                                    height:
                                                                        65.0,
                                                                    fit: BoxFit
                                                                        .cover,
                                                                  ),
                                                                ),
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
                                                                          0.0,
                                                                          5.0,
                                                                          0.0,
                                                                          0.0),
                                                              child: Container(
                                                                width: 80.0,
                                                                decoration:
                                                                    const BoxDecoration(
                                                                  color: Colors
                                                                      .transparent,
                                                                ),
                                                                child: Align(
                                                                  alignment:
                                                                      const AlignmentDirectional(
                                                                          -1.0,
                                                                          0.0),
                                                                  child:
                                                                      AutoSizeText(
                                                                    getJsonField(
                                                                      takeItem,
                                                                      r'''$.displayName''',
                                                                    ).toString(),
                                                                    textAlign:
                                                                        TextAlign
                                                                            .center,
                                                                    maxLines: 2,
                                                                    minFontSize:
                                                                        10.0,
                                                                    style: FlutterFlowTheme.of(
                                                                            context)
                                                                        .bodyMedium
                                                                        .override(
                                                                          fontFamily:
                                                                              'Montserrat',
                                                                          color:
                                                                              FlutterFlowTheme.of(context).primaryText,
                                                                          fontSize:
                                                                              12.0,
                                                                          letterSpacing:
                                                                              0.0,
                                                                        ),
                                                                  ),
                                                                ),
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
                                                                          15.0,
                                                                          5.0,
                                                                          0.0,
                                                                          0.0),
                                                              child: Container(
                                                                width: 40.0,
                                                                height: 30.0,
                                                                decoration:
                                                                    const BoxDecoration(
                                                                  color: Colors
                                                                      .transparent,
                                                                ),
                                                                alignment:
                                                                    const AlignmentDirectional(
                                                                        0.0,
                                                                        0.0),
                                                                child: Align(
                                                                  alignment:
                                                                      const AlignmentDirectional(
                                                                          0.0,
                                                                          0.0),
                                                                  child:
                                                                      Builder(
                                                                    builder:
                                                                        (context) =>
                                                                            FFButtonWidget(
                                                                      onPressed:
                                                                          () async {
                                                                        FFAppState().UserOnListAbout =
                                                                            getJsonField(
                                                                          takeItem,
                                                                          r'''$.aboutMe''',
                                                                        ).toString();
                                                                        safeSetState(
                                                                            () {});
                                                                        FFAppState().userOnListName =
                                                                            getJsonField(
                                                                          takeItem,
                                                                          r'''$.displayName''',
                                                                        ).toString();
                                                                        safeSetState(
                                                                            () {});
                                                                        FFAppState().mainUserName =
                                                                            currentUserDisplayName;
                                                                        safeSetState(
                                                                            () {});
                                                                        FFAppState().AIMatchComponentShowClickedUserPhotoUrl =
                                                                            getJsonField(
                                                                          takeItem,
                                                                          r'''$.photoUrl''',
                                                                        ).toString();
                                                                        safeSetState(
                                                                            () {});
                                                                        _model.mainUserGiveLis =
                                                                            await queryExchangesRecordOnce(
                                                                          parent:
                                                                              currentUserReference,
                                                                          queryBuilder: (exchangesRecord) =>
                                                                              exchangesRecord.where(
                                                                            'exchange_type',
                                                                            isEqualTo:
                                                                                'give',
                                                                          ),
                                                                          singleRecord:
                                                                              true,
                                                                        ).then((s) =>
                                                                                s.firstOrNull);
                                                                        _model.mainUseTakeLis =
                                                                            await queryExchangesRecordOnce(
                                                                          parent:
                                                                              currentUserReference,
                                                                          queryBuilder: (exchangesRecord) =>
                                                                              exchangesRecord.where(
                                                                            'exchange_type',
                                                                            isEqualTo:
                                                                                'take',
                                                                          ),
                                                                          singleRecord:
                                                                              true,
                                                                        ).then((s) =>
                                                                                s.firstOrNull);
                                                                        FFAppState().MainUserGiveList = _model
                                                                            .mainUserGiveLis!
                                                                            .values
                                                                            .map((e) =>
                                                                                valueOrDefault<String>(
                                                                                  e.improvedRepresentation,
                                                                                  'bla it does not work',
                                                                                ))
                                                                            .toList()
                                                                            .cast<String>();
                                                                        safeSetState(
                                                                            () {});
                                                                        FFAppState().MainUserTakeList = _model
                                                                            .mainUseTakeLis!
                                                                            .values
                                                                            .map((e) =>
                                                                                valueOrDefault<String>(
                                                                                  e.improvedRepresentation,
                                                                                  'ddc',
                                                                                ))
                                                                            .toList()
                                                                            .cast<String>();
                                                                        safeSetState(
                                                                            () {});
                                                                        FFAppState().MainUserGiveAndTakes =
                                                                            valueOrDefault<String>(
                                                                          functions.fromListOfStringsToOneString(FFAppState()
                                                                              .MainUserGiveList
                                                                              .toList()),
                                                                          'errorrr=))',
                                                                        );
                                                                        safeSetState(
                                                                            () {});
                                                                        FFAppState().MainUserTakes =
                                                                            valueOrDefault<String>(
                                                                          functions.fromListOfStringsToOneString(FFAppState()
                                                                              .MainUserTakeList
                                                                              .toList()),
                                                                          'I am default variable value, so...',
                                                                        );
                                                                        safeSetState(
                                                                            () {});
                                                                        FFAppState()
                                                                            .UserOnListGiveList = (getJsonField(
                                                                          takeItem,
                                                                          r'''$.gives[0][*].string_representation''',
                                                                          true,
                                                                        ) as List)
                                                                            .map<String>((s) => s.toString())
                                                                            .toList()
                                                                            .toList()
                                                                            .cast<String>();
                                                                        safeSetState(
                                                                            () {});
                                                                        FFAppState()
                                                                            .UserOnListTakeList = (getJsonField(
                                                                          takeItem,
                                                                          r'''$.takes[0][*].string_representation''',
                                                                          true,
                                                                        ) as List)
                                                                            .map<String>((s) => s.toString())
                                                                            .toList()
                                                                            .toList()
                                                                            .cast<String>();
                                                                        safeSetState(
                                                                            () {});
                                                                        FFAppState().UserOnListGive =
                                                                            valueOrDefault<String>(
                                                                          functions.fromListOfStringsToOneString(FFAppState()
                                                                              .UserOnListGiveList
                                                                              .toList()),
                                                                          'бляяя',
                                                                        );
                                                                        safeSetState(
                                                                            () {});
                                                                        FFAppState().UserOnListTake =
                                                                            valueOrDefault<String>(
                                                                          functions.fromListOfStringsToOneString(FFAppState()
                                                                              .UserOnListTakeList
                                                                              .toList()),
                                                                          'bla',
                                                                        );
                                                                        safeSetState(
                                                                            () {});
                                                                        _model.aiBetaResponse2 =
                                                                            await AiMatchBetaOriginalCall.call(
                                                                          user1About:
                                                                              FFAppState().MainUserAbout,
                                                                          user2About:
                                                                              FFAppState().UserOnListAbout,
                                                                          user1Give:
                                                                              FFAppState().MainUserGiveAndTakes,
                                                                          user1Take:
                                                                              FFAppState().MainUserTakes,
                                                                          user2Give:
                                                                              FFAppState().UserOnListGive,
                                                                          user2Take:
                                                                              FFAppState().UserOnListTake,
                                                                          user1Name:
                                                                              currentUserDisplayName,
                                                                          user2Name:
                                                                              FFAppState().userOnListName,
                                                                        );

                                                                        if ((_model.aiBetaResponse2?.succeeded ??
                                                                            true)) {
                                                                          FFAppState().AiBetaAnswer =
                                                                              getJsonField(
                                                                            (_model.aiBetaResponse2?.jsonBody ??
                                                                                ''),
                                                                            r'''$.choices[:].message.content''',
                                                                          ).toString();
                                                                          safeSetState(
                                                                              () {});
                                                                        } else {
                                                                          await showDialog(
                                                                            context:
                                                                                context,
                                                                            builder:
                                                                                (alertDialogContext) {
                                                                              return AlertDialog(
                                                                                title: const Text('Гггггг'),
                                                                                actions: [
                                                                                  TextButton(
                                                                                    onPressed: () => Navigator.pop(alertDialogContext),
                                                                                    child: const Text('Ok'),
                                                                                  ),
                                                                                ],
                                                                              );
                                                                            },
                                                                          );
                                                                        }

                                                                        await showAlignedDialog(
                                                                          context:
                                                                              context,
                                                                          isGlobal:
                                                                              false,
                                                                          avoidOverflow:
                                                                              true,
                                                                          targetAnchor:
                                                                              const AlignmentDirectional(0.0, -1.0).resolve(Directionality.of(context)),
                                                                          followerAnchor:
                                                                              const AlignmentDirectional(0.0, 0.0).resolve(Directionality.of(context)),
                                                                          builder:
                                                                              (dialogContext) {
                                                                            return const Material(
                                                                              color: Colors.transparent,
                                                                              child: NewDesignPotencialBenefitsGmapTableWidget(),
                                                                            );
                                                                          },
                                                                        );

                                                                        safeSetState(
                                                                            () {});
                                                                      },
                                                                      text: FFLocalizations.of(
                                                                              context)
                                                                          .getText(
                                                                        '4klml6j7' /*  */,
                                                                      ),
                                                                      icon:
                                                                          Icon(
                                                                        Icons
                                                                            .handshake_outlined,
                                                                        color: FlutterFlowTheme.of(context)
                                                                            .primary,
                                                                        size:
                                                                            20.0,
                                                                      ),
                                                                      options:
                                                                          FFButtonOptions(
                                                                        width:
                                                                            60.0,
                                                                        height:
                                                                            20.0,
                                                                        padding: const EdgeInsetsDirectional.fromSTEB(
                                                                            0.0,
                                                                            0.0,
                                                                            0.0,
                                                                            0.0),
                                                                        iconPadding: const EdgeInsetsDirectional.fromSTEB(
                                                                            7.0,
                                                                            0.0,
                                                                            0.0,
                                                                            0.0),
                                                                        color: FlutterFlowTheme.of(context)
                                                                            .primaryBackground,
                                                                        textStyle: FlutterFlowTheme.of(context)
                                                                            .titleSmall
                                                                            .override(
                                                                              fontFamily: 'Montserrat',
                                                                              color: Colors.white,
                                                                              letterSpacing: 0.0,
                                                                            ),
                                                                        elevation:
                                                                            0.0,
                                                                        borderRadius:
                                                                            const BorderRadius.only(
                                                                          bottomLeft:
                                                                              Radius.circular(0.0),
                                                                          bottomRight:
                                                                              Radius.circular(16.0),
                                                                          topLeft:
                                                                              Radius.circular(16.0),
                                                                          topRight:
                                                                              Radius.circular(0.0),
                                                                        ),
                                                                        hoverColor:
                                                                            FlutterFlowTheme.of(context).secondaryBackground,
                                                                        hoverTextColor:
                                                                            FlutterFlowTheme.of(context).primaryText,
                                                                      ),
                                                                    ),
                                                                  ),
                                                                ),
                                                              ),
                                                            ),
                                                          ),
                                                        ],
                                                      ),
                                                    ),
                                                    Expanded(
                                                      child: Align(
                                                        alignment:
                                                            const AlignmentDirectional(
                                                                -1.0, 0.0),
                                                        child: Padding(
                                                          padding:
                                                              const EdgeInsetsDirectional
                                                                  .fromSTEB(
                                                                      8.0,
                                                                      10.0,
                                                                      0.0,
                                                                      0.0),
                                                          child: Builder(
                                                            builder: (context) {
                                                              final take2 =
                                                                  getJsonField(
                                                                takeItem,
                                                                r'''$..gives[*]''',
                                                              ).toList();

                                                              return SingleChildScrollView(
                                                                child: Column(
                                                                  mainAxisSize:
                                                                      MainAxisSize
                                                                          .min,
                                                                  mainAxisAlignment:
                                                                      MainAxisAlignment
                                                                          .center,
                                                                  crossAxisAlignment:
                                                                      CrossAxisAlignment
                                                                          .start,
                                                                  children: List
                                                                      .generate(
                                                                          take2
                                                                              .length,
                                                                          (take2Index) {
                                                                    final take2Item =
                                                                        take2[
                                                                            take2Index];
                                                                    return Align(
                                                                      alignment:
                                                                          const AlignmentDirectional(
                                                                              0.0,
                                                                              0.0),
                                                                      child:
                                                                          Padding(
                                                                        padding: const EdgeInsetsDirectional.fromSTEB(
                                                                            0.0,
                                                                            5.0,
                                                                            0.0,
                                                                            5.0),
                                                                        child:
                                                                            Row(
                                                                          mainAxisSize:
                                                                              MainAxisSize.max,
                                                                          mainAxisAlignment:
                                                                              MainAxisAlignment.center,
                                                                          crossAxisAlignment:
                                                                              CrossAxisAlignment.center,
                                                                          children: [
                                                                            Align(
                                                                              alignment: const AlignmentDirectional(-1.0, 0.0),
                                                                              child: Container(
                                                                                width: 220.0,
                                                                                height: 100.0,
                                                                                decoration: BoxDecoration(
                                                                                  color: Colors.transparent,
                                                                                  borderRadius: BorderRadius.circular(16.0),
                                                                                  border: Border.all(
                                                                                    color: FlutterFlowTheme.of(context).primaryBackground,
                                                                                  ),
                                                                                ),
                                                                                alignment: const AlignmentDirectional(0.0, 0.0),
                                                                                child: Align(
                                                                                  alignment: const AlignmentDirectional(0.0, -1.0),
                                                                                  child: Padding(
                                                                                    padding: const EdgeInsetsDirectional.fromSTEB(9.0, 4.0, 9.0, 4.0),
                                                                                    child: Text(
                                                                                      getJsonField(
                                                                                        take2Item,
                                                                                        r'''$..improved_representation''',
                                                                                      ).toString().maybeHandleOverflow(
                                                                                            maxChars: 190,
                                                                                            replacement: '…',
                                                                                          ),
                                                                                      textAlign: TextAlign.center,
                                                                                      style: FlutterFlowTheme.of(context).labelSmall.override(
                                                                                            fontFamily: 'Montserrat',
                                                                                            color: FlutterFlowTheme.of(context).primary,
                                                                                            fontSize: 11.0,
                                                                                            letterSpacing: 0.0,
                                                                                          ),
                                                                                    ),
                                                                                  ),
                                                                                ),
                                                                              ),
                                                                            ),
                                                                          ],
                                                                        ),
                                                                      ),
                                                                    );
                                                                  }),
                                                                ),
                                                              );
                                                            },
                                                          ),
                                                        ),
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            );
                          },
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}
