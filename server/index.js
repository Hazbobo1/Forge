import express from 'express'
import cors from 'cors'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import initSqlJs from 'sql.js'
import webpush from 'web-push'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync, writeFileSync, existsSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const DB_PATH = join(__dirname, 'challenge.db')

// VAPID keys for push notifications (generate your own in production)
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U'
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'UUxI4O8-FbRouAf7-fGi7WbwbVYVIlNvoIKFr3Jp-Kw'

// Configure web-push
webpush.setVapidDetails(
  'mailto:hello@forge.app',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
)

// Initialize OpenAI dynamically (optional)
let gemini = null
if (GEMINI_API_KEY) {
  const { GoogleGenerativeAI } = await import('@google/generative-ai')
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
  gemini = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
}

// Database setup
const SQL = await initSqlJs()
let db

// Load or create database
if (existsSync(DB_PATH)) {
  const buffer = readFileSync(DB_PATH)
  db = new SQL.Database(buffer)
} else {
  db = new SQL.Database()
}

// Save database to disk periodically
const saveDb = () => {
  const data = db.export()
  const buffer = Buffer.from(data)
  writeFileSync(DB_PATH, buffer)
}

// Points constants
const STARTING_POINTS = 10000

// Initialize database tables
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    points INTEGER DEFAULT ${STARTING_POINTS},
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`)

// Add points column if it doesn't exist (for existing databases)
try {
  db.run(`ALTER TABLE users ADD COLUMN points INTEGER DEFAULT 10000`)
} catch (e) {}

db.run(`
  CREATE TABLE IF NOT EXISTS challenges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    frequency TEXT DEFAULT 'daily',
    frequency_count INTEGER DEFAULT 1,
    duration INTEGER DEFAULT 30,
    forfeit TEXT,
    wager INTEGER DEFAULT 0,
    policing_type TEXT DEFAULT 'self',
    proof_type TEXT DEFAULT 'any',
    creator_id INTEGER NOT NULL,
    status TEXT DEFAULT 'active',
    start_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    end_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES users(id)
  )
`)

// Add wager column if it doesn't exist (for existing databases)
try {
  db.run(`ALTER TABLE challenges ADD COLUMN wager INTEGER DEFAULT 0`)
} catch (e) {}

db.run(`
  CREATE TABLE IF NOT EXISTS challenge_participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    challenge_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    is_creator INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    points_wagered INTEGER DEFAULT 0,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (challenge_id) REFERENCES challenges(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(challenge_id, user_id)
  )
`)

// Add points_wagered column if it doesn't exist (for existing databases)
try {
  db.run(`ALTER TABLE challenge_participants ADD COLUMN points_wagered INTEGER DEFAULT 0`)
} catch (e) {}

db.run(`
  CREATE TABLE IF NOT EXISTS invites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    challenge_id INTEGER NOT NULL,
    inviter_id INTEGER NOT NULL,
    invitee_id INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (challenge_id) REFERENCES challenges(id),
    FOREIGN KEY (inviter_id) REFERENCES users(id),
    FOREIGN KEY (invitee_id) REFERENCES users(id)
  )
`)

db.run(`
  CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    challenge_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    image_data TEXT,
    verified INTEGER DEFAULT 0,
    ai_response TEXT,
    extracted_data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (challenge_id) REFERENCES challenges(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`)

// Friends table
db.run(`
  CREATE TABLE IF NOT EXISTS friendships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    friend_id INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (friend_id) REFERENCES users(id),
    UNIQUE(user_id, friend_id)
  )
`)

// Activity feed table
db.run(`
  CREATE TABLE IF NOT EXISTS activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    data TEXT,
    challenge_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (challenge_id) REFERENCES challenges(id)
  )
`)

// Push subscriptions table
db.run(`
  CREATE TABLE IF NOT EXISTS push_subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id, endpoint)
  )
`)

// Point transactions table for tracking all point movements
db.run(`
  CREATE TABLE IF NOT EXISTS point_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    amount INTEGER NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    challenge_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (challenge_id) REFERENCES challenges(id)
  )
`)

saveDb()

// Helper function to run queries
const dbGet = (sql, params = []) => {
  const stmt = db.prepare(sql)
  stmt.bind(params)
  if (stmt.step()) {
    const row = stmt.getAsObject()
    stmt.free()
    return row
  }
  stmt.free()
  return null
}

const dbAll = (sql, params = []) => {
  const stmt = db.prepare(sql)
  stmt.bind(params)
  const results = []
  while (stmt.step()) {
    results.push(stmt.getAsObject())
  }
  stmt.free()
  return results
}

const dbRun = (sql, params = []) => {
  db.run(sql, params)
  const result = db.exec("SELECT last_insert_rowid() as id")
  const lastId = result.length > 0 ? result[0].values[0][0] : null
  saveDb()
  return { lastInsertRowid: lastId }
}

// Activity logger
const logActivity = (userId, type, data, challengeId = null) => {
  dbRun(
    'INSERT INTO activities (user_id, type, data, challenge_id) VALUES (?, ?, ?, ?)',
    [userId, type, JSON.stringify(data), challengeId]
  )
}

// Point transaction logger
const logPointTransaction = (userId, amount, type, description, challengeId = null) => {
  dbRun(
    'INSERT INTO point_transactions (user_id, amount, type, description, challenge_id) VALUES (?, ?, ?, ?, ?)',
    [userId, amount, type, description, challengeId]
  )
}

// Update user points (returns new balance)
const updateUserPoints = (userId, amount) => {
  dbRun('UPDATE users SET points = points + ? WHERE id = ?', [amount, userId])
  const user = dbGet('SELECT points FROM users WHERE id = ?', [userId])
  return user?.points || 0
}

// AI Proof verification prompts by type
const getProofPrompt = (proofType, challengeName) => {
  const prompts = {
    strava: `You are verifying a Strava screenshot for the challenge: "${challengeName}".
    
