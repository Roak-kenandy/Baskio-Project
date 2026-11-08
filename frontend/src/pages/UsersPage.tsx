import { Delete, Edit, LockOpen, LockReset, PersonAdd, Search } from '@mui/icons-material'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  IconButton,
  InputAdornment,
  LinearProgress,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { useCallback, useEffect, useState } from 'react'
import { getErrorMessage } from '../api/client'
import { usersApi } from '../api/users.api'
import ConfirmDialog from '../components/common/ConfirmDialog'
import PageHeader from '../components/common/PageHeader'
import SoftChip from '../components/common/SoftChip'
import ResetPasswordDialog from '../components/users/ResetPasswordDialog'
import UserFormDialog from '../components/users/UserFormDialog'
import { useAuth } from '../context/AuthContext'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { BRAND } from '../theme'
import type { ManagedUser, Paginated, PermissionInfo } from '../types'
import { formatDateTime } from '../utils/format'

export default function UsersPage() {
  const { user: currentUser } = useAuth()
  const [data, setData] = useState<Paginated<ManagedUser> | null>(null)
  const [catalog, setCatalog] = useState<PermissionInfo[]>([])
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(25)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<ManagedUser | null>(null)
  const [resetting, setResetting] = useState<ManagedUser | null>(null)
  const [deleting, setDeleting] = useState<ManagedUser | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setData(await usersApi.list({ page, limit, search: debouncedSearch.trim() }))
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [page, limit, debouncedSearch])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    usersApi.permissionCatalog().then(setCatalog).catch(() => setCatalog([]))
  }, [])

  const permissionLabel = (key: string) => catalog.find((p) => p.key === key)?.label ?? key

  const afterSave = (message: string) => {
    setFormOpen(false)
    setEditing(null)
    setResetting(null)
    setToast(message)
    void load()
  }

  const unlock = async (target: ManagedUser) => {
    try {
      await usersApi.unlock(target.id)
      afterSave(`“${target.username}” unlocked.`)
    } catch (err) {
      setToast(getErrorMessage(err))
    }
  }

  const confirmDelete = async () => {
    if (!deleting) return
    setBusy(true)
    try {
      await usersApi.remove(deleting.id)
      setDeleting(null)
      afterSave(`User “${deleting.username}” deleted.`)
    } catch (err) {
      setToast(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Users & Access"
        subtitle="Create users and control exactly which reports and data they can see."
        actions={
          <Button
            variant="contained"
            startIcon={<PersonAdd />}
            onClick={() => {
              setEditing(null)
              setFormOpen(true)
            }}
          >
            Create user
          </Button>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', alignItems: { sm: 'center' }, justifyContent: 'space-between' }}
        >
          <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline' }}>
            <Typography variant="h6">All users</Typography>
            {data && <SoftChip tone="brand">{data.total}</SoftChip>}
          </Stack>
          <TextField
            sx={{ width: { xs: '100%', sm: 340 } }}
            placeholder="Search by username, name or email"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            slotProps={{
              htmlInput: { maxLength: 100 },
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search fontSize="small" sx={{ color: 'grey.400' }} />
                  </InputAdornment>
                ),
              },
            }}
          />
        </Stack>
        <Box sx={{ height: 2 }}>{loading && <LinearProgress color="secondary" sx={{ height: 2, borderRadius: 0 }} />}</Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Permissions</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Last sign in</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.items.map((u) => (
                <TableRow key={u.id} hover>
                  <TableCell sx={{ minWidth: 220 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 34, height: 34, fontSize: 13, fontWeight: 700, bgcolor: BRAND.navy, color: BRAND.gold }}>
                        {u.fullName?.[0]?.toUpperCase()}
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {u.fullName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          @{u.username}
                          {u.email ? ` · ${u.email}` : ''}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <SoftChip tone={u.role === 'admin' ? 'brand' : 'neutral'}>{u.role === 'admin' ? 'Administrator' : 'Report user'}</SoftChip>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 360 }}>
                    {u.role === 'admin' ? (
                      <Typography variant="caption" color="text.secondary">
                        All permissions
                      </Typography>
                    ) : u.permissions.length ? (
                      <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                        {u.permissions.map((p) => (
                          <SoftChip key={p} tone="info">
                            {permissionLabel(p)}
                          </SoftChip>
                        ))}
                      </Stack>
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        No access
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" sx={{ gap: 0.5, flexWrap: 'wrap' }}>
                      <SoftChip tone={u.isActive ? 'success' : 'neutral'} dot>
                        {u.isActive ? 'Active' : 'Disabled'}
                      </SoftChip>
                      {u.isLocked && (
                        <SoftChip tone="error" dot>
                          Locked
                        </SoftChip>
                      )}
                      {u.mustChangePassword && <SoftChip tone="warning">Temp password</SoftChip>}
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    <Typography variant="body2">{formatDateTime(u.lastLoginAt)}</Typography>
                    {u.lastLoginIp && (
                      <Typography variant="caption" color="text.secondary">
                        {u.lastLoginIp}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setEditing(u)
                          setFormOpen(true)
                        }}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Reset password">
                      <IconButton size="small" onClick={() => setResetting(u)}>
                        <LockReset fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {u.isLocked && (
                      <Tooltip title="Unlock account">
                        <IconButton size="small" onClick={() => void unlock(u)}>
                          <LockOpen fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title={u.id === currentUser?.id ? 'You cannot delete yourself' : 'Delete'}>
                      <span>
                        <IconButton
                          size="small"
                          sx={{ color: 'grey.500', '&:hover': { color: 'error.main', bgcolor: 'error.light' } }}
                          aria-label={`Delete ${u.username}`}
                          disabled={u.id === currentUser?.id}
                          onClick={() => setDeleting(u)}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && data?.items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    No users found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={data?.total ?? 0}
          page={page - 1}
          rowsPerPage={limit}
          rowsPerPageOptions={[10, 25, 50, 100]}
          onPageChange={(_e, next) => setPage(next + 1)}
          onRowsPerPageChange={(e) => {
            setLimit(Number(e.target.value))
            setPage(1)
          }}
        />
      </Card>

      <UserFormDialog
        key={`${formOpen}-${editing?.id ?? 'new'}`}
        open={formOpen}
        user={editing}
        catalog={catalog}
        currentUserId={currentUser?.id ?? ''}
        onClose={() => {
          setFormOpen(false)
          setEditing(null)
        }}
        onSaved={afterSave}
      />
      <ResetPasswordDialog key={resetting?.id ?? 'none'} user={resetting} onClose={() => setResetting(null)} onDone={afterSave} />
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete user"
        message={`Permanently delete “${deleting?.username}”? Their sessions are revoked immediately. Consider disabling the account instead to keep history clear.`}
        confirmLabel="Delete"
        danger
        busy={busy}
        onConfirm={() => void confirmDelete()}
        onClose={() => setDeleting(null)}
      />
      <Snackbar open={Boolean(toast)} autoHideDuration={5000} onClose={() => setToast(null)} message={toast} />
    </>
  )
}
