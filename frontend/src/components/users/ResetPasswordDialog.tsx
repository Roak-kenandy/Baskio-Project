import { AutoFixHigh } from '@mui/icons-material'
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from '@mui/material'
import { useState } from 'react'
import { getErrorMessage } from '../../api/client'
import { usersApi } from '../../api/users.api'
import type { ManagedUser } from '../../types'
import { generatePassword, isStrongPassword } from '../../utils/password'
import PasswordChecklist from '../common/PasswordChecklist'
import PasswordField from '../common/PasswordField'

interface Props {
  user: ManagedUser | null
  onClose: () => void
  onDone: (message: string) => void
}

export default function ResetPasswordDialog({ user, onClose, onDone }: Props) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (!user) return
    setSaving(true)
    setError(null)
    try {
      await usersApi.resetPassword(user.id, password)
      onDone(`Password reset for “${user.username}”. They must change it at next sign in.`)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={Boolean(user)} onClose={saving ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Reset password</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Set a temporary password for <strong>{user?.username}</strong>. All of their active sessions will be signed out.
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
          <PasswordField label="Temporary password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" fullWidth />
          <Button startIcon={<AutoFixHigh />} onClick={() => setPassword(generatePassword())} sx={{ mt: 0.25 }}>
            Generate
          </Button>
        </Stack>
        <Box sx={{ mt: 1 }}>
          <PasswordChecklist value={password} />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button variant="contained" onClick={submit} loading={saving} disabled={!isStrongPassword(password)}>
          Reset password
        </Button>
      </DialogActions>
    </Dialog>
  )
}
