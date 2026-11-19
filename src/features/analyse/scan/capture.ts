/**
 * Gets an image from the camera or the gallery with a file input. In the Android app, Capacitor's
 * WebView answers it natively: `capture` opens the system camera (through the app's FileProvider,
 * no camera permission needed), otherwise the system picker opens. In a browser it is the usual
 * file dialog. The image is only read locally, never uploaded. Resolves null when the user cancels.
 */
export function captureImage(source: 'camera' | 'gallery'): Promise<Blob | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    if (source === 'camera') input.setAttribute('capture', 'environment');
    input.style.display = 'none';
    let settled = false;
    const done = (b: Blob | null) => {
      if (settled) return;
      settled = true;
      input.remove();
      resolve(b);
    };
    input.addEventListener('change', () => done(input.files?.[0] ?? null));
    input.addEventListener('cancel', () => done(null));
    document.body.appendChild(input);
    input.click();
  });
}
