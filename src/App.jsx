/* eslint-disable react/prop-types */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useUser } from './hooks/useUser'
import Auth from './views/Auth'
import Tasks from './views/Tasks'
import Formulas from './views/Formulas'
import Affiliates from './views/Affiliates'
import Sheets from './views/Sheets'
import Editor from './views/Editor'
import Layout from './components/Layout'
import LoadingScreen from './components/LoadingScreen'

const VIEW_LABELS = {
  tasks: 'Tasks',
  affiliates: 'Affiliates',
  formulas: 'Formulas',
  sheets: 'Sheets',
  editor: 'Editor',
}
const MAX_PANES = 4

function paneId() {
  return globalThis.crypto?.randomUUID?.() || `pane-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function makePane(view = 'tasks', extras = {}) {
  return { id: paneId(), view, sheetId: null, title: null, ...extras }
}

function paneTitle(pane) {
  return pane?.title || VIEW_LABELS[pane?.view] || 'Pane'
}

function splitLayoutFor(position, nextCount) {
  if (nextCount >= 4) return 'grid'
  return position === 'top' || position === 'bottom' ? 'rows' : 'columns'
}

function parseSplitPayload(event) {
  if (!event.dataTransfer) return null
  const raw = event.dataTransfer.getData('application/x-bw-split')
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (!parsed?.view || !VIEW_LABELS[parsed.view]) return null
    return parsed
  } catch {
    return null
  }
}

function ClosePaneIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
}

function SplitDropOverlay({ show, paneCount, onDrop, onHover }) {
  if (!show || paneCount >= MAX_PANES) return null
  const zone = 'absolute pointer-events-auto rounded border border-brand-accent/40 bg-brand-accent/15 text-brand-accent text-xs font-semibold backdrop-blur-sm flex items-center justify-center shadow-lg shadow-black/30'
  const handleOver = (position) => (event) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
    onHover(position)
  }
  const drop = (position) => (event) => {
    event.preventDefault()
    event.stopPropagation()
    onDrop(position, event)
  }

  return (
    <div className="hidden sm:block fixed top-[calc(48px+env(safe-area-inset-top,0px))] bottom-0 left-0 right-0 z-[70] pointer-events-none">
      <div className={`${zone} left-[340px] top-1/2 -translate-y-1/2 w-24 h-28`} onDragEnter={handleOver('left')} onDragOver={handleOver('left')} onDrop={drop('left')} onMouseUp={drop('left')}>Left</div>
      <div className={`${zone} right-4 top-1/2 -translate-y-1/2 w-24 h-28`} onDragEnter={handleOver('right')} onDragOver={handleOver('right')} onDrop={drop('right')} onMouseUp={drop('right')}>Right</div>
      <div className={`${zone} top-4 left-1/2 -translate-x-1/2 w-36 h-14`} onDragEnter={handleOver('top')} onDragOver={handleOver('top')} onDrop={drop('top')} onMouseUp={drop('top')}>Top</div>
      <div className={`${zone} bottom-4 left-1/2 -translate-x-1/2 w-36 h-14`} onDragEnter={handleOver('bottom')} onDragOver={handleOver('bottom')} onDrop={drop('bottom')} onMouseUp={drop('bottom')}>Bottom</div>
    </div>
  )
}

function SplitIcon() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M12 4v16"/></svg>
}

export default function App() {
  const { user, loading } = useUser()
  const [panes, setPanes] = useState(() => [makePane('tasks')])
  const [activePaneId, setActivePaneId] = useState(() => panes[0]?.id)
  const [splitLayout, setSplitLayout] = useState('columns')
  const [splitDragging, setSplitDragging] = useState(false)
  const [splitPayload, setSplitPayload] = useState(null)
  const [taskStats, setTaskStats] = useState(null)
  const [resetKeys, setResetKeys] = useState({ tasks: 0, formulas: 0, affiliates: 0, sheets: 0, editor: 0 })

  // Global undo/redo — any view can register its handlers here
  const undoRef = useRef(null)
  const redoRef = useRef(null)
  const splitPayloadRef = useRef(null)
  const splitHoverRef = useRef(null)
  const splitCleanupTimerRef = useRef(null)

  const registerUndo = useCallback((undoFn, redoFn) => {
    undoRef.current = undoFn
    redoRef.current = redoFn
  }, [])

  const handleUndo = () => undoRef.current?.()
  const handleRedo = () => redoRef.current?.()

  const activePane = panes.find(pane => pane.id === activePaneId) || panes[0]
  const activeView = activePane?.view || 'tasks'

  // Global keyboard shortcut: Ctrl+Z / Ctrl+Shift+Z when NOT in an input/textarea
  useEffect(() => {
    function onKeyDown(e) {
      const isEditing = ['INPUT', 'TEXTAREA'].includes(e.target.tagName) || e.target.isContentEditable
      if (isEditing) return
      const ctrl = e.ctrlKey || e.metaKey
      if (!ctrl) return
      const key = e.key.toLowerCase()
      if (key === 'z' && !e.shiftKey) { e.preventDefault(); undoRef.current?.() }
      if ((key === 'z' && e.shiftKey) || key === 'y') { e.preventDefault(); redoRef.current?.() }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  const handlePaneSheetChange = (paneIdForSheet, sheet) => {
    if (!sheet?.id) return
    setPanes(prev => {
      let changed = false
      const next = prev.map(pane => {
        if (pane.id !== paneIdForSheet) return pane
        if (pane.sheetId === sheet.id && pane.title === sheet.name) return pane
        changed = true
        return { ...pane, sheetId: sheet.id, title: sheet.name }
      })
      return changed ? next : prev
    })
  }

  function rememberSplitPayload(payload) {
    splitPayloadRef.current = payload
    setSplitPayload(payload)
  }

  function rememberSplitHover(position) {
    splitHoverRef.current = position
  }

  function clearSplitDrag() {
    clearTimeout(splitCleanupTimerRef.current)
    splitPayloadRef.current = null
    splitHoverRef.current = null
    setSplitDragging(false)
    setSplitPayload(null)
  }

  function startSplitDrag(payload) {
    rememberSplitPayload(payload)
    setSplitDragging(true)
    clearTimeout(splitCleanupTimerRef.current)
    splitCleanupTimerRef.current = setTimeout(clearSplitDrag, 8000)
  }

  // Tapping the active tab resets it; tapping a different tab switches to it
  const handleTabPress = (v) => {
    clearSplitDrag()
    const targetPaneId = panes.some(pane => pane.id === activePaneId) ? activePaneId : panes[0]?.id
    const targetPane = panes.find(pane => pane.id === targetPaneId) || panes[0]

    if (v === targetPane?.view && !targetPane?.sheetId) {
      setResetKeys(k => ({ ...k, [v]: k[v] + 1 }))
    } else {
      setPanes(prev => {
        if (!targetPaneId) return [makePane(v)]
        return prev.map(pane => pane.id === targetPaneId ? { ...pane, view: v, sheetId: null, title: null } : pane)
      })
      if (targetPaneId) setActivePaneId(targetPaneId)
      // Clear undo state when switching views (each view re-registers on mount)
      undoRef.current = null
      redoRef.current = null
    }
  }

  const handleTabDragStart = (event, view) => {
    const payload = { view }
    event.dataTransfer.effectAllowed = 'copy'
    event.dataTransfer.setData('application/x-bw-split', JSON.stringify(payload))
    startSplitDrag(payload)
  }

  const handleSplitDragEnd = () => {
    if (splitPayloadRef.current && splitHoverRef.current) {
      addSplitPane(splitPayloadRef.current, splitHoverRef.current)
    }
    clearSplitDrag()
  }

  const addSplitPane = (payload, position) => {
    if (!payload?.view) return

    const nextPane = makePane(payload.view, {
      sheetId: payload.sheetId || null,
      title: payload.title || null,
    })
    setPanes(prev => {
      if (prev.length >= MAX_PANES) return prev
      const activeIndex = Math.max(0, prev.findIndex(pane => pane.id === activePaneId))
      const insertAt = position === 'left' || position === 'top' ? activeIndex : activeIndex + 1
      const next = [...prev]
      next.splice(insertAt, 0, nextPane)
      return next
    })
    setSplitLayout(splitLayoutFor(position, Math.min(MAX_PANES, panes.length + 1)))
    setActivePaneId(nextPane.id)
    undoRef.current = null
    redoRef.current = null
  }

  useEffect(() => {
    function onSplitDragStart(event) {
      if (event.detail?.view) startSplitDrag(event.detail)
    }
    function onSplitDragEnd() {
      if (splitPayloadRef.current && splitHoverRef.current) {
        addSplitPane(splitPayloadRef.current, splitHoverRef.current)
      }
      clearSplitDrag()
    }
    function onGlobalDrop() {
      clearSplitDrag()
    }
    window.addEventListener('bw-split-drag-start', onSplitDragStart)
    window.addEventListener('bw-split-drag-end', onSplitDragEnd)
    window.addEventListener('drop', onGlobalDrop)
    window.addEventListener('dragend', onGlobalDrop)
    window.addEventListener('blur', clearSplitDrag)
    return () => {
      window.removeEventListener('bw-split-drag-start', onSplitDragStart)
      window.removeEventListener('bw-split-drag-end', onSplitDragEnd)
      window.removeEventListener('drop', onGlobalDrop)
      window.removeEventListener('dragend', onGlobalDrop)
      window.removeEventListener('blur', clearSplitDrag)
    }
  })

  useEffect(() => () => clearTimeout(splitCleanupTimerRef.current), [])

  const handleSplitDrop = (position, event) => {
    const payload = parseSplitPayload(event) || splitPayloadRef.current || splitPayload
    clearSplitDrag()
    if (!payload) return
    addSplitPane(payload, position)
  }

  const closePane = (paneIdToClose) => {
    setPanes(prev => {
      if (prev.length <= 1) return prev
      const closingIndex = prev.findIndex(pane => pane.id === paneIdToClose)
      const next = prev.filter(pane => pane.id !== paneIdToClose)
      if (paneIdToClose === activePaneId) {
        const nextActive = next[Math.min(Math.max(closingIndex, 0), next.length - 1)] || next[0]
        setActivePaneId(nextActive.id)
      }
      if (next.length < 4 && splitLayout === 'grid') setSplitLayout('columns')
      return next
    })
  }

  const splitActivePane = (position) => {
    addSplitPane({
      view: activePane?.view || activeView,
      sheetId: activePane?.sheetId || null,
      title: activePane?.title || null,
    }, position)
  }

  const splitPane = (pane, position) => {
    addSplitPane({
      view: pane?.view || 'tasks',
      sheetId: pane?.sheetId || null,
      title: pane?.title || null,
    }, position)
  }

  const renderPaneContent = (pane, embedded = false) => {
    const isActivePane = pane.id === activePaneId
    const registerPaneUndo = isActivePane ? registerUndo : undefined

    switch (pane.view) {
      case 'formulas':
        return <Formulas userId={user.id} resetKey={resetKeys.formulas} registerUndo={registerPaneUndo} embedded={embedded} />
      case 'affiliates':
        return <Affiliates userId={user.id} resetKey={resetKeys.affiliates} embedded={embedded} />
      case 'sheets':
        return (
          <Sheets
            userId={user.id}
            resetKey={resetKeys.sheets}
            registerUndo={registerPaneUndo}
            embedded={embedded}
            focusSheetId={pane.sheetId}
            onActiveSheetChange={sheet => handlePaneSheetChange(pane.id, sheet)}
          />
        )
      case 'editor':
        return <Editor userId={user.id} resetKey={resetKeys.editor} registerUndo={registerPaneUndo} embedded={embedded} />
      case 'tasks':
      default:
        return <Tasks userId={user.id} onStatsChange={isActivePane ? setTaskStats : undefined} resetKey={resetKeys.tasks} embedded={embedded} />
    }
  }

  const splitStyle = panes.length >= 4
    ? { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gridTemplateRows: 'repeat(2, minmax(0, 1fr))' }
    : splitLayout === 'rows'
      ? { gridTemplateRows: `repeat(${panes.length}, minmax(0, 1fr))` }
      : { gridTemplateColumns: `repeat(${panes.length}, minmax(0, 1fr))` }
  const workspaceStyle = {
    ...splitStyle,
    height: 'calc(100dvh - 48px - env(safe-area-inset-top, 0px))',
  }

  if (loading) return <LoadingScreen />
  if (!user) return <Auth />

  return (
    <Layout
      user={user}
      activeView={activeView}
      setActiveView={handleTabPress}
      taskStats={taskStats}
      onUndo={handleUndo}
      onRedo={handleRedo}
      onTabDragStart={handleTabDragStart}
      onSplitDragEnd={handleSplitDragEnd}
    >
      {panes.length === 1 ? (
        renderPaneContent(activePane, false)
      ) : (
        <div className="min-h-0 p-2 grid gap-2 overflow-hidden animate-fadeIn" style={workspaceStyle}>
          {panes.map(pane => {
            const isActivePane = pane.id === activePaneId
            const scrollPane = pane.view === 'tasks' || pane.view === 'affiliates'
            return (
              <section
                key={pane.id}
                onMouseDown={() => setActivePaneId(pane.id)}
                className={`glass-card rounded min-w-0 min-h-0 overflow-hidden flex flex-col border transition-colors ${isActivePane ? 'border-brand-accent/35' : 'border-white/10'}`}
              >
                <div className="h-9 shrink-0 border-b border-white/10 flex items-center justify-between gap-2 px-3">
                  <div className="min-w-0 flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActivePane ? 'bg-brand-accent' : 'bg-white/20'}`} />
                    <span className="text-xs font-semibold text-white truncate">{paneTitle(pane)}</span>
                    <span className="text-[10px] uppercase tracking-wide text-gray-600 shrink-0">{VIEW_LABELS[pane.view]}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {panes.length < MAX_PANES && (
                      <button
                        onClick={event => { event.stopPropagation(); setActivePaneId(pane.id); splitPane(pane, 'right') }}
                        className="p-1 rounded text-gray-500 hover:text-white hover:bg-white/10 transition-all"
                        title="Split this pane right"
                        aria-label={`Split ${paneTitle(pane)} right`}
                      >
                        <SplitIcon />
                      </button>
                    )}
                    <button
                      onClick={event => { event.stopPropagation(); closePane(pane.id) }}
                      className="p-1 rounded text-gray-500 hover:text-white hover:bg-white/10 transition-all"
                      title="Close split"
                      aria-label={`Close ${paneTitle(pane)} split`}
                    >
                      <ClosePaneIcon />
                    </button>
                  </div>
                </div>
                <div className={`flex-1 min-h-0 ${scrollPane ? 'overflow-auto' : 'overflow-hidden'}`}>
                  {renderPaneContent(pane, true)}
                </div>
              </section>
            )
          })}
        </div>
      )}
      {panes.length === 1 && (
        <div className="hidden sm:flex fixed right-3 bottom-3 z-30 gap-1 rounded border border-white/10 bg-[#1f1f1f]/95 p-1 shadow-lg">
          <button onClick={() => splitActivePane('right')} className="px-2 py-1.5 rounded text-xs text-gray-300 hover:text-white hover:bg-white/10 flex items-center gap-1" title="Split current view right">
            <SplitIcon /> Right
          </button>
          <button onClick={() => splitActivePane('bottom')} className="px-2 py-1.5 rounded text-xs text-gray-300 hover:text-white hover:bg-white/10" title="Split current view below">
            Bottom
          </button>
        </div>
      )}
      <SplitDropOverlay show={splitDragging} paneCount={panes.length} onDrop={handleSplitDrop} onHover={rememberSplitHover} />
    </Layout>
  )
}
