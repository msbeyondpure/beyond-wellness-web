import { useState, useEffect, useRef } from 'react'
import { supabase, isConfigured } from '../lib/supabase'

export function useNotepad(userId) {
  const [content, setContent]   = useState('')
  const [loaded, setLoaded]     = useState(false)
  const debounceRef  = useRef(null)
  const dbContentRef = useRef('')   // last value known to be in DB
  const isDirtyRef   = useRef(false) // true while unsaved local edits exist

  useEffect(() => {
    if (!isConfigured) {
      const c = localStorage.getItem('bwNotepad') || ''
      setContent(c); dbContentRef.current = c; setLoaded(true)
      return
    }
    if (!userId) return

    async function loadNotepad() {
      const { data } = await supabase.from('notepad').select('content').eq('user_id', userId).maybeSingle()
      const c = data?.content || ''
      dbContentRef.current = c
      // Only apply remote value when no pending local edits
      if (!isDirtyRef.current) setContent(c)
      setLoaded(true)
    }

    loadNotepad()
    const interval = setInterval(loadNotepad, 4000)
    const onVisibility = () => { if (document.visibilityState === 'visible') loadNotepad() }
    document.addEventListener('visibilitychange', onVisibility)

    const channel = supabase.channel('notepad-' + userId)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'notepad', filter: `user_id=eq.${userId}` },
        (payload) => {
          const newC = payload.new?.content ?? ''
          dbContentRef.current = newC
          if (!isDirtyRef.current) setContent(newC)
        }
      )
      .subscribe()

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibility)
      supabase.removeChannel(channel)
    }
  }, [userId])

  function updateContent(val) {
    setContent(val)
    isDirtyRef.current = true
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      if (!isConfigured) {
        localStorage.setItem('bwNotepad', val)
        isDirtyRef.current = false
        return
      }
      await supabase.from('notepad').upsert(
        { user_id: userId, content: val, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      )
      dbContentRef.current = val
      isDirtyRef.current = false
    }, 800)
  }

  return { content, updateContent, loaded }
}
