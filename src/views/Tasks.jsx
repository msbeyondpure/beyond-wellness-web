/* eslint-disable react/prop-types */
import { useState, useRef, useEffect, useMemo } from 'react'
import { useTasks } from '../hooks/useTasks'
import { useNotepad } from '../hooks/useNotepad'
import { animateLayoutShift, rememberLayoutNode } from '../lib/reorderAnimation'

// Icons
const Plus = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const Check = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
const Trash2 = ({size=14}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
const CheckCircle = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
const GripV = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg>
const ChevronRight = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
const CollapseLeft = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>

function playSound(type) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    gain.gain.value = 0.12
    if (type === 'check') {
      osc.frequency.setValueAtTime(600, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.1)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15)
      osc.start(); osc.stop(ctx.currentTime + 0.15)
    } else if (type === 'complete') {
      osc.frequency.setValueAtTime(400, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.2)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
      osc.start(); osc.stop(ctx.currentTime + 0.3)
    }
  } catch {
    // Audio feedback is optional.
  }
}

function moveValue(list, source, target) {
  if (!source || !target || source === target) return list
  const from = list.indexOf(source)
  const to = list.indexOf(target)
  if (from < 0 || to < 0) return list
  const next = [...list]
  next.splice(from, 1)
  next.splice(from < to ? to - 1 : to, 0, source)
  return next
}

function sortTasksForDisplay(a, b) {
  const order = Number(a.sort_order || 0) - Number(b.sort_order || 0)
  if (order !== 0) return order
  return String(a.created_at || '').localeCompare(String(b.created_at || ''))
}

function taskLayoutSignature(tasks) {
  return (tasks || []).map(task => `${task.id}:${task.category}:${Number(task.sort_order || 0)}`).join('|')
}

function categoryLayoutSignature(categories) {
  return (categories || []).join('|')
}

function replaceCategoryTasks(allTasks, category, orderedCategoryTasks) {
  let inserted = false
  return allTasks.flatMap(task => {
    if (task.category !== category) return [task]
    if (task.hidden) return [task]
    if (inserted) return []
    inserted = true
    return orderedCategoryTasks
  })
}

