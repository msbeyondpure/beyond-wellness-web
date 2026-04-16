import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase, isConfigured } from '../lib/supabase'

// ── icons ────────────────────────────────────────────────────────────────────
const FolderIcon = ({ open }) => open
  ? <svg width="14" height="14" viewBox="0 0 24 24" fill="rgba(196,94,44,0.7)" stroke="rgba(196,94,44,0.9)" strokeWidth="1.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
  : <svg width="14" height="14" viewBox="0 0 24 24" fill="rgba(196,94,44,0.3)" stroke="rgba(196,94,44,0.6)" strokeWidth="1.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
const FileIcon = ({ ext }) => {
  const color = ext === 'md' ? '#7dd3fc' : ext === 'html' || ext === 'htm' ? '#f97316' : ext === 'js' ? '#fbbf24' : ext === 'json' ? '#a3e635' : ext === 'css' ? '#c084fc' : '#9ca3af'
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
}
const Plus = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const FolderPlus = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>
const SaveIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
const ChevronRight = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
const ChevronDown = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
const Trash = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
const EditIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>

// ── virtual filesystem via localStorage ──────────────────────────────────────
const LS_TREE = 'bwEditorTree'      // [{id, name, path, type:'file'|'folder', parentPath}]
const LS_FILE = (path) => `bwEditorFile:${path}`

function loadTree() {
  try { return JSON.parse(localStorage.getItem(LS_TREE)) || [] } catch { return [] }
}
function saveTree(tree) { localStorage.setItem(LS_TREE, JSON.stringify(tree)) }
function loadFile(path) { return localStorage.getItem(LS_FILE(path)) || '' }
function saveFile(path, content) { localStorage.setItem(LS_FILE(path), content) }
function deleteFile(path) { localStorage.removeItem(LS_FILE(path)) }
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2) }

function getExt(name) { const p = name.lastIndexOf('.'); return p > 0 ? name.slice(p + 1).toLowerCase() : '' }
function isMarkdown(name) { return ['md', 'markdown'].includes(getExt(name)) }
function isText(name) { return ['md', 'markdown', 'txt', 'html', 'htm', 'js', 'jsx', 'ts', 'tsx', 'css', 'json', 'xml', 'csv', 'sh', 'py', 'rb', 'go'].includes(getExt(name)) }

// ── simple markdown renderer ─────────────────────────────────────────────────
function renderMd(md) {
  if (!md) return ''
  let html = md
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^#{6}\s+(.+)$/gm, '<h6>$1</h6>')
    .replace(/^#{5}\s+(.+)$/gm, '<h5>$1</h5>')
    .replace(/^#{4}\s+(.+)$/gm, '<h4>$1</h4>')
    .replace(/^###\s+(.+)$/gm, '<h3>$1</h3>')
    .replace(/^##\s+(.+)$/gm, '<h2>$1</h2>')
    .replace(/^#\s+(.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/^---$/gm, '<hr>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/^[-*]\s+(.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    .replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>')
    .replace(/\n\n/g, '</p><p>')
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
        : <div key={i} onClick={e => { e.stopPropagation(); item.action(); onClose() }} className={`context-menu-item ${item.danger ? 'danger' : ''}`}>{item.label}</div>
      )}
    </div>
  )
}

// ── file tree node ────────────────────────────────────────────────────────────
function TreeNode({ node, tree, depth = 0, activeFile, openFolders, onSelect, onToggle, onCtx, renaming, renameValue, setRenameValue, onRenameBlur, onRenameKey }) {
  const children = tree.filter(n => n.parentPath === node.path).sort((a, b) => {
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1
    return a.name.localeCompare(b.name)
  })
  const isOpen = openFolders.has(node.path)
  const isActive = activeFile?.path === node.path
  const ext = node.type === 'file' ? getExt(node.name) : ''

  return (
    <div>
      <div
        className={`flex items-center gap-1.5 py-1.5 sm:py-0.5 px-2 rounded cursor-pointer group transition-all editor-file-item ${isActive ? 'bg-brand-accent/15 text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 active:bg-white/10'}`}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
        onClick={() => node.type === 'folder' ? onToggle(node.path) : onSelect(node)}
        onContextMenu={e => { e.preventDefault(); e.stopPropagation(); onCtx(e, node) }}
      >
        {node.type === 'folder' && (
          <span className="text-gray-600 w-3 flex-shrink-0">
            {isOpen ? <ChevronDown /> : <ChevronRight />}
          </span>
        )}
        {node.type === 'folder'
          ? <FolderIcon open={isOpen} />
          : <FileIcon ext={ext} />
        }
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
          <span className="flex-1 text-xs truncate">{node.name}</span>
        )}
        {node.type === 'file' && isActive && <span className="modified-dot opacity-0" id={`dot-${node.path}`} />}
      </div>
      {node.type === 'folder' && isOpen && children.map(child => (
        <TreeNode
          key={child.id}
          node={child}
          tree={tree}
          depth={depth + 1}
          activeFile={activeFile}
          openFolders={openFolders}
          onSelect={onSelect}
          onToggle={onToggle}
          onCtx={onCtx}
          renaming={renaming}
          renameValue={renameValue}
          setRenameValue={setRenameValue}
          onRenameBlur={onRenameBlur}
          onRenameKey={onRenameKey}
        />
      ))}
    </div>
  )
}

