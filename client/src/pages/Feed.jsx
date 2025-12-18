import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Flame, Trophy, Users, Target, CheckCircle, UserPlus,
  Zap, Clock, ArrowRight
} from 'lucide-react'
import { useAuth } from '../App'
import Navbar from '../components/Navbar'

const activityIcons = {
  joined: Zap,
  created_challenge: Target,
  joined_challenge: Users,
  submission_verified: CheckCircle,
  friend_request_sent: UserPlus,
  became_friends: Users
}

const activityColors = {
  joined: 'from-blue-500 to-cyan-500',
  created_challenge: 'from-ember-500 to-amber-500',
  joined_challenge: 'from-purple-500 to-pink-500',
  submission_verified: 'from-emerald-500 to-green-500',
  friend_request_sent: 'from-amber-500 to-yellow-500',
  became_friends: 'from-pink-500 to-rose-500'
}

const activityMessages = {
  joined: (data) => `joined Forge`,
  created_challenge: (data) => `created a new challenge "${data.name}"`,
  joined_challenge: (data) => `joined "${data.challenge_name}"`,
  submission_verified: (data) => `completed a day in "${data.challenge_name}"`,
  friend_request_sent: (data) => `sent a friend request to @${data.to_username}`,
  became_friends: (data) => `became friends with @${data.with_username}`
}

export default function Feed() {
  const { user } = useAuth()
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFeed()
  }, [])

  const fetchFeed = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/feed', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (res.ok) {
        setActivities(await res.json())
      }
    } catch (err) {
      console.error('Failed to fetch feed:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date
    
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="max-w-2xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-display mb-1">Activity Feed</h1>
          <p className="text-midnight-400">See what you and your friends are up to</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-ember-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-16">
            <Zap className="w-16 h-16 text-midnight-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold font-display mb-2">No activity yet</h3>
            <p className="text-midnight-400 mb-6">
              Add friends and start challenges to see activity here!
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link to="/friends" className="btn-secondary">
                Find Friends
              </Link>
              <Link to="/create" className="btn-primary">
                Create Challenge
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity, index) => {
              const Icon = activityIcons[activity.type] || Zap
              const colorClass = activityColors[activity.type] || 'from-gray-500 to-gray-600'
              const getMessage = activityMessages[activity.type]
              const message = getMessage ? getMessage(activity.data) : 'did something'

              return (
                <div 
                  key={activity.id} 
                  className="card animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClass} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white">
                        <Link 
                          to={`/profile/${activity.username}`}
                          className="font-bold hover:text-ember-400 transition-colors"
                        >
                          @{activity.username}
                        </Link>
                        {' '}
                        <span className="text-midnight-300">{message}</span>
                      </p>

                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-sm text-midnight-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(activity.created_at)}
                        </span>

                        {activity.challenge_id && (
                          <Link 
                            to={`/challenge/${activity.challenge_id}`}
                            className="text-sm text-ember-400 hover:text-ember-300 flex items-center gap-1"
                          >
                            View Challenge
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        )}
                      </div>
                    </div>

                    {/* User Avatar */}
                    <Link 
                      to={`/profile/${activity.username}`}
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-ember-500 to-amber-500 flex items-center justify-center font-bold text-sm flex-shrink-0"
                    >
                      {activity.username[0].toUpperCase()}
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

