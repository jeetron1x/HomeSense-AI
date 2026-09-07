# HomeSense AI — Android Studio & Export Guide

This project has been fully configured with a native **Android Studio** project in the `android/` directory using **Capacitor**.

You can now open, modify, debug, and build APKs for **HomeSense AI** directly inside **Android Studio**.

---

## 1. How to Transfer / Export this Project

### Method A: Download ZIP from Google AI Studio
1. In the Google AI Studio top bar / header, click the **Settings / Menu** icon (or **Export / Download**).
2. Choose **Download as ZIP** or **Export to GitHub**.
3. Extract the downloaded ZIP archive on your computer.

### Method B: Pull from your GitHub Repository
If synced with your GitHub repository (`https://github.com/jeetron1x/HomeSense-AI`):
```bash
git clone https://github.com/jeetron1x/HomeSense-AI.git
cd HomeSense-AI
```

---

## 2. Opening in Android Studio

1. Launch **Android Studio** on your computer.
2. Select **Open** (or **File > Open**).
3. Navigate into this project's folder and select the **`android`** subdirectory (`/android`).
4. Click **OK / Open**.
5. Android Studio will automatically initialize Gradle, index the project, and sync dependencies.

---

## 3. Project Structure in Android Studio

- **`android/app/src/main/AndroidManifest.xml`**: Native Android permissions (Microphone, Camera, Torch, Vibration, Internet) and Application manifest.
- **`android/app/src/main/java/ai/homesense/app/MainActivity.java`**: Android entry activity hosting the native bridge.
- **`android/app/src/main/assets/public/`**: Bundled production app assets (screens, sensors, models, auditory monitors).
- **`android/app/build.gradle`**: Android app dependencies, SDK targets, version codes.

---

## 4. Developing & Modifying

### To test changes made in web / React:
Whenever you modify files in `src/`:
```bash
npm run cap:build
```
This builds the latest web bundle and syncs it directly into the `android/` directory.

### To launch Android Studio directly from terminal:
```bash
npm run cap:open
```

### To run on a connected Android device or Emulator:
In Android Studio:
1. Select your device or emulator in the device selector toolbar.
2. Click the green **Run (▶)** button (or press `Shift + F10`).
3. To generate an APK:
   - Go to **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
   - The compiled `.apk` will be in `android/app/build/outputs/apk/debug/app-debug.apk`.

---

## 5. Continuing in Google AI Studio (Antigravity)
If you prefer to continue modifying the app with AI directly:
- You can prompt the AI assistant anytime in Google AI Studio.
- All modifications are reflected immediately and automatically synced when running `npm run cap:build`.
