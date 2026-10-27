import React, { useMemo, useState } from 'react'

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

export default function EventManager({ event, guests, loading, error, onRetry, onBack, onEdit, onCopy, dark }) {
  const [tab, setTab] = useState('Details')
  const tabs = ['Details', 'Guests', 'Messages']
  const attending = guests.filter(guest => guest.status === 'Attending').length
  const maybe = guests.filter(guest => guest.status === 'Maybe').length
  const declined = guests.filter(guest => guest.status === 'Not Attending').length
  const messages = useMemo(
    () => guests.filter(guest => guest.message && guest.message.trim()).sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0)),
    [guests]
  )
  const card = dark ? 'border-slate-800 bg-slate-900' : 'border-rose-100 bg-white shadow-sm'
  const muted = dark ? 'text-slate-400' : 'text-slate-500'

  return (
    <section className="mx-auto max-w-3xl">
      <button onClick={onBack} className={`mb-5 text-sm font-semibold ${dark ? 'text-rose-300' : 'text-rose-800'}`}>← All events</button>

      <div className={`overflow-hidden rounded-[2rem] border ${card}`}>
        <div className="bg-gradient-to-br from-rose-100 via-[#f6e9df] to-emerald-100 px-6 py-7 sm:px-8">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <span className="rounded-full bg-white/75 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-rose-900">{event.status || 'Draft'}</span>
            <span className="text-xs font-semibold text-slate-600">{prettyDate(event.dateTime)}</span>
          </div>
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-slate-900 sm:text-4xl">{event.title}</h1>
          <p className="mt-2 text-sm text-slate-700">{event.location}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <button onClick={onCopy} className="rounded-full bg-[#c49a4a] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#ae8435]">Copy event link</button>
            <button onClick={onEdit} className="rounded-full border border-white/70 bg-white/65 px-4 py-2.5 text-xs font-bold text-slate-800 transition hover:bg-white">Edit event</button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 px-5 py-5 sm:gap-3 sm:px-8">
          <Stat label="Attending" count={loading ? '—' : attending} color="text-emerald-700" dark={dark} />
          <Stat label="Maybe" count={loading ? '—' : maybe} color="text-amber-700" dark={dark} />
          <Stat label="Declined" count={loading ? '—' : declined} color="text-slate-500" dark={dark} />
        </div>

        <div className={`border-t px-5 sm:px-8 ${dark ? 'border-slate-800' : 'border-rose-50'}`}>
          <div className="flex gap-6 overflow-x-auto">
            {tabs.map(item => (
              <button key={item} onClick={() => setTab(item)} className={`border-b-2 py-4 text-sm font-bold transition ${tab === item ? (dark ? 'border-rose-400 text-rose-300' : 'border-rose-700 text-rose-800') : `border-transparent ${muted}`}`}>
                {item}{item === 'Guests' && !loading ? ` (${guests.length})` : item === 'Messages' && !loading ? ` (${messages.length})` : ''}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-72 px-5 py-6 sm:px-8">
          {tab === 'Details' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold">Event details</h2>
                <p className={`mt-2 whitespace-pre-wrap text-sm leading-6 ${muted}`}>{event.description || 'No description added yet.'}</p>
              </div>
              <div className={`rounded-2xl p-4 ${dark ? 'bg-slate-800' : 'bg-rose-50/70'}`}>
                <p className={`text-xs font-bold uppercase tracking-wider ${dark ? 'text-rose-300' : 'text-rose-800'}`}>RSVP deadline</p>
                <p className="mt-1 text-sm font-semibold">{event.rsvpDeadline ? prettyDate(event.rsvpDeadline) : 'No deadline set'}</p>
              </div>
              <div className={`rounded-2xl p-4 ${dark ? 'bg-slate-800' : 'bg-emerald-50/70'}`}>
                <p className={`text-xs font-bold uppercase tracking-wider ${dark ? 'text-emerald-300' : 'text-emerald-800'}`}>Shareable link</p>
                <p className="mt-1 break-all text-sm font-semibold">{typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}?event=${encodeURIComponent(event.customSlug)}` : event.customSlug}</p>
              </div>
            </div>
          )}

          {tab !== 'Details' && error && (
            <div className={`rounded-2xl border p-5 ${dark ? 'border-rose-900 bg-rose-950/40' : 'border-rose-200 bg-rose-50'}`}>
              <p className="text-sm">{error}</p>
              <button onClick={onRetry} className="mt-3 rounded-full bg-[#c49a4a] px-4 py-2 text-xs font-bold text-white">Retry</button>
            </div>
          )}

          {tab !== 'Details' && !error && loading && (
            <div className="space-y-3" aria-label="Loading guest responses">
              {[1, 2, 3].map(item => <div key={item} className={`h-16 animate-pulse rounded-2xl ${dark ? 'bg-slate-800' : 'bg-slate-100'}`} />)}
            </div>
          )}

          {tab === 'Guests' && !error && !loading && (
            guests.length === 0
              ? <Empty icon="♡" title="No replies just yet" detail="Once guests respond to your invitation, their RSVP status will show up here." dark={dark} />
              : <div className="space-y-3">
                {guests.slice().sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0)).map(guest => (
                  <article key={guest.id} className={`animate-[fadeIn_.35s_ease-out] rounded-2xl border p-4 transition ${dark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-100 bg-white'}`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold">{guest.guestName || 'Guest'}</h3>
                        <p className={`mt-1 text-xs ${muted}`}>{guest.submittedAt ? new Date(guest.submittedAt).toLocaleString() : 'Recently replied'}</p>
                      </div>
                      <StatusBadge status={guest.status} />
                    </div>
                    {guest.message && <p className={`mt-3 whitespace-pre-wrap border-t pt-3 text-sm leading-6 ${dark ? 'border-slate-800 text-slate-300' : 'border-slate-100 text-slate-600'}`}>{guest.message}</p>}
                  </article>
                ))}
              </div>
          )}

          {tab === 'Messages' && !error && !loading && (
            messages.length === 0
              ? <Empty icon="✉" title="No notes yet" detail="Guest messages and little notes will appear here as people reply." dark={dark} />
              : <div className="space-y-3">
                {messages.map(guest => (
                  <article key={guest.id} className={`animate-[fadeIn_.35s_ease-out] rounded-2xl border p-4 ${dark ? 'border-slate-800 bg-slate-950/50' : 'border-rose-100 bg-rose-50/40'}`}>
                    <p className="text-sm leading-6">{guest.message}</p>
                    <div className={`mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs ${dark ? 'border-slate-800 text-slate-400' : 'border-rose-100 text-slate-500'}`}>
                      <span>From <strong className={dark ? 'text-slate-200' : 'text-slate-700'}>{guest.guestName || 'Guest'}</strong></span>
                      <span>{guest.submittedAt ? new Date(guest.submittedAt).toLocaleDateString() : ''}</span>
                    </div>
                  </article>
                ))}
              </div>
          )}
        </div>
      </div>
    </section>
  )
}

function Stat({ label, count, color, dark }) {
  return (
    <div className={`rounded-2xl px-3 py-4 text-center ${dark ? 'bg-slate-800' : 'bg-[#fbf8f5]'}`}>
      <p className={`text-xl font-bold ${color}`}>{count}</p>
      <p className={`mt-1 text-[10px] font-bold uppercase tracking-wider ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</p>
    </div>
  )
}

function StatusBadge({ status }) {
  const styles = status === 'Attending'
    ? 'bg-emerald-50 text-emerald-800'
    : status === 'Maybe'
      ? 'bg-amber-50 text-amber-800'
      : 'bg-slate-100 text-slate-600'
  return <span className={`rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${styles}`}>{status || 'No status'}</span>
}

function Empty({ icon, title, detail, dark }) {
  return (
    <div className="py-10 text-center">
      <span className={`mx-auto flex h-12 w-12 items-center justify-center rounded-2xl text-xl ${dark ? 'bg-slate-800 text-rose-300' : 'bg-rose-50 text-rose-800'}`}>{icon}</span>
      <h2 className="mt-4 font-bold">{title}</h2>
      <p className={`mx-auto mt-2 max-w-sm text-sm leading-6 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{detail}</p>
    </div>
  )
}
