import { createTheme } from '@mui/material/styles'

export const muiTheme = createTheme({
  palette: {
    primary: {
      main: '#0f766e',
      dark: '#0b5a54',
      light: '#14b8a6',
    },
    secondary: {
      main: '#f59e0b',
    },
    background: {
      default: '#fafafa',
    },
    text: {
      primary: '#1e293b',
      secondary: '#64748b',
    },
  },
  typography: {
    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    h1: { fontWeight: 800 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 600 }, // MUI default ALL-CAPS buttons hata diya
  },
  shape: {
    borderRadius: 12, // zyada rounded, modern feel
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          paddingLeft: 20,
          paddingRight: 20,
        },
        contained: {
          boxShadow: 'none',
          '&:hover': { boxShadow: '0 4px 12px rgba(15, 118, 110, 0.25)' },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' }, // MUI ka default dark-mode overlay hata diya
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 500 },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
      },
    },
  },
})