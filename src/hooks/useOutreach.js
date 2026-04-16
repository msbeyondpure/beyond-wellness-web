import { useState, useEffect, useCallback } from 'react'
import { supabase, isConfigured } from '../lib/supabase'

function lsGet(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback } catch { return fallback }
}
function lsSet(key, val) { localStorage.setItem(key, JSON.stringify(val)) }
function uid() { return Date.now() + '-' + Math.random().toString(36).slice(2) }

export function useOutreach(userId) {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isConfigured) {
      setContacts(lsGet('bwOutreach', []))
      setLoading(false)
      return
    }
    if (!userId) return
    supabase.from('outreach').select('*').eq('user_id', userId).order('created_at', { ascending: false }).then(({ data }) => {
      setContacts(data || [])
      setLoading(false)
    })
  }, [userId])

  const addContact = useCallback(async (fields = {}) => {
    if (!isConfigured) {
      const c = { id: uid(), name: 'New Contact', platform: '', handle: '', email: '', date_contacted: '', response: 'No response', notes: '', created_at: new Date().toISOString(), ...fields }
      setContacts(prev => { const next = [c, ...prev]; lsSet('bwOutreach', next); return next })
      return c
    }
    const { data } = await supabase.from('outreach').insert({ user_id: userId, name: 'New Contact', ...fields }).select().single()
    if (data) setContacts(prev => [data, ...prev])
    return data
  }, [userId])

  const updateContact = useCallback(async (id, changes) => {
    setContacts(prev => {
      const next = prev.map(c => c.id === id ? { ...c, ...changes } : c)
      if (!isConfigured) lsSet('bwOutreach', next)
      return next
    })
    if (isConfigured) await supabase.from('outreach').update(changes).eq('id', id)
  }, [])

  const deleteContact = useCallback(async (id) => {
    setContacts(prev => {
      const next = prev.filter(c => c.id !== id)
      if (!isConfigured) lsSet('bwOutreach', next)
      return next
    })
    if (isConfigured) await supabase.from('outreach').delete().eq('id', id)
  }, [])

  return { contacts, loading, addContact, updateContact, deleteContact }
}
