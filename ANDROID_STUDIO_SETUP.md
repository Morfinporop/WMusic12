# WMusic Android Studio Setup

1. Build web bundle:
   npm run build

2. Install Capacitor (if not installed yet):
   npm install @capacitor/core @capacitor/cli @capacitor/android

3. Initialize Android platform:
   npx cap add android

4. Sync web files to Android project:
   npx cap sync android

5. Open in Android Studio:
   npx cap open android

6. In Android Studio:
   Set minSdk and targetSdk as needed
   Build APK/AAB

Notes:
- Capacitor config is already prepared in `capacitor.config.ts`.
- PWA manifest and service worker are in `public/`.
- For production API, point the app to your Railway domain in `src/api.ts` if you need fixed host routing.