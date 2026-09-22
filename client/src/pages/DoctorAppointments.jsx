import { useEffect, useState } from 'react'
import { Chip, Button, CircularProgress } from '@mui/material'
import { getDoctorAppointments, updateAppointmentStatus } from '../services/appointment.service.js'
import { markCashPaid } from '../services/payment.service.js'

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

const STATUS_COLORS = {
  pending: 'warning',
  confirmed: 'info',
  completed: 'success',
  cancelled: 'default',
  rejected: 'error',
  no_show: 'error',
}

function DoctorAppointments() {
  const [date, setDate] = useState(todayStr())
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState(null)

  async function loadAppointments() {
    setLoading(true)
    try {
      const res = await getDoctorAppointments({ date })
      setAppointments(res.appointments)
    } catch (err) {
      setAppointments([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAppointments()
  }, [date])

  async function handleStatusChange(id, status) {
    setUpdatingId(id)
    try {
      await updateAppointmentStatus(id, status)
      await loadAppointments()
    } finally {
      setUpdatingId(null)
    }
  }

  async function handleMarkPaid(id) {
    setUpdatingId(id)
    try {
      await markCashPaid(id)
      await loadAppointments()
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h1 className="text-2xl font-semibold">Appointments</h1>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><CircularProgress /></div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-16 text-gray-500">No appointments on this date.</div>
      ) : (
        <div className="flex flex-col gap-3">
          {appointments.map((appt) => (
            <div key={appt._id} className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{appt.patientDetails?.name}</h3>
                <div className="flex gap-1">
                  <Chip
                    label={appt.appointmentStatus.replace('_', ' ')}
                    size="small"
                    color={STATUS_COLORS[appt.appointmentStatus] || 'default'}
                  />
                  <Chip
                    label={appt.paymentStatus === 'payment_paid' ? '₹ Paid' : '₹ Unpaid'}
                    size="small"
                    color={appt.paymentStatus === 'payment_paid' ? 'success' : 'default'}
                    variant="outlined"
                  />
                </div>
              </div>
              <p className="text-sm text-gray-500">{appt.time} · {appt.patientDetails?.phone} · ₹{appt.amount}</p>
              {appt.reason && <p className="text-sm text-gray-600 mt-1">Reason: {appt.reason}</p>}

              <div className="flex gap-2 mt-3 flex-wrap">
                {['pending', 'confirmed'].includes(appt.appointmentStatus) && (
                  <>
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      disabled={updatingId === appt._id}
                      onClick={() => handleStatusChange(appt._id, 'completed')}
                    >
                      Mark Completed
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      disabled={updatingId === appt._id}
                      onClick={() => handleStatusChange(appt._id, 'no_show')}
                    >
                      No Show
                    </Button>
                  </>
                )}
                {appt.paymentStatus !== 'payment_paid' && (
                  <Button
                    size="small"
                    variant="outlined"
                    disabled={updatingId === appt._id}
                    onClick={() => handleMarkPaid(appt._id)}
                  >
                    Mark as Paid (Cash)
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default DoctorAppointments