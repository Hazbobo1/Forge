import { Link } from 'react-router-dom'
import { Flame, Users, Trophy, Shield, Zap, Target, ArrowRight, CheckCircle } from 'lucide-react'

export default function Landing() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        {/* Floating background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-ember-500/10 rounded-full blur-3xl float-animation"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-ember-600/8 rounded-full blur-3xl float-animation" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-ember-500/5 rounded-full blur-3xl"></div>
        </div>

        {/* Navigation */}
        <nav className="relative z-10 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-ember-500 to-ember-600 rounded-xl flex items-center justify-center">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold font-display tracking-tight">Forge</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="btn-ghost">Log in</Link>
            <Link to="/signup" className="btn-primary flex items-center gap-2">
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-ember-500/10 border border-ember-500/20 mb-8 animate-fade-in">
              <Zap className="w-4 h-4 text-ember-400" />
              <span className="text-sm text-ember-300 font-medium">Challenge yourself. Challenge your friends.</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold font-display leading-tight mb-6 animate-slide-up">
              Turn Goals Into
              <span className="block gradient-text">Shared Victories</span>
            </h1>
            
            <p className="text-xl text-midnight-300 max-w-2xl mx-auto mb-10 animate-slide-up delay-100">
              Create challenges with friends, set real stakes, and let AI keep everyone honest. 
              No more excuses—just results.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up delay-200">
              <Link to="/signup" className="btn-primary text-lg px-8 py-4 flex items-center gap-2">
                Start Your First Challenge <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/login" className="btn-secondary text-lg px-8 py-4">
                I Have an Account
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap items-center justify-center gap-12 mt-20 animate-fade-in delay-300">
            {[
              { value: '10K+', label: 'Challenges Completed' },
              { value: '94%', label: 'Success Rate' },
              { value: '50K+', label: 'Active Users' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl font-bold font-display gradient-text">{stat.value}</div>
                <div className="text-midnight-400 text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold font-display mb-4">
              How <span className="gradient-text">Forge</span> Works
            </h2>
            <p className="text-midnight-400 text-lg max-w-2xl mx-auto">
              Simple, powerful, and designed to help you actually achieve your goals.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Users,
                title: 'Create or Join',
                description: 'Start a challenge and invite friends by username, or accept an invite to join an existing one.',
                color: 'from-blue-500 to-cyan-500'
              },
              {
                icon: Target,
                title: 'Set the Stakes',
                description: 'Define the challenge, duration, and what\'s at stake. Real accountability drives real results.',
                color: 'from-ember-500 to-amber-500'
              },
              {
                icon: Shield,
                title: 'AI Verification',
                description: 'Upload proof and let our AI verify your progress. Screenshots, photos—we\'ll know if you\'re honest.',
                color: 'from-purple-500 to-pink-500'
              }
            ].map((feature, i) => (
              <div 
                key={i} 
                className="card-hover group"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 
                                 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold font-display mb-3">{feature.title}</h3>
                <p className="text-midnight-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Verification Section */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-ember-500/5 to-transparent"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="badge-ember mb-6">
                <Shield className="w-4 h-4 mr-2" />
                AI-Powered Verification
              </div>
              <h2 className="text-4xl md:text-5xl font-bold font-display mb-6">
                No Cheating.
                <span className="block gradient-text">Just Progress.</span>
              </h2>
              <p className="text-midnight-300 text-lg mb-8 leading-relaxed">
                Our AI analyzes your proof submissions in real-time. Upload a Strava screenshot, 
                and we'll extract the date, distance, and time. Take a gym selfie, and we'll 
                confirm you're actually there.
              </p>
              
              <ul className="space-y-4">
                {[
                  'Automatic screenshot analysis',
                  'Location & environment detection',
                  'Activity verification from fitness apps',
                  'Tamper detection for edited images'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-midnight-200">
                    <CheckCircle className="w-5 h-5 text-ember-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="relative">
              <div className="card p-8 glow-subtle">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-bold">Proof Verified</div>
                    <div className="text-midnight-400 text-sm">Just now</div>
                  </div>
                </div>
                
                <div className="bg-midnight-950/50 rounded-xl p-4 mb-4">
                  <div className="text-sm text-midnight-400 mb-2">AI Analysis</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-midnight-300">Activity Type</span>
                      <span className="text-white font-medium">Running</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-midnight-300">Distance</span>
                      <span className="text-white font-medium">5.2 km</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-midnight-300">Date Verified</span>
                      <span className="text-emerald-400 font-medium">✓ Today</span>
                    </div>
                  </div>
                </div>
                
                <div className="badge-success w-full justify-center py-2">
                  Challenge requirement met!
                </div>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-ember-500/20 rounded-full blur-2xl"></div>
              <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="card p-12 glow-ember relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-ember-500/10 to-transparent"></div>
            
            <div className="relative z-10">
              <Trophy className="w-16 h-16 text-ember-500 mx-auto mb-6" />
              <h2 className="text-4xl md:text-5xl font-bold font-display mb-4">
                Ready to Start Winning?
              </h2>
              <p className="text-midnight-300 text-lg mb-8 max-w-xl mx-auto">
                Join thousands of people who are crushing their goals with friends. 
                Your next victory starts here.
              </p>
              <Link to="/signup" className="btn-primary text-lg px-10 py-4 inline-flex items-center gap-2">
                Create Free Account <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-midnight-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-ember-500 to-ember-600 rounded-lg flex items-center justify-center">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold font-display">Forge</span>
          </div>
          <div className="text-midnight-500 text-sm">
            © 2024 Forge. Challenge your limits.
          </div>
        </div>
      </footer>
    </div>
  )
}

