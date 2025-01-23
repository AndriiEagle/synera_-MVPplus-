import 'package:flutter/material.dart';
import '/backend/backend.dart';

class FFAppState extends ChangeNotifier {
  static FFAppState _instance = FFAppState._internal();

  factory FFAppState() {
    return _instance;
  }

  FFAppState._internal();

  static void reset() {
    _instance = FFAppState._internal();
  }

  Future initializePersistedState() async {}

  void update(VoidCallback callback) {
    callback();
    notifyListeners();
  }

  bool _RecordOptionsComponent = false;
  bool get RecordOptionsComponent => _RecordOptionsComponent;
  set RecordOptionsComponent(bool value) {
    _RecordOptionsComponent = value;
  }

  bool _RecordComponentProfile = false;
  bool get RecordComponentProfile => _RecordComponentProfile;
  set RecordComponentProfile(bool value) {
    _RecordComponentProfile = value;
  }

  bool _RecordComponentDiary = false;
  bool get RecordComponentDiary => _RecordComponentDiary;
  set RecordComponentDiary(bool value) {
    _RecordComponentDiary = value;
  }

  bool _IconUserOrPhotosClicked = false;
  bool get IconUserOrPhotosClicked => _IconUserOrPhotosClicked;
  set IconUserOrPhotosClicked(bool value) {
    _IconUserOrPhotosClicked = value;
  }

  bool _deleteNotification = false;
  bool get deleteNotification => _deleteNotification;
  set deleteNotification(bool value) {
    _deleteNotification = value;
  }

  DocumentReference? _deleteReferencePhotos;
  DocumentReference? get deleteReferencePhotos => _deleteReferencePhotos;
  set deleteReferencePhotos(DocumentReference? value) {
    _deleteReferencePhotos = value;
  }

  String _transcriptWhisper = '';
  String get transcriptWhisper => _transcriptWhisper;
  set transcriptWhisper(String value) {
    _transcriptWhisper = value;
  }

  String _giveAndTakeValuesAPI = '';
  String get giveAndTakeValuesAPI => _giveAndTakeValuesAPI;
  set giveAndTakeValuesAPI(String value) {
    _giveAndTakeValuesAPI = value;
  }

  bool _showQA = false;
  bool get showQA => _showQA;
  set showQA(bool value) {
    _showQA = value;
  }

  DocumentReference? _UserRef;
  DocumentReference? get UserRef => _UserRef;
  set UserRef(DocumentReference? value) {
    _UserRef = value;
  }

  DocumentReference? _ExchangesRef;
  DocumentReference? get ExchangesRef => _ExchangesRef;
  set ExchangesRef(DocumentReference? value) {
    _ExchangesRef = value;
  }

  bool _photoTest = false;
  bool get photoTest => _photoTest;
  set photoTest(bool value) {
    _photoTest = value;
  }

  String _jsonDiary = '';
  String get jsonDiary => _jsonDiary;
  set jsonDiary(String value) {
    _jsonDiary = value;
  }

  DocumentReference? _diaryNoteReference;
  DocumentReference? get diaryNoteReference => _diaryNoteReference;
  set diaryNoteReference(DocumentReference? value) {
    _diaryNoteReference = value;
  }

  dynamic _jsonUsersAppstate;
  dynamic get jsonUsersAppstate => _jsonUsersAppstate;
  set jsonUsersAppstate(dynamic value) {
    _jsonUsersAppstate = value;
  }

  String _currentQorAcomponent = 'q';
  String get currentQorAcomponent => _currentQorAcomponent;
  set currentQorAcomponent(String value) {
    _currentQorAcomponent = value;
  }

  String _currentMapFilterBySpheres = '';
  String get currentMapFilterBySpheres => _currentMapFilterBySpheres;
  set currentMapFilterBySpheres(String value) {
    _currentMapFilterBySpheres = value;
  }

  List<String> _FilterbySpherersForGmap = [];
  List<String> get FilterbySpherersForGmap => _FilterbySpherersForGmap;
  set FilterbySpherersForGmap(List<String> value) {
    _FilterbySpherersForGmap = value;
  }

  void addToFilterbySpherersForGmap(String value) {
    FilterbySpherersForGmap.add(value);
  }

  void removeFromFilterbySpherersForGmap(String value) {
    FilterbySpherersForGmap.remove(value);
  }

  void removeAtIndexFromFilterbySpherersForGmap(int index) {
    FilterbySpherersForGmap.removeAt(index);
  }

