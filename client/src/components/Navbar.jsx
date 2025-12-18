import { Link, useNavigate, useLocation } from 'react-router-dom'
import { 
  Flame, Bell, LogOut, Users, Home, Activity, User, Coins
} from 'lucide-react'
import { useAuth } from '../App'
import { useState, useEffect } from 'react'
import { API_URL } from '../api'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [inviteCount, setInviteCount] = useState(0)
  const [friendRequestCount, setFriendRequestCount] = useState(0)
  const [points, setPoints] = useState(user?.points || 0)

  useEffect(() => {
    fetchCounts()
    fetchPoints()
  }, [location])

  const fetchPoints = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/api/points`, { headers: { 'Authorization': `Bearer ${token}` } })
      if (res.ok) {
        const data = await res.json()
        setPoints(data.points)
      }
    } catch (err) {
      console.error('Failed to fetch points:', err)
    }
  }

  const fetchCounts = async () => {
    try {
      const token = localStorage.getItem('token')
      const [invitesRes, requestsRes] = await Promise.all([
        fetch(`${API_URL}/api/invites`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/api/friends/requests`, { headers: { 'Authorization': `Bearer ${token}` } })
      ])

      if (invitesRes.ok) {
        const invites = await invitesRes.json()
        setInviteCount(invites.length)
      }
      if (requestsRes.ok) {
        const requests = await requestsRes.json()
        setFriendRequestCount(requests.length)
      }
    } catch (err) {
      console.error('Failed to fetch counts:', err)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const totalNotifications = inviteCount + friendRequestCount

  const navLinks = [
    { href: '/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/feed', icon: Activity, label: 'Feed' },
    { href: '/friends', icon: Users, label: 'Friends', badge: friendRequestCount },
  ]

  return (
    <nav className="sticky top-0 z-50 glass border-b border-midnight-700/50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-ember-500 to-ember-600 rounded-xl flex items-center justify-center">
            <Flame className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold font-display hidden sm:block">Forge</span>
        </Link>

        {/* Nav Links */}
        <div className="flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.href
            return (
              <Link
                key={link.href}
                to={link.href}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-ember-500/20 text-ember-400' 
                    : 'text-midnight-400 hover:text-white hover:bg-midnight-800/50'
                }`}
              >
                <link.icon className="w-5 h-5" />
                <span className="hidden md:block">{link.label}</span>
                {link.badge > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-ember-500 rounded-full text-xs flex items-center justify-center font-medium">
                    {link.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          {/* Points Balance */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/30 rounded-lg">
            <Coins className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-amber-300">{points.toLocaleString()}</span>
          </div>

          {/* Notifications */}
          <button className="relative p-2 text-midnight-400 hover:text-white hover:bg-midnight-800/50 rounded-lg transition-colors">
            <Bell className="w-5 h-5" />
            {totalNotifications > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-ember-500 rounded-full text-xs flex items-center justify-center font-medium">
                {totalNotifications}
              </span>
            )}
          </button>

          {/* User Menu */}
          <Link 
            to={`/profile/${user?.username}`}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="w-9 h-9 bg-gradient-to-br from-ember-500 to-amber-500 rounded-full flex items-center justify-center font-bold text-sm">
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <span className="font-medium hidden sm:block">{user?.username}</span>
          </Link>

          <button 
            onClick={handleLogout}
            className="p-2 text-midnight-400 hover:text-white hover:bg-midnight-800/50 rounded-lg transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </nav>
  )
}

