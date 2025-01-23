import '/app_pages/meetings/booked_meetings_component/booked_meetings_component_widget.dart';
import '/auth/firebase_auth/auth_util.dart';
import '/backend/backend.dart';
import '/components/navigation/bootom_navigation_component/bootom_navigation_component_widget.dart';
import '/components/resived_requests_component_widget.dart';
import '/components/sent_requests_component_widget.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import 'package:flutter/material.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';
import 'meetings_managment_page_model.dart';
export 'meetings_managment_page_model.dart';

class MeetingsManagmentPageWidget extends StatefulWidget {
  const MeetingsManagmentPageWidget({super.key});

  @override
  State<MeetingsManagmentPageWidget> createState() =>
      _MeetingsManagmentPageWidgetState();
}

class _MeetingsManagmentPageWidgetState
    extends State<MeetingsManagmentPageWidget> {
  late MeetingsManagmentPageModel _model;

  final scaffoldKey = GlobalKey<ScaffoldState>();

  @override
  void initState() {
    super.initState();
    _model = createModel(context, () => MeetingsManagmentPageModel());

    WidgetsBinding.instance.addPostFrameCallback((_) => safeSetState(() {}));
  }

  @override
  void dispose() {
    _model.dispose();

    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
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
                                  'f1epxbdw' /* Meeting Menagment */,
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
                                    context.pushNamed('MeetingsManagmentPage');
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
                      height: 60.0,
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
                              height: 100.0,
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
                                      Text(
                                        FFLocalizations.of(context).getText(
                                          'd47wafgo' /* Sent */,
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
                                  Row(
                                    mainAxisSize: MainAxisSize.max,
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Text(
                                        FFLocalizations.of(context).getText(
                                          'eo3hcwcy' /* Requests */,
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
                              height: 100.0,
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
                                      Text(
                                        FFLocalizations.of(context).getText(
                                          'jjnoxmhc' /* Recived */,
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
                                  Row(
                                    mainAxisSize: MainAxisSize.max,
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Text(
                                        FFLocalizations.of(context).getText(
                                          'di7c7u76' /* Requests */,
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
                              height: 100.0,
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
                                      Text(
                                        FFLocalizations.of(context).getText(
                                          '5a0fspk6' /* Booked */,
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
                                  Row(
                                    mainAxisSize: MainAxisSize.max,
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Text(
                                        FFLocalizations.of(context).getText(
                                          'irdddj3o' /* Meetings */,
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
                            StreamBuilder<List<MeetingsRecord>>(
                              stream: queryMeetingsRecord(
                                queryBuilder: (meetingsRecord) => meetingsRecord
                                    .where(
                                      'status',
                                      isEqualTo: 'pending',
                                    )
                                    .where(
                                      'requester_id',
                                      isEqualTo: currentUserReference,
                                    ),
                              ),
                              builder: (context, snapshot) {
                                // Customize what your widget looks like when it's loading.
                                if (!snapshot.hasData) {
                                  return Center(
                                    child: SizedBox(
                                      width: 50.0,
                                      height: 50.0,
                                      child: SpinKitFadingCircle(
                                        color: FlutterFlowTheme.of(context)
                                            .primary,
                                        size: 50.0,
                                      ),
                                    ),
                                  );
                                }
                                List<MeetingsRecord>
                                    sentRequestsListMeetingsRecordList =
                                    snapshot.data!;

                                return ListView.builder(
                                  padding: EdgeInsets.zero,
                                  shrinkWrap: true,
                                  scrollDirection: Axis.vertical,
                                  itemCount:
                                      sentRequestsListMeetingsRecordList.length,
                                  itemBuilder:
                                      (context, sentRequestsListIndex) {
                                    final sentRequestsListMeetingsRecord =
                                        sentRequestsListMeetingsRecordList[
                                            sentRequestsListIndex];
                                    return Padding(
                                      padding: const EdgeInsetsDirectional.fromSTEB(
                                          10.0, 0.0, 10.0, 0.0),
                                      child: StreamBuilder<UsersRecord>(
                                        stream: UsersRecord.getDocument(
                                            sentRequestsListMeetingsRecord
                                                .requesteeId!),
                                        builder: (context, snapshot) {
                                          // Customize what your widget looks like when it's loading.
                                          if (!snapshot.hasData) {
                                            return Center(
                                              child: SizedBox(
                                                width: 50.0,
                                                height: 50.0,
                                                child: SpinKitFadingCircle(
                                                  color: FlutterFlowTheme.of(
                                                          context)
                                                      .primary,
                                                  size: 50.0,
                                                ),
                                              ),
                                            );
                                          }

                                          final sentRequestsComponentUsersRecord =
                                              snapshot.data!;

                                          return SentRequestsComponentWidget(
                                            key: Key(
                                                'Key690_${sentRequestsListIndex}_of_${sentRequestsListMeetingsRecordList.length}'),
                                            adress:
                                                sentRequestsListMeetingsRecord
                                                    .place,
                                            description:
                                                sentRequestsListMeetingsRecord
                                                    .mesagge,
                                            image:
                                                sentRequestsComponentUsersRecord
                                                    .photoUrl,
                                            displayName:
                                                sentRequestsComponentUsersRecord
                                                    .displayName,
                                            date: sentRequestsListMeetingsRecord
                                                .date!,
                                            meetingRef:
                                                sentRequestsListMeetingsRecord
                                                    .reference,
                                          );
                                        },
                                      ),
                                    );
                                  },
                                );
                              },
                            ),
                            StreamBuilder<List<MeetingsRecord>>(
                              stream: queryMeetingsRecord(
                                queryBuilder: (meetingsRecord) => meetingsRecord
                                    .where(
                                      'status',
                                      isEqualTo: 'pending',
                                    )
                                    .where(
                                      'requestee_id',
                                      isEqualTo: currentUserReference,
                                    ),
                              ),
                              builder: (context, snapshot) {
                                // Customize what your widget looks like when it's loading.
                                if (!snapshot.hasData) {
                                  return Center(
                                    child: SizedBox(
                                      width: 50.0,
                                      height: 50.0,
                                      child: SpinKitFadingCircle(
                                        color: FlutterFlowTheme.of(context)
                                            .primary,
                                        size: 50.0,
                                      ),
                                    ),
                                  );
                                }
                                List<MeetingsRecord>
                                    recivedRequestListMeetingsRecordList =
                                    snapshot.data!;

                                return ListView.builder(
                                  padding: EdgeInsets.zero,
                                  shrinkWrap: true,
                                  scrollDirection: Axis.vertical,
                                  itemCount:
                                      recivedRequestListMeetingsRecordList
                                          .length,
                                  itemBuilder:
                                      (context, recivedRequestListIndex) {
                                    final recivedRequestListMeetingsRecord =
                                        recivedRequestListMeetingsRecordList[
                                            recivedRequestListIndex];
                                    return Padding(
                                      padding: const EdgeInsetsDirectional.fromSTEB(
                                          10.0, 0.0, 10.0, 0.0),
                                      child: StreamBuilder<UsersRecord>(
                                        stream: UsersRecord.getDocument(
                                            recivedRequestListMeetingsRecord
                                                .requesterId!),
                                        builder: (context, snapshot) {
                                          // Customize what your widget looks like when it's loading.
                                          if (!snapshot.hasData) {
                                            return Center(
                                              child: SizedBox(
                                                width: 50.0,
                                                height: 50.0,
                                                child: SpinKitFadingCircle(
                                                  color: FlutterFlowTheme.of(
                                                          context)
                                                      .primary,
                                                  size: 50.0,
                                                ),
                                              ),
                                            );
                                          }

                                          final resivedRequestsComponentUsersRecord =
                                              snapshot.data!;

                                          return ResivedRequestsComponentWidget(
                                            key: Key(
                                                'Key2qh_${recivedRequestListIndex}_of_${recivedRequestListMeetingsRecordList.length}'),
                                            adress:
                                                recivedRequestListMeetingsRecord
                                                    .place,
                                            description:
                                                recivedRequestListMeetingsRecord
                                                    .mesagge,
                                            image:
                                                resivedRequestsComponentUsersRecord
                                                    .photoUrl,
                                            displayName:
                                                resivedRequestsComponentUsersRecord
                                                    .displayName,
                                            date:
                                                recivedRequestListMeetingsRecord
                                                    .date!,
                                            meetingReference:
                                                recivedRequestListMeetingsRecord
                                                    .reference,
                                          );
                                        },
                                      ),
                                    );
                                  },
                                );
                              },
                            ),
                            ListView(
                              padding: EdgeInsets.zero,
                              shrinkWrap: true,
                              scrollDirection: Axis.vertical,
                              children: [
                                StreamBuilder<List<MeetingsRecord>>(
                                  stream: queryMeetingsRecord(
                                    queryBuilder: (meetingsRecord) =>
                                        meetingsRecord
                                            .where(
                                              'status',
                                              isEqualTo: 'booked',
                                            )
                                            .where(
                                              'requester_id',
                                              isEqualTo: currentUserReference,
                                            ),
                                  ),
                                  builder: (context, snapshot) {
                                    // Customize what your widget looks like when it's loading.
                                    if (!snapshot.hasData) {
                                      return Center(
                                        child: SizedBox(
                                          width: 50.0,
                                          height: 50.0,
                                          child: SpinKitFadingCircle(
                                            color: FlutterFlowTheme.of(context)
                                                .primary,
                                            size: 50.0,
                                          ),
                                        ),
                                      );
                                    }
                                    List<MeetingsRecord>
                                        bookedMeetingsListMeetingsRecordList =
                                        snapshot.data!;

                                    return ListView.builder(
                                      padding: EdgeInsets.zero,
                                      shrinkWrap: true,
                                      scrollDirection: Axis.vertical,
                                      itemCount:
                                          bookedMeetingsListMeetingsRecordList
                                              .length,
                                      itemBuilder:
                                          (context, bookedMeetingsListIndex) {
                                        final bookedMeetingsListMeetingsRecord =
                                            bookedMeetingsListMeetingsRecordList[
                                                bookedMeetingsListIndex];
                                        return Padding(
                                          padding:
                                              const EdgeInsetsDirectional.fromSTEB(
                                                  10.0, 0.0, 10.0, 0.0),
                                          child: StreamBuilder<UsersRecord>(
                                            stream: UsersRecord.getDocument(
                                                bookedMeetingsListMeetingsRecord
                                                    .requesteeId!),
                                            builder: (context, snapshot) {
                                              // Customize what your widget looks like when it's loading.
                                              if (!snapshot.hasData) {
                                                return Center(
                                                  child: SizedBox(
                                                    width: 50.0,
                                                    height: 50.0,
                                                    child: SpinKitFadingCircle(
                                                      color:
                                                          FlutterFlowTheme.of(
                                                                  context)
                                                              .primary,
                                                      size: 50.0,
                                                    ),
                                                  ),
                                                );
                                              }

                                              final bookedMeetingsComponentUsersRecord =
                                                  snapshot.data!;

                                              return BookedMeetingsComponentWidget(
                                                key: Key(
                                                    'Keyvoz_${bookedMeetingsListIndex}_of_${bookedMeetingsListMeetingsRecordList.length}'),
                                                adress:
                                                    bookedMeetingsListMeetingsRecord
                                                        .place,
                                                description:
                                                    bookedMeetingsListMeetingsRecord
                                                        .mesagge,
                                                image:
                                                    bookedMeetingsComponentUsersRecord
                                                        .photoUrl,
                                                displayName:
                                                    bookedMeetingsComponentUsersRecord
                                                        .displayName,
                                                date:
                                                    bookedMeetingsListMeetingsRecord
                                                        .date!,
                                                meetingReference:
                                                    bookedMeetingsListMeetingsRecord
                                                        .reference,
                                              );
                                            },
                                          ),
                                        );
                                      },
                                    );
                                  },
                                ),
                                StreamBuilder<List<MeetingsRecord>>(
                                  stream: queryMeetingsRecord(
                                    queryBuilder: (meetingsRecord) =>
                                        meetingsRecord
                                            .where(
                                              'status',
                                              isEqualTo: 'booked',
                                            )
                                            .where(
                                              'requestee_id',
                                              isEqualTo: currentUserReference,
                                            ),
                                  ),
                                  builder: (context, snapshot) {
                                    // Customize what your widget looks like when it's loading.
                                    if (!snapshot.hasData) {
                                      return Center(
                                        child: SizedBox(
                                          width: 50.0,
                                          height: 50.0,
                                          child: SpinKitFadingCircle(
                                            color: FlutterFlowTheme.of(context)
                                                .primary,
                                            size: 50.0,
                                          ),
                                        ),
                                      );
                                    }
                                    List<MeetingsRecord>
                                        bookedMeetingsListMeetingsRecordList =
                                        snapshot.data!;

                                    return ListView.builder(
                                      padding: EdgeInsets.zero,
                                      shrinkWrap: true,
                                      scrollDirection: Axis.vertical,
                                      itemCount:
                                          bookedMeetingsListMeetingsRecordList
                                              .length,
                                      itemBuilder:
                                          (context, bookedMeetingsListIndex) {
                                        final bookedMeetingsListMeetingsRecord =
                                            bookedMeetingsListMeetingsRecordList[
                                                bookedMeetingsListIndex];
                                        return Padding(
                                          padding:
                                              const EdgeInsetsDirectional.fromSTEB(
                                                  10.0, 0.0, 10.0, 0.0),
                                          child: StreamBuilder<UsersRecord>(
                                            stream: UsersRecord.getDocument(
                                                bookedMeetingsListMeetingsRecord
                                                    .requesterId!),
                                            builder: (context, snapshot) {
                                              // Customize what your widget looks like when it's loading.
                                              if (!snapshot.hasData) {
                                                return Center(
                                                  child: SizedBox(
                                                    width: 50.0,
                                                    height: 50.0,
                                                    child: SpinKitFadingCircle(
                                                      color:
                                                          FlutterFlowTheme.of(
                                                                  context)
                                                              .primary,
                                                      size: 50.0,
                                                    ),
                                                  ),
                                                );
                                              }

                                              final bookedMeetingsComponentUsersRecord =
                                                  snapshot.data!;

                                              return BookedMeetingsComponentWidget(
                                                key: Key(
                                                    'Keyxhk_${bookedMeetingsListIndex}_of_${bookedMeetingsListMeetingsRecordList.length}'),
                                                adress:
                                                    bookedMeetingsListMeetingsRecord
                                                        .place,
                                                description:
                                                    bookedMeetingsListMeetingsRecord
                                                        .mesagge,
                                                image:
                                                    bookedMeetingsComponentUsersRecord
                                                        .photoUrl,
                                                displayName:
                                                    bookedMeetingsComponentUsersRecord
                                                        .displayName,
                                                date:
                                                    bookedMeetingsListMeetingsRecord
                                                        .date!,
                                                meetingReference:
                                                    bookedMeetingsListMeetingsRecord
                                                        .reference,
                                              );
                                            },
                                          ),
                                        );
                                      },
                                    );
                                  },
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
            ],
          ),
        ),
      ),
    );
  }
}