export default function Tasks({ userId, onStatsChange, resetKey }) {
  const { tasks, loading, addTask, updateTask, deleteTask, restoreTask, categoryOrder, setCategoryOrder } = useTasks(userId)
  const { content: notepadContent, updateContent } = useNotepad(userId)

  const [expandedTask, setExpandedTask] = useState(null)
  const [showNewTaskForm, setShowNewTaskForm] = useState(null)
  const [newTaskText, setNewTaskText] = useState('')
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [editingSectionName, setEditingSectionName] = useState(null)
  const [collapsedSections, setCollapsedSections] = useState(() => {
    try { return JSON.parse(localStorage.getItem('bwCollapsed')) || [] } catch { return [] }
  })
  const [checkAnimating, setCheckAnimating] = useState(null)
  const [sendingComplete, setSendingComplete] = useState(null)
  const [showCompleted, setShowCompleted] = useState(false)
  const [dragTaskId, setDragTaskId] = useState(null)
  const [dragOverTaskId, setDragOverTaskId] = useState(null)
  const [dragSectionCat, setDragSectionCat] = useState(null)
  const [dragOverSectionCat, setDragOverSectionCat] = useState(null)
  const [previewTasks, setPreviewTasks] = useState(null)
  const [previewCategoryOrder, setPreviewCategoryOrder] = useState(null)
  // Default notepad to collapsed on mobile, expanded on desktop
  const [notepadCollapsed, setNotepadCollapsed] = useState(() => {
    if (typeof window !== 'undefined') return window.innerWidth < 640
    return false
  })
  const [notepadHeight, setNotepadHeight] = useState(() => {
    const s = localStorage.getItem('bwNotepadHeight'); return s ? parseInt(s) : 420
  })
  const [showMobileNotepad, setShowMobileNotepad] = useState(false)
  const notepadRef = useRef(null)
  const taskLayoutRef = useRef(new Map())
  const sectionLayoutRef = useRef(new Map())
  const dragTaskRef = useRef(null)
  const dragSectionRef = useRef(null)

  // Derive ordered categories
  const displayTasks = previewTasks || tasks
  const rawCategories = useMemo(() => [...new Set(displayTasks.map(t => t.category))], [displayTasks])
  const categories = useMemo(() => {
    const ordered = categoryOrder.filter(c => rawCategories.includes(c))
    const rest = rawCategories.filter(c => !ordered.includes(c))
    return [...ordered, ...rest]
  }, [rawCategories, categoryOrder])
  const displayCategories = previewCategoryOrder || categories

  const getProgress = (cat) => {
    const ct = displayTasks.filter(t => t.category === cat && !t.hidden)
    const hidden = displayTasks.filter(t => t.category === cat && t.hidden).length
    return { done: ct.filter(t => t.completed).length + hidden, total: ct.length + hidden }
  }

  // Report stats up to Layout
  useEffect(() => {
    if (onStatsChange) {
      onStatsChange({ done: tasks.filter(t => t.completed).length, total: tasks.length })
    }
  }, [tasks, onStatsChange])

  // reset when tab icon re-tapped
  useEffect(() => {
    if (resetKey) {
      setExpandedTask(null); setShowNewTaskForm(null); setNewTaskText('')
      setShowNewCategoryForm(false); setNewCategoryName(''); setShowCompleted(false)
      setPreviewTasks(null); setPreviewCategoryOrder(null)
    }
  }, [resetKey])

  // Persist collapsed sections
  useEffect(() => {
    localStorage.setItem('bwCollapsed', JSON.stringify(collapsedSections))
  }, [collapsedSections])

  // Listen for trash restore events from Layout
  useEffect(() => {
    const handler = (e) => {
      restoreTask(e.detail)
    }
    window.addEventListener('restore-task', handler)
    return () => window.removeEventListener('restore-task', handler)
  }, [restoreTask])

  const toggleTask = (id, e) => {
    e?.stopPropagation()
    const task = tasks.find(t => t.id === id)
    if (!task.completed) {
      playSound('check')
      setCheckAnimating(id)
      setTimeout(() => setCheckAnimating(null), 600)
    }
    updateTask(id, { completed: !task.completed, completed_at: !task.completed ? new Date().toISOString() : null, hidden: task.completed ? false : task.hidden })
  }

  const sendToCompleted = (taskId, e) => {
    e?.stopPropagation()
    playSound('complete')
    setSendingComplete(taskId)
    setTimeout(() => {
      updateTask(taskId, { completed: true, completed_at: new Date().toISOString(), hidden: true })
      if (expandedTask === taskId) setExpandedTask(null)
      setSendingComplete(null)
    }, 500)
  }

  const handleAddTask = (cat) => {
    if (newTaskText.trim()) {
      addTask(cat, newTaskText.trim())
      setNewTaskText('')
      setShowNewTaskForm(null)
    }
  }

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      addTask(newCategoryName.trim(), 'New task')
      setNewCategoryName('')
      setShowNewCategoryForm(false)
    }
  }

  const handleDeleteTask = (id) => {
    const task = tasks.find(t => t.id === id)
    if (!task) return
    // add to trash
    const trash = JSON.parse(localStorage.getItem('bwTrashTasks') || '[]')
    trash.push({ ...task, deletedAt: new Date().toISOString() })
    localStorage.setItem('bwTrashTasks', JSON.stringify(trash))
    window.dispatchEvent(new CustomEvent('trash-updated'))
    deleteTask(id)
    if (expandedTask === id) setExpandedTask(null)
  }

  const renameCategory = (oldCat, newCat) => {
    if (!newCat.trim() || newCat === oldCat) { setEditingSectionName(null); return }
    tasks.filter(t => t.category === oldCat).forEach(t => updateTask(t.id, { category: newCat }))
    const newOrder = categoryOrder.map(c => c === oldCat ? newCat : c)
    setCategoryOrder(newOrder)
    setEditingSectionName(null)
  }

  const deleteCategory = (cat) => {
    if (!confirm(`Delete section "${cat}" and all its tasks?`)) return
    tasks.filter(t => t.category === cat).forEach(t => deleteTask(t.id))
  }

  const toggleSectionCollapse = (cat) => {
    setCollapsedSections(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])
  }

  // Notepad resize
  const startNotepadResize = (e) => {
    e.preventDefault()
    const startY = e.clientY; const startH = notepadHeight
    const onMove = (e) => {
      const h = Math.max(180, startH + (e.clientY - startY))
      setNotepadHeight(h); localStorage.setItem('bwNotepadHeight', h)
    }
    const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp) }
    document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp)
  }

  function orderedVisibleTasks(cat, source = displayTasks) {
    return source
      .filter(t => t.category === cat && !t.hidden)
      .sort(sortTasksForDisplay)
  }

  // Section drag
  const handleSectionDragStart = (e, cat) => {
    setDragSectionCat(cat)
    dragSectionRef.current = { cat, startOrder: displayCategories, latestOrder: displayCategories }
    e.dataTransfer.effectAllowed = 'move'
  }
  const handleSectionDragOver = (e, cat) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    const drag = dragSectionRef.current
    if (!drag?.cat || drag.cat === cat) return
    const current = drag.latestOrder || displayCategories
    const next = moveValue(current, drag.cat, cat)
    if (categoryLayoutSignature(next) === categoryLayoutSignature(current)) return
    animateLayoutShift(sectionLayoutRef, () => {
      drag.latestOrder = next
      setPreviewCategoryOrder(next)
      setDragOverSectionCat(cat)
    })
  }
  const finishSectionDrag = (save = true) => {
    const drag = dragSectionRef.current
    setDragSectionCat(null)
    setDragOverSectionCat(null)
    dragSectionRef.current = null
    if (save && drag?.latestOrder && categoryLayoutSignature(drag.latestOrder) !== categoryLayoutSignature(drag.startOrder)) {
      setCategoryOrder(drag.latestOrder)
    }
    requestAnimationFrame(() => setPreviewCategoryOrder(null))
  }
  const handleSectionDrop = (e, targetCat) => {
    e.preventDefault()
    e.stopPropagation()
    if (!dragSectionCat || !targetCat) {
      finishSectionDrag(false)
      return
    }
    handleSectionDragOver(e, targetCat)
    finishSectionDrag(true)
  }

  // Task drag
  const handleTaskDragStart = (e, taskId) => {
    e.stopPropagation()
    setDragTaskId(taskId)
    dragTaskRef.current = { taskId, startTasks: displayTasks, latestTasks: displayTasks }
    e.dataTransfer.effectAllowed = 'move'
  }
  const handleTaskDragOver = (e, taskId) => {
    const drag = dragTaskRef.current
    if (!drag?.taskId || drag.taskId === taskId) return
    const source = (drag.latestTasks || displayTasks).find(t => t.id === drag.taskId)
    const target = (drag.latestTasks || displayTasks).find(t => t.id === taskId)
    if (!source || !target || source.category !== target.category) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'

    const currentTasks = drag.latestTasks || displayTasks
    const categoryTasks = orderedVisibleTasks(source.category, currentTasks)
    const from = categoryTasks.findIndex(t => t.id === drag.taskId)
    const to = categoryTasks.findIndex(t => t.id === taskId)
    if (from < 0 || to < 0) return
    const reordered = [...categoryTasks]
    const [moved] = reordered.splice(from, 1)
    reordered.splice(from < to ? to - 1 : to, 0, moved)
    const normalized = reordered.map((task, index) => ({ ...task, sort_order: index }))
    const nextTasks = replaceCategoryTasks(currentTasks, source.category, normalized)
    if (taskLayoutSignature(nextTasks) === taskLayoutSignature(currentTasks)) return
    animateLayoutShift(taskLayoutRef, () => {
      drag.latestTasks = nextTasks
      setPreviewTasks(nextTasks)
      setDragOverTaskId(taskId)
    })
  }
  const finishTaskDrag = (save = true) => {
    const drag = dragTaskRef.current
    setDragTaskId(null)
    setDragOverTaskId(null)
    dragTaskRef.current = null
    if (save && drag?.latestTasks && taskLayoutSignature(drag.latestTasks) !== taskLayoutSignature(drag.startTasks)) {
      const source = drag.latestTasks.find(t => t.id === drag.taskId)
      if (source) {
        orderedVisibleTasks(source.category, drag.latestTasks).forEach((task, index) => {
          updateTask(task.id, { sort_order: index })
        })
      }
    }
    requestAnimationFrame(() => setPreviewTasks(null))
  }
  const handleTaskDrop = (e, targetId) => {
    e.preventDefault()
    e.stopPropagation()
    if (!dragTaskId || !targetId) {
      finishTaskDrag(false)
      return
    }
    handleTaskDragOver(e, targetId)
    finishTaskDrag(true)
  }

  const wordCount = notepadContent.trim().split(/\s+/).filter(w => w).length

  if (loading) return (
    <div className="p-4 pt-6 flex items-center justify-center h-64 text-gray-600 text-sm">Loading tasks...</div>
  )

  const completedTasks = tasks.filter(t => t.completed)

  return (
    <div className="p-3 pt-4 sm:p-4 sm:pt-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 max-w-5xl mx-auto">

        {/* ── Notepad (LEFT on desktop, hidden on mobile — accessed via button) ── */}
        <div
          className={`notepad-section glass-card rounded transition-all flex-shrink-0 hidden sm:block ${notepadCollapsed ? 'w-10' : 'w-96'}`}
          style={{ alignSelf: 'flex-start' }}
        >
          {notepadCollapsed ? (
            <button
              onClick={() => setNotepadCollapsed(false)}
              className="w-full p-2 flex flex-col items-center justify-start pt-4 text-gray-500 hover:text-brand-accent transition-all"
              style={{ height: notepadHeight }}
              title="Expand Notepad"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              <span className="text-[10px] mt-2" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>Notepad</span>
            </button>
          ) : (
            <div className="p-4 flex flex-col" style={{ height: notepadHeight }}>
              <div className="flex items-center justify-between mb-3 flex-shrink-0">
                <h3 className="text-sm font-semibold text-brand-accent flex items-center gap-2">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                  Notepad
                </h3>
                <div className="flex gap-1">
                  <button onClick={() => setNotepadCollapsed(true)} className="p-1 text-gray-500 hover:text-white hover:bg-white/10 rounded transition-all" title="Collapse">
                    <CollapseLeft />
                  </button>
                </div>
              </div>
              <textarea
                ref={notepadRef}
                value={notepadContent}
                onChange={e => updateContent(e.target.value)}
                placeholder={"Quick notes...\n\nJot anything down here."}
                className="flex-1 w-full p-2 bg-white/5 border border-white/10 rounded text-gray-300 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-brand-accent placeholder-gray-600"
              />
              <div className="flex items-center justify-between mt-2 flex-shrink-0">
                <div
                  onMouseDown={startNotepadResize}
                  className="flex items-center gap-1 text-gray-600 hover:text-gray-400 cursor-row-resize select-none transition-colors"
                  title="Drag to resize"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="16" y2="16"/></svg>
                </div>
                <div className="text-[10px] text-gray-600">{wordCount} word{wordCount !== 1 ? 's' : ''}</div>
              </div>
            </div>
          )}
        </div>

        {/* ── Tasks (RIGHT on desktop, full-width on mobile) ── */}
        <div className="tasks-section glass-card rounded p-3 sm:p-5 flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4 sm:mb-5 gap-2">
            <h2 className="text-base sm:text-lg font-semibold text-brand-accent">Tasks</h2>
            <div className="flex gap-1.5 sm:gap-2 flex-wrap justify-end">
              {/* Mobile-only Notes button */}
              <button
                onClick={() => setShowMobileNotepad(true)}
                className="sm:hidden px-2.5 py-2 bg-white/10 text-gray-300 rounded text-xs font-medium flex items-center gap-1 active:bg-white/20"
                title="Open notepad"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                Notes
              </button>
              <button
                onClick={() => setShowCompleted(v => !v)}
                className="px-2.5 sm:px-3 py-2 sm:py-1.5 bg-white/10 text-gray-300 rounded text-xs sm:text-sm font-medium flex items-center gap-1 hover:bg-white/20 active:bg-white/20 transition-all"
              >
                <CheckCircle /> <span className="hidden sm:inline">{showCompleted ? 'Hide Completed' : 'Completed'}</span><span className="sm:hidden">Done</span>
                {completedTasks.length > 0 && <span className="ml-0.5 sm:ml-1 text-xs text-gray-500">({completedTasks.length})</span>}
              </button>
              <button
                onClick={() => setShowNewCategoryForm(true)}
                className="btn-primary px-2.5 sm:px-3 py-2 sm:py-1.5 rounded text-white text-xs sm:text-sm font-medium flex items-center gap-1"
              >
                <Plus /> Section
              </button>
            </div>
          </div>

          {/* Completed tasks modal-ish */}
          {showCompleted && completedTasks.length > 0 && (
            <div className="mb-5 bg-white/5 rounded border border-white/10 p-3 animate-slideUp">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Completed</h3>
              <div className="space-y-1">
                {completedTasks.map(task => (
                  <div key={task.id} className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-white/5">
                    <button onClick={e => toggleTask(task.id, e)} className="flex-shrink-0 w-5 h-5 rounded border-2 bg-brand-success border-brand-success flex items-center justify-center"><Check /></button>
                    <span className="flex-1 text-sm text-gray-500 line-through">{task.text}</span>
                    <span className="text-xs text-gray-600">({task.category})</span>
                    <button onClick={() => handleDeleteTask(task.id)} className="p-0.5 text-red-400 hover:bg-white/10 rounded"><Trash2 size={12} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {showNewCategoryForm && (
            <div className="bg-white/5 p-3 rounded mb-4 border border-white/10 animate-slideUp">
              <input
                type="text" placeholder="Section name..." value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
                className="w-full px-3 py-2 bg-brand-dark border border-white/10 rounded text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-1 focus:ring-brand-accent mb-2"
                autoFocus
              />
              <div className="flex gap-2">
                <button onClick={handleAddCategory} className="btn-primary px-3 py-1 rounded text-white text-sm">Add</button>
                <button onClick={() => { setShowNewCategoryForm(false); setNewCategoryName('') }} className="px-3 py-1 bg-white/10 text-gray-300 rounded text-sm">Cancel</button>
              </div>
            </div>
          )}

          {displayCategories.length === 0 && (
            <div className="text-center py-12 text-gray-600">
              <p className="text-sm">No tasks yet.</p>
              <button onClick={() => setShowNewCategoryForm(true)} className="mt-2 text-xs text-brand-accent hover:text-brand-accent-hover">+ Add your first section</button>
            </div>
          )}

          {displayCategories.map(cat => {
            const { done, total } = getProgress(cat)
            const isCollapsed = collapsedSections.includes(cat)
            return (
              <div
                key={cat}
                ref={node => rememberLayoutNode(sectionLayoutRef, cat, node)}
                className={`mb-5 ${dragOverSectionCat === cat ? 'ring-1 ring-brand-accent/60 rounded p-1 -m-1' : ''}`}
                onDragOver={e => { if (dragSectionCat) handleSectionDragOver(e, cat) }}
                onDrop={e => { if (dragSectionCat) handleSectionDrop(e, cat) }}
              >
                {/* Section header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div
                      draggable
                      onDragStart={e => handleSectionDragStart(e, cat)}
                      onDragEnd={() => finishSectionDrag(true)}
                      className="cursor-grab text-gray-600 hover:text-gray-400 hidden sm:block"
                      title="Drag to reorder"
                    >
                      <GripV />
                    </div>
                    <button
                      onClick={() => toggleSectionCollapse(cat)}
                      className="p-0.5 text-gray-500 hover:text-white transition-all"
                      style={{ transform: isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)', transition: 'transform 0.15s' }}
                    >
                      <ChevronRight />
                    </button>
                    {editingSectionName?.cat === cat ? (
                      <input
                        autoFocus
                        value={editingSectionName.value}
                        onChange={e => setEditingSectionName({ cat, value: e.target.value })}
                        onBlur={() => renameCategory(cat, editingSectionName.value)}
                        onKeyDown={e => { if (e.key === 'Enter') renameCategory(cat, editingSectionName.value); if (e.key === 'Escape') setEditingSectionName(null) }}
                        onClick={e => e.stopPropagation()}
                        className="font-medium text-white bg-transparent border-b border-brand-accent/50 outline-none px-1"
                      />
                    ) : (
                      <h3
                        className="font-medium text-white cursor-pointer hover:text-brand-accent transition-all"
                        onDoubleClick={() => setEditingSectionName({ cat, value: cat })}
                        title="Double-click to rename"
                      >
                        {cat}
                      </h3>
                    )}
                    <span className="text-xs text-gray-500 bg-white/5 px-1.5 py-0.5 rounded">{done}/{total}</span>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => setShowNewTaskForm(cat)} className="p-2 sm:p-1 text-brand-accent hover:bg-white/10 active:bg-white/10 rounded transition-all"><Plus /></button>
                    <button onClick={() => deleteCategory(cat)} className="p-2 sm:p-1 text-red-400 hover:bg-white/10 active:bg-white/10 rounded transition-all"><Trash2 size={14} /></button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-white/10 rounded-full h-1 mb-3">
                  <div
                    className="bg-brand-success h-1 rounded-full transition-all"
                    style={{ width: `${total ? (done / total) * 100 : 0}%` }}
                  />
                </div>

                {/* New task form */}
                {!isCollapsed && showNewTaskForm === cat && (
                  <div className="bg-white/5 p-3 rounded mb-2 border border-white/10 animate-slideUp">
                    <input
                      type="text" placeholder="Task..." value={newTaskText}
                      onChange={e => setNewTaskText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddTask(cat)}
                      className="w-full px-3 py-2 bg-brand-dark border border-white/10 rounded text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-1 focus:ring-brand-accent mb-2"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button onClick={() => handleAddTask(cat)} className="btn-primary px-3 py-1 rounded text-white text-sm">Add</button>
                      <button onClick={() => { setShowNewTaskForm(null); setNewTaskText('') }} className="px-3 py-1 bg-white/10 text-gray-300 rounded text-sm">Cancel</button>
                    </div>
                  </div>
                )}

                {/* Task rows */}
                {!isCollapsed && (
                  <div className="space-y-1.5">
                    {orderedVisibleTasks(cat).map(task => (
                      <div
                        key={task.id}
                        ref={node => rememberLayoutNode(taskLayoutRef, task.id, node)}
                        className={`task-card bg-white/5 rounded overflow-hidden ${dragTaskId === task.id ? 'opacity-50' : ''} ${dragOverTaskId === task.id ? 'ring-1 ring-brand-accent/70' : ''} ${sendingComplete === task.id ? 'send-complete-animate' : ''} ${checkAnimating === task.id ? 'task-success-flash' : ''}`}
                        onDragOver={e => handleTaskDragOver(e, task.id)}
                        onDrop={e => { if (dragTaskId) handleTaskDrop(e, task.id) }}
                        onDragEnd={() => finishTaskDrag(true)}
                        onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                      >
                        <div className="flex items-center gap-1 sm:gap-1 p-2.5 sm:p-3 cursor-pointer">
                          <span
                            className="task-drag-handle flex-shrink-0 text-gray-500 hover:text-brand-accent mr-1 hidden sm:flex"
                            draggable
                            onDragStart={e => handleTaskDragStart(e, task.id)}
                            onClick={e => e.stopPropagation()}
                            title="Drag to reorder"
                          >
                            <GripV />
                          </span>
                          <button
                            onClick={e => toggleTask(task.id, e)}
                            className={`relative flex-shrink-0 w-6 h-6 sm:w-5 sm:h-5 rounded border-2 flex items-center justify-center transition-all ${task.completed ? 'bg-brand-success border-brand-success' : 'border-gray-600 hover:border-brand-accent'} ${checkAnimating === task.id ? 'check-animate' : ''}`}
                          >
                            {task.completed && <Check />}
                          </button>
                          <span className={`flex-1 text-sm sm:text-sm ml-1 ${task.completed ? 'line-through text-gray-500' : 'text-gray-200'}`}>
                            {task.text}
                          </span>
                          <button
                            onClick={e => sendToCompleted(task.id, e)}
                            className="p-2 sm:p-1.5 text-brand-success hover:bg-white/10 active:bg-white/10 rounded transition-all"
                            title="Send to Completed"
                          >
                            <CheckCircle />
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); handleDeleteTask(task.id, cat) }}
                            className="p-2 sm:p-1 text-red-400 hover:bg-white/10 active:bg-white/10 rounded transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        {expandedTask === task.id && (
                          <div className="border-t border-white/10 p-4 bg-brand-dark/50 space-y-4 animate-slideUp" onClick={e => e.stopPropagation()}>
                            <div>
                              <h4 className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Notes</h4>
                              <textarea
                                defaultValue={task.notes || ''}
                                onBlur={e => updateTask(task.id, { notes: e.target.value })}
                                placeholder="Add notes..."
                                className="w-full p-2 bg-white/5 border border-white/10 rounded text-gray-300 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-brand-accent"
                                rows={3}
                                onMouseDown={e => e.stopPropagation()}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* === Mobile Notepad bottom sheet === */}
      {showMobileNotepad && (
        <div className="fixed inset-0 z-50 sm:hidden flex flex-col">
          <div
            className="flex-1 bg-black/60 animate-fadeIn"
            onClick={() => setShowMobileNotepad(false)}
          />
          <div
            className="glass-card border-t border-brand-accent/30 rounded-t-2xl pb-safe flex flex-col"
            style={{ height: '75vh', animation: 'drawerSlideIn 0.22s ease', transform: 'none' }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <h3 className="text-sm font-semibold text-brand-accent flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                Notepad
              </h3>
              <button onClick={() => setShowMobileNotepad(false)} className="nav-icon" title="Close notepad" aria-label="Close notepad">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <textarea
              value={notepadContent}
              onChange={e => updateContent(e.target.value)}
              placeholder={"Quick notes...\n\nJot anything down here."}
              className="flex-1 w-full p-4 bg-transparent text-gray-300 text-base resize-none focus:outline-none placeholder-gray-600"
              autoFocus
            />
            <div className="px-4 py-2 text-xs text-gray-600 border-t border-white/5">
              {wordCount} word{wordCount !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