Look for:
- Strava app interface/branding
- Activity type (run, ride, walk, etc.)
- Distance covered
- Duration/time
- Date of activity
- Pace or speed
- Map showing the route (optional)

Extract and return:
- activity_type: string
- distance: string (with units)
- duration: string
- date: string
- pace: string (if available)
- calories: number (if available)`,

    gym: `You are verifying a gym photo for the challenge: "${challengeName}".
    
Look for:
- Gym environment (equipment, mirrors, weights, machines)
- The person appears to be at a gym
- Recent photo indicators (lighting, attire suggests workout)
- Gym signage or branding (optional)

This should be a LIVE photo taken at a gym, not a screenshot of an old photo.`,

    food: `You are verifying a food/meal photo for the challenge: "${challengeName}".
    
Look for:
- Actual food in the image
- If the challenge is about healthy eating, assess if the meal appears healthy
- Fresh/recently prepared food
- Meal type (breakfast, lunch, dinner, snack)

Extract and return:
- meal_type: string
- appears_healthy: boolean
- food_items: array of identified foods`,

    study: `You are verifying a study/work session for the challenge: "${challengeName}".
    
Look for:
- Study materials (books, notes, laptop with work)
- Study environment (desk, library, cafe)
- Timer or Pomodoro app showing study session
- Note-taking apps or documents

Extract and return:
- environment: string
- materials_visible: array
- duration_shown: string (if timer visible)`,

    meditation: `You are verifying a meditation session for the challenge: "${challengeName}".
    
Look for:
- Meditation app screenshot (Headspace, Calm, Insight Timer, etc.)
- Session completion screen
- Duration of session
- Date/time of session

Extract and return:
- app_name: string
- duration: string
- date: string
- session_type: string`,

    water: `You are verifying water intake for the challenge: "${challengeName}".
    
Look for:
- Water bottle or glass of water
- Water tracking app screenshot
- Amount consumed

Extract and return:
- amount: string
- tracking_method: string`,

    reading: `You are verifying a reading session for the challenge: "${challengeName}".
    
Look for:
- Book or e-reader visible
- Reading app screenshot showing progress
- Page numbers or percentage complete
- Book title visible

Extract and return:
- book_title: string (if visible)
- pages_read: number (if shown)
- reading_time: string (if shown)`,

    any: `You are verifying proof for the challenge: "${challengeName}".
    
Analyze the image and determine if it shows valid evidence of completing this challenge activity.
Look for relevant indicators based on what the challenge appears to require.`
  }

  return prompts[proofType] || prompts.any
}

// Middleware
app.use(cors())
app.use(express.json({ limit: '10mb' }))

// Auth middleware
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' })
  }

  try {
    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded
    next()
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' })
  }
}

// ==================== AUTH ROUTES ====================

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' })
    }

    const existingUser = dbGet('SELECT id FROM users WHERE email = ? OR username = ?', [email, username])
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const result = dbRun('INSERT INTO users (username, email, password, points) VALUES (?, ?, ?, ?)', [username, email, hashedPassword, STARTING_POINTS])

    const userId = result.lastInsertRowid

    // Log the signup bonus transaction
    logPointTransaction(userId, STARTING_POINTS, 'signup_bonus', 'Welcome bonus for joining Forge!')

    const token = jwt.sign({ id: userId, username, email }, JWT_SECRET, { expiresIn: '7d' })

    // Log activity
    logActivity(userId, 'joined', { username })

    res.json({
      user: { id: userId, username, email, points: STARTING_POINTS },
      token
    })
  } catch (err) {
    console.error('Signup error:', err)
    res.status(500).json({ error: 'Failed to create account' })
  }
})

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body

    const user = dbGet('SELECT * FROM users WHERE email = ?', [email])
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' })
    }

    const validPassword = await bcrypt.compare(password, user.password)
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' })
    }

    const token = jwt.sign({ id: user.id, username: user.username, email: user.email }, JWT_SECRET, { expiresIn: '7d' })

    res.json({
      user: { id: user.id, username: user.username, email: user.email, points: user.points || STARTING_POINTS },
      token
    })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'Login failed' })
  }
})

// ==================== CHALLENGE ROUTES ====================

app.get('/api/challenges', authenticate, (req, res) => {
  try {
    const challenges = dbAll(`
      SELECT 
        c.*,
        u.username as creator_username,
        (SELECT COUNT(*) FROM challenge_participants WHERE challenge_id = c.id) as participant_count,
        (SELECT COUNT(*) FROM submissions WHERE challenge_id = c.id AND user_id = ? AND verified = 1) as completed_count,
        (SELECT SUM(points_wagered) FROM challenge_participants WHERE challenge_id = c.id) as total_pot,
        CASE 
          WHEN c.frequency = 'daily' THEN c.duration
          WHEN c.frequency = 'weekly' THEN c.duration / 7 * c.frequency_count
          ELSE c.frequency_count * (c.duration / 7)
        END as total_required
      FROM challenges c
      JOIN users u ON c.creator_id = u.id
      JOIN challenge_participants cp ON cp.challenge_id = c.id
      WHERE cp.user_id = ?
      ORDER BY c.created_at DESC
    `, [req.user.id, req.user.id])

    res.json(challenges)
  } catch (err) {
    console.error('Get challenges error:', err)
    res.status(500).json({ error: 'Failed to fetch challenges' })
  }
})

app.post('/api/challenges', authenticate, (req, res) => {
  try {
    const { name, description, frequency, frequencyCount, duration, forfeit, policingType, proofType, invitees, wager } = req.body

    const wagerAmount = parseInt(wager) || 0

    // If there's a wager, check if user has enough points
    if (wagerAmount > 0) {
      const user = dbGet('SELECT points FROM users WHERE id = ?', [req.user.id])
      if (!user || user.points < wagerAmount) {
        return res.status(400).json({ error: `Insufficient points. You have ${user?.points || 0} points but tried to wager ${wagerAmount}.` })
      }
    }

    const endDate = new Date()
    endDate.setDate(endDate.getDate() + parseInt(duration))

    const result = dbRun(`
      INSERT INTO challenges (name, description, frequency, frequency_count, duration, forfeit, wager, policing_type, proof_type, creator_id, end_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [name, description, frequency, frequencyCount || 1, duration, forfeit, wagerAmount, policingType, proofType || 'any', req.user.id, endDate.toISOString()])

    const challengeId = result.lastInsertRowid

    // Deduct points and record transaction if there's a wager
    if (wagerAmount > 0) {
      updateUserPoints(req.user.id, -wagerAmount)
      logPointTransaction(req.user.id, -wagerAmount, 'wager', `Wagered on challenge: ${name}`, challengeId)
    }

    dbRun('INSERT INTO challenge_participants (challenge_id, user_id, is_creator, points_wagered) VALUES (?, ?, 1, ?)', [challengeId, req.user.id, wagerAmount])

    // Log activity
    logActivity(req.user.id, 'created_challenge', { name, duration, wager: wagerAmount }, challengeId)

    if (invitees && invitees.length > 0) {
      for (const username of invitees) {
        const invitee = dbGet('SELECT id FROM users WHERE username = ?', [username])
        if (invitee && invitee.id !== req.user.id) {
          try {
            dbRun('INSERT INTO invites (challenge_id, inviter_id, invitee_id) VALUES (?, ?, ?)', [challengeId, req.user.id, invitee.id])
            // Send push notification for invite
            const wagerText = wagerAmount > 0 ? ` (${wagerAmount} points at stake!)` : ''
            sendPushToUser(invitee.id, {
              title: 'New Challenge Invite! 🔥',
              body: `${req.user.username} invited you to "${name}"${wagerText}`,
              url: '/dashboard'
            })
          } catch (e) {}
        }
      }
    }

    res.json({ id: challengeId, message: 'Challenge created successfully' })
  } catch (err) {
    console.error('Create challenge error:', err)
    res.status(500).json({ error: 'Failed to create challenge' })
  }
})

