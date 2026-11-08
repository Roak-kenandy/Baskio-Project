export const PASSWORD_RULES: { label: string; test: (value: string) => boolean }[] = [
  { label: 'At least 12 characters', test: (v) => v.length >= 12 },
  { label: 'A lowercase letter', test: (v) => /[a-z]/.test(v) },
  { label: 'An uppercase letter', test: (v) => /[A-Z]/.test(v) },
  { label: 'A number', test: (v) => /\d/.test(v) },
  { label: 'A symbol', test: (v) => /[^A-Za-z0-9]/.test(v) },
]

export function isStrongPassword(value: string): boolean {
  return value.length <= 128 && PASSWORD_RULES.every((rule) => rule.test(value))
}

export function generatePassword(length = 16): string {
  const sets = ['ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghijkmnopqrstuvwxyz', '23456789', '!@#$%^&*-_=+?']
  const all = sets.join('')
  const random = (max: number) => {
    const buf = new Uint32Array(1)
    crypto.getRandomValues(buf)
    return buf[0] % max
  }
  const chars = sets.map((set) => set[random(set.length)])
  while (chars.length < length) chars.push(all[random(all.length)])
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = random(i + 1)
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }
  return chars.join('')
}
