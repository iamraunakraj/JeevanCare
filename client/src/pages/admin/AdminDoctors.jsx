import { useEffect, useState, useCallback } from 'react'
import { DataGrid } from '@mui/x-data-grid'
import { Chip, Button, Tabs, Tab } from '@mui/material'
import {
  getAllDoctorsAdmin,
  verifyDoctor,
  suspendDoctor,
  activateDoctor,
} from '../../services/admin.service.js'

const STATUS_TABS = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Verified', value: 'verified' },
  { label: 'Suspended', value: 'suspended' },
]

const STATUS_COLORS = { pending: 'warning', verified: 'success', suspended: 'error' }

function AdminDoctors() {
  const [tab, setTab] = useState(0)
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoadingId, setActionLoadingId] = useState(null)

  const loadDoctors = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getAllDoctorsAdmin(STATUS_TABS[tab].value)
      setDoctors(res.doctors)
    } finally {
      setLoading(false)
    }
  }, [tab])

  useEffect(() => {
    loadDoctors()
  }, [loadDoctors])

  async function handleAction(actionFn, id) {
    setActionLoadingId(id)
    try {
      await actionFn(id)
      await loadDoctors()
    } finally {
      setActionLoadingId(null)
    }
  }

  const columns = [
    { field: 'name', headerName: 'Name', flex: 1, minWidth: 160 },
    { field: 'specialization', headerName: 'Specialization', flex: 1, minWidth: 140 },
    { field: 'clinicName', headerName: 'Clinic', flex: 1, minWidth: 160 },
    { field: 'area', headerName: 'Area', width: 120 },
    { field: 'consultationFee', headerName: 'Fee', width: 90 },
    {
      field: 'verificationStatus',
      headerName: 'Status',
      width: 130,
      renderCell: (params) => (
        <Chip label={params.value} size="small" color={STATUS_COLORS[params.value] || 'default'} />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 220,
      sortable: false,
      renderCell: (params) => {
        const doc = params.row
        const isLoading = actionLoadingId === doc.id
        return (
          <div className="flex gap-1">
            {doc.verificationStatus === 'pending' && (
              <Button
                size="small"
                variant="contained"
                disabled={isLoading}
                onClick={() => handleAction(verifyDoctor, doc.id)}
              >
                Verify
              </Button>
            )}
            {doc.verificationStatus !== 'suspended' ? (
              <Button
                size="small"
                variant="outlined"
                color="error"
                disabled={isLoading}
                onClick={() => handleAction(suspendDoctor, doc.id)}
              >
                Suspend
              </Button>
            ) : (
              <Button
                size="small"
                variant="outlined"
                color="success"
                disabled={isLoading}
                onClick={() => handleAction(activateDoctor, doc.id)}
              >
                Activate
              </Button>
            )}
          </div>
        )
      },
    },
  ]

  // DataGrid ko har row ka unique 'id' chahiye — Mongo ka '_id' use kar rahe hain
  const rows = doctors.map((d) => ({ ...d, id: d._id }))

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Manage Doctors</h1>

      <Tabs value={tab} onChange={(e, v) => setTab(v)} className="mb-4">
        {STATUS_TABS.map((t) => (
          <Tab key={t.label} label={t.label} />
        ))}
      </Tabs>

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

export default AdminDoctors