app.get('/api/challenges/:id', authenticate, (req, res) => {
  try {
    const challengeId = parseInt(req.params.id)
    const challenge = dbGet(`
      SELECT 
        c.*,
        u.username as creator_username,
        (SELECT COUNT(*) FROM challenge_participants WHERE challenge_id = c.id) as participant_count,
        (SELECT COUNT(*) FROM submissions WHERE challenge_id = c.id AND user_id = ? AND verified = 1) as completed_count,
        (SELECT COUNT(*) FROM submissions WHERE challenge_id = c.id AND user_id = ?) as my_submissions,
        (SELECT SUM(points_wagered) FROM challenge_participants WHERE challenge_id = c.id) as total_pot
      FROM challenges c
      JOIN users u ON c.creator_id = u.id
      WHERE c.id = ?
    `, [req.user.id, req.user.id, challengeId])

    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' })
    }

    // Calculate required submissions
    const requiredSubmissions = calculateRequiredSubmissions(challenge)
    challenge.required_submissions = requiredSubmissions
    challenge.completion_threshold = Math.ceil(requiredSubmissions * COMPLETION_THRESHOLD)

    const participants = dbAll(`
      SELECT u.id, u.username, cp.is_creator, cp.current_streak, cp.longest_streak, cp.points_wagered,
        (SELECT COUNT(*) FROM submissions WHERE challenge_id = cp.challenge_id AND user_id = cp.user_id AND verified = 1) as verified_count
      FROM challenge_participants cp
      JOIN users u ON cp.user_id = u.id
      WHERE cp.challenge_id = ?
    `, [challengeId])

    // Add completion info for each participant
    challenge.participants = participants.map(p => ({
      ...p,
      completion_percent: Math.round((p.verified_count / requiredSubmissions) * 100),
      on_track: p.verified_count >= Math.ceil(requiredSubmissions * COMPLETION_THRESHOLD)
    }))

    res.json(challenge)
  } catch (err) {
    console.error('Get challenge error:', err)
    res.status(500).json({ error: 'Failed to fetch challenge' })
  }
})

// Leaderboard endpoint
app.get('/api/challenges/:id/leaderboard', authenticate, (req, res) => {
  try {
    const challengeId = parseInt(req.params.id)
    
    const leaderboard = dbAll(`
      SELECT 
        u.id as user_id,
        u.username,
        cp.current_streak as streak,
        cp.longest_streak,
        COUNT(s.id) as total_submissions,
        SUM(CASE WHEN s.verified = 1 THEN 1 ELSE 0 END) as verified_submissions,
        MAX(s.created_at) as last_submission
      FROM challenge_participants cp
      JOIN users u ON cp.user_id = u.id
      LEFT JOIN submissions s ON s.challenge_id = cp.challenge_id AND s.user_id = cp.user_id
      WHERE cp.challenge_id = ?
      GROUP BY u.id
      ORDER BY verified_submissions DESC, cp.current_streak DESC
    `, [challengeId])

    res.json(leaderboard)
  } catch (err) {
    console.error('Get leaderboard error:', err)
    res.status(500).json({ error: 'Failed to fetch leaderboard' })
  }
})

