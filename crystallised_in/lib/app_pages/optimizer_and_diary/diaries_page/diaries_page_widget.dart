import '/auth/firebase_auth/auth_util.dart';
import '/backend/backend.dart';
import '/components/diaries_item_widget.dart';
import '/components/navigation/bootom_navigation_component/bootom_navigation_component_widget.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import 'package:flutter/material.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';
import 'diaries_page_model.dart';
export 'diaries_page_model.dart';

class DiariesPageWidget extends StatefulWidget {
  const DiariesPageWidget({
    super.key,
    required this.sphere,
  });

  final String? sphere;

  @override
  State<DiariesPageWidget> createState() => _DiariesPageWidgetState();
}

class _DiariesPageWidgetState extends State<DiariesPageWidget> {
  late DiariesPageModel _model;

  final scaffoldKey = GlobalKey<ScaffoldState>();

  @override
  void initState() {
    super.initState();
    _model = createModel(context, () => DiariesPageModel());

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
                      children: [
                        Padding(
                          padding: const EdgeInsetsDirectional.fromSTEB(
                              10.0, 20.0, 10.0, 0.0),
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
                                  '7wcmro10' /* Diaries */,
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
                  StreamBuilder<List<DiariesRecord>>(
                    stream: queryDiariesRecord(
                      parent: currentUserReference,
                    ),
                    builder: (context, snapshot) {
                      // Customize what your widget looks like when it's loading.
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
                      List<DiariesRecord> mainListViewDiariesRecordList =
                          snapshot.data!;

                      return ListView.builder(
                        padding: EdgeInsets.zero,
                        shrinkWrap: true,
                        scrollDirection: Axis.vertical,
                        itemCount: mainListViewDiariesRecordList.length,
                        itemBuilder: (context, mainListViewIndex) {
                          final mainListViewDiariesRecord =
                              mainListViewDiariesRecordList[mainListViewIndex];
                          return Builder(
                            builder: (context) {
                              final notes = mainListViewDiariesRecord.notes
                                  .where(
                                      (e) => e.sphereOfLife == widget.sphere)
                                  .toList();

                              return SingleChildScrollView(
                                child: Column(
                                  mainAxisSize: MainAxisSize.max,
                                  children:
                                      List.generate(notes.length, (notesIndex) {
                                    final notesItem = notes[notesIndex];
                                    return DiariesItemWidget(
                                      key: Key(
                                          'Keyh0q_${notesIndex}_of_${notes.length}'),
                                      descripton: notesItem.description,
                                      dateAndTime:
                                          mainListViewDiariesRecord.createdAt!,
                                      note: notesItem,
                                    );
                                  }),
                                ),
                              );
                            },
                          );
                        },
                      );
                    },
                  ),
                ],
              ),
              Align(
                alignment: const AlignmentDirectional(0.0, 1.0),
                child: wrapWithModel(
                  model: _model.bootomNavigationComponentModel,
                  updateCallback: () => safeSetState(() {}),
                  child: const BootomNavigationComponentWidget(),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
