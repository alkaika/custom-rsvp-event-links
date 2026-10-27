import React, { useState } from 'react'

const toLocalInput = value => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

const slugify = value => value
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 48)

export default function EventForm({ initialEvent, onSave, onCancel, dark }) {
  const [title, setTitle] = useState(initialEvent?.title || '')
  const [description, setDescription] = useState(initialEvent?.description || '')
  const [location, setLocation] = useState(initialEvent?.location || '')
  const [dateTime, setDateTime] = useState(toLocalInput(initialEvent?.dateTime))
  const [customSlug, setCustomSlug] = useState(initialEvent?.customSlug || '')
  const [rsvpDeadline, setRsvpDeadline] = useState(toLocalInput(initialEvent?.rsvpDeadline))
  const [status, setStatus] = useState(initialEvent?.status || 'Published')
  const [slugTouched, setSlugTouched] = useState(Boolean(initialEvent?.customSlug))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const changeTitle = value => {
    setTitle(value)
    if (!slugTouched) setCustomSlug(slugify(value))
  }

  const submit = async event => {
    event.preventDefault()
    setError('')
    const cleanTitle = title.trim()
    const cleanLocation = location.trim()
    const cleanSlug = slugify(customSlug)
    if (cleanTitle.length < 3) {
      setError('Give your event a title of at least 3 characters.')
      return
    }
    if (!cleanLocation) {
      setError('Add a location so guests know where to go.')
      return
    }
    if (!dateTime || Number.isNaN(new Date(dateTime).getTime())) {
      setError('Choose a valid date and time for your event.')
      return
    }
    if (cleanSlug.length < 3) {
      setError('Your event link needs at least 3 letters or numbers.')
      return
    }
    if (rsvpDeadline && new Date(rsvpDeadline) > new Date(dateTime)) {
      setError('The RSVP deadline must be before the event begins.')
      return
    }
    setBusy(true)
    try {
      await onSave({
        title: cleanTitle,
        description: description.trim(),
        location: cleanLocation,
        dateTime: new Date(dateTime).toISOString(),
        customSlug: cleanSlug,
        rsvpDeadline: rsvpDeadline ? new Date(rsvpDeadline).toISOString() : '',
        status
      })
    } catch (saveError) {
      setError(saveError.message || 'We could not save your event. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const input = dark
    ? 'border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-500 focus:border-rose-400'
    : 'border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:border-rose-400'
  const card = dark ? 'border-slate-800 bg-slate-900' : 'border-rose-100 bg-white shadow-sm'

  return (
    <section className="mx-auto max-w-2xl">
      <button onClick={onCancel} className={`mb-5 text-sm font-semibold ${dark ? 'text-rose-300' : 'text-rose-800'}`}>← Back</button>
      <div className={`rounded-[2rem] border p-5 sm:p-8 ${card}`}>
        <div className="mb-7">
          <p className={`mb-2 text-xs font-bold uppercase tracking-[0.18em] ${dark ? 'text-rose-300' : 'text-rose-700'}`}>{initialEvent ? 'Event details' : 'A new celebration'}</p>
          <h1 className="text-3xl font-bold tracking-tight">{initialEvent ? 'Make it yours.' : 'Let’s make it official.'}</h1>
          <p className={`mt-2 text-sm leading-6 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Add the details your guests need. You can update everything later.</p>
        </div>
        <form onSubmit={submit} className="space-y-5">
          <label className="block text-sm font-semibold">
            Event title
            <input value={title} onChange={event => changeTitle(event.target.value)} maxLength={100} required className={`mt-2 w-full rounded-xl border px-4 py-3 outline-none transition ${input}`} placeholder="Avery & Sam's wedding" />
          </label>

          <label className="block text-sm font-semibold">
            Description <span className="font-normal text-slate-400">· optional</span>
            <textarea value={description} onChange={event => setDescription(event.target.value)} maxLength={1400} rows={4} className={`mt-2 w-full resize-y rounded-xl border px-4 py-3 outline-none transition ${input}`} placeholder="Share a little about the day, dress code, or anything guests should know." />
            <span className="mt-1 block text-right text-xs text-slate-400">{description.length}/1400</span>
          </label>

          <label className="block text-sm font-semibold">
            Date and time
            <input type="datetime-local" value={dateTime} onChange={event => setDateTime(event.target.value)} required className={`mt-2 w-full rounded-xl border px-4 py-3 outline-none transition ${input}`} />
          </label>

          <label className="block text-sm font-semibold">
            Location
            <input value={location} onChange={event => setLocation(event.target.value)} maxLength={180} required className={`mt-2 w-full rounded-xl border px-4 py-3 outline-none transition ${input}`} placeholder="Venue name or address" />
          </label>

          <div>
            <label htmlFor="event-slug" className="block text-sm font-semibold">Custom event link</label>
            <div className={`mt-2 flex items-center rounded-xl border focus-within:border-rose-400 ${dark ? 'border-slate-700 bg-slate-950' : 'border-slate-200 bg-white'}`}>
              <span className={`select-none pl-3 text-xs ${dark ? 'text-slate-500' : 'text-slate-400'}`}>/ ?event=</span>
              <input id="event-slug" value={customSlug} onChange={event => { setSlugTouched(true); setCustomSlug(slugify(event.target.value)) }} maxLength={48} required className={`min-w-0 flex-1 rounded-r-xl bg-transparent px-2 py-3 text-sm outline-none ${dark ? 'text-slate-100' : 'text-slate-800'}`} placeholder="your-event" />
            </div>
            <p className="mt-1 text-xs text-slate-400">Letters, numbers, and hyphens. This is the unique link you’ll share.</p>
          </div>

          <label className="block text-sm font-semibold">
            RSVP deadline <span className="font-normal text-slate-400">· optional</span>
            <input type="datetime-local" value={rsvpDeadline} onChange={event => setRsvpDeadline(event.target.value)} className={`mt-2 w-full rounded-xl border px-4 py-3 outline-none transition ${input}`} />
          </label>

          <label className="block text-sm font-semibold">
            Event status
            <select value={status} onChange={event => setStatus(event.target.value)} className={`mt-2 w-full rounded-xl border px-4 py-3 outline-none transition ${input}`}>
              <option value="Published">Published — guests can RSVP</option>
              <option value="Draft">Draft — not ready to share</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </label>

          {error && <p role="alert" className={`rounded-xl px-4 py-3 text-sm ${dark ? 'bg-rose-950 text-rose-200' : 'bg-rose-50 text-rose-800'}`}>{error}</p>}

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row">
            <button type="button" onClick={onCancel} className={`rounded-full border px-5 py-3 text-sm font-bold transition ${dark ? 'border-slate-700 text-slate-200 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>Cancel</button>
            <button type="submit" disabled={busy} className="flex-1 rounded-full bg-[#c49a4a] px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#ae8435] disabled:opacity-60">{busy ? 'Saving…' : initialEvent ? 'Save event details' : 'Create event'}</button>
          </div>
        </form>
      </div>
    </section>
  )
}