  void updateFilterbySpherersForGmapAtIndex(
    int index,
    String Function(String) updateFn,
  ) {
    FilterbySpherersForGmap[index] = updateFn(_FilterbySpherersForGmap[index]);
  }

  void insertAtIndexInFilterbySpherersForGmap(int index, String value) {
    FilterbySpherersForGmap.insert(index, value);
  }

  List<String> _ListGiveTakeValuesforFilteronGmap = [];
  List<String> get ListGiveTakeValuesforFilteronGmap =>
      _ListGiveTakeValuesforFilteronGmap;
  set ListGiveTakeValuesforFilteronGmap(List<String> value) {
    _ListGiveTakeValuesforFilteronGmap = value;
  }

  void addToListGiveTakeValuesforFilteronGmap(String value) {
    ListGiveTakeValuesforFilteronGmap.add(value);
  }

  void removeFromListGiveTakeValuesforFilteronGmap(String value) {
    ListGiveTakeValuesforFilteronGmap.remove(value);
  }

  void removeAtIndexFromListGiveTakeValuesforFilteronGmap(int index) {
    ListGiveTakeValuesforFilteronGmap.removeAt(index);
  }

  void updateListGiveTakeValuesforFilteronGmapAtIndex(
    int index,
    String Function(String) updateFn,
  ) {
    ListGiveTakeValuesforFilteronGmap[index] =
        updateFn(_ListGiveTakeValuesforFilteronGmap[index]);
  }

  void insertAtIndexInListGiveTakeValuesforFilteronGmap(
      int index, String value) {
    ListGiveTakeValuesforFilteronGmap.insert(index, value);
  }

  List<String> _ListTAKEvaluesForFilterGmap = [];
  List<String> get ListTAKEvaluesForFilterGmap => _ListTAKEvaluesForFilterGmap;
  set ListTAKEvaluesForFilterGmap(List<String> value) {
    _ListTAKEvaluesForFilterGmap = value;
  }

  void addToListTAKEvaluesForFilterGmap(String value) {
    ListTAKEvaluesForFilterGmap.add(value);
  }

  void removeFromListTAKEvaluesForFilterGmap(String value) {
    ListTAKEvaluesForFilterGmap.remove(value);
  }

  void removeAtIndexFromListTAKEvaluesForFilterGmap(int index) {
    ListTAKEvaluesForFilterGmap.removeAt(index);
  }

  void updateListTAKEvaluesForFilterGmapAtIndex(
    int index,
    String Function(String) updateFn,
  ) {
    ListTAKEvaluesForFilterGmap[index] =
        updateFn(_ListTAKEvaluesForFilterGmap[index]);
  }

  void insertAtIndexInListTAKEvaluesForFilterGmap(int index, String value) {
    ListTAKEvaluesForFilterGmap.insert(index, value);
  }

  bool _MyLocationButtonIsPressed = true;
  bool get MyLocationButtonIsPressed => _MyLocationButtonIsPressed;
  set MyLocationButtonIsPressed(bool value) {
    _MyLocationButtonIsPressed = value;
  }

  bool _FilterBySpheresComponentsVisability = false;
  bool get FilterBySpheresComponentsVisability =>
      _FilterBySpheresComponentsVisability;
  set FilterBySpheresComponentsVisability(bool value) {
    _FilterBySpheresComponentsVisability = value;
  }

  dynamic _FilteredJsonByGiveTake;
  dynamic get FilteredJsonByGiveTake => _FilteredJsonByGiveTake;
  set FilteredJsonByGiveTake(dynamic value) {
    _FilteredJsonByGiveTake = value;
  }

  String _DisplayIconNetworking = '';
  String get DisplayIconNetworking => _DisplayIconNetworking;
  set DisplayIconNetworking(String value) {
    _DisplayIconNetworking = value;
  }

  List<String> _DisplayIconsSpheresListTake = [];
  List<String> get DisplayIconsSpheresListTake => _DisplayIconsSpheresListTake;
  set DisplayIconsSpheresListTake(List<String> value) {
    _DisplayIconsSpheresListTake = value;
  }

  void addToDisplayIconsSpheresListTake(String value) {
    DisplayIconsSpheresListTake.add(value);
  }

  void removeFromDisplayIconsSpheresListTake(String value) {
    DisplayIconsSpheresListTake.remove(value);
  }

  void removeAtIndexFromDisplayIconsSpheresListTake(int index) {
    DisplayIconsSpheresListTake.removeAt(index);
  }

