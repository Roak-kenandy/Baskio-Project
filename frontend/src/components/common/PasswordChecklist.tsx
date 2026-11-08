import { CheckCircle, RadioButtonUnchecked } from '@mui/icons-material'
import { Stack, Typography } from '@mui/material'
import { PASSWORD_RULES } from '../../utils/password'

export default function PasswordChecklist({ value }: { value: string }) {
  return (
    <Stack spacing={0.25}>
      {PASSWORD_RULES.map((rule) => {
        const ok = rule.test(value)
        return (
          <Stack key={rule.label} direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
            {ok ? (
              <CheckCircle sx={{ fontSize: 16 }} color="success" />
            ) : (
              <RadioButtonUnchecked sx={{ fontSize: 16 }} color="disabled" />
            )}
            <Typography variant="caption" color={ok ? 'success.main' : 'text.secondary'}>
              {rule.label}
            </Typography>
          </Stack>
        )
      })}
    </Stack>
  )
}
