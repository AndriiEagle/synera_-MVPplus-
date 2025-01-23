import '/auth/firebase_auth/auth_util.dart';
import '/backend/backend.dart';
import '/components/match_widget.dart';
import '/components/navigation/bootom_navigation_component/bootom_navigation_component_widget.dart';
import '/flutter_flow/flutter_flow_animations.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import '/custom_code/actions/index.dart' as actions;
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:provider/provider.dart';
import 'profile_public_page_model.dart';
export 'profile_public_page_model.dart';

class ProfilePublicPageWidget extends StatefulWidget {
  const ProfilePublicPageWidget({
    Key? key,
    required this.id,
  }) : super(key: key);

  final DocumentReference? id;

  @override
  _ProfilePublicPageWidgetState createState() => _ProfilePublicPageWidgetState();
}

class _ProfilePublicPageWidgetState extends State<ProfilePublicPageWidget> with TickerProviderStateMixin {
  late ProfilePublicPageModel _model;
  final scaffoldKey = GlobalKey<ScaffoldState>();
  final animationsMap = <String, AnimationInfo>{};

  @override
  void initState() {
    super.initState();
    _model = createModel(context, () => ProfilePublicPageModel());

    // Действия при загрузке страницы
    SchedulerBinding.instance.addPostFrameCallback((_) async {
      await Future.delayed(const Duration(milliseconds: 1000));
      await actions.checkGPS();
    });

    animationsMap.addAll({
      'textOnPageLoadAnimation': AnimationInfo(
        loop: true,
        reverse: true,
        trigger: AnimationTrigger.onPageLoad,
        effectsBuilder: () => [
          ShimmerEffect(
            curve: Curves.easeInOut,
            delay: 1810.ms,
            duration: 4510.ms,
            color: FlutterFlowTheme.of(context).secondaryBackground,
            angle: 0.524,
          ),
        ],
      ),
    });

    WidgetsBinding.instance.addPostFrameCallback((_) => setState(() {}));
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
        backgroundColor: const Color(0xFF15161D),
        body: SafeArea(
          top: true,
          child: StreamBuilder<UsersRecord>(
            stream: UsersRecord.getDocument(widget.id!),
            builder: (context, snapshot) {
              if (!snapshot.hasData) {
                return Center(
                  child: SizedBox(
                    width: 50.0,
                    height: 50.0,
                    child: SpinKitFadingCircle(
                      color: FlutterFlowTheme.of(context).primary,
                      size: 50.0,
                    ),
                  ),
                );
              }

              final mainStackUsersRecord = snapshot.data!;

              return Stack(
                children: [
                  Align(
                    alignment: const AlignmentDirectional(0.0, 0.0),
                    child: SingleChildScrollView(
                      child: Column(
                        mainAxisSize: MainAxisSize.max,
                        children: [
                          Align(
                            alignment: const AlignmentDirectional(0.0, 0.0),
                            child: Container(
                              height: 60.0,
                              decoration: const BoxDecoration(
                                color: Color(0xFF2B3138),
                                borderRadius: BorderRadius.only(
                                  topLeft: Radius.circular(16.0),
                                  topRight: Radius.circular(16.0),
                                ),
                              ),
                              child: Column(
                                mainAxisSize: MainAxisSize.max,
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Padding(
                                    padding: const EdgeInsetsDirectional.fromSTEB(10.0, 0.0, 10.0, 0.0),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.max,
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        InkWell(
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
                                          mainStackUsersRecord.displayName,
                                          style: FlutterFlowTheme.of(context).bodyMedium.override(
                                            fontFamily: 'Montserrat',
                                            color: Colors.white,
                                            fontSize: 22.0,
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          Container(
                            width: MediaQuery.sizeOf(context).width * 1.0,
                            height: 100.0,
                            decoration: const BoxDecoration(color: Color(0xFF2B3138)),
                            child: Column(
                              mainAxisSize: MainAxisSize.max,
                              children: [
                                Padding(
                                  padding: const EdgeInsetsDirectional.fromSTEB(10.0, 8.0, 10.0, 0.0),
                                  child: Container(
                                    width: MediaQuery.sizeOf(context).width * 1.0,
                                    height: 52.0,
                                    decoration: const BoxDecoration(
                                      color: Color(0xFF2B3138),
                                    ),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.max,
                                      children: [
                                        Container(
                                          width: 126.0,
                                          height: 24.0,
                                          decoration: const BoxDecoration(color: Color(0xFF2B3138)),
                                          child: Row(
                                            mainAxisAlignment: MainAxisAlignment.start,
                                            children: [
                                              const Icon(
                                                FFIcons.kru63l2tosqgm0wpv8fg,
                                                color: Color(0xFF666775),
                                                size: 16.0,
                                              ),
                                              Padding(
                                                padding: const EdgeInsetsDirectional.fromSTEB(5.0, 0.0, 0.0, 0.0),
                                                child: Text(
                                                  'Musician DJ',
                                                  style: FlutterFlowTheme.of(context).bodyMedium.override(
                                                    fontFamily: 'Montserrat',
                                                    color: const Color(0xFFF5F4F8),
                                                    fontSize: 15.0,
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
                          ),
                          Container(
                            height: 570.0,
                            constraints: const BoxConstraints(minHeight: 500.0),
                            decoration: const BoxDecoration(
                              color: Color(0xFF2B3138),
                              borderRadius: BorderRadius.only(
                                bottomLeft: Radius.circular(16.0),
                                bottomRight: Radius.circular(16.0),
                              ),
                            ),
                            alignment: const AlignmentDirectional(0.0, 0.0),
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                              children: [
                                Padding(
                                  padding: const EdgeInsetsDirectional.fromSTEB(10.0, 0.0, 10.0, 0.0),
                                  child: Container(
                                    width: MediaQuery.sizeOf(context).width * 1.0,
                                    height: 470.0,
                                    constraints: BoxConstraints(maxHeight: MediaQuery.sizeOf(context).height * 0.9),
                                    decoration: const BoxDecoration(
                                      color: Color(0xFF22232D),
                                      boxShadow: [
                                        BoxShadow(
                                          blurRadius: 10.0,
                                          color: Color(0xFF22232D),
                                          offset: Offset(0.0, 2.0),
                                        )
                                      ],
                                      borderRadius: BorderRadius.all(Radius.circular(16.0)),
                                    ),
                                    child: SingleChildScrollView(
                                      child: Column(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Container(
                                            decoration: const BoxDecoration(),
                                            child: Align(
                                              alignment: const AlignmentDirectional(0.0, 1.0),
                                              child: Stack(
                                                children: [
                                                  ClipRRect(
                                                    borderRadius: const BorderRadius.all(Radius.circular(16.0)),
                                                    child: Image.network(
                                                      mainStackUsersRecord.photoUrl,
                                                      width: MediaQuery.sizeOf(context).width * 1.0,
                                                      height: 240.0,
                                                      fit: BoxFit.cover,
                                                    ),
                                                  ),
                                                  wrapWithModel(
                                                    model: _model.matchModel,
                                                    updateCallback: () => setState(() {}),
                                                    child: const MatchWidget(
                                                      percentage: 30,
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ),
                                          ),
                                          Padding(
                                            padding: const EdgeInsetsDirectional.fromSTEB(10.0, 20.0, 10.0, 0.0),
                                            child: Container(
                                              width: MediaQuery.sizeOf(context).width * 1.0,
                                              height: 190.0,
                                              decoration: const BoxDecoration(
                                                color: Color(0xFF22232D),
                                                borderRadius: BorderRadius.all(Radius.circular(16.0)),
                                              ),
                                              child: SingleChildScrollView(
                                                child: Column(
                                                  mainAxisSize: MainAxisSize.min,
                                                  children: [
                                                    Text(
                                                      'About Me',
                                                      style: FlutterFlowTheme.of(context).bodyMedium.override(
                                                        fontFamily: 'Montserrat',
                                                        color: Colors.white,
                                                        fontSize: 22.0,
                                                        fontWeight: FontWeight.w600,
                                                      ),
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
                                ),
                              ],
                            ),
                          ),
                          Padding(
                            padding: const EdgeInsetsDirectional.fromSTEB(0.0, 20.0, 0.0, 150.0),
                            child: FFButtonWidget(
                              onPressed: () async {
                                context.pushNamed(
                                  'PhotosPublicPage',
                                  queryParameters: {
                                    'id': serializeParam(widget.id, ParamType.DocumentReference),
                                  }.withoutNulls,
                                );
                              },
                              text: 'All Photos',
                              options: FFButtonOptions(
                                width: MediaQuery.sizeOf(context).width * 0.85,
                                height: 50.0,
                                color: const Color(0xFFE7BD87),
                                textStyle: FlutterFlowTheme.of(context).titleSmall.override(
                                  fontFamily: 'Montserrat',
                                  color: Colors.white,
                                  fontSize: 17.0,
                                ),
                                elevation: 0.0,
                                borderRadius: BorderRadius.circular(16.0),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  Align(
                    alignment: const AlignmentDirectional(0.0, 1.0),
                    child: wrapWithModel(
                      model: _model.bootomNavigationComponentModel,
                      updateCallback: () => setState(() {}),
                      child: const BootomNavigationComponentWidget(),
                    ),
                  ),
                ],
              );
            },
          ),
        ),
      ),
    );
  }
}
