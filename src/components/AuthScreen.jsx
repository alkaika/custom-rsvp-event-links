import React, { useState } from 'react'

export default function AuthScreen({ onAuthenticated, error, onClearError, dark, onTheme }) {
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState('')
  const [message, setMessage] = useState('')

  const submit = async event => {
    event.preventDefault()
    setFormError('')
    setMessage('')
    onClearError?.()
    const cleanEmail = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setFormError('Enter a valid email address to continue.')
      return
    }
    if (password.length < 8) {
      setFormError('Your password must be at least 8 characters.')
      return
    }
    if (mode === 'register' && name.trim().length < 2) {
      setFormError('Please enter your name.')
      return
    }
    setBusy(true)
    try {
      if (!window.VPAuth) throw new Error('Sign-in is temporarily unavailable. Please try again.')
      const result = mode === 'register'
        ? await window.VPAuth.register(cleanEmail, password, name.trim())
        : await window.VPAuth.login(cleanEmail, password)
      onAuthenticated(result)
    } catch (submitError) {
      setFormError(submitError.message || 'We could not sign you in. Please check your details and try again.')
    } finally {
      setBusy(false)
    }
  }

  const googleSignIn = async () => {
    setFormError('')
    setMessage('')
    setBusy(true)
    try {
      const url = await window.VPAuth.socialUrl('google')
      window.location.href = url
    } catch (socialError) {
      setFormError(socialError.message || 'Google sign-in is available from your published event workspace.')
      setBusy(false)
    }
  }

  const forgotPassword = async () => {
    setFormError('')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFormError('Enter your email address first, then choose “Forgot password?”.')
      return
    }
    setBusy(true)
    try {
      await window.VPAuth.requestReset(email.trim().toLowerCase())
    } catch {
      // Always give a neutral response, whether or not the account exists.
    } finally {
      setMessage('If an account exists for that address, you’ll receive instructions shortly.')
      setBusy(false)
    }
  }

  const panel = dark ? 'border-slate-800 bg-slate-900 text-slate-100' : 'border-rose-100 bg-white text-slate-800'
  const muted = dark ? 'text-slate-400' : 'text-slate-500'
  const input = dark
    ? 'border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-500 focus:border-rose-400'
    : 'border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:border-rose-400'

  return (
    <div className="flex min-h-screen flex-col px-4 py-6">
      <div className="mx-auto flex w-full max-w-5xl justify-end">
        <button onClick={onTheme} className={`rounded-full px-4 py-2 text-xs font-semibold ${dark ? 'bg-slate-800 text-slate-200' : 'bg-white text-slate-600 shadow-sm'}`}>{dark ? '☀ Light' : '☾ Night'}</button>
      </div>
      <div className="flex flex-1 items-center justify-center py-8">
        <section className={`w-full max-w-md rounded-[2rem] border p-6 shadow-xl shadow-rose-950/5 sm:p-9 ${panel}`}>
          <div className="mb-7 text-center">
            <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-2xl font-black text-rose-800">g</span>
            <p className={`mb-2 text-xs font-bold uppercase tracking-[0.2em] ${dark ? 'text-rose-300' : 'text-rose-700'}`}>Gatherwell</p>
            <h1 className="text-2xl font-bold tracking-tight">{mode === 'register' ? 'Make a little room for joy.' : 'Welcome back.'}</h1>
            <p className={`mt-2 text-sm leading-6 ${muted}`}>Beautifully simple invitations and RSVPs, all in one place.</p>
          </div>

          <button onClick={googleSignIn} disabled={busy} className={`mb-5 flex w-full items-center justify-center gap-3 rounded-2xl border px-4 py-3 text-sm font-bold transition disabled:opacity-60 ${dark ? 'border-slate-700 bg-slate-800 hover:bg-slate-700' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
            <span aria-hidden="true" className="text-lg font-black text-[#4285F4]">G</span>
            Continue with Google
          </button>

          <div className="mb-5 flex items-center gap-3">
            <span className={`h-px flex-1 ${dark ? 'bg-slate-700' : 'bg-slate-200'}`} />
            <span className={`text-[10px] font-bold uppercase tracking-[0.18em] ${muted}`}>or use email</span>
            <span className={`h-px flex-1 ${dark ? 'bg-slate-700' : 'bg-slate-200'}`} />
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === 'register' && (
              <label className="block text-sm font-semibold">
                Your name
                <input value={name} onChange={event => setName(event.target.value)} autoComplete="name" maxLength={80} className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none transition ${input}`} placeholder="Jordan Lee" />
              </label>
            )}
            <label className="block text-sm font-semibold">
              Email address
              <input type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" required className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none transition ${input}`} placeholder="you@example.com" />
            </label>
            <label className="block text-sm font-semibold">
              Password
              <input type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} minLength={8} required className={`mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none transition ${input}`} placeholder="At least 8 characters" />
            </label>
            {mode === 'login' && (
              <div className="text-right">
                <button type="button" onClick={forgotPassword} disabled={busy} className={`text-xs font-semibold underline underline-offset-4 ${dark ? 'text-rose-300' : 'text-rose-800'}`}>Forgot password?</button>
              </div>
            )}
            {(formError || error) && (
              <p role="alert" className={`rounded-xl px-4 py-3 text-sm ${dark ? 'bg-rose-950 text-rose-200' : 'bg-rose-50 text-rose-800'}`}>{formError || error}</p>
            )}
            {message && <p role="status" className={`rounded-xl px-4 py-3 text-sm ${dark ? 'bg-emerald-950 text-emerald-200' : 'bg-emerald-50 text-emerald-800'}`}>{message}</p>}
            <button type="submit" disabled={busy} className="w-full rounded-full bg-[#c49a4a] px-5 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-[#ae8435] disabled:cursor-not-allowed disabled:opacity-60">
              {busy ? 'One moment…' : mode === 'register' ? 'Create your account' : 'Sign in'}
            </button>
          </form>

          <p className={`mt-6 text-center text-sm ${muted}`}>
            {mode === 'register' ? 'Already have an account?' : 'New to Gatherwell?'}{' '}
            <button onClick={() => { setMode(mode === 'register' ? 'login' : 'register'); setFormError(''); setMessage('') }} className={`font-bold ${dark ? 'text-rose-300' : 'text-rose-800'}`}>
              {mode === 'register' ? 'Sign in' : 'Create an account'}
            </button>
          </p>
        </section>
      </div>
    </div>
  )
}
