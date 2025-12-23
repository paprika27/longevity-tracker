
# 🔬 Longevity Tracker

A privacy-focused, evidence-based biological dashboard. This application treats the human body as a complex system, applying engineering principles to health optimization.

## 🌟 Key Features

*   **Holistic Balance Radar:** Visualization of performance vs. clinical markers.
*   **Automatic VO2max Estimations:** Field-test math for rowing, running, and resting vitals.
*   **Protocol-First Regimen:** A built-in Markdown editor for your longevity schedule.
*   **Psychosocial Metrics:** Tracking social connection density (3-5 interactions/week goal).
*   **Privacy First:** Local-first storage with optional self-hosted sync.

---

## 🧬 Science & Mathematics

The app uses several validated physiological models to calculate your performance metrics:

### 1. VO2max (RHR-based)
Utilizes the **Uth-Sørensen-Overgaard-Pedersen** formula.
> **Formula:** `15.3 * (Max HR / Resting HR)`
> *Where Max HR is estimated as `220 - Age`.*
> *Source: Uth et al. (2004)*

### 2. VO2max (5K Run)
Uses a second-order polynomial regression based on the **Daniels-Gilbert (VDOT)** "Oxygen Power" curves.
> **Formula:** `-4.6 + (0.1822 * Velocity) + (0.000104 * Velocity²)`
> *Where Velocity is m/min over a 5K distance.*

### 3. VO2max (2K Row)
Derived from the **Concept2 Power-to-VO2** correlation.
> **Logic:** Converts split-time to Watts, then calculates VO2 based on the constant `14.4 mL/min/W` plus a baseline.

---

## 💻 Local Development

### Prerequisites
*   Node.js (v18+)
*   NPM

### Setup
1.  Install dependencies:
    ```bash
    npm install
    ```
2.  Start the development server:
    ```bash
    npm run dev
    ```
    The app will be available at `http://localhost:5173`.

---

## ☁️ Optional Sync Server

To synchronize data between your PC and a mobile device without using third-party clouds, use the included `server.js`.

### Setup
1.  Run the server on your computer:
    ```bash
    node server.js
    ```
2.  **Firewall:** Ensure port `3000` is open on your PC.
3.  **App Config:** In the app, go to the Cloud icon and enter your PC's IP address (e.g., `http://192.168.1.5:3000`).

---

## 📱 Android Deployment (Capacitor)

The app is built to be a native Android application using Capacitor.

### Build Instructions
1.  Compile the web code:
    ```bash
    npm run build
    ```
2.  Sync with Android:
    ```bash
    npx cap sync
    ```
3.  Open in Android Studio:
    ```bash
    npx cap open android
    ```

### Android Network Configuration
If testing against a local `http://` server, you must allow cleartext traffic:
1.  Open `android/app/src/main/AndroidManifest.xml`.
2.  Ensure the `<application>` tag includes:
    ```xml
    android:usesCleartextTraffic="true"
    ```
3.  Ensure capacitor config permits http
---

## 📂 Data & Export
*   **Local Storage:** All logs are stored in the browser's `localStorage` indexed by your device.
*   **Excel Export:** Download a complete time-series of your health data in `.xlsx` format.
*   **Config Backup:** Export your custom metric definitions and categories as a `.json` file.
