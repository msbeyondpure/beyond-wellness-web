/* eslint-disable react/prop-types */
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  BATCH_PRODUCTION_PRODUCTS,
  BATCH_PRODUCTION_STEPS,
  BEYOND_WELLNESS_SHEET_TEMPLATES,
  useSheets,
} from '../hooks/useSheets'

const Plus = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const Trash = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
const SheetIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/></svg>
const ImportIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
const DownloadIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
const MenuIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
const CloseIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const ChevronRight = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
const ChevronDown = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>

const DEFAULT_COLUMN_NAMES = ['Name', 'Category', 'Amount', 'Cost', 'Link', 'Notes']
const BATCH_PRODUCTION_SHEET_NAME = 'Batch Production Sheet'

function uid() {
  return globalThis.crypto?.randomUUID?.() || Date.now() + '-' + Math.random().toString(36).slice(2)
}

function makeColumn(name, index = 0) {
  const fallback = `Column ${index + 1}`
  return { id: uid(), name: String(name || fallback).trim() || fallback }
}

function defaultColumns() {
  return DEFAULT_COLUMN_NAMES.map((name, index) => makeColumn(name, index))
}

function blankCells(columns) {
  return Object.fromEntries(columns.map(col => [col.id, '']))
}

function makeRow(columns, values = {}) {
  return {
    id: uid(),
    cells: { ...blankCells(columns), ...values },
  }
}

function columnByName(sheet, name) {
  return sheet?.columns.find(col => col.name.toLowerCase() === name.toLowerCase())
}

function cellByName(sheet, row, name) {
  const column = columnByName(sheet, name)
  return column ? row.cells[column.id] || '' : ''
}

function makeRowFromNames(columns, values = {}) {
  const cells = blankCells(columns)
  columns.forEach(col => {
    if (Object.prototype.hasOwnProperty.call(values, col.name)) cells[col.id] = values[col.name]
  })
  return { id: uid(), cells }
}

function isBatchProductionSheet(sheet) {
  return sheet?.name === BATCH_PRODUCTION_SHEET_NAME
}

function ensureBatchProductRows(sheet, product) {
  if (!isBatchProductionSheet(sheet)) return sheet
  const productColumn = columnByName(sheet, 'Product')
  if (!productColumn) return sheet
  const hasProductRows = sheet.rows.some(row => String(row.cells[productColumn.id] || '').trim() === product)
  if (hasProductRows) return sheet
  return {
    ...sheet,
    rows: [
      ...sheet.rows,
      ...BATCH_PRODUCTION_STEPS.map(step => makeRowFromNames(sheet.columns, { Product: product, ...step })),
    ],
  }
}

function safeSheet(sheet = {}) {
  const columns = Array.isArray(sheet.columns) && sheet.columns.length
    ? sheet.columns.map((col, index) => makeColumn(col.name, index))
        .map((col, index) => ({ ...col, id: sheet.columns[index]?.id || col.id }))
    : defaultColumns()
  const empty = blankCells(columns)
  const rows = Array.isArray(sheet.rows) ? sheet.rows : []
  return {
    id: sheet.id || uid(),
    name: sheet.name || 'Untitled Sheet',
    columns,
    rows: rows.map(row => ({ id: row.id || uid(), cells: { ...empty, ...(row.cells || {}) } })),
    created_at: sheet.created_at || new Date().toISOString(),
    updated_at: sheet.updated_at || new Date().toISOString(),
  }
}

function columnWidth(col) {
  const name = col.name.toLowerCase()
  if (name.includes('notes')) return 300
  if (name.includes('link') || name.includes('url')) return 250
  if (name.includes('amount') || name.includes('cost') || name.includes('price')) return 150
  return 180
}

function csvEscape(value) {
  const text = String(value ?? '')
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

function parseCsvLine(line, delimiter) {
  if (delimiter !== ',') return line.split(delimiter)
  const cells = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]
    if (ch === '"' && line[i + 1] === '"') {
      cell += '"'
      i += 1
    } else if (ch === '"') {
      quoted = !quoted
    } else if (ch === ',' && !quoted) {
      cells.push(cell)
      cell = ''
    } else {
      cell += ch
    }
  }
  cells.push(cell)
  return cells
}