  void updateDisplayIconsSpheresListTakeAtIndex(
    int index,
    String Function(String) updateFn,
  ) {
    DisplayIconsSpheresListTake[index] =
        updateFn(_DisplayIconsSpheresListTake[index]);
  }

  void insertAtIndexInDisplayIconsSpheresListTake(int index, String value) {
    DisplayIconsSpheresListTake.insert(index, value);
  }

  List<String> _DisplayIconsSpheresListGive = [];
  List<String> get DisplayIconsSpheresListGive => _DisplayIconsSpheresListGive;
  set DisplayIconsSpheresListGive(List<String> value) {
    _DisplayIconsSpheresListGive = value;
  }

  void addToDisplayIconsSpheresListGive(String value) {
    DisplayIconsSpheresListGive.add(value);
  }

  void removeFromDisplayIconsSpheresListGive(String value) {
    DisplayIconsSpheresListGive.remove(value);
  }

  void removeAtIndexFromDisplayIconsSpheresListGive(int index) {
    DisplayIconsSpheresListGive.removeAt(index);
  }

  void updateDisplayIconsSpheresListGiveAtIndex(
    int index,
    String Function(String) updateFn,
  ) {
    DisplayIconsSpheresListGive[index] =
        updateFn(_DisplayIconsSpheresListGive[index]);
  }

  void insertAtIndexInDisplayIconsSpheresListGive(int index, String value) {
    DisplayIconsSpheresListGive.insert(index, value);
  }

  List<double> _SphereIconsReactionOnPressListGive = [
    0.8,
    0.8,
    0.8,
    0.8,
    0.8,
    0.8,
    0.8,
    0.8,
    0.8,
    0.8,
    0.8,
    0.8
  ];
  List<double> get SphereIconsReactionOnPressListGive =>
      _SphereIconsReactionOnPressListGive;
  set SphereIconsReactionOnPressListGive(List<double> value) {
    _SphereIconsReactionOnPressListGive = value;
  }

  void addToSphereIconsReactionOnPressListGive(double value) {
    SphereIconsReactionOnPressListGive.add(value);
  }

  void removeFromSphereIconsReactionOnPressListGive(double value) {
    SphereIconsReactionOnPressListGive.remove(value);
  }

  void removeAtIndexFromSphereIconsReactionOnPressListGive(int index) {
    SphereIconsReactionOnPressListGive.removeAt(index);
  }

  void updateSphereIconsReactionOnPressListGiveAtIndex(
    int index,
    double Function(double) updateFn,
  ) {
    SphereIconsReactionOnPressListGive[index] =
        updateFn(_SphereIconsReactionOnPressListGive[index]);
  }

  void insertAtIndexInSphereIconsReactionOnPressListGive(
      int index, double value) {
    SphereIconsReactionOnPressListGive.insert(index, value);
  }

  List<double> _SphereIconsReactionOnPressListTake = [
    0.8,
    0.8,
    0.8,
    0.8,
    0.8,
    0.8,
    0.8,
    0.8,
    0.8,
    0.8,
    0.8,
    0.8
  ];
  List<double> get SphereIconsReactionOnPressListTake =>
      _SphereIconsReactionOnPressListTake;
  set SphereIconsReactionOnPressListTake(List<double> value) {
    _SphereIconsReactionOnPressListTake = value;
  }

  void addToSphereIconsReactionOnPressListTake(double value) {
    SphereIconsReactionOnPressListTake.add(value);
  }

  void removeFromSphereIconsReactionOnPressListTake(double value) {
    SphereIconsReactionOnPressListTake.remove(value);
  }

  void removeAtIndexFromSphereIconsReactionOnPressListTake(int index) {
    SphereIconsReactionOnPressListTake.removeAt(index);
  }

  void updateSphereIconsReactionOnPressListTakeAtIndex(
    int index,
    double Function(double) updateFn,
  ) {
    SphereIconsReactionOnPressListTake[index] =
        updateFn(_SphereIconsReactionOnPressListTake[index]);
  }

  void insertAtIndexInSphereIconsReactionOnPressListTake(
      int index, double value) {
    SphereIconsReactionOnPressListTake.insert(index, value);
  }

  List<String> _dg = [];
  List<String> get dg => _dg;
  set dg(List<String> value) {
    _dg = value;
  }

  void addToDg(String value) {
    dg.add(value);
  }

  void removeFromDg(String value) {
    dg.remove(value);
  }

  void removeAtIndexFromDg(int index) {
    dg.removeAt(index);
  }

