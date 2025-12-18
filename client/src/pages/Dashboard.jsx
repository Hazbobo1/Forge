import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Plus, Trophy, Users, Calendar, ArrowRight, 
  Bell, CheckCircle, Clock, Target, Zap, Coins
} from 'lucide-react'
import { useAuth } from '../App'
import Navbar from '../components/Navbar'
import { API_URL } from '../api'

export default function Dashboard() {
  const { user } = useAuth()
  const [challenges, setChallenges] = useState([])
  const [invites, setInvites] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('active')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token')
      const [challengesRes, invitesRes] = await Promise.all([
        fetch(`${API_URL}/api/challenges`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/invites`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])

      if (challengesRes.ok) {
        const data = await challengesRes.json()
        setChallenges(data)
      }
      
      if (invitesRes.ok) {
        const data = await invitesRes.json()
        setInvites(data)
      }
    } catch (err) {
      console.error('Failed to fetch data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleInviteResponse = async (inviteId, accept) => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/api/invites/${inviteId}/${accept ? 'accept' : 'decline'}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (res.ok) {
        fetchData() // Refresh data
      }
    } catch (err) {
      console.error('Failed to respond to invite:', err)
    }
  }

  const activeChallenges = challenges.filter(c => c.status === 'active')
  const completedChallenges = challenges.filter(c => c.status === 'completed')

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold font-display mb-1">
              Welcome back, <span className="gradient-text">{user?.username}</span>
            </h1>
            <p className="text-midnight-400">Ready to crush some goals today?</p>
          </div>
          <Link to="/create" className="btn-primary flex items-center gap-2 w-fit">
            <Plus className="w-5 h-5" />
            New Challenge
          </Link>
        </div>

        {/* Pending Invites */}
        {invites.length > 0 && (
          <div className="mb-8 animate-slide-up">
            <h2 className="text-lg font-bold font-display mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-ember-500" />
              Pending Invites
            </h2>
            <div className="grid gap-4">
              {invites.map((invite) => (
                <div key={invite.id} className="card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold">{invite.challenge_name}</h3>
                    <p className="text-midnight-400 text-sm">
                      Invited by <span className="text-ember-400">@{invite.inviter_username}</span>
                    </p>
                    {invite.wager > 0 && (
                      <p className="text-sm flex items-center gap-1 mt-1">
                        <Coins className="w-3 h-3 text-amber-400" />
                        <span className="text-amber-300 font-medium">{invite.wager.toLocaleString()}</span>
                        <span className="text-midnight-500">points to join</span>
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleInviteResponse(invite.id, true)}
                      className="btn-primary py-2 px-4"
                    >
                      Accept
                    </button>
                    <button 
                      onClick={() => handleInviteResponse(invite.id, false)}
                      className="btn-ghost py-2 px-4"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Target, label: 'Active', value: activeChallenges.length, color: 'text-ember-400' },
            { icon: Trophy, label: 'Completed', value: completedChallenges.length, color: 'text-emerald-400' },
            { icon: Users, label: 'Friends', value: '–', color: 'text-blue-400', link: '/friends' },
            { icon: Zap, label: 'Feed', value: '→', color: 'text-amber-400', link: '/feed' },
          ].map((stat, i) => (
            stat.link ? (
              <Link key={i} to={stat.link} className="card text-center hover:border-ember-500/30 transition-colors">
                <stat.icon className={`w-6 h-6 ${stat.color} mx-auto mb-2`} />
                <div className="text-2xl font-bold font-display">{stat.value}</div>
                <div className="text-midnight-400 text-sm">{stat.label}</div>
              </Link>
            ) : (
              <div key={i} className="card text-center">
                <stat.icon className={`w-6 h-6 ${stat.color} mx-auto mb-2`} />
                <div className="text-2xl font-bold font-display">{stat.value}</div>
                <div className="text-midnight-400 text-sm">{stat.label}</div>
              </div>
            )
          ))}
        </div>

        {/* Challenges */}
        <div className="mb-6">
          <div className="flex items-center gap-4 border-b border-midnight-800 mb-6">
            <button
              onClick={() => setActiveTab('active')}
              className={`pb-3 px-1 font-medium transition-colors relative ${
                activeTab === 'active' ? 'text-white' : 'text-midnight-400 hover:text-midnight-200'
              }`}
            >
              Active Challenges
              {activeTab === 'active' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-ember-500"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`pb-3 px-1 font-medium transition-colors relative ${
                activeTab === 'completed' ? 'text-white' : 'text-midnight-400 hover:text-midnight-200'
              }`}
            >
              Completed
              {activeTab === 'completed' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-ember-500"></div>
              )}
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-ember-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(activeTab === 'active' ? activeChallenges : completedChallenges).length === 0 ? (
                <div className="col-span-full text-center py-16">
                  <div className="text-5xl mb-4">🎯</div>
                  <h3 className="text-xl font-bold font-display mb-2">No challenges yet</h3>
                  <p className="text-midnight-400 mb-6">
                    {activeTab === 'active' 
                      ? "Create your first challenge and invite some friends!"
                      : "Complete some challenges to see them here."}
                  </p>
                  {activeTab === 'active' && (
                    <Link to="/create" className="btn-primary inline-flex items-center gap-2">
                      <Plus className="w-5 h-5" />
                      Create Challenge
                    </Link>
                  )}
                </div>
              ) : (
                (activeTab === 'active' ? activeChallenges : completedChallenges).map((challenge) => (
                  <ChallengeCard key={challenge.id} challenge={challenge} />
                ))
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function ChallengeCard({ challenge }) {
  const daysLeft = Math.ceil((new Date(challenge.end_date) - new Date()) / (1000 * 60 * 60 * 24))
  const progress = Math.min(100, Math.round((challenge.completed_count / challenge.total_required) * 100)) || 0

  return (
    <Link to={`/challenge/${challenge.id}`} className="card-hover group">
      <div className="flex items-start justify-between mb-4">
        <div className={`badge ${challenge.policing_type === 'ai' ? 'badge-ember' : 'badge-warning'}`}>
          {challenge.policing_type === 'ai' ? 'AI Verified' : 'Self-Policed'}
        </div>
        <ArrowRight className="w-5 h-5 text-midnight-500 group-hover:text-ember-400 group-hover:translate-x-1 transition-all" />
      </div>

      <h3 className="text-xl font-bold font-display mb-2 group-hover:text-ember-400 transition-colors">
        {challenge.name}
      </h3>

      <div className="flex items-center gap-4 text-sm text-midnight-400 mb-4">
        <span className="flex items-center gap-1">
          <Users className="w-4 h-4" />
          {challenge.participant_count || 1} participants
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          {daysLeft > 0 ? `${daysLeft} days left` : 'Ended'}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-midnight-400">Progress</span>
          <span className="font-medium">{progress}%</span>
        </div>
        <div className="h-2 bg-midnight-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-ember-500 to-amber-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {challenge.wager > 0 && (
        <div className="flex items-center gap-1 text-sm">
          <Coins className="w-3 h-3 text-amber-400" />
          <span className="text-amber-300 font-medium">{challenge.wager.toLocaleString()}</span>
          <span className="text-midnight-500">points wagered</span>
        </div>
      )}
      {challenge.forfeit && !challenge.wager && (
        <div className="text-sm text-midnight-400">
          <span className="text-midnight-500">Stakes:</span> {challenge.forfeit}
        </div>
      )}
    </Link>
  )
}
