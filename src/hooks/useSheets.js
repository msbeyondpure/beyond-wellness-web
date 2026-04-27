import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase, isConfigured } from '../lib/supabase'

const LS_KEY = 'bwSheets'
const LS_CORE_SEEDED_KEY = 'bwSheetsCoreSeeded'

export const BATCH_PRODUCTION_PRODUCTS = ['Deodorant', 'Moisturizer', 'Body Oil', 'Lip Balm']

export const BATCH_PRODUCTION_STEPS = [
  { 'Ingredient / Step': 'Weigh phase A ingredients', 'Step Order': '1', 'Release Status': 'Pending' },
  { 'Ingredient / Step': 'Heat / mix phase A', 'Step Order': '2', 'Release Status': 'Pending' },
  { 'Ingredient / Step': 'Add cool-down ingredients', 'Step Order': '3', 'Release Status': 'Pending' },
  { 'Ingredient / Step': 'Fill containers', 'Step Order': '4', 'Release Status': 'Pending' },
  { 'Ingredient / Step': 'Final QC and release', 'Step Order': '5', 'Release Status': 'Pending' },
]

export const BEYOND_WELLNESS_SHEET_TEMPLATES = [
  {
    key: 'master-sourcing',
    name: 'Master Sourcing Sheet',
    columns: [
      'Ingredient',
      'INCI / Spec',
      'Function',
      'Preferred Source',
      'Preferred Link',
      'Backup Source',
      'Backup Link',
      'MOQ',
      'Unit Price',
      'Price Break',
      'Shipping Cost',
      'Lead Time',
      'Certs / COA',
      'Compliance Notes',
      'Last Quote',
      'Status',
      'Notes',
    ],
    rows: [
      { Function: 'Active / hero ingredient', Status: 'Needs source' },
      { Function: 'Base / carrier', Status: 'Needs source' },
      { Function: 'Preservative / stabilizer', Status: 'Needs source' },
      { Function: 'Fragrance / sensory', Status: 'Needs source' },
      { Function: 'Backup-only ingredient', Status: 'Needs source' },
    ],
  },
  {
    key: 'packaging-containers',
    name: 'Packaging + Containers Sheet',
    columns: [
      'Component',
      'Product Fit',
      'Material / Finish',
      'Size / Dimensions',
      'Color',
      'Closure / Fitment',
      'Label Panel',
      'Supplier',
      'Supplier Link',
      'Unit Cost',
      'MOQ',
      'Case Pack',
      'Lead Time',
      'Storage Need',
      'Artwork Status',
      'Test Status',
      'Notes',
    ],
    rows: [
      { Component: 'Jar', 'Artwork Status': 'N/A', 'Test Status': 'Needs compatibility test' },
      { Component: 'Lid', 'Artwork Status': 'N/A', 'Test Status': 'Needs fit test' },
      { Component: 'Label', 'Artwork Status': 'Needs dieline', 'Test Status': 'Needs adhesion test' },
      { Component: 'Outer box', 'Artwork Status': 'Needs artwork', 'Test Status': 'Needs ship test' },
      { Component: 'Inner card', 'Artwork Status': 'Needs copy', 'Test Status': 'Needs review' },
      { Component: 'Shipping material', 'Artwork Status': 'N/A', 'Test Status': 'Needs drop test' },
    ],
  },
  {
    key: 'costing',
    name: 'Costing Sheet',
    columns: [
      'Product',
      'Unit Size',
      'Batch Size',
      'Ingredient Cost / Unit',
      'Packaging Cost / Unit',
      'Labor Min / Unit',
      'Labor Rate',
      'Labor Cost / Unit',
      'Partner Payout',
      'Fulfillment Cost',
      'Total COGS',
      'Wholesale Price',
      'Retail Price',
      'Gross Margin',
      'Bundle Role',
      'Bundle Cost',
      'Bundle Margin',
      'Pricing Decision',
      'Notes',
    ],
    rows: [
      { 'Bundle Role': 'Single product', 'Pricing Decision': 'Draft' },
      { 'Bundle Role': 'Hero bundle item', 'Pricing Decision': 'Draft' },
      { 'Bundle Role': 'Add-on / upsell', 'Pricing Decision': 'Draft' },
      { 'Bundle Role': 'Partner payout scenario', 'Pricing Decision': 'Draft' },
    ],
  },
  {
    key: 'batch-production',
    name: 'Batch Production Sheet',
    columns: [
      'Batch ID',
      'Product',
      'Batch Size',
      'Ingredient / Step',
      'Exact Weight',
      'Unit',
      'Step Order',
      'Process Instructions',
      'Equipment',
      'Start Time',
      'End Time',
      'Yield',
      'Yield Unit',
      'Worker',
      'QC Check',
      'Issue',
      'Corrective Action',
      'Release Status',
      'Notes',
    ],
    rows: BATCH_PRODUCTION_PRODUCTS.flatMap(product => (
      BATCH_PRODUCTION_STEPS.map(step => ({ Product: product, ...step }))
    )),
  },
  {
    key: 'inventory',
    name: 'Inventory Sheet',
    columns: [
      'Item Type',
      'Item Name',
      'SKU / Lot',
      'Location',
      'On Hand',
      'Unit',
      'Allocated',
      'Available',
      'Reorder Point',
      'Reorder Qty',
      'Preferred Supplier',
      'Supplier Lead Time',
      'Last Count Date',
      'Expiry / Retest Date',
      'COA On File',
      'Reorder Status',
      'Notes',
    ],
    rows: [
      { 'Item Type': 'Ingredient', 'Reorder Status': 'Watch' },
      { 'Item Type': 'Ingredient', 'Reorder Status': 'Watch' },
      { 'Item Type': 'Jar / container', 'Reorder Status': 'Watch' },
      { 'Item Type': 'Lid / closure', 'Reorder Status': 'Watch' },
      { 'Item Type': 'Label / printed item', 'Reorder Status': 'Watch' },
      { 'Item Type': 'Shipping material', 'Reorder Status': 'Watch' },
    ],
  },
]