  void updateDgAtIndex(
    int index,
    String Function(String) updateFn,
  ) {
    dg[index] = updateFn(_dg[index]);
  }

  void insertAtIndexInDg(int index, String value) {
    dg.insert(index, value);
  }

  String _MainUserAbout = '';
  String get MainUserAbout => _MainUserAbout;
  set MainUserAbout(String value) {
    _MainUserAbout = value;
  }

  String _UserOnListAbout = '';
  String get UserOnListAbout => _UserOnListAbout;
  set UserOnListAbout(String value) {
    _UserOnListAbout = value;
  }

  String _MainUserGiveAndTakes = '';
  String get MainUserGiveAndTakes => _MainUserGiveAndTakes;
  set MainUserGiveAndTakes(String value) {
    _MainUserGiveAndTakes = value;
  }

  String _UserOnListGive = '';
  String get UserOnListGive => _UserOnListGive;
  set UserOnListGive(String value) {
    _UserOnListGive = value;
  }

  String _UserOnListTake = '';
  String get UserOnListTake => _UserOnListTake;
  set UserOnListTake(String value) {
    _UserOnListTake = value;
  }

  String _AiBetaAnswer = '';
  String get AiBetaAnswer => _AiBetaAnswer;
  set AiBetaAnswer(String value) {
    _AiBetaAnswer = value;
  }

  List<String> _MainUserGiveList = [];
  List<String> get MainUserGiveList => _MainUserGiveList;
  set MainUserGiveList(List<String> value) {
    _MainUserGiveList = value;
  }

  void addToMainUserGiveList(String value) {
    MainUserGiveList.add(value);
  }

  void removeFromMainUserGiveList(String value) {
    MainUserGiveList.remove(value);
  }

  void removeAtIndexFromMainUserGiveList(int index) {
    MainUserGiveList.removeAt(index);
  }

  void updateMainUserGiveListAtIndex(
    int index,
    String Function(String) updateFn,
  ) {
    MainUserGiveList[index] = updateFn(_MainUserGiveList[index]);
  }

  void insertAtIndexInMainUserGiveList(int index, String value) {
    MainUserGiveList.insert(index, value);
  }

  List<String> _UserOnListGiveList = [];
  List<String> get UserOnListGiveList => _UserOnListGiveList;
  set UserOnListGiveList(List<String> value) {
    _UserOnListGiveList = value;
  }

  void addToUserOnListGiveList(String value) {
    UserOnListGiveList.add(value);
  }

  void removeFromUserOnListGiveList(String value) {
    UserOnListGiveList.remove(value);
  }

  void removeAtIndexFromUserOnListGiveList(int index) {
    UserOnListGiveList.removeAt(index);
  }

  void updateUserOnListGiveListAtIndex(
    int index,
    String Function(String) updateFn,
  ) {
    UserOnListGiveList[index] = updateFn(_UserOnListGiveList[index]);
  }

  void insertAtIndexInUserOnListGiveList(int index, String value) {
    UserOnListGiveList.insert(index, value);
  }

  int _number = 0;
  int get number => _number;
  set number(int value) {
    _number = value;
  }

  String _noteJson = '';
  String get noteJson => _noteJson;
  set noteJson(String value) {
    _noteJson = value;
  }

  List<DocumentReference> _diariesHealth = [];
  List<DocumentReference> get diariesHealth => _diariesHealth;
  set diariesHealth(List<DocumentReference> value) {
    _diariesHealth = value;
  }

  void addToDiariesHealth(DocumentReference value) {
    diariesHealth.add(value);
  }

  void removeFromDiariesHealth(DocumentReference value) {
    diariesHealth.remove(value);
  }

  void removeAtIndexFromDiariesHealth(int index) {
    diariesHealth.removeAt(index);
  }

  void updateDiariesHealthAtIndex(
    int index,
    DocumentReference Function(DocumentReference) updateFn,
  ) {
    diariesHealth[index] = updateFn(_diariesHealth[index]);
  }

  void insertAtIndexInDiariesHealth(int index, DocumentReference value) {
    diariesHealth.insert(index, value);
  }

  int _Health = 0;
  int get Health => _Health;
  set Health(int value) {
    _Health = value;
  }

  dynamic _diary;
  dynamic get diary => _diary;
  set diary(dynamic value) {
    _diary = value;
  }

  List<dynamic> _CompleteUserDiary = [];
  List<dynamic> get CompleteUserDiary => _CompleteUserDiary;
  set CompleteUserDiary(List<dynamic> value) {
    _CompleteUserDiary = value;
  }

