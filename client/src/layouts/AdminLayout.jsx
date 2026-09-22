import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { Drawer, List, ListItemButton, ListItemText, Toolbar, Box, Button } from '@mui/material'
import { useAuth } from '../context/Authcontext.jsx'

const DRAWER_WIDTH = 220

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/admin/dashboard' },
  { label: 'Doctors', path: '/admin/doctors' },
  { label: 'Patients', path: '/admin/patients' },
  { label: 'Appointments', path: '/admin/appointments' },
]

function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()

  return (
    <Box className="flex">
      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER_WIDTH,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: DRAWER_WIDTH, boxSizing: 'border-box' },
        }}
      >
        <Toolbar>
          <span className="font-bold text-primary">JeevanCare Admin</span>
        </Toolbar>
        <List>
          {NAV_ITEMS.map((item) => (
            <ListItemButton
              key={item.path}
              component={Link}
              to={item.path}
              selected={location.pathname === item.path}
            >
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
        <Box className="mt-auto p-3">
          <Button
            fullWidth
            variant="outlined"
            onClick={() => {
              logout()
              navigate('/')
            }}
          >
            Logout
          </Button>
        </Box>
      </Drawer>

      <Box component="main" className="flex-1 p-6">
        <Outlet />
      </Box>
    </Box>
  )
}

export default AdminLayout