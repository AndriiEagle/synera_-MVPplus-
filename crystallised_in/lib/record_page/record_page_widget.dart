import '/auth/firebase_auth/auth_util.dart';
import '/backend/api_requests/api_calls.dart';
import '/backend/backend.dart';
import '/components/navigation/bootom_navigation_component/bootom_navigation_component_widget.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/custom_code/actions/index.dart' as actions;
import '/flutter_flow/permissions_util.dart';
import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:lottie/lottie.dart';
import 'package:provider/provider.dart';
import 'package:record/record.dart';
import 'record_page_model.dart';
export 'record_page_model.dart';

class RecordPageWidget extends StatefulWidget {
  const RecordPageWidget({super.key});

  @override
  State<RecordPageWidget> createState() => _RecordPageWidgetState();
}

class _RecordPageWidgetState extends State<RecordPageWidget> {
  late RecordPageModel _model;

  final scaffoldKey = GlobalKey<ScaffoldState>();

  @override
  void initState() {
    super.initState();
    _model = createModel(context, () => RecordPageModel());

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

    return GestureDetector(
      onTap: () => FocusScope.of(context).unfocus(),
      child: Scaffold(
        key: scaffoldKey,
        backgroundColor: FlutterFlowTheme.of(context).primaryBackground,
        body: SafeArea(
          top: true,
          child: Stack(
            children: [
              Align(
                alignment: const AlignmentDirectional(0.0, 1.0),
                child: wrapWithModel(
                  model: _model.bootomNavigationComponentModel,
                  updateCallback: () => safeSetState(() {}),
                  child: const BootomNavigationComponentWidget(
                    selectedPageIndex: 4,
                    hidden: false,
                  ),
                ),
              ),
              Column(
                mainAxisSize: MainAxisSize.max,
                children: [
                  Container(
                    width: MediaQuery.sizeOf(context).width * 1.0,
                    height: 60.0,
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
                    child: Column(
                      mainAxisSize: MainAxisSize.max,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Padding(
                          padding: const EdgeInsetsDirectional.fromSTEB(
                              10.0, 0.0, 10.0, 0.0),
                          child: Row(
                            mainAxisSize: MainAxisSize.max,
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              InkWell(
                                splashColor: Colors.transparent,
                                focusColor: Colors.transparent,
                                hoverColor: Colors.transparent,
                                highlightColor: Colors.transparent,
                                onTap: () async {
                                  context.safePop();
                                },
                                child: const Icon(
                                  Icons.arrow_back,
                                  color: Colors.white,
                                  size: 24.0,
                                ),
                              ),
                              Text(
                                FFLocalizations.of(context).getText(
                                  's9j308tv' /* Record */,
                                ),
                                style: FlutterFlowTheme.of(context)
                                    .bodyMedium
                                    .override(
                                      fontFamily: 'Montserrat',
                                      color: Colors.white,
                                      fontSize: 22.0,
                                      letterSpacing: 0.0,
                                      fontWeight: FontWeight.w600,
                                    ),
                              ),
                              Container(
                                decoration: BoxDecoration(
                                  color: const Color(0xFF393E48),
                                  borderRadius: BorderRadius.circular(12.0),
                                ),
                                child: InkWell(
                                  splashColor: Colors.transparent,
                                  focusColor: Colors.transparent,
                                  hoverColor: Colors.transparent,
                                  highlightColor: Colors.transparent,
                                  onTap: () async {
                                    context.pushNamed('RecordPage');
                                  },
                                  child: const Icon(
                                    FFIcons.k9cio6ok4jbum0wp9cyp,
                                    color: Color(0xFFE7BD87),
                                    size: 36.0,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  Padding(
                    padding:
                        const EdgeInsetsDirectional.fromSTEB(0.0, 20.0, 0.0, 20.0),
                    child: Container(
                      width: MediaQuery.sizeOf(context).width * 0.9,
                      height: 44.0,
                      decoration: BoxDecoration(
                        color: const Color(0xFF393E48),
                        borderRadius: BorderRadius.circular(16.0),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.max,
                        children: [
                          InkWell(
                            splashColor: Colors.transparent,
                            focusColor: Colors.transparent,
                            hoverColor: Colors.transparent,
                            highlightColor: Colors.transparent,
                            onTap: () async {
                              _model.container1color =
                                  FlutterFlowTheme.of(context).primary;
                              _model.text1 = Colors.black;
                              _model.contaner3Color = const Color(0xFF393E48);
                              _model.container2Color = const Color(0xFF393E48);
                              _model.text3 = const Color(0xFF919191);
                              _model.text2 = const Color(0xFF919191);
                              safeSetState(() {});
                              await _model.pageViewController?.animateToPage(
                                0,
                                duration: const Duration(milliseconds: 500),
                                curve: Curves.ease,
                              );
                            },
                            child: Container(
                              width: MediaQuery.sizeOf(context).width * 0.3,
                              height: 44.0,
                              decoration: BoxDecoration(
                                color: _model.container1color,
                                borderRadius: BorderRadius.circular(16.0),
                              ),
                              child: Column(
                                mainAxisSize: MainAxisSize.max,
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Row(
                                    mainAxisSize: MainAxisSize.max,
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Padding(
                                        padding: const EdgeInsetsDirectional.fromSTEB(
                                            0.0, 0.0, 5.0, 0.0),
                                        child: Icon(
                                          Icons.star_outline,
                                          color: _model.text1,
                                          size: 24.0,
                                        ),
                                      ),
                                      Text(
                                        FFLocalizations.of(context).getText(
                                          'xvddjbff' /* Values */,
                                        ),
                                        style: FlutterFlowTheme.of(context)
                                            .bodyMedium
                                            .override(
                                              fontFamily: 'Montserrat',
                                              color: _model.text1,
                                              fontSize: 15.0,
                                              letterSpacing: 0.0,
                                              fontWeight: FontWeight.w600,
                                            ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ),
                          InkWell(
                            splashColor: Colors.transparent,
                            focusColor: Colors.transparent,
                            hoverColor: Colors.transparent,
                            highlightColor: Colors.transparent,
                            onTap: () async {
                              _model.container1color = const Color(0xFF393E48);
                              _model.text1 = const Color(0xFF919191);
                              _model.contaner3Color = const Color(0xFF393E48);
                              _model.container2Color =
                                  FlutterFlowTheme.of(context).primary;
                              _model.text3 = const Color(0xFF919191);
                              _model.text2 = Colors.black;
                              safeSetState(() {});
                              await _model.pageViewController?.animateToPage(
                                1,
                                duration: const Duration(milliseconds: 500),
                                curve: Curves.ease,
                              );
                            },
                            child: Container(
                              width: MediaQuery.sizeOf(context).width * 0.3,
                              height: 44.0,
                              decoration: BoxDecoration(
                                color: _model.container2Color,
                                borderRadius: BorderRadius.circular(16.0),
                              ),
                              child: Column(
                                mainAxisSize: MainAxisSize.max,
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Row(
                                    mainAxisSize: MainAxisSize.max,
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Padding(
                                        padding: const EdgeInsetsDirectional.fromSTEB(
                                            0.0, 0.0, 5.0, 0.0),
                                        child: Icon(
                                          Icons.menu_book,
                                          color: _model.text2,
                                          size: 24.0,
                                        ),
                                      ),
                                      Text(
                                        FFLocalizations.of(context).getText(
                                          'gawloz0g' /* Notes */,
                                        ),
                                        style: FlutterFlowTheme.of(context)
                                            .bodyMedium
                                            .override(
                                              fontFamily: 'Montserrat',
                                              color: _model.text2,
                                              fontSize: 15.0,
                                              letterSpacing: 0.0,
                                              fontWeight: FontWeight.w600,
                                            ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ),
                          InkWell(
                            splashColor: Colors.transparent,
                            focusColor: Colors.transparent,
                            hoverColor: Colors.transparent,
                            highlightColor: Colors.transparent,
                            onTap: () async {
                              _model.container1color = const Color(0xFF393E48);
                              _model.text1 = const Color(0xFF919191);
                              _model.contaner3Color =
                                  FlutterFlowTheme.of(context).primary;
                              _model.container2Color = const Color(0xFF393E48);
                              _model.text3 = Colors.black;
                              _model.text2 = const Color(0xFF919191);
                              safeSetState(() {});
                              await _model.pageViewController?.animateToPage(
                                2,
                                duration: const Duration(milliseconds: 500),
                                curve: Curves.ease,
                              );
                            },
                            child: Container(
                              width: MediaQuery.sizeOf(context).width * 0.3,
                              height: 44.0,
                              decoration: BoxDecoration(
                                color: _model.contaner3Color,
                                borderRadius: BorderRadius.circular(16.0),
                              ),
                              child: Column(
                                mainAxisSize: MainAxisSize.max,
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Row(
                                    mainAxisSize: MainAxisSize.max,
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Padding(
                                        padding: const EdgeInsetsDirectional.fromSTEB(
                                            0.0, 0.0, 5.0, 0.0),
                                        child: Icon(
                                          FFIcons.km3yhvtemroim16y704a,
                                          color: _model.text3,
                                          size: 23.0,
                                        ),
                                      ),
                                      Text(
                                        FFLocalizations.of(context).getText(
                                          '3ts24nes' /* GPT */,
                                        ),
                                        style: FlutterFlowTheme.of(context)
                                            .bodyMedium
                                            .override(
                                              fontFamily: 'Montserrat',
                                              color: _model.text3,
                                              fontSize: 15.0,
                                              letterSpacing: 0.0,
                                              fontWeight: FontWeight.w600,
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
                  ),
                  Expanded(
                    child: SizedBox(
                      width: double.infinity,
                      height: 500.0,
                      child: Padding(
                        padding:
                            const EdgeInsetsDirectional.fromSTEB(0.0, 0.0, 0.0, 40.0),
                        child: PageView(
                          physics: const NeverScrollableScrollPhysics(),
                          controller: _model.pageViewController ??=
                              PageController(initialPage: 0),
                          scrollDirection: Axis.horizontal,
                          children: [
                            Column(
                              mainAxisSize: MainAxisSize.max,
                              children: [
                                Padding(
                                  padding: const EdgeInsetsDirectional.fromSTEB(
                                      20.0, 0.0, 20.0, 0.0),
                                  child: Text(
                                    FFLocalizations.of(context).getText(
                                      'x76hp2ct' /* Click on microphone record you... */,
                                    ),
                                    textAlign: TextAlign.center,
                                    style: FlutterFlowTheme.of(context)
                                        .bodyMedium
                                        .override(
                                          fontFamily: 'Montserrat',
                                          fontSize: 17.0,
                                          letterSpacing: 0.0,
                                        ),
                                  ),
                                ),
                                Align(
                                  alignment: const AlignmentDirectional(0.0, -1.0),
                                  child: Padding(
                                    padding: const EdgeInsetsDirectional.fromSTEB(
                                        0.0, 10.0, 0.0, 0.0),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.max,
                                      mainAxisAlignment:
                                          MainAxisAlignment.center,
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Align(
                                          alignment:
                                              const AlignmentDirectional(0.0, 0.0),
                                          child: Stack(
                                            alignment:
                                                const AlignmentDirectional(0.0, 0.0),
                                            children: [
                                              if (FFAppState().record2)
                                                InkWell(
                                                  splashColor:
                                                      Colors.transparent,
                                                  focusColor:
                                                      Colors.transparent,
                                                  hoverColor:
                                                      Colors.transparent,
                                                  highlightColor:
                                                      Colors.transparent,
                                                  onTap: () async {
                                                    await requestPermission(
                                                        microphonePermission);
                                                    if (await getPermissionStatus(
                                                        microphonePermission)) {
                                                      await startAudioRecording(
                                                        context,
                                                        audioRecorder: _model
                                                                .audioRecorder1 ??=
                                                            AudioRecorder(),
                                                      );
                                                    } else {
                                                      ScaffoldMessenger.of(
                                                              context)
                                                          .showSnackBar(
                                                        SnackBar(
                                                          content: Text(
                                                            'Microphone  permission denied!',
                                                            style: TextStyle(
                                                              color: FlutterFlowTheme
                                                                      .of(context)
                                                                  .primaryText,
                                                            ),
                                                          ),
                                                          duration: const Duration(
                                                              milliseconds:
                                                                  4000),
                                                          backgroundColor:
                                                              FlutterFlowTheme.of(
                                                                      context)
                                                                  .secondary,
                                                        ),
                                                      );
                                                    }

                                                    FFAppState().record2 =
                                                        !(FFAppState()
                                                                .record2 ??
                                                            true);
                                                    FFAppState().update(() {});
                                                  },
                                                  child: FaIcon(
                                                    FontAwesomeIcons
                                                        .microphoneAlt,
                                                    color: FlutterFlowTheme.of(
                                                            context)
                                                        .primary,
                                                    size: 100.0,
                                                  ),
                                                ),
                                              if (!FFAppState().record2)
                                                Padding(
                                                  padding: const EdgeInsetsDirectional
                                                      .fromSTEB(
                                                          0.0, 0.0, 0.0, 50.0),
                                                  child: Lottie.network(
                                                    'https://lottie.host/61d2f00a-f544-4ffe-baae-defbad7d7818/iZs8YSuRjT.json',
                                                    width: 200.0,
                                                    height: 200.0,
                                                    fit: BoxFit.contain,
                                                    animate: true,
                                                  ),
                                                ),
                                              if (!FFAppState().record2)
                                                Padding(
                                                  padding: const EdgeInsetsDirectional
                                                      .fromSTEB(
                                                          0.0, 300.0, 0.0, 0.0),
                                                  child: InkWell(
                                                    splashColor:
                                                        Colors.transparent,
                                                    focusColor:
                                                        Colors.transparent,
                                                    hoverColor:
                                                        Colors.transparent,
                                                    highlightColor:
                                                        Colors.transparent,
                                                    onTap: () async {
                                                      FFAppState().record2 =
                                                          !(FFAppState()
                                                                  .record2 ??
                                                              true);
                                                      FFAppState()
                                                          .update(() {});
                                                      await stopAudioRecording(
                                                        audioRecorder: _model
                                                            .audioRecorder1,
                                                        audioName:
                                                            'recordedFileBytes1.mp3',
                                                        onRecordingComplete:
                                                            (audioFilePath,
                                                                audioBytes) {
                                                          _model.recordedAudio =
                                                              audioFilePath;
                                                          _model.recordedFileBytes1 =
                                                              audioBytes;
                                                        },
                                                      );

                                                      _model.mp3 = await actions
                                                          .bytesFromAudioPath(
                                                        _model.recordedAudio,
                                                      );
                                                      await Future.delayed(
                                                          const Duration(
                                                              milliseconds:
                                                                  300));
                                                      _model.transcriptWhisperAPI =
                                                          await SpeeechToTextCall
                                                              .call(
                                                        audioFile: _model.mp3,
                                                      );

                                                      if ((_model
                                                              .transcriptWhisperAPI
                                                              ?.succeeded ??
                                                          true)) {
                                                        FFAppState()
                                                                .transcriptWhisper =
                                                            getJsonField(
                                                          (_model.transcriptWhisperAPI
                                                                  ?.jsonBody ??
                                                              ''),
                                                          r'''$.text''',
                                                        ).toString();
                                                        safeSetState(() {});
                                                      } else {
                                                        ScaffoldMessenger.of(
                                                                context)
                                                            .showSnackBar(
                                                          SnackBar(
                                                            content: Text(
                                                              'API call failed!',
                                                              style: TextStyle(
                                                                color: FlutterFlowTheme.of(
                                                                        context)
                                                                    .primaryText,
                                                              ),
                                                            ),
                                                            duration: const Duration(
                                                                milliseconds:
                                                                    4000),
                                                            backgroundColor:
                                                                FlutterFlowTheme.of(
                                                                        context)
                                                                    .secondary,
                                                          ),
                                                        );
                                                      }

                                                      _model.apiJson =
                                                          await TextToTextJsonProfileCall
                                                              .call(
                                                        userRecordingTranscript:
                                                            FFAppState()
                                                                .transcriptWhisper,
                                                      );

                                                      if ((_model
                                                              .transcriptWhisperAPI
                                                              ?.succeeded ??
                                                          true)) {
                                                        FFAppState()
                                                                .giveAndTakeValuesAPI =
                                                            getJsonField(
                                                          (_model.apiJson
                                                                  ?.jsonBody ??
                                                              ''),
                                                          r'''$.choices[:].message.content''',
                                                        ).toString();
                                                        safeSetState(() {});
                                                      } else {
                                                        ScaffoldMessenger.of(
                                                                context)
                                                            .showSnackBar(
                                                          SnackBar(
                                                            content: Text(
                                                              'API call faild!',
                                                              style: TextStyle(
                                                                color: FlutterFlowTheme.of(
                                                                        context)
                                                                    .primaryText,
                                                              ),
                                                            ),
                                                            duration: const Duration(
                                                                milliseconds:
                                                                    4000),
                                                            backgroundColor:
                                                                FlutterFlowTheme.of(
                                                                        context)
                                                                    .secondary,
                                                          ),
                                                        );
                                                      }

                                                      await Future.delayed(
                                                          const Duration(
                                                              milliseconds:
                                                                  300));
                                                      _model.giveValues =
                                                          await actions
                                                              .extractGiveValues(
                                                        FFAppState()
                                                            .giveAndTakeValuesAPI,
                                                      );
                                                      FFAppState().giveValues =
                                                          _model.giveValues!
                                                              .toList()
                                                              .cast<
                                                                  ValuesStruct>();
                                                      safeSetState(() {});
                                                      _model.takeValues =
                                                          await actions
                                                              .extractTakeValues(
                                                        FFAppState()
                                                            .giveAndTakeValuesAPI,
                                                      );
                                                      FFAppState().takeValues =
                                                          _model.takeValues!
                                                              .toList()
                                                              .cast<
                                                                  ValuesStruct>();
                                                      safeSetState(() {});

                                                      await ExchangesRecord
                                                              .createDoc(
                                                                  currentUserReference!)
                                                          .set({
                                                        ...createExchangesRecordData(
                                                          exchangeType: 'give',
                                                        ),
                                                        ...mapToFirestore(
                                                          {
                                                            'created_at': FieldValue
                                                                .serverTimestamp(),
                                                            'values':
                                                                getValuesListFirestoreData(
                                                              FFAppState()
                                                                  .giveValues,
                                                            ),
                                                          },
                                                        ),
                                                      });

                                                      await ExchangesRecord
                                                              .createDoc(
                                                                  currentUserReference!)
                                                          .set({
                                                        ...createExchangesRecordData(
                                                          exchangeType: 'take',
                                                        ),
                                                        ...mapToFirestore(
                                                          {
                                                            'created_at': FieldValue
                                                                .serverTimestamp(),
                                                            'values':
                                                                getValuesListFirestoreData(
                                                              FFAppState()
                                                                  .takeValues,
                                                            ),
                                                          },
                                                        ),
                                                      });

                                                      safeSetState(() {});
                                                    },
                                                    child: FaIcon(
                                                      FontAwesomeIcons
                                                          .microphoneAltSlash,
                                                      color:
                                                          FlutterFlowTheme.of(
                                                                  context)
                                                              .primary,
                                                      size: 100.0,
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
                              ],
                            ),
                            Column(
                              mainAxisSize: MainAxisSize.max,
                              children: [
                                Padding(
                                  padding: const EdgeInsetsDirectional.fromSTEB(
                                      20.0, 0.0, 20.0, 0.0),
                                  child: Text(
                                    FFLocalizations.of(context).getText(
                                      'jv3zrvu9' /* Click on microphone record you... */,
                                    ),
                                    textAlign: TextAlign.center,
                                    style: FlutterFlowTheme.of(context)
                                        .bodyMedium
                                        .override(
                                          fontFamily: 'Montserrat',
                                          fontSize: 17.0,
                                          letterSpacing: 0.0,
                                        ),
                                  ),
                                ),
                                Align(
                                  alignment: const AlignmentDirectional(0.0, -1.0),
                                  child: Padding(
                                    padding: const EdgeInsetsDirectional.fromSTEB(
                                        0.0, 10.0, 0.0, 0.0),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.max,
                                      mainAxisAlignment:
                                          MainAxisAlignment.center,
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Align(
                                          alignment:
                                              const AlignmentDirectional(0.0, 0.0),
                                          child: Stack(
                                            alignment:
                                                const AlignmentDirectional(0.0, 0.0),
                                            children: [
                                              if (!_model.record)
                                                InkWell(
                                                  splashColor:
                                                      Colors.transparent,
                                                  focusColor:
                                                      Colors.transparent,
                                                  hoverColor:
                                                      Colors.transparent,
                                                  highlightColor:
                                                      Colors.transparent,
                                                  onTap: () async {
                                                    await requestPermission(
                                                        microphonePermission);
                                                    if (await getPermissionStatus(
                                                        microphonePermission)) {
                                                      await startAudioRecording(
                                                        context,
                                                        audioRecorder: _model
                                                                .audioRecorder2 ??=
                                                            AudioRecorder(),
                                                      );
                                                    } else {
                                                      ScaffoldMessenger.of(
                                                              context)
                                                          .showSnackBar(
                                                        SnackBar(
                                                          content: Text(
                                                            'Microphone  permission denied!',
                                                            style: TextStyle(
                                                              color: FlutterFlowTheme
                                                                      .of(context)
                                                                  .primaryText,
                                                            ),
                                                          ),
                                                          duration: const Duration(
                                                              milliseconds:
                                                                  4000),
                                                          backgroundColor:
                                                              FlutterFlowTheme.of(
                                                                      context)
                                                                  .secondary,
                                                        ),
                                                      );
                                                    }

                                                    _model.record = true;
                                                    _model.updatePage(() {});
                                                  },
                                                  child: FaIcon(
                                                    FontAwesomeIcons
                                                        .microphoneAlt,
                                                    color: FlutterFlowTheme.of(
                                                            context)
                                                        .primary,
                                                    size: 100.0,
                                                  ),
                                                ),
                                              if (_model.record)
                                                Lottie.network(
                                                  'https://lottie.host/61d2f00a-f544-4ffe-baae-defbad7d7818/iZs8YSuRjT.json',
                                                  width: 200.0,
                                                  height: 200.0,
                                                  fit: BoxFit.contain,
                                                  animate: true,
                                                ),
                                              if (_model.record)
                                                Padding(
                                                  padding: const EdgeInsetsDirectional
                                                      .fromSTEB(
                                                          0.0, 300.0, 0.0, 0.0),
                                                  child: InkWell(
                                                    splashColor:
                                                        Colors.transparent,
                                                    focusColor:
                                                        Colors.transparent,
                                                    hoverColor:
                                                        Colors.transparent,
                                                    highlightColor:
                                                        Colors.transparent,
                                                    onTap: () async {
                                                      _model.record = false;
                                                      safeSetState(() {});
                                                      await stopAudioRecording(
                                                        audioRecorder: _model
                                                            .audioRecorder2,
                                                        audioName:
                                                            'recordedFileBytes2.mp3',
                                                        onRecordingComplete:
                                                            (audioFilePath,
                                                                audioBytes) {
                                                          _model.recordedAudioSecond =
                                                              audioFilePath;
                                                          _model.recordedFileBytes2 =
                                                              audioBytes;
                                                        },
                                                      );

                                                      _model.mp3Copy =
                                                          await actions
                                                              .bytesFromAudioPath(
                                                        _model
                                                            .recordedAudioSecond,
                                                      );
                                                      await Future.delayed(
                                                          const Duration(
                                                              milliseconds:
                                                                  300));
                                                      _model.transcriptWhisperAPICopy =
                                                          await SpeeechToTextCall
                                                              .call(
                                                        audioFile:
                                                            _model.mp3Copy,
                                                      );

                                                      if ((_model
                                                              .transcriptWhisperAPI
                                                              ?.succeeded ??
                                                          true)) {
                                                        FFAppState()
                                                                .transcriptWhisper =
                                                            getJsonField(
                                                          (_model.transcriptWhisperAPICopy
                                                                  ?.jsonBody ??
                                                              ''),
                                                          r'''$.text''',
                                                        ).toString();
                                                        safeSetState(() {});
                                                      } else {
                                                        ScaffoldMessenger.of(
                                                                context)
                                                            .showSnackBar(
                                                          SnackBar(
                                                            content: Text(
                                                              'API call failed!',
                                                              style: TextStyle(
                                                                color: FlutterFlowTheme.of(
                                                                        context)
                                                                    .primaryText,
                                                              ),
                                                            ),
                                                            duration: const Duration(
                                                                milliseconds:
                                                                    4000),
                                                            backgroundColor:
                                                                FlutterFlowTheme.of(
                                                                        context)
                                                                    .secondary,
                                                          ),
                                                        );
                                                      }

                                                      _model.listOfNotesJson =
                                                          await DiaryNoteGeneratorJsonCall
                                                              .call(
                                                        context: FFAppState()
                                                            .transcriptWhisper,
                                                      );

                                                      if ((_model
                                                              .listOfNotesJson
                                                              ?.succeeded ??
                                                          true)) {
                                                        FFAppState().jsonDiary =
                                                            getJsonField(
                                                          (_model.listOfNotesJson
                                                                  ?.jsonBody ??
                                                              ''),
                                                          r'''$.choices[:].message.content''',
                                                        ).toString();
                                                        safeSetState(() {});
                                                      }
                                                      await Future.delayed(
                                                          const Duration(
                                                              milliseconds:
                                                                  300));
                                                      _model.listOfNotes =
                                                          await actions
                                                              .extractNotesFromJson(
                                                        FFAppState().jsonDiary,
                                                      );
                                                      FFAppState().listOfNotes =
                                                          FFAppState()
                                                              .listOfNotes
                                                              .toList()
                                                              .cast<
                                                                  NoteStruct>();
                                                      safeSetState(() {});

                                                      await DiariesRecord.createDoc(
                                                              currentUserReference!)
                                                          .set({
                                                        ...mapToFirestore(
                                                          {
                                                            'created_at': FieldValue
                                                                .serverTimestamp(),
                                                            'notes':
                                                                getNoteListFirestoreData(
                                                              FFAppState()
                                                                  .listOfNotes,
                                                            ),
                                                          },
                                                        ),
                                                      });

                                                      safeSetState(() {});
                                                    },
                                                    child: FaIcon(
                                                      FontAwesomeIcons
                                                          .microphoneAltSlash,
                                                      color:
                                                          FlutterFlowTheme.of(
                                                                  context)
                                                              .primary,
                                                      size: 100.0,
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
                                if (_model.record)
                                  const Padding(
                                    padding: EdgeInsetsDirectional.fromSTEB(
                                        0.0, 100.0, 0.0, 0.0),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.max,
                                      mainAxisAlignment:
                                          MainAxisAlignment.center,
                                      children: [],
                                    ),
                                  ),
                              ],
                            ),
                            Container(),
                          ],
                        ),
                      ),
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
