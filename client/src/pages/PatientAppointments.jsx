import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Tabs, Tab, Chip, Button, CircularProgress, Avatar } from '@mui/material'
import { getMyAppointments, cancelAppointment } from '../services/appointment.service.js'
import { openRazorpayCheckout } from '../services/payment.service.js'


const TABS = [
  { label: 'Upcoming', statuses: ['pending', 'confirmed'] },
  { label: 'Completed', statuses: ['completed'] },
  { label: 'Cancelled', statuses: ['cancelled', 'rejected', 'no_show'] },
]

const STATUS_COLORS = {
  pending: 'warning',
  confirmed: 'info',
  completed: 'success',
  cancelled: 'default',
  rejected: 'error',
  no_show: 'error',
}

function PatientAppointments() {
  const [tab, setTab] = useState(0)
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState(null)

  async function loadAppointments() {
    setLoading(true)
    try {
      const res = await getMyAppointments()
      setAppointments(res.appointments)
    } catch (err) {
      setAppointments([])
    } finally {
      setLoading(false)
    }
  }
async function reconcilePendingPayments(appts) {
  // Jo appointments 'online' method se the aur abhi tak paid nahi hain,
  // unke liye Razorpay se seedha status check kar lete hain — isse agar
  // koi payment background mein complete hui thi (handler miss hone ki wajah se),
  // woh yahan turant pakड़ li jaayegi, page load hote hi
  const toCheck = appts.filter(
    (a) => a.paymentMethod === 'online' && a.paymentStatus !== 'payment_paid'
  )
  if (toCheck.length === 0) return

  for (const appt of toCheck) {
    try {
      await checkPaymentStatus(appt._id)
    } catch (err) {
      // ignore — agar order hi nahi bana tha to yeh fail hoga, normal hai
    }
  }
}
  useEffect(() => {
    async function init(){
      const res = await getMyAppointments()
      await reconcilePendingPayments(res.appointments)
      await loadAppointments()
    }
    init()
  }, [])

  async function handleCancel(id) {
    setCancellingId(id)
    try {
      await cancelAppointment(id)
      await loadAppointments()
    } finally {
      setCancellingId(null)
    }
  }

  function handlePayNow(appt) {
    openRazorpayCheckout({
      appointmentId: appt._id,
      doctorName: appt.doctor?.name,
      onSuccess: loadAppointments,
      onFailure: () => {},
    })
  }

  const filtered = appointments.filter((a) => TABS[tab].statuses.includes(a.appointmentStatus))

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-4">My Appointments</h1>

      <Tabs value={tab} onChange={(e, v) => setTab(v)} className="mb-4">
        {TABS.map((t) => (
          <Tab key={t.label} label={t.label} />
        ))}
      </Tabs>

      {loading ? (
        <div className="flex justify-center py-16"><CircularProgress /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-500">No appointments here yet.</div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((appt) => {
            const isUpcoming = ['pending', 'confirmed'].includes(appt.appointmentStatus)
            const isPaid = appt.paymentStatus === 'payment_paid'

            return (
              <div key={appt._id} className="border border-gray-200 rounded-xl p-4 flex items-start gap-4">
                <Avatar src={appt.doctor?.photo}>{appt.doctor?.name?.charAt(0)}</Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <h3 className="font-medium">{appt.doctor?.name}</h3>
                    <Chip
                      label={appt.appointmentStatus.replace('_', ' ')}
                      size="small"
                      color={STATUS_COLORS[appt.appointmentStatus] || 'default'}
                    />
                  </div>
                  <p className="text-sm text-gray-500">{appt.doctor?.specialization} · {appt.doctor?.clinicName}</p>
                  <p className="text-sm text-gray-700 mt-1">{appt.date} at {appt.time}</p>

                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm text-gray-500">Fee: ₹{appt.amount}</p>
                    <Chip
                      label={isPaid ? 'Paid' : appt.paymentMethod === 'online' ? 'Payment Pending' : 'Pay at Clinic'}
                      size="small"
                      color={isPaid ? 'success' : 'default'}
                      variant="outlined"
                    />
                  </div>

                  <div className="flex gap-2 mt-3 flex-wrap">
                    {isUpcoming && (
                      <Button
                        size="small"
                        color="error"
                        variant="outlined"
                        disabled={cancellingId === appt._id}
                        onClick={() => handleCancel(appt._id)}
                      >
                        {cancellingId === appt._id ? 'Cancelling...' : 'Cancel Appointment'}
                      </Button>
                    )}
                       {['pending', 'confirmed'].includes(appt.appointmentStatus) && appt.tokenNumber && (
                         <Button
                   size="small"
                        variant="outlined"
                             component={Link}
                                to={`/token/${appt.doctor?._id}`}
                                      className="mt-2 mr-2"
                                     >
                             Track Queue (Token #{appt.tokenNumber})
                            </Button>
                       )}
                    {isUpcoming && !isPaid && (
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => handlePayNow(appt)}
                      >
                        Pay Now
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default PatientAppointments