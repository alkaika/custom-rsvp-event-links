import React, { useEffect, useState } from 'react'

export default function AdminPanel({ onBack, dark }) {
  const [users, setUsers] = useState([])
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState('')

  const loadAdminData = async () => {
    setLoading(true)
    setError('')
    try {
      const [userRows, requestRows] = await Promise.all([
        window.VPAuth.adminListUsers(),
        window.VPAuth.adminListResetRequests()
      ])
      setUsers(userRows || [])
      setRequests(requestRows || [])
    } catch (loadError) {
      setError(loadError.message || 'Account information could not be loaded.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAdminData()
  }, [])

  const resetPassword = async event => {
    event.preventDefault()
    setFeedback('')
    setError('')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid account email address.')
      return
    }
    if (newPassword.length < 8) {
      setError('Choose a password with at least 8 characters.')
      return
    }
    setBusy(true)
    try {
      const result = await window.VPAuth.adminResetPassword(email.trim().toLowerCase(), newPassword)
      setFeedback(result?.emailSent
        ? `Password reset for ${result.email}; the new password was emailed.`
        : `Password reset for ${result?.email || email}; email delivery was not confirmed. Share the new password securely.`)
      setEmail('')
      setNewPassword('')
      await loadAdminData()
    } catch (resetError) {
      setError(resetError.message || 'The password could not be reset.')
    } finally {
      setBusy(false)
    }
  }

  const card = dark ? 'border-slate-800 bg-slate-900' : 'border-rose-100 bg-white shadow-sm'
  const input = dark
    ? 'border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-500 focus:border-rose-400'
    : 'border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:border-rose-400'

  return (
    <section className="mx-auto max-w-3xl">
      <button onClick={onBack} className={`mb-5 text-sm font-semibold ${dark ? 'text-rose-300' : 'text-rose-800'}`}>← Back to events</button>
      <div className="mb-7">
        <p className={`mb-2 text-xs font-bold uppercase tracking-[0.18em] ${dark ? 'text-rose-300' : 'text-rose-700'}`}>Owner tools</p>
        <h1 className="text-3xl font-bold tracking-tight">Account administration</h1>
        <p className={`mt-2 text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Review accounts and help visitors regain access.</p>
      </div>

      {error && <div role="alert" className={`mb-5 rounded-2xl border p-4 text-sm ${dark ? 'border-rose-900 bg-rose-950 text-rose-200' : 'border-rose-200 bg-rose-50 text-rose-800'}`}>{error}<button onClick={loadAdminData} className="ml-3 font-bold underline">Retry</button></div>}
      {feedback && <p role="status" className={`mb-5 rounded-2xl p-4 text-sm ${dark ? 'bg-emerald-950 text-emerald-200' : 'bg-emerald-50 text-emerald-800'}`}>{feedback}</p>}

      <div className="space-y-5">
        <section className={`rounded-3xl border p-5 sm:p-7 ${card}`}>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Password reset requests</h2>
              <p className={`mt-1 text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Requests are cleared automatically when a reset is fulfilled.</p>
            </div>
            <button onClick={loadAdminData} className={`rounded-full border px-3 py-2 text-xs font-bold ${dark ? 'border-slate-700 text-slate-200' : 'border-slate-200 text-slate-600'}`}>Refresh</button>
          </div>
          {loading ? (
            <div className="animate-pulse space-y-2"><div className={`h-12 rounded-xl ${dark ? 'bg-slate-800' : 'bg-slate-100'}`} /><div className={`h-12 rounded-xl ${dark ? 'bg-slate-800' : 'bg-slate-100'}`} /></div>
          ) : requests.length === 0 ? (
            <p className={`rounded-xl p-4 text-sm ${dark ? 'bg-slate-800 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>No pending password reset requests.</p>
          ) : (
            <ul className="space-y-2">
              {requests.map((request, index) => (
                <li key={request.id || request.email || index} className={`flex flex-wrap items-center justify-between gap-3 rounded-xl p-3 text-sm ${dark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                  <span className="font-semibold">{request.email || request.data?.email || 'Account email unavailable'}</span>
                  <span className={`text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{request.createdAt || request.data?.createdAt || 'Pending'}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={`rounded-3xl border p-5 sm:p-7 ${card}`}>
          <h2 className="text-lg font-bold">Reset a password</h2>
          <p className={`mt-1 text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>The new password is stored securely by the account service, never in event data.</p>
          <form onSubmit={resetPassword} className="mt-5 space-y-4">
            <label className="block text-sm font-semibold">
              Account email
              <input type="email" value={email} onChange={event => setEmail(event.target.value)} required className={`mt-2 w-full rounded-xl border px-4 py-3 outline-none ${input}`} placeholder="person@example.com" />
            </label>
            <label className="block text-sm font-semibold">
              New password
              <input type="password" value={newPassword} onChange={event => setNewPassword(event.target.value)} minLength={8} required className={`mt-2 w-full rounded-xl border px-4 py-3 outline-none ${input}`} placeholder="At least 8 characters" />
            </label>
            <button type="submit" disabled={busy} className="rounded-full bg-[#c49a4a] px-5 py-3 text-sm font-bold text-white shadow-sm disabled:opacity-60">{busy ? 'Resetting…' : 'Reset password'}</button>
          </form>
        </section>

        <section className={`rounded-3xl border p-5 sm:p-7 ${card}`}>
          <div className="mb-4">
            <h2 className="text-lg font-bold">Accounts</h2>
            <p className={`mt-1 text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Registered visitors on Gatherwell.</p>
          </div>
          {loading ? (
            <div className={`h-20 animate-pulse rounded-xl ${dark ? 'bg-slate-800' : 'bg-slate-100'}`} />
          ) : users.length === 0 ? (
            <p className={`rounded-xl p-4 text-sm ${dark ? 'bg-slate-800 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>No account records to display.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {users.map((account, index) => (
                <li key={account.id || account.email || index} className={`flex flex-wrap items-center justify-between gap-3 py-3 text-sm ${dark ? 'border-slate-800' : ''}`}>
                  <div>
                    <p className="font-semibold">{account.name || account.displayName || 'Gatherwell guest'}</p>
                    <p className={`mt-0.5 text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{account.email}</p>
                  </div>
                  {account.isOwner && <span className="rounded-full bg-amber-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-800">Owner</span>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </section>
  )
}
