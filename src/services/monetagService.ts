/**
 * Monetag Rewarded Ad Service
 * Zone ID: 12012404
 * SDK: show_12012404
 */

export function isMonetagAvailable(): boolean {
  return typeof (window as any).show_12012404 === 'function';
}

export async function triggerMonetagRewardedAd(): Promise<boolean> {
  if (typeof (window as any).show_12012404 === 'function') {
    try {
      await (window as any).show_12012404('pop');
      return true;
    } catch (err) {
      console.warn('Monetag ad dismissed or failed to play:', err);
      return false;
    }
  } else {
    console.warn('Monetag SDK not loaded yet. Will use simulated video fallback.');
    return false;
  }
}
