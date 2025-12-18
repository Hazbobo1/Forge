import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Flame, Users, UserPlus, Search, Check, X, 
  ArrowLeft, Bell, LogOut, MessageCircle, Clock
} from 'lucide-react'
import { useAuth } from '../App'
import Navbar from '../components/Navbar'
import { API_URL } from '../api'

export default function Friends() {
  const { user } = useAuth()
  const [friends, setFriends] = useState([])
  const [requests, setRequests] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('friends')
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchUsers()
    } else {
      setSearchResults([])
    }
  }, [searchQuery])

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token')
      const [friendsRes, requestsRes] = await Promise.all([
        fetch(`${API_URL}/api/friends`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/api/friends/requests`, { headers: { 'Authorization': `Bearer ${token}` } })
      ])

      if (friendsRes.ok) setFriends(await friendsRes.json())
      if (requestsRes.ok) setRequests(await requestsRes.json())
    } catch (err) {
      console.error('Failed to fetch data:', err)
    } finally {
      setLoading(false)
    }
  }

  const searchUsers = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        // Filter out existing friends
        const friendIds = friends.map(f => f.id)
        setSearchResults(data.filter(u => !friendIds.includes(u.id)))
      }
    } catch (err) {
      console.error('Search failed:', err)
    }
  }

  const sendFriendRequest = async (username) => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/api/friends/request`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ username })
      })

      const data = await res.json()
      if (res.ok) {
        setMessage(`Friend request sent to @${username}!`)
        setSearchQuery('')
        setSearchResults([])
        setTimeout(() => setMessage(''), 3000)
      } else {
        setMessage(data.error)
        setTimeout(() => setMessage(''), 3000)
      }
    } catch (err) {
      console.error('Failed to send request:', err)
    }
  }

  const handleRequest = async (requestId, accept) => {
    try {
      const token = localStorage.getItem('token')
      const endpoint = accept ? 'accept' : 'decline'
      const res = await fetch(`/api/friends/${endpoint}/${requestId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (res.ok) {
        fetchData()
      }
    } catch (err) {
      console.error('Failed to handle request:', err)
    }
  }

  const removeFriend = async (friendId) => {
    if (!confirm('Are you sure you want to remove this friend?')) return
    
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/friends/${friendId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (res.ok) {
        fetchData()
      }
    } catch (err) {
      console.error('Failed to remove friend:', err)
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold font-display mb-1">Friends</h1>
            <p className="text-midnight-400">Connect with friends and challenge together</p>
          </div>
        </div>

        {/* Search */}
        <div className="card mb-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-midnight-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-12"
                placeholder="Search by username..."
              />
            </div>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-4 space-y-2">
              {searchResults.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-midnight-800/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-ember-500 to-amber-500 rounded-full flex items-center justify-center font-bold">
                      {user.username[0].toUpperCase()}
                    </div>
                    <Link to={`/profile/${user.username}`} className="font-medium hover:text-ember-400 transition-colors">
                      @{user.username}
                    </Link>
                  </div>
                  <button
                    onClick={() => sendFriendRequest(user.username)}
                    className="btn-primary py-2 px-4 text-sm"
                  >
                    <UserPlus className="w-4 h-4 mr-2 inline" />
                    Add Friend
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Message */}
        {message && (
          <div className="mb-6 p-4 bg-ember-500/20 border border-ember-500/30 rounded-xl text-ember-300 animate-slide-up">
            {message}
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-4 border-b border-midnight-800 mb-6">
          <button
            onClick={() => setActiveTab('friends')}
            className={`pb-3 px-1 font-medium transition-colors relative ${
              activeTab === 'friends' ? 'text-white' : 'text-midnight-400 hover:text-midnight-200'
            }`}
          >
            My Friends ({friends.length})
            {activeTab === 'friends' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-ember-500"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`pb-3 px-1 font-medium transition-colors relative flex items-center gap-2 ${
              activeTab === 'requests' ? 'text-white' : 'text-midnight-400 hover:text-midnight-200'
            }`}
          >
            Requests
            {requests.length > 0 && (
              <span className="w-5 h-5 bg-ember-500 rounded-full text-xs flex items-center justify-center">
                {requests.length}
              </span>
            )}
            {activeTab === 'requests' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-ember-500"></div>
            )}
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-ember-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : activeTab === 'friends' ? (
          /* Friends List */
          friends.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-16 h-16 text-midnight-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold font-display mb-2">No friends yet</h3>
              <p className="text-midnight-400 mb-6">Search for users above to add friends!</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {friends.map((friend) => (
                <div key={friend.id} className="card-hover flex items-center justify-between">
                  <Link to={`/profile/${friend.username}`} className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-ember-500 to-amber-500 rounded-full flex items-center justify-center font-bold text-lg">
                      {friend.username[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold">@{friend.username}</div>
                      {friend.bio && (
                        <p className="text-sm text-midnight-400 line-clamp-1">{friend.bio}</p>
                      )}
                    </div>
                  </Link>
                  <div className="flex items-center gap-2">
                    <Link 
                      to={`/profile/${friend.username}`}
                      className="btn-ghost py-2 px-3"
                    >
                      View Profile
                    </Link>
                    <button
                      onClick={() => removeFriend(friend.id)}
                      className="p-2 text-midnight-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* Friend Requests */
          requests.length === 0 ? (
            <div className="text-center py-16">
              <Bell className="w-16 h-16 text-midnight-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold font-display mb-2">No pending requests</h3>
              <p className="text-midnight-400">Friend requests will appear here</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {requests.map((request) => (
                <div key={request.id} className="card flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center font-bold text-lg">
                      {request.username[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold">@{request.username}</div>
                      <div className="text-sm text-midnight-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(request.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRequest(request.id, true)}
                      className="btn-primary py-2 px-4"
                    >
                      <Check className="w-4 h-4 mr-1 inline" />
                      Accept
                    </button>
                    <button
                      onClick={() => handleRequest(request.id, false)}
                      className="btn-ghost py-2 px-4"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </main>
    </div>
  )
}

