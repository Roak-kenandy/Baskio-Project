import { alpha, createTheme } from '@mui/material/styles'

export const BRAND = {
  navy: '#13213f',
  navyDark: '#0b1530',
  navyLight: '#2a3b63',
  gold: '#e0b94a',
  goldDark: '#c49a26',
} as const

const SLATE = {
  50: '#f8fafc',
  100: '#f1f5f9',
  200: '#e2e8f0',
  300: '#cbd5e1',
  400: '#94a3b8',
  500: '#64748b',
  600: '#475569',
  700: '#334155',
  900: '#0f172a',
} as const

const FONT = '"Inter Variable", "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: BRAND.navy, dark: BRAND.navyDark, light: BRAND.navyLight, contrastText: '#fff' },
    secondary: { main: BRAND.gold, dark: BRAND.goldDark, contrastText: BRAND.navy },
    success: { main: '#16a34a', light: '#dcfce7', dark: '#15803d' },
    warning: { main: '#d97706', light: '#fef3c7', dark: '#b45309' },
    error: { main: '#dc2626', light: '#fee2e2', dark: '#b91c1c' },
    info: { main: '#2563eb', light: '#dbeafe', dark: '#1d4ed8' },
    text: { primary: SLATE[900], secondary: SLATE[500] },
    divider: SLATE[200],
    background: { default: '#f5f7fb', paper: '#ffffff' },
    grey: SLATE,
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: FONT,
    h4: { fontWeight: 700, letterSpacing: '-0.02em' },
    h5: { fontWeight: 700, letterSpacing: '-0.015em', fontSize: '1.4rem' },
    h6: { fontWeight: 650, letterSpacing: '-0.01em', fontSize: '1.05rem' },
    subtitle2: { fontWeight: 600 },
    body2: { fontSize: '0.875rem' },
    caption: { fontSize: '0.75rem' },
    overline: { fontWeight: 600, letterSpacing: '0.08em', fontSize: '0.68rem' },
    button: { textTransform: 'none', fontWeight: 600, letterSpacing: 0 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale' },
        '::selection': { backgroundColor: alpha(BRAND.gold, 0.35) },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { backgroundImage: 'none' },
        outlined: { borderColor: SLATE[200] },
      },
    },
    MuiCard: {
      defaultProps: { variant: 'outlined' },
      styleOverrides: {
        root: {
          borderRadius: 14,
          borderColor: SLATE[200],
          boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
        },
      },
    },
    MuiAppBar: { defaultProps: { elevation: 0 } },
    MuiDrawer: { styleOverrides: { paper: { borderRight: `1px solid ${SLATE[200]}` } } },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 9, paddingInline: 16 },
        sizeLarge: { paddingBlock: 11, fontSize: '0.95rem' },
        outlined: { borderColor: SLATE[300], color: SLATE[700], '&:hover': { borderColor: SLATE[400], backgroundColor: SLATE[50] } },
        text: { color: SLATE[600], '&:hover': { backgroundColor: SLATE[100] } },
      },
    },
    MuiIconButton: { styleOverrides: { root: { borderRadius: 8 } } },
    MuiTextField: { defaultProps: { size: 'small' } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: '#fff',
          borderRadius: 9,
          '& .MuiOutlinedInput-notchedOutline': { borderColor: SLATE[200] },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: SLATE[300] },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderWidth: 1, borderColor: BRAND.navy },
          '&.Mui-focused': { boxShadow: `0 0 0 3px ${alpha(BRAND.navy, 0.1)}` },
        },
      },
    },
    MuiInputLabel: { styleOverrides: { root: { color: SLATE[500] } } },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, borderRadius: 6 },
        sizeSmall: { height: 22, fontSize: '0.72rem' },
      },
    },
    MuiTableContainer: { styleOverrides: { root: { scrollbarWidth: 'thin' } } },
    MuiTableCell: {
      styleOverrides: {
        root: { borderBottomColor: SLATE[100], paddingBlock: 12 },
        head: {
          fontWeight: 600,
          fontSize: '0.72rem',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: SLATE[500],
          backgroundColor: SLATE[50],
          borderBottomColor: SLATE[200],
          whiteSpace: 'nowrap',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: { root: { '&.MuiTableRow-hover:hover': { backgroundColor: alpha(BRAND.navy, 0.025) } } },
    },
    MuiTablePagination: { styleOverrides: { root: { borderTop: `1px solid ${SLATE[200]}` } } },
    MuiAlert: {
      styleOverrides: { root: { borderRadius: 10, alignItems: 'center' } },
    },
    MuiDialog: { styleOverrides: { paper: { borderRadius: 16 } } },
    MuiDialogTitle: { styleOverrides: { root: { fontWeight: 700, fontSize: '1.1rem' } } },
    MuiMenu: {
      styleOverrides: {
        paper: { borderRadius: 12, border: `1px solid ${SLATE[200]}`, boxShadow: '0 12px 32px rgba(15, 23, 42, 0.12)' },
      },
    },
    MuiTooltip: { styleOverrides: { tooltip: { backgroundColor: SLATE[900], fontSize: '0.75rem', borderRadius: 6 } } },
    MuiLinearProgress: { styleOverrides: { root: { borderRadius: 4 } } },
  },
})
