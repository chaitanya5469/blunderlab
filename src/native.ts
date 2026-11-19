import { Capacitor } from '@capacitor/core';

/**
 * Android shell only (no-op in the browser): the hardware back button walks back through
 * the app's hash history and exits from the Home screen.
 */
export function setupNativeShell() {
  if (!Capacitor.isNativePlatform()) return;
  void import('@capacitor/app').then(({ App }) => {
    void App.addListener('backButton', ({ canGoBack }) => {
      const path = window.location.hash.replace(/^#/, '');
      const atHome = path === '' || path === '/';
      if (atHome || !canGoBack) void App.exitApp();
      else window.history.back();
    });
  });
}
