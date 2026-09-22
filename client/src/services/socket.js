import { io } from 'socket.io-client'

// Backend ka base URL nikaal rahe hain (VITE_API_URL mein '/api' extra hai, wo hata diya)
const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'

// Ek hi socket connection poori app mein reuse hoga (singleton pattern) —
// har component apna alag connection nahi banayega
const socket = io(SOCKET_URL, {
  autoConnect: true,
})

export default socket