function uid() {
  return Date.now() + '-' + Math.random().toString(36).slice(2)
}

function lsGet() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || [] } catch { return [] }
}

function lsSet(sheets) {
  localStorage.setItem(LS_KEY, JSON.stringify(sheets))
}

function seedCoreSheets() {
  return BEYOND_WELLNESS_SHEET_TEMPLATES.map(makeTemplateSheet)
}

function lsGetWithSeed() {
  const existing = lsGet()
  if (existing.length || localStorage.getItem(LS_CORE_SEEDED_KEY) === '1') return existing.map(normalizeSheet)
  const seeded = seedCoreSheets()
  lsSet(seeded)
  localStorage.setItem(LS_CORE_SEEDED_KEY, '1')
  return seeded
}

function defaultColumns() {
  return [
    { id: uid(), name: 'Name' },
    { id: uid(), name: 'Category' },
    { id: uid(), name: 'Amount' },
    { id: uid(), name: 'Cost' },
    { id: uid(), name: 'Link' },
    { id: uid(), name: 'Notes' },
  ]
}

function rowFromColumns(columns) {
  return {
    id: uid(),
    cells: Object.fromEntries(columns.map(col => [col.id, ''])),
  }
}

function rowFromNamedValues(columns, values = {}) {
  return {
    id: uid(),
    cells: Object.fromEntries(columns.map(col => [col.id, values[col.name] || ''])),
  }
}

function normalizeSheet(sheet) {
  const columns = Array.isArray(sheet.columns) && sheet.columns.length ? sheet.columns : defaultColumns()
  const rows = Array.isArray(sheet.rows) ? sheet.rows : []
  return {
    id: sheet.id || uid(),
    name: sheet.name || 'Untitled Sheet',
    columns,
    rows: rows.map(row => ({
      id: row.id || uid(),
      cells: { ...Object.fromEntries(columns.map(col => [col.id, ''])), ...(row.cells || {}) },
    })),
    created_at: sheet.created_at || new Date().toISOString(),
    updated_at: sheet.updated_at || new Date().toISOString(),
  }
}

function makeSheet(name = 'New Sheet') {
  const columns = defaultColumns()
  return normalizeSheet({
    id: uid(),
    name,
    columns,
    rows: Array.from({ length: 8 }, () => rowFromColumns(columns)),
  })
}

function makeTemplateSheet(template) {
  const columns = template.columns.map(name => ({ id: uid(), name }))
  const starterRows = template.rows.map(row => rowFromNamedValues(columns, row))
  const blankCount = Math.max(2, 8 - starterRows.length)
  return normalizeSheet({
    id: uid(),
    name: template.name,
    columns,
    rows: [...starterRows, ...Array.from({ length: blankCount }, () => rowFromColumns(columns))],
  })
}

