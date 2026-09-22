import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider , CssBaseline } from '@mui/material'
import { muiTheme } from './theme/muiTheme.js'
import { AuthProvider } from './context/Authcontext.jsx'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        <AuthProvider>
        <App />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