  void addToCompleteUserDiary(dynamic value) {
    CompleteUserDiary.add(value);
  }

  void removeFromCompleteUserDiary(dynamic value) {
    CompleteUserDiary.remove(value);
  }

  void removeAtIndexFromCompleteUserDiary(int index) {
    CompleteUserDiary.removeAt(index);
  }

  void updateCompleteUserDiaryAtIndex(
    int index,
    dynamic Function(dynamic) updateFn,
  ) {
    CompleteUserDiary[index] = updateFn(_CompleteUserDiary[index]);
  }

  void insertAtIndexInCompleteUserDiary(int index, dynamic value) {
    CompleteUserDiary.insert(index, value);
  }

  List<NoteStruct> _listOfNotes = [];
  List<NoteStruct> get listOfNotes => _listOfNotes;
  set listOfNotes(List<NoteStruct> value) {
    _listOfNotes = value;
  }

  void addToListOfNotes(NoteStruct value) {
    listOfNotes.add(value);
  }

  void removeFromListOfNotes(NoteStruct value) {
    listOfNotes.remove(value);
  }

  void removeAtIndexFromListOfNotes(int index) {
    listOfNotes.removeAt(index);
  }

  void updateListOfNotesAtIndex(
    int index,
    NoteStruct Function(NoteStruct) updateFn,
  ) {
    listOfNotes[index] = updateFn(_listOfNotes[index]);
  }

  void insertAtIndexInListOfNotes(int index, NoteStruct value) {
    listOfNotes.insert(index, value);
  }

  int _givesLengthOffilteredJsonGiveTake = 0;
  int get givesLengthOffilteredJsonGiveTake =>
      _givesLengthOffilteredJsonGiveTake;
  set givesLengthOffilteredJsonGiveTake(int value) {
    _givesLengthOffilteredJsonGiveTake = value;
  }

  bool _changePhoto = false;
  bool get changePhoto => _changePhoto;
  set changePhoto(bool value) {
    _changePhoto = value;
  }

  String _AIMatchComponentShowClickedUserPhotoUrl = '';
  String get AIMatchComponentShowClickedUserPhotoUrl =>
      _AIMatchComponentShowClickedUserPhotoUrl;
  set AIMatchComponentShowClickedUserPhotoUrl(String value) {
    _AIMatchComponentShowClickedUserPhotoUrl = value;
  }

  String _TakeScreeshotpath = '';
  String get TakeScreeshotpath => _TakeScreeshotpath;
  set TakeScreeshotpath(String value) {
    _TakeScreeshotpath = value;
  }

  bool _MutualBenefitsAIOutPutLoadingAnimation = false;
  bool get MutualBenefitsAIOutPutLoadingAnimation =>
      _MutualBenefitsAIOutPutLoadingAnimation;
  set MutualBenefitsAIOutPutLoadingAnimation(bool value) {
    _MutualBenefitsAIOutPutLoadingAnimation = value;
  }

  dynamic _DocumnetsFromDiary;
  dynamic get DocumnetsFromDiary => _DocumnetsFromDiary;
  set DocumnetsFromDiary(dynamic value) {
    _DocumnetsFromDiary = value;
  }

  bool _recordAboutMe = false;
  bool get recordAboutMe => _recordAboutMe;
  set recordAboutMe(bool value) {
    _recordAboutMe = value;
  }

  String _userOnListName = '';
  String get userOnListName => _userOnListName;
  set userOnListName(String value) {
    _userOnListName = value;
  }

  String _mainUserName = '';
  String get mainUserName => _mainUserName;
  set mainUserName(String value) {
    _mainUserName = value;
  }

  List<String> _MainUserTakeList = [];
  List<String> get MainUserTakeList => _MainUserTakeList;
  set MainUserTakeList(List<String> value) {
    _MainUserTakeList = value;
  }

  void addToMainUserTakeList(String value) {
    MainUserTakeList.add(value);
  }

  void removeFromMainUserTakeList(String value) {
    MainUserTakeList.remove(value);
  }

  void removeAtIndexFromMainUserTakeList(int index) {
    MainUserTakeList.removeAt(index);
  }

  void updateMainUserTakeListAtIndex(
    int index,
    String Function(String) updateFn,
  ) {
    MainUserTakeList[index] = updateFn(_MainUserTakeList[index]);
  }

  void insertAtIndexInMainUserTakeList(int index, String value) {
    MainUserTakeList.insert(index, value);
  }

