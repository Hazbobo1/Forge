# 🔥 Forge - Challenge App

A modern web app for creating and completing challenges with friends. Set goals, invite friends, and let AI verify your progress.

## Features

- **User Accounts**: Create an account and find friends by username
- **Challenge Creation**: Set up challenges with custom frequency, duration, and stakes
- **Invite System**: Invite friends by username to join your challenges
- **Two Policing Modes**:
  - **Self-Policed**: Trust-based system where participants mark their own progress
  - **AI-Verified**: Upload screenshots or photos and AI verifies your progress
- **Progress Tracking**: See your progress and stay accountable
- **Real Stakes**: Set forfeits for losing to keep everyone motivated

## Tech Stack

- **Frontend**: React + Vite + TailwindCSS
- **Backend**: Node.js + Express
- **Database**: SQLite (better-sqlite3)
- **AI**: OpenAI GPT-4 Vision (optional)

## Quick Start

### Prerequisites
- Node.js 18+ installed

### Installation

```bash
# Install dependencies for both client and server
npm run install:all

# Or install separately:
cd client && npm install
cd ../server && npm install
```

### Running the App

```bash
# Run both frontend and backend
npm run dev

# Or run separately:
# Terminal 1 - Backend
cd server && npm run dev

# Terminal 2 - Frontend
cd client && npm run dev
```

The app will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

### AI Verification (Optional)

To enable AI-powered verification of proof submissions:

```bash
# Set your OpenAI API key
export OPENAI_API_KEY=your-api-key-here

# Then start the server
cd server && npm run dev
```

Without an API key, the app will still work but AI verification will be disabled.

## Usage

1. **Sign Up**: Create an account with a unique username
2. **Create a Challenge**: Set up a new challenge with:
   - Name and description
   - Frequency (daily, weekly, custom)
   - Duration (number of days)
   - Stakes/forfeit for losing
   - Verification method (self-policed or AI-verified)
3. **Invite Friends**: Add friends by their username
4. **Track Progress**: Submit proof daily and watch your progress
5. **Win!**: Complete the challenge and claim victory

## AI Verification Examples

The AI can verify:
- **Fitness app screenshots** (Strava, Nike Run Club, etc.): Extracts date, distance, and time
- **Gym photos**: Detects if you're actually in a gym environment
- **Activity completion**: Analyzes images for evidence of task completion

## License

MIT

