import {
  AdminPanelSettingsOutlined,
  GridViewOutlined,
  HistoryOutlined,
  KeyOutlined,
  KeyboardArrowDown,
  LiveTvOutlined,
  Logout,
  Menu as MenuIcon,
  PhoneIphoneOutlined,
} from '@mui/icons-material'
import {
  AppBar,
  Avatar,
  Box,
  ButtonBase,
  Divider,
  Drawer,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useState, type ReactNode } from 'react'
import { matchPath, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import Logo from '../components/common/Logo'
import { useAuth } from '../context/AuthContext'
import { BRAND } from '../theme'
import { PERMISSIONS, type Permission } from '../types'

const DRAWER_WIDTH = 264

interface NavItem {
  to: string
  label: string
  hint?: string
  icon: ReactNode
  permission?: Permission
}

const NAV_SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: 'Overview',
    items: [{ to: '/', label: 'Dashboard', icon: <GridViewOutlined fontSize="small" /> }],
  },
  {
    title: 'Reports',
    items: [
      { to: '/reports/medianet-tv', label: 'Medianet TV', hint: 'BAISKOAFU', icon: <LiveTvOutlined fontSize="small" />, permission: PERMISSIONS.REPORT_MEDIANET_TV_VIEW },
      { to: '/reports/ott', label: 'OTT', hint: 'BAISKOAFU OTT', icon: <PhoneIphoneOutlined fontSize="small" />, permission: PERMISSIONS.REPORT_OTT_VIEW },
    ],
  },
  {
    title: 'Administration',
    items: [
      { to: '/admin/users', label: 'Users & Access', icon: <AdminPanelSettingsOutlined fontSize="small" />, permission: PERMISSIONS.USERS_MANAGE },
      { to: '/admin/audit-logs', label: 'Audit Logs', icon: <HistoryOutlined fontSize="small" />, permission: PERMISSIONS.AUDIT_VIEW },
    ],
  },
]

function initials(name?: string) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase()
}

