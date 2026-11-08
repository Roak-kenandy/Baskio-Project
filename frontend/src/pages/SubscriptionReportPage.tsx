import { Download, Refresh } from '@mui/icons-material'
import { Alert, Button, Card, Snackbar, Stack, Typography } from '@mui/material'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { getErrorMessage } from '../api/client'
import { reportsApi } from '../api/reports.api'
import PageHeader from '../components/common/PageHeader'
import SoftChip from '../components/common/SoftChip'
import ReportFilterBar from '../components/reports/ReportFilterBar'
import { DEFAULT_FILTERS } from '../constants/reports'
import SubscriptionTable from '../components/reports/SubscriptionTable'
import { useAuth } from '../context/AuthContext'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { PERMISSIONS, type ReportFilters, type ReportType, type SortBy, type SubscriptionPage } from '../types'
import { formatNumber } from '../utils/format'

const TITLES: Record<ReportType, { title: string; subtitle: string }> = {
  'medianet-tv': {
    title: 'Medianet TV subscribers',
    subtitle: 'Customers tagged “Medianet TV” with a BAISKOAFU subscription',
  },
  ott: {
    title: 'OTT subscribers',
    subtitle: 'Customers tagged “OTT” with a BAISKOAFU OTT subscription',
  },
}

export default function SubscriptionReportPage({ type }: { type: ReportType }) {
  const { can } = useAuth()
  const [filters, setFilters] = useState<ReportFilters>(DEFAULT_FILTERS)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(25)
  const [data, setData] = useState<SubscriptionPage | null>(null)
  const [states, setStates] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const debouncedSearch = useDebouncedValue(filters.search)
  const effectiveFilters = useMemo(() => ({ ...filters, search: debouncedSearch.trim() }), [filters, debouncedSearch])

  useEffect(() => {
    reportsApi.states(type).then(setStates).catch(() => setStates([]))
  }, [type])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    reportsApi
      .list(type, effectiveFilters, page, limit)
      .then((result) => !cancelled && setData(result))
      .catch((err) => !cancelled && setError(getErrorMessage(err)))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [type, effectiveFilters, page, limit, reloadKey])

  const updateFilters = useCallback((patch: Partial<ReportFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch }))
    setPage(1)
  }, [])

  const onSort = (field: SortBy) => {
    updateFilters({
      sortBy: field,
      sortOrder: filters.sortBy === field && filters.sortOrder === 'asc' ? 'desc' : 'asc',
    })
  }

  const onExport = async () => {
    setExporting(true)
    try {
      await reportsApi.exportCsv(type, effectiveFilters)
      setToast('Export downloaded.')
    } catch (err) {
      setToast(getErrorMessage(err, 'Export failed.'))
    } finally {
      setExporting(false)
    }
  }

  const { title, subtitle } = TITLES[type]

  return (
    <>
      <PageHeader
        eyebrow={type === 'ott' ? 'OTT · BAISKOAFU OTT' : 'Medianet TV · BAISKOAFU'}
        title={title}
        subtitle={subtitle}
        actions={
          <>
            <Button variant="outlined" startIcon={<Refresh />} onClick={() => setReloadKey((k) => k + 1)} disabled={loading}>
              Refresh
            </Button>
            {can(PERMISSIONS.REPORT_EXPORT) && (
              <Button variant="contained" startIcon={<Download />} onClick={onExport} loading={exporting} disabled={!data?.total}>
                Export CSV
              </Button>
            )}
          </>
        }
      />

      {data?.piiMasked && (
        <Alert severity="info" variant="outlined" sx={{ mb: 2, bgcolor: '#fff' }}>
          Phone numbers and emails are partially hidden. Ask an administrator for the “View full contact details” permission if you need them.
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card>
        <Stack direction="row" sx={{ px: 2, pt: 2, alignItems: 'baseline', gap: 1 }}>
          <Typography variant="h6">Subscriptions</Typography>
          {data && <SoftChip tone="brand">{formatNumber(data.total)}</SoftChip>}
        </Stack>
        <ReportFilterBar
          filters={filters}
          states={states}
          onChange={updateFilters}
          onReset={() => {
            setFilters(DEFAULT_FILTERS)
            setPage(1)
          }}
        />

        <SubscriptionTable
          rows={data?.items ?? []}
          total={data?.total ?? 0}
          page={page}
          limit={limit}
          loading={loading}
          sortBy={filters.sortBy}
          sortOrder={filters.sortOrder}
          onSort={onSort}
          onPageChange={setPage}
          onLimitChange={(next) => {
            setLimit(next)
            setPage(1)
          }}
        />
      </Card>

      <Snackbar open={Boolean(toast)} autoHideDuration={5000} onClose={() => setToast(null)} message={toast} />
    </>
  )
}
