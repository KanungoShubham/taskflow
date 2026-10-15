/**
 * Browser alerts: system notifications + a short "ding" sound.
 *
 * - System notifications go through the service worker (/sw.js) because Android Chrome
 *   doesn't allow `new Notification()` from a page.
 * - The sound is generated with the Web Audio API (no audio file). Browsers block sound until
 *   the user has interacted with the page once, so `unlockAudio()` runs on the first click/tap.
 * - Everything needs a secure context: https:// or http://localhost.
 */

export type AlertPermission = NotificationPermission | "unsupported";

const SOUND_KEY = "taskflow.alerts.sound";

export function alertsSupported() {
  return typeof window !== "undefined" && window.isSecureContext && "Notification" in window && "serviceWorker" in navigator;
}

export function getPermission(): AlertPermission {
  return alertsSupported() ? Notification.permission : "unsupported";
}

let registration: Promise<ServiceWorkerRegistration | null> | null = null;

/** Registers /sw.js once. Resolves to null if service workers aren't available. */
export function registerServiceWorker() {
  if (!registration) {
    registration = alertsSupported()
      ? navigator.serviceWorker.register("/sw.js").catch(() => null)
      : Promise.resolve(null);
  }
  return registration;
}

/** Asks the browser for permission. Must be called from a click/tap. */
export async function requestPermission(): Promise<AlertPermission> {
  if (!alertsSupported()) return "unsupported";
  await registerServiceWorker();
  return Notification.requestPermission();
}

/** Shows an OS-level notification (does nothing without permission). */
export async function showSystemNotification({ title, body, tag, url }: { title: string; body: string; tag?: string; url?: string }) {
  if (getPermission() !== "granted") return false;
  const options: NotificationOptions = { body, tag, icon: "/icon.svg", badge: "/icon.svg", data: { url } };
  try {
    const reg = await registerServiceWorker();
    if (reg) {
      await reg.showNotification(title, options);
    } else {
      new Notification(title, options);
    }
    return true;
  } catch {
    return false;
  }
}

// ---- Sound -------------------------------------------------------------------------------

export function soundEnabled() {
  try {
    return localStorage.getItem(SOUND_KEY) !== "off";
  } catch {
    return true;
  }
}

export function setSoundEnabled(on: boolean) {
  try {
    localStorage.setItem(SOUND_KEY, on ? "on" : "off");
  } catch {
    // storage blocked (private mode): the setting just won't be remembered
  }
}

let audioCtx: AudioContext | null = null;

function getAudioContext() {
  if (typeof window === "undefined") return null;
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  audioCtx ??= new Ctx();
  return audioCtx;
}

/** Call from a user gesture so later sounds are allowed to play. */
export function unlockAudio() {
  const ctx = getAudioContext();
  if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});
}

/** Pleasant two-note "ding" (about 0.5 s). Ignores the mute setting when `force` is true. */
export function playChime(force = false) {
  if (!force && !soundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume().catch(() => {});

  const now = ctx.currentTime;
  [
    { freq: 880, start: 0 },
    { freq: 1318.5, start: 0.12 },
  ].forEach(({ freq, start }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, now + start);
    gain.gain.exponentialRampToValueAtTime(0.25, now + start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + start + 0.45);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now + start);
    osc.stop(now + start + 0.5);
  });
}
