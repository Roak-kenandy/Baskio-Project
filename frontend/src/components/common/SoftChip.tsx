import { Box } from '@mui/material'
import type { ReactNode } from 'react'
import type { Tone } from '../../utils/status'

const TONES: Record<Tone, { bg: string; fg: string; dot: string }> = {
  success: { bg: '#ecfdf3', fg: '#067647', dot: '#17b26a' },
  warning: { bg: '#fffaeb', fg: '#b54708', dot: '#f79009' },
  error: { bg: '#fef3f2', fg: '#b42318', dot: '#f04438' },
  info: { bg: '#eff8ff', fg: '#175cd3', dot: '#2e90fa' },
  neutral: { bg: '#f2f4f7', fg: '#344054', dot: '#98a2b3' },
  brand: { bg: '#eef1f7', fg: '#13213f', dot: '#e0b94a' },
}

interface Props {
  tone?: Tone
  dot?: boolean
  children: ReactNode
}

export default function SoftChip({ tone = 'neutral', dot = false, children }: Props) {
  const t = TONES[tone]
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        px: 1,
        py: 0.25,
        borderRadius: 999,
        bgcolor: t.bg,
        color: t.fg,
        fontSize: 12,
        fontWeight: 600,
        lineHeight: '20px',
        whiteSpace: 'nowrap',
      }}
    >
      {dot && <Box component="span" sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: t.dot }} />}
      {children}
    </Box>
  )
}