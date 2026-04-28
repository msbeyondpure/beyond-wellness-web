/* eslint-disable react/prop-types */
import { useState, useRef, useEffect, useMemo } from 'react'
import { useFormulas } from '../hooks/useFormulas'
import { LEGACY_INVENTORY_SHEET_NAME, MASTER_SOURCING_SHEET_NAME, useSheets } from '../hooks/useSheets'

const Plus = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const Trash = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
const EditIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
const LinkIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>

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

// ── persistent undo helpers (formula-level) ───────────────────────────────────
const F_UNDO_KEY = (id) => `bwFUndo:${id}`
const F_REDO_KEY = (id) => `bwFRedo:${id}`
const F_MAX      = 50

function fLoadStack(key) {
  try { return JSON.parse(localStorage.getItem(key)) || [] } catch { return [] }
}
function fSaveStack(key, arr) {
  try { localStorage.setItem(key, JSON.stringify(arr)) } catch { /* ignore storage failures */ }
}
function makeIngredient() {
  return { id: crypto.randomUUID(), name: '', amount: '', cost: '', ratio: '', includeInRatio: true, link: '', notes: '', sourcingItemId: '' }
}
function normalizeIngredient(ing = {}) {
  return {
    id: ing.id || crypto.randomUUID(),
    name: ing.name || '',
    amount: ing.amount || '',
    cost: ing.cost || '',
    ratio: ing.ratio || '',
    includeInRatio: ing.includeInRatio !== false,
    link: ing.link || '',
    notes: ing.notes || '',
    sourcingItemId: ing.sourcingItemId || '',
  }
}
function normalizeFormula(f) {
  return {
    ...f,
    ingredients: Array.isArray(f.ingredients) ? f.ingredients.map(normalizeIngredient) : [],
    target_cost: f.target_cost ?? f.targetCost ?? '',
    target_margin: f.target_margin ?? f.targetMargin ?? '',
    notes: f.notes || '',
  }
}
function formulaSnapshot(f) {
  const normalized = normalizeFormula(f)
  return { name: normalized.name, ingredients: JSON.parse(JSON.stringify(normalized.ingredients || [])), target_cost: normalized.target_cost || '', target_margin: normalized.target_margin || '', notes: normalized.notes || '' }
}

function sourceCell(sheet, row, names) {
  for (const name of names) {
    const column = sheet.columns?.find(col => col.name.toLowerCase() === name.toLowerCase())
    const value = column ? row.cells?.[column.id] : ''
    if (String(value || '').trim()) return value
  }
  return ''
}

function buildSourceNotes(item) {
  return [
    item.category && `Category: ${item.category}`,
    item.source && `Source: ${item.source}`,
    item.unitPrice && `Unit price: ${item.unitPrice}`,
    item.onHand && `On hand: ${item.onHand}${item.unit ? ` ${item.unit}` : ''}`,
    item.reorderPoint && `Reorder point: ${item.reorderPoint}`,
    item.inStock && `Stock: ${item.inStock}`,
    item.status && `Status: ${item.status}`,
    item.notes,
  ].filter(Boolean).join('\n')
}

function buildSourcingItems(sheets) {
  return sheets
    .filter(sheet => [MASTER_SOURCING_SHEET_NAME, LEGACY_INVENTORY_SHEET_NAME].includes(sheet.name))
    .flatMap(sheet => (sheet.rows || []).map(row => {
      const name = sourceCell(sheet, row, ['Ingredient', 'Item Name', 'Component', 'Name'])
      if (!String(name || '').trim()) return null
      const item = {
        key: `${sheet.id}:${row.id}`,
        sheetName: sheet.name,
        name,
        category: sourceCell(sheet, row, ['Inventory Category', 'Item Type', 'Function']),
        source: sourceCell(sheet, row, ['Preferred Source', 'Preferred Supplier', 'Supplier']),
        link: sourceCell(sheet, row, ['Preferred Link', 'Supplier Link', 'Backup Link', 'Link']),
        unitPrice: sourceCell(sheet, row, ['Unit Price', 'Unit Cost', 'Ingredient Cost / Unit']),
        onHand: sourceCell(sheet, row, ['On Hand', 'Available']),
        unit: sourceCell(sheet, row, ['Unit']),
        reorderPoint: sourceCell(sheet, row, ['Reorder Point']),
        inStock: sourceCell(sheet, row, ['IN STOCK']),
        status: sourceCell(sheet, row, ['Status', 'Reorder Status']),
        notes: sourceCell(sheet, row, ['Notes', 'Compliance Notes']),
      }
      return { ...item, notesPreview: buildSourceNotes(item) }
    }).filter(Boolean))
    .sort((a, b) => String(a.name).localeCompare(String(b.name)))
}

