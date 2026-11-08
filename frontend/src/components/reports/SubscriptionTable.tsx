import { InboxOutlined } from '@mui/icons-material'
import {
  Avatar,
  Box,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Typography,
} from '@mui/material'
import SoftChip from '../common/SoftChip'
import type { ReportFilters, SortBy, SubscriptionRow } from '../../types'
import { formatDay, formatPrice } from '../../utils/format'
import { humanizeState, stateTone } from '../../utils/status'

interface Props {
  rows: SubscriptionRow[]
  total: number
  page: number
  limit: number
  loading: boolean
  sortBy: SortBy
  sortOrder: ReportFilters['sortOrder']
  onSort: (field: SortBy) => void
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
}

const AVATAR_COLORS = ['#13213f', '#2a3b63', '#175cd3', '#067647', '#b54708', '#6941c6', '#c11574']

function avatarColor(seed: string) {
  let hash = 0
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) | 0
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function initials(name: string | null) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase()
}

function Validity({ days }: { days: number | null }) {
  if (days === null) return <SoftChip>No end date</SoftChip>
  if (days < 0) return <SoftChip tone="error">Expired {Math.abs(days)}d ago</SoftChip>
  if (days <= 30) return <SoftChip tone="warning">{days}d left</SoftChip>
  return <SoftChip tone="success">{days}d left</SoftChip>
}

const COLUMNS: { label: string; sort?: SortBy; align?: 'right' }[] = [
  { label: 'Customer', sort: 'customerName' },
  { label: 'Contact' },
  { label: 'Location' },
  { label: 'Package', sort: 'package' },
  { label: 'Status', sort: 'status' },
  { label: 'Price', align: 'right' },
  { label: 'Start date', sort: 'startDate' },
  { label: 'End date', sort: 'endDate' },
  { label: 'Validity' },
]

export default function SubscriptionTable(props: Props) {
  const { rows, total, page, limit, loading, sortBy, sortOrder, onSort, onPageChange, onLimitChange } = props

  return (
    <>
      <Box sx={{ height: 2 }}>{loading && <LinearProgress color="secondary" sx={{ height: 2, borderRadius: 0 }} />}</Box>
      <TableContainer sx={{ maxHeight: 'calc(100vh - 360px)', minHeight: 360 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {COLUMNS.map((col) => (
                <TableCell key={col.label} align={col.align}>
                  {col.sort ? (
                    <TableSortLabel
                      active={sortBy === col.sort}
                      direction={sortBy === col.sort ? sortOrder : 'asc'}
                      onClick={() => onSort(col.sort as SortBy)}
                    >
                      {col.label}
                    </TableSortLabel>
                  ) : (
                    col.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody sx={{ opacity: loading ? 0.55 : 1, transition: 'opacity .2s' }}>
            {rows.map((row) => (
              <TableRow key={`${row.contactId}-${row.serviceId ?? row.startDate}`} hover>
                <TableCell sx={{ minWidth: 220 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ width: 34, height: 34, fontSize: 13, fontWeight: 700, bgcolor: avatarColor(row.contactId) }}>
                      {initials(row.customerName)}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.35 }}>
                        {row.customerName ?? '—'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" component="div" sx={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                        {row.contactCode ? `#${row.contactCode}` : 'No contact code'}
                        {row.customerType ? ` · ${humanizeState(row.customerType)}` : ''}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell sx={{ minWidth: 180 }}>
                  <Typography variant="body2" sx={{ whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                    {row.phone ?? '—'}
                  </Typography>
                  {row.email && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', wordBreak: 'break-all' }}>
                      {row.email}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{row.island ?? '—'}</Typography>
                  {row.atoll && (
                    <Typography variant="caption" color="text.secondary">
                      {row.atoll}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>{row.package ? <SoftChip tone="brand">{row.package}</SoftChip> : '—'}</TableCell>
                <TableCell>
                  {row.status ? (
                    <SoftChip tone={stateTone(row.status)} dot>
                      {humanizeState(row.status)}
                    </SoftChip>
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell align="right" sx={{ whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
                  {formatPrice(row.price)}
                </TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{formatDay(row.startDate)}</TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{formatDay(row.endDate)}</TableCell>
                <TableCell>
                  <Validity days={row.daysRemaining} />
                </TableCell>
              </TableRow>
            ))}
            {!loading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={COLUMNS.length} sx={{ py: 10, borderBottom: 0 }}>
                  <Box sx={{ display: 'grid', justifyItems: 'center', gap: 1, color: 'text.secondary' }}>
                    <Box sx={{ width: 52, height: 52, borderRadius: '50%', bgcolor: 'grey.100', display: 'grid', placeItems: 'center' }}>
                      <InboxOutlined sx={{ color: 'grey.400' }} />
                    </Box>
                    <Typography sx={{ fontWeight: 600, color: 'text.primary' }}>No subscriptions found</Typography>
                    <Typography variant="body2">Try adjusting your search or filters.</Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={total}
        page={Math.max(0, page - 1)}
        rowsPerPage={limit}
        rowsPerPageOptions={[10, 25, 50, 100]}
        onPageChange={(_e, next) => onPageChange(next + 1)}
        onRowsPerPageChange={(e) => onLimitChange(Number(e.target.value))}
      />
    </>
  )
}
