// Short, soft sound effects synthesized with Web Audio — original, no audio files needed.
// Every sound has a visual equivalent on screen (AX-08).

let ctx: AudioContext | null = null;
let enabled = true;
export const setSfxEnabled = (on: boolean) => (enabled = on);

function ac(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const C = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!C) return null;
  ctx ??= new C();
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', vol = 0.12) {
  const c = ac();
  if (!c) return;
  const t = c.currentTime + start;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

export const sfx = {
  tap() {
    if (enabled) tone(660, 0, 0.05, 'triangle', 0.05);
  },
  correct() {
    if (!enabled) return;
    tone(784, 0, 0.14);
    tone(1047, 0.1, 0.22);
  },
  /** Gentle, low, not a buzzer. */
  tryAgain() {
    if (!enabled) return;
    tone(392, 0, 0.18, 'sine', 0.08);
    tone(330, 0.14, 0.26, 'sine', 0.08);
  },
  celebrate() {
    if (!enabled) return;
    [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.11, 0.25));
  },
};
