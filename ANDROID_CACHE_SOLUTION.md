# Android Cache Solution for Capacitor

This document explains how to resolve caching issues when using `npx cap sync` with Android Studio.

## The Problem

When you run `npx cap sync` to push frontend changes to Android, the changes don't appear immediately because:

1. **Gradle caching**: Gradle aggressively caches build outputs including web assets
2. **Android Studio caching**: The IDE caches resources and doesn't always detect changes
3. **Capacitor asset copying**: Web assets are copied to Android's assets folder but may not trigger rebuilds

## Solutions Implemented

### 1. Gradle Configuration Changes

We've made several changes to your Gradle configuration:

#### In `android/gradle.properties`:
- Added `org.gradle.caching=false` to disable Gradle's build caching
- Increased JVM heap size for better performance

#### In `android/app/build.gradle`:
- Added `afterEvaluate` block to disable caching for resource processing tasks
- Added custom `cleanWebAssets` task that specifically targets web asset directories
- Made the standard `clean` task depend on `cleanWebAssets`

### 2. Manual Cache Cleaning Script

Created `clean-android-cache.bat` that you can run to clean specific caches without resetting Android Studio.

## Recommended Workflow

### Option 1: Quick Sync (Recommended for most changes)

```bash
# Build your frontend
npm run build

# Sync with Capacitor
npx cap sync

# Clean specific caches and rebuild
cd android
./gradlew cleanWebAssets
./gradlew assembleDebug

# Back to project root
cd ..
```

### Option 2: Full Clean (For major changes or when issues persist)

```bash
# Build your frontend
npm run build

# Run the cache cleaning script
clean-android-cache.bat

# Sync with Capacitor
npx cap sync

# Rebuild everything
cd android
./gradlew clean
./gradlew assembleDebug

# Back to project root
cd ..
```

### Option 3: Using the Batch File (Simplest)

Just double-click `clean-android-cache.bat` and follow the instructions.

## Alternative: Selective Cache Cleaning

If you want to manually clean specific directories without using the script:

```bash
# Clean Gradle cache
rm -rf android/.gradle/

# Clean app build outputs
rm -rf android/app/build/

# Clean web assets specifically
rm -rf android/app/src/main/assets/
rm -rf android/app/build/intermediates/assets/
```

## Android Studio Tips

1. **Disable Instant Run**: Go to `File > Settings > Build, Execution, Deployment > Instant Run` and uncheck "Enable Instant Run"

2. **Enable "Build project automatically"**: Go to `File > Settings > Build, Execution, Deployment > Compiler` and check "Build project automatically"

3. **Use "Rebuild Project" instead of "Build"**: The Rebuild option (Ctrl+F9) does a cleaner build than regular Build

## Troubleshooting

### If changes still don't appear:

1. **Check the web assets location**: Verify that `android/app/src/main/assets/public/` contains your updated files
2. **Check Android Studio's log**: Look for any asset copying or caching messages
3. **Try invalidating caches**: `File > Invalidate Caches / Restart` (but this should be rare now)
4. **Check device storage**: Sometimes the APK is cached on the device - uninstall the app first

### Common cache locations:

- `android/.gradle/` - Gradle build cache
- `android/app/build/` - App build outputs
- `android/app/src/main/assets/` - Web assets copied by Capacitor
- `android/app/build/intermediates/assets/` - Processed assets

## Performance Considerations

Disabling caching will make builds slightly slower, but ensures you always get the latest changes. For production builds, you can temporarily re-enable caching by:

1. Commenting out `org.gradle.caching=false` in `gradle.properties`
2. Running a full clean build
3. Then uncommenting it again for development

## Verifying the Solution

To test if the caching issue is resolved:

1. Make a visible change to your frontend (e.g., change background color)
2. Run the recommended workflow
3. Install the APK on a device/emulator
4. Verify the change appears immediately

If it works, the solution is successful!

## Additional Resources

- [Capacitor Android Guide](https://capacitorjs.com/docs/android)
- [Gradle Caching Documentation](https://docs.gradle.org/current/userguide/build_cache.html)
- [Android Studio Cache Management](https://developer.android.com/studio/intro/studio-config#cache)