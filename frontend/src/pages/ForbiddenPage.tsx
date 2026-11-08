import { BlockOutlined } from '@mui/icons-material'
import { Box, Button, Card, Stack, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'

export default function ForbiddenPage() {
  return (
    <Card sx={{ p: { xs: 4, sm: 8 }, textAlign: 'center' }}>
      <Stack spacing={2} sx={{ alignItems: 'center', maxWidth: 420, mx: 'auto' }}>
        <Box sx={{ width: 64, height: 64, borderRadius: '50%', bgcolor: '#fef3f2', color: 'error.main', display: 'grid', placeItems: 'center' }}>
          <BlockOutlined sx={{ fontSize: 30 }} />
        </Box>
        <Typography variant="h5">Access denied</Typography>
        <Typography color="text.secondary">You don't have permission to view this page. Contact an administrator if you need access.</Typography>
        <Button component={RouterLink} to="/" variant="contained">
          Back to dashboard
        </Button>
      </Stack>
    </Card>
  )
}