export default function AppLayout() {
  const { user, can, logout } = useAuth()
  const theme = useTheme()
  const desktop = useMediaQuery(theme.breakpoints.up('md'))
  const [mobileOpen, setMobileOpen] = useState(false)
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)
  const navigate = useNavigate()
  const location = useLocation()

  const sections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => !item.permission || can(item.permission)),
  })).filter((section) => section.items.length)

  const current = sections
    .flatMap((s) => s.items)
    .find((item) => matchPath({ path: item.to, end: item.to === '/' }, location.pathname))

  const roleLabel = user?.role === 'admin' ? 'Administrator' : 'Report user'

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#fff' }}>
      <Box sx={{ px: 2.5, height: 72, display: 'flex', alignItems: 'center' }}>
        <Logo size={36} showText />
      </Box>

      <Box component="nav" sx={{ flexGrow: 1, overflowY: 'auto', px: 1.5, pb: 2 }}>
        {sections.map((section) => (
          <Box key={section.title} sx={{ mt: 2 }}>
            <Typography variant="overline" sx={{ px: 1.5, color: 'grey.400', display: 'block', mb: 0.5 }}>
              {section.title}
            </Typography>
            <Stack spacing={0.25}>
              {section.items.map((item) => (
                <ButtonBase
                  key={item.to}
                  component={NavLink}
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setMobileOpen(false)}
                  sx={{
                    position: 'relative',
                    justifyContent: 'flex-start',
                    gap: 1.5,
                    px: 1.5,
                    py: 1,
                    borderRadius: 2,
                    color: 'grey.600',
                    fontSize: 14,
                    fontWeight: 500,
                    transition: 'background-color .15s, color .15s',
                    '& .nav-icon': { color: 'grey.400', display: 'flex', transition: 'color .15s' },
                    '&:hover': { bgcolor: 'grey.100', color: 'grey.900', '& .nav-icon': { color: 'grey.600' } },
                    '&.active': {
                      bgcolor: alpha(BRAND.navy, 0.06),
                      color: BRAND.navy,
                      fontWeight: 600,
                      '& .nav-icon': { color: BRAND.navy },
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        left: -12,
                        top: 8,
                        bottom: 8,
                        width: 3,
                        borderRadius: '0 3px 3px 0',
                        bgcolor: BRAND.gold,
                      },
                    },
                  }}
                >
                  <Box className="nav-icon">{item.icon}</Box>
                  <Box sx={{ flexGrow: 1, textAlign: 'left', minWidth: 0 }}>
                    <Box component="span" sx={{ display: 'block', lineHeight: 1.3 }}>
                      {item.label}
                    </Box>
                    {item.hint && (
                      <Box component="span" sx={{ display: 'block', fontSize: 11, fontWeight: 500, color: 'grey.400', lineHeight: 1.3 }}>
                        {item.hint}
                      </Box>
                    )}
                  </Box>
                </ButtonBase>
              ))}
            </Stack>
          </Box>
        ))}
      </Box>

      <Divider />
      <Stack direction="row" spacing={1.5} sx={{ p: 2, alignItems: 'center' }}>
        <Avatar sx={{ width: 36, height: 36, bgcolor: BRAND.navy, color: BRAND.gold, fontSize: 14, fontWeight: 700 }}>
          {initials(user?.fullName)}
        </Avatar>
        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
          <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
            {user?.fullName}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap component="div">
            {roleLabel}
          </Typography>
        </Box>
        <IconButton size="small" aria-label="Sign out" onClick={() => void logout()} sx={{ color: 'grey.500' }}>
          <Logout fontSize="small" />
        </IconButton>
      </Stack>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="fixed"
        color="inherit"
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          bgcolor: alpha('#ffffff', 0.85),
          backdropFilter: 'saturate(180%) blur(12px)',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 64, md: 72 }, gap: 1 }}>
          {!desktop && (
            <IconButton edge="start" onClick={() => setMobileOpen(true)} aria-label="Open navigation">
              <MenuIcon />
            </IconButton>
          )}
          {!desktop && <Logo size={30} />}
          <Box sx={{ flexGrow: 1, minWidth: 0, ml: desktop ? 0 : 1 }}>
            <Typography variant="body2" color="text.secondary" noWrap>
              {current ? (
                <>
                  Medianet <Box component="span" sx={{ mx: 0.75, color: 'grey.300' }}>/</Box>
                  <Box component="span" sx={{ color: 'text.primary', fontWeight: 600 }}>
                    {current.label}
                  </Box>
                </>
              ) : (
                'Medianet'
              )}
            </Typography>
          </Box>

          <ButtonBase
            onClick={(e) => setMenuAnchor(e.currentTarget)}
            aria-label="Account menu"
            sx={{ borderRadius: 999, pl: 0.5, pr: 1, py: 0.5, gap: 1, '&:hover': { bgcolor: 'grey.100' } }}
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: BRAND.navy, color: BRAND.gold, fontSize: 13, fontWeight: 700 }}>
              {initials(user?.fullName)}
            </Avatar>
            <Box sx={{ textAlign: 'left', display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                {user?.fullName}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>
                {user?.username}
              </Typography>
            </Box>
            <KeyboardArrowDown fontSize="small" sx={{ color: 'grey.400' }} />
          </ButtonBase>
          <Menu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={() => setMenuAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            slotProps={{ paper: { sx: { mt: 1, minWidth: 220 } } }}
          >
            <Box sx={{ px: 2, py: 1.25 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {user?.fullName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {roleLabel}
              </Typography>
            </Box>
            <Divider />
            <MenuItem
              onClick={() => {
                setMenuAnchor(null)
                navigate('/change-password')
              }}
              sx={{ mt: 0.5 }}
            >
              <ListItemIcon>
                <KeyOutlined fontSize="small" />
              </ListItemIcon>
              Change password
            </MenuItem>
            <MenuItem
              onClick={() => {
                setMenuAnchor(null)
                void logout()
              }}
              sx={{ color: 'error.main' }}
            >
              <ListItemIcon sx={{ color: 'inherit' }}>
                <Logout fontSize="small" />
              </ListItemIcon>
              Sign out
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer
          variant={desktop ? 'permanent' : 'temporary'}
          open={desktop || mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' } }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, minWidth: 0, px: { xs: 2, sm: 3, lg: 4 }, pb: 4 }}>
        <Toolbar sx={{ minHeight: { xs: 64, md: 72 } }} />
        <Box sx={{ pt: { xs: 2, md: 3 }, maxWidth: 1600, mx: 'auto' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}
