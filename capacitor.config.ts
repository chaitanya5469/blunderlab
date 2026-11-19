import type { CapacitorConfig } from '@capacitor/cli';

/** Page background (`--color-ink` in src/styles/index.css); also colours the system bars. */
const INK = '#07080b';

const config: CapacitorConfig = {
  appId: 'com.blunderlab.app',
  appName: 'BlunderLab',
  webDir: 'dist',
  backgroundColor: INK,
  android: { backgroundColor: INK },
  plugins: {
    // Edge-to-edge with correct safe-area insets; light icons on the dark bars.
    SystemBars: { insetsHandling: 'css', initialViewportFitValueHint: 'cover', style: 'DARK' },
  },
};

export default config;
