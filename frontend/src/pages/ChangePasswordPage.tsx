import { Alert, Box, Button, Card, Stack, Typography } from '@mui/material'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api/auth.api'
import { getErrorMessage } from '../api/client'
import Logo from '../components/common/Logo'
import PasswordChecklist from '../components/common/PasswordChecklist'
import PasswordField from '../components/common/PasswordField'
import { useAuth } from '../context/AuthContext'
import { isStrongPassword } from '../utils/password'

export default function ChangePasswordPage() {
  const { user, setUser, logout } = useAuth()
  const navigate = useNavigate()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const forced = Boolean(user?.mustChangePassword)
  const mismatch = confirmPassword.length > 0 && confirmPassword !== newPassword
  const canSubmit = currentPassword && isStrongPassword(newPassword) && newPassword === confirmPassword

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const updated = await authApi.changePassword({ currentPassword, newPassword, confirmPassword })
      setUser(updated)
      navigate('/', { replace: true })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 2, bgcolor: 'background.default' }}>
      <Card sx={{ width: '100%', maxWidth: 460, p: { xs: 3, sm: 4.5 }, borderRadius: 4, boxShadow: '0 12px 40px rgba(15, 23, 42, 0.08)' }}>
        <Box sx={{ mb: 3 }}>
          <Logo size={40} showText />
        </Box>
        <Typography variant="h5" gutterBottom>
          {forced ? 'Set a new password' : 'Change password'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {forced
            ? 'You are using a temporary password. Choose a new one to continue.'
            : 'Changing your password signs you out of every other device.'}
        </Typography>

        <Stack component="form" spacing={2} onSubmit={onSubmit} noValidate>
          {error && <Alert severity="error">{error}</Alert>}
          <PasswordField
            label="Current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            fullWidth
            required
          />
          <PasswordField
            label="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            fullWidth
            required
          />
          <PasswordChecklist value={newPassword} />
          <PasswordField
            label="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            error={mismatch}
            helperText={mismatch ? 'Passwords do not match' : ' '}
            fullWidth
            required
          />
          <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
            {forced ? (
              <Button onClick={() => void logout()}>Sign out</Button>
            ) : (
              <Button onClick={() => navigate(-1)}>Cancel</Button>
            )}
            <Button type="submit" variant="contained" loading={submitting} disabled={!canSubmit}>
              Update password
            </Button>
          </Stack>
        </Stack>
      </Card>
    </Box>
  )
}
