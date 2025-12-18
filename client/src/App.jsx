import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect, createContext, useContext } from 'react'
import { registerServiceWorker, subscribeToPush, requestNotificationPermission } from './utils/notifications'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import CreateChallenge from './pages/CreateChallenge'
import ChallengeDetail from './pages/ChallengeDetail'
import Friends from './pages/Friends'
import Feed from './pages/Feed'
import Profile from './pages/Profile'

// Auth Context
export const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing session
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    if (token && userData) {
      setUser(JSON.parse(userData))
    }
    setLoading(false)

    // Register service worker
    registerServiceWorker()
  }, [])

  const login = async (userData, token) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)

    // Request notification permission and subscribe
    const granted = await requestNotificationPermission()
    if (granted) {
      await subscribeToPush()
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen animated-bg grid-pattern flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-ember-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <Router>
        <div className="min-h-screen animated-bg grid-pattern">
          <Routes>
            <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Landing />} />
            <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
            <Route path="/signup" element={user ? <Navigate to="/dashboard" /> : <Signup />} />
            <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
            <Route path="/create" element={user ? <CreateChallenge /> : <Navigate to="/login" />} />
            <Route path="/challenge/:id" element={user ? <ChallengeDetail /> : <Navigate to="/login" />} />
            <Route path="/friends" element={user ? <Friends /> : <Navigate to="/login" />} />
            <Route path="/feed" element={user ? <Feed /> : <Navigate to="/login" />} />
            <Route path="/profile/id/:id" element={user ? <Profile /> : <Navigate to="/login" />} />
            <Route path="/profile/:username" element={user ? <Profile /> : <Navigate to="/login" />} />
          </Routes>
        </div>
      </Router>
    </AuthContext.Provider>
  )
}

export default App
