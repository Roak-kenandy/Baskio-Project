import { Box, Typography } from '@mui/material'

interface Props {
  size?: number
  showText?: boolean
  inverted?: boolean
}

export default function Logo({ size = 36, showText = false, inverted = false }: Props) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
      <Box
        component="img"
        src="/medianet-logo.png"
        alt="Medianet"
        width={size}
        height={size}
        sx={{ display: 'block', borderRadius: `${Math.round(size * 0.22)}px`, flexShrink: 0, bgcolor: '#fff' }}
      />
      {showText && (
        <Box sx={{ lineHeight: 1 }}>
          <Typography sx={{ fontWeight: 800, fontSize: 16, letterSpacing: '-0.01em', color: inverted ? '#fff' : 'primary.main', lineHeight: 1.15 }}>
            Medianet
          </Typography>
          <Typography sx={{ fontSize: 11, fontWeight: 500, color: inverted ? 'rgba(255,255,255,0.6)' : 'text.secondary', lineHeight: 1.2 }}>
            Subscription Reports
          </Typography>
        </Box>
      )}
    </Box>
  )
}