  String _MainUserTakes = '';
  String get MainUserTakes => _MainUserTakes;
  set MainUserTakes(String value) {
    _MainUserTakes = value;
  }

  List<String> _UserOnListTakeList = [];
  List<String> get UserOnListTakeList => _UserOnListTakeList;
  set UserOnListTakeList(List<String> value) {
    _UserOnListTakeList = value;
  }

  void addToUserOnListTakeList(String value) {
    UserOnListTakeList.add(value);
  }

  void removeFromUserOnListTakeList(String value) {
    UserOnListTakeList.remove(value);
  }

  void removeAtIndexFromUserOnListTakeList(int index) {
    UserOnListTakeList.removeAt(index);
  }

  void updateUserOnListTakeListAtIndex(
    int index,
    String Function(String) updateFn,
  ) {
    UserOnListTakeList[index] = updateFn(_UserOnListTakeList[index]);
  }

  void insertAtIndexInUserOnListTakeList(int index, String value) {
    UserOnListTakeList.insert(index, value);
  }

  List<ValuesStruct> _giveValues = [];
  List<ValuesStruct> get giveValues => _giveValues;
  set giveValues(List<ValuesStruct> value) {
    _giveValues = value;
  }

  void addToGiveValues(ValuesStruct value) {
    giveValues.add(value);
  }

  void removeFromGiveValues(ValuesStruct value) {
    giveValues.remove(value);
  }

  void removeAtIndexFromGiveValues(int index) {
    giveValues.removeAt(index);
  }

  void updateGiveValuesAtIndex(
    int index,
    ValuesStruct Function(ValuesStruct) updateFn,
  ) {
    giveValues[index] = updateFn(_giveValues[index]);
  }

  void insertAtIndexInGiveValues(int index, ValuesStruct value) {
    giveValues.insert(index, value);
  }

  List<ValuesStruct> _takeValues = [];
  List<ValuesStruct> get takeValues => _takeValues;
  set takeValues(List<ValuesStruct> value) {
    _takeValues = value;
  }

  void addToTakeValues(ValuesStruct value) {
    takeValues.add(value);
  }

  void removeFromTakeValues(ValuesStruct value) {
    takeValues.remove(value);
  }

  void removeAtIndexFromTakeValues(int index) {
    takeValues.removeAt(index);
  }

  void updateTakeValuesAtIndex(
    int index,
    ValuesStruct Function(ValuesStruct) updateFn,
  ) {
    takeValues[index] = updateFn(_takeValues[index]);
  }

  void insertAtIndexInTakeValues(int index, ValuesStruct value) {
    takeValues.insert(index, value);
  }

  bool _GPSEnabled = false;
  bool get GPSEnabled => _GPSEnabled;
  set GPSEnabled(bool value) {
    _GPSEnabled = value;
  }

  bool _info = false;
  bool get info => _info;
  set info(bool value) {
    _info = value;
  }

  bool _benifits = false;
  bool get benifits => _benifits;
  set benifits(bool value) {
    _benifits = value;
  }

  bool _rebuild = false;
  bool get rebuild => _rebuild;
  set rebuild(bool value) {
    _rebuild = value;
  }

  String _diarySpherefiltrator = '';
  String get diarySpherefiltrator => _diarySpherefiltrator;
  set diarySpherefiltrator(String value) {
    _diarySpherefiltrator = value;
  }

  dynamic _cloudFuncDiariesLoggedUser;
  dynamic get cloudFuncDiariesLoggedUser => _cloudFuncDiariesLoggedUser;
  set cloudFuncDiariesLoggedUser(dynamic value) {
    _cloudFuncDiariesLoggedUser = value;
  }

  List<int> _listOfDieariesAmount = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  List<int> get listOfDieariesAmount => _listOfDieariesAmount;
  set listOfDieariesAmount(List<int> value) {
    _listOfDieariesAmount = value;
  }

  void addToListOfDieariesAmount(int value) {
    listOfDieariesAmount.add(value);
  }

  void removeFromListOfDieariesAmount(int value) {
    listOfDieariesAmount.remove(value);
  }

  void removeAtIndexFromListOfDieariesAmount(int index) {
    listOfDieariesAmount.removeAt(index);
  }

  void updateListOfDieariesAmountAtIndex(
    int index,
    int Function(int) updateFn,
  ) {
    listOfDieariesAmount[index] = updateFn(_listOfDieariesAmount[index]);
  }

  void insertAtIndexInListOfDieariesAmount(int index, int value) {
    listOfDieariesAmount.insert(index, value);
  }

