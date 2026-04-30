/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react'
import { supabase, isConfigured } from '../lib/supabase'

const FolderIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
const SettingsIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
const TrashBin = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
const UndoIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
const RedoIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10"/></svg>
const RotateCcw = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
const Trash2 = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>

// Bottom-nav icons
const TasksIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
const AffiliatesIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
const FormulasIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 2v7.31"/><path d="M14 9.3V1.99"/><path d="M8.5 2h7"/><path d="M14 9.3a6.5 6.5 0 1 1-4 0"/></svg>
const SheetsIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/></svg>
const EditorIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
const CloseIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const SignOutIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
const DrawerIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></svg>

const TABS = ['tasks', 'affiliates', 'formulas', 'sheets', 'editor']
const PRIMARY_TABS = [
  { id: 'tasks', label: 'Tasks', icon: <TasksIcon /> },
  { id: 'affiliates', label: 'Affiliates', icon: <AffiliatesIcon /> },
  { id: 'formulas', label: 'Formulas', icon: <FormulasIcon /> },
  { id: 'sheets', label: 'Sheets', icon: <SheetsIcon /> },
  { id: 'editor', label: 'Editor', icon: <EditorIcon /> },
]

function loadTrashTasks() {
  try { return JSON.parse(localStorage.getItem('bwTrashTasks')) || [] } catch { return [] }
}

