import { Box, LinearProgress } from '@mui/material'
import Logo from './Logo'

export default function FullPageLoader() {
  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', bgcolor: 'background.default' }}>
      <Box sx={{ display: 'grid', justifyItems: 'center', gap: 2.5 }}>
        <Logo size={56} />
        <LinearProgress color="secondary" sx={{ width: 140 }} />
      </Box>
    </Box>
  )
}
