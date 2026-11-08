# ABC Kids: run, test, and publish

This project uses React Native 0.88.1 and React 19.3.0. Keep the new project's Android configuration; do not copy the old Android project over it. The copied app is now connected to App.tsx.

Verified on November 6, 2026: Android arm64 debug APK build, production JavaScript bundling, asset/import checks, TypeScript, and 83 automated tests. Device checks include portrait startup, landscape layouts, a measured animal drag that remains matched after rotation, balloon gameplay, coloring progress across rotation, and canvas-only PNG export. Small-phone and tablet viewport resizing is also covered automatically; physical tablet testing remains part of release checks. A signed Play Store release bundle still needs the release checks below. The debug APK is at `android/app/build/outputs/apk/debug/app-debug.apk` and needs Metro running for development use.

The production dependency audit reports four low-severity findings in the CLI/deepmerge dependency chain. The initial full install reported 17 low/moderate findings across development and production dependencies. These are not all resolved; review them before release. npm's suggested CLI downgrade is incompatible with this migration, so it was not applied.

## 1. Restore and check the old assets

The old `android/app/src/main/res/raw` folder has been copied into this project. Fonts have also been copied into `android/app/src/main/assets/fonts`.

From the project directory in PowerShell:

```powershell
npm.cmd run check:migration
```

This checks source imports, declared dependencies, bundled fonts, and referenced Android sound files. Rerun it after changing or copying assets. It does not validate the content or licensing of those files.

## 2. Install dependencies

Node 24 and Java 17 were found on this computer. The Android SDK, build tools 37.0.0, and NDK 27.1.12297006 are installed.

The required dependencies are already installed. For a fresh checkout, run:

```powershell
npm.cmd ci
```

The postinstall script applies the committed patches for react-native-tts 4.1.1 and react-native-orientation-locker 1.7.0. They fix obsolete Gradle configuration and Android namespaces. Keep the patches directory. Investigate patch failures before upgrading those packages.

Do not run `npm audit fix --force` as an upgrade strategy; it can change React Native's dependency versions incompatibly.

## 3. Start the app on Android

Start a phone emulator from Android Studio's Device Manager, or enable Developer options and USB debugging on a physical Android phone. Connect it and accept its USB debugging prompt.

```powershell
adb devices
```

There should be a device marked `device`, rather than `unauthorized`.

Open two PowerShell terminals in the project directory. In terminal 1:

```powershell
npm.cmd start
```

In terminal 2:

```powershell
npm.cmd run android
```

If a USB phone cannot reach Metro:

```powershell
adb reverse tcp:8081 tcp:8081
```

After installing or changing native packages, rebuild with `npm.cmd run android`; reloading JavaScript alone is insufficient. Use `npm.cmd start -- --reset-cache` only when troubleshooting stale Metro output.

## 4. Verify the migrated app

```powershell
npm.cmd run check:migration
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test -- --runInBand
```

Unused legacy demo screens still have style and unused-variable lint warnings. The active screens use responsive grids and shared activity layouts. Jest covers the application shell, balloon lifecycle, coloring and gallery-export failures, grid sizing, measured drop coordinates, and game-state preservation during portrait/landscape resizing. These checks do not replace device testing.

Android uses `screenOrientation="user"`: phones normally start in portrait and follow the device's Auto-rotate preference. Individual screens do not force an orientation. Enable Auto-rotate in Android Quick Settings to turn the phone between portrait and landscape. Larger Android windows can override orientation requests; layouts adapt to the available window size. Rotation must keep selected numbers, addition answers, memory cards, matched animals and filled sketch regions. An active drag resets to its starting position when the window changes; completed matches stay completed. iOS declares portrait and both landscape orientations, but iOS runtime testing requires a Mac/device.

Test each activity on a small phone and a tablet:

- Letters and all 26 pronunciations, number keyboard, addition, and animal/bird sounds.
- Matching: correct and incorrect drops, completion, replay, and targets on different screen sizes. The active animal and letter games measure each target in window coordinates rather than using fixed pixel ranges. Also check the tap-an-item / tap-its-match alternative.
- Memory: tapping the same card twice, matched pairs, incorrect pairs, win, and replay.
- Balloons: scoring, timeout, win/loss, and replay.
- Coloring: open all six vector sketches. Pick a crayon and tap an enclosed part; adjacent parts and outlines should stay unchanged. Check recoloring, Eraser (one part), Undo/Redo, Reset and undoing Reset. Reopen the same template to check automatic saving of editable colours. On Android, Save also exports a 1200 × 1200 PNG of only the white canvas and coloured sketch to Pictures/ABC Kids (visible in the gallery). The palette, toolbars, labels, border and popup are excluded. The success popup appears only after the gallery write succeeds and closes after three seconds. Android 9 and older request write-storage permission; Android 10+ add the app's own image using MediaStore without photo-reading permission ([Android storage documentation](https://developer.android.com/training/data-storage/shared/media)). Gallery export is Android-only; editable colours still save locally on iOS. Rebuild the Android app when changing DrawingGalleryModule/Package. Region fills use a separate versioned storage key; previous freehand strokes are retained in their old storage but are not converted to the new sketches. Increment the drawing version if region IDs or their meaning change in future releases.
- Poems: play, pause, resume, switch songs, stop, go back, and background the app. Songs stop at the end rather than automatically starting the next track.
- Phone activity: dial, answer, hang up, repeated taps, and leaving during a call.
- Android Back, navigation back to Home, portrait/landscape changes, cutouts, gesture navigation, and larger fonts.
- Background/foreground the app, lock/unlock the phone, and relaunch after Android kills it.
- Test without a network connection. Install/download an English voice in Android's text-to-speech settings if pronunciation is unavailable. Available offline voices depend on the device's speech engine.