export default function Layout({ user, activeView, setActiveView, taskStats, onUndo, onRedo, children }) {
  const [showFile, setShowFile] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showTrash, setShowTrash] = useState(false)
  const [showMobileNav, setShowMobileNav] = useState(false)
  const [settings, setSettings] = useState(() => {
    try { return JSON.parse(localStorage.getItem('bwSettings')) || { fontSize: 'medium' } } catch { return { fontSize: 'medium' } }
  })
  const [trash, setTrash] = useState(loadTrashTasks)

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

  useEffect(() => {
    const refreshTrash = () => setTrash(loadTrashTasks())
    window.addEventListener('trash-updated', refreshTrash)
    window.addEventListener('storage', refreshTrash)
    return () => {
      window.removeEventListener('trash-updated', refreshTrash)
      window.removeEventListener('storage', refreshTrash)
    }
  }, [])

  // Lock body scroll when the mobile navigation drawer is open
  useEffect(() => {
    document.body.style.overflow = showMobileNav ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [showMobileNav])

  const trashCount = trash.length

  const commitTrash = (next) => {
    localStorage.setItem('bwTrashTasks', JSON.stringify(next))
    setTrash(next)
    window.dispatchEvent(new CustomEvent('trash-updated'))
  }

  const switchView = (v) => {
    setActiveView(v)
    setShowMobileNav(false)
  }

  return (
    <div className="min-h-screen" style={{ background: '#1a1a1a' }}>
      {/* === Top Navbar === */}
      <nav className="glass-card sticky top-0 z-40 border-b border-white/5 pt-safe">
        <div className="px-1 sm:pl-2">
          <div className="flex items-center justify-between h-12 sm:h-10 relative">

            {/* Left: Logo + menus */}
            <div className="flex items-center gap-0.5 sm:gap-1 z-10">
              <button
                onClick={e => { e.stopPropagation(); setShowMobileNav(v => !v); setShowFile(false); setShowSettings(false); setShowTrash(false) }}
                className="sm:hidden w-9 h-9 rounded ml-1 mr-1 bg-brand-accent/90 text-white flex items-center justify-center flex-shrink-0 border border-brand-accent/40 shadow-sm active:bg-brand-accent"
                title="Navigation"
                aria-label="Open navigation"
              >
                <DrawerIcon />
              </button>

              {/* File menu */}
              <div className="relative menu-keep">
                <button onClick={e => { e.stopPropagation(); setShowFile(v => !v); setShowSettings(false); setShowTrash(false) }} className="nav-icon" title="File" aria-label="File menu">
                  <FolderIcon />
                </button>
                {showFile && (
                  <div className="absolute top-full left-0 mt-1 menu-dropdown rounded py-1 min-w-44 animate-fadeIn z-50">
                    <button onClick={() => { onUndo?.(); setShowFile(false) }} className="w-full text-left px-3 py-2 text-gray-300 hover:bg-white/10 flex items-center gap-2 text-sm">
                      <UndoIcon /> Undo <span className="ml-auto text-gray-600 text-[11px]">Ctrl+Z</span>
                    </button>
                    <button onClick={() => { onRedo?.(); setShowFile(false) }} className="w-full text-left px-3 py-2 text-gray-300 hover:bg-white/10 flex items-center gap-2 text-sm">
                      <RedoIcon /> Redo <span className="ml-auto text-gray-600 text-[11px]">Ctrl+Shift+Z</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Settings menu */}
              <div className="relative menu-keep">
                <button onClick={e => { e.stopPropagation(); setShowSettings(v => !v); setShowFile(false); setShowTrash(false) }} className="nav-icon" title="Settings" aria-label="Settings menu">
                  <SettingsIcon />
                </button>
                {showSettings && (
                  <div className="absolute top-full left-0 mt-1 menu-dropdown rounded p-4 w-80 max-w-[calc(100vw-1rem)] animate-fadeIn z-50" onClick={e => e.stopPropagation()}>
                    <h4 className="text-white font-medium mb-3 text-sm">Settings</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-gray-400 text-xs mb-1 block">Font Size</label>
                        <select value={settings.fontSize} onChange={e => setSettings(s => ({ ...s, fontSize: e.target.value }))} className="w-full px-2 py-2 bg-white/10 border border-white/10 rounded text-white text-sm">
                          <option value="small">Small</option>
                          <option value="medium">Medium</option>
                          <option value="large">Large</option>
                        </select>
                      </div>
                      {user && (
                        <div className="text-xs text-gray-500 truncate" title={user.email}>{user.email}</div>
                      )}
                      {!isConfigured && (
                        <div className="pt-2 border-t border-white/10">
                          <p className="text-xs text-gray-500">Running in local mode. Add Supabase credentials to <code className="bg-black/30 px-1 rounded">.env.local</code> for cloud sync.</p>
                        </div>
                      )}
                      <div className="pt-2 border-t border-white/10">
                        <h5 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Keyboard Shortcuts</h5>
                        <div className="space-y-1.5 text-xs">
                          {[
                            ['Ctrl/Cmd + Click', 'Toggle item selection'],
                            ['Shift + Click', 'Select a range'],
                            ['Drag Box', 'Select visible items'],
                            ['Ctrl/Cmd + A', 'Select the active list'],
                            ['Ctrl/Cmd + C', 'Copy selected items'],
                            ['Delete', 'Delete selected items'],
                            ['Esc', 'Clear selection'],
                            ['Ctrl/Cmd + Z', 'Undo'],
                            ['Ctrl/Cmd + Shift + Z', 'Redo'],
                          ].map(([keys, label]) => (
                            <div key={keys} className="flex items-center gap-3">
                              <span className="min-w-[116px] text-gray-300 font-mono text-[11px]">{keys}</span>
                              <span className="text-gray-500">{label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      {isConfigured && (
                        <div className="pt-2 border-t border-white/10">
                          <button onClick={() => supabase.auth.signOut()} className="w-full px-3 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded text-red-400 text-sm transition-all">
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
                <button onClick={e => { e.stopPropagation(); setShowTrash(v => !v); setShowFile(false); setShowSettings(false) }} className="nav-icon relative" title="Recycle Bin" aria-label="Recycle Bin">
                  <TrashBin />
                  {trashCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white">{trashCount}</span>
                  )}
                </button>
                {showTrash && (
                  <div className="absolute top-full left-0 mt-1 menu-dropdown rounded p-3 w-80 max-w-[calc(100vw-1rem)] max-h-96 overflow-y-auto animate-fadeIn z-50" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-white font-medium text-sm">Recycle Bin</h4>
                      {trashCount > 0 && (
                        <button onClick={() => commitTrash([])} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
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
                              window.dispatchEvent(new CustomEvent('restore-task', { detail: item }))
                              commitTrash(trash.filter((_, j) => j !== i))
                            }} className="text-brand-accent hover:text-white ml-2 p-1" title="Restore" aria-label="Restore task">
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

            {/* Center: Tabs (desktop only) */}
            <div className="hidden sm:flex absolute left-1/2 -translate-x-1/2 gap-1">
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

            {/* Mobile: current view name (centered) */}
            <div className="sm:hidden absolute left-1/2 -translate-x-1/2 text-sm font-semibold text-white capitalize pointer-events-none">
              {activeView}
            </div>

            {/* Right: stats */}
            <div className="flex items-center gap-2 z-10 pr-3">
              {taskStats && activeView === 'tasks' && (
                <span className="text-xs text-gray-500">
                  <span className="text-brand-accent">{taskStats.done}</span>/{taskStats.total}
                </span>
              )}
              {!isConfigured && (
                <span className="hidden sm:inline text-xs text-gray-600" title="Local mode — data in browser only">local</span>
              )}
            </div>

          </div>
        </div>
      </nav>

      {/* === Page content === */}
      <div className={`${settings.fontSize === 'small' ? 'text-sm' : settings.fontSize === 'large' ? 'text-lg' : 'text-base'} pb-safe sm:pb-0`}>
        {children}
      </div>

      {/* === Mobile navigation drawer === */}
      {showMobileNav && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-50 sm:hidden animate-fadeIn"
            onClick={() => setShowMobileNav(false)}
          />
          <div
            className="fixed top-[calc(48px+env(safe-area-inset-top,0px))] bottom-0 left-0 z-50 sm:hidden w-[82vw] max-w-[320px] glass-card border-r border-brand-accent/20 pb-safe flex flex-col"
            style={{ animation: 'drawerSlideIn 0.22s ease', transform: 'none' }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <h3 className="text-white font-semibold text-base">Navigation</h3>
              <button onClick={() => setShowMobileNav(false)} className="nav-icon" title="Close" aria-label="Close navigation">
                <CloseIcon />
              </button>
            </div>
            <div className="p-3 space-y-1 flex-1 overflow-y-auto">
              {PRIMARY_TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => switchView(t.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded text-left transition-all ${activeView === t.id ? 'bg-brand-accent/15 text-brand-accent border border-brand-accent/20' : 'text-gray-300 hover:bg-white/10 active:bg-white/10'}`}
                  aria-current={activeView === t.id ? 'page' : undefined}
                >
                  {t.icon}
                  <span className="text-sm font-medium">{t.label}</span>
                </button>
              ))}
            </div>
            <div className="p-3 border-t border-white/5">
              {isConfigured && (
                <button
                  onClick={() => { setShowMobileNav(false); supabase.auth.signOut() }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded text-left text-red-400 hover:bg-red-500/10 active:bg-red-500/20 transition-all"
                >
                  <SignOutIcon />
                  <span className="text-sm font-medium">Sign Out</span>
                </button>
              )}
              {user && (
                <div className="px-4 pt-3 text-xs text-gray-500 truncate">
                  Signed in as <span className="text-gray-300">{user.email}</span>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
