import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'

export const SESSION_EXPIRED_EVENT = 'baskio:session-expired'

const SAFE_METHODS = new Set(['get', 'head', 'options'])
const NO_REFRESH_URLS = ['/auth/login', '/auth/refresh', '/auth/logout', '/auth/csrf']

export const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  timeout: 180_000,
})

let csrfToken: string | null = null
let csrfRequest: Promise<string> | null = null

export function setCsrfToken(token: string | null) {
  csrfToken = token
}

async function getCsrfToken(): Promise<string> {
  if (csrfToken) return csrfToken
  csrfRequest ??= axios
    .get<{ csrfToken: string }>('/api/v1/auth/csrf', { withCredentials: true })
    .then(({ data }) => {
      csrfToken = data.csrfToken
      return data.csrfToken
    })
    .finally(() => {
      csrfRequest = null
    })
  return csrfRequest
}

api.interceptors.request.use(async (config) => {
  if (!SAFE_METHODS.has((config.method ?? 'get').toLowerCase())) {
    config.headers.set('X-CSRF-Token', await getCsrfToken())
  }
  return config
})

let refreshRequest: Promise<void> | null = null

function refreshSession(): Promise<void> {
  refreshRequest ??= api
    .post('/auth/refresh')
    .then(() => undefined)
    .finally(() => {
      refreshRequest = null
    })
  return refreshRequest
}

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean; _csrfRetried?: boolean }

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ error?: { code?: string } }>) => {
    const config = error.config as RetriableConfig | undefined
    const status = error.response?.status
    const code = error.response?.data?.error?.code
    if (!config) throw error

    if (status === 403 && code === 'CSRF_INVALID' && !config._csrfRetried) {
      config._csrfRetried = true
      csrfToken = null
      return api(config)
    }

    const refreshable = !NO_REFRESH_URLS.some((url) => config.url?.startsWith(url))
    if (status === 401 && refreshable && !config._retried) {
      config._retried = true
      try {
        await refreshSession()
        return api(config)
      } catch {
        window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
      }
    }
    throw error
  },
)

/** Extracts a user-facing message from an API error. */
export function getErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { error?: { message?: string; details?: { path: string; message: string }[] } }
      | undefined
    const details = data?.error?.details
    if (details?.length) return details.map((d) => d.message).join('. ')
    if (data?.error?.message) return data.error.message
    if (error.code === 'ECONNABORTED') return 'The request timed out. Try narrowing the filters.'
    if (!error.response) return 'Unable to reach the server. Check your connection.'
  }
  return fallback
}