app.get('/api/challenges/:id/submissions', authenticate, (req, res) => {
  try {
    const challengeId = parseInt(req.params.id)
    const submissions = dbAll(`
      SELECT s.*, u.username
      FROM submissions s
      JOIN users u ON s.user_id = u.id
      WHERE s.challenge_id = ?
      ORDER BY s.created_at DESC
      LIMIT 50
    `, [challengeId])

    res.json(submissions)
  } catch (err) {
    console.error('Get submissions error:', err)
    res.status(500).json({ error: 'Failed to fetch submissions' })
  }
})

app.post('/api/challenges/:id/submit', authenticate, async (req, res) => {
  try {
    const { image, type } = req.body
    const challengeId = parseInt(req.params.id)

    const challenge = dbGet('SELECT * FROM challenges WHERE id = ?', [challengeId])
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' })
    }

    const today = new Date().toISOString().split('T')[0]
    const existingSubmission = dbGet(`
      SELECT id FROM submissions 
      WHERE challenge_id = ? AND user_id = ? AND DATE(created_at) = ?
    `, [challengeId, req.user.id, today])

    if (existingSubmission) {
      return res.status(400).json({ error: 'Already submitted for today' })
    }

    let verified = false
    let aiResponse = null
    let message = ''
    let details = null

    if (type === 'self' || challenge.policing_type === 'self') {
      verified = true
      message = 'Progress marked successfully!'
    } else if (image && gemini) {
      try {
        const proofPrompt = getProofPrompt(challenge.proof_type, challenge.name)
        
        // Extract base64 data from data URL
        const base64Match = image.match(/^data:image\/(\w+);base64,(.+)$/)
        if (!base64Match) {
          throw new Error('Invalid image format')
        }
        const mimeType = `image/${base64Match[1]}`
        const base64Data = base64Match[2]
        
        const prompt = `${proofPrompt}

Analyze this image for the challenge "${challenge.name}".

Respond with ONLY a JSON object (no markdown, no code blocks) containing:
- verified: boolean (true if the proof is valid for this challenge)
- message: string (friendly explanation of your decision)
- details: object with any extracted data (distance, time, date, location, etc.)
- confidence: number (0-100, how confident you are)

Be encouraging but accurate. If you can't verify, explain what would help.`

        // Retry logic for rate limits
        let result
        let retries = 3
        while (retries > 0) {
          try {
            result = await gemini.generateContent([
              prompt,
              {
                inlineData: {
                  mimeType,
                  data: base64Data
                }
              }
            ])
            break // Success, exit loop
          } catch (retryErr) {
            if (retryErr.message?.includes('429') || retryErr.message?.includes('quota') || retryErr.status === 429) {
              retries--
              if (retries > 0) {
                console.log(`Rate limited, waiting 30s... (${retries} retries left)`)
                await new Promise(r => setTimeout(r, 30000)) // Wait 30 seconds
              } else {
                throw retryErr
              }
            } else {
              throw retryErr
            }
          }
        }

        const content = result.response.text()
        
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0])
            verified = parsed.verified
            message = parsed.message
            details = parsed.details
            aiResponse = content
          } else {
            verified = content.toLowerCase().includes('verified') && !content.toLowerCase().includes('not verified')
            message = content
            aiResponse = content
          }
        } catch (parseErr) {
          verified = content.toLowerCase().includes('verified') && !content.toLowerCase().includes('not verified')
          message = content
          aiResponse = content
        }
      } catch (aiErr) {
        console.error('AI verification error:', aiErr.message || aiErr)
        console.error('Full error:', JSON.stringify(aiErr, null, 2))
        message = 'AI verification temporarily unavailable. Marking as pending.'
        verified = false
      }
    } else if (image && !gemini) {
      verified = true
      message = 'Proof submitted! (AI verification not configured)'
    } else {
      return res.status(400).json({ error: 'No proof provided' })
    }

    // Save submission
    dbRun(`
      INSERT INTO submissions (challenge_id, user_id, image_data, verified, ai_response, extracted_data)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [challengeId, req.user.id, image ? 'image_submitted' : null, verified ? 1 : 0, aiResponse, JSON.stringify(details)])

    // Update streak if verified
    if (verified) {
      const participant = dbGet(
        'SELECT current_streak, longest_streak FROM challenge_participants WHERE challenge_id = ? AND user_id = ?',
        [challengeId, req.user.id]
      )
      
      if (participant) {
        const newStreak = participant.current_streak + 1
        const longestStreak = Math.max(newStreak, participant.longest_streak)
        dbRun(
          'UPDATE challenge_participants SET current_streak = ?, longest_streak = ? WHERE challenge_id = ? AND user_id = ?',
          [newStreak, longestStreak, challengeId, req.user.id]
        )
      }

      // Log activity
      logActivity(req.user.id, 'submission_verified', { challenge_name: challenge.name }, challengeId)
    }

    res.json({ verified, message, details })
  } catch (err) {
    console.error('Submit proof error:', err)
    res.status(500).json({ error: 'Failed to submit proof' })
  }
})

// Calculate required submissions for a challenge
const calculateRequiredSubmissions = (challenge) => {
  const duration = challenge.duration || 30
  const frequency = challenge.frequency || 'daily'
  const frequencyCount = challenge.frequency_count || 1

  if (frequency === 'daily') {
    return duration // 1 per day
  } else if (frequency === 'weekly') {
    return Math.ceil(duration / 7) * frequencyCount
  } else {
    // custom - frequencyCount times per week
    return Math.ceil(duration / 7) * frequencyCount
  }
}

// Completion threshold - 100% required to win
const COMPLETION_THRESHOLD = 1.0

// Settle a challenge and distribute winnings
app.post('/api/challenges/:id/settle', authenticate, (req, res) => {
  try {
    const challengeId = parseInt(req.params.id)
    
    const challenge = dbGet('SELECT * FROM challenges WHERE id = ?', [challengeId])
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' })
    }

    // Only creator can settle, or it can be auto-settled
    if (challenge.creator_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the challenge creator can settle' })
    }

    if (challenge.status === 'settled') {
      return res.status(400).json({ error: 'Challenge already settled' })
    }

    // Calculate required submissions
    const requiredSubmissions = calculateRequiredSubmissions(challenge)

    // Get total pot
    const potResult = dbGet('SELECT SUM(points_wagered) as total FROM challenge_participants WHERE challenge_id = ?', [challengeId])
    const totalPot = potResult?.total || 0

    if (totalPot === 0) {
      // No wager, just mark as completed
      dbRun('UPDATE challenges SET status = ? WHERE id = ?', ['completed', challengeId])
      return res.json({ message: 'Challenge completed (no points at stake)', winners: [], required: requiredSubmissions })
    }

    // Get all participants with their completion stats
    const participants = dbAll(`
      SELECT 
        cp.user_id,
        u.username,
        cp.points_wagered,
        COUNT(s.id) as verified_count,
        cp.longest_streak
      FROM challenge_participants cp
      JOIN users u ON cp.user_id = u.id
      LEFT JOIN submissions s ON s.challenge_id = cp.challenge_id AND s.user_id = cp.user_id AND s.verified = 1
      WHERE cp.challenge_id = ?
      GROUP BY cp.user_id
      ORDER BY verified_count DESC, cp.longest_streak DESC
    `, [challengeId])

    if (participants.length === 0) {
      dbRun('UPDATE challenges SET status = ? WHERE id = ?', ['completed', challengeId])
      return res.json({ message: 'No participants', winners: [], required: requiredSubmissions })
    }

    // Calculate completion percentage for each participant
    const participantsWithCompletion = participants.map(p => ({
      ...p,
      completion: p.verified_count / requiredSubmissions,
      completed: p.verified_count >= requiredSubmissions * COMPLETION_THRESHOLD
    }))

    // Find completers (those who hit the threshold)
    const completers = participantsWithCompletion.filter(p => p.completed)
    const nonCompleters = participantsWithCompletion.filter(p => !p.completed)

    // Results to return
    const results = {
      required: requiredSubmissions,
      threshold: Math.ceil(requiredSubmissions * COMPLETION_THRESHOLD),
      total_pot: totalPot,
      completers: [],
      failed: []
    }

    if (completers.length === 0) {
      // No one completed - refund everyone
      for (const p of participantsWithCompletion) {
        if (p.points_wagered > 0) {
          updateUserPoints(p.user_id, p.points_wagered)
          logPointTransaction(p.user_id, p.points_wagered, 'refund', `Refund from challenge: ${challenge.name} (no one completed)`, challengeId)
        }
        results.failed.push({
          user_id: p.user_id,
          username: p.username,
          verified_count: p.verified_count,
          completion: Math.round(p.completion * 100),
          refunded: p.points_wagered
        })
      }
      
      dbRun('UPDATE challenges SET status = ? WHERE id = ?', ['settled', challengeId])
      
      return res.json({ 
        message: 'No one completed the challenge - all wagers refunded', 
        ...results,
        refunded: true 
      })
    }

    // Calculate pot: completers split the total pot (including forfeits from non-completers)
    const winningsPerPerson = Math.floor(totalPot / completers.length)
    const remainder = totalPot % completers.length

    // Distribute to completers
    for (let i = 0; i < completers.length; i++) {
      const winner = completers[i]
      const winnings = winningsPerPerson + (i === 0 ? remainder : 0)
      
      updateUserPoints(winner.user_id, winnings)
      logPointTransaction(winner.user_id, winnings, 'winnings', `Completed challenge: ${challenge.name}`, challengeId)
      
      // Send notification
      sendPushToUser(winner.user_id, {
        title: 'Challenge Complete! 🏆',
        body: `You completed "${challenge.name}" and won ${winnings} points!`,
        url: `/challenge/${challengeId}`
      })

      // Log activity
      logActivity(winner.user_id, 'completed_challenge', { 
        challenge_name: challenge.name, 
        winnings,
        verified_count: winner.verified_count,
        required: requiredSubmissions
      }, challengeId)

      results.completers.push({
        user_id: winner.user_id,
        username: winner.username,
        verified_count: winner.verified_count,
        completion: Math.round(winner.completion * 100),
        winnings
      })
    }

    // Record failed participants (they forfeit their wager)
    for (const loser of nonCompleters) {
      // Send notification
      sendPushToUser(loser.user_id, {
        title: 'Challenge Failed 😔',
        body: `You didn't complete "${challenge.name}" (${loser.verified_count}/${requiredSubmissions}). Your wager was forfeited.`,
        url: `/challenge/${challengeId}`
      })

      // Log activity
      logActivity(loser.user_id, 'failed_challenge', { 
        challenge_name: challenge.name, 
        verified_count: loser.verified_count,
        required: requiredSubmissions,
        forfeited: loser.points_wagered
      }, challengeId)

      results.failed.push({
        user_id: loser.user_id,
        username: loser.username,
        verified_count: loser.verified_count,
        completion: Math.round(loser.completion * 100),
        forfeited: loser.points_wagered
      })
    }

    dbRun('UPDATE challenges SET status = ? WHERE id = ?', ['settled', challengeId])

    res.json({ 
      message: `Challenge settled! ${completers.length} completed, ${nonCompleters.length} failed.`, 
      ...results
    })
  } catch (err) {
    console.error('Settle challenge error:', err)
    res.status(500).json({ error: 'Failed to settle challenge' })
  }
})

