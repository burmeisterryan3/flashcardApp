// Parent PIN, stored as a salted SHA-256 hash (07), never plain text.

function hex(buf: ArrayBuffer) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function newSalt(): string {
  const a = new Uint8Array(16);
  crypto.getRandomValues(a);
  return hex(a.buffer);
}

export async function hashPin(pin: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${pin}`);
  return hex(await crypto.subtle.digest('SHA-256', data));
}

export async function verifyPin(pin: string, salt: string, hash: string): Promise<boolean> {
  return (await hashPin(pin, salt)) === hash;
}

/** CS-02: digits in a fresh random order each time the keypad opens. */
export function scrambledDigits(rng = Math.random): string[] {
  const d = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}
