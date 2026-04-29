/* eslint-disable react/prop-types */
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  BATCH_PRODUCTION_PRODUCTS,
  BATCH_PRODUCTION_STEPS,
  BEYOND_WELLNESS_SHEET_TEMPLATES,
  MASTER_SOURCING_COLUMNS,
  MASTER_SOURCING_SHEET_NAME,
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
const UndoIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></svg>
const RedoIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 14 20 9 15 4"/><path d="M4 20v-7a4 4 0 0 1 4-4h12"/></svg>
const ExternalLink = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
const ExpandChev = ({ open }) => open
  ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 15 12 9 6 15"/></svg>
  : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
const PinUp = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 15 12 9 6 15"/></svg>
const PinDown = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>

const DEFAULT_COLUMN_NAMES = ['Name', 'Category', 'Amount', 'Cost', 'Link', 'Notes']
const BATCH_PRODUCTION_SHEET_NAME = 'Batch Production Sheet'
const LS_SIDEBAR_W_KEY = 'bwSheetsSidebarW'
const LS_SHEET_ORDER_KEY = 'bwSheetsOrder'
const MIN_SIDEBAR_W = 180
const MAX_SIDEBAR_W = 420
const DEFAULT_ROW_HEIGHT = 42
const MIN_ROW_HEIGHT = 34
const MIN_COLUMN_WIDTH = 92
const MAX_HISTORY = 50

const DEFAULT_MAIN_COLUMNS = {
  [MASTER_SOURCING_SHEET_NAME]: ['Ingredient', 'IN STOCK', 'Function', 'Preferred Source', 'Unit Price', 'Status'],
  'Packaging + Containers Sheet': ['Component', 'Product Fit', 'Supplier', 'Unit Cost', 'Test Status'],
  'Costing Sheet': ['Product', 'Unit Size', 'Total COGS', 'Retail Price', 'Gross Margin'],
  'Batch Production Sheet': ['Batch ID', 'Product', 'Ingredient / Step', 'Exact Weight', 'Release Status'],
}

function uid() {
  return globalThis.crypto?.randomUUID?.() || Date.now() + '-' + Math.random().toString(36).slice(2)
}

function makeColumn(name, index = 0) {
  const fallback = `Column ${index + 1}`
  return { id: uid(), name: String(name || fallback).trim() || fallback, pinned: true }
}

function defaultColumns() {
  return DEFAULT_COLUMN_NAMES.map((name, index) => makeColumn(name, index))
}

function moveItem(list, sourceId, targetId) {
  if (!sourceId || !targetId || sourceId === targetId) return list
  const sourceIndex = list.findIndex(item => item.id === sourceId)
  const targetIndex = list.findIndex(item => item.id === targetId)
  if (sourceIndex < 0 || targetIndex < 0) return list
  const next = [...list]
  const [item] = next.splice(sourceIndex, 1)
  next.splice(sourceIndex < targetIndex ? targetIndex - 1 : targetIndex, 0, item)
  return next
}

