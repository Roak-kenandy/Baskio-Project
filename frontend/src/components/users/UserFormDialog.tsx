import { AutoFixHigh } from '@mui/icons-material'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormGroup,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import { useMemo, useState, type FormEvent } from 'react'
import { getErrorMessage } from '../../api/client'
import { usersApi } from '../../api/users.api'
import type { ManagedUser, Permission, PermissionInfo, Role } from '../../types'
import { generatePassword, isStrongPassword } from '../../utils/password'
import PasswordChecklist from '../common/PasswordChecklist'
import PasswordField from '../common/PasswordField'

/** Mount with a `key` per user so the form state starts fresh each time it opens. */
interface Props {
  open: boolean
  user: ManagedUser | null
  catalog: PermissionInfo[]
  currentUserId: string
  onClose: () => void
  onSaved: (message: string) => void
}

export default function UserFormDialog({ open, user, catalog, currentUserId, onClose, onSaved }: Props) {
  const editing = Boolean(user)
  const [username, setUsername] = useState(user?.username ?? '')
  const [fullName, setFullName] = useState(user?.fullName ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [role, setRole] = useState<Role>(user?.role ?? 'user')
  const [permissions, setPermissions] = useState<Permission[]>(user?.permissions ?? [])
  const [isActive, setIsActive] = useState(user?.isActive ?? true)
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const groups = useMemo(() => {
    const map = new Map<string, PermissionInfo[]>()
    catalog.forEach((p) => map.set(p.group, [...(map.get(p.group) ?? []), p]))
    return [...map.entries()]
  }, [catalog])

  const isSelf = user?.id === currentUserId
  const togglePermission = (key: Permission) =>
    setPermissions((prev) => (prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]))

  const valid =
    fullName.trim().length >= 2 &&
    (editing || (/^[a-zA-Z0-9._-]{3,50}$/.test(username) && isStrongPassword(password)))

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      if (user) {
        await usersApi.update(user.id, {
          fullName: fullName.trim(),
          email: email.trim(),
          role,
          permissions: role === 'admin' ? [] : permissions,
          isActive,
        })
        onSaved(`User “${user.username}” updated.`)
      } else {
        await usersApi.create({ username: username.trim(), fullName: fullName.trim(), email: email.trim(), role, permissions, password })
        onSaved(`User “${username.trim().toLowerCase()}” created. Share the temporary password securely.`)
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth>
      <form onSubmit={onSubmit} noValidate>
        <DialogTitle>{editing ? `Edit user · ${user?.username}` : 'Create user'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            {error && <Alert severity="error">{error}</Alert>}
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
              <TextField
                label="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={editing}
                required
                helperText={editing ? 'Usernames cannot be changed' : 'Letters, numbers, . _ -'}
                slotProps={{ htmlInput: { maxLength: 50, autoCapitalize: 'off', spellCheck: false } }}
              />
              <TextField label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required slotProps={{ htmlInput: { maxLength: 100 } }} />
              <TextField label="Email (optional)" type="email" value={email} onChange={(e) => setEmail(e.target.value)} slotProps={{ htmlInput: { maxLength: 254 } }} />
              <TextField select label="Role" value={role} onChange={(e) => setRole(e.target.value as Role)} disabled={isSelf}>
                <MenuItem value="user">Report user</MenuItem>
                <MenuItem value="admin">Administrator</MenuItem>
              </TextField>
            </Box>

            {!editing && (
              <Box>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
                  <PasswordField
                    label="Temporary password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                    fullWidth
                    helperText="The user must change it at first sign in."
                  />
                  <Button startIcon={<AutoFixHigh />} onClick={() => setPassword(generatePassword())} sx={{ whiteSpace: 'nowrap', mt: 0.25 }}>
                    Generate
                  </Button>
                </Stack>
                <Box sx={{ mt: 1 }}>
                  <PasswordChecklist value={password} />
                </Box>
              </Box>
            )}

            {editing && (
              <FormControlLabel
                control={<Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} disabled={isSelf} />}
                label={isActive ? 'Account active' : 'Account disabled (cannot sign in)'}
              />
            )}

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Access permissions
              </Typography>
              {role === 'admin' ? (
                <Alert severity="info">Administrators automatically have every permission.</Alert>
              ) : (
                groups.map(([group, items]) => (
                  <Box key={group} sx={{ mb: 1.5 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                      {group}
                    </Typography>
                    <FormGroup>
                      {items.map((p) => (
                        <FormControlLabel
                          key={p.key}
                          control={<Checkbox checked={permissions.includes(p.key)} onChange={() => togglePermission(p.key)} size="small" />}
                          label={
                            <Box>
                              <Typography variant="body2">{p.label}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                {p.description}
                              </Typography>
                            </Box>
                          }
                          sx={{ alignItems: 'flex-start', '& .MuiCheckbox-root': { pt: 0.5 } }}
                        />
                      ))}
                    </FormGroup>
                  </Box>
                ))
              )}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" loading={saving} disabled={!valid}>
            {editing ? 'Save changes' : 'Create user'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
