import { useState, useRef, useEffect, useCallback } from 'react'
import { useFormulas } from '../hooks/useFormulas'

const Plus = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const Trash = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
const EditIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>

function getRatioPreview(formula, targetIng, sourceId, sourceValue) {
  if (!targetIng.includeInRatio || targetIng.id === sourceId) return null
  const source = formula.ingredients.find(i => i.id === sourceId)
  if (!source || !source.includeInRatio) return null
  const sr = parseFloat(source.ratio)
  const tr = parseFloat(targetIng.ratio)
  const sv = parseFloat(sourceValue)
  if (!sr || !tr || isNaN(sv)) return null
  const result = (tr / sr) * sv
  return Number.isFinite(result) ? result.toFixed(2) : null
}

function Toast({ msg }) {
  if (!msg) return null
  return (
    <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: '#252525', border: '1px solid rgba(196,94,44,0.3)', borderRadius: 6, padding: '8px 16px', color: '#e5e5e5', fontSize: 13, zIndex: 1000, pointerEvents: 'none' }}>
      {msg}
    </div>
  )
}

export default function Formulas({ userId }) {
  const { formulas, loading, saveFormula, deleteFormula, addFormula } = useFormulas(userId)
  const [activeId, setActiveId] = useState(null)
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [ratioPreview, setRatioPreview] = useState({ sourceId: null, sourceValue: '' })
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [colWidths, setColWidths] = useState({ amount: 120, ratio: 175, cost: 135 })
  const [toast, setToast] = useState(null)
  const [showImport, setShowImport] = useState(false)
  const [importText, setImportText] = useState('')
  const [importError, setImportError] = useState('')

  const [localFormulas, setLocalFormulas] = useState([])
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)
  useEffect(() => { setLocalFormulas(formulas) }, [formulas])
  useEffect(() => { setEditingName(false) }, [activeId])
  // Auto-close mobile drawer when a formula is selected
  useEffect(() => { if (activeId) setShowMobileSidebar(false) }, [activeId])

  const active = localFormulas.find(f => f.id === activeId)

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 1800) }

  function updateLocal(id, updates) {
    setLocalFormulas(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f))
  }

  async function handleCreate() {
    if (!newName.trim()) return
    const f = await addFormula(newName.trim())
    if (f) setActiveId(f.id)
    setNewName(''); setShowNew(false)
  }

  async function handleSave(formula) {
    await saveFormula({
      id: formula.id,
      name: formula.name,
      ingredients: formula.ingredients,
      targetCost: formula.target_cost || '',
      targetMargin: formula.target_margin || '',
      notes: formula.notes || '',
    })
    showToast('Saved')
  }

  function addIngredient(formulaId) {
    const formula = localFormulas.find(f => f.id === formulaId)
    if (!formula) return
    const newIng = { id: crypto.randomUUID(), name: '', amount: '', cost: '', ratio: '', includeInRatio: true }
    const updated = { ...formula, ingredients: [...formula.ingredients, newIng] }
    updateLocal(formulaId, { ingredients: updated.ingredients })
    handleSave(updated)
  }

  function updateIngredient(formulaId, ingId, changes) {
    const formula = localFormulas.find(f => f.id === formulaId)
    if (!formula) return
    const updated = { ...formula, ingredients: formula.ingredients.map(i => i.id === ingId ? { ...i, ...changes } : i) }
    updateLocal(formulaId, { ingredients: updated.ingredients })
    return updated
  }

  function removeIngredient(formulaId, ingId) {
    const formula = localFormulas.find(f => f.id === formulaId)
    if (!formula) return
    const updated = { ...formula, ingredients: formula.ingredients.filter(i => i.id !== ingId) }
    updateLocal(formulaId, { ingredients: updated.ingredients })
    handleSave(updated)
  }

  function saveIngredient(formulaId) {
    const formula = localFormulas.find(f => f.id === formulaId)
    if (formula) handleSave(formula)
  }

  function saveName() {
    if (nameDraft.trim() && active) {
      const updated = { ...active, name: nameDraft.trim() }
      updateLocal(activeId, { name: nameDraft.trim() })
      handleSave(updated)
    }
    setEditingName(false)
  }

  function startResize(col, e) {
    e.preventDefault()
    const startX = e.clientX
    const startW = colWidths[col]
    const onMove = (e) => setColWidths(prev => ({ ...prev, [col]: Math.max(70, startW + (e.clientX - startX)) }))
    const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp) }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  function getTotalCost(formula) {
    return formula.ingredients.reduce((s, i) => s + (parseFloat(i.cost) || 0), 0)
  }

  function exportFormula(format) {
    if (!active) return
    const total = getTotalCost(active)
    let content = '', filename = active.name.replace(/[^a-z0-9]/gi, '_')
    if (format === 'txt') {
      content = `Formula: ${active.name}\n${'='.repeat(40)}\n\nIngredients:\n${'-'.repeat(20)}\n`
      active.ingredients.forEach((ing, i) => { content += `${i + 1}. ${ing.name || '(unnamed)'}${ing.amount ? ` (${ing.amount})` : ''} - $${ing.cost || '0'}\n` })
      content += `${'-'.repeat(20)}\nTotal Cost: $${total.toFixed(2)}\n`
      if (active.notes) content += `\nNotes:\n${active.notes}\n`
      filename += '.txt'
    } else if (format === 'md') {
      content = `# ${active.name}\n\n## Ingredients\n\n| # | Ingredient | Amount | Cost |\n|---|---|---|---|\n`
      active.ingredients.forEach((ing, i) => { content += `| ${i + 1} | ${ing.name || '(unnamed)'} | ${ing.amount || '-'} | $${ing.cost || '0'} |\n` })
      content += `\n**Total Cost:** $${total.toFixed(2)}\n`
      if (active.notes) content += `\n## Notes\n\n${active.notes}\n`
      filename += '.md'
    }
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
    URL.revokeObjectURL(url)
    showToast(`Exported ${format.toUpperCase()}`)
  }

  function doImport() {
    if (!active) { setImportError('Select a formula first'); return }
    const lines = importText.trim().split('\n')
    const newIngs = []
    lines.forEach(line => {
      if (!line.trim() || line.includes('━') || line.toLowerCase().includes('example') || line.toLowerCase().includes('format')) return
      const parts = line.split('|').map(p => p.trim())
      if (!parts[0]) return
      newIngs.push({ id: crypto.randomUUID(), name: parts[0], amount: parts[1] || '', cost: parts[2] || '', ratio: '', includeInRatio: true })
    })
    if (!newIngs.length) { setImportError('No valid ingredients found.'); return }
    const updated = { ...active, ingredients: [...active.ingredients, ...newIngs] }
    updateLocal(activeId, { ingredients: updated.ingredients })
    handleSave(updated)
    setImportText(''); setImportError(''); setShowImport(false)
    showToast(`Imported ${newIngs.length} ingredient(s)`)
  }

  const gridTemplate = `24px 1fr ${colWidths.amount}px ${colWidths.ratio}px ${colWidths.cost}px 28px`

  const ResizeHandle = ({ col }) => (
    <div
      onMouseDown={e => startResize(col, e)}
      style={{ width: 4, cursor: 'col-resize', background: 'transparent', borderRight: '1px solid rgba(255,255,255,0.06)', marginLeft: 'auto', height: '100%', flexShrink: 0 }}
      className="hover:border-brand-accent/40 transition-colors"
    />
  )

  if (loading) return (
    <div className="p-4 pt-6 animate-fadeIn flex items-center justify-center h-[calc(100vh-160px)] sm:h-[calc(100vh-40px)]">
      <span className="text-gray-600 text-sm">Loading formulas...</span>
    </div>
  )

  return (
    <div className="p-3 pt-4 sm:p-4 sm:pt-6 animate-fadeIn h-[calc(100vh-136px)] sm:h-[calc(100vh-40px)]">
      <Toast msg={toast} />

      {/* Import modal */}
      {showImport && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setShowImport(false)}>
          <div className="glass-card rounded-lg w-full max-w-lg animate-scaleIn" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <h3 className="text-sm font-semibold text-white">Import Ingredients</h3>
              <button onClick={() => setShowImport(false)} className="text-gray-500 hover:text-white text-lg leading-none">×</button>
            </div>
            <div className="p-4">
              <p className="text-xs text-gray-500 mb-2">One per line: <code className="bg-black/30 px-1 rounded">Name | Amount | Cost</code></p>
              {importError && <div className="text-red-400 text-xs mb-2">{importError}</div>}
              <textarea
                value={importText}
                onChange={e => setImportText(e.target.value)}
                placeholder={"Shea Butter | 100g | 5.00\nCoconut Oil | 50ml | 1.50"}
                rows={8}
                className="w-full bg-brand-dark border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-brand-accent/40 resize-none font-mono"
              />
              <div className="flex gap-2 mt-3 justify-end">
                <button onClick={() => setShowImport(false)} className="px-3 py-1.5 text-sm text-gray-400 hover:text-white bg-white/5 rounded">Cancel</button>
                <button onClick={doImport} className="btn-primary px-3 py-1.5 text-sm rounded">Import</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-4 h-full">

        {/* ── Mobile drawer backdrop ── */}
        {showMobileSidebar && (
          <div
            className="drawer-backdrop sm:hidden"
            onClick={() => setShowMobileSidebar(false)}
          />
        )}

        {/* ── Formula List Sidebar ── */}
        <div className={`${showMobileSidebar ? 'drawer-panel' : 'hidden'} sm:block sm:relative sm:w-64 sm:flex-shrink-0 sm:h-full`}>
          <div className="glass-card sm:rounded p-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold">Formulas</h2>
              <button
                onClick={() => setShowNew(true)}
                className="btn-primary px-2 py-1 rounded text-xs flex items-center gap-1"
              >
                <Plus /> New
              </button>
            </div>

            {showNew && (
              <div className="bg-white/5 p-3 rounded mb-3 border border-white/10 animate-slideUp">
                <input
                  autoFocus
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') { setShowNew(false); setNewName('') } }}
                  onBlur={() => { if (!newName.trim()) setShowNew(false) }}
                  placeholder="Formula name..."
                  className="w-full px-2 py-1.5 bg-brand-dark border border-white/10 rounded text-white placeholder-gray-500 text-sm outline-none focus:border-brand-accent/40 mb-2"
                />
                <div className="flex gap-2">
                  <button onClick={handleCreate} className="btn-primary px-2 py-1 rounded text-xs">Add</button>
                  <button onClick={() => { setShowNew(false); setNewName('') }} className="px-2 py-1 bg-white/10 text-gray-300 rounded text-xs hover:bg-white/20">Cancel</button>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto space-y-1">
              {localFormulas.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">No formulas yet</p>
              ) : localFormulas.map(f => (
                <div key={f.id} className="relative group">
                  <button
                    onTouchStart={() => {}}  // activates :active on iOS
                    onClick={() => setActiveId(f.id)}
                    className={`w-full text-left p-3 rounded transition-all ${f.id === activeId ? 'bg-brand-accent/20 text-white border border-brand-accent/30' : 'text-gray-400 active:bg-white/10 hover:bg-white/5 hover:text-gray-200 border border-transparent'}`}
                    style={{ touchAction: 'manipulation' }}
                  >
                    <div className="text-sm truncate pr-6">{f.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {f.ingredients?.length || 0} ingredient{(f.ingredients?.length || 0) !== 1 ? 's' : ''}
                    </div>
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); if (confirm('Delete this formula?')) { deleteFormula(f.id); if (activeId === f.id) setActiveId(null) } }}
                    className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:bg-white/10 rounded transition-all"
                    style={{ touchAction: 'manipulation' }}
                  >
                    <Trash />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Formula Editor ── */}
        <div className="flex-1 min-w-0">
          {!active ? (
            <div className="glass-card rounded p-5 h-full flex flex-col items-center justify-center">
              <p className="text-gray-600 text-sm mb-4">
                {localFormulas.length === 0 ? 'Create your first formula' : 'Select a formula'}
              </p>
              <button
                onClick={() => setShowMobileSidebar(true)}
                className="sm:hidden btn-primary px-4 py-2.5 rounded text-white text-sm flex items-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
                Browse Formulas
              </button>
            </div>
          ) : (
            <div className="glass-card rounded p-3 sm:p-5 h-full flex flex-col overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between mb-3 sm:mb-4 pb-3 sm:pb-4 border-b border-white/10 shrink-0 gap-2">
                <button
                  onClick={() => setShowMobileSidebar(true)}
                  className="sm:hidden nav-icon flex-shrink-0"
                  title="Show formulas"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
                </button>
                {editingName ? (
                  <input
                    autoFocus
                    value={nameDraft}
                    onChange={e => setNameDraft(e.target.value)}
                    onBlur={saveName}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') saveName() }}
                    className="text-xl font-semibold text-white bg-transparent border-b-2 border-brand-accent outline-none flex-1 mr-4 min-w-0"
                  />
                ) : (
                  <h2
                    onClick={() => { setNameDraft(active.name); setEditingName(true) }}
                    className="text-base sm:text-xl font-semibold text-white cursor-pointer hover:text-brand-accent transition-colors group flex items-center gap-2 select-none truncate min-w-0 flex-1"
                    title="Click to rename"
                  >
                    <span className="truncate">{active.name}</span>
                    <span className="opacity-0 group-hover:opacity-40 transition-opacity shrink-0 hidden sm:inline"><EditIcon /></span>
                  </h2>
                )}

                <div className="flex gap-1 sm:gap-2 shrink-0">
                  <button onClick={() => setShowImport(true)} className="text-xs text-gray-500 hover:text-gray-300 px-2 py-1.5 sm:py-1 rounded hover:bg-white/5 active:bg-white/5 transition-all">Import</button>
                  <button onClick={() => exportFormula('txt')} className="hidden sm:inline text-xs text-gray-500 hover:text-gray-300 px-2 py-1 rounded hover:bg-white/5 transition-all">TXT</button>
                  <button onClick={() => exportFormula('md')} className="text-xs text-gray-500 hover:text-gray-300 px-2 py-1.5 sm:py-1 rounded hover:bg-white/5 active:bg-white/5 transition-all">MD</button>
                  <button
                    onClick={() => {
                      const total = getTotalCost(active)
                      let text = `Formula: ${active.name}\n\nIngredients:\n`
                      active.ingredients.forEach((ing, i) => { text += `${i + 1}. ${ing.name || '(unnamed)'}${ing.amount ? ` (${ing.amount})` : ''} - $${ing.cost || '0'}\n` })
                      text += `\nTotal Cost: $${total.toFixed(2)}`
                      navigator.clipboard.writeText(text)
                      showToast('Copied for Claude')
                    }}
                    className="hidden sm:inline text-xs text-gray-500 hover:text-brand-accent px-2 py-1 rounded hover:bg-white/5 transition-all"
                  >
                    Copy for Claude
                  </button>
                </div>
              </div>

              {/* Ingredient table — horizontal scroll on mobile */}
              <div className="flex-1 overflow-y-auto min-h-0">
                {/* Scrollable grid area */}
                <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
                  <div style={{ minWidth: 480 }}>
                    {/* Column headers */}
                    <div
                      style={{ display: 'grid', gridTemplateColumns: gridTemplate, columnGap: 8, marginBottom: 4, paddingRight: 4 }}
                      className="border-b border-white/5 pb-2"
                    >
                      <div />
                      <div className="text-xs text-gray-600 font-medium uppercase tracking-wider">Ingredient</div>
                      <div className="flex items-center">
                        <span className="text-xs text-gray-600 font-medium uppercase tracking-wider flex-1">Amount</span>
                        <ResizeHandle col="amount" />
                      </div>
                      <div className="flex items-center">
                        <span className="text-xs text-gray-600 font-medium uppercase tracking-wider flex-1">Ratio</span>
                        <ResizeHandle col="ratio" />
                      </div>
                      <div className="flex items-center">
                        <span className="text-xs text-gray-600 font-medium uppercase tracking-wider flex-1">Cost ($)</span>
                        <ResizeHandle col="cost" />
                      </div>
                      <div />
                    </div>

                    {/* Ingredient rows */}
                    {active.ingredients.map(ing => {
                      const previewVal = getRatioPreview(active, ing, ratioPreview.sourceId, ratioPreview.sourceValue)
                      const isSource = ratioPreview.sourceId === ing.id
                      const showingPreview = previewVal !== null

                      return (
                        <div
                          key={ing.id}
                          className="group"
                          style={{ display: 'grid', gridTemplateColumns: gridTemplate, columnGap: 8, alignItems: 'center', paddingRight: 4, paddingTop: 3, paddingBottom: 3 }}
                        >
                          {/* Ratio-include checkbox */}
                          <div className="flex items-center">
                            <button
                              title={ing.includeInRatio ? 'Included in ratio' : 'Excluded from ratio'}
                              onClick={() => {
                                const updated = updateIngredient(active.id, ing.id, { includeInRatio: !ing.includeInRatio })
                                if (updated) handleSave(updated)
                              }}
                              style={{ width: 14, height: 14, borderRadius: 3, border: '1px solid', flexShrink: 0, borderColor: ing.includeInRatio ? '#c45e2c' : 'rgba(255,255,255,0.15)', background: ing.includeInRatio ? 'rgba(196,94,44,0.2)' : 'transparent' }}
                            />
                          </div>

                          {/* Name */}
                          <input
                            value={ing.name}
                            onChange={e => updateIngredient(active.id, ing.id, { name: e.target.value })}
                            onBlur={() => saveIngredient(active.id)}
                            placeholder="Ingredient name"
                            style={{ minWidth: 0, background: 'transparent', border: 'none', outline: 'none', color: '#e5e5e5', fontSize: 13 }}
                            className="placeholder-gray-700"
                          />

                          {/* Amount */}
                          <input
                            value={ing.amount}
                            onChange={e => updateIngredient(active.id, ing.id, { amount: e.target.value })}
                            onBlur={() => saveIngredient(active.id)}
                            placeholder="e.g. 100g"
                            style={{ minWidth: 0, width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 3, padding: '3px 6px', color: '#e5e5e5', fontSize: 13, outline: 'none' }}
                          />

                          {/* Ratio */}
                          <div style={{ position: 'relative', minWidth: 0 }}>
                            <input
                              value={isSource ? ratioPreview.sourceValue : (showingPreview ? previewVal : (ing.ratio || ''))}
                              readOnly={showingPreview && !isSource}
                              onChange={e => {
                                if (isSource || ratioPreview.sourceId === null) {
                                  setRatioPreview({ sourceId: ing.id, sourceValue: e.target.value })
                                }
                              }}
                              onFocus={() => {
                                if (!isSource) setRatioPreview({ sourceId: ing.id, sourceValue: ing.ratio || '' })
                              }}
                              onBlur={() => {
                                if (isSource) {
                                  const updated = updateIngredient(active.id, ing.id, { ratio: ratioPreview.sourceValue })
                                  if (updated) handleSave(updated)
                                }
                                setRatioPreview({ sourceId: null, sourceValue: '' })
                              }}
                              placeholder="ratio"
                              style={{
                                minWidth: 0, width: '100%',
                                background: isSource ? 'rgba(196,94,44,0.1)' : showingPreview ? 'rgba(139,154,62,0.08)' : 'rgba(255,255,255,0.03)',
                                border: isSource ? '1px solid rgba(196,94,44,0.4)' : '1px solid rgba(255,255,255,0.06)',
                                borderRadius: 3, padding: '3px 6px',
                                color: showingPreview && !isSource ? '#8b9a3e' : '#e5e5e5',
                                fontSize: 13, outline: 'none',
                                cursor: showingPreview && !isSource ? 'default' : 'text'
                              }}
                            />
                            {!ing.includeInRatio && (
                              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', borderRadius: 3, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ fontSize: 10, color: '#555' }}>excl.</span>
                              </div>
                            )}
                          </div>

                          {/* Cost */}
                          <input
                            value={ing.cost}
                            onChange={e => updateIngredient(active.id, ing.id, { cost: e.target.value })}
                            onBlur={() => saveIngredient(active.id)}
                            placeholder="0.00"
                            style={{ minWidth: 0, width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 3, padding: '3px 6px', color: '#e5e5e5', fontSize: 13, outline: 'none' }}
                          />

                          {/* Remove */}
                          <button
                            onClick={() => removeIngredient(active.id, ing.id)}
                            className="opacity-100 sm:opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 active:text-red-400 transition-all flex items-center justify-center"
                          >
                            <Trash />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Below-grid controls — full width, no horizontal scroll */}
                <div className="mt-2">
                  <button
                    onClick={() => addIngredient(active.id)}
                    className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-brand-accent active:text-brand-accent transition-colors py-2 px-1"
                  >
                    <Plus /> Add ingredient
                  </button>

                  {active.ingredients.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                      <span className="text-xs text-gray-600">Total Cost</span>
                      <span className="text-sm font-semibold text-brand-accent">${getTotalCost(active).toFixed(2)}</span>
                    </div>
                  )}

                  <div className="mt-5 pt-4 border-t border-white/5">
                    <label className="text-xs text-gray-600 block mb-1.5">Notes</label>
                    <textarea
                      value={active.notes || ''}
                      onChange={e => updateLocal(active.id, { notes: e.target.value })}
                      onBlur={() => handleSave(active)}
                      placeholder="Formula notes..."
                      rows={3}
                      className="w-full bg-brand-dark border border-white/5 rounded px-3 py-2 text-sm text-gray-300 placeholder-gray-700 outline-none focus:border-brand-accent/30 resize-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