function detectDelimiter(line) {
  if (line.includes('\t')) return '\t'
  const pipeCount = (line.match(/\|/g) || []).length
  if (pipeCount > 1) return '|'
  if (line.includes(',')) return ','
  return '\t'
}

function splitImportRow(line, delimiter) {
  if (delimiter === '|') {
    return line.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map(cell => cell.trim())
  }
  return parseCsvLine(line, delimiter).map(cell => cell.trim())
}

function isMarkdownSeparator(cells) {
  return cells.length > 0 && cells.every(cell => /^:?-{2,}:?$/.test(cell.trim()))
}

function parseImport(text, firstRowHeader) {
  const lines = text.replace(/\r/g, '').split('\n').filter(line => line.trim())
  if (!lines.length) throw new Error('No rows found.')
  const delimiter = detectDelimiter(lines[0])
  const parsed = lines
    .map(line => splitImportRow(line, delimiter))
    .filter(cells => !isMarkdownSeparator(cells))

  if (!parsed.length) throw new Error('No usable rows found.')

  const maxCells = parsed.reduce((max, row) => Math.max(max, row.length), 0)
  const header = firstRowHeader
    ? parsed[0]
    : Array.from({ length: maxCells }, (_, index) => `Column ${index + 1}`)
  const columns = Array.from({ length: Math.max(header.length, maxCells) }, (_, index) => makeColumn(header[index] || `Column ${index + 1}`, index))
  const sourceRows = firstRowHeader ? parsed.slice(1) : parsed
  const rows = sourceRows
    .map(row => {
      const cells = {}
      columns.forEach((col, index) => { cells[col.id] = row[index] || '' })
      return makeRow(columns, cells)
    })
    .filter(row => Object.values(row.cells).some(value => String(value).trim()))

  return {
    columns,
    rows: rows.length ? rows : [makeRow(columns)],
  }
}