// ==================== INVITE ROUTES ====================

app.get('/api/invites', authenticate, (req, res) => {
  try {
    const invites = dbAll(`
      SELECT 
        i.*,
        c.name as challenge_name,
        c.wager,
        u.username as inviter_username
      FROM invites i
      JOIN challenges c ON i.challenge_id = c.id
      JOIN users u ON i.inviter_id = u.id
      WHERE i.invitee_id = ? AND i.status = 'pending'
      ORDER BY i.created_at DESC
    `, [req.user.id])

    res.json(invites)
  } catch (err) {
    console.error('Get invites error:', err)
    res.status(500).json({ error: 'Failed to fetch invites' })
  }
})

app.post('/api/invites/:id/accept', authenticate, (req, res) => {
  try {
    const invite = dbGet('SELECT * FROM invites WHERE id = ? AND invitee_id = ?', [req.params.id, req.user.id])
    
    if (!invite) {
      return res.status(404).json({ error: 'Invite not found' })
    }

    // Get challenge to check for wager
    const challenge = dbGet('SELECT * FROM challenges WHERE id = ?', [invite.challenge_id])
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' })
    }

    const wagerAmount = challenge.wager || 0

    // If there's a wager, check if user has enough points
    if (wagerAmount > 0) {
      const user = dbGet('SELECT points FROM users WHERE id = ?', [req.user.id])
      if (!user || user.points < wagerAmount) {
        return res.status(400).json({ error: `Insufficient points. You need ${wagerAmount} points to join this challenge, but you only have ${user?.points || 0}.` })
      }

      // Deduct points
      updateUserPoints(req.user.id, -wagerAmount)
      logPointTransaction(req.user.id, -wagerAmount, 'wager', `Joined challenge: ${challenge.name}`, challenge.id)
    }

    dbRun('UPDATE invites SET status = ? WHERE id = ?', ['accepted', req.params.id])

    try {
      dbRun('INSERT INTO challenge_participants (challenge_id, user_id, points_wagered) VALUES (?, ?, ?)', [invite.challenge_id, req.user.id, wagerAmount])
    } catch (e) {}

    // Log activity
    logActivity(req.user.id, 'joined_challenge', { challenge_name: challenge.name, wager: wagerAmount }, invite.challenge_id)

    res.json({ message: 'Invite accepted!', points_wagered: wagerAmount })
  } catch (err) {
    console.error('Accept invite error:', err)
    res.status(500).json({ error: 'Failed to accept invite' })
  }
})

