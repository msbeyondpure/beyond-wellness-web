import { useState, useEffect, useCallback } from 'react'
import { supabase, isConfigured } from '../lib/supabase'

function lsGet(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback } catch { return fallback }
}
function lsSet(key, val) { localStorage.setItem(key, JSON.stringify(val)) }
function uid() { return Date.now() + '-' + Math.random().toString(36).slice(2) }

export function useTasks(userId) {
  const [tasks, setTasks] = useState([])
  const [categoryOrder, setCategoryOrderState] = useState([])
  const [loading, setLoading] = useState(true)

  // ── local mode ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isConfigured) return
    setTasks(lsGet('bwTasks', []))
    setLoading(false)
  }, [])

  // ── supabase mode: load + poll + realtime ─────────────────────────────────
  useEffect(() => {
    if (!isConfigured || !userId || userId === 'local') return

    async function loadAll() {
      const [{ data: tasksData }, { data: catData }] = await Promise.all([
        supabase.from('tasks').select('*').eq('user_id', userId).order('sort_order'),
        supabase.from('category_order').select('*').eq('user_id', userId).maybeSingle()
      ])
      setTasks(tasksData || [])
      setCategoryOrderState(catData?.order_list || [])
      setLoading(false)
    }

    loadAll()

    // Poll every 4 s — guaranteed live updates regardless of realtime config
    const interval = setInterval(loadAll, 4000)

    // Instant refresh when this tab regains focus
    const onVisibility = () => { if (document.visibilityState === 'visible') loadAll() }
    document.addEventListener('visibilitychange', onVisibility)

    // Realtime (instant if supabase_realtime publication is enabled)
    const channel = supabase.channel('tasks-' + userId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks',          filter: `user_id=eq.${userId}` }, loadAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'category_order', filter: `user_id=eq.${userId}` }, loadAll)
      .subscribe()

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibility)
      supabase.removeChannel(channel)
    }
  }, [userId])

  const addTask = useCallback(async (category, text) => {
    if (!isConfigured) {
      const task = { id: uid(), category, text, completed: false, hidden: false, notes: '', files: [], sort_order: 0, created_at: new Date().toISOString() }
      setTasks(prev => { const next = [...prev, task]; lsSet('bwTasks', next); return next })
      return task
    }
    const maxOrder = tasks.filter(t => t.category === category).reduce((m, t) => Math.max(m, t.sort_order), -1)
    const { data } = await supabase.from('tasks').insert({ user_id: userId, category, text, sort_order: maxOrder + 1 }).select().single()
    if (data) setTasks(prev => [...prev, data])
    return data
  }, [tasks, userId])

  const updateTask = useCallback(async (id, changes) => {
    setTasks(prev => {
      const next = prev.map(t => t.id === id ? { ...t, ...changes } : t)
      if (!isConfigured) lsSet('bwTasks', next)
      return next
    })
    if (isConfigured) await supabase.from('tasks').update(changes).eq('id', id)
  }, [])

  const deleteTask = useCallback(async (id) => {
    setTasks(prev => {
      const next = prev.filter(t => t.id !== id)
      if (!isConfigured) lsSet('bwTasks', next)
      return next
    })
    if (isConfigured) await supabase.from('tasks').delete().eq('id', id)
  }, [])

  const setCategoryOrder = useCallback(async (order) => {
    setCategoryOrderState(order)
    if (!isConfigured) { lsSet('bwCategoryOrder', order); return }
    await supabase.from('category_order').upsert({ user_id: userId, order_list: order }, { onConflict: 'user_id' })
  }, [userId])

  return { tasks, categoryOrder, setCategoryOrder, loading, addTask, updateTask, deleteTask }
}
