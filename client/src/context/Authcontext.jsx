import { createContext, useContext, useState, useEffect } from 'react'
import { fetchMe } from '../services/auth.service.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true) // app load hote hi check karega login hai ya nahi

  // App load hote hi, agar token localStorage mein hai, to backend se
  // confirm karo woh valid hai aur user ka fresh data le aao
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setLoading(false)
      return
    }

    fetchMe()
      .then((res) => setUser(res.user))
      .catch(() => {
        localStorage.removeItem('token') // token invalid/expired nikla to hata do
      })
      .finally(() => setLoading(false))
  }, [])

  function login(token, userData) {
    localStorage.setItem('token', token)
    setUser(userData)
  }

  function logout() {
    localStorage.removeItem('token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook — isse components mein "useAuth()" likh kar seedha
// user, login, logout access kar sakte hain
export function useAuth() {
  return useContext(AuthContext)
}