import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import 'package:flutter/material.dart';
import 'walkthought_optimizer_page1_model.dart';
export 'walkthought_optimizer_page1_model.dart';

class WalkthoughtOptimizerPage1Widget extends StatefulWidget {
  const WalkthoughtOptimizerPage1Widget({super.key});

  @override
  State<WalkthoughtOptimizerPage1Widget> createState() =>
      _WalkthoughtOptimizerPage1WidgetState();
}

class _WalkthoughtOptimizerPage1WidgetState
    extends State<WalkthoughtOptimizerPage1Widget> {
  late WalkthoughtOptimizerPage1Model _model;

  @override
  void setState(VoidCallback callback) {
    super.setState(callback);
    _model.onUpdate();
  }

  @override
  void initState() {
    super.initState();
    _model = createModel(context, () => WalkthoughtOptimizerPage1Model());

    WidgetsBinding.instance.addPostFrameCallback((_) => safeSetState(() {}));
  }

  @override
  void dispose() {
    _model.maybeDispose();

    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Align(
          alignment: const AlignmentDirectional(0.0, 0.0),
          child: Container(
            width: 250.0,
            height: 60.0,
            decoration: const BoxDecoration(
              color: Color(0xD323B6A8),
              borderRadius: BorderRadius.only(
                bottomLeft: Radius.circular(0.0),
                bottomRight: Radius.circular(30.0),
                topLeft: Radius.circular(30.0),
                topRight: Radius.circular(0.0),
              ),
            ),
            child: Align(
              alignment: const AlignmentDirectional(0.0, 0.0),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Padding(
                    padding: const EdgeInsetsDirectional.fromSTEB(7.0, 0.0, 7.0, 0.0),
                    child: Text(
                      FFLocalizations.of(context).getText(
                        '0dsbn9wz' /* An opportunity to develop skil... */,
                      ),
                      style: FlutterFlowTheme.of(context).bodyMedium.override(
                            fontFamily: 'Montserrat',
                            color: const Color(0xC9D3D3D3),
                            fontSize: 13.0,
                            letterSpacing: 0.0,
                            fontWeight: FontWeight.w600,
                            fontStyle: FontStyle.italic,
                          ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}
