# Longevity Tracker

A privacy-focused, evidence-based application designed to track, visualize, and optimize key longevity metrics. It treats the human body as a biological system, applying engineering principles to health optimization using local storage for complete data privacy.

## Features

### 📊 Dashboard
*   **Holistic Balance Radar:** Visualize your health across multiple dimensions (Sleep, Cardio, Strength, etc.) in a spider chart.
*   **Smart Analysis:** Real-time feedback based on scientific ranges (Good/Fair/Poor).
*   **Evidence-Based:** Every metric includes citations and optimal ranges based on longevity research.
*   **Interactive Metrics:** Sort, filter, and click metrics to dive into historical trends.
*   **Alert Management:** Pin important notices or mass-dismiss notifications.

### 📈 Trends & History
*   **Visual History:** Interactive line charts to track progress over time.
*   **Multi-Metric Comparison:** Overlay multiple metrics to find correlations.
*   **Category Filters:** Quickly toggle between Daily, Weekly, or Clinical metrics.
*   **Interactive Zoom:** Drag to zoom in on specific timeframes.

### 📝 Regimen Manager
*   **Markdown Support:** Write and format your health protocols using Markdown.
*   **Table Rendering:** Native support for complex regimen tables and schedules.
*   **Customizable:** Fully editable text area to adapt the protocol to your needs.

### ⚙️ Customization & Data
*   **Form Designer:** Group metrics into custom categories (e.g., "Morning Routine").
*   **Calculated Metrics:** Create derived metrics (like BMI or Custom Scores) using JavaScript formulas.
*   **Data Portability:**
    *   **Export/Import Data:** Full Excel (`.xlsx`) support for your logs.
    *   **Config Backup:** Export your custom metrics and settings as JSON.
*   **Privacy First:** All data is stored in your browser's `localStorage`. No accounts, no tracking.

## Tech Stack

*   **Frontend:** React 18
*   **Styling:** Tailwind CSS (via CDN)
*   **Icons:** Lucide React
*   **Charts:** Recharts
*   **Data Handling:** XLSX (SheetJS)
*   **Storage:** LocalStorage API
*   **Architecture:** ES Modules via `importmap` (Client-side only, no bundler required).

## Setup & Usage

Since this application uses native ES modules and CDN imports, it requires no build process (like Webpack or Vite) but **must** be served via a local web server to handle module loading correctly (opening `index.html` directly as a file will likely fail due to CORS policies on modules).

### Prerequisites
*   A modern web browser (Chrome, Edge, Firefox, Safari).
*   A method to serve static files.

### Instructions

1.  **Download** the source files into a folder.
2.  **Start a Local Server** in that folder.
    *   **Python:** `python3 -m http.server 8000`
    *   **Node:** `npx serve .`
    *   **VS Code:** Right-click `index.html` -> "Open with Live Server".
3.  **Open Browser:** Navigate to `http://localhost:8000` (or the port provided by your server).

## Customization Guide

### Adding a New Metric
1.  Go to **Settings**.
2.  Click **Create New Metric**.
3.  Define the ID, Name, Range (Min/Max), and Unit.
4.  Assign it to a form category.

### Creating a Calculated Metric
1.  In **Settings**, create a new metric.
2.  Check **Calculated Automatically**.
3.  Enter a JavaScript formula using other metric IDs as variables.
    *   *Example (BMI):* `weight / ((height/100) * (height/100))`
