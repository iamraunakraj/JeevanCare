import { useEffect, useState } from 'react'
import { Paper, CircularProgress } from '@mui/material'
import { getStats } from '../../services/admin.service.js'

const STAT_CARDS = [
  { key: 'totalDoctors', label: 'Total Doctors' },
  { key: 'verifiedDoctors', label: 'Verified Doctors' },
  { key: 'pendingDoctors', label: 'Pending Verification' },
  { key: 'totalPatients', label: 'Total Patients' },
  { key: 'appointmentsToday', label: "Today's Appointments" },
  { key: 'activeQueuesToday', label: 'Active Queue (Today)' },
  { key: 'completedAppointments', label: 'Completed Appointments' },
  { key: 'cancelledAppointments', label: 'Cancelled Appointments' },
]

function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getStats().then((res) => setStats(res.stats)).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-20"><CircularProgress /></div>

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Platform Overview</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STAT_CARDS.map((card) => (
          <Paper key={card.key} elevation={0} className="border border-gray-200 rounded-2xl p-5">
            <p className="text-xs text-gray-500 uppercase">{card.label}</p>
            <p className="text-3xl font-bold mt-1">{stats?.[card.key] ?? 0}</p>
          </Paper>
        ))}
      </div>
    </div>
  )
}

export default AdminDashboard