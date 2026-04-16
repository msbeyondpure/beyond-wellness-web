import { useState, useEffect, useRef } from 'react'
import { supabase, isConfigured } from '../lib/supabase'

export function useNotepad(userId) {
  const [content, setContent] = useState('')
  const [loaded, setLoaded] = useState(false)
  const debounceRef = useRef(null)

  useEffect(() => {
    if (!isConfigured) {
      setContent(localStorage.getItem('bwNotepad') || '')
      setLoaded(true)
      return
    }
    if (!userId) return
    supabase.from('notepad').select('content').eq('user_id', userId).maybeSingle().then(({ data }) => {
      setContent(data?.content || '')
      setLoaded(true)
    })
  }, [userId])

  function updateContent(val) {
    setContent(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      if (!isConfigured) { localStorage.setItem('bwNotepad', val); return }
      await supabase.from('notepad').upsert(
        { user_id: userId, content: val, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      )
    }, 800)
  }

  return { content, updateContent, loaded }
}
