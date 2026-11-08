import { InsightsOutlined, LockOutlined, ShieldOutlined, VerifiedUserOutlined } from '@mui/icons-material'
import { Alert, Box, Button, Stack, TextField, Typography } from '@mui/material'
import { useState, type FormEvent, type ReactNode } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { getErrorMessage } from '../api/client'
import Logo from '../components/common/Logo'
import PasswordField from '../components/common/PasswordField'
import { useAuth } from '../context/AuthContext'
import { BRAND } from '../theme'

const CURRENT_YEAR = new Date().getFullYear()

function Feature({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <Stack direction="row" spacing={2} sx={{ alignItems: 'flex-start' }}>
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: 2.5,
          flexShrink: 0,
          display: 'grid',
          placeItems: 'center',
          color: BRAND.gold,
          bgcolor: 'rgba(224, 185, 74, 0.12)',
          border: '1px solid rgba(224, 185, 74, 0.25)',
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography sx={{ fontWeight: 600, color: '#fff', fontSize: 15 }}>{title}</Typography>
        <Typography sx={{ color: 'rgba(255,255,255,0.62)', fontSize: 14, mt: 0.25 }}>{text}</Typography>
      </Box>
    </Stack>
  )
}

export default function LoginPage() {
  const { user, login, logoutReason } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const from = (location.state as { from?: string } | null)?.from ?? '/'

  if (user) return <Navigate to={user.mustChangePassword ? '/change-password' : from} replace />

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const loggedIn = await login(username.trim(), password)
      navigate(loggedIn.mustChangePassword ? '/change-password' : from, { replace: true })
    } catch (err) {
      setError(getErrorMessage(err, 'Sign in failed.'))
      setPassword('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.05fr 1fr' }, bgcolor: '#fff' }}>
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'space-between',
          p: { md: 6, lg: 8 },
          position: 'relative',
          overflow: 'hidden',
          color: '#fff',
          background: `radial-gradient(1200px 600px at -10% -10%, ${BRAND.navyLight} 0%, transparent 55%),
            radial-gradient(800px 500px at 120% 110%, rgba(224,185,74,0.22) 0%, transparent 55%),
            linear-gradient(160deg, ${BRAND.navy} 0%, ${BRAND.navyDark} 100%)`,
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
            backgroundSize: '44px 44px',
            maskImage: 'radial-gradient(ellipse at 30% 40%, #000 20%, transparent 75%)',
          },
        }}
      >
        <Box sx={{ position: 'relative' }}>
          <Logo size={44} showText inverted />
        </Box>

        <Box sx={{ position: 'relative', maxWidth: 480 }}>
          <Typography sx={{ color: BRAND.gold, fontWeight: 600, fontSize: 13, letterSpacing: '0.12em', textTransform: 'uppercase', mb: 2 }}>
            BAISKOAFU Reporting
          </Typography>
          <Typography sx={{ fontSize: { md: 36, lg: 42 }, fontWeight: 750, lineHeight: 1.12, letterSpacing: '-0.025em', mb: 2 }}>
            Subscriber insights for Medianet TV &amp; OTT.
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.65)', fontSize: 16, mb: 5 }}>
            Live subscription start and end dates, straight from the CRM — in one secure place.
          </Typography>
          <Stack spacing={3}>
            <Feature icon={<InsightsOutlined fontSize="small" />} title="Real-time reports" text="Active, expiring and expired subscriptions at a glance." />
            <Feature icon={<VerifiedUserOutlined fontSize="small" />} title="Role-based access" text="Admins decide exactly who sees which report and data." />
            <Feature icon={<ShieldOutlined fontSize="small" />} title="Secured & audited" text="Every sign-in, view and export is logged." />
          </Stack>
        </Box>

        <Typography sx={{ position: 'relative', color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>
          © {CURRENT_YEAR} Medianet Pvt Ltd · Internal use only
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', placeItems: 'center', p: { xs: 3, sm: 6 } }}>
        <Box sx={{ width: '100%', maxWidth: 400 }}>
          <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 5 }}>
            <Logo size={44} showText />
          </Box>

          <Typography variant="h4" sx={{ fontSize: 30, mb: 1 }}>
            Welcome back
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 4 }}>
            Sign in with the account provided by your administrator.
          </Typography>

          <Stack component="form" spacing={2.5} onSubmit={onSubmit} noValidate>
            {logoutReason && !error && <Alert severity="info">{logoutReason}</Alert>}
            {error && <Alert severity="error">{error}</Alert>}
            <Box>
              <Typography component="label" htmlFor="login-username" sx={{ display: 'block', fontSize: 14, fontWeight: 600, mb: 0.75 }}>
                Username
              </Typography>
              <TextField
                id="login-username"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoFocus
                required
                fullWidth
                size="medium"
                slotProps={{ htmlInput: { maxLength: 50, autoCapitalize: 'off', spellCheck: false } }}
              />
            </Box>
            <Box>
              <Typography component="label" htmlFor="login-password" sx={{ display: 'block', fontSize: 14, fontWeight: 600, mb: 0.75 }}>
                Password
              </Typography>
              <PasswordField
                id="login-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                fullWidth
                size="medium"
              />
            </Box>
            <Button
              type="submit"
              variant="contained"
              size="large"
              loading={submitting}
              disabled={!username || !password}
              sx={{ mt: 1, py: 1.4 }}
            >
              Sign in
            </Button>
          </Stack>

          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'center', mt: 4, color: 'text.secondary' }}>
            <LockOutlined sx={{ fontSize: 15 }} />
            <Typography variant="caption">Authorised personnel only. All activity is monitored.</Typography>
          </Stack>
        </Box>
      </Box>
    </Box>
  )
}