app.post('/api/invites/:id/decline', authenticate, (req, res) => {
  try {
    dbRun('UPDATE invites SET status = ? WHERE id = ? AND invitee_id = ?', ['declined', req.params.id, req.user.id])
    res.json({ message: 'Invite declined' })
  } catch (err) {
    console.error('Decline invite error:', err)
    res.status(500).json({ error: 'Failed to decline invite' })
  }
})

// ==================== FRIEND ROUTES ====================

app.get('/api/friends', authenticate, (req, res) => {
  try {
    const friends = dbAll(`
      SELECT 
        u.id, u.username, u.bio, u.created_at as member_since,
        f.created_at as friends_since
      FROM friendships f
      JOIN users u ON (f.friend_id = u.id OR f.user_id = u.id) AND u.id != ?
      WHERE (f.user_id = ? OR f.friend_id = ?) AND f.status = 'accepted'
    `, [req.user.id, req.user.id, req.user.id])

    res.json(friends)
  } catch (err) {
    console.error('Get friends error:', err)
    res.status(500).json({ error: 'Failed to fetch friends' })
  }
})

app.get('/api/friends/requests', authenticate, (req, res) => {
  try {
    const requests = dbAll(`
      SELECT 
        f.id, f.created_at,
        u.id as user_id, u.username
      FROM friendships f
      JOIN users u ON f.user_id = u.id
      WHERE f.friend_id = ? AND f.status = 'pending'
      ORDER BY f.created_at DESC
    `, [req.user.id])

    res.json(requests)
  } catch (err) {
    console.error('Get friend requests error:', err)
    res.status(500).json({ error: 'Failed to fetch friend requests' })
  }
})

app.post('/api/friends/request', authenticate, (req, res) => {
  try {
    const { username } = req.body

    const friend = dbGet('SELECT id FROM users WHERE username = ?', [username])
    if (!friend) {
      return res.status(404).json({ error: 'User not found' })
    }

    if (friend.id === req.user.id) {
      return res.status(400).json({ error: "You can't add yourself as a friend" })
    }

    // Check if friendship already exists
    const existing = dbGet(
      'SELECT * FROM friendships WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)',
      [req.user.id, friend.id, friend.id, req.user.id]
    )

    if (existing) {
      if (existing.status === 'accepted') {
        return res.status(400).json({ error: 'Already friends' })
      }
      return res.status(400).json({ error: 'Request already sent' })
    }

    dbRun('INSERT INTO friendships (user_id, friend_id, status) VALUES (?, ?, ?)', [req.user.id, friend.id, 'pending'])

    // Send push notification
    sendPushToUser(friend.id, {
      title: 'New Friend Request! 👋',
      body: `${req.user.username} wants to be your friend`,
      url: '/friends'
    })

    // Log activity
    logActivity(req.user.id, 'friend_request_sent', { to_username: username })

    res.json({ message: 'Friend request sent!' })
  } catch (err) {
    console.error('Send friend request error:', err)
    res.status(500).json({ error: 'Failed to send friend request' })
  }
})

