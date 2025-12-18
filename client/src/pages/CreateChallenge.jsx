import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, ArrowRight, Plus, X, Users, Trophy, 
  Shield, UserCheck, AlertCircle, Sparkles, Target,
  Camera, Dumbbell, Apple, BookOpen, Heart, Droplets, 
  ImageIcon, Coins
} from 'lucide-react'
import Navbar from '../components/Navbar'
import { API_URL } from '../api'

const proofTypes = [
  { id: 'strava', name: 'Strava/Fitness App', icon: Target, description: 'Screenshots from running/cycling apps' },
  { id: 'gym', name: 'Gym Photo', icon: Dumbbell, description: 'Live photos at the gym' },
  { id: 'food', name: 'Food/Meal', icon: Apple, description: 'Photos of healthy meals' },
  { id: 'study', name: 'Study/Work', icon: BookOpen, description: 'Study materials or timers' },
  { id: 'meditation', name: 'Meditation', icon: Heart, description: 'Meditation app screenshots' },
  { id: 'water', name: 'Water Intake', icon: Droplets, description: 'Water tracking or photos' },
  { id: 'any', name: 'Any Image', icon: ImageIcon, description: 'Any proof image' },
]

export default function CreateChallenge() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [inviteInput, setInviteInput] = useState('')
  const [userPoints, setUserPoints] = useState(0)
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    frequency: 'daily',
    frequencyCount: 1,
    duration: 30,
    forfeit: '',
    wager: 0,
    policingType: 'self',
    proofType: 'any',
    invitees: []
  })

  useEffect(() => {
    fetchUserPoints()
  }, [])

  const fetchUserPoints = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/api/points`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setUserPoints(data.points)
      }
    } catch (err) {
      console.error('Failed to fetch points:', err)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const addInvitee = () => {
    if (inviteInput.trim() && !formData.invitees.includes(inviteInput.trim())) {
      setFormData(prev => ({
        ...prev,
        invitees: [...prev.invitees, inviteInput.trim()]
      }))
      setInviteInput('')
    }
  }

  const removeInvitee = (username) => {
    setFormData(prev => ({
      ...prev,
      invitees: prev.invitees.filter(u => u !== username)
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_URL}/api/challenges`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create challenge')
      }

      navigate(`/challenge/${data.id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-ember-500 to-amber-500 rounded-2xl mb-6">
            <Target className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold font-display mb-2">Create a Challenge</h1>
          <p className="text-midnight-400">Set up your challenge and invite friends to join</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                s === step 
                  ? 'bg-ember-500 text-white scale-110' 
                  : s < step 
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-midnight-800 text-midnight-400'
              }`}>
                {s < step ? '✓' : s}
              </div>
              {s < 3 && (
                <div className={`w-16 h-1 mx-2 rounded-full transition-colors ${
                  s < step ? 'bg-emerald-500' : 'bg-midnight-800'
                }`}></div>
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl mb-6 animate-slide-in">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-red-300 text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="card animate-fade-in">
              <h2 className="text-xl font-bold font-display mb-6 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-ember-500" />
                Challenge Details
              </h2>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-midnight-300 mb-2">Challenge Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="e.g., 30 Days of Running"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-midnight-300 mb-2">Description (optional)</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="input-field resize-none h-24"
                    placeholder="What's the goal? Any specific rules?"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-midnight-300 mb-2">Frequency</label>
                    <select
                      name="frequency"
                      value={formData.frequency}
                      onChange={handleChange}
                      className="input-field"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-midnight-300 mb-2">Duration (days)</label>
                    <input
                      type="number"
                      name="duration"
                      value={formData.duration}
                      onChange={handleChange}
                      className="input-field"
                      min="1"
                      max="365"
                    />
                  </div>
                </div>

                {formData.frequency === 'custom' && (
                  <div>
                    <label className="block text-sm font-medium text-midnight-300 mb-2">Times per week</label>
                    <input
                      type="number"
                      name="frequencyCount"
                      value={formData.frequencyCount}
                      onChange={handleChange}
                      className="input-field"
                      min="1"
                      max="7"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-midnight-300 mb-2">
                    Stakes / Forfeit (optional)
                  </label>
                  <input
                    type="text"
                    name="forfeit"
                    value={formData.forfeit}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="e.g., Buy dinner for the winner"
                  />
                  <p className="text-xs text-midnight-500 mt-1">What does the loser have to do?</p>
                </div>

                {/* Point Wager */}
                <div className="p-4 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/30 rounded-xl">
                  <label className="block text-sm font-medium text-amber-300 mb-2 flex items-center gap-2">
                    <Coins className="w-4 h-4" />
                    Point Wager (optional)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      name="wager"
                      value={formData.wager}
                      onChange={handleChange}
                      className="input-field flex-1"
                      placeholder="0"
                      min="0"
                      max={userPoints}
                    />
                    <div className="text-sm text-midnight-400 whitespace-nowrap">
                      Balance: <span className="text-amber-300 font-bold">{userPoints.toLocaleString()}</span>
                    </div>
                  </div>
                  <p className="text-xs text-midnight-500 mt-2">
                    Each participant stakes this amount. Winner takes all!
                  </p>
                  {formData.wager > userPoints && (
                    <p className="text-xs text-red-400 mt-1">
                      ⚠️ You don't have enough points
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end mt-8">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="btn-primary flex items-center gap-2"
                  disabled={!formData.name}
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Verification */}
          {step === 2 && (
            <div className="card animate-fade-in">
              <h2 className="text-xl font-bold font-display mb-6 flex items-center gap-2">
                <Shield className="w-5 h-5 text-ember-500" />
                Verification Method
              </h2>

              <div className="space-y-4 mb-6">
                <label 
                  className={`block p-4 rounded-xl border cursor-pointer transition-all ${
                    formData.policingType === 'self' 
                      ? 'border-ember-500 bg-ember-500/10' 
                      : 'border-midnight-700 hover:border-midnight-600 bg-midnight-900/50'
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, policingType: 'self' }))}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      formData.policingType === 'self' 
                        ? 'bg-ember-500' 
                        : 'bg-midnight-800'
                    }`}>
                      <UserCheck className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold mb-1">Self-Policed</div>
                      <p className="text-midnight-400 text-sm">
                        Participants mark their own progress. Trust-based system for friends.
                      </p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      formData.policingType === 'self' 
                        ? 'border-ember-500 bg-ember-500' 
                        : 'border-midnight-600'
                    }`}>
                      {formData.policingType === 'self' && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                  </div>
                </label>

                <label 
                  className={`block p-4 rounded-xl border cursor-pointer transition-all ${
                    formData.policingType === 'ai' 
                      ? 'border-ember-500 bg-ember-500/10' 
                      : 'border-midnight-700 hover:border-midnight-600 bg-midnight-900/50'
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, policingType: 'ai' }))}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      formData.policingType === 'ai' 
                        ? 'bg-ember-500' 
                        : 'bg-midnight-800'
                    }`}>
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold mb-1 flex items-center gap-2 flex-wrap">
                        AI Verified
                        <span className="badge-ember text-xs">Recommended</span>
                      </div>
                      <p className="text-midnight-400 text-sm">
                        Upload proof and AI will verify it. Screenshots, photos, anything.
                      </p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      formData.policingType === 'ai' 
                        ? 'border-ember-500 bg-ember-500' 
                        : 'border-midnight-600'
                    }`}>
                      {formData.policingType === 'ai' && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                  </div>
                </label>
              </div>

              {formData.policingType === 'ai' && (
                <div className="animate-slide-up">
                  <label className="block text-sm font-medium text-midnight-300 mb-3">Proof Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    {proofTypes.map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, proofType: type.id }))}
                        className={`p-4 rounded-xl text-left transition-all ${
                          formData.proofType === type.id
                            ? 'bg-ember-500/20 border border-ember-500/50'
                            : 'bg-midnight-900/50 border border-midnight-700 hover:border-midnight-600'
                        }`}
                      >
                        <type.icon className={`w-6 h-6 mb-2 ${
                          formData.proofType === type.id ? 'text-ember-400' : 'text-midnight-400'
                        }`} />
                        <div className="font-medium text-sm">{type.name}</div>
                        <div className="text-xs text-midnight-500">{type.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between mt-8">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn-ghost flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="btn-primary flex items-center gap-2"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Invite Friends */}
          {step === 3 && (
            <div className="card animate-fade-in">
              <h2 className="text-xl font-bold font-display mb-6 flex items-center gap-2">
                <Users className="w-5 h-5 text-ember-500" />
                Invite Friends
              </h2>

              <div className="mb-6">
                <label className="block text-sm font-medium text-midnight-300 mb-2">
                  Add by Username
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inviteInput}
                    onChange={(e) => setInviteInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addInvitee())}
                    className="input-field flex-1"
                    placeholder="Enter username"
                  />
                  <button
                    type="button"
                    onClick={addInvitee}
                    className="btn-secondary px-4"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {formData.invitees.length > 0 && (
                <div className="mb-6">
                  <div className="text-sm text-midnight-400 mb-3">Invited ({formData.invitees.length})</div>
                  <div className="flex flex-wrap gap-2">
                    {formData.invitees.map((username) => (
                      <div 
                        key={username}
                        className="flex items-center gap-2 px-3 py-2 bg-midnight-800 rounded-lg"
                      >
                        <span className="text-sm">@{username}</span>
                        <button
                          type="button"
                          onClick={() => removeInvitee(username)}
                          className="text-midnight-400 hover:text-red-400 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-midnight-900/50 rounded-xl p-4 mb-6">
                <div className="text-sm font-medium mb-2">Challenge Summary</div>
                <div className="space-y-1 text-sm text-midnight-400">
                  <p><span className="text-midnight-300">Name:</span> {formData.name}</p>
                  <p><span className="text-midnight-300">Duration:</span> {formData.duration} days</p>
                  <p><span className="text-midnight-300">Frequency:</span> {formData.frequency}</p>
                  <p><span className="text-midnight-300">Verification:</span> {formData.policingType === 'ai' ? 'AI Verified' : 'Self-Policed'}</p>
                  {formData.policingType === 'ai' && (
                    <p><span className="text-midnight-300">Proof Type:</span> {proofTypes.find(t => t.id === formData.proofType)?.name}</p>
                  )}
                  {formData.forfeit && (
                    <p><span className="text-midnight-300">Stakes:</span> {formData.forfeit}</p>
                  )}
                  {formData.wager > 0 && (
                    <p className="flex items-center gap-1">
                      <span className="text-midnight-300">Point Wager:</span> 
                      <Coins className="w-3 h-3 text-amber-400" />
                      <span className="text-amber-300 font-medium">{parseInt(formData.wager).toLocaleString()}</span>
                      <span className="text-midnight-500">per participant</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="btn-ghost flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="submit"
                  disabled={loading || (formData.wager > 0 && formData.wager > userPoints)}
                  className="btn-primary flex items-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      Create Challenge <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </main>
    </div>
  )
}
