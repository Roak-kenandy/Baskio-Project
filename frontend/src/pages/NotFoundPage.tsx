import { Button, Card, Stack, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <Card sx={{ p: { xs: 4, sm: 8 }, textAlign: 'center' }}>
      <Stack spacing={2} sx={{ alignItems: 'center', maxWidth: 420, mx: 'auto' }}>
        <Typography sx={{ fontSize: 56, fontWeight: 800, letterSpacing: '-0.04em', color: 'secondary.main', lineHeight: 1 }}>404</Typography>
        <Typography variant="h5">Page not found</Typography>
        <Typography color="text.secondary">The page you are looking for doesn't exist or has been moved.</Typography>
        <Button component={RouterLink} to="/" variant="contained">
          Back to dashboard
        </Button>
      </Stack>
    </Card>
  )
}
