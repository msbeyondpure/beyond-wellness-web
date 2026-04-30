import { createElement, useCallback, useEffect, useMemo, useRef, useState } from 'react'

const EDITABLE_SELECTOR = 'input, textarea, select, button, a, [contenteditable="true"], [data-selection-ignore="true"]'
const defaultGetId = item => item.id

export function isEditingTarget(target) {
  return Boolean(target?.closest?.(EDITABLE_SELECTOR))
}

export function selectedArray(items, selectedIds, getId = defaultGetId) {
  const selected = selectedIds instanceof Set ? selectedIds : new Set(selectedIds || [])
  return items.filter(item => selected.has(getId(item)))
}

export function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text)
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  textarea.remove()
  return Promise.resolve()
}

function rectsIntersect(a, b) {
  return a.left <= b.right && a.right >= b.left && a.top <= b.bottom && a.bottom >= b.top
}

function rangeIds(items, getId, startId, endId) {
  const start = items.findIndex(item => getId(item) === startId)
  const end = items.findIndex(item => getId(item) === endId)
  if (start < 0 || end < 0) return [endId]
  const [from, to] = start < end ? [start, end] : [end, start]
  return items.slice(from, to + 1).map(getId)
}

export function useMultiSelection(items, options = {}) {
  const getId = options.getId || defaultGetId
  const enabled = options.enabled !== false
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const [box, setBox] = useState(null)
  const containerRef = useRef(null)
  const itemRefs = useRef(new Map())
  const itemsRef = useRef(items)
  const selectedRef = useRef(selectedIds)
  const lastSelectedRef = useRef(null)
  const suppressClickRef = useRef(false)

  useEffect(() => { itemsRef.current = items }, [items])
  useEffect(() => { selectedRef.current = selectedIds }, [selectedIds])
  useEffect(() => {
    const valid = new Set(items.map(getId))
    setSelectedIds(prev => {
      const next = new Set([...prev].filter(id => valid.has(id)))
      return next.size === prev.size ? prev : next
    })
  }, [items, getId])

  const selectedItems = useMemo(() => selectedArray(items, selectedIds, getId), [items, selectedIds, getId])
  const selectedCount = selectedIds.size

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
    lastSelectedRef.current = null
  }, [])

  const selectAll = useCallback((sourceItems = itemsRef.current) => {
    const ids = sourceItems.map(getId)
    setSelectedIds(new Set(ids))
    lastSelectedRef.current = ids[ids.length - 1] || null
  }, [getId])

  const setSelected = useCallback((ids) => {
    const next = new Set(ids)
    setSelectedIds(next)
    lastSelectedRef.current = [...next].at(-1) || null
  }, [])

  const toggleId = useCallback((id) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    lastSelectedRef.current = id
  }, [])

  const itemRef = useCallback((id) => (node) => {
    if (node) {
      const nodes = itemRefs.current.get(id) || new Set()
      nodes.add(node)
      itemRefs.current.set(id, nodes)
    } else {
      itemRefs.current.delete(id)
    }
  }, [])

  const handleItemClick = useCallback((event, item, plainClick) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false
      event.preventDefault()
      event.stopPropagation()
      return true
    }
    if (!enabled) return false
    const id = getId(item)
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault()
      event.stopPropagation()
      toggleId(id)
      return true
    }
    if (event.shiftKey) {
      event.preventDefault()
      event.stopPropagation()
      const ids = rangeIds(itemsRef.current, getId, lastSelectedRef.current || id, id)
      setSelectedIds(new Set(ids))
      lastSelectedRef.current = id
      return true
    }
    if (selectedRef.current.size) clearSelection()
    plainClick?.(event)
    return false
  }, [clearSelection, enabled, getId, toggleId])

  const handleSurfaceMouseDown = useCallback((event) => {
    if (!enabled || event.button !== 0 || isEditingTarget(event.target)) return
    if (event.target.closest?.('[data-selection-ignore="true"]')) return
    const container = containerRef.current
    if (!container) return
    const startX = event.clientX
    const startY = event.clientY
    const additive = event.ctrlKey || event.metaKey
    const base = additive ? new Set(selectedRef.current) : new Set()
    let active = false

    const update = (moveEvent) => {
      const dx = Math.abs(moveEvent.clientX - startX)
      const dy = Math.abs(moveEvent.clientY - startY)
      if (!active && dx < 4 && dy < 4) return
      if (!active) {
        active = true
        suppressClickRef.current = true
      }
      const containerRect = container.getBoundingClientRect()
      const left = Math.min(startX, moveEvent.clientX)
      const top = Math.min(startY, moveEvent.clientY)
      const right = Math.max(startX, moveEvent.clientX)
      const bottom = Math.max(startY, moveEvent.clientY)
      const selectionRect = { left, top, right, bottom }
      const ids = new Set(base)
      itemRefs.current.forEach((nodes, id) => {
        for (const node of nodes) {
          if (!node.isConnected || !node.getClientRects().length) continue
          if (rectsIntersect(selectionRect, node.getBoundingClientRect())) {
            ids.add(id)
            break
          }
        }
      })
      setSelectedIds(ids)
      setBox({
        left: left - containerRect.left + container.scrollLeft,
        top: top - containerRect.top + container.scrollTop,
        width: right - left,
        height: bottom - top,
      })
    }

    const finish = () => {
      document.removeEventListener('mousemove', update)
      document.removeEventListener('mouseup', finish)
      if (active) {
        lastSelectedRef.current = [...selectedRef.current].at(-1) || null
        window.setTimeout(() => { suppressClickRef.current = false }, 0)
      }
      setBox(null)
    }

    document.addEventListener('mousemove', update)
    document.addEventListener('mouseup', finish)
  }, [enabled])

  const selectionBox = box ? createElement('div', {
    className: 'pointer-events-none absolute z-40 rounded border border-brand-accent/70 bg-brand-accent/10',
    style: box,
  }) : null

  return {
    selectedIds,
    selectedItems,
    selectedCount,
    clearSelection,
    selectAll,
    setSelected,
    toggleId,
    itemRef,
    handleItemClick,
    handleSurfaceMouseDown,
    containerRef,
    selectionBox,
    isSelected: id => selectedIds.has(id),
  }
}