export default function Formulas({ userId, resetKey, registerUndo }) {
  const { formulas, loading, saveFormula, deleteFormula, addFormula } = useFormulas(userId)
  const { sheets: sourcingSheets } = useSheets(userId)
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
  const [, setHistoryVer] = useState(0)
  const [selectedIngredientId, setSelectedIngredientId] = useState(null)

  // reset when tab icon re-tapped
  useEffect(() => { if (resetKey) { setActiveId(null); setShowNew(false); setNewName(''); setSelectedIngredientId(null) } }, [resetKey])

  // per-formula undo/redo stored in refs (keys = formula id)
  const undoRef   = useRef({})  // { [id]: snapshot[] }
  const redoRef   = useRef({})  // { [id]: snapshot[] }
  // capture state BEFORE a mutation so we can push it as the undo checkpoint
  const preMutRef = useRef(null) // snapshot captured just before first onChange
  const preMutTimer = useRef(null)
  const localFormulaRef = useRef(new Map())
  const dirtyFormulaIdsRef = useRef(new Set())

  const [localFormulas, setLocalFormulas] = useState([])
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)
  useEffect(() => {
    const incoming = formulas.map(normalizeFormula)
    setLocalFormulas(prev => {
      const prevById = new Map(prev.map(f => [f.id, f]))
      const incomingIds = new Set(incoming.map(f => f.id))
      const merged = incoming.map(f => (
        dirtyFormulaIdsRef.current.has(f.id) && prevById.has(f.id) ? prevById.get(f.id) : f
      ))
      prev.forEach(f => {
        if (!incomingIds.has(f.id) && dirtyFormulaIdsRef.current.has(f.id)) merged.push(f)
      })
      localFormulaRef.current = new Map(merged.map(f => [f.id, f]))
      return merged
    })
  }, [formulas])
  useEffect(() => { setEditingName(false) }, [activeId])
  // Auto-close mobile drawer when a formula is selected
  useEffect(() => { if (activeId) setShowMobileSidebar(false) }, [activeId])

  // Load undo/redo for newly selected formula
  useEffect(() => {
    if (!activeId) return
    if (!undoRef.current[activeId]) undoRef.current[activeId] = fLoadStack(F_UNDO_KEY(activeId))
    if (!redoRef.current[activeId]) redoRef.current[activeId] = fLoadStack(F_REDO_KEY(activeId))
    setHistoryVer(v => v + 1)
  }, [activeId])

  const active = localFormulas.find(f => f.id === activeId)
  const selectedIngredient = active?.ingredients.find(ing => ing.id === selectedIngredientId)
  const sourcingItems = useMemo(() => buildSourcingItems(sourcingSheets), [sourcingSheets])
  const selectedSourcingItem = sourcingItems.find(item => item.key === selectedIngredient?.sourcingItemId)

  useEffect(() => {
    if (!active || !selectedIngredientId || !active.ingredients.some(ing => ing.id === selectedIngredientId)) {
      setSelectedIngredientId(null)
    }
  }, [active, selectedIngredientId])

  const canFUndo = activeId && (undoRef.current[activeId]?.length > 0)
  const canFRedo = activeId && (redoRef.current[activeId]?.length > 0)

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 1800) }

  // Schedule capturing the pre-mutation snapshot (first keystroke in a change session)
  function schedulePre(formula) {
    if (preMutRef.current?.id === formula.id) return // already captured for this session
    const snap = formulaSnapshot(formula)
    preMutRef.current = { id: formula.id, snap }
    clearTimeout(preMutTimer.current)
    preMutTimer.current = setTimeout(() => {
      // Commit the pre-mutation snapshot to undo stack after 2s of inactivity
      if (preMutRef.current) {
        const { id, snap } = preMutRef.current
        const stack = undoRef.current[id] || []
        const last  = stack[stack.length - 1]
        if (JSON.stringify(last) !== JSON.stringify(snap)) {
          const next = [...stack, snap].slice(-F_MAX)
          undoRef.current[id] = next
          redoRef.current[id] = []
          fSaveStack(F_UNDO_KEY(id), next)
          try { localStorage.removeItem(F_REDO_KEY(id)) } catch { /* ignore storage failures */ }
          setHistoryVer(v => v + 1)
        }
        preMutRef.current = null
      }
    }, 2000)
  }

  function performFormulaUndo() {
    if (!active) return
    const id    = active.id
    const stack = undoRef.current[id] || []
    if (stack.length === 0) return
    const prev    = stack[stack.length - 1]
    const newUndo = stack.slice(0, -1)
    const curr    = formulaSnapshot(active)
    const redoStack = redoRef.current[id] || []
    const newRedo   = [...redoStack, curr].slice(-F_MAX)
    undoRef.current[id] = newUndo
    redoRef.current[id] = newRedo
    fSaveStack(F_UNDO_KEY(id), newUndo)
    fSaveStack(F_REDO_KEY(id), newRedo)
    const restored = { ...active, ...prev }
    updateLocal(id, prev)
    handleSave(restored, true)
    setHistoryVer(v => v + 1)
    showToast('Undone')
  }

  function performFormulaRedo() {
    if (!active) return
    const id      = active.id
    const rStack  = redoRef.current[id] || []
    if (rStack.length === 0) return
    const next    = rStack[rStack.length - 1]
    const newRedo = rStack.slice(0, -1)
    const curr    = formulaSnapshot(active)
    const uStack  = undoRef.current[id] || []
    const newUndo = [...uStack, curr].slice(-F_MAX)
    undoRef.current[id] = newUndo
    redoRef.current[id] = newRedo
    fSaveStack(F_UNDO_KEY(id), newUndo)
    fSaveStack(F_REDO_KEY(id), newRedo)
    const restored = { ...active, ...next }
    updateLocal(id, next)
    handleSave(restored, true)
    setHistoryVer(v => v + 1)
    showToast('Redone')
  }

  // Register with global undo system (use refs so we never stale-close over active)
  const undoFnRef = useRef(null)
  const redoFnRef = useRef(null)
  undoFnRef.current = performFormulaUndo
  redoFnRef.current = performFormulaRedo
  useEffect(() => {
    registerUndo?.(
      () => undoFnRef.current?.(),
      () => redoFnRef.current?.()
    )
  }, [registerUndo])

  function setFormulaLocal(formula, markDirty = true) {
    const normalized = normalizeFormula(formula)
    if (markDirty) dirtyFormulaIdsRef.current.add(normalized.id)
    localFormulaRef.current.set(normalized.id, normalized)
    setLocalFormulas(prev => {
      const exists = prev.some(f => f.id === normalized.id)
      return exists ? prev.map(f => f.id === normalized.id ? normalized : f) : [...prev, normalized]
    })
    return normalized
  }

  function getLatestFormula(id) {
    return localFormulaRef.current.get(id) || localFormulas.find(f => f.id === id)
  }

  function updateLocal(id, updates, markDirty = true) {
    const formula = getLatestFormula(id)
    if (!formula) return null
    return setFormulaLocal({ ...formula, ...updates }, markDirty)
  }

  async function handleCreate() {
    if (!newName.trim()) return
    const f = await addFormula(newName.trim())
    if (f) {
      const normalized = setFormulaLocal(normalizeFormula(f), false)
      setActiveId(normalized.id)
    }
    setNewName(''); setShowNew(false)
  }

  async function handleSave(formula, skipSnapshot = false) {
    const latest = formula?.id ? (getLatestFormula(formula.id) || formula) : formula
    const normalized = normalizeFormula(latest)
    if (!skipSnapshot && normalized.id) {
      // Flush any pending pre-mutation snapshot before saving
      if (preMutRef.current?.id === normalized.id) {
        clearTimeout(preMutTimer.current)
        const { id, snap } = preMutRef.current
        const stack = undoRef.current[id] || []
        const last  = stack[stack.length - 1]
        if (JSON.stringify(last) !== JSON.stringify(snap)) {
          const next = [...stack, snap].slice(-F_MAX)
          undoRef.current[id] = next
          redoRef.current[id] = []
          fSaveStack(F_UNDO_KEY(id), next)
          try { localStorage.removeItem(F_REDO_KEY(id)) } catch { /* ignore storage failures */ }
          setHistoryVer(v => v + 1)
        }
        preMutRef.current = null
      }
    }
    const saved = await saveFormula({
      id: normalized.id,
      name: normalized.name,
      ingredients: normalized.ingredients,
      targetCost: normalized.target_cost || '',
      targetMargin: normalized.target_margin || '',
      notes: normalized.notes || '',
    })
    if (saved) {
      dirtyFormulaIdsRef.current.delete(normalized.id)
      setFormulaLocal(normalizeFormula(saved), false)
      showToast('Saved')
    } else {
      showToast('Save failed')
    }
  }

  function saveFormulaById(formulaId) {
    const formula = getLatestFormula(formulaId)
    if (formula) handleSave(formula)
  }

  function addIngredient(formulaId) {
    const formula = getLatestFormula(formulaId)
    if (!formula) return
    schedulePre(formula)
    const newIng = makeIngredient()
    const updated = { ...formula, ingredients: [...formula.ingredients, newIng] }
    setFormulaLocal(updated)
    handleSave(updated)
  }

  function updateIngredient(formulaId, ingId, changes) {
    const formula = getLatestFormula(formulaId)
    if (!formula) return
    schedulePre(formula)
    const updated = { ...formula, ingredients: formula.ingredients.map(i => i.id === ingId ? normalizeIngredient({ ...i, ...changes }) : i) }
    setFormulaLocal(updated)
    return updated
  }

  function removeIngredient(formulaId, ingId) {
    const formula = getLatestFormula(formulaId)
    if (!formula) return
    schedulePre(formula)
    const updated = { ...formula, ingredients: formula.ingredients.filter(i => i.id !== ingId) }
    if (selectedIngredientId === ingId) setSelectedIngredientId(null)
    setFormulaLocal(updated)
    handleSave(updated)
  }

  function saveIngredient(formulaId) {
    const formula = getLatestFormula(formulaId)
    if (formula) handleSave(formula)
  }

  function saveName() {
    if (nameDraft.trim() && active) {
      schedulePre(active)
      const updated = { ...active, name: nameDraft.trim() }
      setFormulaLocal(updated)
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
      newIngs.push({ id: crypto.randomUUID(), name: parts[0], amount: parts[1] || '', cost: parts[2] || '', ratio: '', includeInRatio: true, link: parts[3] || '', notes: parts.slice(4).join(' | ') || '' })
    })
    if (!newIngs.length) { setImportError('No valid ingredients found.'); return }
    const updated = { ...active, ingredients: [...active.ingredients, ...newIngs] }
    setFormulaLocal(updated)
    handleSave(updated)
    setImportText(''); setImportError(''); setShowImport(false)
    showToast(`Imported ${newIngs.length} ingredient(s)`)
  }

  function closeIngredientDetails() {
    if (active) saveIngredient(active.id)
    setSelectedIngredientId(null)
  }

  function selectSourcingItem(key) {
    if (!active || !selectedIngredient) return
    const item = sourcingItems.find(source => source.key === key)
    if (!item) {
      const updated = updateIngredient(active.id, selectedIngredient.id, { sourcingItemId: '' })
      if (updated) handleSave(updated)
      return
    }

    const updates = {
      sourcingItemId: item.key,
      name: item.name || selectedIngredient.name,
      link: item.link || selectedIngredient.link,
      notes: selectedIngredient.notes || item.notesPreview || '',
      cost: selectedIngredient.cost || item.unitPrice || '',
    }
    const updated = updateIngredient(active.id, selectedIngredient.id, updates)
    if (updated) handleSave(updated)
  }

  const ingredientMinWidth = 180
  const actionColWidth = 64
  const sheetMinWidth = 24 + ingredientMinWidth + colWidths.amount + colWidths.ratio + colWidths.cost + actionColWidth + 40
  const gridTemplate = `24px minmax(${ingredientMinWidth}px, 1fr) ${colWidths.amount}px ${colWidths.ratio}px ${colWidths.cost}px ${actionColWidth}px`

  const ResizeHandle = ({ col }) => (
    <div
      onMouseDown={e => startResize(col, e)}
      style={{ width: 4, cursor: 'col-resize', background: 'transparent', borderRight: '1px solid rgba(255,255,255,0.06)', marginLeft: 'auto', height: '100%', flexShrink: 0 }}
      className="hover:border-brand-accent/40 transition-colors"
    />
  )

  if (loading) return (
    <div className="p-4 pt-6 animate-fadeIn flex items-center justify-center h-[calc(100dvh-160px)] sm:h-[calc(100dvh-40px)]">
      <span className="text-gray-600 text-sm">Loading formulas...</span>
    </div>
  )

  return (
    <div className="p-3 pt-4 sm:p-4 sm:pt-6 animate-fadeIn h-[calc(100dvh-136px)] sm:h-[calc(100dvh-40px)] min-h-[360px]">
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
              <p className="text-xs text-gray-500 mb-2">One per line: <code className="bg-black/30 px-1 rounded">Name | Amount | Cost | Link | Notes</code></p>
              {importError && <div className="text-red-400 text-xs mb-2">{importError}</div>}
              <textarea
                value={importText}
                onChange={e => setImportText(e.target.value)}
                placeholder={"Shea Butter | 100g | 5.00 | https://... | Supplier notes\nCoconut Oil | 50ml | 1.50"}
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

      {active && selectedIngredient && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={closeIngredientDetails}>
          <div
            className="glass-card rounded-t-2xl sm:rounded-lg w-full max-w-xl max-h-[88vh] flex flex-col animate-scaleIn pb-safe"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-white truncate">{selectedIngredient.name || 'Ingredient details'}</h3>
                <p className="text-[11px] text-gray-600 mt-0.5">Link and notes</p>
              </div>
              <button onClick={closeIngredientDetails} className="nav-icon text-gray-500 hover:text-white" title="Close" aria-label="Close ingredient details">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="p-4 overflow-y-auto">
              <label className="text-xs text-gray-500 block mb-1">Inventory / Master Sourcing Item</label>
              <select
                value={selectedIngredient.sourcingItemId || ''}
                onChange={e => selectSourcingItem(e.target.value)}
                className="w-full bg-brand-dark border border-white/10 rounded px-3 py-2 text-sm text-white outline-none focus:border-brand-accent/40"
              >
                <option value="">No linked sourcing item</option>
                {sourcingItems.map(item => (
                  <option key={item.key} value={item.key}>
                    {item.name}{item.category ? ` - ${item.category}` : ''}{item.inStock ? ' - in stock' : ''}
                  </option>
                ))}
              </select>
              {selectedSourcingItem && (
                <div className="mt-2 rounded border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-gray-400 whitespace-pre-wrap">
                  {selectedSourcingItem.notesPreview || selectedSourcingItem.sheetName}
                </div>
              )}

              <label className="text-xs text-gray-500 block mb-1 mt-4">Link</label>
              <input
                value={selectedIngredient.link || ''}
                onChange={e => updateIngredient(active.id, selectedIngredient.id, { link: e.target.value })}
                onBlur={() => saveIngredient(active.id)}
                placeholder="https://supplier-or-reference-link"
                className="w-full bg-brand-dark border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-brand-accent/40"
              />
              {selectedIngredient.link && (
                <a
                  href={selectedIngredient.link}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-brand-accent hover:text-brand-accent-hover mt-2"
                >
                  <LinkIcon /> Open link
                </a>
              )}

              <label className="text-xs text-gray-500 block mb-1 mt-4">Notes</label>
              <textarea
                value={selectedIngredient.notes || ''}
                onChange={e => updateIngredient(active.id, selectedIngredient.id, { notes: e.target.value })}
                onBlur={() => saveIngredient(active.id)}
                placeholder="Ingredient supplier, substitutions, behavior, sourcing, or batch notes..."
                rows={8}
                className="w-full min-h-[180px] max-h-[55vh] bg-brand-dark border border-white/10 rounded px-3 py-2 text-sm text-gray-300 placeholder-gray-700 outline-none focus:border-brand-accent/40 resize-y"
              />
              <div className="flex justify-end mt-4">
                <button onClick={closeIngredientDetails} className="btn-primary px-4 py-2 rounded text-sm">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-4 h-full min-w-0">

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
                    className="absolute right-1 top-1/2 -translate-y-1/2 opacity-100 sm:opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:bg-white/10 rounded transition-all"
                    style={{ touchAction: 'manipulation' }}
                    title="Delete formula"
                    aria-label={`Delete ${f.name}`}
                  >
                    <Trash />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Formula Editor ── */}
        <div className="flex-1 min-w-0 h-full">
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
            <div className="glass-card rounded p-3 sm:p-5 h-full flex flex-col overflow-hidden min-w-0">
              {/* Header */}
              <div className="flex flex-wrap sm:flex-nowrap items-center justify-between mb-3 sm:mb-4 pb-3 sm:pb-4 border-b border-white/10 shrink-0 gap-2 min-w-0">
                <button
                  onClick={() => setShowMobileSidebar(true)}
                  className="sm:hidden nav-icon flex-shrink-0"
                  title="Show formulas"
                  aria-label="Show formulas"
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

                <div className="flex gap-1 sm:gap-2 shrink-0 items-center overflow-x-auto scrollbar-hide max-w-full">
                  {/* Undo / Redo */}
                  <button
                    onClick={performFormulaUndo}
                    disabled={!canFUndo}
                    title="Undo (Ctrl+Z)"
                    className={`p-1.5 rounded transition-all ${canFUndo ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-700 cursor-not-allowed'}`}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>
                  </button>
                  <button
                    onClick={performFormulaRedo}
                    disabled={!canFRedo}
                    title="Redo (Ctrl+Y)"
                    className={`p-1.5 rounded transition-all ${canFRedo ? 'text-gray-400 hover:text-white hover:bg-white/10' : 'text-gray-700 cursor-not-allowed'}`}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 14 20 9 15 4"/><path d="M4 20v-7a4 4 0 0 1 4-4h12"/></svg>
                  </button>
                  <div className="w-px h-4 bg-white/10" />
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
                <div className="overflow-x-auto pb-1 -mx-1 px-1" style={{ WebkitOverflowScrolling: 'touch' }}>
                  <div style={{ minWidth: sheetMinWidth }}>
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
                          className="group rounded hover:bg-white/[0.03] cursor-pointer transition-colors"
                          onClick={e => {
                            if (e.target.closest('input,button,textarea,a')) return
                            setSelectedIngredientId(ing.id)
                          }}
                          style={{ display: 'grid', gridTemplateColumns: gridTemplate, columnGap: 8, alignItems: 'center', paddingRight: 4, paddingTop: 4, paddingBottom: 4, minHeight: 38 }}
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
                              onBlur={e => {
                                if (isSource) {
                                  const updated = updateIngredient(active.id, ing.id, { ratio: e.currentTarget.value })
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

                          {/* Actions */}
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setSelectedIngredientId(ing.id)}
                              className={`p-1 rounded transition-all ${ing.link || ing.notes ? 'text-brand-accent bg-brand-accent/10' : 'text-gray-600 hover:text-gray-300 hover:bg-white/10'}`}
                              title="Ingredient link and notes"
                              aria-label={`Ingredient link and notes for ${ing.name || 'ingredient'}`}
                            >
                              <LinkIcon />
                            </button>
                            <button
                              onClick={() => removeIngredient(active.id, ing.id)}
                              className="opacity-100 sm:opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 active:text-red-400 transition-all flex items-center justify-center p-1 rounded"
                              title="Remove ingredient"
                            >
                              <Trash />
                            </button>
                          </div>
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
                    <div className="mt-3 pt-3 border-t border-white/5">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-gray-600">Total Cost</span>
                        <span className="text-sm font-semibold text-brand-accent">${getTotalCost(active).toFixed(2)}</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-gray-600 block mb-1">Target Cost ($)</label>
                          <input
                            value={active.target_cost || ''}
                            onChange={e => { schedulePre(active); updateLocal(active.id, { target_cost: e.target.value }) }}
                            onBlur={() => saveFormulaById(active.id)}
                            placeholder="0.00"
                            className="w-full bg-brand-dark border border-white/10 rounded px-2 py-1.5 text-sm text-white placeholder-gray-600 outline-none focus:border-brand-accent/40 transition-colors"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600 block mb-1">Target Margin (%)</label>
                          <input
                            value={active.target_margin || ''}
                            onChange={e => { schedulePre(active); updateLocal(active.id, { target_margin: e.target.value }) }}
                            onBlur={() => saveFormulaById(active.id)}
                            placeholder="50"
                            className="w-full bg-brand-dark border border-white/10 rounded px-2 py-1.5 text-sm text-white placeholder-gray-600 outline-none focus:border-brand-accent/40 transition-colors"
                          />
                        </div>
                      </div>
                      {/* Calculated profit if both fields filled */}
                      {active.target_cost && active.target_margin && (() => {
                        const tc  = parseFloat(active.target_cost)
                        const tm  = parseFloat(active.target_margin)
                        const tot = getTotalCost(active)
                        if (!isNaN(tc) && !isNaN(tm) && tot > 0) {
                          const profit = tc - tot
                          const margin = ((profit / tc) * 100).toFixed(1)
                          return (
                            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                              <span className="text-gray-600">Profit: <span className={profit >= 0 ? 'text-brand-success' : 'text-red-400'}>${profit.toFixed(2)}</span></span>
                              <span className="text-gray-600">Actual margin: <span className={parseFloat(margin) >= tm ? 'text-brand-success' : 'text-red-400'}>{margin}%</span></span>
                            </div>
                          )
                        }
                        return null
                      })()}
                    </div>
                  )}

                  <div className="mt-5 pt-4 border-t border-white/5">
                    <label className="text-xs text-gray-600 block mb-1.5">Notes</label>
                    <textarea
                      value={active.notes || ''}
                      onChange={e => { schedulePre(active); updateLocal(active.id, { notes: e.target.value }) }}
                      onBlur={() => saveFormulaById(active.id)}
                      placeholder="Formula notes..."
                      rows={6}
                      className="w-full min-h-[140px] max-h-[65vh] bg-brand-dark border border-white/5 rounded px-3 py-2 text-sm text-gray-300 placeholder-gray-700 outline-none focus:border-brand-accent/30 resize-y transition-all"
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
