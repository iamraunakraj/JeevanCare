import { useEffect, useState, useCallback } from 'react'
import { Button, Chip, CircularProgress, Paper } from '@mui/material'
import {
  getDoctorQueue,
  callNextPatient,
  startConsultation,
  completeConsultation,
  markNoShow,
} from '../services/queue.service.js'
import { useAuth } from '../context/Authcontext.jsx'
import { getMyDoctorProfile } from '../services/doctor.service.js'
import socket from '../services/socket.js'

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

const STATUS_COLORS = {
  waiting: 'default',
  called: 'warning',
  consulting: 'info',
  completed: 'success',
  cancelled: 'default',
  no_show: 'error',
}

const QUEUE_EVENTS = ['queue:updated', 'queue:called', 'queue:started', 'queue:completed', 'queue:cancelled']

function DoctorQueue() {
  const date = todayStr()
  const [doctorId, setDoctorId] = useState(null)
  const [queue, setQueue] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')

  // Doctor ki apni ID chahiye room-name banane ke liye (User ID alag hoti hai, Doctor profile ID alag)
  useEffect(() => {
    getMyDoctorProfile().then((res) => setDoctorId(res.doctor._id))
  }, [])

  const loadQueue = useCallback(async () => {
    try {
      const res = await getDoctorQueue(date)
      setQueue(res.queue)
    } catch (err) {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [date])

  useEffect(() => {
    loadQueue()
  }, [loadQueue])

  // Socket room join karo (doctorId milne ke baad hi)
  useEffect(() => {
    if (!doctorId) return

    socket.emit('join-queue-room', { doctorId, date })

    function handleUpdate() {
      loadQueue()
    }

    QUEUE_EVENTS.forEach((event) => socket.on(event, handleUpdate))

    return () => {
      socket.emit('leave-queue-room', { doctorId, date })
      QUEUE_EVENTS.forEach((event) => socket.off(event, handleUpdate))
    }
  }, [doctorId, date, loadQueue])

  async function handleCallNext() {
    setActionLoading(true)
    setError('')
    try {
      await callNextPatient(date)
      await loadQueue()
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleAction(actionFn, id) {
    setActionLoading(true)
    try {
      await actionFn(id)
      await loadQueue()
    } finally {
      setActionLoading(false)
    }
  }

  const waiting = queue.filter((q) => q.status === 'waiting')
  const activeEntry = queue.find((q) => ['called', 'consulting'].includes(q.status))
  const completed = queue.filter((q) => q.status === 'completed')

  if (loading) return <div className="flex justify-center py-20"><CircularProgress /></div>

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-1">
        <h1 className="text-2xl font-semibold">Today's Queue</h1>
        <span className="w-2 h-2 rounded-full bg-green-500 inline-block" title="Live" />
      </div>
      <p className="text-gray-500 mb-6">{date}</p>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      <div className="grid grid-cols-3 gap-3 mb-6">
        <Paper elevation={0} className="border border-gray-200 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-500 uppercase">Total</p>
          <p className="text-2xl font-bold">{queue.length}</p>
        </Paper>
        <Paper elevation={0} className="border border-gray-200 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-500 uppercase">Waiting</p>
          <p className="text-2xl font-bold">{waiting.length}</p>
        </Paper>
        <Paper elevation={0} className="border border-gray-200 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-500 uppercase">Completed</p>
          <p className="text-2xl font-bold">{completed.length}</p>
        </Paper>
      </div>

      <Paper elevation={1} className="p-5 rounded-2xl mb-6">
        {activeEntry ? (
          <div>
            <p className="text-xs text-gray-500 uppercase mb-1">Currently Serving</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xl font-bold">Token #{activeEntry.tokenNumber}</p>
                <p className="text-gray-600">{activeEntry.patient?.name} · {activeEntry.patient?.phone}</p>
              </div>
              <Chip label={activeEntry.status} color={STATUS_COLORS[activeEntry.status]} />
            </div>

            <div className="flex gap-2 mt-4">
              {activeEntry.status === 'called' && (
                <Button
                  variant="contained"
                  disabled={actionLoading}
                  onClick={() => handleAction(startConsultation, activeEntry._id)}
                >
                  Start Consultation
                </Button>
              )}
              {['called', 'consulting'].includes(activeEntry.status) && (
                <Button
                  variant="contained"
                  color="success"
                  disabled={actionLoading}
                  onClick={() => handleAction(completeConsultation, activeEntry._id)}
                >
                  Complete Consultation
                </Button>
              )}
              {activeEntry.status === 'called' && (
                <Button
                  variant="outlined"
                  color="error"
                  disabled={actionLoading}
                  onClick={() => handleAction(markNoShow, activeEntry._id)}
                >
                  No Show
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-gray-500 mb-3">No patient currently being served</p>
            <Button
              variant="contained"
              size="large"
              disabled={actionLoading || waiting.length === 0}
              onClick={handleCallNext}
            >
              {waiting.length === 0 ? 'No Patients Waiting' : 'Call Next Patient'}
            </Button>
          </div>
        )}
      </Paper>

      <h2 className="font-medium text-gray-700 mb-3">Waiting List</h2>
      {waiting.length === 0 ? (
        <p className="text-gray-400 text-sm">No patients waiting.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {waiting.map((entry) => (
            <div
              key={entry._id}
              className="flex items-center justify-between border border-gray-100 rounded-xl px-4 py-3"
            >
              <div>
                <span className="font-medium">#{entry.tokenNumber}</span>{' '}
                <span className="text-gray-600">{entry.patient?.name}</span>
              </div>
              <Chip label="Waiting" size="small" variant="outlined" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default DoctorQueue