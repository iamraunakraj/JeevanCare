import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Alert, CircularProgress, Paper, LinearProgress, TextField, MenuItem } from '@mui/material'
import { getDoctorById } from '../services/doctor.service.js'
import { getMyTokenStatus, cancelToken, getToken } from '../services/queue.service.js'
import { patientDetailsSchema } from '../validations/appointment.validation.js'
import { useAuth } from '../context/Authcontext.jsx'
import socket from '../services/socket.js'
import { openRazorpayCheckout } from '../services/payment.service.js'
import { RadioGroup, FormControlLabel, Radio } from '@mui/material'

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

const QUEUE_EVENTS = ['queue:updated', 'queue:called', 'queue:started', 'queue:completed', 'queue:cancelled']

function GetToken() {
  const { doctorId } = useParams()
  const { user } = useAuth()
  const date = todayStr()

  const [doctor, setDoctor] = useState(null)
  const [loadingDoctor, setLoadingDoctor] = useState(true)
  const [status, setStatus] = useState(null)
  const [loadingStatus, setLoadingStatus] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [serverError, setServerError] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('clinic')
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
    getDoctorById(doctorId).then((res) => setDoctor(res.doctor)).finally(() => setLoadingDoctor(false))
  }, [doctorId])

  const fetchStatus = useCallback(async () => {
    try {
      const res = await getMyTokenStatus(doctorId, date)
      setStatus(res)
    } catch (err) {
      // ignore
    } finally {
      setLoadingStatus(false)
    }
  }, [doctorId, date])

  // Pehli baar load hote hi status fetch karo
  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  // Socket room join karo, updates ke liye listen karo — YEH POLLING KI JAGAH HAI AB
  useEffect(() => {
    socket.emit('join-queue-room', { doctorId, date })

    function handleUpdate() {
      fetchStatus() // event mile, turant fresh data le aao
    }

    QUEUE_EVENTS.forEach((event) => socket.on(event, handleUpdate))

    // Cleanup — page chhodते waqt room se nikal jaao aur listeners hata do
    return () => {
      socket.emit('leave-queue-room', { doctorId, date })
      QUEUE_EVENTS.forEach((event) => socket.off(event, handleUpdate))
    }
  }, [doctorId, date, fetchStatus])

  async function onSubmit(data) {
  setServerError('')
  try {
    const res = await getToken(
      doctorId,
      date,
      { name: data.name, age: data.age, gender: data.gender, phone: data.phone },
      data.reason,
      paymentMethod
    )

    if (paymentMethod === 'online') {
      setProcessingPayment(true)
      openRazorpayCheckout({
        appointmentId: res.appointment._id,
        doctorName: doctor.name,
        onSuccess: () => {
          setProcessingPayment(false)
          fetchStatus()
        },
        onFailure: (msg) => {
          setProcessingPayment(false)
          setServerError(`${msg} You can pay at the clinic instead.`)
          fetchStatus()
        },
      })
    } else {
      await fetchStatus()
    }
  } catch (err) {
    setServerError(err.response?.data?.message || 'Could not get token')
  }
}

  async function handleCancel() {
    if (!status?.token) return
    setCancelling(true)
    try {
      await cancelToken(status.token._id)
      await fetchStatus()
    } finally {
      setCancelling(false)
    }
  }

  if (loadingDoctor || loadingStatus) {
    return <div className="flex justify-center py-20"><CircularProgress /></div>
  }

  if (!doctor) {
    return <div className="text-center py-20 text-gray-500">Doctor not found.</div>
  }

  const hasToken = !!status?.token
  const tokenStatus = status?.token?.status

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold mb-1">Digital Token</h1>
      <p className="text-gray-500 mb-6">{doctor.name} — {doctor.clinicName} · ₹{doctor.consultationFee}</p>

      {serverError && <Alert severity="error" className="mb-4">{serverError}</Alert>}

      {!hasToken ? (
        <Paper elevation={1} className="p-6 rounded-2xl">
          <p className="text-gray-600 mb-4 text-sm">
            Fill your details to get a digital token and track the queue remotely.
          </p>
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
              <RadioGroup value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
              <FormControlLabel value="online" control={<Radio />} label="Pay Online Now" />
             <FormControlLabel value="clinic" control={<Radio />} label="Pay at Clinic" />
            </RadioGroup>
            <Button type="submit" variant="contained" size="large" disabled={isSubmitting || processingPayment}>
      {isSubmitting || processingPayment ? <CircularProgress size={24} color="inherit" /> : 'Get Digital Token'}
         </Button>
          </form>
        </Paper>
      ) : (
        <Paper elevation={2} className="p-6 rounded-2xl">
          {tokenStatus === 'waiting' && (
            <>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-primary/5 rounded-xl p-4">
                  <p className="text-xs text-gray-500 uppercase">Your Token</p>
                  <p className="text-3xl font-bold text-primary">#{status.token.tokenNumber}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 uppercase">Current Token</p>
                  <p className="text-3xl font-bold text-gray-700">
                    {status.currentToken ? `#${status.currentToken}` : '—'}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex justify-between text-sm text-gray-600">
                <span>Patients ahead</span>
                <span className="font-medium">{status.patientsAhead}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 mt-1">
                <span>Estimated wait</span>
                <span className="font-medium">~{status.estimatedWait} min</span>
              </div>

              <LinearProgress className="mt-4 rounded-full" />

              <Button
                variant="outlined"
                color="error"
                fullWidth
                className="mt-5"
                disabled={cancelling}
                onClick={handleCancel}
              >
                {cancelling ? 'Cancelling...' : 'Cancel Token'}
              </Button>
            </>
          )}

          {tokenStatus === 'called' && (
            <div className="text-center py-4">
              <p className="text-lg font-semibold text-green-600">🔔 You're being called!</p>
              <p className="text-gray-600 mt-2">
                Please reach the clinic now — Token #{status.token.tokenNumber}
              </p>
            </div>
          )}

          {tokenStatus === 'consulting' && (
            <div className="text-center py-4">
              <p className="text-lg font-semibold text-blue-600">👨‍⚕️ Consultation in progress</p>
              <p className="text-gray-600 mt-2">Token #{status.token.tokenNumber}</p>
            </div>
          )}

          <p className="text-xs text-gray-400 text-center mt-4 flex items-center justify-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
            Live — updates instantly
          </p>
        </Paper>
      )}
    </div>
  )
}

export default GetToken