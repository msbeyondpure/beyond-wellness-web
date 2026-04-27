import { useState, useEffect } from 'react'
import { supabase, isConfigured } from '../lib/supabase'

// ── localStorage fallback ─────────────────────────────────────────────────────
const LS_TREE = 'bwEditorTree'
const LS_FILE = (p) => `bwEditorFile:${p}`
const loadLocalTree = () => { try { return JSON.parse(localStorage.getItem(LS_TREE)) || [] } catch { return [] } }
const saveLocalTree = (nodes) => localStorage.setItem(LS_TREE, JSON.stringify(nodes))
const loadLocalFile = (p) => localStorage.getItem(LS_FILE(p)) || ''
const saveLocalFile = (p, c) => localStorage.setItem(LS_FILE(p), c)
const deleteLocalFile = (p) => localStorage.removeItem(LS_FILE(p))
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2)
const withoutContent = (node) => {
  const next = { ...node }
  delete next.content
  return next
}

// ── hook ─────────────────────────────────────────────────────────────────────
export function useEditorFiles(userId) {
  const [files, setFiles]   = useState([])
  const [loading, setLoading] = useState(true)
  const useDB = isConfigured && !!userId

  // ── Load + poll + realtime ───────────────────────────────────────────────
  useEffect(() => {
    if (!useDB) {
      const tree = loadLocalTree()
      setFiles(tree.map(n => ({ ...n, content: n.type === 'file' ? loadLocalFile(n.path) : '' })))
      setLoading(false)
      return
    }

    async function loadAll() {
      const { data } = await supabase.from('editor_files').select('*').eq('user_id', userId).order('path')
      setFiles(data || [])
      setLoading(false)
    }

    loadAll()
    const interval = setInterval(loadAll, 4000)
    const onVisibility = () => { if (document.visibilityState === 'visible') loadAll() }
    document.addEventListener('visibilitychange', onVisibility)

    const channel = supabase.channel('editor_files-' + userId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'editor_files', filter: `user_id=eq.${userId}` }, loadAll)
      .subscribe()

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibility)
      supabase.removeChannel(channel)
    }
  }, [userId, useDB])

  // ── Create ────────────────────────────────────────────────────────────────
  async function createNode(name, type, parentPath = '') {
    const trimmed = name.trim()
    if (!trimmed) return null
    const path = parentPath ? `${parentPath}/${trimmed}` : trimmed
    if (files.some(f => f.path === path)) return null

    if (!useDB) {
      const node = { id: uid(), name: trimmed, path, type, parent_path: parentPath, content: '' }
      const next = [...files, node]
      setFiles(next)
      saveLocalTree(next.map(withoutContent))
      if (type === 'file') saveLocalFile(path, '')
      return node
    }

    const { data, error } = await supabase
      .from('editor_files')
      .insert({ user_id: userId, name: trimmed, path, type, parent_path: parentPath, content: '' })
      .select().single()
    if (!error && data) { setFiles(prev => [...prev, data]); return data }
    return null
  }

  // ── Save content ──────────────────────────────────────────────────────────
  async function saveContent(path, content) {
    setFiles(prev => prev.map(f => f.path === path ? { ...f, content } : f))
    if (!useDB) { saveLocalFile(path, content); return }
    await supabase.from('editor_files')
      .update({ content, updated_at: new Date().toISOString() })
      .eq('user_id', userId).eq('path', path)
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  async function deleteNode(path) {
    const toDelete = files.filter(f => f.path === path || f.path.startsWith(path + '/'))
    const paths    = new Set(toDelete.map(f => f.path))
    if (!useDB) {
      toDelete.forEach(f => { if (f.type === 'file') deleteLocalFile(f.path) })
      const next = files.filter(f => !paths.has(f.path))
      setFiles(next); saveLocalTree(next.map(withoutContent))
      return
    }
    await supabase.from('editor_files').delete().eq('user_id', userId).in('path', [...paths])
    setFiles(prev => prev.filter(f => !paths.has(f.path)))
  }

  // ── Rename ────────────────────────────────────────────────────────────────
  async function renameNode(path, newName) {
    if (!newName.trim()) return null
    const node = files.find(f => f.path === path)
    if (!node) return null
    const newPath = node.parent_path ? `${node.parent_path}/${newName.trim()}` : newName.trim()
    if (files.some(f => f.path === newPath)) return null

    const remap = {}
    files.forEach(f => {
      if (f.path === path) remap[f.path] = newPath
      else if (f.path.startsWith(path + '/')) remap[f.path] = newPath + f.path.slice(path.length)
    })

    if (!useDB) {
      const next = files.map(f => {
        if (!remap[f.path]) return f
        const np = remap[f.path]
        if (f.type === 'file') { saveLocalFile(np, loadLocalFile(f.path)); deleteLocalFile(f.path) }
        const isRoot = f.path === path
        return { ...f, path: np, name: isRoot ? newName.trim() : f.name, parent_path: isRoot ? node.parent_path : (remap[f.parent_path] || f.parent_path) }
      })
      setFiles(next); saveLocalTree(next.map(withoutContent))
      return { ...node, path: newPath, name: newName.trim() }
    }

    await Promise.all(Object.entries(remap).map(([oldP, newP]) => {
      const f = files.find(f => f.path === oldP)
      const isRoot = oldP === path
      return supabase.from('editor_files').update({
        path: newP, name: isRoot ? newName.trim() : f.name,
        parent_path: isRoot ? node.parent_path : (remap[f.parent_path] || f.parent_path),
        updated_at: new Date().toISOString()
      }).eq('user_id', userId).eq('path', oldP)
    }))
    setFiles(prev => prev.map(f => {
      if (!remap[f.path]) return f
      const isRoot = f.path === path
      return { ...f, path: remap[f.path], name: isRoot ? newName.trim() : f.name, parent_path: isRoot ? node.parent_path : (remap[f.parent_path] || f.parent_path) }
    }))
    return { ...node, path: newPath, name: newName.trim() }
  }

  return { files, loading, createNode, saveContent, deleteNode, renameNode }
}
