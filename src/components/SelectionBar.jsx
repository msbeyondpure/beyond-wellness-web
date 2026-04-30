/* eslint-disable react/prop-types */
import { createPortal } from 'react-dom'

export default function SelectionBar({ count, label, actions = [], onClear }) {
  if (!count) return null
  const bar = (
    <div className="fixed left-3 right-3 bottom-[calc(env(safe-area-inset-bottom)+5rem)] sm:left-1/2 sm:right-auto sm:bottom-5 sm:-translate-x-1/2 sm:w-[min(760px,calc(100vw-2rem))] z-[80] rounded border border-brand-accent/35 bg-[#181512]/95 shadow-2xl shadow-black/40 backdrop-blur px-3 py-2 flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-white mr-auto">{count} {label}{count === 1 ? '' : 's'} selected</span>
      {actions.map(action => (
        <button
          key={action.label}
          onClick={action.onClick}
          disabled={action.disabled}
          className={`px-2.5 py-1.5 rounded text-xs transition-all disabled:opacity-35 disabled:cursor-not-allowed ${
            action.danger
              ? 'bg-red-500/15 text-red-300 hover:bg-red-500/25'
              : 'bg-white/10 text-gray-200 hover:bg-white/15'
          }`}
        >
          {action.label}
        </button>
      ))}
      <button onClick={onClear} className="px-2.5 py-1.5 rounded text-xs text-gray-400 hover:text-white hover:bg-white/10">
        Clear
      </button>
    </div>
  )
  return createPortal(bar, document.body)
}
