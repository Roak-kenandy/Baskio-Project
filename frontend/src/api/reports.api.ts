import axios from 'axios'
import { api } from './client'
import type { ReportFilters, ReportInfo, ReportSummary, ReportType, SubscriptionPage } from '../types'

function toParams(filters: Partial<ReportFilters> & { page?: number; limit?: number }) {
  return Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== '' && value !== undefined))
}

export const reportsApi = {
  async available(): Promise<{ reports: ReportInfo[]; timezone: string }> {
    const { data } = await api.get('/meta/reports')
    return data
  },

  async summary(): Promise<{ reports: ReportSummary[]; generatedAt: string }> {
    const { data } = await api.get('/reports/summary')
    return data
  },

  async list(type: ReportType, filters: ReportFilters, page: number, limit: number): Promise<SubscriptionPage> {
    const { data } = await api.get(`/reports/subscriptions/${type}`, { params: toParams({ ...filters, page, limit }) })
    return data
  },

  async states(type: ReportType): Promise<string[]> {
    const { data } = await api.get<{ states: string[] }>(`/reports/subscriptions/${type}/states`)
    return data.states
  },

  async exportCsv(type: ReportType, filters: ReportFilters): Promise<void> {
    let response
    try {
      response = await api.get<Blob>(`/reports/subscriptions/${type}/export`, {
        params: toParams(filters),
        responseType: 'blob',
        timeout: 600_000,
      })
    } catch (error) {
      // Error bodies arrive as a Blob because of responseType; decode so the message can be shown.
      if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
        try {
          error.response.data = JSON.parse(await error.response.data.text())
        } catch {
          /* keep original */
        }
      }
      throw error
    }
    const disposition = String(response.headers['content-disposition'] ?? '')
    const filename = /filename="([^"]+)"/.exec(disposition)?.[1] ?? `${type}-subscriptions.csv`
    const url = URL.createObjectURL(response.data)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  },
}
