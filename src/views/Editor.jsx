import { useState, useEffect, useRef, useCallback } from 'react'
import { useEditorFiles } from '../hooks/useEditorFiles'

// ── icons ─────────────────────────────────────────────────────────────────────
const FolderIcon = ({ open }) => open
  ? <svg width="14" height="14" viewBox="0 0 24 24" fill="rgba(196,94,44,0.7)" stroke="rgba(196,94,44,0.9)" strokeWidth="1.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
  : <svg width="14" height="14" viewBox="0 0 24 24" fill="rgba(196,94,44,0.3)" stroke="rgba(196,94,44,0.6)" strokeWidth="1.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>

const FileIcon = ({ ext }) => {
  const color = ext === 'md' ? '#7dd3fc' : ext === 'html' || ext === 'htm' ? '#f97316'
    : ext === 'js' || ext === 'jsx' ? '#fbbf24' : ext === 'ts' || ext === 'tsx' ? '#60a5fa'
    : ext === 'json' ? '#a3e635' : ext === 'css' ? '#c084fc' : '#9ca3af'
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
}

const Icon = ({ d, w = 14, h = 14, title }) => (
  <svg width={w} height={h} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" title={title}>
    {Array.isArray(d) ? d.map((p, i) => p.startsWith('M') || p.startsWith('L') || p.startsWith('C') || p.startsWith('A')
      ? <path key={i} d={p} /> : <polyline key={i} points={p} />)
      : <path d={d} />}
  </svg>
)

const PlusIco    = () => <Icon d="M12 5v14M5 12h14" />
const FolderPlus = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>
const TrashIco   = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
const ChevR      = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
const ChevD      = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
const SaveIco    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
const MenuIco    = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
const FullIco    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
const ExitFull   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>
const SearchIco  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
const CloseIco   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const DownloadIco= () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
const UndoIco    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>
const RedoIco    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 14 20 9 15 4"/><path d="M4 20v-7a4 4 0 0 1 4-4h12"/></svg>

// ── file type helpers ─────────────────────────────────────────────────────────
const getExt = (name) => { const p = name.lastIndexOf('.'); return p > 0 ? name.slice(p + 1).toLowerCase() : '' }
const isMarkdown = (name) => ['md', 'markdown'].includes(getExt(name))
const isHtml     = (name) => ['html', 'htm'].includes(getExt(name))
const isText     = (name) => ['md','markdown','txt','html','htm','js','jsx','ts','tsx','css','json','xml','csv','sh','py','rb','go','yaml','yml','toml','sql'].includes(getExt(name))

// ── persistent undo helpers ───────────────────────────────────────────────────
const UNDO_KEY  = (p) => `bwUndo:${p}`
const REDO_KEY  = (p) => `bwRedo:${p}`
const MAX_HIST  = 100

function loadStack(key) {
  try { return JSON.parse(localStorage.getItem(key)) || [] } catch { return [] }
}
function saveStack(key, arr) {
  try { localStorage.setItem(key, JSON.stringify(arr)) } catch {}
}

