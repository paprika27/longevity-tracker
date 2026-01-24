
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['@capacitor/core', '@capacitor/filesystem', '@capacitor/share', '@capacitor/android', '@capacitor/browser']
  }
});
