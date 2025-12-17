# Android App Issues Solution Guide

This guide addresses the two main issues you're experiencing with the Android app.

## Issue 1: Cannot Login to Local Server

### Root Cause
The main problem is that you're trying to connect to `http://localhost:3000` from your Android device, but on Android, `localhost` refers to the device itself, not your development PC running the Docker container.

### Solution Steps

#### 1. Use Your Computer's Local IP Address
Instead of `localhost`, use your computer's local network IP address:

```
http://192.168.1.X:3000
```

**How to find your computer's IP:**
- **Windows**: Run `ipconfig` in Command Prompt and look for "IPv4 Address"
- **Mac/Linux**: Run `ifconfig` or `ip a` and look for your WiFi interface
- Make sure your phone is connected to the same WiFi network as your computer

#### 2. Configuration Changes Made

**`capacitor.config.ts`**:
- Changed `androidScheme` from `'https'` to `'http'` to allow HTTP connections for local development
- This allows your app to connect to your local HTTP server

**`android/app/src/main/AndroidManifest.xml`**:
- Already has `android:usesCleartextTraffic="true"` which allows HTTP connections
- This is essential for connecting to non-HTTPS servers during development

**`services/authService.ts`**:
- Enhanced error handling with specific messages for common issues
- Added timeouts to prevent hanging connections
- Better validation of server responses
- Specific error messages for localhost issues on mobile devices

#### 3. Server Configuration

Your `server.js` already has proper CORS configuration:
```javascript
app.use(cors());
```

And it's binding to `0.0.0.0` which is correct for Docker networking:
```javascript
app.listen(PORT, '0.0.0.0', () => {
```

#### 4. Troubleshooting Steps

If you still can't connect:

1. **Verify server is running**: Check that your Docker container is running and the server is accessible
   ```bash
   docker ps
   curl http://localhost:3000
   ```

2. **Test from another device**: Try accessing `http://YOUR_COMPUTER_IP:3000` from another computer or your phone's browser

3. **Check firewall settings**: Make sure your computer's firewall allows incoming connections on port 3000

4. **Test with different ports**: If port 3000 is blocked, try changing the port in both server.js and your app

5. **Check Docker networking**: If using Docker, make sure the port is properly exposed:
   ```bash
   docker run -p 3000:3000 your-image
   ```

6. **Use ngrok for testing** (alternative):
   ```bash
   ngrok http 3000
   ```
   Then use the ngrok URL in your app

### Common Error Messages and Fixes

- **"Connection timeout"**: Server is not reachable. Check IP address and network connection.
- **"Network error"**: Server might be down or firewall blocking the connection.
- **"On mobile devices, use your computer's IP"**: You're using localhost on a mobile device.
- **"Failed to fetch"**: Network connectivity issue or CORS problem.

## Issue 2: Cannot Download Excel File

### Root Cause
The Excel export functionality uses Capacitor's Filesystem plugin to write the file and then the Share plugin to share it. The issue is likely with:

1. **File writing permissions** in the cache directory
2. **Base64 encoding/decoding** issues
3. **URI format problems** when sharing the file

### Solution Steps

#### 1. Configuration Changes Made

**`components/DataControls.tsx`**:
- Enhanced the Excel export function with better error handling
- Added proper encoding specification (`Encoding.UTF8`)
- Improved file URI handling for Android sharing
- Added FileProvider support for proper content URIs
- Added detailed logging to help diagnose issues
- Enhanced error messages with specific troubleshooting advice

#### 2. File System Permissions

The app should already have the necessary permissions since:
- We're using `Directory.Cache` which doesn't require special permissions
- The FileProvider is already configured in `AndroidManifest.xml`

#### 3. Troubleshooting Steps

If Excel export still doesn't work:

1. **Check the logs**: The enhanced version now logs detailed information:
   - File name and size
   - Writing success/failure
   - URI conversion process
   - Sharing attempt

