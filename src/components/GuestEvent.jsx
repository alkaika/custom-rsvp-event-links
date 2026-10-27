import React, { useState } from 'react'

const prettyDate = value => {
  if (!value) return 'Date to be announced'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date to be announced'
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(date)
}

const statusOptions = [
  { value: 'Attending', label: 'Joyfully attending', icon: '✦' },
  { value: 'Maybe', label: 'Maybe', icon: '◌' },
  { value: 'Not Attending', label: 'Unable to attend', icon: '♡' }
]

export default function GuestEvent({ event, loading, error, onRetry, onSubmit, dark, onTheme, onNotice }) {
  const [guestName, setGuestName] = useState('')
  const [status, setStatus] = useState('Attending')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState(false)

  const deadlinePassed = Boolean(event?.rsvpDeadline && new Date(event.rsvpDeadline).getTime() < Date.now())
  const isUnavailable = event && (event.status === 'Cancelled' || event.status === 'Draft')
  const input = dark
    ? 'border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-500 focus:border-rose-400'
    : 'border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:border-rose-400'
  const card = dark ? 'border-slate-800 bg-slate-900' : 'border-rose-100 bg-white shadow-sm'

  const submit = async eventObject => {
    eventObject.preventDefault()
    setFormError('')
    if (guestName.trim().length < 2) {
      setFormError('Please enter your name so the host knows who is replying.')
      return
    }
    if (deadlinePassed || isUnavailable) return
    setBusy(true)
    try {
      await onSubmit({
        guestName: guestName.trim(),
        status,
        message: message.trim()
      })
      setSuccess(true)
      setMessage('')
      if (navigator.vibrate) navigator.vibrate(18)
      onNotice?.('Your RSVP has been sent. Thank you!')
    } catch (submitError) {
      setFormError(submitError.message || 'We could not send your RSVP. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pb-12 pt-5 sm:px-6 sm:pt-7">
      <header className="mb-8 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2.5" aria-label="Gatherwell home">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-lg font-black text-rose-800">g</span>
          <span className="text-sm font-bold tracking-tight">gatherwell</span>
        </a>
        <button onClick={onTheme} className={`rounded-full px-3 py-2 text-xs font-semibold ${dark ? 'bg-slate-800 text-slate-200' : 'bg-white text-slate-600 shadow-sm'}`}>{dark ? '☀ Light' : '☾ Night'}</button>
      </header>

      {loading && (
        <div className={`animate-pulse rounded-[2rem] border p-8 ${card}`} aria-label="Loading event">
          <div className="mb-5 h-3 w-24 rounded-full bg-rose-100" />
          <div className="mb-4 h-8 w-3/4 rounded-full bg-slate-100" />
          <div className="mb-2 h-4 w-1/2 rounded-full bg-slate-100" />
          <div className="mt-10 h-56 rounded-2xl bg-slate-100" />
        </div>
      )}

      {!loading && error && (
        <section className={`rounded-3xl border p-8 text-center ${card}`}>
          <span className="text-3xl">☁</span>
          <h1 className="mt-4 text-xl font-bold">This invitation is taking a little while.</h1>
          <p className={`mt-2 text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{error}</p>
          <button onClick={onRetry} className="mt-5 rounded-full bg-[#c49a4a] px-5 py-2.5 text-sm font-bold text-white">Try again</button>
        </section>
      )}

      {!loading && !error && !event && (
        <section className={`rounded-3xl border p-8 text-center ${card}`}>
          <span className="text-3xl">✿</span>
          <h1 className="mt-4 text-xl font-bold">We couldn’t find this invitation.</h1>
          <p className={`mt-2 text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Double-check the link with your host and try again.</p>
        </section>
      )}

      {!loading && !error && event && (
        <>
          <section className={`overflow-hidden rounded-[2rem] border ${card}`}>
            <div className="relative overflow-hidden bg-gradient-to-br from-rose-100 via-[#f6e9df] to-emerald-100 px-6 py-10 sm:px-10 sm:py-14">
              <div className="absolute -right-8 -top-12 h-44 w-44 rounded-full border-[24px] border-white/25" />
              <div className="absolute -bottom-16 right-24 h-32 w-32 rounded-full bg-[#d9bd79]/20" />
              <div className="relative">
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-rose-800">You’re invited</p>
                <h1 className="max-w-2xl text-3xl font-bold leading-tight tracking-tight text-slate-900 sm:text-5xl">{event.title}</h1>
                <p className="mt-4 max-w-xl text-sm leading-6 text-slate-700 sm:text-base">{event.description || 'We would love to celebrate together. Please let us know if you can make it.'}</p>
              </div>
            </div>
            <div className="grid gap-4 px-6 py-6 sm:grid-cols-2 sm:px-10">
              <div className={`rounded-2xl p-4 ${dark ? 'bg-slate-800' : 'bg-rose-50/80'}`}>
                <p className={`mb-1 text-[10px] font-bold uppercase tracking-[0.16em] ${dark ? 'text-rose-300' : 'text-rose-800'}`}>When</p>
                <p className="text-sm font-semibold leading-6">{prettyDate(event.dateTime)}</p>
              </div>
              <div className={`rounded-2xl p-4 ${dark ? 'bg-slate-800' : 'bg-emerald-50/70'}`}>
                <p className={`mb-1 text-[10px] font-bold uppercase tracking-[0.16em] ${dark ? 'text-emerald-300' : 'text-emerald-800'}`}>Where</p>
                <p className="text-sm font-semibold leading-6">{event.location || 'Location to be announced'}</p>
              </div>
            </div>
          </section>

          <section className={`mt-5 rounded-[2rem] border p-6 sm:p-8 ${card}`}>
            {success ? (
              <div className="py-5 text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-800">✓</span>
                <h2 className="mt-4 text-2xl font-bold">You’re on the list.</h2>
                <p className={`mt-2 text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Your reply was shared with the host. Need to change something? Send the host a quick note.</p>
                <button onClick={() => setSuccess(false)} className={`mt-5 text-sm font-bold underline underline-offset-4 ${dark ? 'text-rose-300' : 'text-rose-800'}`}>Update my RSVP</button>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <p className={`mb-2 text-xs font-bold uppercase tracking-[0.18em] ${dark ? 'text-rose-300' : 'text-rose-700'}`}>Kindly reply</p>
                  <h2 className="text-2xl font-bold">Will you be there?</h2>
                  <p className={`mt-2 text-sm ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Let the host know how to save you a seat.</p>
                </div>

                {isUnavailable && (
                  <p className={`mb-5 rounded-xl p-4 text-sm ${dark ? 'bg-amber-950 text-amber-200' : 'bg-amber-50 text-amber-900'}`}>{event.status === 'Cancelled' ? 'This event has been cancelled. Please contact the host if you have questions.' : 'This invitation is not open for responses yet.'}</p>
                )}
                {deadlinePassed && !isUnavailable && (
                  <p className={`mb-5 rounded-xl p-4 text-sm ${dark ? 'bg-amber-950 text-amber-200' : 'bg-amber-50 text-amber-900'}`}>The RSVP deadline has passed. Please contact the host if you would still like to attend.</p>
                )}

                <form onSubmit={submit} className="space-y-5">
                  <label className="block text-sm font-semibold">
                    Your name
                    <input value={guestName} onChange={eventObject => setGuestName(eventObject.target.value)} maxLength={100} required className={`mt-2 w-full rounded-xl border px-4 py-3 outline-none transition ${input}`} placeholder="First and last name" />
                  </label>

                  <fieldset>
                    <legend className="mb-3 text-sm font-semibold">Your reply</legend>
                    <div className="space-y-2">
                      {statusOptions.map(option => (
                        <label key={option.value} className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition ${status === option.value ? (dark ? 'border-rose-400 bg-rose-950/50' : 'border-rose-300 bg-rose-50') : (dark ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-50')}`}>
                          <input type="radio" name="rsvpStatus" value={option.value} checked={status === option.value} onChange={() => setStatus(option.value)} className="accent-rose-700" />
                          <span className={`text-lg ${dark ? 'text-rose-300' : 'text-rose-800'}`}>{option.icon}</span>
                          <span className="text-sm font-semibold">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <label className="block text-sm font-semibold">
                    A note for the host <span className="font-normal text-slate-400">· optional</span>
                    <textarea value={message} onChange={eventObject => setMessage(eventObject.target.value)} maxLength={500} rows={3} className={`mt-2 w-full resize-y rounded-xl border px-4 py-3 outline-none transition ${input}`} placeholder="A warm hello, a dietary note, or anything you'd like them to know." />
                    <span className="mt-1 block text-right text-xs text-slate-400">{message.length}/500</span>
                  </label>

                  {formError && <p role="alert" className={`rounded-xl px-4 py-3 text-sm ${dark ? 'bg-rose-950 text-rose-200' : 'bg-rose-50 text-rose-800'}`}>{formError}</p>}
                  <button type="submit" disabled={busy || deadlinePassed || isUnavailable} className="w-full rounded-full bg-[#c49a4a] px-5 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-[#ae8435] disabled:cursor-not-allowed disabled:opacity-50">{busy ? 'Sending your reply…' : 'Send my RSVP'}</button>
                </form>
              </>
            )}
          </section>
          <p className={`mt-6 text-center text-xs ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Made with care using Gatherwell</p>
        </>
      )}
    </div>
  )
}
