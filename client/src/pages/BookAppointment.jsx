import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  TextField, Button, Alert, CircularProgress, Paper, Chip, MenuItem, Divider,
  RadioGroup, FormControlLabel, Radio,
} from '@mui/material'
import { getDoctorById } from '../services/doctor.service.js'
import { getAvailableSlots, bookAppointment } from '../services/appointment.service.js'
import { openRazorpayCheckout } from '../services/payment.service.js'
import { patientDetailsSchema } from '../validations/appointment.validation.js'
import { useAuth } from '../context/Authcontext.jsx'

function todayStr() {
  return new Date().toISOString().split('T')[0]
}
function maxDateStr() {
  const d = new Date()
  d.setDate(d.getDate() + 30)
  return d.toISOString().split('T')[0]
}

function BookAppointment() {
  const { doctorId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [doctor, setDoctor] = useState(null)
  const [loadingDoctor, setLoadingDoctor] = useState(true)
  const [date, setDate] = useState(todayStr())
  const [slots, setSlots] = useState([])
  const [selectedSlot, setSelectedSlot] = useState('')
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('clinic')
  const [serverError, setServerError] = useState('')
  const [successData, setSuccessData] = useState(null)
  const [processingPayment, setProcessingPayment] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(patientDetailsSchema),
    defaultValues: { name: user?.name || '', gender: 'male' },
  })

  useEffect(() => {
    getDoctorById(doctorId)
      .then((res) => setDoctor(res.doctor))
      .catch(() => setServerError('Doctor not found'))
      .finally(() => setLoadingDoctor(false))
  }, [doctorId])

  useEffect(() => {
    if (!date) return
    setSelectedSlot('')
    setLoadingSlots(true)
    getAvailableSlots(doctorId, date)
      .then((res) => setSlots(res.slots))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false))
  }, [doctorId, date])

  async function onSubmit(data) {
    if (!selectedSlot) {
      setServerError('Please select a time slot')
      return
    }
    setServerError('')
    try {
      const res = await bookAppointment({
        doctorId,
        date,
        time: selectedSlot,
        reason: data.reason,
        paymentMethod,
        patientDetails: { name: data.name, age: data.age, gender: data.gender, phone: data.phone },
      })

      if (paymentMethod === 'online') {
        setProcessingPayment(true)
        openRazorpayCheckout({
          appointmentId: res.appointment._id,
          doctorName: doctor.name,
          onSuccess: () => {
            setProcessingPayment(false)
            setSuccessData({ ...res.appointment, paymentStatus: 'payment_paid' })
          },
          onFailure: (msg) => {
            setProcessingPayment(false)
            // Appointment already confirm ho chuka hai (slot secure hai), sirf payment fail hui —
            // patient clinic mein pay kar sakta hai, isliye phir bhi success screen dikhate hain
            setServerError(`${msg} You can complete payment later or pay at the clinic.`)
            setSuccessData(res.appointment)
          },
        })
      } else {
        setSuccessData(res.appointment)
      }
    } catch (err) {
      setServerError(err.response?.data?.message || 'Something went wrong')
    }
  }

  if (loadingDoctor) return <div className="flex justify-center py-20"><CircularProgress /></div>
  if (!doctor) return <div className="text-center py-20 text-gray-500">Doctor not found.</div>

  if (successData) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <Paper elevation={2} className="p-8 rounded-2xl text-center">
          <h1 className="text-2xl font-semibold text-green-600 mb-1">✅ Appointment Confirmed</h1>
          <div className="text-left mt-6 flex flex-col gap-2 text-sm text-gray-700">
            <div className="flex justify-between"><span>Doctor</span><span className="font-medium">{doctor.name}</span></div>
            <div className="flex justify-between"><span>Clinic</span><span className="font-medium">{doctor.clinicName}</span></div>
            <div className="flex justify-between"><span>Date</span><span className="font-medium">{successData.date}</span></div>
            <div className="flex justify-between"><span>Time</span><span className="font-medium">{successData.time}</span></div>
            <div className="flex justify-between"><span>Fee</span><span className="font-medium">₹{successData.amount}</span></div>
            <div className="flex justify-between">
              <span>Payment</span>
              <span className="font-medium">
                {successData.paymentStatus === 'payment_paid' ? '✅ Paid Online' : '💵 Pay at Clinic'}
              </span>
            </div>
          </div>
          <Button variant="contained" fullWidth className="mt-6" onClick={() => navigate('/patient/appointments')}>
            View My Appointments
          </Button>
        </Paper>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-1">Book Appointment</h1>
      <p className="text-gray-500 mb-6">{doctor.name} — {doctor.specialization} · ₹{doctor.consultationFee}</p>

      {serverError && <Alert severity="warning" className="mb-4">{serverError}</Alert>}

      <Paper elevation={1} className="p-6 rounded-2xl">
        <h2 className="font-medium text-gray-700 mb-3">1. Select Date</h2>
        <TextField
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          slotProps={{ htmlInput: { min: todayStr(), max: maxDateStr() } }}
          fullWidth
        />

        <h2 className="font-medium text-gray-700 mt-6 mb-3">2. Select Time Slot</h2>
        {loadingSlots ? (
          <div className="flex justify-center py-6"><CircularProgress size={24} /></div>
        ) : slots.length === 0 ? (
          <p className="text-sm text-gray-500">No slots available for this date. Try another date.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {slots.map((slot) => (
              <Chip
                key={slot}
                label={slot}
                onClick={() => setSelectedSlot(slot)}
                color={selectedSlot === slot ? 'primary' : 'default'}
                variant={selectedSlot === slot ? 'filled' : 'outlined'}
                className="cursor-pointer"
              />
            ))}
          </div>
        )}

        <Divider className="my-6" />

        <h2 className="font-medium text-gray-700 mb-3">3. Patient Details</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <TextField
            label="Full Name"
            {...register('name')}
            error={!!errors.name}
            helperText={errors.name?.message}
            fullWidth
          />
          <div className="grid grid-cols-2 gap-4">
            <TextField
              label="Age"
              type="number"
              {...register('age')}
              error={!!errors.age}
              helperText={errors.age?.message}
              fullWidth
            />
            <TextField select label="Gender" defaultValue="male" {...register('gender')} fullWidth>
              <MenuItem value="male">Male</MenuItem>
              <MenuItem value="female">Female</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </TextField>
          </div>
          <TextField
            label="Phone Number"
            {...register('phone')}
            error={!!errors.phone}
            helperText={errors.phone?.message}
            fullWidth
          />
          <TextField label="Reason for Visit (optional)" multiline rows={2} {...register('reason')} fullWidth />

          <Divider className="my-2" />

          <h2 className="font-medium text-gray-700">4. Payment Method</h2>
          <RadioGroup value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            <Paper
              variant="outlined"
              className={`p-3 rounded-xl mb-2 ${paymentMethod === 'online' ? 'border-primary' : ''}`}
            >
              <FormControlLabel
                value="online"
                control={<Radio />}
                label={
                  <div>
                    <p className="font-medium text-sm">Pay Online Now</p>
                    <p className="text-xs text-gray-500">Pay ₹{doctor.consultationFee} via UPI/Card and confirm instantly</p>
                  </div>
                }
              />
            </Paper>
            <Paper
              variant="outlined"
              className={`p-3 rounded-xl ${paymentMethod === 'clinic' ? 'border-primary' : ''}`}
            >
              <FormControlLabel
                value="clinic"
                control={<Radio />}
                label={
                  <div>
                    <p className="font-medium text-sm">Pay at Clinic</p>
                    <p className="text-xs text-gray-500">Pay ₹{doctor.consultationFee} in cash when you visit</p>
                  </div>
                }
              />
            </Paper>
          </RadioGroup>

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={isSubmitting || processingPayment}
            className="mt-2"
          >
            {isSubmitting || processingPayment ? (
              <CircularProgress size={24} color="inherit" />
            ) : paymentMethod === 'online' ? (
              `Pay ₹${doctor.consultationFee} & Confirm`
            ) : (
              'Confirm Appointment'
            )}
          </Button>
        </form>
      </Paper>
    </div>
  )
}

export default BookAppointment