2. **Try alternative approaches**:
   - **Use Documents directory** (requires storage permission):
     ```typescript
     directory: Directory.Documents
     ```
   - **Use base64 array buffer** instead of string:
     ```typescript
     const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
     const base64 = btoa(String.fromCharCode.apply(null, wbout));
     ```

3. **Check Android logcat** for detailed error messages:
   ```bash
   adb logcat | grep Capacitor
   ```

4. **Test with smaller datasets**: Large Excel files might cause memory issues

5. **Verify plugin installation**: Make sure Capacitor plugins are properly installed:
   ```bash
   npm install @capacitor/filesystem @capacitor/share
   npx cap sync
   ```

#### 4. Alternative Export Methods

If the Filesystem approach continues to fail, you can try:

**Method 1: Direct Download via Server**
```typescript
// Send data to server, have server generate Excel and return download URL
const response = await fetch('http://your-server/generate-excel', {
    method: 'POST',
    body: JSON.stringify(exportData)
});
const downloadUrl = await response.text();
// Open download URL
```

**Method 2: Use Blob on Web and Share on Native**
```typescript
if (isNative) {
    // Current approach with Filesystem
} else {
    // Web approach with blob
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    // ... download logic
}
```

## General Troubleshooting for Both Issues

### 1. Clear Caches Properly

Since you mentioned caching issues, use the provided solution:

```bash
# Run the cache cleaning script
clean-android-cache.bat

# Or manually clean
rm -rf android/.gradle/
rm -rf android/app/build/
rm -rf android/app/src/main/assets/
```

### 2. Verify App Updates

Make sure your changes are actually being deployed:

1. **Build your frontend**:
   ```bash
   npm run build
   ```

2. **Sync with Capacitor**:
   ```bash
   npx cap sync
   npx cap copy
   ```

3. **Clean and rebuild Android**:
   ```bash
   cd android
   ./gradlew clean
   ./gradlew assembleDebug
   ```

4. **Uninstall old app**: Sometimes the old APK is cached on the device

### 3. Network Debugging

For server connection issues:

1. **Check server logs**: Your server.js has request logging enabled
2. **Use Android's network inspector**: Check if requests are actually being made
3. **Test with Postman**: Verify your API endpoints work independently
4. **Use Charles Proxy or Fiddler**: Inspect network traffic between app and server

### 4. File System Debugging

For Excel export issues:

1. **Check file permissions**:
   ```bash
   adb shell ls -la /data/data/your.app.package/cache/
   ```

2. **Test file writing**:
   ```typescript
   // Add this test code temporarily
   try {
       await Filesystem.writeFile({
           path: 'test.txt',
           data: 'Hello World',
           directory: Directory.Cache,
           encoding: Encoding.UTF8
       });
       console.log('File system working!');
   } catch (e) {
       console.error('File system error:', e);
   }
   ```

## Verification Steps

### For Server Connection:

1. ✅ Change server URL from `localhost` to your computer's IP
2. ✅ Make sure server is running and accessible
3. ✅ Check that `androidScheme: 'http'` is set in capacitor.config.ts
4. ✅ Verify `usesCleartextTraffic="true"` in AndroidManifest.xml
5. ✅ Test with a simple endpoint first (e.g., `http://YOUR_IP:3000/api/login`)

### For Excel Export:

1. ✅ Check console logs for file writing success/failure
2. ✅ Verify the Filesystem plugin is properly installed
3. ✅ Test with a small dataset first
4. ✅ Check Android logcat for detailed errors
5. ✅ Try the alternative approaches if needed

## Final Notes

Both issues should now be resolved with the configuration changes and enhanced error handling. The key fixes are:

1. **Server Connection**: Use computer's IP instead of localhost, allow HTTP in Capacitor config
2. **Excel Export**: Better error handling, proper encoding, FileProvider support

If you still experience issues, the enhanced logging should provide clear error messages to guide further troubleshooting.