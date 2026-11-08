import { Box, Stack, Typography } from '@mui/material'
import type { ReactNode } from 'react'

interface Props {
  title: string
  subtitle?: ReactNode
  eyebrow?: string
  actions?: ReactNode
}

export default function PageHeader({ title, subtitle, eyebrow, actions }: Props) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={2}
      sx={{ mb: 3, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'flex-end' } }}
    >
      <Box sx={{ minWidth: 0 }}>
        {eyebrow && (
          <Typography variant="overline" sx={{ color: 'secondary.dark', display: 'block', mb: 0.5, lineHeight: 1.4 }}>
            {eyebrow}
          </Typography>
        )}
        <Typography variant="h5" component="h1">
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {actions && (
        <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
          {actions}
        </Stack>
      )}
    </Stack>
  )
}
