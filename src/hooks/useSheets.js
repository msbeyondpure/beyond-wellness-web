import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase, isConfigured } from '../lib/supabase'

const LS_KEY = 'bwSheets'
const LS_CORE_SEEDED_KEY = 'bwSheetsCoreSeeded'

export const BATCH_PRODUCTION_PRODUCTS = ['Deodorant', 'Moisturizer', 'Body Oil', 'Lip Balm']
export const MASTER_SOURCING_SHEET_NAME = 'Master Sourcing Sheet'
export const LEGACY_INVENTORY_SHEET_NAME = 'Inventory Sheet'

export const MASTER_SOURCING_COLUMNS = [
  'Ingredient',
  'IN STOCK',
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
  'Inventory Category',
  'SKU / Lot',
  'Location',
  'On Hand',
  'Unit',
  'Allocated',
  'Available',
  'Reorder Point',
  'Reorder Qty',
  'Supplier Lead Time',
  'Last Count Date',
  'Expiry / Retest Date',
  'COA On File',
  'Reorder Status',
  'Notes',
]

const LEGACY_INVENTORY_COLUMNS = [
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
]

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
    name: MASTER_SOURCING_SHEET_NAME,
    columns: MASTER_SOURCING_COLUMNS,
    rows: [
      { Function: 'Active / hero ingredient', Status: 'Needs source' },
      { Function: 'Base / carrier', Status: 'Needs source' },
      { Function: 'Preservative / stabilizer', Status: 'Needs source' },
      { Function: 'Fragrance / sensory', Status: 'Needs source' },
      { Function: 'Backup-only ingredient', Status: 'Needs source' },
      { 'Inventory Category': 'Ingredient', 'Reorder Status': 'Watch' },
      { 'Inventory Category': 'Jar / container', 'Reorder Status': 'Watch' },
      { 'Inventory Category': 'Lid / closure', 'Reorder Status': 'Watch' },
      { 'Inventory Category': 'Label / printed item', 'Reorder Status': 'Watch' },
      { 'Inventory Category': 'Shipping material', 'Reorder Status': 'Watch' },
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

function sheetListChanged(a = [], b = []) {
  if (a.length !== b.length) return true
  return a.some((sheet, index) => sheet.id !== b[index]?.id || sheet.name !== b[index]?.name)
}

function valuesByColumnName(sheet, row) {
  return Object.fromEntries((sheet.columns || []).map(col => [col.name, row.cells?.[col.id] || '']))
}

function hasNamedRowContent(values) {
  return Object.values(values).some(value => String(value || '').trim())
}

function truthyStock(value) {
  const normalized = String(value || '').trim().toLowerCase()
  return ['true', 'yes', 'y', '1', 'checked', 'in stock', 'stocked'].includes(normalized)
}

function isStockColumn(col) {
  return String(col?.name || '').trim().toLowerCase() === 'in stock'
}

function normalizeStockCells(sheet) {
  const stockColumns = (sheet?.columns || []).filter(isStockColumn)
  if (stockColumns.length <= 1) return sheet
  return {
    ...sheet,
    rows: (sheet.rows || []).map(row => {
      if (!stockColumns.some(col => truthyStock(row.cells?.[col.id]))) return row
      const cells = { ...(row.cells || {}) }
      stockColumns.forEach(col => { cells[col.id] = 'TRUE' })
      return { ...row, cells }
    }),
  }
}

function stockFromInventory(values) {
  const available = parseFloat(values.Available || values['On Hand'] || '')
  if (Number.isFinite(available) && available > 0) return 'TRUE'
  if (truthyStock(values['IN STOCK'])) return 'TRUE'
  return ''
}

function mergeValue(current, next) {
  return String(current || '').trim() ? current : (next || '')
}

function mappedInventoryValues(values) {
  return {
    Ingredient: values['Item Name'] || values.Ingredient || values.Component || '',
    'Inventory Category': values['Item Type'] || values['Inventory Category'] || '',
    'SKU / Lot': values['SKU / Lot'] || '',
    Location: values.Location || '',
    'On Hand': values['On Hand'] || '',
    Unit: values.Unit || '',
    Allocated: values.Allocated || '',
    Available: values.Available || '',
    'Reorder Point': values['Reorder Point'] || '',
    'Reorder Qty': values['Reorder Qty'] || '',
    'Preferred Source': values['Preferred Supplier'] || values['Preferred Source'] || '',
    'Supplier Lead Time': values['Supplier Lead Time'] || '',
    'Lead Time': values['Supplier Lead Time'] || values['Lead Time'] || '',
    'COA On File': values['COA On File'] || '',
    'Certs / COA': values['COA On File'] || values['Certs / COA'] || '',
    'Last Count Date': values['Last Count Date'] || '',
    'Expiry / Retest Date': values['Expiry / Retest Date'] || '',
    'Reorder Status': values['Reorder Status'] || '',
    Status: values['Reorder Status'] || values.Status || '',
    'IN STOCK': stockFromInventory(values),
    Notes: values.Notes || '',
  }
}

function masterRowIndexForInventory(master, masterRows, mapped) {
  const ingredientColumn = master.columns.find(col => col.name === 'Ingredient')
  const categoryColumn = master.columns.find(col => col.name === 'Inventory Category')
  const ingredient = String(mapped.Ingredient || '').trim().toLowerCase()
  if (ingredient && ingredientColumn) {
    return masterRows.findIndex(row => String(row.cells?.[ingredientColumn.id] || '').trim().toLowerCase() === ingredient)
  }

  const category = String(mapped['Inventory Category'] || '').trim().toLowerCase()
  if (!category || !categoryColumn) return -1
  return masterRows.findIndex(row => (
    !String(row.cells?.[ingredientColumn?.id] || '').trim() &&
    String(row.cells?.[categoryColumn.id] || '').trim().toLowerCase() === category
  ))
}

function mergeInventoryIntoMasterSheets(inputSheets) {
  const normalized = inputSheets.map(normalizeSheet)
  const inventorySheets = normalized.filter(sheet => sheet.name === LEGACY_INVENTORY_SHEET_NAME)
  if (!inventorySheets.length) {
    return normalized.filter(sheet => sheet.name !== LEGACY_INVENTORY_SHEET_NAME)
  }

  const remaining = normalized.filter(sheet => sheet.name !== LEGACY_INVENTORY_SHEET_NAME)
  let master = remaining.find(sheet => sheet.name === MASTER_SOURCING_SHEET_NAME)
  if (!master) master = makeTemplateSheet(BEYOND_WELLNESS_SHEET_TEMPLATES.find(template => template.name === MASTER_SOURCING_SHEET_NAME))
  master = normalizeSheet(master)

  const masterRows = [...master.rows]

  inventorySheets.forEach(sheet => {
    sheet.rows.forEach(row => {
      const values = valuesByColumnName(sheet, row)
      if (!hasNamedRowContent(values)) return
      const mapped = mappedInventoryValues(values)
      const targetIndex = masterRowIndexForInventory(master, masterRows, mapped)

      if (targetIndex >= 0) {
        const cells = { ...masterRows[targetIndex].cells }
        master.columns.forEach(col => {
          cells[col.id] = mergeValue(cells[col.id], mapped[col.name])
        })
        masterRows[targetIndex] = { ...masterRows[targetIndex], cells }
      } else {
        masterRows.push(rowFromNamedValues(master.columns, mapped))
      }
    })
  })

  const mergedMaster = normalizeSheet({ ...master, rows: masterRows })
  const hasMaster = remaining.some(sheet => sheet.id === mergedMaster.id)
  return hasMaster
    ? remaining.map(sheet => sheet.id === mergedMaster.id ? mergedMaster : sheet)
    : [mergedMaster, ...remaining]
}

function seedCoreSheets() {
  return BEYOND_WELLNESS_SHEET_TEMPLATES.map(makeTemplateSheet)
}

function lsGetWithSeed() {
  const existing = lsGet()
  if (existing.length || localStorage.getItem(LS_CORE_SEEDED_KEY) === '1') {
    const merged = mergeInventoryIntoMasterSheets(existing)
    if (sheetListChanged(existing, merged)) lsSet(merged)
    return merged
  }
  const seeded = seedCoreSheets()
  lsSet(seeded)
  localStorage.setItem(LS_CORE_SEEDED_KEY, '1')
  return mergeInventoryIntoMasterSheets(seeded)
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
  let columns = Array.isArray(sheet.columns) && sheet.columns.length ? sheet.columns : defaultColumns()
  if (sheet.name === MASTER_SOURCING_SHEET_NAME) {
    const existing = new Set(columns.map(col => col.name))
    const missing = MASTER_SOURCING_COLUMNS
      .filter(name => !existing.has(name))
      .map(name => ({ id: uid(), name }))
    columns = [...columns, ...missing]
  } else if (sheet.name === LEGACY_INVENTORY_SHEET_NAME) {
    const existing = new Set(columns.map(col => col.name))
    const missing = LEGACY_INVENTORY_COLUMNS
      .filter(name => !existing.has(name))
      .map(name => ({ id: uid(), name }))
    columns = [...columns, ...missing]
  }
  const rows = Array.isArray(sheet.rows) ? sheet.rows : []
  const storedWrap = columns.find(col => typeof col.sheetWrap === 'boolean')?.sheetWrap
  return normalizeStockCells({
    id: sheet.id || uid(),
    name: sheet.name || 'Untitled Sheet',
    columns,
    rows: rows.map(row => ({
      id: row.id || uid(),
      cells: { ...Object.fromEntries(columns.map(col => [col.id, ''])), ...(row.cells || {}) },
      height: Number.isFinite(Number(row.height)) ? Number(row.height) : null,
    })),
    wrap: typeof sheet.wrap === 'boolean' ? sheet.wrap : storedWrap !== false,
    created_at: sheet.created_at || new Date().toISOString(),
    updated_at: sheet.updated_at || new Date().toISOString(),
  })
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
    let migrated = false

    async function loadAll() {
      const { data, error } = await supabase
        .from('sheets')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })

      if (cancelled) return

      if (error) {
        // Table missing or RLS error — fall back to localStorage
        setCloudDisabled(true)
        setSheets(lsGetWithSeed())
        setLoading(false)
        return
      }

      // Supabase is reachable. If cloud is empty on first load, migrate localStorage → Supabase
      if ((data || []).length === 0 && !migrated) {
        migrated = true
        const local = lsGet()
        const toMigrate = local.length > 0 ? local.map(normalizeSheet) : seedCoreSheets()
        // Push everything up in parallel
        const results = await Promise.all(toMigrate.map(s =>
          supabase.from('sheets').insert({
            id: s.id, user_id: userId,
            name: s.name, columns: s.columns, rows: s.rows,
            updated_at: s.updated_at || new Date().toISOString(),
            created_at: s.created_at || new Date().toISOString(),
          }).select()
        ))
        const failed = results.find(result => result.error)
        if (failed) {
          setCloudDisabled(true)
          lsSet(toMigrate)
          if (!cancelled) setSheets(mergeInventoryIntoMasterSheets(toMigrate))
          if (!cancelled) setLoading(false)
          return
        }
        if (!cancelled) {
          setSheets(mergeInventoryIntoMasterSheets(toMigrate))
          lsSet(toMigrate)
        }
      } else {
        const raw = data || []
        const merged = mergeInventoryIntoMasterSheets(raw)
        if (!cancelled) setSheets(merged)

        const inventoryIds = raw.filter(sheet => sheet.name === LEGACY_INVENTORY_SHEET_NAME).map(sheet => sheet.id).filter(Boolean)
        const mergedMaster = merged.find(sheet => sheet.name === MASTER_SOURCING_SHEET_NAME)
        if (inventoryIds.length && mergedMaster) {
          const { error: upsertError } = await supabase
            .from('sheets')
            .upsert({
              id: mergedMaster.id,
              user_id: userId,
              name: mergedMaster.name,
              columns: mergedMaster.columns,
              rows: mergedMaster.rows,
              updated_at: mergedMaster.updated_at || new Date().toISOString(),
              created_at: mergedMaster.created_at || new Date().toISOString(),
            }, { onConflict: 'id' })

          if (!upsertError) {
            await supabase
              .from('sheets')
              .delete()
              .eq('user_id', userId)
              .in('id', inventoryIds)
          }
        }
      }

      if (!cancelled) setLoading(false)
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
