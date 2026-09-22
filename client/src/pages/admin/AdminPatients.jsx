import { useEffect, useState, useCallback } from 'react'
import { DataGrid } from '@mui/x-data-grid'
import { Chip, Button } from '@mui/material'
import { getAllPatients, blockUser, unblockUser } from '../../services/admin.service.js'

function AdminPatients() {
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoadingId, setActionLoadingId] = useState(null)

  const loadPatients = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getAllPatients()
      setPatients(res.patients)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPatients()
  }, [loadPatients])

  async function handleToggleBlock(patient) {
    setActionLoadingId(patient._id)
    try {
      if (patient.isBlocked) await unblockUser(patient._id)
      else await blockUser(patient._id)
      await loadPatients()
    } finally {
      setActionLoadingId(null)
    }
  }

  const columns = [
    { field: 'name', headerName: 'Name', flex: 1, minWidth: 160 },
    { field: 'email', headerName: 'Email', flex: 1, minWidth: 200 },
    { field: 'phone', headerName: 'Phone', width: 130 },
    {
      field: 'isBlocked',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Blocked' : 'Active'}
          size="small"
          color={params.value ? 'error' : 'success'}
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 140,
      sortable: false,
      renderCell: (params) => (
        <Button
          size="small"
          variant="outlined"
          color={params.row.isBlocked ? 'success' : 'error'}
          disabled={actionLoadingId === params.row.id}
          onClick={() => handleToggleBlock(params.row)}
        >
          {params.row.isBlocked ? 'Unblock' : 'Block'}
        </Button>
      ),
    },
  ]

  const rows = patients.map((p) => ({ ...p, id: p._id }))

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Manage Patients</h1>
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

export default AdminPatients