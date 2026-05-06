import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase, isConfigured } from '../lib/supabase'

const LS_KEY = 'bwSavedNotes'

function uid() {
  return globalThis.crypto?.randomUUID?.() || Date.now() + '-' + Math.random().toString(36).slice(2)
}

function pad(value) {
  return String(value).padStart(2, '0')
}

export function todayKey(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function formatNoteTitle(dateKey) {
  const [year, month, day] = String(dateKey || todayKey()).split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
}

function normalizeNote(note = {}) {
  const date = note.date || note.note_date || todayKey()
  const now = new Date().toISOString()
  return {
    id: note.id || uid(),
    date,
    title: note.title || formatNoteTitle(date),
    content: note.content || '',
    created_at: note.created_at || now,
    updated_at: note.updated_at || now,
  }
}

function sortNotes(notes) {
  return [...notes].sort((a, b) => String(b.date).localeCompare(String(a.date)))
}

function lsGet() {
  try {
    const parsed = JSON.parse(localStorage.getItem(LS_KEY) || '[]')
    return Array.isArray(parsed) ? sortNotes(parsed.map(normalizeNote)) : []
  } catch {
    return []
  }
}

function lsSet(notes) {
  localStorage.setItem(LS_KEY, JSON.stringify(sortNotes(notes.map(normalizeNote))))
}

function toDb(note, userId) {
  return {
    id: note.id,
    user_id: userId,
    note_date: note.date,
    title: note.title,
    content: note.content,
    created_at: note.created_at,
    updated_at: note.updated_at,
  }
}

function fromDb(row) {
  return normalizeNote({
    id: row.id,
    date: row.note_date,
    title: row.title,
    content: row.content,
    created_at: row.created_at,
    updated_at: row.updated_at,
  })
}

export function useSavedNotes(userId) {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const cloudDisabledRef = useRef(false)
  const notesRef = useRef([])

  useEffect(() => { notesRef.current = notes }, [notes])

  useEffect(() => {
    const local = lsGet()
    setNotes(local)
    setLoading(false)

    if (!isConfigured || !userId || userId === 'local' || cloudDisabledRef.current) return undefined

    let cancelled = false
    async function loadCloud() {
      const { data, error } = await supabase
        .from('saved_notes')
        .select('*')
        .eq('user_id', userId)
        .order('note_date', { ascending: false })

      if (cancelled) return
      if (error) {
        cloudDisabledRef.current = true
        return
      }

      const remote = sortNotes((data || []).map(fromDb))
      if (remote.length) {
        setNotes(remote)
        lsSet(remote)
      } else if (local.length) {
        await Promise.all(local.map(note => supabase.from('saved_notes').upsert(toDb(note, userId), { onConflict: 'id' })))
      }
    }

    loadCloud()
    const interval = setInterval(loadCloud, 8000)
    const onVisibility = () => { if (document.visibilityState === 'visible') loadCloud() }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelled = true
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [userId])

  const saveNote = useCallback(async (note) => {
    const normalized = normalizeNote(note)
    const next = sortNotes(
      notesRef.current.some(item => item.id === normalized.id)
        ? notesRef.current.map(item => item.id === normalized.id ? normalized : item)
        : [normalized, ...notesRef.current]
    )
    setNotes(next)
    lsSet(next)

    if (isConfigured && userId && userId !== 'local' && !cloudDisabledRef.current) {
      const { error } = await supabase.from('saved_notes').upsert(toDb(normalized, userId), { onConflict: 'id' })
      if (error) cloudDisabledRef.current = true
    }
    return normalized
  }, [userId])

  const deleteNote = useCallback(async (id) => {
    const next = notesRef.current.filter(note => note.id !== id)
    setNotes(next)
    lsSet(next)
    if (isConfigured && userId && userId !== 'local' && !cloudDisabledRef.current) {
      const { error } = await supabase.from('saved_notes').delete().eq('id', id)
      if (error) cloudDisabledRef.current = true
    }
  }, [userId])

  const getOrCreateDailyNote = useCallback(async (date = todayKey()) => {
    const existing = notesRef.current.find(note => note.date === date)
    if (existing) return existing
    return saveNote(normalizeNote({ date, title: formatNoteTitle(date), content: '' }))
  }, [saveNote])

  const appendToDailyNote = useCallback(async (text, date = todayKey()) => {
    const clean = String(text || '').trim()
    if (!clean) return null
    const note = await getOrCreateDailyNote(date)
    const stamp = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    const addition = `### ${stamp}\n${clean}`
    const content = note.content.trim() ? `${note.content.trim()}\n\n${addition}` : addition
    return saveNote({ ...note, content, updated_at: new Date().toISOString() })
  }, [getOrCreateDailyNote, saveNote])

  const tree = useMemo(() => {
    const years = new Map()
    notes.forEach(note => {
      const [year, month] = note.date.split('-')
      const date = new Date(Number(year), Number(month) - 1, 1)
      const monthLabel = date.toLocaleDateString(undefined, { month: 'long' })
      if (!years.has(year)) years.set(year, new Map())
      const months = years.get(year)
      if (!months.has(monthLabel)) months.set(monthLabel, [])
      months.get(monthLabel).push(note)
    })
    return [...years.entries()].map(([year, months]) => ({
      year,
      months: [...months.entries()].map(([month, items]) => ({ month, notes: items })),
    }))
  }, [notes])

  return { notes, tree, loading, saveNote, deleteNote, getOrCreateDailyNote, appendToDailyNote }
}
