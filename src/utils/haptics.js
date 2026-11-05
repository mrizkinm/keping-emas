// ponytail: navigator.vibrate fallback; works on Android mobile browsers, silent on desktop/iOS
export function haptic(type = 'light') {
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      if (type === 'light') navigator.vibrate(8);
      else if (type === 'medium') navigator.vibrate(18);
      else if (type === 'success') navigator.vibrate([10, 40, 15]);
      else if (type === 'warning') navigator.vibrate([25, 40, 25]);
    }
  } catch {
    // silent
  }
}