app.post('/api/friends/accept/:id', authenticate, (req, res) => {
  try {
    const friendship = dbGet('SELECT * FROM friendships WHERE id = ? AND friend_id = ?', [req.params.id, req.user.id])
    
    if (!friendship) {
      return res.status(404).json({ error: 'Request not found' })
    }

    dbRun('UPDATE friendships SET status = ? WHERE id = ?', ['accepted', req.params.id])

    // Log activity
    const friend = dbGet('SELECT username FROM users WHERE id = ?', [friendship.user_id])
    logActivity(req.user.id, 'became_friends', { with_username: friend?.username })

    res.json({ message: 'Friend request accepted!' })
  } catch (err) {
    console.error('Accept friend request error:', err)
    res.status(500).json({ error: 'Failed to accept request' })
  }
})

app.post('/api/friends/decline/:id', authenticate, (req, res) => {
  try {
    dbRun('DELETE FROM friendships WHERE id = ? AND friend_id = ?', [req.params.id, req.user.id])
    res.json({ message: 'Friend request declined' })
  } catch (err) {
    console.error('Decline friend request error:', err)
    res.status(500).json({ error: 'Failed to decline request' })
  }
})

app.delete('/api/friends/:id', authenticate, (req, res) => {
  try {
    dbRun(
      'DELETE FROM friendships WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)',
      [req.user.id, req.params.id, req.params.id, req.user.id]
    )
    res.json({ message: 'Friend removed' })
  } catch (err) {
    console.error('Remove friend error:', err)
    res.status(500).json({ error: 'Failed to remove friend' })
  }
})

// ==================== ACTIVITY FEED ====================

app.get('/api/feed', authenticate, (req, res) => {
  try {
    // Get activities from friends and self
    const activities = dbAll(`
      SELECT 
        a.*,
        u.username,
        c.name as challenge_name
      FROM activities a
      JOIN users u ON a.user_id = u.id
      LEFT JOIN challenges c ON a.challenge_id = c.id
      WHERE a.user_id = ?
        OR a.user_id IN (
          SELECT CASE WHEN user_id = ? THEN friend_id ELSE user_id END
          FROM friendships
          WHERE (user_id = ? OR friend_id = ?) AND status = 'accepted'
        )
      ORDER BY a.created_at DESC
      LIMIT 50
    `, [req.user.id, req.user.id, req.user.id, req.user.id])

    // Parse JSON data
    const parsed = activities.map(a => ({
      ...a,
      data: a.data ? JSON.parse(a.data) : {}
    }))

    res.json(parsed)
  } catch (err) {
    console.error('Get feed error:', err)
    res.status(500).json({ error: 'Failed to fetch feed' })
  }
})

// ==================== USER ROUTES ====================

app.get('/api/users/search', authenticate, (req, res) => {
  try {
    const { q } = req.query
    if (!q || q.length < 2) {
      return res.json([])
    }

    const users = dbAll(`
      SELECT id, username FROM users 
      WHERE username LIKE ? AND id != ?
      LIMIT 10
    `, [`%${q}%`, req.user.id])

    res.json(users)
  } catch (err) {
    console.error('Search users error:', err)
    res.status(500).json({ error: 'Failed to search users' })
  }
})

app.get('/api/users/id/:id', authenticate, (req, res) => {
  try {
    const user = dbGet(`
      SELECT id, username, bio, created_at
      FROM users WHERE id = ?
    `, [req.params.id])

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Get their stats
    const stats = dbGet(`
      SELECT 
        (SELECT COUNT(*) FROM challenge_participants WHERE user_id = ?) as challenges_joined,
        (SELECT COUNT(*) FROM submissions WHERE user_id = ? AND verified = 1) as total_submissions,
        (SELECT MAX(longest_streak) FROM challenge_participants WHERE user_id = ?) as best_streak
    `, [user.id, user.id, user.id])

    // Check friendship status
    const friendship = dbGet(`
      SELECT status FROM friendships 
      WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
    `, [req.user.id, user.id, user.id, req.user.id])

    // Get recent activities
    const activities = dbAll(`
      SELECT a.*, c.name as challenge_name
      FROM activities a
      LEFT JOIN challenges c ON a.challenge_id = c.id
      WHERE a.user_id = ?
      ORDER BY a.created_at DESC
      LIMIT 10
    `, [user.id])

    res.json({
      ...user,
      ...stats,
      friendship_status: friendship?.status || null,
      is_self: user.id === req.user.id,
      activities: activities.map(a => ({
        ...a,
        data: a.data ? JSON.parse(a.data) : {}
      }))
    })
  } catch (err) {
    console.error('Get user error:', err)
    res.status(500).json({ error: 'Failed to fetch user' })
  }
})