// ── main component ────────────────────────────────────────────────────────────
export default function Editor({ userId }) {
  const [tree, setTree] = useState(() => loadTree())
  const [activeFile, setActiveFile] = useState(null)  // { path, name, content }
  const [viewMode, setViewMode] = useState('source')  // 'source' | 'preview' | 'split'
  const [openFolders, setOpenFolders] = useState(new Set())
  const [modified, setModified] = useState(false)
  const [saveFlash, setSaveFlash] = useState(false)
  const [contextMenu, setContextMenu] = useState(null)
  const [renaming, setRenaming] = useState(null)  // { path, name }
  const [renameValue, setRenameValue] = useState('')
  const [newItemTarget, setNewItemTarget] = useState(null)  // { parentPath, type:'file'|'folder' }
  const [newItemName, setNewItemName] = useState('')
  const [leftW, setLeftW] = useState(() => parseInt(localStorage.getItem('bwEditorLeftW') || '260', 10))
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)
  const resizing = useRef(false)
  const textareaRef = useRef(null)

  useEffect(() => { localStorage.setItem('bwEditorLeftW', String(leftW)) }, [leftW])

  // Force off split-mode on mobile (no room for it)
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth < 640 && viewMode === 'split') setViewMode('source')
    }
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [viewMode])

  // Auto-close mobile drawer when a file is opened
  useEffect(() => { if (activeFile) setShowMobileSidebar(false) }, [activeFile?.path])

  // ── tree operations ──────────────────────────────────────
  function addNode(name, type, parentPath = '') {
    if (!name.trim()) return null
    const path = parentPath ? `${parentPath}/${name.trim()}` : name.trim()
    if (tree.some(n => n.path === path)) return null
    const node = { id: uid(), name: name.trim(), path, type, parentPath }
    const next = [...tree, node]
    setTree(next); saveTree(next)
    if (type === 'file') saveFile(path, '')
    return node
  }

  function removeNode(path) {
    // Remove node and all descendants
    const toRemove = new Set()
    const collect = (p) => {
      toRemove.add(p)
      tree.filter(n => n.parentPath === p).forEach(n => collect(n.path))
    }
    collect(path)
    toRemove.forEach(p => {
      const n = tree.find(t => t.path === p)
      if (n?.type === 'file') deleteFile(p)
    })
    const next = tree.filter(n => !toRemove.has(n.path))
    setTree(next); saveTree(next)
    if (activeFile && toRemove.has(activeFile.path)) setActiveFile(null)
  }

  function renameNode(path, newName) {
    if (!newName.trim() || newName === renaming?.name) { setRenaming(null); return }
    const node = tree.find(n => n.path === path)
    if (!node) { setRenaming(null); return }
    const parentPath = node.parentPath
    const newPath = parentPath ? `${parentPath}/${newName.trim()}` : newName.trim()
    if (tree.some(n => n.path === newPath)) { setRenaming(null); return }

    // Move content if file
    if (node.type === 'file') {
      const content = loadFile(path)
      saveFile(newPath, content)
      deleteFile(path)
    }

    // Update all paths that start with old path
    const next = tree.map(n => {
      if (n.path === path) return { ...n, name: newName.trim(), path: newPath }
      if (n.parentPath === path) return { ...n, parentPath: newPath }
      if (n.path.startsWith(path + '/')) return { ...n, path: n.path.replace(path, newPath), parentPath: n.parentPath.replace(path, newPath) }
      return n
    })
    setTree(next); saveTree(next)
    if (activeFile?.path === path) setActiveFile(f => ({ ...f, path: newPath, name: newName.trim() }))
    setRenaming(null)
  }

  // ── file selection ───────────────────────────────────────
  function openFile(node) {
    if (!isText(node.name)) return
    const content = loadFile(node.path)
    setActiveFile({ path: node.path, name: node.name, content })
    setModified(false)
    if (isMarkdown(node.name)) setViewMode('split')
    else setViewMode('source')
  }

  // ── save ─────────────────────────────────────────────────
  const save = useCallback(() => {
    if (!activeFile || !modified) return
    saveFile(activeFile.path, activeFile.content)
    setModified(false)
    setSaveFlash(true)
    setTimeout(() => setSaveFlash(false), 600)
  }, [activeFile, modified])

  // Ctrl+S
  useEffect(() => {
    const fn = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); save() }
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [save])

  // ── panel resize ─────────────────────────────────────────
  function startResize(e) {
    e.preventDefault()
    resizing.current = true
    const startX = e.clientX, startW = leftW
    const onMove = (e) => {
      if (!resizing.current) return
      setLeftW(Math.max(160, Math.min(500, startW + (e.clientX - startX))))
    }
    const onUp = () => { resizing.current = false; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp) }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  // ── context menu helpers ─────────────────────────────────
  function showCtx(e, items) {
    e.preventDefault(); e.stopPropagation()
    setContextMenu({ x: e.clientX, y: e.clientY, items })
  }

  function nodeCtx(e, node) {
    const items = node.type === 'folder' ? [
      { label: 'New File', action: () => { setNewItemTarget({ parentPath: node.path, type: 'file' }); setNewItemName(''); setOpenFolders(s => new Set([...s, node.path])) } },
      { label: 'New Folder', action: () => { setNewItemTarget({ parentPath: node.path, type: 'folder' }); setNewItemName(''); setOpenFolders(s => new Set([...s, node.path])) } },
      { sep: true },
      { label: 'Rename', action: () => { setRenaming({ path: node.path, name: node.name }); setRenameValue(node.name) } },
      { label: 'Delete', danger: true, action: () => { if (confirm(`Delete "${node.name}"?`)) removeNode(node.path) } },
    ] : [
      ...(isText(node.name) ? [{ label: 'Open', action: () => openFile(node) }] : []),
      { sep: true },
      { label: 'Rename', action: () => { setRenaming({ path: node.path, name: node.name }); setRenameValue(node.name) } },
      { label: 'Delete', danger: true, action: () => { if (confirm(`Delete "${node.name}"?`)) removeNode(node.path) } },
    ]
    showCtx(e, items)
  }

  // ── new item inline input ────────────────────────────────
  function commitNewItem() {
    if (!newItemName.trim() || !newItemTarget) { setNewItemTarget(null); return }
    const node = addNode(newItemName.trim(), newItemTarget.type, newItemTarget.parentPath)
    if (node && node.type === 'file') openFile(node)
    setNewItemTarget(null); setNewItemName('')
  }

  // ── root children ────────────────────────────────────────
  const roots = tree.filter(n => n.parentPath === '').sort((a, b) => {
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1
    return a.name.localeCompare(b.name)
  })

  // ── render ───────────────────────────────────────────────
  return (
    <div
      className="p-3 pt-4 sm:p-4 sm:pt-6 animate-fadeIn flex gap-3 h-[calc(100vh-136px)] sm:h-[calc(100vh-40px)]"
      onContextMenu={e => {
        if (e.target === e.currentTarget) {
          showCtx(e, [
            { label: 'New File', action: () => { setNewItemTarget({ parentPath: '', type: 'file' }); setNewItemName('') } },
            { label: 'New Folder', action: () => { setNewItemTarget({ parentPath: '', type: 'folder' }); setNewItemName('') } },
          ])
        }
      }}
    >
      <ContextMenu menu={contextMenu} onClose={() => setContextMenu(null)} />

      {/* ── Mobile drawer backdrop ── */}
      {showMobileSidebar && (
        <div
          className="drawer-backdrop sm:hidden"
          onClick={() => setShowMobileSidebar(false)}
        />
      )}

      {/* ── LEFT SIDEBAR ── */}
      <div
        className={`${showMobileSidebar ? 'drawer-panel' : 'hidden'} sm:flex sm:relative sm:flex-shrink-0 sm:flex-col sm:overflow-hidden`}
        style={typeof window !== 'undefined' && window.innerWidth >= 640 ? { width: leftW + 'px' } : {}}
      >
        <div className="glass-card sm:rounded-lg p-3 flex flex-col overflow-hidden h-full w-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-3 shrink-0">
            <span className="text-white text-sm font-semibold">Files</span>
            <div className="flex gap-1">
              <button
                onClick={() => { setNewItemTarget({ parentPath: '', type: 'file' }); setNewItemName('') }}
                className="nav-icon" title="New File"
              >
                <Plus />
              </button>
              <button
                onClick={() => { setNewItemTarget({ parentPath: '', type: 'folder' }); setNewItemName('') }}
                className="nav-icon" title="New Folder"
              >
                <FolderPlus />
              </button>
            </div>
          </div>

          {/* New item input */}
          {newItemTarget && newItemTarget.parentPath === '' && (
            <div className="mb-2 px-2 shrink-0">
              <input
                autoFocus
                value={newItemName}
                onChange={e => setNewItemName(e.target.value)}
                onBlur={commitNewItem}
                onKeyDown={e => { if (e.key === 'Enter') commitNewItem(); if (e.key === 'Escape') { setNewItemTarget(null); setNewItemName('') } }}
                placeholder={newItemTarget.type === 'folder' ? 'Folder name...' : 'file.md'}
                className="w-full bg-black/30 border border-brand-accent/40 rounded px-2 py-1 text-white text-xs outline-none placeholder-gray-600"
              />
            </div>
          )}

          {/* Tree */}
          <div className="flex-1 overflow-y-auto">
            {roots.length === 0 && !newItemTarget && (
              <p className="text-gray-600 text-xs text-center py-6 leading-relaxed">No files yet.<br />Right-click or use the + buttons above.</p>
            )}
            {roots.map(node => (
              <div key={node.id}>
                <TreeNode
                  node={node}
                  tree={tree}
                  activeFile={activeFile}
                  openFolders={openFolders}
                  onSelect={openFile}
                  onToggle={path => setOpenFolders(s => { const n = new Set(s); n.has(path) ? n.delete(path) : n.add(path); return n })}
                  onCtx={nodeCtx}
                  renaming={renaming}
                  renameValue={renameValue}
                  setRenameValue={setRenameValue}
                  onRenameBlur={() => renameNode(renaming?.path, renameValue)}
                  onRenameKey={e => { if (e.key === 'Enter') renameNode(renaming?.path, renameValue); if (e.key === 'Escape') setRenaming(null) }}
                />
                {/* New item inside folder */}
                {newItemTarget && newItemTarget.parentPath === node.path && openFolders.has(node.path) && (
                  <div style={{ paddingLeft: '22px' }}>
                    <input
                      autoFocus
                      value={newItemName}
                      onChange={e => setNewItemName(e.target.value)}
                      onBlur={commitNewItem}
                      onKeyDown={e => { if (e.key === 'Enter') commitNewItem(); if (e.key === 'Escape') { setNewItemTarget(null); setNewItemName('') } }}
                      placeholder={newItemTarget.type === 'folder' ? 'folder name' : 'file.md'}
                      className="w-full bg-black/30 border border-brand-accent/40 rounded px-2 py-0.5 text-white text-xs outline-none placeholder-gray-600 my-0.5"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Resize handle (desktop only) */}
      <div
        onMouseDown={startResize}
        className="hidden sm:block w-1 flex-shrink-0 cursor-col-resize rounded-full transition-colors hover:bg-brand-accent/30"
        style={{ background: 'rgba(255,255,255,0.04)' }}
      />

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {!activeFile ? (
          <div className="glass-card rounded-lg h-full flex flex-col items-center justify-center text-center p-6 sm:p-8"
            onContextMenu={e => showCtx(e, [
              { label: 'New File', action: () => { setNewItemTarget({ parentPath: '', type: 'file' }); setNewItemName('') } },
              { label: 'New Folder', action: () => { setNewItemTarget({ parentPath: '', type: 'folder' }); setNewItemName('') } },
            ])}
          >
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
              </svg>
            </div>
            <p className="text-gray-500 text-sm">Select a file to edit</p>
            <p className="text-gray-700 text-xs mt-1 hidden sm:block">or right-click to create one</p>
            <div className="mt-6 flex flex-col sm:flex-row gap-2 w-full max-w-xs">
              <button
                onClick={() => setShowMobileSidebar(true)}
                className="sm:hidden btn-primary flex items-center justify-center gap-1.5 px-3 py-2.5 text-white rounded text-sm"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
                Browse Files
              </button>
              <button
                onClick={() => { setNewItemTarget({ parentPath: '', type: 'file' }); setNewItemName(''); setShowMobileSidebar(true) }}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 sm:py-1.5 bg-white/5 hover:bg-white/10 active:bg-white/10 text-gray-400 hover:text-white rounded text-xs transition-all"
              >
                <Plus /> New File
              </button>
              <button
                onClick={() => { setNewItemTarget({ parentPath: '', type: 'folder' }); setNewItemName(''); setShowMobileSidebar(true) }}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 sm:py-1.5 bg-white/5 hover:bg-white/10 active:bg-white/10 text-gray-400 hover:text-white rounded text-xs transition-all"
              >
                <FolderPlus /> New Folder
              </button>
            </div>
          </div>
        ) : (
          <div className="glass-card rounded-lg flex flex-col overflow-hidden h-full">
            {/* Editor toolbar */}
            <div className="flex items-center gap-2 px-2 sm:px-4 py-2 border-b border-white/5 shrink-0">
              <button
                onClick={() => setShowMobileSidebar(true)}
                className="sm:hidden nav-icon flex-shrink-0"
                title="Show files"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              </button>
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <FileIcon ext={getExt(activeFile.name)} />
                <span className="text-white text-sm font-medium truncate">{activeFile.name}</span>
                {modified && <span className="modified-dot flex-shrink-0" />}
              </div>

              <div className="flex gap-1 shrink-0">
                {/* View mode tabs (no split on mobile) */}
                <div className="flex gap-0.5 bg-white/5 rounded p-0.5">
                  {[
                    { v: 'source', label: 'Source', mobile: true },
                    ...(isMarkdown(activeFile.name) || getExt(activeFile.name) === 'html' ? [
                      { v: 'preview', label: 'Preview', mobile: true },
                      { v: 'split', label: 'Split', mobile: false },
                    ] : [])
                  ].map(({ v, label, mobile }) => (
                    <button
                      key={v}
                      onClick={() => setViewMode(v)}
                      className={`${mobile ? '' : 'hidden sm:inline'} px-2 py-1 sm:py-0.5 rounded text-xs transition-all ${viewMode === v ? 'bg-brand-accent/80 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={save}
                  className={`flex items-center gap-1 px-2 py-1.5 sm:py-1 rounded text-xs transition-all ${
                    saveFlash ? 'bg-brand-success/20 text-brand-success' :
                    modified ? 'bg-brand-accent/20 text-brand-accent hover:bg-brand-accent/30' :
                    'text-gray-600 hover:text-gray-400 hover:bg-white/5'
                  }`}
                  title="Save (Ctrl+S)"
                >
                  <SaveIcon /> <span className="hidden sm:inline">{modified ? 'Save' : 'Saved'}</span>
                </button>
              </div>
            </div>

            {/* Editor area */}
            <div className="flex-1 overflow-hidden flex">
              {/* Source editor */}
              {(viewMode === 'source' || viewMode === 'split') && (
                <div className={`flex flex-col overflow-hidden ${viewMode === 'split' ? 'w-1/2 border-r border-white/5' : 'w-full'}`}>
                  <textarea
                    ref={textareaRef}
                    value={activeFile.content}
                    onChange={e => {
                      setActiveFile(f => ({ ...f, content: e.target.value }))
                      setModified(true)
                    }}
                    spellCheck={false}
                    className="source-editor flex-1 w-full resize-none"
                    style={{ maxHeight: 'none', height: '100%', minHeight: 'unset', borderRadius: 0, border: 'none' }}
                    placeholder={isMarkdown(activeFile.name) ? '# Heading\n\nStart writing...' : 'Start typing...'}
                  />
                </div>
              )}

              {/* Preview */}
              {(viewMode === 'preview' || viewMode === 'split') && (
                <div className={`overflow-auto p-5 ${viewMode === 'split' ? 'w-1/2' : 'w-full'}`}>
                  {isMarkdown(activeFile.name) ? (
                    <div
                      className="markdown-preview text-sm text-gray-300 max-w-none"
                      dangerouslySetInnerHTML={{ __html: renderMd(activeFile.content) }}
                    />
                  ) : (
                    <iframe
                      srcDoc={activeFile.content}
                      className="w-full h-full rounded border-0"
                      sandbox="allow-scripts"
                      title="preview"
                    />
                  )}
                </div>
              )}
            </div>

            {/* Status bar */}
            <div className="flex items-center gap-4 px-4 py-1 border-t border-white/5 shrink-0 text-xs text-gray-700">
              <span>{activeFile.content.split('\n').length} lines</span>
              <span>{activeFile.content.length} chars</span>
              {isMarkdown(activeFile.name) && (
                <span>{activeFile.content.split(/\s+/).filter(Boolean).length} words</span>
              )}
              <span className="ml-auto">{getExt(activeFile.name).toUpperCase() || 'TXT'}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