function loadSheetOrder() {
  try {
    const parsed = JSON.parse(localStorage.getItem(LS_SHEET_ORDER_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveSheetOrder(sheets) {
  localStorage.setItem(LS_SHEET_ORDER_KEY, JSON.stringify(sheets.map(sheet => sheet.id)))
}

function applySheetOrder(sheets) {
  const order = loadSheetOrder()
  if (!order.length) return sheets
  const rank = new Map(order.map((id, index) => [id, index]))
  return [...sheets].sort((a, b) => {
    const aRank = rank.has(a.id) ? rank.get(a.id) : Number.MAX_SAFE_INTEGER
    const bRank = rank.has(b.id) ? rank.get(b.id) : Number.MAX_SAFE_INTEGER
    if (aRank !== bRank) return aRank - bRank
    return 0
  })
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

function columnWidth(col) {
  if (Number.isFinite(Number(col.width))) return Math.max(MIN_COLUMN_WIDTH, Number(col.width))
  const name = col.name.toLowerCase()
  if (isStockColumn(col)) return 112
  if (name.includes('inventory category')) return 190
  if (name.includes('notes')) return 300
  if (name.includes('link') || name.includes('url') || name.includes('source')) return 240
  if (name.includes('amount') || name.includes('cost') || name.includes('price')) return 150
  return 180
}

function normalizeColumns(sheetName, rawColumns) {
  let source = Array.isArray(rawColumns) && rawColumns.length ? rawColumns : defaultColumns()
  if (sheetName === MASTER_SOURCING_SHEET_NAME) {
    const existing = new Set(source.map(col => col.name))
    const missing = MASTER_SOURCING_COLUMNS
      .filter(name => !existing.has(name))
      .map(name => ({ id: uid(), name }))
    source = [...source, ...missing]
  }
  const defaultMain = new Set(DEFAULT_MAIN_COLUMNS[sheetName] || source.slice(0, Math.min(5, source.length)).map(col => col.name))
  return source.map((col, index) => ({
    ...col,
    id: col.id || uid(),
    name: String(col.name || `Column ${index + 1}`).trim() || `Column ${index + 1}`,
    pinned: typeof col.pinned === 'boolean' ? col.pinned : (source.length <= 6 || defaultMain.has(col.name)),
    width: Number.isFinite(Number(col.width)) ? Number(col.width) : undefined,
    wrap: typeof col.wrap === 'boolean' ? col.wrap : undefined,
  }))
}

function safeSheet(sheet = {}) {
  const name = sheet.name || 'Untitled Sheet'
  const columns = normalizeColumns(name, sheet.columns)
  const storedWrap = columns.find(col => typeof col.sheetWrap === 'boolean')?.sheetWrap
  const empty = blankCells(columns)
  const rows = Array.isArray(sheet.rows) ? sheet.rows : []
  return {
    id: sheet.id || uid(),
    name,
    columns,
    rows: rows.map(row => ({
      id: row.id || uid(),
      cells: { ...empty, ...(row.cells || {}) },
      height: Number.isFinite(Number(row.height)) ? Number(row.height) : null,
    })),
    wrap: typeof sheet.wrap === 'boolean' ? sheet.wrap : storedWrap !== false,
    created_at: sheet.created_at || new Date().toISOString(),
    updated_at: sheet.updated_at || new Date().toISOString(),
  }
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

function prepareImportedData(sheetName, parsed) {
  return {
    columns: normalizeColumns(sheetName, parsed.columns.map(col => ({ ...col, pinned: undefined }))),
    rows: parsed.rows,
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

function loadSidebarW() {
  const value = parseInt(localStorage.getItem(LS_SIDEBAR_W_KEY) || '256', 10)
  if (Number.isNaN(value)) return 256
  return Math.max(MIN_SIDEBAR_W, Math.min(MAX_SIDEBAR_W, value))
}

function extractUrl(value) {
  const match = String(value || '').match(/https?:\/\/[^\s"<>]+/)
  return match ? match[0].replace(/[.,;!?)]$/, '') : null
}

function isPinned(col) {
  return col.pinned !== false
}

function isStockColumn(col) {
  return String(col?.name || '').trim().toLowerCase() === 'in stock'
}

function cellIsChecked(value) {
  return ['true', 'yes', 'y', '1', 'checked', 'in stock', 'stocked'].includes(String(value || '').trim().toLowerCase())
}

function rowHasPrimaryContent(sheet, row) {
  return ['Ingredient', 'Item Name', 'Component', 'Product', 'Name']
    .some(name => String(cellByName(sheet, row, name) || '').trim())
}

function rowIsOutOfStock(sheet, row) {
  const stockColumn = columnByName(sheet, 'IN STOCK')
  if (!stockColumn || !rowHasPrimaryContent(sheet, row)) return false
  return !cellIsChecked(row.cells[stockColumn.id])
}

function rowHeight(row) {
  return Math.max(MIN_ROW_HEIGHT, Number(row?.height) || DEFAULT_ROW_HEIGHT)
}

function columnWrap(sheet, col) {
  return typeof col.wrap === 'boolean' ? col.wrap : sheet?.wrap !== false
}

function nextColumnWrapState(col) {
  if (typeof col.wrap !== 'boolean') return true
  if (col.wrap === true) return false
  return undefined
}

function wrapBadge(sheet, col) {
  if (typeof col.wrap !== 'boolean') return sheet?.wrap === false ? 'G: NW' : 'G: W'
  return col.wrap ? 'W' : 'NW'
}

function rowSummary(sheet, row, columns) {
  const primary = columns.slice(0, 2)
    .map(col => String(row.cells[col.id] || '').trim())
    .filter(Boolean)
  if (primary.length) return primary.join(' - ')
  if (isBatchProductionSheet(sheet)) return cellByName(sheet, row, 'Ingredient / Step') || 'Blank row'
  return 'Blank row'
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

function autoGrowTextarea(el) {
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${Math.max(el.scrollHeight, 31)}px`
}

function CellEditor({ value, onChange, onBlur, rows = 1, className = '', minHeight, placeholder = '', wrapEnabled = true }) {
  const url = extractUrl(value)
  return (
    <div className="relative min-w-0">
      <textarea
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        wrap={wrapEnabled ? 'soft' : 'off'}
        rows={rows}
        placeholder={placeholder}
        className={`w-full px-2 py-1.5 bg-transparent border border-transparent rounded text-gray-200 text-sm outline-none focus:bg-brand-dark focus:border-brand-accent/40 resize-y leading-5 placeholder-gray-700 ${wrapEnabled ? '' : 'overflow-x-auto'} ${className}`}
        style={{
          minHeight,
          overflowWrap: wrapEnabled ? 'anywhere' : 'normal',
          whiteSpace: wrapEnabled ? undefined : 'pre',
          paddingRight: url ? 24 : undefined,
        }}
      />
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="absolute top-1.5 right-1.5 z-10 text-brand-accent/70 hover:text-brand-accent bg-brand-dark/90 rounded p-0.5"
          onClick={e => e.stopPropagation()}
          title={url}
          aria-label={`Open ${url}`}
        >
          <ExternalLink />
        </a>
      )}
    </div>
  )
}

function StockCell({ value, onChange, onBlur, className = '' }) {
  const checked = cellIsChecked(value)
  return (
    <label className={`flex items-center gap-2 min-h-[42px] px-2 py-1.5 rounded border border-white/10 bg-white/[0.03] text-xs ${checked ? 'text-brand-success' : 'text-red-300'} ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked ? 'TRUE' : '')}
        onBlur={onBlur}
        className="accent-brand-accent shrink-0"
      />
      <span className="truncate">{checked ? 'In stock' : 'Out'}</span>
    </label>
  )
}

function ColumnChip({ col, mode, onPin, onUnpin, onDelete, disableUnpin, onDragStart, onDragOver, onDrop, onDragEnd, dragging }) {
  const isDetail = mode === 'detail'
  return (
    <div
      draggable
      onDragStart={e => onDragStart?.(e, col.id)}
      onDragOver={onDragOver}
      onDrop={e => onDrop?.(e, col.id)}
      onDragEnd={onDragEnd}
      className={`inline-flex items-center gap-1 bg-white/5 border rounded px-2 py-1 text-xs shrink-0 cursor-grab active:cursor-grabbing ${dragging ? 'border-brand-accent/50 opacity-70' : 'border-white/10'}`}
      title="Drag between main columns and detail menu"
    >
      <span className="text-gray-300 max-w-[140px] truncate">{col.name}</span>
      {isDetail ? (
        <button onClick={() => onPin(col.id)} className="text-brand-accent/70 hover:text-brand-accent p-0.5 rounded" title="Move to main columns" aria-label={`Move ${col.name} to main columns`}>
          <PinUp />
        </button>
      ) : (
        <button
          onClick={() => onUnpin(col.id)}
          disabled={disableUnpin}
          className="text-brand-accent/70 hover:text-brand-accent p-0.5 rounded disabled:opacity-25 disabled:cursor-not-allowed"
          title="Move to details"
          aria-label={`Move ${col.name} to details`}
        >
          <PinDown />
        </button>
      )}
      <button onClick={() => onDelete(col.id)} className="text-red-400/70 hover:text-red-400 p-0.5 rounded" title="Delete column" aria-label={`Delete ${col.name}`}>
        <Trash />
      </button>
    </div>
  )
}

export default function Sheets({ userId, resetKey, registerUndo, embedded = false, focusSheetId, onActiveSheetChange }) {
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
  const [showColumnMenu, setShowColumnMenu] = useState(false)
  const [detailRowId, setDetailRowId] = useState(null)
  const [importText, setImportText] = useState('')
  const [importError, setImportError] = useState('')
  const [importUseHeader, setImportUseHeader] = useState(true)
  const [importTarget, setImportTarget] = useState('current')
  const [importName, setImportName] = useState('Imported Sheet')
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [saveState, setSaveState] = useState('idle')
  const [sidebarW, setSidebarW] = useState(loadSidebarW)
  const [dragColumnId, setDragColumnId] = useState(null)
  const [dragSheetId, setDragSheetId] = useState(null)
  const [dragRowId, setDragRowId] = useState(null)
  const [, setHistoryVersion] = useState(0)

  const localSheetsRef = useRef(new Map())
  const dirtyIdsRef = useRef(new Set())
  const saveTimersRef = useRef({})
  const saveVersionRef = useRef({})
  const autoSelectedRef = useRef(false)
  const undoStackRef = useRef([])
  const redoStackRef = useRef([])
  const sidebarResizeRef = useRef(null)

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
      const ordered = applySheetOrder(merged)
      localSheetsRef.current = new Map(ordered.map(sheet => [sheet.id, sheet]))
      return ordered
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
    setShowColumnMenu(false)
    setDetailRowId(null)
    undoStackRef.current = []
    redoStackRef.current = []
    setHistoryVersion(v => v + 1)
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
    setShowColumnMenu(false)
    setDetailRowId(null)
    setEditingName(false)
    setActiveId(null)
  }, [resetKey])

  useEffect(() => () => {
    Object.values(saveTimersRef.current).forEach(timer => clearTimeout(timer))
  }, [])

  const active = useMemo(() => localSheets.find(sheet => sheet.id === activeId), [activeId, localSheets])
  const activeIsBatchProduction = isBatchProductionSheet(active)
  const pinnedCols = useMemo(() => active?.columns.filter(isPinned) || [], [active])
  const detailCols = useMemo(() => active?.columns.filter(col => !isPinned(col)) || [], [active])
  const hasDetails = detailCols.length > 0

  const missingCoreTemplates = useMemo(() => {
    const existingNames = new Set(localSheets.map(sheet => sheet.name))
    return BEYOND_WELLNESS_SHEET_TEMPLATES.filter(template => !existingNames.has(template.name))
  }, [localSheets])

  const visibleRows = useMemo(() => {
    if (!active || !activeIsBatchProduction || !activeBatchProduct) return active?.rows || []
    return active.rows.filter(row => cellByName(active, row, 'Product') === activeBatchProduct)
  }, [active, activeBatchProduct, activeIsBatchProduction])
  const detailPopupRow = useMemo(() => (
    detailRowId ? visibleRows.find(row => row.id === detailRowId) || active?.rows.find(row => row.id === detailRowId) : null
  ), [active, detailRowId, visibleRows])

  const sheetMinWidth = useMemo(() => {
    if (!active) return 760
    return 116 + pinnedCols.reduce((total, col) => total + columnWidth(col), 0) + (hasDetails ? 42 : 0)
  }, [active, pinnedCols, hasDetails])

  const gridTemplate = useMemo(() => {
    if (!active) return ''
    const cols = pinnedCols.map(col => `${columnWidth(col)}px`).join(' ')
    return `34px ${cols}${hasDetails ? ' 42px' : ''} 42px`
  }, [active, pinnedCols, hasDetails])

  useEffect(() => {
    if (active && !isBatchProductionSheet(active)) setActiveBatchProduct(null)
  }, [active])

  useEffect(() => {
    if (!focusSheetId || activeId === focusSheetId) return
    if (!localSheets.some(sheet => sheet.id === focusSheetId)) return
    setActiveId(focusSheetId)
    setShowMobileSidebar(false)
    autoSelectedRef.current = true
  }, [activeId, focusSheetId, localSheets])

  useEffect(() => {
    if (active) onActiveSheetChange?.({ id: active.id, name: active.name })
  }, [active, onActiveSheetChange])

  function bumpHistory() {
    setHistoryVersion(v => v + 1)
  }

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

  function applySheet(sheet) {
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

  function queueSave(sheet, addToHistory = true, historySheet = active) {
    if (addToHistory && historySheet && sheet.id === historySheet.id) {
      undoStackRef.current = [...undoStackRef.current.slice(-(MAX_HISTORY - 1)), safeSheet(historySheet)]
      redoStackRef.current = []
      bumpHistory()
    }
    return applySheet(sheet)
  }

  function queueSaveNow(sheet, addToHistory = true, historySheet = active) {
    const normalized = queueSave(sheet, addToHistory, historySheet)
    const version = saveVersionRef.current[normalized.id] || 0
    saveSheetNow(normalized.id, version)
    return normalized
  }

  function undo() {
    if (!undoStackRef.current.length || !active) return
    const previous = undoStackRef.current[undoStackRef.current.length - 1]
    undoStackRef.current = undoStackRef.current.slice(0, -1)
    redoStackRef.current = [...redoStackRef.current.slice(-(MAX_HISTORY - 1)), safeSheet(active)]
    applySheet(previous)
    bumpHistory()
  }

  function redo() {
    if (!redoStackRef.current.length || !active) return
    const next = redoStackRef.current[redoStackRef.current.length - 1]
    redoStackRef.current = redoStackRef.current.slice(0, -1)
    undoStackRef.current = [...undoStackRef.current.slice(-(MAX_HISTORY - 1)), safeSheet(active)]
    applySheet(next)
    bumpHistory()
  }

  useEffect(() => {
    registerUndo?.(undo, redo)
  })

  function startSidebarResize(e) {
    e.preventDefault()
    const startX = e.clientX
    const startW = sidebarW
    sidebarResizeRef.current = true
    const onMove = (event) => {
      if (!sidebarResizeRef.current) return
      const width = Math.max(MIN_SIDEBAR_W, Math.min(MAX_SIDEBAR_W, startW + (event.clientX - startX)))
      setSidebarW(width)
      localStorage.setItem(LS_SIDEBAR_W_KEY, String(width))
    }
    const onUp = () => {
      sidebarResizeRef.current = false
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
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
    const normalized = safeSheet(sheet)
    const prepared = ensureBatchProductRows(normalized, product)
    let target = sheet
    if (prepared !== normalized) {
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

  function updateStockCell(rowId, colId, value) {
    updateCell(rowId, colId, value)
  }

  function renderSheetCell(row, col, options = {}) {
    const { rows = 1, minHeight, className = '' } = options
    if (isStockColumn(col)) {
      return (
        <StockCell
          value={row.cells[col.id] || ''}
          onChange={value => updateStockCell(row.id, col.id, value)}
          onBlur={() => saveSheetNow(active.id)}
          className={className}
        />
      )
    }
    return (
      <CellEditor
        value={row.cells[col.id] || ''}
        onChange={e => updateCell(row.id, col.id, e.target.value)}
        onBlur={() => saveSheetNow(active.id)}
        rows={rows}
        minHeight={minHeight}
        className={className}
        wrapEnabled={columnWrap(active, col)}
      />
    )
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
    if (detailRowId === rowId) setDetailRowId(null)
    queueSaveNow({ ...active, rows: active.rows.filter(row => row.id !== rowId) })
  }

  function addColumn() {
    if (!active) return
    const column = makeColumn(`Column ${active.columns.length + 1}`, active.columns.length)
    const columns = [...active.columns, column]
    const rows = active.rows.map(row => ({ ...row, cells: { ...row.cells, [column.id]: '' } }))
    queueSave({ ...active, columns, rows })
  }

  function addDetailColumn() {
    if (!active) return
    const column = { ...makeColumn(`Detail ${detailCols.length + 1}`, active.columns.length), pinned: false }
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
    queueSaveNow({ ...active, columns, rows })
  }

  function pinColumn(colId) {
    if (!active) return
    queueSave({ ...active, columns: active.columns.map(col => col.id === colId ? { ...col, pinned: true } : col) })
  }

  function unpinColumn(colId) {
    if (!active || pinnedCols.length <= 1) return
    queueSave({ ...active, columns: active.columns.map(col => col.id === colId ? { ...col, pinned: false } : col) })
  }

  function moveColumn(colId, targetColId = null, makeMain = null) {
    if (!active || !colId) return
    const source = active.columns.find(col => col.id === colId)
    if (!source) return
    if (makeMain === false && source.pinned !== false && pinnedCols.length <= 1) return
    let columns = active.columns.map(col => (
      col.id === colId && typeof makeMain === 'boolean' ? { ...col, pinned: makeMain } : col
    ))
    if (targetColId && targetColId !== colId) columns = moveItem(columns, colId, targetColId)
    queueSave({ ...active, columns })
  }

  function startColumnDrag(e, colId) {
    setDragColumnId(colId)
    e.dataTransfer.effectAllowed = 'copyMove'
    e.dataTransfer.setData('application/x-bw-drag', 'column')
    e.dataTransfer.setData('text/plain', colId)
  }

  function allowColumnDrop(e) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  function dropColumn(e, makeMain, targetColId = null) {
    e.preventDefault()
    e.stopPropagation()
    const type = e.dataTransfer.getData('application/x-bw-drag')
    if (type && type !== 'column') return
    const colId = e.dataTransfer.getData('text/plain') || dragColumnId
    setDragColumnId(null)
    if (!colId) return
    moveColumn(colId, targetColId, makeMain)
  }

  function startSheetDrag(e, sheetId) {
    const sheet = localSheetsRef.current.get(sheetId) || localSheets.find(item => item.id === sheetId)
    setDragSheetId(sheetId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('application/x-bw-drag', 'sheet')
    e.dataTransfer.setData('text/plain', sheetId)
    if (sheet) {
      const payload = { view: 'sheets', sheetId, title: sheet.name }
      e.dataTransfer.setData('application/x-bw-split', JSON.stringify(payload))
      window.dispatchEvent(new CustomEvent('bw-split-drag-start', { detail: payload }))
    }
  }

  function dropSheet(e, targetSheetId) {
    e.preventDefault()
    e.stopPropagation()
    const type = e.dataTransfer.getData('application/x-bw-drag')
    if (type && type !== 'sheet') return
    const sourceId = e.dataTransfer.getData('text/plain') || dragSheetId
    setDragSheetId(null)
    if (!sourceId || !targetSheetId || sourceId === targetSheetId) return
    setLocalSheets(prev => {
      const next = moveItem(prev, sourceId, targetSheetId)
      localSheetsRef.current = new Map(next.map(sheet => [sheet.id, sheet]))
      saveSheetOrder(next)
      return next
    })
  }

  function startRowDrag(e, rowId) {
    setDragRowId(rowId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('application/x-bw-drag', 'row')
    e.dataTransfer.setData('text/plain', rowId)
  }

  function dropRow(e, targetRowId) {
    e.preventDefault()
    e.stopPropagation()
    const type = e.dataTransfer.getData('application/x-bw-drag')
    if (type && type !== 'row') return
    const rowId = e.dataTransfer.getData('text/plain') || dragRowId
    setDragRowId(null)
    if (!active || !rowId || !targetRowId || rowId === targetRowId) return
    queueSave({ ...active, rows: moveItem(active.rows, rowId, targetRowId) })
  }

  function startColumnResize(e, col) {
    if (!active) return
    e.preventDefault()
    e.stopPropagation()
    const startSheet = safeSheet(active)
    const startX = e.clientX
    const startWidth = columnWidth(col)
    let latest = startSheet
    const onMove = (event) => {
      const width = Math.max(MIN_COLUMN_WIDTH, startWidth + (event.clientX - startX))
      latest = { ...startSheet, columns: startSheet.columns.map(item => item.id === col.id ? { ...item, width } : item) }
      setSaveState('dirty')
      setSheetLocal(latest, true)
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      if (latest !== startSheet) queueSave(latest, true, startSheet)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  function startGlobalRowResize(e, row) {
    if (!active) return
    e.preventDefault()
    e.stopPropagation()
    const startSheet = safeSheet(active)
    const startY = e.clientY
    const startHeight = rowHeight(row)
    let latest = startSheet
    const onMove = (event) => {
      const height = Math.max(MIN_ROW_HEIGHT, startHeight + (event.clientY - startY))
      latest = { ...startSheet, rows: startSheet.rows.map(item => ({ ...item, height })) }
      setSaveState('dirty')
      setSheetLocal(latest, true)
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      if (latest !== startSheet) queueSave(latest, true, startSheet)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  function toggleGlobalWrap() {
    if (!active) return
    const nextWrap = active.wrap === false
    const columns = active.columns.map((col, index) => {
      const next = { ...col }
      delete next.sheetWrap
      if (index === 0) next.sheetWrap = nextWrap
      return next
    })
    queueSave({ ...active, wrap: nextWrap, columns })
  }

  function cycleColumnWrap(colId) {
    if (!active) return
    queueSave({ ...active, columns: active.columns.map(col => col.id === colId ? { ...col, wrap: nextColumnWrapState(col) } : col) })
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
    const columns = [...pinnedCols, ...detailCols]
    const header = columns.map(col => csvEscape(col.name)).join(',')
    const body = visibleRows.map(row => columns.map(col => csvEscape(row.cells[col.id] || '')).join(',')).join('\n')
    const suffix = activeBatchProduct ? `-${activeBatchProduct}` : ''
    const filename = `${(active.name + suffix).replace(/[^\w.-]+/g, '-').replace(/^-|-$/g, '') || 'sheet'}.csv`
    downloadText(filename, `${header}\n${body}`)
  }

  async function submitImport() {
    try {
      const parsed = parseImport(importText, importUseHeader)
      if (importTarget === 'new' || !active) {
        const name = importName.trim() || 'Imported Sheet'
        const imported = prepareImportedData(name, parsed)
        const sheet = await addSheet(name)
        const normalized = setSheetLocal({ ...safeSheet(sheet), name, ...imported }, true)
        const version = (saveVersionRef.current[normalized.id] || 0) + 1
        saveVersionRef.current[normalized.id] = version
        await saveSheetNow(normalized.id, version)
        setActiveId(normalized.id)
        autoSelectedRef.current = true
      } else {
        queueSave({ ...active, ...prepareImportedData(active.name, parsed) })
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
    <div className={`${embedded ? 'p-2 animate-fadeIn h-full min-h-0' : 'p-3 pt-4 sm:p-4 sm:pt-6 animate-fadeIn h-[calc(100dvh-64px)] sm:h-[calc(100dvh-40px)] min-h-[360px]'}`}>
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

      <Modal open={showColumnMenu && !!active} onClose={() => setShowColumnMenu(false)} title="Sheet Fields">
        <div className="p-4 space-y-4">
          <div className="rounded border border-white/10 bg-white/[0.03] p-3">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-white">Main columns</h4>
              <button onClick={addColumn} className="px-2 py-1 rounded bg-white/10 text-gray-300 text-xs hover:bg-white/15">Add column</button>
            </div>
            <div
              className="flex flex-wrap gap-2 min-h-[36px]"
              onDragOver={allowColumnDrop}
              onDrop={e => dropColumn(e, true)}
            >
              {pinnedCols.map(col => (
                <ColumnChip
                  key={col.id}
                  col={col}
                  mode="main"
                  onPin={pinColumn}
                  onUnpin={unpinColumn}
                  onDelete={deleteColumn}
                  disableUnpin={pinnedCols.length <= 1}
                  onDragStart={startColumnDrag}
                  onDragOver={allowColumnDrop}
                  onDrop={(e, targetId) => dropColumn(e, true, targetId)}
                  onDragEnd={() => setDragColumnId(null)}
                  dragging={dragColumnId === col.id}
                />
              ))}
            </div>
          </div>

          <div className="rounded border border-white/10 bg-white/[0.03] p-3">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-white">Row popup details</h4>
              <button onClick={addDetailColumn} className="px-2 py-1 rounded bg-white/10 text-gray-300 text-xs hover:bg-white/15">Add detail</button>
            </div>
            <div
              className="flex flex-wrap gap-2 min-h-[36px]"
              onDragOver={allowColumnDrop}
              onDrop={e => dropColumn(e, false)}
            >
              {detailCols.length ? detailCols.map(col => (
                <ColumnChip
                  key={col.id}
                  col={col}
                  mode="detail"
                  onPin={pinColumn}
                  onUnpin={unpinColumn}
                  onDelete={deleteColumn}
                  onDragStart={startColumnDrag}
                  onDragOver={allowColumnDrop}
                  onDrop={(e, targetId) => dropColumn(e, false, targetId)}
                  onDragEnd={() => setDragColumnId(null)}
                  dragging={dragColumnId === col.id}
                />
              )) : (
                <p className="text-xs text-gray-600 py-2">No popup-only fields yet.</p>
              )}
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!active && !!detailPopupRow}
        onClose={() => setDetailRowId(null)}
        title={detailPopupRow && active ? rowSummary(active, detailPopupRow, pinnedCols) : 'Row details'}
      >
        <div className="p-4 space-y-3">
          {detailCols.length ? detailCols.map(col => (
            <div
              key={col.id}
              draggable
              onDragStart={e => startColumnDrag(e, col.id)}
              onDragOver={allowColumnDrop}
              onDrop={e => dropColumn(e, false, col.id)}
              onDragEnd={() => setDragColumnId(null)}
              className={`min-w-0 bg-black/10 border rounded p-2 cursor-grab active:cursor-grabbing ${dragColumnId === col.id ? 'border-brand-accent/50 opacity-80' : 'border-white/5'}`}
              title="Drag to reorder popup details"
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[11px] text-white font-medium truncate">{col.name}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => pinColumn(col.id)} className="text-brand-accent/70 hover:text-brand-accent p-1 rounded" title="Move to main columns" aria-label={`Move ${col.name} to main columns`}>
                    <PinUp />
                  </button>
                  <button onClick={() => deleteColumn(col.id)} className="text-red-400/70 hover:text-red-400 p-1 rounded" title="Delete detail" aria-label={`Delete ${col.name}`}>
                    <Trash />
                  </button>
                </div>
              </div>
              {detailPopupRow && renderSheetCell(detailPopupRow, col, { rows: 3, minHeight: '86px', className: 'bg-brand-dark border-white/10 focus:border-brand-accent/40' })}
            </div>
          )) : (
            <div className="rounded border border-white/10 bg-white/[0.03] p-4 text-sm text-gray-500">
              No popup detail fields yet.
            </div>
          )}
          <div className="flex flex-wrap justify-between gap-2 pt-1">
            <button onClick={() => { setDetailRowId(null); setShowColumnMenu(true) }} className="px-3 py-2 rounded bg-white/10 text-gray-300 text-sm hover:bg-white/15">Manage fields</button>
            <button onClick={() => setDetailRowId(null)} className="btn-primary px-4 py-2 rounded text-sm">Done</button>
          </div>
        </div>
      </Modal>

      <div className="flex gap-0 h-full min-w-0">
        {showMobileSidebar && (
          <div className="drawer-backdrop sm:hidden" onClick={() => setShowMobileSidebar(false)} />
        )}

        <div
          className={`${showMobileSidebar ? 'drawer-panel' : 'hidden'} sm:flex sm:relative sm:flex-shrink-0 sm:flex-col sm:overflow-hidden`}
          style={typeof window !== 'undefined' && window.innerWidth >= 640 ? { width: `${sidebarW}px` } : {}}
        >
          <div className="glass-card sm:rounded p-4 h-full flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold">Sheets</h2>
              <div className="flex gap-1">
                <button onClick={() => setShowNew(true)} className="btn-primary px-2 py-1 rounded text-xs flex items-center gap-1">
                  <Plus /> New
                </button>
                <button onClick={() => setShowMobileSidebar(false)} className="sm:hidden nav-icon" title="Close" aria-label="Close sheets">
                  <CloseIcon />
                </button>
              </div>
            </div>

            <div className="mb-3 border-b border-white/10 pb-3 shrink-0">
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
              <div className="bg-white/5 p-3 rounded mb-3 border border-white/10 animate-slideUp shrink-0">
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

            <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
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
                      draggable
                      onDragStart={e => startSheetDrag(e, sheet.id)}
                      onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }}
                      onDrop={e => dropSheet(e, sheet.id)}
                      onDragEnd={() => { setDragSheetId(null); window.dispatchEvent(new CustomEvent('bw-split-drag-end')) }}
                      onClick={() => {
                        if (batchSheet) {
                          setOpenBatchSheetId(id => id === sheet.id ? null : sheet.id)
                          return
                        }
                        setActiveId(sheet.id)
                      }}
                      className={`w-full text-left p-3 rounded transition-all cursor-grab active:cursor-grabbing ${dragSheetId === sheet.id ? 'opacity-70 ring-1 ring-brand-accent/50' : ''} ${sheet.id === activeId ? 'bg-brand-accent/20 text-white border border-brand-accent/30' : 'text-gray-400 active:bg-white/10 hover:bg-white/5 hover:text-gray-200 border border-transparent'}`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-brand-accent/80 shrink-0">{batchSheet ? (batchOpen ? <ChevronDown /> : <ChevronRight />) : <SheetIcon />}</span>
                        <span className="text-sm truncate pr-6">{sheet.name}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1 pl-5">
                        {batchSheet ? (activeBatchProduct && activeBatch ? activeBatchProduct : 'Choose product') : `${sheet.rows.length} rows`}
                      </div>
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); removeSheet(sheet.id) }}
                      onDragStart={e => e.stopPropagation()}
                      className="absolute right-1 top-1/2 -translate-y-1/2 opacity-100 sm:opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:bg-white/10 rounded transition-all"
                      title="Delete"
                      aria-label={`Delete ${sheet.name}`}
                    >
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

        <div
          onMouseDown={startSidebarResize}
          className="hidden sm:block w-1 flex-shrink-0 cursor-col-resize rounded-full hover:bg-brand-accent/30 transition-colors mx-1"
          style={{ background: 'rgba(255,255,255,0.04)' }}
        />

        <div className="flex-1 min-w-0 h-full flex flex-col overflow-hidden">
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
            <div className="glass-card rounded p-3 sm:p-4 h-full flex flex-col overflow-hidden min-w-0">
              <div className="flex flex-wrap sm:flex-nowrap items-center justify-between mb-2 pb-2 border-b border-white/10 shrink-0 gap-2 min-w-0">
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
                    className="text-base sm:text-lg font-semibold text-white bg-transparent border-b-2 border-brand-accent outline-none flex-1 min-w-0"
                  />
                ) : (
                  <h2
                    onClick={() => { setNameDraft(active.name); setEditingName(true) }}
                    onDragOver={dragColumnId ? allowColumnDrop : undefined}
                    onDrop={dragColumnId ? e => dropColumn(e, false) : undefined}
                    className={`text-base sm:text-lg font-semibold text-white cursor-pointer transition-colors flex items-center gap-2 select-none truncate min-w-0 flex-1 rounded px-1 -mx-1 ${dragColumnId ? 'border border-dashed border-brand-accent/40 bg-brand-accent/5 text-brand-accent' : 'border border-transparent hover:text-brand-accent'}`}
                    title={dragColumnId ? 'Drop column here to move it into row details' : 'Rename'}
                  >
                    <span className="truncate">{active.name}</span>
                    {activeIsBatchProduction && activeBatchProduct && (
                      <span className="shrink-0 text-[11px] font-medium text-brand-accent bg-brand-accent/10 border border-brand-accent/20 rounded px-2 py-1">
                        {activeBatchProduct}
                      </span>
                    )}
                  </h2>
                )}
                <div className="flex gap-1 shrink-0 items-center overflow-x-auto scrollbar-hide max-w-full pb-0.5">
                  <span className={`text-[11px] px-2 py-1 rounded flex-shrink-0 ${saveLabel === 'unsaved' ? 'bg-yellow-500/10 text-yellow-400' : saveLabel === 'saving' ? 'bg-blue-500/10 text-blue-400' : 'bg-white/5 text-gray-500'}`}>
                    {saveLabel}
                  </span>
                  <button onClick={undo} disabled={!undoStackRef.current.length} className="nav-icon text-gray-500 hover:text-gray-300 disabled:opacity-30" title="Undo (Ctrl+Z)" aria-label="Undo">
                    <UndoIcon />
                  </button>
                  <button onClick={redo} disabled={!redoStackRef.current.length} className="nav-icon text-gray-500 hover:text-gray-300 disabled:opacity-30" title="Redo (Ctrl+Shift+Z)" aria-label="Redo">
                    <RedoIcon />
                  </button>
                  <button onClick={() => saveSheetNow(active.id)} className="text-xs text-gray-500 hover:text-gray-300 px-2 py-1.5 sm:py-1 rounded hover:bg-white/5 transition-all flex-shrink-0">Save</button>
                  <button onClick={() => setShowImport(true)} className="text-xs text-gray-500 hover:text-gray-300 px-2 py-1.5 sm:py-1 rounded hover:bg-white/5 flex items-center gap-1 flex-shrink-0">
                    <ImportIcon /><span className="hidden sm:inline">Import</span>
                  </button>
                  <button onClick={exportCsv} className="text-xs text-gray-500 hover:text-gray-300 px-2 py-1.5 sm:py-1 rounded hover:bg-white/5 flex items-center gap-1 flex-shrink-0">
                    <DownloadIcon /><span className="hidden sm:inline">CSV</span>
                  </button>
                </div>
              </div>

              <div className="flex gap-2 mb-2 shrink-0 overflow-x-auto scrollbar-hide pb-1">
                <button onClick={addRow} className="btn-primary px-3 py-1.5 rounded text-sm font-medium flex items-center gap-1 shrink-0">
                  <Plus /> Row
                </button>
                <button onClick={addColumn} className="px-3 py-1.5 bg-white/10 text-gray-300 rounded text-sm hover:bg-white/20 flex items-center gap-1 shrink-0">
                  <Plus /> Column
                </button>
                <button
                  onClick={() => setShowColumnMenu(true)}
                  className="px-3 py-1.5 bg-white/10 text-gray-300 rounded text-sm hover:bg-white/20 flex items-center gap-1 shrink-0"
                  title="Manage sheet fields"
                  aria-label="Manage sheet fields"
                >
                  Fields
                </button>
                <button
                  onClick={toggleGlobalWrap}
                  className={`hidden sm:flex px-3 py-1.5 rounded text-sm items-center gap-1 shrink-0 ${active.wrap === false ? 'bg-brand-accent/15 text-brand-accent border border-brand-accent/20' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}
                  title="Toggle cell text wrapping"
                  aria-label="Toggle cell text wrapping"
                >
                  Wrap {active.wrap === false ? 'Off' : 'On'}
                </button>
              </div>

              <div
                className="mb-2 shrink-0 rounded border border-white/10 bg-white/[0.035] px-2 py-2 flex items-center gap-2 overflow-x-auto scrollbar-hide"
                onDragOver={allowColumnDrop}
                onDrop={e => dropColumn(e, false)}
              >
                <span className="text-[11px] font-semibold uppercase tracking-wide text-white shrink-0">Details</span>
                {detailCols.length ? detailCols.map(col => (
                  <ColumnChip
                    key={col.id}
                    col={col}
                    mode="detail"
                    onPin={pinColumn}
                    onUnpin={unpinColumn}
                    onDelete={deleteColumn}
                    onDragStart={startColumnDrag}
                    onDragOver={allowColumnDrop}
                    onDrop={(e, targetId) => dropColumn(e, false, targetId)}
                    onDragEnd={() => setDragColumnId(null)}
                    dragging={dragColumnId === col.id}
                  />
                )) : (
                  <span className="text-xs text-gray-500 shrink-0">Drag columns here to keep them in the row popup.</span>
                )}
                <button onClick={addDetailColumn} className="ml-auto px-2 py-1 rounded bg-white/10 text-gray-300 text-xs hover:bg-white/15 shrink-0">Add detail</button>
              </div>

              <div className="hidden sm:block flex-1 overflow-auto min-h-0 -mx-1 px-1" style={{ WebkitOverflowScrolling: 'touch' }}>
                <div style={{ minWidth: sheetMinWidth }}>
                  <div
                    className="grid gap-1 pb-2 border-b border-white/10 sticky top-0 z-10 bg-[#1f1f1f]"
                    style={{ gridTemplateColumns: gridTemplate }}
                    onDragOver={allowColumnDrop}
                    onDrop={e => dropColumn(e, true)}
                  >
                    <div className="text-[11px] text-gray-600 uppercase tracking-wider px-1 py-2">#</div>
                    {pinnedCols.map(col => (
                      <div
                        key={col.id}
                        draggable
                        onDragStart={e => startColumnDrag(e, col.id)}
                        onDragOver={allowColumnDrop}
                        onDrop={e => dropColumn(e, true, col.id)}
                        onDragEnd={() => setDragColumnId(null)}
                        onDoubleClick={() => cycleColumnWrap(col.id)}
                        className={`group flex items-stretch gap-1 px-1 min-w-0 cursor-grab active:cursor-grabbing rounded border ${dragColumnId === col.id ? 'border-brand-accent/50 bg-brand-accent/5 opacity-80' : 'border-transparent'}`}
                        title="Drag to reorder. Drag to Details to move into row popup. Double-click to pin wrap."
                      >
                        <textarea
                          ref={autoGrowTextarea}
                          value={col.name}
                          onChange={e => updateColumn(col.id, e.target.value)}
                          onInput={e => autoGrowTextarea(e.currentTarget)}
                          onBlur={() => saveSheetNow(active.id)}
                          draggable={false}
                          rows={1}
                          className="w-full min-h-[31px] max-h-[78px] px-2 py-1.5 bg-white/5 border border-white/10 rounded text-gray-300 text-xs font-medium outline-none focus:border-brand-accent/40 resize-none overflow-hidden leading-4 whitespace-normal"
                          style={{ overflowWrap: 'anywhere' }}
                        />
                        <span className={`self-start mt-1 px-1.5 py-0.5 rounded text-[9px] font-semibold shrink-0 ${columnWrap(active, col) ? 'bg-white/5 text-gray-500' : 'bg-brand-accent/15 text-brand-accent'}`}>
                          {wrapBadge(active, col)}
                        </span>
                        <button
                          onClick={() => unpinColumn(col.id)}
                          onDoubleClick={e => e.stopPropagation()}
                          disabled={pinnedCols.length <= 1}
                          className="p-1 text-brand-accent/70 hover:text-brand-accent hover:bg-white/10 rounded transition-all disabled:opacity-25 disabled:cursor-not-allowed"
                          title="Move to details"
                          aria-label={`Move ${col.name} to details`}
                        >
                          <PinDown />
                        </button>
                        <button onClick={() => deleteColumn(col.id)} onDoubleClick={e => e.stopPropagation()} className="p-1 text-red-400 hover:bg-white/10 rounded transition-all" title="Delete column" aria-label={`Delete ${col.name}`}>
                          <Trash />
                        </button>
                        <span
                          role="separator"
                          aria-label={`Resize ${col.name} column`}
                          onMouseDown={e => startColumnResize(e, col)}
                          onDoubleClick={e => e.stopPropagation()}
                          onDragStart={e => e.preventDefault()}
                          className="w-1.5 self-stretch rounded cursor-col-resize bg-white/5 hover:bg-brand-accent/40 shrink-0"
                          title="Resize column"
                        />
                      </div>
                    ))}
                    {hasDetails && <div className="text-[11px] text-gray-600 uppercase tracking-wider px-1 py-2 text-center">Info</div>}
                    <div />
                  </div>

                  {visibleRows.map((row, rowIndex) => {
                    const outOfStock = rowIsOutOfStock(active, row)
                    const rowPixels = rowHeight(row)
                    return (
                      <div key={row.id}>
                        <div
                          className={`relative grid gap-1 border-b hover:bg-white/[0.025] rounded-sm ${dragRowId === row.id ? 'ring-1 ring-brand-accent/50 bg-brand-accent/[0.04]' : ''} ${outOfStock ? 'border-red-500/50 ring-1 ring-red-500/35 bg-red-500/[0.035]' : 'border-white/5'}`}
                          style={{ gridTemplateColumns: gridTemplate, minHeight: rowPixels }}
                        >
                          <div
                            draggable
                            onDragStart={e => startRowDrag(e, row.id)}
                            onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }}
                            onDrop={e => dropRow(e, row.id)}
                            onDragEnd={() => setDragRowId(null)}
                            className="text-xs text-gray-600 px-1 py-2 select-none cursor-grab active:cursor-grabbing h-full flex items-start"
                            title="Drag to reorder row"
                            aria-label={`Move row ${rowIndex + 1}`}
                          >
                            {rowIndex + 1}
                          </div>
                          {pinnedCols.map(col => (
                            <div key={col.id} className="my-1 min-w-0">
                              {renderSheetCell(row, col, { minHeight: `${rowPixels}px` })}
                            </div>
                          ))}
                          {hasDetails && (
                            <div className="flex items-start justify-center pt-2">
                              <button
                                onClick={() => setDetailRowId(row.id)}
                                className="p-1.5 rounded transition-all text-gray-600 hover:text-gray-300 hover:bg-white/5"
                                title="Open row details"
                                aria-label={`Open row ${rowIndex + 1} details`}
                              >
                                <ExpandChev open={false} />
                              </button>
                            </div>
                          )}
                          <div className="flex items-start justify-center pt-2">
                            <button onClick={() => deleteRow(row.id)} className="p-1.5 text-red-400 hover:bg-white/10 rounded transition-all" title="Delete row" aria-label={`Delete row ${rowIndex + 1}`}>
                              <Trash />
                            </button>
                          </div>
                          <span
                            role="separator"
                            aria-label={`Resize all rows from row ${rowIndex + 1}`}
                            onMouseDown={e => startGlobalRowResize(e, row)}
                            onDragStart={e => e.preventDefault()}
                            className="absolute left-0 right-0 bottom-0 h-1.5 cursor-row-resize bg-transparent hover:bg-brand-accent/35"
                            title="Resize all rows"
                          />
                        </div>

                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="sm:hidden flex-1 overflow-y-auto min-h-0 space-y-3 pr-0.5" style={{ WebkitOverflowScrolling: 'touch' }}>
                {visibleRows.map((row, rowIndex) => {
                  const outOfStock = rowIsOutOfStock(active, row)
                  return (
                    <div key={row.id} className={`bg-white/[0.04] border rounded-lg p-3 ${outOfStock ? 'border-red-500/60 ring-1 ring-red-500/35 bg-red-500/[0.04]' : 'border-white/10'}`}>
                      <div className="flex items-center justify-between gap-2">
                        <button
                          onClick={() => hasDetails && setDetailRowId(row.id)}
                          className={`flex-1 min-w-0 text-left rounded ${hasDetails ? 'active:text-brand-accent' : ''}`}
                          disabled={!hasDetails}
                        >
                          <span className="block text-[11px] text-gray-600 uppercase tracking-wide">Row {rowIndex + 1}</span>
                          <span className="block text-sm text-white truncate mt-0.5">{rowSummary(active, row, pinnedCols)}</span>
                        </button>
                        {hasDetails && (
                          <button
                            onClick={() => setDetailRowId(row.id)}
                            className="p-2 rounded transition-all text-gray-500 bg-white/5"
                            title="Open row details"
                            aria-label={`Open row ${rowIndex + 1} details`}
                          >
                            <ExpandChev open={false} />
                          </button>
                        )}
                        <button onClick={() => deleteRow(row.id)} className="p-2 text-red-400 bg-white/5 rounded" title="Delete row" aria-label={`Delete row ${rowIndex + 1}`}>
                          <Trash />
                        </button>
                      </div>

                      <div className="mt-3 space-y-3">
                        {pinnedCols.map(col => (
                          <div key={col.id} className="min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="text-[11px] text-gray-500 font-medium truncate">{col.name}</span>
                              <button
                                onClick={() => unpinColumn(col.id)}
                                disabled={pinnedCols.length <= 1}
                                className="text-brand-accent/70 p-1 rounded disabled:opacity-25"
                                title="Move to details"
                                aria-label={`Move ${col.name} to details`}
                              >
                                <PinDown />
                              </button>
                            </div>
                            {renderSheetCell(row, col, { rows: 1, minHeight: '44px', className: 'bg-brand-dark/50 border-white/10 focus:border-brand-accent/40' })}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
