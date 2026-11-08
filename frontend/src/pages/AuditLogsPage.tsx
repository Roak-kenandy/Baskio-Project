import {
  Alert,
  Box,
  Card,
  LinearProgress,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { auditApi } from '../api/audit.api'
import { getErrorMessage } from '../api/client'
import PageHeader from '../components/common/PageHeader'
import SoftChip from '../components/common/SoftChip'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import type { AuditLog, Paginated } from '../types'
import { formatDateTime } from '../utils/format'

function describe(log: AuditLog): string {
  const meta = log.metadata ?? {}
  if (log.action.startsWith('report.')) {
    const count = (meta.resultCount ?? meta.rowCount) as number | undefined
    return `${log.targetId ?? ''} report${typeof count === 'number' ? ` · ${count} rows` : ''}`
  }
  if (log.action.startsWith('user.')) return `Target: ${(meta.username as string) ?? log.targetId ?? ''}`
  if (meta.reason) return `Reason: ${String(meta.reason).replace('_', ' ')}`
  return ''
}

export default function AuditLogsPage() {
  const [data, setData] = useState<Paginated<AuditLog> | null>(null)
  const [actions, setActions] = useState<string[]>([])
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(25)
  const [action, setAction] = useState('')
  const [status, setStatus] = useState('')
  const [username, setUsername] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const debouncedUsername = useDebouncedValue(username)

  const query = useMemo(
    () => ({ page, limit, action, status, username: debouncedUsername.trim(), from, to }),
    [page, limit, action, status, debouncedUsername, from, to],
  )

  useEffect(() => {
    auditApi.actions().then(setActions).catch(() => setActions([]))
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    auditApi
      .list(query)
      .then((result) => !cancelled && setData(result))
      .catch((err) => !cancelled && setError(getErrorMessage(err)))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [query])

  const withReset = <T,>(setter: (v: T) => void) => (value: T) => {
    setter(value)
    setPage(1)
  }

  return (
    <>
      <PageHeader eyebrow="Administration" title="Audit Logs" subtitle="Sign-ins, report access, exports and administrative changes." />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card>
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(5, 1fr)' } }}>
          <TextField select label="Action" value={action} onChange={(e) => withReset(setAction)(e.target.value)}>
            <MenuItem value="">All actions</MenuItem>
            {actions.map((a) => (
              <MenuItem key={a} value={a}>
                {a}
              </MenuItem>
            ))}
          </TextField>
          <TextField select label="Result" value={status} onChange={(e) => withReset(setStatus)(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="success">Success</MenuItem>
            <MenuItem value="failure">Failure</MenuItem>
          </TextField>
          <TextField label="Username" value={username} onChange={(e) => withReset(setUsername)(e.target.value)} slotProps={{ htmlInput: { maxLength: 50 } }} />
          <TextField type="date" label="From" value={from} onChange={(e) => withReset(setFrom)(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
          <TextField type="date" label="To" value={to} onChange={(e) => withReset(setTo)(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
        </Box>
        <Box sx={{ height: 2 }}>{loading && <LinearProgress color="secondary" sx={{ height: 2, borderRadius: 0 }} />}</Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Time</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Result</TableCell>
                <TableCell>Details</TableCell>
                <TableCell>IP address</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data?.items.map((log) => (
                <TableRow key={log.id} hover>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDateTime(log.createdAt)}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{log.actorUsername ?? '—'}</TableCell>
                  <TableCell>
                    <Box
                      component="code"
                      sx={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 12, bgcolor: 'grey.100', px: 0.75, py: 0.25, borderRadius: 1 }}
                    >
                      {log.action}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <SoftChip tone={log.status === 'success' ? 'success' : 'error'} dot>
                      {log.status === 'success' ? 'Success' : 'Failure'}
                    </SoftChip>
                  </TableCell>
                  <TableCell>{describe(log) || '—'}</TableCell>
                  <TableCell>
                    <Tooltip title={log.userAgent ?? ''}>
                      <span>{log.ip ?? '—'}</span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && data?.items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    No audit entries found.
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
    </>
  )
}
