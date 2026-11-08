import {
  ArrowForward,
  EventBusyOutlined,
  GroupsOutlined,
  HourglassBottomOutlined,
  LiveTvOutlined,
  PhoneIphoneOutlined,
  TaskAltOutlined,
} from '@mui/icons-material'
import { Alert, Box, Button, Card, Skeleton, Stack, Tooltip, Typography } from '@mui/material'
import { useEffect, useState, type ReactNode } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { getErrorMessage } from '../api/client'
import { reportsApi } from '../api/reports.api'
import PageHeader from '../components/common/PageHeader'
import SoftChip from '../components/common/SoftChip'
import { useAuth } from '../context/AuthContext'
import { BRAND } from '../theme'
import type { ReportSummary } from '../types'
import { formatDateTime, formatNumber } from '../utils/format'

const COLORS = { active: '#17b26a', expiring: '#f79009', expired: '#f04438' }

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function KpiCard({ label, value, icon, accent, hint }: { label: string; value: number; icon: ReactNode; accent: string; hint?: string }) {
  return (
    <Card sx={{ p: 2.5 }}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
            {label}
          </Typography>
          <Typography sx={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em', mt: 0.75, lineHeight: 1.1 }}>
            {formatNumber(value)}
          </Typography>
          {hint && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
              {hint}
            </Typography>
          )}
        </Box>
        <Box sx={{ width: 42, height: 42, borderRadius: 2.5, display: 'grid', placeItems: 'center', color: accent, bgcolor: `${accent}1a` }}>
          {icon}
        </Box>
      </Stack>
    </Card>
  )
}

function Stat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <Box>
      <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
        {color && <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color }} />}
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
          {label}
        </Typography>
      </Stack>
      <Typography sx={{ fontSize: 20, fontWeight: 700, mt: 0.25 }}>{formatNumber(value)}</Typography>
    </Box>
  )
}

function DistributionBar({ report }: { report: ReportSummary }) {
  const later = Math.max(0, report.active - report.expiringIn30Days)
  const segments = [
    { key: 'active', value: later, color: COLORS.active, label: 'Active (> 30 days)' },
    { key: 'expiring', value: report.expiringIn30Days, color: COLORS.expiring, label: 'Expiring within 30 days' },
    { key: 'expired', value: report.expired, color: COLORS.expired, label: 'Expired' },
  ]
  const total = segments.reduce((sum, s) => sum + s.value, 0)
  return (
    <Box sx={{ display: 'flex', height: 8, borderRadius: 999, overflow: 'hidden', bgcolor: 'grey.100', gap: '2px' }}>
      {total > 0 &&
        segments
          .filter((s) => s.value > 0)
          .map((s) => (
            <Tooltip key={s.key} title={`${s.label}: ${formatNumber(s.value)}`}>
              <Box sx={{ width: `${(s.value / total) * 100}%`, bgcolor: s.color }} />
            </Tooltip>
          ))}
    </Box>
  )
}

function ReportCard({ report }: { report: ReportSummary }) {
  const activeRate = report.total ? Math.round((report.active / report.total) * 100) : 0
  return (
    <Card sx={{ p: 3, display: 'flex', flexDirection: 'column' }}>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 3 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 3,
            display: 'grid',
            placeItems: 'center',
            color: BRAND.gold,
            background: `linear-gradient(145deg, ${BRAND.navyLight}, ${BRAND.navy})`,
          }}
        >
          {report.key === 'ott' ? <PhoneIphoneOutlined /> : <LiveTvOutlined />}
        </Box>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="h6">{report.label}</Typography>
          <Stack direction="row" spacing={0.75} sx={{ mt: 0.5, flexWrap: 'wrap' }}>
            <SoftChip tone="brand">Tag: {report.tag}</SoftChip>
            {report.products.map((p) => (
              <SoftChip key={p} tone="info">
                {p}
              </SoftChip>
            ))}
          </Stack>
        </Box>
        <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
          <Typography sx={{ fontSize: 26, fontWeight: 700, color: 'success.main', lineHeight: 1 }}>{activeRate}%</Typography>
          <Typography variant="caption" color="text.secondary">
            active rate
          </Typography>
        </Box>
      </Stack>

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(5, 1fr)' }, mb: 2.5 }}>
        <Stat label="Customers" value={report.customers} />
        <Stat label="Subscriptions" value={report.total} />
        <Stat label="Active" value={report.active} color={COLORS.active} />
        <Stat label="Expiring ≤ 30d" value={report.expiringIn30Days} color={COLORS.expiring} />
        <Stat label="Expired" value={report.expired} color={COLORS.expired} />
      </Box>

      <DistributionBar report={report} />

      <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'flex-end' }}>
        <Button component={RouterLink} to={`/reports/${report.key}`} endIcon={<ArrowForward />} variant="contained">
          View report
        </Button>
      </Box>
    </Card>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [data, setData] = useState<{ reports: ReportSummary[]; generatedAt: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    reportsApi
      .summary()
      .then(setData)
      .catch((err) => setError(getErrorMessage(err)))
  }, [])

  const totals = (data?.reports ?? []).reduce(
    (acc, r) => ({
      customers: acc.customers + r.customers,
      active: acc.active + r.active,
      expiring: acc.expiring + r.expiringIn30Days,
      expired: acc.expired + r.expired,
    }),
    { customers: 0, active: 0, expiring: 0, expired: 0 },
  )

  const firstName = user?.fullName?.split(' ')[0] ?? ''

  return (
    <>
      <PageHeader
        eyebrow="Dashboard"
        title={`${greeting()}, ${firstName}`}
        subtitle={data ? `Here's how BAISKOAFU subscriptions look today · updated ${formatDateTime(data.generatedAt)}` : 'Subscription overview'}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      {data && data.reports.length === 0 && (
        <Alert severity="info">No reports have been assigned to your account yet. Contact an administrator.</Alert>
      )}

      {(!data || data.reports.length > 0) && !error && (
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr 1fr', lg: 'repeat(4, 1fr)' }, mb: 3 }}>
          {!data ? (
            [0, 1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" height={118} sx={{ borderRadius: 3.5 }} />)
          ) : (
            <>
              <KpiCard label="Total customers" value={totals.customers} icon={<GroupsOutlined />} accent="#2e90fa" />
              <KpiCard label="Active subscriptions" value={totals.active} icon={<TaskAltOutlined />} accent={COLORS.active} />
              <KpiCard label="Expiring in 30 days" value={totals.expiring} icon={<HourglassBottomOutlined />} accent={COLORS.expiring} />
              <KpiCard label="Expired" value={totals.expired} icon={<EventBusyOutlined />} accent={COLORS.expired} />
            </>
          )}
        </Box>
      )}

      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: { xs: '1fr', xl: '1fr 1fr' } }}>
        {!data && !error && [0, 1].map((i) => <Skeleton key={i} variant="rounded" height={260} sx={{ borderRadius: 3.5 }} />)}
        {data?.reports.map((report) => <ReportCard key={report.key} report={report} />)}
      </Box>
    </>
  )
}
