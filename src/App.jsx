import React, { useCallback, useEffect, useMemo, useState } from 'react'
import AuthScreen from './components/AuthScreen.jsx'
import EventForm from './components/EventForm.jsx'
import GuestEvent from './components/GuestEvent.jsx'
import EventManager from './components/EventManager.jsx'
import AdminPanel from './components/AdminPanel.jsx'

const waitForApi = async (name, attempts = 40) => {
  for (let i = 0; i < attempts; i += 1) {
    if (window[name]) return window[name]
    await new Promise(resolve => setTimeout(resolve, 125))
  }
  throw new Error('The app service is taking longer than expected. Please try again.')
}

const readPreference = (key, fallback) => {
  try {
    return window.localStorage.getItem(key) || fallback
  } catch {
    return fallback
  }
}

const savePreference = (key, value) => {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // The app remains fully usable when browser storage is unavailable.
  }
}

const getGuestSlug = () => {
  try {
    const params = new URLSearchParams(window.location.search)
    const fromQuery = params.get('event')
    if (fromQuery) return fromQuery
    const match = window.location.pathname.match(/\/e\/([^/]+)/)
    return match ? decodeURIComponent(match[1]) : ''
  } catch {
    return ''
  }
}

const makeId = () => {
  try {
    return window.crypto.randomUUID()
  } catch {
    return `gw-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  }
}

const shareUrl = slug => {
  const url = new URL(window.location.href)
  url.search = ''
  url.hash = ''
  url.searchParams.set('event', slug)
  return url.toString()
}

const formatDate = value => {
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

export default function App() {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [authError, setAuthError] = useState('')
  const [events, setEvents] = useState([])
  const [eventsLoading, setEventsLoading] = useState(true)
  const [eventsError, setEventsError] = useState('')
  const [rsvps, setRsvps] = useState([])
  const [rsvpsLoading, setRsvpsLoading] = useState(false)
  const [rsvpsError, setRsvpsError] = useState('')
  const [guestSlug] = useState(getGuestSlug)
  const [page, setPage] = useState('dashboard')
  const [activeEvent, setActiveEvent] = useState(null)
  const [theme, setTheme] = useState(() => readPreference('vibePilot_theme', 'light'))
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let active = true
    const bootstrap = async () => {
      try {
        const auth = await waitForApi('VPAuth')
        const [meResult, socialResult] = await Promise.allSettled([
          auth.me(),
          typeof auth.socialComplete === 'function' ? auth.socialComplete() : Promise.resolve(null)
        ])
        if (!active) return
        const currentUser = meResult.status === 'fulfilled' ? meResult.value : null
        const socialUser = socialResult.status === 'fulfilled' && socialResult.value && !socialResult.value.error
          ? socialResult.value
          : null
        setUser(socialUser || currentUser || null)
        if (socialResult.status === 'fulfilled' && socialResult.value?.error) {
          setAuthError(socialResult.value.error)
        } else if (meResult.status === 'rejected') {
          setAuthError('We could not verify your session. Please sign in to continue.')
        }
      } catch (error) {
        if (active) setAuthError(error.message || 'Sign-in is temporarily unavailable.')
      } finally {
        if (active) setAuthLoading(false)
      }
    }
    bootstrap()
    return () => {
      active = false
    }
  }, [])

  const refreshEvents = useCallback(async () => {
    setEventsLoading(true)
    setEventsError('')
    try {
      const dataApi = await waitForApi('VPData')
      const rows = await dataApi.list('events')
      setEvents((rows || []).map(row => ({ ...(row.data || {}), id: row.id })))
    } catch (error) {
      setEventsError(error.message || 'We could not load events right now.')
    } finally {
      setEventsLoading(false)
    }
  }, [])

  const refreshRsvps = useCallback(async () => {
    setRsvpsLoading(true)
    setRsvpsError('')
    try {
      const dataApi = await waitForApi('VPData')
      const rows = await dataApi.list('rsvps')
      setRsvps((rows || []).map(row => ({ ...(row.data || {}), id: row.id })))
    } catch (error) {
      setRsvpsError(error.message || 'We could not load guest responses right now.')
    } finally {
      setRsvpsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authLoading) return
    refreshEvents()
    if (user) refreshRsvps()
  }, [authLoading, user, refreshEvents, refreshRsvps])

  useEffect(() => {
    savePreference('vibePilot_theme', theme)
  }, [theme])

  useEffect(() => {
    if (guestSlug) return
    savePreference('vibePilot_last_view', page)
  }, [guestSlug, page])

  useEffect(() => {
    if (notice === '') return undefined
    const timer = setTimeout(() => setNotice(''), 3200)
    return () => clearTimeout(timer)
  }, [notice])

  const myEvents = useMemo(
    () => user ? events.filter(event => event.creatorId === user.id) : [],
    [events, user]
  )

  const eventBySlug = useMemo(
    () => guestSlug ? events.find(event => event.customSlug === guestSlug) : null,
    [events, guestSlug]
  )

  const eventCounts = useCallback(eventId => {
    const rows = rsvps.filter(row => row.eventId === eventId)
    return {
      total: rows.length,
      attending: rows.filter(row => row.status === 'Attending').length,
      maybe: rows.filter(row => row.status === 'Maybe').length,
      declined: rows.filter(row => row.status === 'Not Attending').length
    }
  }, [rsvps])

  const handleAuthenticated = nextUser => {
    setUser(nextUser)
    setAuthError('')
    setPage('dashboard')
    setNotice(`Welcome${nextUser?.name ? `, ${nextUser.name.split(' ')[0]}` : ''}!`)
  }

  const handleLogout = async () => {
    try {
      const auth = await waitForApi('VPAuth')
      await auth.logout()
      setUser(null)
      setActiveEvent(null)
      setPage('dashboard')
      setNotice('You have been signed out.')
    } catch (error) {
      setNotice(error.message || 'Could not sign out. Please try again.')
    }
  }

  const handleCreate = () => {
    setActiveEvent(null)
    setPage('create')
  }

  const handleManage = event => {
    setActiveEvent(event)
    setPage('manage')
    refreshRsvps()
  }

  const handleSaveEvent = async values => {
    const duplicate = events.some(event =>
      event.customSlug === values.customSlug && (!activeEvent || event.id !== activeEvent.id)
    )
    if (duplicate) throw new Error('That event link is already in use. Please choose another.')
    const dataApi = await waitForApi('VPData')
    if (activeEvent) {
      await dataApi.update('events', activeEvent.id, {
        ...activeEvent,
        ...values,
        eventId: activeEvent.eventId || activeEvent.id,
        creatorId: activeEvent.creatorId || user.id
      })
      setNotice('Your event details have been saved.')
    } else {
      const eventId = makeId()
      await dataApi.add('events', {
        ...values,
        eventId,
        creatorId: user.id,
        createdAt: new Date().toISOString()
      }, eventId)
      setNotice('Your event is ready to share.')
    }
    await refreshEvents()
    setPage('dashboard')
    setActiveEvent(null)
  }

  const handleGuestRsvp = async values => {
    const dataApi = await waitForApi('VPData')
    const rsvpId = makeId()
    await dataApi.add('rsvps', {
      ...values,
      rsvpId,
      eventId: eventBySlug.eventId || eventBySlug.id,
      submittedAt: new Date().toISOString()
    }, rsvpId)
    if (user) refreshRsvps()
  }

  const handleCopy = async event => {
    const url = shareUrl(event.customSlug)
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url)
      } else {
        const input = document.createElement('textarea')
        input.value = url
        input.setAttribute('readonly', '')
        input.style.position = 'fixed'
        input.style.opacity = '0'
        document.body.appendChild(input)
        input.select()
        document.execCommand('copy')
        input.remove()
      }
      setNotice('Event link copied to your clipboard.')
    } catch {
      setNotice(`Share this link: ${url}`)
    }
  }

  const isDark = theme === 'night'
  const pageShell = isDark
    ? 'min-h-screen bg-slate-950 text-slate-100'
    : 'min-h-screen bg-[#fbf8f5] text-slate-800'

  if (guestSlug) {
    return (
      <main className={pageShell}>
        <GuestEvent
          event={eventBySlug}
          loading={eventsLoading}
          error={eventsError}
          onRetry={refreshEvents}
          onSubmit={handleGuestRsvp}
          dark={isDark}
          onTheme={() => setTheme(isDark ? 'light' : 'night')}
          onNotice={setNotice}
        />
        {notice && <Toast message={notice} dark={isDark} />}
      </main>
    )
  }

  if (authLoading) {
    return (
      <main className={`${pageShell} flex min-h-screen items-center justify-center px-5`}>
        <div className="w-full max-w-sm animate-pulse rounded-3xl border border-rose-100 bg-white p-8 shadow-sm">
          <div className="mx-auto mb-5 h-12 w-12 rounded-2xl bg-rose-100" />
          <div className="mx-auto mb-3 h-5 w-40 rounded-full bg-slate-100" />
          <div className="mx-auto h-3 w-56 rounded-full bg-slate-100" />
        </div>
      </main>
    )
  }

  if (!user) {
    return (
      <main className={pageShell}>
        <AuthScreen
          onAuthenticated={handleAuthenticated}
          error={authError}
          onClearError={() => setAuthError('')}
          dark={isDark}
          onTheme={() => setTheme(isDark ? 'light' : 'night')}
        />
      </main>
    )
  }

  const header = (
    <header className={`sticky top-0 z-20 border-b backdrop-blur-xl ${isDark ? 'border-slate-800 bg-slate-950/90' : 'border-rose-100 bg-[#fbf8f5]/90'}`}>
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <button className="flex items-center gap-3 text-left" onClick={() => { setPage('dashboard'); setActiveEvent(null) }} aria-label="Go to Gatherwell dashboard">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-100 text-lg font-black text-rose-800">g</span>
          <span>
            <span className="block text-lg font-bold tracking-tight">gatherwell</span>
            <span className={`hidden text-xs sm:block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Make room for a good gathering</span>
          </span>
        </button>
        <div className="flex items-center gap-2">
          <button onClick={() => setTheme(isDark ? 'light' : 'night')} className={`rounded-full px-3 py-2 text-xs font-semibold transition ${isDark ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-white text-slate-600 shadow-sm hover:bg-rose-50'}`} aria-label="Toggle color theme">
            {isDark ? '☀ Light' : '☾ Night'}
          </button>
          <button onClick={handleLogout} className={`rounded-full px-3 py-2 text-xs font-semibold transition ${isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-rose-50'}`}>Sign out</button>
        </div>
      </div>
    </header>
  )

  return (
    <main className={pageShell}>
      {header}
      <div className="mx-auto max-w-5xl px-4 pb-28 pt-8 sm:px-6 sm:pt-10">
        {page === 'dashboard' && (
          <>
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className={`mb-2 text-xs font-bold uppercase tracking-[0.18em] ${isDark ? 'text-rose-300' : 'text-rose-700'}`}>Your celebrations</p>
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Good things are worth gathering for.</h1>
                <p className={`mt-2 max-w-xl text-sm leading-6 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Create a thoughtful invitation, share one simple link, and keep every reply in one place.</p>
              </div>
              <button onClick={handleCreate} className="hidden rounded-full bg-[#c49a4a] px-5 py-3 text-sm font-bold text-white shadow-md shadow-amber-900/10 transition hover:bg-[#ae8435] sm:inline-flex">＋ Create an event</button>
            </div>

            {eventsError && (
              <div className={`mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 text-sm ${isDark ? 'border-rose-900 bg-rose-950/40 text-rose-200' : 'border-rose-200 bg-rose-50 text-rose-800'}`}>
                <span>{eventsError}</span>
                <button onClick={refreshEvents} className="rounded-full bg-white/80 px-4 py-2 font-bold text-rose-800">Retry</button>
              </div>
            )}

            {eventsLoading ? (
              <div className="space-y-4" aria-label="Loading your events">
                {[1, 2, 3].map(item => <div key={item} className={`h-40 animate-pulse rounded-3xl ${isDark ? 'bg-slate-900' : 'bg-white shadow-sm'}`} />)}
              </div>
            ) : myEvents.length === 0 ? (
              <section className={`rounded-[2rem] border px-6 py-12 text-center sm:px-12 ${isDark ? 'border-slate-800 bg-slate-900/70' : 'border-rose-100 bg-white shadow-sm'}`}>
                <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-rose-50 text-4xl">✿</div>
                <p className={`mb-2 text-xs font-bold uppercase tracking-[0.18em] ${isDark ? 'text-rose-300' : 'text-rose-700'}`}>A little something to celebrate</p>
                <h2 className="text-2xl font-bold">Your first event starts here.</h2>
                <p className={`mx-auto mt-3 max-w-md text-sm leading-6 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Weddings, birthdays, graduations, just-because dinners — make an invitation that feels like you.</p>
                <button onClick={handleCreate} className="mt-7 rounded-full bg-[#c49a4a] px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#ae8435]">Create your first event</button>
              </section>
            ) : (
              <div className="space-y-4">
                {myEvents
                  .slice()
                  .sort((a, b) => new Date(a.dateTime || 0) - new Date(b.dateTime || 0))
                  .map(event => {
                    const counts = eventCounts(event.eventId || event.id)
                    const badgeStyle = event.status === 'Published'
                      ? 'bg-emerald-50 text-emerald-800'
                      : event.status === 'Cancelled'
                        ? 'bg-slate-100 text-slate-600'
                        : 'bg-amber-50 text-amber-800'
                    return (
                      <article key={event.id} className={`rounded-3xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-6 ${isDark ? 'border-slate-800 bg-slate-900' : 'border-rose-100 bg-white'}`}>
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <button className="min-w-0 flex-1 text-left" onClick={() => handleManage(event)}>
                            <div className="mb-3 flex flex-wrap items-center gap-2">
                              <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${badgeStyle}`}>{event.status || 'Draft'}</span>
                              <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{formatDate(event.dateTime)}</span>
                            </div>
                            <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{event.title}</h2>
                            <p className={`mt-1 truncate text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{event.location}</p>
                          </button>
                          <button onClick={() => handleCopy(event)} className={`rounded-full border px-4 py-2 text-xs font-bold transition ${isDark ? 'border-slate-700 text-slate-200 hover:bg-slate-800' : 'border-rose-200 text-rose-800 hover:bg-rose-50'}`}>Copy link</button>
                        </div>
                        <div className={`mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4 ${isDark ? 'border-slate-800' : 'border-rose-50'}`}>
                          <div className="flex flex-wrap gap-4 text-xs">
                            <span><strong className="text-emerald-700">{counts.attending}</strong> attending</span>
                            <span><strong className="text-amber-700">{counts.maybe}</strong> maybe</span>
                            <span><strong className="text-slate-500">{counts.declined}</strong> declined</span>
                          </div>
                          <button onClick={() => handleManage(event)} className={`text-xs font-bold ${isDark ? 'text-rose-300' : 'text-rose-800'}`}>Manage event →</button>
                        </div>
                      </article>
                    )
                  })}
                {rsvpsError && (
                  <div className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 text-sm ${isDark ? 'border-amber-900 bg-amber-950/30 text-amber-200' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>
                    <span>{rsvpsError} Guest totals may be out of date.</span>
                    <button onClick={refreshRsvps} className="rounded-full px-3 py-1 font-bold underline">Retry</button>
                  </div>
                )}
              </div>
            )}

            {user.isOwner && (
              <button onClick={() => setPage('admin')} className={`mt-8 text-xs font-semibold underline decoration-dotted underline-offset-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Open account administration</button>
            )}
          </>
        )}

        {page === 'create' && (
          <EventForm
            onSave={handleSaveEvent}
            onCancel={() => setPage('dashboard')}
            dark={isDark}
          />
        )}

        {page === 'manage' && activeEvent && (
          <EventManager
            event={activeEvent}
            guests={rsvps.filter(row => row.eventId === (activeEvent.eventId || activeEvent.id))}
            loading={rsvpsLoading}
            error={rsvpsError}
            onRetry={refreshRsvps}
            onBack={() => { setPage('dashboard'); setActiveEvent(null) }}
            onEdit={() => setPage('edit')}
            onCopy={() => handleCopy(activeEvent)}
            dark={isDark}
          />
        )}

        {page === 'edit' && activeEvent && (
          <EventForm
            initialEvent={activeEvent}
            onSave={handleSaveEvent}
            onCancel={() => setPage('manage')}
            dark={isDark}
          />
        )}

        {page === 'admin' && user.isOwner && (
          <AdminPanel
            onBack={() => setPage('dashboard')}
            dark={isDark}
          />
        )}
      </div>

      {page === 'dashboard' && (
        <div className={`fixed inset-x-0 bottom-0 z-10 border-t p-3 sm:hidden ${isDark ? 'border-slate-800 bg-slate-950/95' : 'border-rose-100 bg-[#fbf8f5]/95'} backdrop-blur-xl`}>
          <div className="mx-auto max-w-xl">
            <button onClick={handleCreate} className="w-full rounded-full bg-[#c49a4a] px-5 py-3.5 text-sm font-bold text-white shadow-md">＋ Create a new event</button>
          </div>
        </div>
      )}
      {notice && <Toast message={notice} dark={isDark} />}
    </main>
  )
}

function Toast({ message, dark }) {
  return (
    <div role="status" className={`fixed bottom-5 left-1/2 z-50 max-w-[calc(100%-2rem)] -translate-x-1/2 rounded-2xl px-5 py-3 text-center text-sm font-semibold shadow-xl ${dark ? 'bg-slate-100 text-slate-900' : 'bg-slate-900 text-white'}`}>
      {message}
    </div>
  )
}
