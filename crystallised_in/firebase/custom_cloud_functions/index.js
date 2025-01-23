const admin = require("firebase-admin/app");
admin.initializeApp();

const displayUserInfoOnGMarkerTap = require("./display_user_info_on_g_marker_tap.js");
exports.displayUserInfoOnGMarkerTap =
  displayUserInfoOnGMarkerTap.displayUserInfoOnGMarkerTap;
const cloudFunctionDiarieAImatch = require("./cloud_function_diarie_a_imatch.js");
exports.cloudFunctionDiarieAImatch =
  cloudFunctionDiarieAImatch.cloudFunctionDiarieAImatch;
const funcForDiariesForLoggedUser2 = require("./func_for_diaries_for_logged_user2.js");
exports.funcForDiariesForLoggedUser2 =
  funcForDiariesForLoggedUser2.funcForDiariesForLoggedUser2;
