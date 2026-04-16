import { useState, useRef, useEffect } from 'react'
import { supabase, isConfigured } from '../lib/supabase'

const FolderIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
const SettingsIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
const TrashBin = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
const UndoIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
const RedoIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10"/></svg>
const RotateCcw = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
const Trash2 = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>

const TABS = ['tasks', 'affiliates', 'formulas', 'editor', 'migrate']

export default function Layout({ user, activeView, setActiveView, taskStats, children }) {
  const [showFile, setShowFile] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showTrash, setShowTrash] = useState(false)
  const [settings, setSettings] = useState(() => {
    try { return JSON.parse(localStorage.getItem('bwSettings')) || { fontSize: 'medium' } } catch { return { fontSize: 'medium' } }
  })
  const [trash, setTrash] = useState(() => {
    try { return JSON.parse(localStorage.getItem('bwTrashTasks')) || [] } catch { return [] }
  })

  useEffect(() => {
    const close = (e) => {
      if (!e.target.closest('.menu-keep')) {
        setShowFile(false); setShowSettings(false); setShowTrash(false)
      }
    }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [])

  useEffect(() => {
    localStorage.setItem('bwSettings', JSON.stringify(settings))
  }, [settings])

  const trashCount = trash.length

  return (
    <div className="min-h-screen" style={{ background: '#1a1a1a' }}>
      {/* Top Navbar */}
      <nav className="glass-card sticky top-0 z-40 border-b border-white/5">
        <div className="pl-2">
          <div className="flex items-center justify-between h-10 relative">

            {/* Left: Logo + menus */}
            <div className="flex items-center gap-1 z-10">
              <div className="w-4 h-4 rounded mr-1 bg-brand-accent/80 flex items-center justify-center">
                <div className="w-2 h-2 rounded-sm bg-white/80" />
              </div>

              {/* File menu */}
              <div className="relative menu-keep">
                <button onClick={e => { e.stopPropagation(); setShowFile(v => !v); setShowSettings(false); setShowTrash(false) }} className="nav-icon" title="File">
                  <FolderIcon />
                </button>
                {showFile && (
                  <div className="absolute top-full left-0 mt-1 menu-dropdown rounded py-1 min-w-44 animate-fadeIn z-50">
                    <button onClick={() => setShowFile(false)} className="w-full text-left px-3 py-2 text-gray-300 hover:bg-white/10 flex items-center gap-2 text-sm">
                      <UndoIcon /> Undo
                    </button>
                    <button onClick={() => setShowFile(false)} className="w-full text-left px-3 py-2 text-gray-300 hover:bg-white/10 flex items-center gap-2 text-sm">
                      <RedoIcon /> Redo
                    </button>
                  </div>
                )}
              </div>

              {/* Settings menu */}
              <div className="relative menu-keep">
                <button onClick={e => { e.stopPropagation(); setShowSettings(v => !v); setShowFile(false); setShowTrash(false) }} className="nav-icon" title="Settings">
                  <SettingsIcon />
                </button>
                {showSettings && (
                  <div className="absolute top-full left-0 mt-1 menu-dropdown rounded p-4 min-w-64 animate-fadeIn z-50" onClick={e => e.stopPropagation()}>
                    <h4 className="text-white font-medium mb-3 text-sm">Settings</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-gray-400 text-xs mb-1 block">Font Size</label>
                        <select value={settings.fontSize} onChange={e => setSettings(s => ({ ...s, fontSize: e.target.value }))} className="w-full px-2 py-1.5 bg-white/10 border border-white/10 rounded text-white text-sm">
                          <option value="small">Small</option>
                          <option value="medium">Medium</option>
                          <option value="large">Large</option>
                        </select>
                      </div>
                      {!isConfigured && (
                        <div className="pt-2 border-t border-white/10">
                          <p className="text-xs text-gray-500">Running in local mode. Add Supabase credentials to <code className="bg-black/30 px-1 rounded">.env.local</code> for cloud sync.</p>
                        </div>
                      )}
                      {isConfigured && (
                        <div className="pt-2 border-t border-white/10">
                          <button onClick={() => supabase.auth.signOut()} className="w-full px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded text-red-400 text-sm transition-all">
                            Sign Out
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Trash menu */}
              <div className="relative menu-keep">
                <button onClick={e => { e.stopPropagation(); setShowTrash(v => !v); setShowFile(false); setShowSettings(false) }} className="nav-icon relative" title="Recycle Bin">
                  <TrashBin />
                  {trashCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white">{trashCount}</span>
                  )}
                </button>
                {showTrash && (
                  <div className="absolute top-full left-0 mt-1 menu-dropdown rounded p-3 min-w-80 max-h-96 overflow-y-auto animate-fadeIn z-50" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-white font-medium text-sm">Recycle Bin</h4>
                      {trashCount > 0 && (
                        <button onClick={() => { setTrash([]); localStorage.setItem('bwTrashTasks', '[]') }} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
                          <Trash2 /> Clear All
                        </button>
                      )}
                    </div>
                    {trashCount === 0 ? (
                      <p className="text-gray-500 text-xs py-4 text-center">Trash is empty</p>
                    ) : (
                      <div className="space-y-1">
                        <div className="trash-section-header">Tasks</div>
                        {trash.map((item, i) => (
                          <div key={i} className="flex items-center justify-between bg-white/5 p-2 rounded text-xs">
                            <span className="text-gray-300 truncate flex-1">{item.text} <span className="text-gray-500">({item.category})</span></span>
                            <button onClick={() => {
                              // restore: dispatch custom event that Tasks view listens to
                              window.dispatchEvent(new CustomEvent('restore-task', { detail: item }))
                              setTrash(prev => { const next = prev.filter((_, j) => j !== i); localStorage.setItem('bwTrashTasks', JSON.stringify(next)); return next })
                            }} className="text-brand-accent hover:text-white ml-2" title="Restore">
                              <RotateCcw />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Center: Tabs (absolutely centered) */}
            <div className="absolute left-1/2 -translate-x-1/2 flex gap-1">
              {TABS.map(v => (
                <button
                  key={v}
                  onClick={() => setActiveView(v)}
                  className={`px-3 py-1.5 rounded font-medium text-xs transition-all ${activeView === v ? 'btn-primary text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                >
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>

            {/* Right: stats */}
            <div className="flex items-center gap-2 z-10 pr-3">
              {taskStats && (
                <span className="text-xs text-gray-500">
                  <span className="text-brand-accent">{taskStats.done}</span>/{taskStats.total}
                </span>
              )}
              {!isConfigured && (
                <span className="text-xs text-gray-600" title="Local mode — data in browser only">local</span>
              )}
            </div>

          </div>
        </div>
      </nav>

      {/* Page content */}
      <div className={settings.fontSize === 'small' ? 'text-sm' : settings.fontSize === 'large' ? 'text-lg' : 'text-base'}>
        {children}
      </div>
    </div>
  )
}
