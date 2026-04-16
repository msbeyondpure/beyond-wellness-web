import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Auth() {
  const [tab, setTab] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)
    try {
      if (tab === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) setError(error.message)
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) setError(error.message)
        else setMessage('Check your email to confirm your account.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-white tracking-tight">Requiem</h1>
          <p className="text-gray-500 text-sm mt-1">Beyond Wellness Tracker</p>
        </div>

        {/* Card */}
        <div className="bg-brand-light rounded-lg border border-white/5 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-white/5">
            {['signin', 'signup'].map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(''); setMessage('') }}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  tab === t ? 'text-brand-accent border-b-2 border-brand-accent' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {t === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="text-red-400 text-sm bg-red-500/10 rounded px-3 py-2">{error}</div>
            )}
            {message && (
              <div className="text-brand-success text-sm bg-brand-success/10 rounded px-3 py-2">{message}</div>
            )}

            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full bg-brand-dark border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-brand-accent/50 focus:ring-1 focus:ring-brand-accent/20 transition-all"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-brand-dark border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-brand-accent/50 focus:ring-1 focus:ring-brand-accent/20 transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-accent hover:bg-brand-accent-hover text-white rounded py-2.5 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? 'Please wait...' : (tab === 'signin' ? 'Sign In' : 'Create Account')}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
