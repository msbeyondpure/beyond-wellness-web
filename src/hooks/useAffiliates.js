import { useState, useEffect, useCallback } from 'react'
import { supabase, isConfigured } from '../lib/supabase'

function lsGet(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback } catch { return fallback }
}
function lsSet(key, val) { localStorage.setItem(key, JSON.stringify(val)) }
function uid() { return Date.now() + '-' + Math.random().toString(36).slice(2) }

export function useAffiliates(userId) {
  const [affiliates, setAffiliates] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isConfigured) {
      setAffiliates(lsGet('bwAffiliates', []))
      setLoading(false)
      return
    }
    if (!userId) return

    async function loadAll() {
      const { data } = await supabase.from('affiliates').select('*').eq('user_id', userId).order('created_at', { ascending: false })
      setAffiliates(data || [])
      setLoading(false)
    }
    loadAll()

    const channel = supabase.channel('affiliates-' + userId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'affiliates', filter: `user_id=eq.${userId}` }, loadAll)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [userId])

  const addAffiliate = useCallback(async (fields = {}) => {
    if (!isConfigured) {
      const a = { id: uid(), name: 'New Affiliate', platform: '', handle: '', email: '', link: '', code: '', date_joined: '', total_sales: 0, commission: 0, status: 'Active', payment_method: '', notes: '', created_at: new Date().toISOString(), ...fields }
      setAffiliates(prev => { const next = [a, ...prev]; lsSet('bwAffiliates', next); return next })
      return a
    }
    const { data } = await supabase.from('affiliates').insert({ user_id: userId, name: 'New Affiliate', ...fields }).select().single()
    if (data) setAffiliates(prev => [data, ...prev])
    return data
  }, [userId])

  const updateAffiliate = useCallback(async (id, changes) => {
    setAffiliates(prev => {
      const next = prev.map(a => a.id === id ? { ...a, ...changes } : a)
      if (!isConfigured) lsSet('bwAffiliates', next)
      return next
    })
    if (isConfigured) await supabase.from('affiliates').update(changes).eq('id', id)
  }, [])

  const deleteAffiliate = useCallback(async (id) => {
    setAffiliates(prev => {
      const next = prev.filter(a => a.id !== id)
      if (!isConfigured) lsSet('bwAffiliates', next)
      return next
    })
    if (isConfigured) await supabase.from('affiliates').delete().eq('id', id)
  }, [])

  return { affiliates, loading, addAffiliate, updateAffiliate, deleteAffiliate }
}