// ── simple markdown renderer ──────────────────────────────────────────────────
function renderMd(md) {
  if (!md) return ''
  let html = md
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/```([\w]*)\n([\s\S]*?)```/g, (_, lang, code) =>
      `<pre class="md-code-block"><code class="lang-${lang}">${code.trimEnd()}</code></pre>`)
    .replace(/^#{6}\s+(.+)$/gm,'<h6>$1</h6>')
    .replace(/^#{5}\s+(.+)$/gm,'<h5>$1</h5>')
    .replace(/^#{4}\s+(.+)$/gm,'<h4>$1</h4>')
    .replace(/^###\s+(.+)$/gm,'<h3>$1</h3>')
    .replace(/^##\s+(.+)$/gm,'<h2>$1</h2>')
    .replace(/^#\s+(.+)$/gm,'<h1>$1</h1>')
    .replace(/^>\s+(.+)$/gm,'<blockquote>$1</blockquote>')
    .replace(/^---+$/gm,'<hr>')
    .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
    .replace(/\*(.+?)\*/g,'<em>$1</em>')
    .replace(/~~(.+?)~~/g,'<del>$1</del>')
    .replace(/`([^`]+)`/g,'<code>$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/^[-*]\s+(.+)$/gm,'<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, s => `<ul>${s}</ul>`)
    .replace(/^\d+\.\s+(.+)$/gm,'<li>$1</li>')
    .replace(/\n\n/g,'</p><p>')
  return `<p>${html}</p>`
}

// ── context menu ─────────────────────────────────────────────────────────────
function ContextMenu({ menu, onClose }) {
  useEffect(() => {
    const fn = () => onClose()
    document.addEventListener('click', fn, { once: true })
    return () => document.removeEventListener('click', fn)
  }, [onClose])
  if (!menu) return null
  return (
    <div className="context-menu animate-scaleIn" style={{ left: menu.x, top: menu.y, zIndex: 500 }}>
      {menu.items.map((item, i) => item.sep
        ? <div key={i} className="border-t border-white/5 my-1" />
        : <div key={i} onClick={e => { e.stopPropagation(); item.action(); onClose() }}
            className={`context-menu-item ${item.danger ? 'danger' : ''}`}>{item.label}</div>
      )}
    </div>
  )
}

// ── tree node ─────────────────────────────────────────────────────────────────
function TreeNode({ node, files, depth = 0, activeFile, openFolders, onSelect, onToggle, onCtx, renaming, renameValue, setRenameValue, onRenameBlur, onRenameKey }) {
  const children = files.filter(n => n.parent_path === node.path).sort((a, b) => {
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1
    return a.name.localeCompare(b.name)
  })
  const isOpen   = openFolders.has(node.path)
  const isActive = activeFile?.path === node.path
  const ext      = node.type === 'file' ? getExt(node.name) : ''

  return (
    <div>
      <div
        className={`flex items-center gap-1.5 py-1.5 sm:py-0.5 px-2 rounded cursor-pointer group transition-all
          ${isActive ? 'bg-brand-accent/15 text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 active:bg-white/10'}`}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
        onClick={() => node.type === 'folder' ? onToggle(node.path) : onSelect(node)}
        onContextMenu={e => { e.preventDefault(); e.stopPropagation(); onCtx(e, node) }}
      >
        {node.type === 'folder' && (
          <span className="text-gray-600 w-3 flex-shrink-0">
            {isOpen ? <ChevD /> : <ChevR />}
          </span>
        )}
        {node.type === 'folder' ? <FolderIcon open={isOpen} /> : <FileIcon ext={ext} />}
        {renaming?.path === node.path ? (
          <input
            autoFocus
            value={renameValue}
            onChange={e => setRenameValue(e.target.value)}
            onBlur={onRenameBlur}
            onKeyDown={onRenameKey}
            onClick={e => e.stopPropagation()}
            className="flex-1 bg-black/40 border border-brand-accent/40 outline-none px-1 rounded text-white text-xs"
          />
        ) : (
          <span className="flex-1 text-xs truncate select-none">{node.name}</span>
        )}
      </div>
      {node.type === 'folder' && isOpen && children.map(child => (
        <TreeNode key={child.id} node={child} files={files} depth={depth + 1}
          activeFile={activeFile} openFolders={openFolders}
          onSelect={onSelect} onToggle={onToggle} onCtx={onCtx}
          renaming={renaming} renameValue={renameValue}
          setRenameValue={setRenameValue} onRenameBlur={onRenameBlur} onRenameKey={onRenameKey}
        />
      ))}
    </div>
  )
}

// ── toolbar button ────────────────────────────────────────────────────────────
function TB({ onClick, title, active, disabled, children }) {
  return (
    <button
      onMouseDown={e => { e.preventDefault(); if (!disabled) onClick() }}
      title={title}
      disabled={disabled}
      className={`px-1.5 py-1 rounded text-xs transition-all select-none
        ${disabled ? 'opacity-25 cursor-not-allowed' : active ? 'bg-brand-accent/30 text-brand-accent' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
    >
      {children}
    </button>
  )
}

// ── stat helpers ──────────────────────────────────────────────────────────────
function getWordCount(text) { return text.trim().split(/\s+/).filter(Boolean).length }
function getReadTime(text)  { return Math.max(1, Math.round(getWordCount(text) / 200)) }
function getCursorPos(text, idx) {
  const lines = text.slice(0, idx).split('\n')
  return { line: lines.length, col: lines[lines.length - 1].length + 1 }
}

// ── main component ────────────────────────────────────────────────────────────
export default function Editor({ userId }) {
  const { files, loading, createNode, saveContent, deleteNode, renameNode } = useEditorFiles(userId)

  const [activeFile, setActiveFile]       = useState(null)
  const [content, setContent]             = useState('')
  const [saveStatus, setSaveStatus]       = useState('saved')
  const [openFolders, setOpenFolders]     = useState(new Set())
  const [contextMenu, setContextMenu]     = useState(null)
  const [renaming, setRenaming]           = useState(null)
  const [renameValue, setRenameValue]     = useState('')
  const [newItemTarget, setNewItemTarget] = useState(null)
  const [newItemName, setNewItemName]     = useState('')
  const [viewMode, setViewMode]           = useState('source')
  const [leftW, setLeftW]                 = useState(() => parseInt(localStorage.getItem('bwEditorLeftW') || '240', 10))
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)
  const [fullScreen, setFullScreen]       = useState(false)
  const [showFind, setShowFind]           = useState(false)
  const [findQuery, setFindQuery]         = useState('')
  const [cursorPos, setCursorPos]         = useState({ line: 1, col: 1 })
  const [openTabs, setOpenTabs]           = useState([])
  const [historyVer, setHistoryVer]       = useState(0) // triggers re-render for canUndo/canRedo

  const textareaRef        = useRef(null)
  const saveTimer          = useRef(null)
  const checkpointTimer    = useRef(null)
  const resizing           = useRef(false)
  const savedContentRef    = useRef('')  // last content written to DB
  const undoRef            = useRef([]) // string[] — before-snapshots
  const redoRef            = useRef([]) // string[] — after-snapshots
  const baselineRef        = useRef('') // content at last undo boundary (the "before" for next session)
  const sessionStartRef    = useRef(null) // content captured when typing session begins (null = no session)
  const isUndoingRef       = useRef(false) // true during undo/redo so the effect doesn't start a new session

  const canUndo = undoRef.current.length > 0
  const canRedo = redoRef.current.length > 0

  // ── helpers ────────────────────────────────────────────────────────────────
  function bumpHistory() { setHistoryVer(v => v + 1) }

  function loadHistory(path) {
    undoRef.current = loadStack(UNDO_KEY(path))
    redoRef.current = loadStack(REDO_KEY(path))
    bumpHistory()
  }

  // Push `snapshot` as a before-state onto the undo stack
  function pushToUndo(snapshot, path = activeFile?.path) {
    if (!path) return
    const next = [...undoRef.current, snapshot].slice(-MAX_HIST)
    undoRef.current = next
    redoRef.current = []
    saveStack(UNDO_KEY(path), next)
    try { localStorage.removeItem(REDO_KEY(path)) } catch {}
    bumpHistory()
  }

  function performUndo() {
    if (!activeFile || undoRef.current.length === 0) return
    clearTimeout(checkpointTimer.current)
    sessionStartRef.current = null
    const prev    = undoRef.current[undoRef.current.length - 1]
    const curr    = content
    const newUndo = undoRef.current.slice(0, -1)
    const newRedo = [...redoRef.current, curr].slice(-MAX_HIST)
    undoRef.current = newUndo
    redoRef.current = newRedo
    saveStack(UNDO_KEY(activeFile.path), newUndo)
    saveStack(REDO_KEY(activeFile.path), newRedo)
    baselineRef.current = prev
    isUndoingRef.current = true
    setContent(prev)
    bumpHistory()
  }

  function performRedo() {
    if (!activeFile || redoRef.current.length === 0) return
    clearTimeout(checkpointTimer.current)
    sessionStartRef.current = null
    const next    = redoRef.current[redoRef.current.length - 1]
    const curr    = content
    const newRedo = redoRef.current.slice(0, -1)
    const newUndo = [...undoRef.current, curr].slice(-MAX_HIST)
    undoRef.current = newUndo
    redoRef.current = newRedo
    saveStack(UNDO_KEY(activeFile.path), newUndo)
    saveStack(REDO_KEY(activeFile.path), newRedo)
    baselineRef.current = next
    isUndoingRef.current = true
    setContent(next)
    bumpHistory()
  }

  // ── persist panel width ───────────────────────────────────────────────────
  useEffect(() => { localStorage.setItem('bwEditorLeftW', String(leftW)) }, [leftW])

  // ── close drawer when file opens ──────────────────────────────────────────
  useEffect(() => { if (activeFile) setShowMobileSidebar(false) }, [activeFile?.path])

  // ── force off split on mobile ─────────────────────────────────────────────
  useEffect(() => {
    const fn = () => { if (window.innerWidth < 640 && viewMode === 'split') setViewMode('source') }
    fn(); window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [viewMode])

  // ── load content when switching files ─────────────────────────────────────
  useEffect(() => {
    if (!activeFile) return
    const f = files.find(f => f.path === activeFile.path)
    if (!f) return
    const c = f.content || ''
    clearTimeout(checkpointTimer.current)
    sessionStartRef.current = null
    isUndoingRef.current = true   // don't treat file-load as a typing session start
    setContent(c)
    setSaveStatus('saved')
    savedContentRef.current = c
    baselineRef.current = c
    loadHistory(activeFile.path)
  }, [activeFile?.path]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── realtime sync — only apply if no unsaved local changes ────────────────
  useEffect(() => {
    if (!activeFile) return
    const f = files.find(f => f.path === activeFile.path)
    if (!f) return
    const dbContent = f.content || ''
    if (dbContent === savedContentRef.current) return // nothing changed remotely
    // Another device saved — apply only if we have no local edits
    const prevSaved = savedContentRef.current
    savedContentRef.current = dbContent
    setContent(curr => {
      if (curr === prevSaved) {
        // No local unsaved changes — accept remote version
        baselineRef.current = dbContent
        isUndoingRef.current = true
        return dbContent
      }
      return curr
    })
  }, [files]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── auto-save + checkpoint debounce ──────────────────────────────────────
  useEffect(() => {
    if (!activeFile) return

    // If this change was triggered by undo/redo, skip checkpoint logic
    if (isUndoingRef.current) {
      isUndoingRef.current = false
      // Still handle save status
      if (content === savedContentRef.current) setSaveStatus('saved')
      else setSaveStatus('modified')
      return
    }

    if (content === savedContentRef.current) { setSaveStatus('saved'); return }
    setSaveStatus('modified')

    // On the FIRST keystroke of a new typing session, capture the before-state
    if (sessionStartRef.current === null) {
      sessionStartRef.current = baselineRef.current
    }

    // After 1 s of no typing, push the session-start content as the undo checkpoint
    clearTimeout(checkpointTimer.current)
    checkpointTimer.current = setTimeout(() => {
      const before = sessionStartRef.current
      sessionStartRef.current = null
      // Only push if the before-state differs from what we'd restore to
      if (before !== null && before !== content) {
        pushToUndo(before)
        baselineRef.current = content // new baseline is current content
      }
    }, 1000)

    // Auto-save after 1.2 s
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      setSaveStatus('saving')
      await saveContent(activeFile.path, content)
      savedContentRef.current = content
      setSaveStatus('saved')
    }, 1200)

    return () => { clearTimeout(saveTimer.current); clearTimeout(checkpointTimer.current) }
  }, [content]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const fn = (e) => {
      const mod = e.ctrlKey || e.metaKey
      if (!mod) return
      if (e.key === 's')                          { e.preventDefault(); forceSave() }
      if (e.key === 'f')                          { e.preventDefault(); setShowFind(v => !v) }
      if (e.key === 'b')                          { e.preventDefault(); applyFormat('bold') }
      if (e.key === 'i')                          { e.preventDefault(); applyFormat('italic') }
      if (e.key === 'k')                          { e.preventDefault(); applyFormat('link') }
      if (e.key === 'z' && !e.shiftKey)           { e.preventDefault(); performUndo() }
      if (e.key === 'y' || (e.shiftKey && e.key === 'Z')) { e.preventDefault(); performRedo() }
      if (e.key === 'Escape')                     { setShowFind(false); setFullScreen(false) }
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }) // no dep array — always reads latest refs

  // ── file actions ──────────────────────────────────────────────────────────
  async function openFile(node) {
    if (!isText(node.name)) return
    setActiveFile({ path: node.path, name: node.name })
    if (isMarkdown(node.name)) setViewMode('split')
    else setViewMode('source')
    setOpenTabs(prev => {
      const filtered = prev.filter(t => t.path !== node.path)
      return [{ path: node.path, name: node.name }, ...filtered].slice(0, 6)
    })
  }

  async function forceSave() {
    if (!activeFile) return
    clearTimeout(saveTimer.current)
    clearTimeout(checkpointTimer.current)
    // Flush any pending typing session as an undo checkpoint
    if (sessionStartRef.current !== null && sessionStartRef.current !== content) {
      pushToUndo(sessionStartRef.current)
      baselineRef.current = content
    }
    sessionStartRef.current = null
    setSaveStatus('saving')
    await saveContent(activeFile.path, content)
    savedContentRef.current = content
    setSaveStatus('saved')
  }

  // ── create ────────────────────────────────────────────────────────────────
  async function commitNewItem() {
    if (!newItemName.trim() || !newItemTarget) { setNewItemTarget(null); return }
    const node = await createNode(newItemName.trim(), newItemTarget.type, newItemTarget.parentPath)
    if (node && node.type === 'file') openFile(node)
    setNewItemTarget(null); setNewItemName('')
  }

  // ── delete ────────────────────────────────────────────────────────────────
  async function handleDelete(path, name) {
    if (!confirm(`Delete "${name}"?`)) return
    if (activeFile?.path === path || activeFile?.path.startsWith(path + '/')) {
      setActiveFile(null)
      setOpenTabs(prev => prev.filter(t => t.path !== path && !t.path.startsWith(path + '/')))
    }
    await deleteNode(path)
  }

  // ── rename ────────────────────────────────────────────────────────────────
  async function commitRename() {
    if (!renaming) return
    const result = await renameNode(renaming.path, renameValue)
    if (result && activeFile?.path === renaming.path) {
      setActiveFile({ path: result.path, name: result.name })
      setOpenTabs(prev => prev.map(t => t.path === renaming.path ? { path: result.path, name: result.name } : t))
    }
    setRenaming(null)
  }

  // ── panel resize ──────────────────────────────────────────────────────────
  function startResize(e) {
    e.preventDefault(); resizing.current = true
    const startX = e.clientX, startW = leftW
    const onMove = e => { if (resizing.current) setLeftW(Math.max(160, Math.min(500, startW + e.clientX - startX))) }
    const onUp   = () => { resizing.current = false; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp) }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  // ── context menu ─────────────────────────────────────────────────────────
  function showCtx(e, items) {
    e.preventDefault(); e.stopPropagation()
    setContextMenu({ x: Math.min(e.clientX, window.innerWidth - 180), y: Math.min(e.clientY, window.innerHeight - 200), items })
  }
  function nodeCtx(e, node) {
    showCtx(e, node.type === 'folder' ? [
      { label: '📄 New File',   action: () => { setNewItemTarget({ parentPath: node.path, type: 'file' }); setNewItemName(''); setOpenFolders(s => new Set([...s, node.path])) } },
      { label: '📁 New Folder', action: () => { setNewItemTarget({ parentPath: node.path, type: 'folder' }); setNewItemName(''); setOpenFolders(s => new Set([...s, node.path])) } },
      { sep: true },
      { label: 'Rename', action: () => { setRenaming({ path: node.path, name: node.name }); setRenameValue(node.name) } },
      { label: 'Delete', danger: true, action: () => handleDelete(node.path, node.name) },
    ] : [
      ...(isText(node.name) ? [{ label: 'Open', action: () => openFile(node) }] : []),
      { sep: true },
      { label: 'Rename', action: () => { setRenaming({ path: node.path, name: node.name }); setRenameValue(node.name) } },
      { label: 'Delete', danger: true, action: () => handleDelete(node.path, node.name) },
    ])
  }

  // ── markdown formatting ───────────────────────────────────────────────────
  function applyFormat(fmt) {
    // Immediately commit current content as an undo point (before modifying)
    if (activeFile) {
      clearTimeout(checkpointTimer.current)
      const before = sessionStartRef.current !== null ? sessionStartRef.current : content
      pushToUndo(before)
      sessionStartRef.current = null
      baselineRef.current = content // will be updated to newVal after setContent below
    }
    const ta = textareaRef.current
    if (!ta) return
    const { selectionStart: ss, selectionEnd: se, value } = ta
    const sel = value.slice(ss, se)
    const before = value.slice(0, ss)
    const after  = value.slice(se)
    let insert = '', cursorAt

    switch (fmt) {
      case 'bold':   insert = `**${sel || 'bold text'}**`;       cursorAt = ss + 2 + (sel.length || 9); break
      case 'italic': insert = `*${sel || 'italic text'}*`;        cursorAt = ss + 1 + (sel.length || 11); break
      case 'strike': insert = `~~${sel || 'strikethrough'}~~`;   cursorAt = ss + 2 + (sel.length || 13); break
      case 'code':   insert = sel.includes('\n') ? `\`\`\`\n${sel || 'code'}\n\`\`\`` : `\`${sel || 'code'}\``; cursorAt = ss + insert.length; break
      case 'link': { insert = `[${sel || 'link text'}](https://)`; cursorAt = ss + insert.length - 1; break }
      case 'image':  insert = `![${sel || 'alt text'}](https://)`; cursorAt = ss + insert.length - 1; break
      case 'h1':     insert = wrapLine(before, sel || 'Heading 1', after, '# ');  cursorAt = ss + insert.length; break
      case 'h2':     insert = wrapLine(before, sel || 'Heading 2', after, '## '); cursorAt = ss + insert.length; break
      case 'h3':     insert = wrapLine(before, sel || 'Heading 3', after, '### ');cursorAt = ss + insert.length; break
      case 'quote':  insert = wrapLine(before, sel || 'quote', after, '> ');      cursorAt = ss + insert.length; break
      case 'ul':     insert = wrapLine(before, sel || 'item', after, '- ');       cursorAt = ss + insert.length; break
      case 'ol':     insert = wrapLine(before, sel || 'item', after, '1. ');      cursorAt = ss + insert.length; break
      case 'hr':     insert = '\n---\n';                                          cursorAt = ss + insert.length; break
      case 'table':  insert = `\n| Column 1 | Column 2 | Column 3 |\n|---|---|---|\n| Cell | Cell | Cell |\n`; cursorAt = ss + insert.length; break
      default: return
    }

    const newVal = before + insert + after
    setContent(newVal)
    baselineRef.current = newVal // post-format is new baseline
    isUndoingRef.current = true  // don't treat this programmatic change as a typing session
    setTimeout(() => { ta.focus(); ta.setSelectionRange(cursorAt, cursorAt) }, 0)
  }

  function wrapLine(before, sel, after, prefix) {
    const lineStart = before.lastIndexOf('\n') + 1
    return before.slice(lineStart) === '' ? prefix + sel : '\n' + prefix + sel
  }

  // ── tab key → indent ──────────────────────────────────────────────────────
  function handleKeyDown(e) {
    if (e.key === 'Tab') {
      e.preventDefault()
      const ta = e.target
      const { selectionStart: ss, selectionEnd: se, value } = ta
      const spaces = '  '
      if (e.shiftKey) {
        const lineStart = value.lastIndexOf('\n', ss - 1) + 1
        if (value.slice(lineStart, lineStart + 2) === spaces) {
          const newVal = value.slice(0, lineStart) + value.slice(lineStart + 2)
          setContent(newVal)
          setTimeout(() => { ta.setSelectionRange(ss - 2, se - 2) }, 0)
        }
      } else {
        const newVal = value.slice(0, ss) + spaces + value.slice(se)
        setContent(newVal)
        setTimeout(() => { ta.setSelectionRange(ss + 2, ss + 2) }, 0)
      }
    }
  }

  // ── download ──────────────────────────────────────────────────────────────
  function downloadFile() {
    if (!activeFile) return
    const blob = new Blob([content], { type: 'text/plain' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a'); a.href = url; a.download = activeFile.name; a.click()
    URL.revokeObjectURL(url)
  }

  // ── find ──────────────────────────────────────────────────────────────────
  const matchCount = findQuery && content
    ? (content.match(new RegExp(findQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length
    : 0

  // ── tree roots ────────────────────────────────────────────────────────────
  const roots = files.filter(n => n.parent_path === '').sort((a, b) => {
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1
    return a.name.localeCompare(b.name)
  })

  const isMd       = activeFile && isMarkdown(activeFile.name)
  const isHtml_    = activeFile && isHtml(activeFile.name)
  const canPreview = isMd || isHtml_
  const words      = getWordCount(content)

  const statusColor = saveStatus === 'saved' ? 'text-brand-success' : saveStatus === 'saving' ? 'text-brand-accent' : 'text-gray-500'
  const statusLabel = saveStatus === 'saved' ? '✓ Saved' : saveStatus === 'saving' ? 'Saving…' : '● Unsaved'

  // ── sidebar JSX ───────────────────────────────────────────────────────────
  const sidebarContent = (
    <div className="glass-card sm:rounded-lg p-3 flex flex-col overflow-hidden h-full w-full">
      <div className="flex items-center justify-between mb-3 shrink-0">
        <span className="text-white text-sm font-semibold">Files</span>
        <div className="flex gap-0.5">
          <button onClick={() => { setNewItemTarget({ parentPath: '', type: 'file' }); setNewItemName('') }} className="nav-icon" title="New File"><PlusIco /></button>
          <button onClick={() => { setNewItemTarget({ parentPath: '', type: 'folder' }); setNewItemName('') }} className="nav-icon" title="New Folder"><FolderPlus /></button>
        </div>
      </div>

      {newItemTarget?.parentPath === '' && (
        <div className="mb-2 shrink-0">
          <input autoFocus value={newItemName} onChange={e => setNewItemName(e.target.value)}
            onBlur={commitNewItem}
            onKeyDown={e => { if (e.key === 'Enter') commitNewItem(); if (e.key === 'Escape') { setNewItemTarget(null); setNewItemName('') } }}
            placeholder={newItemTarget.type === 'folder' ? 'Folder name…' : 'filename.md'}
            className="w-full bg-black/30 border border-brand-accent/40 rounded px-2 py-1 text-white text-xs outline-none"
          />
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {roots.length === 0 && !newItemTarget && (
          <p className="text-gray-600 text-xs text-center py-6 leading-relaxed">No files yet.<br />Use the + buttons above.</p>
        )}
        {roots.map(node => (
          <div key={node.id}>
            <TreeNode
              node={node} files={files} activeFile={activeFile}
              openFolders={openFolders}
              onSelect={openFile}
              onToggle={path => setOpenFolders(s => { const n = new Set(s); n.has(path) ? n.delete(path) : n.add(path); return n })}
              onCtx={nodeCtx}
              renaming={renaming} renameValue={renameValue}
              setRenameValue={setRenameValue}
              onRenameBlur={commitRename}
              onRenameKey={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setRenaming(null) }}
            />
            {newItemTarget?.parentPath === node.path && openFolders.has(node.path) && (
              <div style={{ paddingLeft: '22px' }}>
                <input autoFocus value={newItemName}
                  onChange={e => setNewItemName(e.target.value)}
                  onBlur={commitNewItem}
                  onKeyDown={e => { if (e.key === 'Enter') commitNewItem(); if (e.key === 'Escape') { setNewItemTarget(null); setNewItemName('') } }}
                  placeholder={newItemTarget.type === 'folder' ? 'folder name' : 'file.md'}
                  className="w-full bg-black/30 border border-brand-accent/40 rounded px-2 py-0.5 text-white text-xs outline-none my-0.5"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )

  if (loading) return (
    <div className="p-4 pt-6 flex items-center justify-center h-[calc(100vh-136px)] sm:h-[calc(100vh-40px)]">
      <span className="text-gray-600 text-sm">Loading files…</span>
    </div>
  )

  return (
    <div
      className={`${fullScreen ? 'fixed inset-0 z-[60] bg-brand-bg' : 'p-3 pt-4 sm:p-4 sm:pt-6 h-[calc(100vh-136px)] sm:h-[calc(100vh-40px)]'} animate-fadeIn flex gap-3`}
      onContextMenu={e => {
        if (e.target === e.currentTarget)
          showCtx(e, [
            { label: '📄 New File',   action: () => { setNewItemTarget({ parentPath: '', type: 'file' }); setNewItemName('') } },
            { label: '📁 New Folder', action: () => { setNewItemTarget({ parentPath: '', type: 'folder' }); setNewItemName('') } },
          ])
      }}
    >
      <ContextMenu menu={contextMenu} onClose={() => setContextMenu(null)} />

      {showMobileSidebar && (
        <div className="drawer-backdrop sm:hidden" onClick={() => setShowMobileSidebar(false)} />
      )}

      {/* LEFT SIDEBAR */}
      <div
        className={`${showMobileSidebar ? 'drawer-panel' : 'hidden'} sm:flex sm:relative sm:flex-shrink-0 sm:flex-col sm:overflow-hidden`}
        style={typeof window !== 'undefined' && window.innerWidth >= 640 ? { width: leftW + 'px' } : {}}
      >
        {sidebarContent}
      </div>

      <div onMouseDown={startResize}
        className="hidden sm:block w-1 flex-shrink-0 cursor-col-resize rounded-full hover:bg-brand-accent/30 transition-colors"
        style={{ background: 'rgba(255,255,255,0.04)' }}
      />

      {/* RIGHT PANEL */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {!activeFile ? (
          <div className="glass-card rounded-lg h-full flex flex-col items-center justify-center text-center p-6 sm:p-8"
            onContextMenu={e => showCtx(e, [
              { label: '📄 New File',   action: () => { setNewItemTarget({ parentPath: '', type: 'file' }); setNewItemName('') } },
              { label: '📁 New Folder', action: () => { setNewItemTarget({ parentPath: '', type: 'folder' }); setNewItemName('') } },
            ])}
          >
            <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </div>
            <p className="text-gray-400 text-sm font-medium">No file open</p>
            <p className="text-gray-600 text-xs mt-1 mb-6">Select a file from the sidebar or create one</p>
            <div className="flex flex-col sm:flex-row gap-2 w-full max-w-xs">
              <button onClick={() => setShowMobileSidebar(true)}
                className="sm:hidden btn-primary flex items-center justify-center gap-1.5 px-4 py-2.5 text-white rounded text-sm"
              ><MenuIco /> Browse Files</button>
              <button onClick={() => { setNewItemTarget({ parentPath: '', type: 'file' }); setNewItemName(''); setShowMobileSidebar(true) }}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 sm:py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded text-sm transition-all"
              ><PlusIco /> New File</button>
              <button onClick={() => { setNewItemTarget({ parentPath: '', type: 'folder' }); setNewItemName(''); setShowMobileSidebar(true) }}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 sm:py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded text-sm transition-all"
              ><FolderPlus /> New Folder</button>
            </div>
          </div>
        ) : (
          <div className="glass-card rounded-lg flex flex-col overflow-hidden h-full">

            {/* Tabs */}
            {openTabs.length > 1 && (
              <div className="flex overflow-x-auto shrink-0 border-b border-white/5 px-2 pt-1 gap-1 scrollbar-hide">
                {openTabs.map(t => (
                  <button key={t.path}
                    onClick={() => openFile(files.find(f => f.path === t.path) || t)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-t text-xs whitespace-nowrap flex-shrink-0 border-b-2 transition-all
                      ${t.path === activeFile.path ? 'text-white border-brand-accent bg-white/5' : 'text-gray-500 border-transparent hover:text-gray-300 hover:bg-white/5'}`}
                  >
                    <FileIcon ext={getExt(t.name)} />
                    {t.name}
                    <span
                      onClick={e => { e.stopPropagation(); setOpenTabs(prev => prev.filter(x => x.path !== t.path)); if (t.path === activeFile.path) setActiveFile(openTabs.find(x => x.path !== t.path) || null) }}
                      className="text-gray-600 hover:text-white ml-0.5 leading-none"
                    >×</span>
                  </button>
                ))}
              </div>
            )}

            {/* Toolbar */}
            <div className="flex items-center gap-1 px-2 sm:px-3 py-1.5 border-b border-white/5 shrink-0 flex-wrap">
              <button onClick={() => setShowMobileSidebar(true)} className="sm:hidden nav-icon mr-1" title="Files"><MenuIco /></button>

              <div className="flex items-center gap-1.5 flex-1 min-w-0 mr-2">
                <FileIcon ext={getExt(activeFile.name)} />
                <span className="text-white text-xs font-medium truncate">{activeFile.name}</span>
              </div>

              {/* Undo / Redo */}
              <TB onClick={performUndo} title="Undo (Ctrl+Z)" disabled={!canUndo}><UndoIco /></TB>
              <TB onClick={performRedo} title="Redo (Ctrl+Y)" disabled={!canRedo}><RedoIco /></TB>
              <div className="w-px h-4 bg-white/10 mx-0.5" />

              {/* Markdown toolbar */}
              {isMd && (
                <div className="flex items-center gap-0.5 flex-wrap">
                  <TB onClick={() => applyFormat('bold')}   title="Bold (Ctrl+B)"><strong>B</strong></TB>
                  <TB onClick={() => applyFormat('italic')} title="Italic (Ctrl+I)"><em>I</em></TB>
                  <TB onClick={() => applyFormat('strike')} title="Strikethrough"><del>S</del></TB>
                  <div className="w-px h-4 bg-white/10 mx-0.5" />
                  <TB onClick={() => applyFormat('h1')} title="Heading 1">H1</TB>
                  <TB onClick={() => applyFormat('h2')} title="Heading 2">H2</TB>
                  <TB onClick={() => applyFormat('h3')} title="Heading 3">H3</TB>
                  <div className="w-px h-4 bg-white/10 mx-0.5" />
                  <TB onClick={() => applyFormat('code')}  title="Code">&lt;/&gt;</TB>
                  <TB onClick={() => applyFormat('link')}  title="Link (Ctrl+K)">🔗</TB>
                  <TB onClick={() => applyFormat('quote')} title="Blockquote">"</TB>
                  <TB onClick={() => applyFormat('ul')}    title="Bullet list">•</TB>
                  <TB onClick={() => applyFormat('ol')}    title="Numbered list">1.</TB>
                  <TB onClick={() => applyFormat('table')} title="Table">⊞</TB>
                  <TB onClick={() => applyFormat('hr')}    title="Divider">—</TB>
                </div>
              )}

              {/* Right controls */}
              <div className="flex items-center gap-0.5 ml-auto">
                {canPreview && (
                  <div className="flex gap-0.5 bg-white/5 rounded p-0.5">
                    {[{ v: 'source', l: 'Src' }, { v: 'preview', l: 'View' }, { v: 'split', l: 'Split' }].map(({ v, l }) => (
                      <button key={v}
                        onClick={() => setViewMode(v)}
                        className={`${v === 'split' ? 'hidden sm:inline' : ''} px-2 py-0.5 rounded text-xs transition-all
                          ${viewMode === v ? 'bg-brand-accent/80 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                      >{l}</button>
                    ))}
                  </div>
                )}
                <button onClick={() => setShowFind(v => !v)} className={`nav-icon ${showFind ? 'text-brand-accent' : ''}`} title="Find (Ctrl+F)"><SearchIco /></button>
                <button onClick={downloadFile} className="nav-icon" title="Download"><DownloadIco /></button>
                <button onClick={() => setFullScreen(v => !v)} className="nav-icon hidden sm:flex" title="Full screen">
                  {fullScreen ? <ExitFull /> : <FullIco />}
                </button>
                <button onClick={forceSave} className={`nav-icon ${statusColor}`} title="Save (Ctrl+S)"><SaveIco /></button>
              </div>
            </div>

            {/* Find bar */}
            {showFind && (
              <div className="flex items-center gap-2 px-3 py-1.5 border-b border-white/5 bg-black/20 shrink-0">
                <SearchIco />
                <input
                  autoFocus
                  value={findQuery}
                  onChange={e => setFindQuery(e.target.value)}
                  placeholder="Find in file…"
                  className="flex-1 bg-transparent text-white text-xs outline-none placeholder-gray-600"
                />
                {findQuery && (
                  <span className="text-xs text-gray-500">{matchCount} match{matchCount !== 1 ? 'es' : ''}</span>
                )}
                <button onClick={() => { setShowFind(false); setFindQuery('') }} className="nav-icon"><CloseIco /></button>
              </div>
            )}

            {/* Editor area */}
            <div className="flex-1 overflow-hidden flex min-h-0">
              {(viewMode === 'source' || viewMode === 'split') && (
                <div className={`flex flex-col overflow-hidden ${viewMode === 'split' ? 'w-1/2 border-r border-white/5' : 'w-full'}`}>
                  <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onKeyUp={e => { const { selectionStart: ss, value } = e.target; setCursorPos(getCursorPos(value, ss)) }}
                    onClick={e => { const { selectionStart: ss, value } = e.target; setCursorPos(getCursorPos(value, ss)) }}
                    spellCheck={false}
                    className="source-editor flex-1 w-full resize-none"
                    style={{ maxHeight: 'none', height: '100%', minHeight: 'unset', borderRadius: 0, border: 'none' }}
                    placeholder={isMd ? '# Heading\n\nStart writing…\n\nTip: Ctrl+Z undo, Ctrl+Y redo. History persists across sessions.' : 'Start typing…'}
                  />
                </div>
              )}

              {(viewMode === 'preview' || viewMode === 'split') && (
                <div className={`overflow-auto p-5 ${viewMode === 'split' ? 'w-1/2' : 'w-full'}`}>
                  {isMd ? (
                    <div className="markdown-preview text-sm text-gray-300 max-w-none"
                      dangerouslySetInnerHTML={{ __html: renderMd(content) }} />
                  ) : (
                    <iframe srcDoc={content} className="w-full h-full rounded border-0" sandbox="allow-scripts" title="preview" />
                  )}
                </div>
              )}
            </div>

            {/* Status bar */}
            <div className="flex items-center gap-3 sm:gap-4 px-3 py-1 border-t border-white/5 shrink-0 text-xs select-none">
              <span className={`font-medium ${statusColor}`}>{statusLabel}</span>
              {canUndo && <span className="text-gray-700">{undoRef.current.length} undo</span>}
              <span className="text-gray-600">Ln {cursorPos.line}, Col {cursorPos.col}</span>
              <span className="text-gray-600">{content.split('\n').length} lines</span>
              {isMd && <>
                <span className="text-gray-600">{words} words</span>
                <span className="text-gray-600">{getReadTime(content)} min read</span>
              </>}
              <span className="ml-auto text-gray-700">{(new Blob([content]).size / 1024).toFixed(1)} KB</span>
              <span className="text-gray-700">{getExt(activeFile.name).toUpperCase() || 'TXT'}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
