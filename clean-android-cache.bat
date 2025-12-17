@echo off
setlocal enabledelayedexpansion

echo Cleaning Android cache for Capacitor project...
echo.

:: Clean Gradle cache
cd android
if exist ".gradle" (
    echo Cleaning Gradle cache...
    rmdir /s /q ".gradle"
)

:: Clean app build cache
cd app
if exist "build" (
    echo Cleaning app build cache...
    rmdir /s /q "build"
)

:: Clean web assets specifically
if exist "src\main\assets" (
    echo Cleaning web assets...
    rmdir /s /q "src\main\assets"
)

:: Clean intermediate assets
if exist "build\intermediates\assets" (
    echo Cleaning intermediate assets...
    rmdir /s /q "build\intermediates\assets"
)

cd ..\..

echo.
echo Cache cleaning complete!
echo You can now run:
echo   npx cap sync
echo   npx cap copy
echo   Then rebuild in Android Studio

echo.
pause