function downloadText(filename, text) {
  const blob = new Blob([text], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function Modal({ open, title, children, onClose }) {
  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="glass-card rounded-t-2xl sm:rounded-lg w-full max-w-2xl max-h-[90vh] sm:max-h-[85vh] flex flex-col animate-scaleIn pb-safe" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 sticky top-0 glass-card rounded-t-2xl sm:rounded-t-lg z-10">
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="nav-icon text-gray-500 hover:text-white" title="Close" aria-label="Close">
            <CloseIcon />
          </button>
        </div>
        <div className="overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  )
}

export default function Sheets({ userId, resetKey }) {
  const { sheets, loading, addSheet, addTemplateSheet, saveSheet, deleteSheet, usingLocalSheets } = useSheets(userId)
  const [localSheets, setLocalSheets] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [showTemplates, setShowTemplates] = useState(false)
  const [templateBusy, setTemplateBusy] = useState(false)
  const [openBatchSheetId, setOpenBatchSheetId] = useState(null)
  const [activeBatchProduct, setActiveBatchProduct] = useState(null)
  const [showImport, setShowImport] = useState(false)
  const [importText, setImportText] = useState('')
  const [importError, setImportError] = useState('')
  const [importUseHeader, setImportUseHeader] = useState(true)
  const [importTarget, setImportTarget] = useState('current')
  const [importName, setImportName] = useState('Imported Sheet')
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [saveState, setSaveState] = useState('idle')

  const localSheetsRef = useRef(new Map())
  const dirtyIdsRef = useRef(new Set())
  const saveTimersRef = useRef({})
  const saveVersionRef = useRef({})
  const autoSelectedRef = useRef(false)

  useEffect(() => {
    const incoming = sheets.map(safeSheet)
    setLocalSheets(prev => {
      const previous = new Map(prev.map(sheet => [sheet.id, sheet]))
      const incomingIds = new Set(incoming.map(sheet => sheet.id))
      const merged = incoming.map(sheet => (
        dirtyIdsRef.current.has(sheet.id) && previous.has(sheet.id) ? previous.get(sheet.id) : sheet
      ))
      prev.forEach(sheet => {
        if (!incomingIds.has(sheet.id) && dirtyIdsRef.current.has(sheet.id)) merged.push(sheet)
      })
      localSheetsRef.current = new Map(merged.map(sheet => [sheet.id, sheet]))
      return merged
    })
  }, [sheets])

  useEffect(() => {
    const exists = localSheets.some(sheet => sheet.id === activeId)
    if (activeId && !exists) {
      setActiveId(localSheets[0]?.id || null)
      return
    }
    if (!activeId && localSheets.length && !autoSelectedRef.current) {
      autoSelectedRef.current = true
      setActiveId(localSheets[0].id)
    }
  }, [activeId, localSheets])

  useEffect(() => {
    if (!activeId) return
    setShowMobileSidebar(false)
    setEditingName(false)
  }, [activeId])

  useEffect(() => {
    if (!resetKey) return
    setShowNew(false)
    setShowImport(false)
    setShowTemplates(false)
    setOpenBatchSheetId(null)
    setActiveBatchProduct(null)
    setImportError('')
    setShowMobileSidebar(false)
    setEditingName(false)
    setActiveId(null)
  }, [resetKey])

  useEffect(() => () => {
    Object.values(saveTimersRef.current).forEach(timer => clearTimeout(timer))
  }, [])

  const active = useMemo(() => localSheets.find(sheet => sheet.id === activeId), [activeId, localSheets])
  const activeIsBatchProduction = isBatchProductionSheet(active)
  const missingCoreTemplates = useMemo(() => {
    const existingNames = new Set(localSheets.map(sheet => sheet.name))
    return BEYOND_WELLNESS_SHEET_TEMPLATES.filter(template => !existingNames.has(template.name))
  }, [localSheets])
  const visibleRows = useMemo(() => {
    if (!active || !activeIsBatchProduction || !activeBatchProduct) return active?.rows || []
    return active.rows.filter(row => cellByName(active, row, 'Product') === activeBatchProduct)
  }, [active, activeBatchProduct, activeIsBatchProduction])
  const sheetMinWidth = useMemo(() => {
    if (!active) return 760
    return 92 + active.columns.reduce((total, col) => total + columnWidth(col), 0)
  }, [active])

  useEffect(() => {
    if (active && !isBatchProductionSheet(active)) setActiveBatchProduct(null)
  }, [active])

  function setSheetLocal(sheet, markDirty = true) {
    const normalized = safeSheet(sheet)
    if (markDirty) dirtyIdsRef.current.add(normalized.id)
    localSheetsRef.current.set(normalized.id, normalized)
    setLocalSheets(prev => {
      const exists = prev.some(item => item.id === normalized.id)
      return exists ? prev.map(item => item.id === normalized.id ? normalized : item) : [normalized, ...prev]
    })
    return normalized
  }

  function getLatestSheet(id) {
    return localSheetsRef.current.get(id) || localSheets.find(sheet => sheet.id === id)
  }

  async function saveSheetNow(id, version = saveVersionRef.current[id] || 0) {
    const latest = getLatestSheet(id)
    if (!latest) return null
    clearTimeout(saveTimersRef.current[id])
    setSaveState('saving')
    const saved = await saveSheet({ ...latest, updated_at: new Date().toISOString() })
    if ((saveVersionRef.current[id] || 0) === version) {
      const normalized = setSheetLocal(saved || latest, false)
      dirtyIdsRef.current.delete(id)
      setSaveState('saved')
      setTimeout(() => setSaveState(state => state === 'saved' ? 'idle' : state), 1400)
      return normalized
    }
    return getLatestSheet(id)
  }

  function queueSave(sheet) {
    const normalized = setSheetLocal(sheet, true)
    const nextVersion = (saveVersionRef.current[normalized.id] || 0) + 1
    saveVersionRef.current[normalized.id] = nextVersion
    setSaveState('dirty')
    clearTimeout(saveTimersRef.current[normalized.id])
    saveTimersRef.current[normalized.id] = setTimeout(() => {
      saveSheetNow(normalized.id, nextVersion)
    }, 650)
    return normalized
  }

  async function handleCreate() {
    const name = newName.trim() || 'New Sheet'
    const sheet = await addSheet(name)
    if (sheet) {
      const normalized = setSheetLocal(sheet, false)
      setActiveId(normalized.id)
      autoSelectedRef.current = true
    }
    setNewName('')
    setShowNew(false)
  }

  async function createTemplate(template) {
    setTemplateBusy(true)
    const sheet = await addTemplateSheet(template)
    if (sheet) {
      const normalized = setSheetLocal(sheet, false)
      setActiveId(normalized.id)
      autoSelectedRef.current = true
    }
    setTemplateBusy(false)
    setShowTemplates(false)
  }

  async function createMissingCoreTemplates() {
    if (!missingCoreTemplates.length) return
    setTemplateBusy(true)
    const created = []
    for (const template of missingCoreTemplates) {
      const sheet = await addTemplateSheet(template)
      if (sheet) created.push(setSheetLocal(sheet, false))
    }
    if (created[0]) {
      setActiveId(created[0].id)
      autoSelectedRef.current = true
    }
    setTemplateBusy(false)
    setShowTemplates(false)
  }

  async function openBatchProduct(sheet, product) {
    const prepared = ensureBatchProductRows(sheet, product)
    let target = sheet
    if (prepared !== sheet) {
      target = setSheetLocal(prepared, true)
      const version = (saveVersionRef.current[target.id] || 0) + 1
      saveVersionRef.current[target.id] = version
      setTimeout(() => saveSheetNow(target.id, version), 0)
    }
    setActiveBatchProduct(product)
    setOpenBatchSheetId(sheet.id)
    setActiveId(target.id)
    autoSelectedRef.current = true
  }

  function saveName() {
    if (!active) return
    const name = nameDraft.trim()
    setEditingName(false)
    if (!name || name === active.name) return
    queueSave({ ...active, name })
  }

  function updateCell(rowId, colId, value) {
    if (!active) return
    const rows = active.rows.map(row => (
      row.id === rowId ? { ...row, cells: { ...row.cells, [colId]: value } } : row
    ))
    queueSave({ ...active, rows })
  }

  function updateColumn(colId, value) {
    if (!active) return
    const columns = active.columns.map(col => col.id === colId ? { ...col, name: value } : col)
    queueSave({ ...active, columns })
  }

  function addRow() {
    if (!active) return
    const productColumn = activeIsBatchProduction && activeBatchProduct ? columnByName(active, 'Product') : null
    const row = productColumn ? makeRow(active.columns, { [productColumn.id]: activeBatchProduct }) : makeRow(active.columns)
    queueSave({ ...active, rows: [...active.rows, row] })
  }

  function deleteRow(rowId) {
    if (!active) return
    queueSave({ ...active, rows: active.rows.filter(row => row.id !== rowId) })
  }

  function addColumn() {
    if (!active) return
    const column = makeColumn(`Column ${active.columns.length + 1}`, active.columns.length)
    const columns = [...active.columns, column]
    const rows = active.rows.map(row => ({ ...row, cells: { ...row.cells, [column.id]: '' } }))
    queueSave({ ...active, columns, rows })
  }

  function deleteColumn(colId) {
    if (!active || active.columns.length <= 1) return
    const columns = active.columns.filter(col => col.id !== colId)
    const rows = active.rows.map(row => {
      const cells = {}
      columns.forEach(col => { cells[col.id] = row.cells[col.id] || '' })
      return { ...row, cells }
    })
    queueSave({ ...active, columns, rows })
  }

  async function removeSheet(id) {
    if (!confirm('Delete this sheet?')) return
    const nextActive = localSheets.find(sheet => sheet.id !== id)?.id || null
    clearTimeout(saveTimersRef.current[id])
    dirtyIdsRef.current.delete(id)
    localSheetsRef.current.delete(id)
    setLocalSheets(prev => prev.filter(sheet => sheet.id !== id))
    if (activeId === id) setActiveId(nextActive)
    await deleteSheet(id)
  }

  function exportCsv() {
    if (!active) return
    const header = active.columns.map(col => csvEscape(col.name)).join(',')
    const body = visibleRows.map(row => active.columns.map(col => csvEscape(row.cells[col.id] || '')).join(',')).join('\n')
    const suffix = activeBatchProduct ? `-${activeBatchProduct}` : ''
    const filename = `${(active.name + suffix).replace(/[^\w.-]+/g, '-').replace(/^-|-$/g, '') || 'sheet'}.csv`
    downloadText(filename, `${header}\n${body}`)
  }

  async function submitImport() {
    try {
      const parsed = parseImport(importText, importUseHeader)
      if (importTarget === 'new' || !active) {
        const sheet = await addSheet(importName.trim() || 'Imported Sheet')
        const normalized = setSheetLocal({ ...safeSheet(sheet), name: importName.trim() || 'Imported Sheet', columns: parsed.columns, rows: parsed.rows }, true)
        const version = (saveVersionRef.current[normalized.id] || 0) + 1
        saveVersionRef.current[normalized.id] = version
        await saveSheetNow(normalized.id, version)
        setActiveId(normalized.id)
        autoSelectedRef.current = true
      } else {
        queueSave({ ...active, columns: parsed.columns, rows: parsed.rows })
      }
      setShowImport(false)
      setImportText('')
      setImportError('')
    } catch (error) {
      setImportError(error.message || 'Import failed.')
    }
  }

  const saveLabel = usingLocalSheets ? 'local' : saveState === 'saving' ? 'saving' : saveState === 'dirty' ? 'unsaved' : saveState === 'saved' ? 'saved' : 'synced'

  return (
    <div className="p-3 pt-4 sm:p-4 sm:pt-6 animate-fadeIn">
      <Modal open={showImport} onClose={() => { setShowImport(false); setImportError('') }} title="Import Sheet">
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-gray-400 text-xs block mb-1">Target</label>
              <select value={importTarget} onChange={e => setImportTarget(e.target.value)} className="w-full px-2 py-2 bg-brand-dark border border-white/10 rounded text-white text-sm outline-none focus:border-brand-accent/40">
                <option value="current">Current sheet</option>
                <option value="new">New sheet</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-gray-400 text-xs block mb-1">Sheet Name</label>
              <input value={importName} onChange={e => setImportName(e.target.value)} className="w-full px-2 py-2 bg-brand-dark border border-white/10 rounded text-white text-sm outline-none focus:border-brand-accent/40" />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input type="checkbox" checked={importUseHeader} onChange={e => setImportUseHeader(e.target.checked)} className="accent-brand-accent" />
            First row is header
          </label>

          <textarea
            value={importText}
            onChange={e => setImportText(e.target.value)}
            rows={14}
            placeholder="Paste TSV, CSV, pipe, or Markdown table text"
            className="w-full min-h-[260px] bg-brand-dark border border-white/10 rounded px-3 py-2 text-sm text-gray-200 placeholder-gray-700 outline-none focus:border-brand-accent/40 resize-y font-mono"
          />
          {importError && <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded px-3 py-2">{importError}</div>}
          <div className="flex justify-end gap-2">
            <button onClick={() => { setShowImport(false); setImportError('') }} className="px-3 py-2 bg-white/10 text-gray-300 rounded text-sm hover:bg-white/20">Cancel</button>
            <button onClick={submitImport} className="btn-primary px-4 py-2 rounded text-sm flex items-center gap-2"><ImportIcon /> Import</button>
          </div>
        </div>
      </Modal>

      <div className="max-w-7xl mx-auto h-[calc(100dvh-8.5rem)] min-h-[360px] sm:min-h-[620px]">
        <div className="flex gap-4 h-full min-w-0">
          {showMobileSidebar && (
            <div className="drawer-backdrop sm:hidden" onClick={() => setShowMobileSidebar(false)} />
          )}

          <div className={`${showMobileSidebar ? 'drawer-panel' : 'hidden'} sm:block sm:relative sm:w-64 sm:flex-shrink-0 sm:h-full`}>
            <div className="glass-card sm:rounded p-4 h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-semibold">Sheets</h2>
                <button onClick={() => setShowNew(true)} className="btn-primary px-2 py-1 rounded text-xs flex items-center gap-1">
                  <Plus /> New
                </button>
              </div>

              <div className="mb-3 border-b border-white/10 pb-3">
                {missingCoreTemplates.length > 0 && (
                  <button
                    onClick={createMissingCoreTemplates}
                    disabled={templateBusy}
                    className="w-full btn-primary px-3 py-2 rounded text-xs font-medium flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    <SheetIcon /> Add Beyond Wellness Core
                  </button>
                )}
                <button
                  onClick={() => setShowTemplates(v => !v)}
                  className="w-full mt-2 px-3 py-2 bg-white/10 text-gray-300 rounded text-xs hover:bg-white/20 flex items-center justify-center gap-2"
                >
                  <Plus /> Templates
                </button>
                {showTemplates && (
                  <div className="mt-2 space-y-1 animate-slideUp">
                    {BEYOND_WELLNESS_SHEET_TEMPLATES.map(template => {
                      const exists = localSheets.some(sheet => sheet.name === template.name)
                      return (
                        <button
                          key={template.key}
                          onClick={() => createTemplate(template)}
                          disabled={templateBusy || exists}
                          className={`w-full text-left px-3 py-2 rounded text-xs transition-all ${exists ? 'text-gray-500 bg-white/[0.03]' : 'text-gray-300 bg-white/5 hover:bg-white/10'}`}
                        >
                          <span className="block truncate">{template.name}</span>
                          {exists && <span className="block text-[10px] text-gray-600 mt-0.5">already added</span>}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {showNew && (
                <div className="bg-white/5 p-3 rounded mb-3 border border-white/10 animate-slideUp">
                  <input
                    autoFocus
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') { setShowNew(false); setNewName('') } }}
                    onBlur={() => { if (!newName.trim()) setShowNew(false) }}
                    placeholder="Sheet name"
                    className="w-full px-2 py-1.5 bg-brand-dark border border-white/10 rounded text-white placeholder-gray-500 text-sm outline-none focus:border-brand-accent/40 mb-2"
                  />
                  <div className="flex gap-2">
                    <button onClick={handleCreate} className="btn-primary px-2 py-1 rounded text-xs">Add</button>
                    <button onClick={() => { setShowNew(false); setNewName('') }} className="px-2 py-1 bg-white/10 text-gray-300 rounded text-xs hover:bg-white/20">Cancel</button>
                  </div>
                </div>
              )}

              <div className="flex-1 overflow-y-auto space-y-1">
                {loading ? (
                  <p className="text-gray-500 text-sm text-center py-4">Loading...</p>
                ) : localSheets.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-4">No sheets yet</p>
                ) : localSheets.map(sheet => {
                  const batchSheet = isBatchProductionSheet(sheet)
                  const batchOpen = openBatchSheetId === sheet.id
                  const activeBatch = sheet.id === activeId && activeIsBatchProduction
                  return (
                    <div key={sheet.id} className="relative group">
                      <button
                        onClick={() => {
                          if (batchSheet) {
                            setOpenBatchSheetId(id => id === sheet.id ? null : sheet.id)
                            return
                          }
                          setActiveId(sheet.id)
                        }}
                        className={`w-full text-left p-3 rounded transition-all ${sheet.id === activeId ? 'bg-brand-accent/20 text-white border border-brand-accent/30' : 'text-gray-400 active:bg-white/10 hover:bg-white/5 hover:text-gray-200 border border-transparent'}`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-brand-accent/80 shrink-0">{batchSheet ? (batchOpen ? <ChevronDown /> : <ChevronRight />) : <SheetIcon />}</span>
                          <span className="text-sm truncate pr-6">{sheet.name}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1 pl-5">
                          {batchSheet ? (activeBatchProduct && activeBatch ? activeBatchProduct : 'Choose product') : `${sheet.rows.length} rows`}
                        </div>
                      </button>
                      <button onClick={e => { e.stopPropagation(); removeSheet(sheet.id) }} className="absolute right-1 top-1/2 -translate-y-1/2 opacity-100 sm:opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:bg-white/10 rounded transition-all" title="Delete" aria-label={`Delete ${sheet.name}`}>
                        <Trash />
                      </button>
                      {batchSheet && batchOpen && (
                        <div className="ml-5 mt-1 mb-2 space-y-1 border-l border-white/10 pl-2 animate-slideUp">
                          {BATCH_PRODUCTION_PRODUCTS.map(product => (
                            <button
                              key={product}
                              onClick={() => openBatchProduct(sheet, product)}
                              className={`w-full text-left px-3 py-2 rounded text-xs transition-all ${activeBatch && activeBatchProduct === product ? 'bg-brand-accent/20 text-white border border-brand-accent/30' : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent'}`}
                            >
                              <span className="block truncate">{product}</span>
                              <span className="block text-[10px] text-gray-600 mt-0.5">
                                {sheet.rows.filter(row => cellByName(sheet, row, 'Product') === product).length || BATCH_PRODUCTION_STEPS.length} steps
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="flex-1 min-w-0 h-full">
            {!active ? (
              <div className="glass-card rounded p-5 h-full flex flex-col items-center justify-center">
                <p className="text-gray-600 text-sm mb-4">{localSheets.length === 0 ? 'Create the first sheet' : 'Select a sheet'}</p>
                <div className="flex flex-wrap justify-center gap-2">
                  <button onClick={() => setShowMobileSidebar(true)} className="sm:hidden btn-primary px-4 py-2.5 rounded text-white text-sm flex items-center gap-2">
                    <MenuIcon /> Browse Sheets
                  </button>
                  <button onClick={() => setShowNew(true)} className="btn-primary px-4 py-2.5 rounded text-white text-sm flex items-center gap-2">
                    <Plus /> New Sheet
                  </button>
                  <button onClick={() => { setImportTarget('new'); setShowImport(true) }} className="px-4 py-2.5 bg-white/10 text-gray-300 rounded text-sm hover:bg-white/20 flex items-center gap-2">
                    <ImportIcon /> Import
                  </button>
                </div>
              </div>
            ) : (
              <div className="glass-card rounded p-3 sm:p-5 h-full flex flex-col overflow-hidden min-w-0">
                <div className="flex flex-wrap sm:flex-nowrap items-center justify-between mb-3 sm:mb-4 pb-3 sm:pb-4 border-b border-white/10 shrink-0 gap-2 min-w-0">
                  <button onClick={() => setShowMobileSidebar(true)} className="sm:hidden nav-icon flex-shrink-0" title="Show sheets" aria-label="Show sheets">
                    <MenuIcon />
                  </button>

                  {editingName ? (
                    <input
                      autoFocus
                      value={nameDraft}
                      onChange={e => setNameDraft(e.target.value)}
                      onBlur={saveName}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') saveName() }}
                      className="text-base sm:text-xl font-semibold text-white bg-transparent border-b-2 border-brand-accent outline-none flex-1 min-w-0"
                    />
                  ) : (
                    <h2
                      onClick={() => { setNameDraft(active.name); setEditingName(true) }}
                      className="text-base sm:text-xl font-semibold text-white cursor-pointer hover:text-brand-accent transition-colors flex items-center gap-2 select-none truncate min-w-0 flex-1"
                      title="Rename"
                    >
                      <span className="truncate">{active.name}</span>
                      {activeIsBatchProduction && activeBatchProduct && (
                        <span className="shrink-0 text-[11px] font-medium text-brand-accent bg-brand-accent/10 border border-brand-accent/20 rounded px-2 py-1">
                          {activeBatchProduct}
                        </span>
                      )}
                    </h2>
                  )}

                  <div className="flex gap-1 sm:gap-2 shrink-0 items-center overflow-x-auto scrollbar-hide max-w-full">
                    <span className={`text-[11px] px-2 py-1 rounded ${saveLabel === 'unsaved' ? 'bg-yellow-500/10 text-yellow-400' : saveLabel === 'saving' ? 'bg-blue-500/10 text-blue-400' : 'bg-white/5 text-gray-500'}`}>
                      {saveLabel}
                    </span>
                    <button onClick={() => saveSheetNow(active.id)} className="text-xs text-gray-500 hover:text-gray-300 px-2 py-1.5 sm:py-1 rounded hover:bg-white/5 transition-all">Save</button>
                    <button onClick={() => setShowImport(true)} className="text-xs text-gray-500 hover:text-gray-300 px-2 py-1.5 sm:py-1 rounded hover:bg-white/5 transition-all flex items-center gap-1"><ImportIcon /> Import</button>
                    <button onClick={exportCsv} className="text-xs text-gray-500 hover:text-gray-300 px-2 py-1.5 sm:py-1 rounded hover:bg-white/5 transition-all flex items-center gap-1"><DownloadIcon /> CSV</button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-3 shrink-0">
                  <button onClick={addRow} className="btn-primary px-3 py-1.5 rounded text-sm font-medium flex items-center gap-1"><Plus /> Row</button>
                  <button onClick={addColumn} className="px-3 py-1.5 bg-white/10 text-gray-300 rounded text-sm hover:bg-white/20 flex items-center gap-1"><Plus /> Column</button>
                </div>

                <div className="flex-1 overflow-auto min-h-0 -mx-1 px-1" style={{ WebkitOverflowScrolling: 'touch' }}>
                  <div style={{ minWidth: sheetMinWidth }}>
                    <div className="grid gap-1 pb-2 border-b border-white/10 sticky top-0 z-10 bg-[#1f1f1f]" style={{ gridTemplateColumns: `42px ${active.columns.map(col => `${columnWidth(col)}px`).join(' ')} 42px` }}>
                      <div className="text-[11px] text-gray-600 uppercase tracking-wider px-2 py-2">#</div>
                      {active.columns.map(col => (
                        <div key={col.id} className="group flex items-center gap-1 px-1">
                          <input
                            value={col.name}
                            onChange={e => updateColumn(col.id, e.target.value)}
                            onBlur={() => saveSheetNow(active.id)}
                            className="w-full px-2 py-1.5 bg-white/5 border border-white/10 rounded text-gray-300 text-xs font-medium outline-none focus:border-brand-accent/40"
                          />
                          <button onClick={() => deleteColumn(col.id)} className="opacity-100 sm:opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:bg-white/10 rounded transition-all" title="Delete column" aria-label={`Delete ${col.name} column`}>
                            <Trash />
                          </button>
                        </div>
                      ))}
                      <div />
                    </div>

                    {visibleRows.map((row, rowIndex) => (
                      <div key={row.id} className="grid gap-1 border-b border-white/5 hover:bg-white/[0.025]" style={{ gridTemplateColumns: `42px ${active.columns.map(col => `${columnWidth(col)}px`).join(' ')} 42px` }}>
                        <div className="text-xs text-gray-600 px-2 py-2 select-none">{rowIndex + 1}</div>
                        {active.columns.map(col => {
                          const isNotes = col.name.toLowerCase().includes('notes')
                          return (
                            <textarea
                              key={col.id}
                              value={row.cells[col.id] || ''}
                              onChange={e => updateCell(row.id, col.id, e.target.value)}
                              onBlur={() => saveSheetNow(active.id)}
                              rows={isNotes ? 3 : 1}
                              className={`w-full my-1 px-2 py-1.5 bg-transparent border border-transparent rounded text-gray-200 text-sm outline-none focus:bg-brand-dark focus:border-brand-accent/40 resize-y leading-5 ${isNotes ? 'min-h-[92px]' : 'min-h-[38px]'}`}
                              style={{ overflowWrap: 'anywhere' }}
                            />
                          )
                        })}
                        <div className="flex items-start justify-center py-2">
                          <button onClick={() => deleteRow(row.id)} className="p-1.5 text-red-400 hover:bg-white/10 rounded transition-all" title="Delete row">
                            <Trash />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
