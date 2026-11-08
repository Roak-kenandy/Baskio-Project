export type Tone = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'brand'

const STATE_TONES: Record<string, Tone> = {
  EFFECTIVE: 'success',
  ACTIVE: 'success',
  NOT_EFFECTIVE: 'error',
  PAUSED: 'warning',
  DRAFT: 'neutral',
}

export function stateTone(state: string | null | undefined): Tone {
  return (state && STATE_TONES[state.toUpperCase()]) || 'neutral'
}

export function humanizeState(state: string): string {
  return state
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}