export function useSheets(userId) {
  const [sheets, setSheets] = useState([])
  const [loading, setLoading] = useState(true)
  const [cloudDisabled, setCloudDisabled] = useState(false)
  const useDB = useMemo(() => isConfigured && !!userId && !cloudDisabled, [userId, cloudDisabled])

  useEffect(() => {
    if (!useDB) {
      setSheets(lsGetWithSeed())
      setLoading(false)
      return
    }

    let cancelled = false

    async function loadAll() {
      const { data, error } = await supabase
        .from('sheets')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })

      if (cancelled) return
      if (error) {
        setCloudDisabled(true)
        setSheets(lsGetWithSeed())
      } else {
        setSheets((data || []).map(normalizeSheet))
      }
      setLoading(false)
    }

    loadAll()
    const interval = setInterval(loadAll, 4000)
    const onVisibility = () => { if (document.visibilityState === 'visible') loadAll() }
    document.addEventListener('visibilitychange', onVisibility)

    const channel = supabase.channel('sheets-' + userId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sheets', filter: `user_id=eq.${userId}` }, loadAll)
      .subscribe()

    return () => {
      cancelled = true
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibility)
      supabase.removeChannel(channel)
    }
  }, [userId, useDB])

  const persistLocal = useCallback((updater) => {
    setSheets(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      lsSet(next)
      return next
    })
  }, [])

  const addSheet = useCallback(async (name = 'New Sheet') => {
    const sheet = makeSheet(name)
    if (!useDB) {
      persistLocal(prev => [sheet, ...prev])
      return sheet
    }

    const { data, error } = await supabase
      .from('sheets')
      .insert({
        user_id: userId,
        name: sheet.name,
        columns: sheet.columns,
        rows: sheet.rows,
      })
      .select()
      .single()

    if (error) {
      setCloudDisabled(true)
      persistLocal(prev => [sheet, ...prev])
      return sheet
    }

    const normalized = normalizeSheet(data)
    setSheets(prev => [normalized, ...prev])
    return normalized
  }, [persistLocal, useDB, userId])

  const addTemplateSheet = useCallback(async (template) => {
    const sheet = makeTemplateSheet(template)
    if (!useDB) {
      persistLocal(prev => [sheet, ...prev])
      return sheet
    }

    const { data, error } = await supabase
      .from('sheets')
      .insert({
        user_id: userId,
        name: sheet.name,
        columns: sheet.columns,
        rows: sheet.rows,
      })
      .select()
      .single()

    if (error) {
      setCloudDisabled(true)
      persistLocal(prev => [sheet, ...prev])
      return sheet
    }

    const normalized = normalizeSheet(data)
    setSheets(prev => [normalized, ...prev])
    return normalized
  }, [persistLocal, useDB, userId])

  const addCoreSheets = useCallback(async () => {
    const existingNames = new Set(sheets.map(sheet => sheet.name))
    const missingTemplates = BEYOND_WELLNESS_SHEET_TEMPLATES.filter(template => !existingNames.has(template.name))
    const created = []
    for (const template of missingTemplates) {
      created.push(await addTemplateSheet(template))
    }
    return created
  }, [addTemplateSheet, sheets])

  const saveSheet = useCallback(async (sheet) => {
    const normalized = normalizeSheet({ ...sheet, updated_at: new Date().toISOString() })

    setSheets(prev => {
      const exists = prev.some(item => item.id === normalized.id)
      const next = exists ? prev.map(item => item.id === normalized.id ? normalized : item) : [normalized, ...prev]
      if (!useDB) lsSet(next)
      return next
    })

    if (!useDB) return normalized

    const { data, error } = await supabase
      .from('sheets')
      .upsert({
        id: normalized.id,
        user_id: userId,
        name: normalized.name,
        columns: normalized.columns,
        rows: normalized.rows,
        updated_at: normalized.updated_at,
      }, { onConflict: 'id' })
      .select()
      .single()

    if (error) {
      setCloudDisabled(true)
      setSheets(prev => {
        const exists = prev.some(item => item.id === normalized.id)
        const next = exists ? prev.map(item => item.id === normalized.id ? normalized : item) : [normalized, ...prev]
        lsSet(next)
        return next
      })
      return normalized
    }

    return normalizeSheet(data)
  }, [useDB, userId])

  const deleteSheet = useCallback(async (id) => {
    setSheets(prev => {
      const next = prev.filter(sheet => sheet.id !== id)
      if (!useDB) lsSet(next)
      return next
    })
    if (useDB) {
      const { error } = await supabase.from('sheets').delete().eq('id', id).eq('user_id', userId)
      if (error) setCloudDisabled(true)
    }
  }, [useDB, userId])

  return { sheets, loading, addSheet, addTemplateSheet, addCoreSheets, saveSheet, deleteSheet, usingLocalSheets: !useDB }
}
