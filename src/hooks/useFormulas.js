import { useState, useEffect, useCallback } from 'react'
import { supabase, isConfigured } from '../lib/supabase'

function lsGet(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback } catch { return fallback }
}
function lsSet(key, val) { localStorage.setItem(key, JSON.stringify(val)) }

export function useFormulas(userId) {
  const [formulas, setFormulas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isConfigured) {
      setFormulas(lsGet('bwFormulas', []))
      setLoading(false)
      return
    }
    if (!userId) return

    async function loadAll() {
      const { data } = await supabase.from('formulas').select('*').eq('user_id', userId).order('created_at')
      setFormulas(data || [])
      setLoading(false)
    }

    loadAll()
    const interval = setInterval(loadAll, 4000)
    const onVisibility = () => { if (document.visibilityState === 'visible') loadAll() }
    document.addEventListener('visibilitychange', onVisibility)

    const channel = supabase.channel('formulas-' + userId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'formulas', filter: `user_id=eq.${userId}` }, loadAll)
      .subscribe()

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibility)
      supabase.removeChannel(channel)
    }
  }, [userId])

  const saveFormula = useCallback(async (formula) => {
    if (!isConfigured) {
      setFormulas(prev => {
        const exists = prev.find(f => f.id === formula.id)
        const next = exists
          ? prev.map(f => f.id === formula.id ? { ...f, ...formula } : f)
          : [...prev, { ...formula, created_at: new Date().toISOString() }]
        lsSet('bwFormulas', next)
        return next
      })
      return formula
    }
    const payload = {
      id: formula.id,
      user_id: userId,
      name: formula.name,
      ingredients: formula.ingredients,
      target_cost: formula.targetCost ?? formula.target_cost ?? '',
      target_margin: formula.targetMargin ?? formula.target_margin ?? '',
      notes: formula.notes || '',
      updated_at: new Date().toISOString(),
    }
    const { data } = await supabase.from('formulas').upsert(payload, { onConflict: 'id' }).select().single()
    if (data) {
      setFormulas(prev => {
        const exists = prev.find(f => f.id === data.id)
        return exists ? prev.map(f => f.id === data.id ? data : f) : [...prev, data]
      })
    }
    return data
  }, [userId])

  const deleteFormula = useCallback(async (id) => {
    setFormulas(prev => {
      const next = prev.filter(f => f.id !== id)
      if (!isConfigured) lsSet('bwFormulas', next)
      return next
    })
    if (isConfigured) await supabase.from('formulas').delete().eq('id', id)
  }, [])

  const addFormula = useCallback(async (name = 'New Formula') => {
    const id = isConfigured ? undefined : (Date.now() + '-' + Math.random().toString(36).slice(2))
    if (!isConfigured) {
      const f = { id, name, ingredients: [], target_cost: '', target_margin: '', notes: '', created_at: new Date().toISOString() }
      setFormulas(prev => { const next = [...prev, f]; lsSet('bwFormulas', next); return next })
      return f
    }
    const { data } = await supabase.from('formulas').insert({ user_id: userId, name, ingredients: [], target_cost: '', target_margin: '', notes: '' }).select().single()
    if (data) setFormulas(prev => [...prev, data])
    return data
  }, [userId])

  return { formulas, loading, saveFormula, deleteFormula, addFormula }
}
