import type { ReportFilters } from '../types'

export const DEFAULT_FILTERS: ReportFilters = {
  search: '',
  state: '',
  expiry: 'all',
  startFrom: '',
  startTo: '',
  endFrom: '',
  endTo: '',
  sortBy: 'endDate',
  sortOrder: 'desc',
}
