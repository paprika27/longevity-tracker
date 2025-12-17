import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.paprika27.longevitytracker',
  appName: 'LongevityTracker',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
