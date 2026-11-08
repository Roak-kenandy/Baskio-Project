import { CloseRounded, SearchRounded, TuneRounded } from '@mui/icons-material'
import { Badge, Box, Button, Collapse, InputAdornment, MenuItem, Stack, TextField, ToggleButton, ToggleButtonGroup } from '@mui/material'
import { useState } from 'react'
import { DEFAULT_FILTERS } from '../../constants/reports'
import type { ReportFilters } from '../../types'
import { humanizeState } from '../../utils/status'

interface Props {
  filters: ReportFilters
  states: string[]
  onChange: (patch: Partial<ReportFilters>) => void
  onReset: () => void
}

const DATE_KEYS = ['startFrom', 'startTo', 'endFrom', 'endTo'] as const

export default function ReportFilterBar({ filters, states, onChange, onReset }: Props) {
  const activeDateFilters = DATE_KEYS.filter((key) => filters[key]).length
  const [showDates, setShowDates] = useState(activeDateFilters > 0)
  const dirty = (['search', 'state', 'expiry', ...DATE_KEYS] as const).some((key) => filters[key] !== DEFAULT_FILTERS[key])

  const dateField = (key: (typeof DATE_KEYS)[number], label: string) => (
    <TextField
      type="date"
      label={label}
      value={filters[key]}
      onChange={(e) => onChange({ [key]: e.target.value })}
      slotProps={{ inputLabel: { shrink: true } }}
      fullWidth
    />
  )

  return (
    <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
      <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.5} sx={{ alignItems: { lg: 'center' } }}>
        <TextField
          placeholder="Search by name, phone, email or contact ID"
          value={filters.search}
          onChange={(e) => onChange({ search: e.target.value })}
          sx={{ flexGrow: 1, minWidth: { lg: 280 } }}
          slotProps={{
            htmlInput: { maxLength: 100 },
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRounded fontSize="small" sx={{ color: 'grey.400' }} />
                </InputAdornment>
              ),
            },
          }}
        />
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap', rowGap: 1.5 }}>
          <TextField
            select
            value={filters.state}
            onChange={(e) => onChange({ state: e.target.value })}
            sx={{ minWidth: 170 }}
            slotProps={{ select: { displayEmpty: true } }}
          >
            <MenuItem value="">All statuses</MenuItem>
            {states.map((state) => (
              <MenuItem key={state} value={state}>
                {humanizeState(state)}
              </MenuItem>
            ))}
          </TextField>

          <ToggleButtonGroup
            exclusive
            size="small"
            value={filters.expiry}
            onChange={(_e, value) => value && onChange({ expiry: value })}
            sx={{
              bgcolor: 'grey.100',
              p: '3px',
              borderRadius: 2.25,
              '& .MuiToggleButton-root': {
                border: 0,
                borderRadius: '7px !important',
                px: 1.5,
                py: 0.5,
                textTransform: 'none',
                fontWeight: 600,
                color: 'grey.500',
                '&.Mui-selected': { bgcolor: '#fff', color: 'text.primary', boxShadow: '0 1px 3px rgba(15,23,42,0.12)' },
                '&.Mui-selected:hover': { bgcolor: '#fff' },
              },
            }}
          >
            <ToggleButton value="all">All</ToggleButton>
            <ToggleButton value="active">Valid</ToggleButton>
            <ToggleButton value="expired">Expired</ToggleButton>
          </ToggleButtonGroup>

          <Badge color="secondary" badgeContent={activeDateFilters} invisible={!activeDateFilters}>
            <Button
              variant={showDates ? 'contained' : 'outlined'}
              color={showDates ? 'primary' : 'inherit'}
              startIcon={<TuneRounded />}
              onClick={() => setShowDates((v) => !v)}
            >
              Dates
            </Button>
          </Badge>

          {dirty && (
            <Button startIcon={<CloseRounded />} onClick={onReset} variant="text">
              Clear
            </Button>
          )}
        </Stack>
      </Stack>

      <Collapse in={showDates} unmountOnExit>
        <Box sx={{ display: 'grid', gap: 1.5, mt: 2, gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' } }}>
          {dateField('startFrom', 'Start date from')}
          {dateField('startTo', 'Start date to')}
          {dateField('endFrom', 'End date from')}
          {dateField('endTo', 'End date to')}
        </Box>
      </Collapse>
    </Box>
  )
}
