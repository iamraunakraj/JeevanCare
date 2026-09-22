import { useEffect, useState, useCallback } from 'react'
import { DataGrid } from '@mui/x-data-grid'
import { Chip, Select, MenuItem, FormControl, InputLabel } from '@mui/material'
import { getAllAppointmentsAdmin } from '../../services/admin.service.js'

const STATUS_COLORS = {
  pending: 'warning',
  confirmed: 'info',
  completed: 'success',
  cancelled: 'default',
  rejected: 'error',
  no_show: 'error',
}

function AdminAppointments() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getAllAppointmentsAdmin({ status: statusFilter || undefined })
      setAppointments(res.appointments)
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    load()
  }, [load])

  const columns = [
    { field: 'patientName', headerName: 'Patient', flex: 1, minWidth: 140 },
    { field: 'doctorName', headerName: 'Doctor', flex: 1, minWidth: 160 },
    { field: 'date', headerName: 'Date', width: 110 },
    { field: 'time', headerName: 'Time', width: 90 },
    { field: 'amount', headerName: 'Amount', width: 90 },
    {
      field: 'appointmentStatus',
      headerName: 'Status',
      width: 130,
      renderCell: (params) => (
        <Chip label={params.value?.replace('_', ' ')} size="small" color={STATUS_COLORS[params.value] || 'default'} />
      ),
    },
    { field: 'paymentStatus', headerName: 'Payment', width: 140 },
  ]

  const rows = appointments.map((a) => ({
    ...a,
    id: a._id,
    patientName: a.patient?.name || 'N/A',
    doctorName: a.doctor?.name || 'N/A',
  }))

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">All Appointments</h1>
        <FormControl size="small" className="min-w-[160px]">
          <InputLabel>Status</InputLabel>
          <Select label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="confirmed">Confirmed</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
            <MenuItem value="rejected">Rejected</MenuItem>
            <MenuItem value="no_show">No Show</MenuItem>
          </Select>
        </FormControl>
      </div>

      <div style={{ height: 500, width: '100%' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          pageSizeOptions={[10, 25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          disableRowSelectionOnClick
        />
      </div>
    </div>
  )
}

export default AdminAppointments