  dynamic _jsonCloudDiariesLoggedUserOutPut;
  dynamic get jsonCloudDiariesLoggedUserOutPut =>
      _jsonCloudDiariesLoggedUserOutPut;
  set jsonCloudDiariesLoggedUserOutPut(dynamic value) {
    _jsonCloudDiariesLoggedUserOutPut = value;
  }

  List<double> _BalanceAnalisysList = [0.0, 0.0, 0.0, 0.51];
  List<double> get BalanceAnalisysList => _BalanceAnalisysList;
  set BalanceAnalisysList(List<double> value) {
    _BalanceAnalisysList = value;
  }

  void addToBalanceAnalisysList(double value) {
    BalanceAnalisysList.add(value);
  }

  void removeFromBalanceAnalisysList(double value) {
    BalanceAnalisysList.remove(value);
  }

  void removeAtIndexFromBalanceAnalisysList(int index) {
    BalanceAnalisysList.removeAt(index);
  }

  void updateBalanceAnalisysListAtIndex(
    int index,
    double Function(double) updateFn,
  ) {
    BalanceAnalisysList[index] = updateFn(_BalanceAnalisysList[index]);
  }

  void insertAtIndexInBalanceAnalisysList(int index, double value) {
    BalanceAnalisysList.insert(index, value);
  }

  List<double> _removeNegativeSignsForDiaryAnalis = [];
  List<double> get removeNegativeSignsForDiaryAnalis =>
      _removeNegativeSignsForDiaryAnalis;
  set removeNegativeSignsForDiaryAnalis(List<double> value) {
    _removeNegativeSignsForDiaryAnalis = value;
  }

  void addToRemoveNegativeSignsForDiaryAnalis(double value) {
    removeNegativeSignsForDiaryAnalis.add(value);
  }

  void removeFromRemoveNegativeSignsForDiaryAnalis(double value) {
    removeNegativeSignsForDiaryAnalis.remove(value);
  }

  void removeAtIndexFromRemoveNegativeSignsForDiaryAnalis(int index) {
    removeNegativeSignsForDiaryAnalis.removeAt(index);
  }

  void updateRemoveNegativeSignsForDiaryAnalisAtIndex(
    int index,
    double Function(double) updateFn,
  ) {
    removeNegativeSignsForDiaryAnalis[index] =
        updateFn(_removeNegativeSignsForDiaryAnalis[index]);
  }

  void insertAtIndexInRemoveNegativeSignsForDiaryAnalis(
      int index, double value) {
    removeNegativeSignsForDiaryAnalis.insert(index, value);
  }

  List<double> _ListProgreBarPercentageValues = [];
  List<double> get ListProgreBarPercentageValues =>
      _ListProgreBarPercentageValues;
  set ListProgreBarPercentageValues(List<double> value) {
    _ListProgreBarPercentageValues = value;
  }

  void addToListProgreBarPercentageValues(double value) {
    ListProgreBarPercentageValues.add(value);
  }

  void removeFromListProgreBarPercentageValues(double value) {
    ListProgreBarPercentageValues.remove(value);
  }

  void removeAtIndexFromListProgreBarPercentageValues(int index) {
    ListProgreBarPercentageValues.removeAt(index);
  }

  void updateListProgreBarPercentageValuesAtIndex(
    int index,
    double Function(double) updateFn,
  ) {
    ListProgreBarPercentageValues[index] =
        updateFn(_ListProgreBarPercentageValues[index]);
  }

  void insertAtIndexInListProgreBarPercentageValues(int index, double value) {
    ListProgreBarPercentageValues.insert(index, value);
  }

  List<String> _ColorFromStringForProgresBarr = [];
  List<String> get ColorFromStringForProgresBarr =>
      _ColorFromStringForProgresBarr;
  set ColorFromStringForProgresBarr(List<String> value) {
    _ColorFromStringForProgresBarr = value;
  }

  void addToColorFromStringForProgresBarr(String value) {
    ColorFromStringForProgresBarr.add(value);
  }

  void removeFromColorFromStringForProgresBarr(String value) {
    ColorFromStringForProgresBarr.remove(value);
  }

  void removeAtIndexFromColorFromStringForProgresBarr(int index) {
    ColorFromStringForProgresBarr.removeAt(index);
  }

  void updateColorFromStringForProgresBarrAtIndex(
    int index,
    String Function(String) updateFn,
  ) {
    ColorFromStringForProgresBarr[index] =
        updateFn(_ColorFromStringForProgresBarr[index]);
  }