app.get('/api/users/:username', authenticate, (req, res) => {
  try {
    const user = dbGet(`
      SELECT id, username, bio, created_at
      FROM users WHERE username = ?
    `, [req.params.username])

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Get their stats
    const stats = dbGet(`
      SELECT 
        (SELECT COUNT(*) FROM challenge_participants WHERE user_id = ?) as challenges_joined,
        (SELECT COUNT(*) FROM submissions WHERE user_id = ? AND verified = 1) as total_submissions,
        (SELECT MAX(longest_streak) FROM challenge_participants WHERE user_id = ?) as best_streak
    `, [user.id, user.id, user.id])

    // Check friendship status
    const friendship = dbGet(`
      SELECT status FROM friendships 
      WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
    `, [req.user.id, user.id, user.id, req.user.id])

    res.json({
      ...user,
      ...stats,
      friendship_status: friendship?.status || null,
      is_self: user.id === req.user.id
    })
  } catch (err) {
    console.error('Get user error:', err)
    res.status(500).json({ error: 'Failed to fetch user' })
  }
})

app.put('/api/users/profile', authenticate, (req, res) => {
  try {
    const { bio } = req.body
    dbRun('UPDATE users SET bio = ? WHERE id = ?', [bio, req.user.id])
    res.json({ message: 'Profile updated!' })
  } catch (err) {
    console.error('Update profile error:', err)
    res.status(500).json({ error: 'Failed to update profile' })
  }
})

// ==================== POINTS ROUTES ====================

// Get current user's points
app.get('/api/points', authenticate, (req, res) => {
  try {
    const user = dbGet('SELECT points FROM users WHERE id = ?', [req.user.id])
    res.json({ points: user?.points || STARTING_POINTS })
  } catch (err) {
    console.error('Get points error:', err)
    res.status(500).json({ error: 'Failed to fetch points' })
  }
})

// Get current user's point transaction history
app.get('/api/points/transactions', authenticate, (req, res) => {
  try {
    const transactions = dbAll(`
      SELECT pt.*, c.name as challenge_name
      FROM point_transactions pt
      LEFT JOIN challenges c ON pt.challenge_id = c.id
      WHERE pt.user_id = ?
      ORDER BY pt.created_at DESC
      LIMIT 50
    `, [req.user.id])

    res.json(transactions)
  } catch (err) {
    console.error('Get transactions error:', err)
    res.status(500).json({ error: 'Failed to fetch transactions' })
  }
})

// Points leaderboard
app.get('/api/points/leaderboard', authenticate, (req, res) => {
  try {
    const leaderboard = dbAll(`
      SELECT id, username, points
      FROM users
      ORDER BY points DESC
      LIMIT 20
    `)

    res.json(leaderboard)
  } catch (err) {
    console.error('Get leaderboard error:', err)
    res.status(500).json({ error: 'Failed to fetch leaderboard' })
  }
})

// ==================== PUSH NOTIFICATIONS ====================

app.get('/api/push/vapid-key', (req, res) => {
  res.json({ publicKey: VAPID_PUBLIC_KEY })
})

app.post('/api/push/subscribe', authenticate, (req, res) => {
  try {
    const { subscription } = req.body
    
    // Store subscription
    dbRun(`
      INSERT OR REPLACE INTO push_subscriptions (user_id, endpoint, p256dh, auth)
      VALUES (?, ?, ?, ?)
    `, [req.user.id, subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth])

    res.json({ message: 'Subscribed to notifications' })
  } catch (err) {
    console.error('Subscribe error:', err)
    res.status(500).json({ error: 'Failed to subscribe' })
  }
})

app.post('/api/push/unsubscribe', authenticate, (req, res) => {
  try {
    dbRun('DELETE FROM push_subscriptions WHERE user_id = ?', [req.user.id])
    res.json({ message: 'Unsubscribed from notifications' })
  } catch (err) {
    console.error('Unsubscribe error:', err)
    res.status(500).json({ error: 'Failed to unsubscribe' })
  }
})

// Helper function to send push to a user
async function sendPushToUser(userId, payload) {
  try {
    const subscriptions = dbAll(
      'SELECT * FROM push_subscriptions WHERE user_id = ?',
      [userId]
    )

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth }
          },
          JSON.stringify(payload)
        )
      } catch (err) {
        if (err.statusCode === 410) {
          // Subscription expired, remove it
          dbRun('DELETE FROM push_subscriptions WHERE id = ?', [sub.id])
        }
      }
    }
  } catch (err) {
    console.error('Send push error:', err)
  }
}

// Daily reminder cron (call this endpoint from a cron job)
app.post('/api/cron/daily-reminders', async (req, res) => {
  try {
    // Find users who haven't submitted today
    const today = new Date().toISOString().split('T')[0]
    
    const usersToRemind = dbAll(`
      SELECT DISTINCT cp.user_id, u.username, c.name as challenge_name
      FROM challenge_participants cp
      JOIN challenges c ON cp.challenge_id = c.id
      JOIN users u ON cp.user_id = u.id
      WHERE c.status = 'active'
        AND c.frequency = 'daily'
        AND NOT EXISTS (
          SELECT 1 FROM submissions s 
          WHERE s.challenge_id = cp.challenge_id 
            AND s.user_id = cp.user_id 
            AND DATE(s.created_at) = ?
        )
    `, [today])

    for (const user of usersToRemind) {
      await sendPushToUser(user.user_id, {
        title: "Don't break your streak! 🔥",
        body: `You haven't submitted proof for "${user.challenge_name}" today`,
        url: '/dashboard'
      })
    }

    res.json({ reminded: usersToRemind.length })
  } catch (err) {
    console.error('Daily reminders error:', err)
    res.status(500).json({ error: 'Failed to send reminders' })
  }
})

// Start server
app.listen(PORT, () => {
  console.log(`🔥 Forge API server running on http://localhost:${PORT}`)
  if (!GEMINI_API_KEY) {
    console.log('⚠️  No GEMINI_API_KEY set - AI verification will auto-approve submissions')
  }
})
