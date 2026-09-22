import { Server } from 'socket.io'

let io = null

// Server start hote waqt ek hi baar call hota hai (index.js se)
export function initSocket(server, clientUrl) {
  io = new Server(server, {
    cors: { origin: clientUrl },
  })

  io.on('connection', (socket) => {
    // Client bata deta hai "mujhe is doctor ki is date ki queue ke updates chahiye"
    socket.on('join-queue-room', ({ doctorId, date }) => {
      if (!doctorId || !date) return
      const room = `doctor:${doctorId}:queue:${date}`
      socket.join(room)
    })

    // Jab client us page se chala jaaye, room chhod de (updates na milein)
    socket.on('leave-queue-room', ({ doctorId, date }) => {
      if (!doctorId || !date) return
      const room = `doctor:${doctorId}:queue:${date}`
      socket.leave(room)
    })
  })

  return io
}

// Controllers isse use karenge event bhejne ke liye
export function getIO() {
  if (!io) throw new Error('Socket.io not initialized')
  return io
}

// Helper — ek specific doctor/date room mein event bhejta hai
export function emitQueueEvent(doctorId, date, eventName, payload = {}) {
  const room = `doctor:${doctorId}:queue:${date}`
  getIO().to(room).emit(eventName, payload)
}