  void insertAtIndexInColorFromStringForProgresBarr(int index, String value) {
    ColorFromStringForProgresBarr.insert(index, value);
  }

  bool _WalkthroughFilterBySpheres = false;
  bool get WalkthroughFilterBySpheres => _WalkthroughFilterBySpheres;
  set WalkthroughFilterBySpheres(bool value) {
    _WalkthroughFilterBySpheres = value;
  }

  bool _walkthroughOptimizer = false;
  bool get walkthroughOptimizer => _walkthroughOptimizer;
  set walkthroughOptimizer(bool value) {
    _walkthroughOptimizer = value;
  }

  bool _maxlineControl = false;
  bool get maxlineControl => _maxlineControl;
  set maxlineControl(bool value) {
    _maxlineControl = value;
  }

  int _maxLineTextLimiter = 5;
  int get maxLineTextLimiter => _maxLineTextLimiter;
  set maxLineTextLimiter(int value) {
    _maxLineTextLimiter = value;
  }

  List<bool> _MapSphereFilterImageIsHighlighted = [
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false
  ];
  List<bool> get MapSphereFilterImageIsHighlighted =>
      _MapSphereFilterImageIsHighlighted;
  set MapSphereFilterImageIsHighlighted(List<bool> value) {
    _MapSphereFilterImageIsHighlighted = value;
  }

  void addToMapSphereFilterImageIsHighlighted(bool value) {
    MapSphereFilterImageIsHighlighted.add(value);
  }

  void removeFromMapSphereFilterImageIsHighlighted(bool value) {
    MapSphereFilterImageIsHighlighted.remove(value);
  }

  void removeAtIndexFromMapSphereFilterImageIsHighlighted(int index) {
    MapSphereFilterImageIsHighlighted.removeAt(index);
  }

  void updateMapSphereFilterImageIsHighlightedAtIndex(
    int index,
    bool Function(bool) updateFn,
  ) {
    MapSphereFilterImageIsHighlighted[index] =
        updateFn(_MapSphereFilterImageIsHighlighted[index]);
  }

  void insertAtIndexInMapSphereFilterImageIsHighlighted(int index, bool value) {
    MapSphereFilterImageIsHighlighted.insert(index, value);
  }

  bool _ToggleMapOnList = false;
  bool get ToggleMapOnList => _ToggleMapOnList;
  set ToggleMapOnList(bool value) {
    _ToggleMapOnList = value;
  }

  List<bool> _MapSphereFilterImageTAKEisHighted = [
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false
  ];
  List<bool> get MapSphereFilterImageTAKEisHighted =>
      _MapSphereFilterImageTAKEisHighted;
  set MapSphereFilterImageTAKEisHighted(List<bool> value) {
    _MapSphereFilterImageTAKEisHighted = value;
  }

  void addToMapSphereFilterImageTAKEisHighted(bool value) {
    MapSphereFilterImageTAKEisHighted.add(value);
  }

  void removeFromMapSphereFilterImageTAKEisHighted(bool value) {
    MapSphereFilterImageTAKEisHighted.remove(value);
  }

  void removeAtIndexFromMapSphereFilterImageTAKEisHighted(int index) {
    MapSphereFilterImageTAKEisHighted.removeAt(index);
  }

  void updateMapSphereFilterImageTAKEisHightedAtIndex(
    int index,
    bool Function(bool) updateFn,
  ) {
    MapSphereFilterImageTAKEisHighted[index] =
        updateFn(_MapSphereFilterImageTAKEisHighted[index]);
  }

  void insertAtIndexInMapSphereFilterImageTAKEisHighted(int index, bool value) {
    MapSphereFilterImageTAKEisHighted.insert(index, value);
  }

  bool _OnMarkerClickToggleTakeGive = false;
  bool get OnMarkerClickToggleTakeGive => _OnMarkerClickToggleTakeGive;
  set OnMarkerClickToggleTakeGive(bool value) {
    _OnMarkerClickToggleTakeGive = value;
  }

  String _aboutMe = '';
  String get aboutMe => _aboutMe;
  set aboutMe(String value) {
    _aboutMe = value;
  }

  bool _GMapTableBool = true;
  bool get GMapTableBool => _GMapTableBool;
  set GMapTableBool(bool value) {
    _GMapTableBool = value;
  }

  bool _record2 = true;
  bool get record2 => _record2;
  set record2(bool value) {
    _record2 = value;
  }
}
