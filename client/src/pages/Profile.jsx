import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { 
  Flame, Trophy, Target, Calendar, Edit2, Save, UserPlus,
  Users, Zap, Clock, CheckCircle, X, ArrowLeft
} from 'lucide-react'
import { useAuth } from '../App'
import Navbar from '../components/Navbar'

export default function Profile() {
  const { username, id } = useParams()
  const { user: currentUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [bio, setBio] = useState('')
  const [message, setMessage] = useState('')

  const isOwnProfile = profile && (currentUser?.id === profile.id)

  useEffect(() => {
    fetchProfile()
  }, [username, id])

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token')
      // Fetch by ID if id is provided, otherwise by username
      const endpoint = id ? `/api/users/id/${id}` : `/api/users/${username}`
      const res = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (res.ok) {
        const data = await res.json()
        setProfile(data)
        setBio(data.bio || '')
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err)
    } finally {
      setLoading(false)
    }
  }

  const saveBio = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ bio })
      })

      if (res.ok) {
        setEditing(false)
        setProfile({ ...profile, bio })
      }
    } catch (err) {
      console.error('Failed to save bio:', err)
    }
  }

  const sendFriendRequest = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/friends/request', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ username: profile.username })
      })

      const data = await res.json()
      if (res.ok) {
        setMessage('Friend request sent!')
        setProfile({ ...profile, friendship_status: 'pending' })
        setTimeout(() => setMessage(''), 3000)
      } else {
        setMessage(data.error)
        setTimeout(() => setMessage(''), 3000)
      }
    } catch (err) {
      console.error('Failed to send request:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-ember-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="max-w-4xl mx-auto px-6 py-20 text-center">
          <div className="text-5xl mb-4">😕</div>
          <h2 className="text-2xl font-bold font-display mb-2">User not found</h2>
          <Link to="/friends" className="text-ember-400 hover:underline">
            Back to Friends
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Back button */}
        <button 
          onClick={() => window.history.back()} 
          className="flex items-center gap-2 text-midnight-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Profile Header */}
        <div className="card mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-ember-500 to-amber-500 flex items-center justify-center text-4xl font-bold">
              {profile.username[0].toUpperCase()}
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold font-display mb-1">@{profile.username}</h1>
              
              {editing ? (
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="text"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="input-field"
                    placeholder="Write a short bio..."
                    maxLength={160}
                  />
                  <button onClick={saveBio} className="btn-primary py-2 px-4">
                    <Save className="w-4 h-4" />
                  </button>
                  <button onClick={() => setEditing(false)} className="btn-ghost py-2 px-4">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <p className="text-midnight-400 mb-4">
                  {profile.bio || (isOwnProfile ? 'Add a bio to tell others about yourself' : 'No bio yet')}
                </p>
              )}

              <div className="flex items-center justify-center md:justify-start gap-4 text-sm text-midnight-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {isOwnProfile ? (
                <button 
                  onClick={() => setEditing(true)}
                  className="btn-secondary flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Profile
                </button>
              ) : profile.friendship_status === 'accepted' ? (
                <div className="badge-success py-2 px-4">
                  <Users className="w-4 h-4 mr-2 inline" />
                  Friends
                </div>
              ) : profile.friendship_status === 'pending' ? (
                <div className="badge-warning py-2 px-4">
                  <Clock className="w-4 h-4 mr-2 inline" />
                  Request Pending
                </div>
              ) : (
                <button onClick={sendFriendRequest} className="btn-primary flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  Add Friend
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className="mb-6 p-4 bg-ember-500/20 border border-ember-500/30 rounded-xl text-ember-300 animate-slide-up">
            {message}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="card text-center">
            <Target className="w-8 h-8 text-ember-500 mx-auto mb-2" />
            <div className="text-2xl font-bold font-display">{profile.challenges_joined || 0}</div>
            <div className="text-midnight-400 text-sm">Challenges</div>
          </div>
          <div className="card text-center">
            <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <div className="text-2xl font-bold font-display">{profile.total_submissions || 0}</div>
            <div className="text-midnight-400 text-sm">Submissions</div>
          </div>
          <div className="card text-center">
            <Zap className="w-8 h-8 text-amber-500 mx-auto mb-2" />
            <div className="text-2xl font-bold font-display">{profile.best_streak || 0}</div>
            <div className="text-midnight-400 text-sm">Best Streak</div>
          </div>
        </div>

        {/* Recent Activity */}
        {profile.activities && profile.activities.length > 0 && (
          <div className="card mb-8">
            <h2 className="text-xl font-bold font-display mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-ember-500" />
              Recent Activity
            </h2>
            <div className="space-y-3">
              {profile.activities.map((activity, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-midnight-900/50 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-midnight-800 flex items-center justify-center">
                    {activity.type === 'submission_verified' && <CheckCircle className="w-5 h-5 text-emerald-400" />}
                    {activity.type === 'joined_challenge' && <Target className="w-5 h-5 text-ember-400" />}
                    {activity.type === 'created_challenge' && <Trophy className="w-5 h-5 text-amber-400" />}
                    {activity.type === 'became_friends' && <Users className="w-5 h-5 text-blue-400" />}
                    {!['submission_verified', 'joined_challenge', 'created_challenge', 'became_friends'].includes(activity.type) && (
                      <Zap className="w-5 h-5 text-midnight-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm">
                      {activity.type === 'submission_verified' && `Completed proof for ${activity.challenge_name || 'a challenge'}`}
                      {activity.type === 'joined_challenge' && `Joined ${activity.challenge_name || 'a challenge'}`}
                      {activity.type === 'created_challenge' && `Created ${activity.challenge_name || 'a challenge'}`}
                      {activity.type === 'became_friends' && `Became friends with @${activity.data?.with_username || 'someone'}`}
                      {activity.type === 'joined' && 'Joined Forge'}
                    </div>
                    <div className="text-xs text-midnight-500">
                      {new Date(activity.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Achievements */}
        <div className="card">
          <h2 className="text-xl font-bold font-display mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-ember-500" />
            Achievements
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {profile.challenges_joined > 0 && (
              <div className="p-4 bg-midnight-900/50 rounded-xl text-center">
                <div className="text-3xl mb-2">🎯</div>
                <div className="text-sm font-medium">First Challenge</div>
              </div>
            )}
            {profile.total_submissions >= 7 && (
              <div className="p-4 bg-midnight-900/50 rounded-xl text-center">
                <div className="text-3xl mb-2">🔥</div>
                <div className="text-sm font-medium">Week Warrior</div>
              </div>
            )}
            {profile.best_streak >= 30 && (
              <div className="p-4 bg-midnight-900/50 rounded-xl text-center">
                <div className="text-3xl mb-2">💪</div>
                <div className="text-sm font-medium">30 Day Streak</div>
              </div>
            )}
            {profile.total_submissions >= 100 && (
              <div className="p-4 bg-midnight-900/50 rounded-xl text-center">
                <div className="text-3xl mb-2">⭐</div>
                <div className="text-sm font-medium">Century Club</div>
              </div>
            )}
            {(!profile.challenges_joined || profile.challenges_joined === 0) && (
              <div className="col-span-full text-center py-8 text-midnight-500">
                <div className="text-3xl mb-2">🏆</div>
                <p>Complete challenges to unlock achievements!</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
