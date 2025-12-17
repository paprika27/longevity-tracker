import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.paprika27.longevitytracker',
  appName: 'LongevityTracker',
  webDir: 'dist',
  server: {
    // Allow both HTTP and HTTPS for local development
    androidScheme: 'http',
    // You can also use 'https' for production
    // androidScheme: 'https'
  }
};

export default config;
