// Text-to-speech (TR-05, AX-04) and recorded-audio playback (CS-06).
import { db } from '../db/db';

let voiceURI: string | undefined;
export const setVoice = (uri?: string) => (voiceURI = uri);

export function ttsAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
}

export function listVoices(): SpeechSynthesisVoice[] {
  if (!ttsAvailable()) return [];
  return speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith('en'));
}

export function cancelSpeech() {
  if (ttsAvailable()) speechSynthesis.cancel();
  currentAudio?.pause();
  currentAudio = null;
}

export function speak(text: string, rate = 0.9): Promise<void> {
  if (!ttsAvailable() || !text) return Promise.resolve();
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    u.rate = rate;
    u.lang = 'en-US';
    const v = voiceURI ? speechSynthesis.getVoices().find((x) => x.voiceURI === voiceURI) : undefined;
    if (v) u.voice = v;
    const done = () => resolve();
    u.onend = done;
    u.onerror = done;
    // Safety: some browsers never fire onend.
    setTimeout(done, 1500 + text.length * 120 / rate);
    speechSynthesis.speak(u);
  });
}

let currentAudio: HTMLAudioElement | null = null;

export async function playMedia(mediaId: string, rate = 1): Promise<void> {
  const m = await db.media.get(mediaId);
  if (!m) return;
  const url = URL.createObjectURL(m.blob);
  return new Promise((resolve) => {
    const a = new Audio(url);
    currentAudio = a;
    a.playbackRate = rate;
    const done = () => {
      URL.revokeObjectURL(url);
      resolve();
    };
    a.onended = done;
    a.onerror = done;
    a.play().catch(done);
  });
}

const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** The word: parent recording if present (CS-06), otherwise TTS. */
export async function sayWord(word: string, audioRef: string | undefined, rate: number) {
  if (audioRef) return playMedia(audioRef, rate < 0.8 ? 0.8 : 1);
  return speak(word, rate);
}

/** CS-02: word → sentence → word. */
export async function speakSpelling(word: string, sentence: string | undefined, audioRef: string | undefined, rate: number) {
  cancelSpeech();
  await sayWord(word, audioRef, rate);
  if (sentence) {
    await pause(350);
    await speak(sentence, rate);
  }
  await pause(350);
  await sayWord(word, audioRef, rate);
}

/** CS-05: say the word, then spell it out letter by letter. */
export async function spellOut(word: string, rate: number) {
  cancelSpeech();
  await speak(word, rate);
  await pause(250);
  await speak(word.split('').join(', '), Math.min(rate, 0.8));
}