Review the educational labels and their matching animal sounds/images before publication. Unused copied demo screens and headers remain in the source tree but are not part of the Home activities; review them before adding new navigation routes.

For a standalone release-mode test APK that bundles JavaScript:

```powershell
cd android
.\gradlew.bat assembleRelease
cd ..
```

Without an upload key this produces an unsigned APK, which cannot be installed directly. Configure signing in step 5 first to produce an installable release APK. Test release mode before submitting to Google Play.

## 5. Set the app identity and create the upload key

The current Android application ID is `com.abckids`. Because the old app was never published, choose the final unique ID now. If changing it, coordinate the applicationId, namespace, Kotlin package declarations/directory, and app registration rather than changing one file casually. The application ID is permanent for a Play listing.

Confirm the app name and replace the template launcher icons using Android Studio's Image Asset tool. Set `versionCode` and `versionName` in `android/app/build.gradle`; increase versionCode for every Play upload.

Generate your upload key from the project root. This command prompts for passwords instead of putting them in command history:

```powershell
keytool -genkeypair -v -storetype PKCS12 -keystore android/app/abckids-upload.keystore -alias abckids-upload -keyalg RSA -keysize 2048 -validity 10000
```

Copy `android/keystore.properties.example` to `android/keystore.properties` and fill in your actual credentials. `storeFile` is relative to the android directory. These credentials and keystore files are ignored by Git. Back up the key and passwords securely outside the project; do not share them in chat.

Release builds no longer use the template debug signing key. The Play bundle task requires upload signing to be configured.

## 6. Build the Play Store bundle

After all device tests pass and signing is configured:

```powershell
npm.cmd run android:bundle
```

Output:

```text
android/app/build/outputs/bundle/release/app-release.aab
```

The script first runs the migration asset checks. Build the bundle for all configured architectures; the arm64-only command used for a quicker development build is not the final distribution build.

The project targets API 36. Google Play currently requires API 36 or higher for ordinary new apps and updates: [target API requirements](https://developer.android.com/google/play/requirements/target-sdk).

React Native contains native libraries, so check the final release's 16 KB page-size compatibility, including ELF and ZIP alignment, and test on a 16 KB emulator. A modern NDK or a successful build alone is not proof: [Android's 16 KB guide](https://developer.android.com/guide/practices/page-sizes).

## 7. Submit through Play Console

1. Complete the developer account's verification and create the app with its final identity.
2. Prepare the app icon, feature graphic, accurate screenshots, title, short/full description, support email, and a public privacy policy. Confirm commercial-use rights for images, animations, fonts, music, and recordings.
3. Complete App content: app access, ads declaration, target audience, content rating, and Data safety based on the actual final app and every included SDK.
4. This is a children's educational app. Select its real age groups and follow the [Families policies](https://support.google.com/googleplay/android-developer/answer/9893335). These cover content, data handling, and any ads/monetization. The current migrated code does not integrate an ads or purchase SDK; adding one requires another review. Disclose local drawing storage accurately and assess any network-based text-to-speech voices before making privacy claims.
5. Enroll in Play App Signing and upload the signed AAB to Internal testing. Install the Play-delivered build, review pre-launch reports, and resolve crashes and compatibility issues.
6. If yours is a personal developer account created after November 13, 2023, Google currently requires a closed test with at least 12 continuously opted-in testers for 14 days before applying for production access: [testing requirements](https://support.google.com/googleplay/android-developer/answer/14151465).
7. Complete any required closed testing, apply for production access if applicable, and submit the production release after review of the final listing and policies.

## Scope of this migration

Completed code changes include app/navigation wiring, missing dependencies, Android fonts and orientation integration, a drawing-library replacement, consolidated sound playback, speech initialization error handling, modern Redux Toolkit store configuration, broken imports, duplicate style keys, and several game logic fixes.

Android is the verified build target for this work. iOS still needs its native orientation/font configuration, CocoaPods installation, and testing on macOS. No app has been uploaded or published by these changes. Device behavior and release readiness must be confirmed using the steps above.
