import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ai.homesense.app',
  appName: 'HomeSense AI',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
