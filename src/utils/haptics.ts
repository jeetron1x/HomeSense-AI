// Haptic feedback utility for mobile touch and web vibration API
export type HapticPattern = 'tick' | 'tap' | 'selection' | 'scan' | 'success' | 'warning' | 'error';

export const triggerHaptic = (pattern: HapticPattern = 'tap') => {
  if (typeof window === 'undefined' || !window.navigator || !window.navigator.vibrate) {
    return;
  }

  try {
    switch (pattern) {
      case 'tick':
        // Subtle 6ms tick for toggles and micro-interactions
        window.navigator.vibrate(6);
        break;
      case 'tap':
        // Crisp 12ms tap for tabs and primary buttons
        window.navigator.vibrate(12);
        break;
      case 'selection':
        // 10ms selection feedback
        window.navigator.vibrate(10);
        break;
      case 'scan':
        // Dual laser pulse
        window.navigator.vibrate([18, 30, 22]);
        break;
      case 'success':
        // Ascending double-tap for successful completion
        window.navigator.vibrate([25, 45, 40]);
        break;
      case 'warning':
        // Warning buzz for threshold breach or alert
        window.navigator.vibrate([45, 30, 45]);
        break;
      case 'error':
        // Triple sharp buzz
        window.navigator.vibrate([50, 35, 50, 35, 75]);
        break;
    }
  } catch {
    // Ignore environments where vibration API is restricted
  }
};
