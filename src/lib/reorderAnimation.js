export function rememberLayoutNode(ref, id, node) {
  if (!id) return
  if (node) ref.current.set(id, node)
  else ref.current.delete(id)
}

function captureRects(ref) {
  return new Map([...ref.current.entries()].map(([id, node]) => [id, node.getBoundingClientRect()]))
}

export function animateLayoutShift(ref, update) {
  const before = captureRects(ref)
  update()
  requestAnimationFrame(() => {
    ref.current.forEach((node, id) => {
      const first = before.get(id)
      if (!first) return
      const last = node.getBoundingClientRect()
      const dx = first.left - last.left
      const dy = first.top - last.top
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return
      node.style.transition = 'none'
      node.style.transform = `translate(${dx}px, ${dy}px)`
      node.style.willChange = 'transform'
      requestAnimationFrame(() => {
        node.style.transition = 'transform 150ms ease'
        node.style.transform = ''
        window.setTimeout(() => {
          node.style.transition = ''
          node.style.willChange = ''
        }, 170)
      })
    })
  })
}
