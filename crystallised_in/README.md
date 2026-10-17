# Synera application setup

This directory is the Synera Flutter application root. The internal package remains `crystallised_in`; existing UI and platform labels still contain earlier product names.

These are restoration instructions, not a record of a successful build. The audit host has no Flutter or Dart command on PATH. Installing tooling or dependencies is a separate approved step.

## Toolchain evidence

| Component | Checked-in evidence | Restoration decision |
| --- | --- | --- |
| Dart | Manifest `>=3.0.0 <4.0.0`; lockfile `>=3.5.0 <4.0.0` | Respect the tighter lockfile constraint |
| Flutter | Lockfile `>=3.22.0`; source uses `WidgetStateProperty` | Find a compatible version and record an actual build; no version is accepted yet |
| Android | AGP 7.3.0, Kotlin 1.8.10, Gradle 7.5, compile/target SDK 34 | Preserve these initially; diagnose one mismatch at a time |
| Cloud Functions | Both packages declare Node 18 | Requires a supported runtime before redeployment |
| Local audit tools | Python 3.12.10 and Node 24.16.0 | Used only for static checks and stubbed handler probes |

A possible historical reproduction candidate is Flutter 3.24.5 / Dart 3.5.4 from the [official SDK archive](https://docs.flutter.dev/install/archive). This is an inference from constraints, not a recommendation for production or a verified working toolchain.

## Restore in this order

1. Confirm ownership/access to the Firebase project and decide whether the first demo uses a dedicated development project. Record aliases and responsibilities, not credentials, in the [account checklist](../docs/SECURITY_AND_ACCOUNTS.md).
2. Preserve the lockfile and current source commit before making dependency changes. Do not run an automatic major-version upgrade as the first step.
3. Check tool availability, then install a selected toolchain only with approval. Record `flutter --version`, `dart --version`, `java -version`, and `flutter doctor -v` locally without publishing machine/account details.
4. Ensure a full application checkout is available. The audit used a sparse checkout that intentionally omits assets and generated directories; it cannot establish asset/build completeness.
5. Validate platform registrations: Android application ID must match `android/app/google-services.json`; the iOS bundle ID must match its Firebase registration and signing setup; web auth domains and Maps restrictions must match the demo origin.
6. After dependency installation is approved, run the commands below from this directory, capture results, and fix one failing layer at a time.

```powershell
flutter pub get
flutter analyze
flutter test
```

The current `test/widget_test.dart` only mounts `MyApp`; it has no assertions and does not initialize the Firebase/provider setup used in `main()`. Replace it with focused tests and use the [acceptance checklist](../docs/ACCEPTANCE.md) before claiming a successful user journey.

## Running and building

Only after security fixes and an approved demo backend are in place:

```powershell
flutter devices
flutter run -d <selected-device-id>
flutter build apk --debug
```

These commands were not executed in the audit. A web build does not verify microphone or location permissions on Android; an Android debug build does not verify iOS.

The Android release block currently uses debug signing (`android/app/build.gradle:69`). Establish release signing and confirm ownership of the existing package/store listing before making any package ID or signing change.

Do not run Flutter from `android/`: its own `pubspec.yaml` and `lib/main.dart` describe a counter sample. Preserve it until its removal is explicitly approved.

## Backend restoration

[`firebase/firebase.json`](firebase/firebase.json) configures two Functions codebases, Firestore rules/indexes, Storage rules, and hosting. The hosting target is `public`, whose directory is absent from the tracked source at the audited commit. The generated Functions `compile` script references an absent `tsconfig.template.json`; it is not a validated build command.

Node 18 passed its Cloud Functions decommission date on 2025-10-30. Node 22 is currently listed for both first-generation and newer functions; select it as a migration candidate and verify the existing dependencies and auth trigger before any deployment. See [Google's runtime schedule](https://docs.cloud.google.com/functions/docs/runtime-support).

The existing npm `serve`/`shell` scripts select a legacy Firebase project. Do not use them for an isolated test until emulator routing is explicit for every service. Never invoke application AI paths with real credentials as a build check.
