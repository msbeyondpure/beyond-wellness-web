import { useCallback, useEffect, useRef, useState } from 'react'
import { useUser } from './hooks/useUser'
import Auth from './views/Auth'
import Tasks from './views/Tasks'
import Formulas from './views/Formulas'
import Affiliates from './views/Affiliates'
import Sheets from './views/Sheets'
import Editor from './views/Editor'
import Layout from './components/Layout'
import LoadingScreen from './components/LoadingScreen'

export default function App() {
  const { user, loading } = useUser()
  const [activeView, setActiveView] = useState('tasks')
  const [taskStats, setTaskStats] = useState(null)
  const [resetKeys, setResetKeys] = useState({ tasks: 0, formulas: 0, affiliates: 0, sheets: 0, editor: 0 })

  // Global undo/redo - any view can register its handlers here.
  const undoRef = useRef(null)
  const redoRef = useRef(null)

  const registerUndo = useCallback((undoFn, redoFn) => {
    undoRef.current = undoFn
    redoRef.current = redoFn
  }, [])

  const handleUndo = () => undoRef.current?.()
  const handleRedo = () => redoRef.current?.()

  useEffect(() => {
    function onKeyDown(e) {
      const isEditing = ['INPUT', 'TEXTAREA'].includes(e.target.tagName) || e.target.isContentEditable
      if (isEditing) return
      const ctrl = e.ctrlKey || e.metaKey
      if (!ctrl) return
      const key = e.key.toLowerCase()
      if (key === 'z' && !e.shiftKey) { e.preventDefault(); undoRef.current?.() }
      if ((key === 'z' && e.shiftKey) || key === 'y') { e.preventDefault(); redoRef.current?.() }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  const handleTabPress = (view) => {
    if (view === activeView) {
      setResetKeys(keys => ({ ...keys, [view]: keys[view] + 1 }))
      return
    }

    setActiveView(view)
    undoRef.current = null
    redoRef.current = null
  }

  const renderView = () => {
    switch (activeView) {
      case 'formulas':
        return <Formulas userId={user.id} resetKey={resetKeys.formulas} registerUndo={registerUndo} />
      case 'affiliates':
        return <Affiliates userId={user.id} resetKey={resetKeys.affiliates} />
      case 'sheets':
        return <Sheets userId={user.id} resetKey={resetKeys.sheets} registerUndo={registerUndo} />
      case 'editor':
        return <Editor userId={user.id} resetKey={resetKeys.editor} registerUndo={registerUndo} />
      case 'tasks':
      default:
        return <Tasks userId={user.id} onStatsChange={setTaskStats} resetKey={resetKeys.tasks} />
    }
  }

  if (loading) return <LoadingScreen />
  if (!user) return <Auth />

  return (
    <Layout
      user={user}
      activeView={activeView}
      setActiveView={handleTabPress}
      taskStats={taskStats}
      onUndo={handleUndo}
      onRedo={handleRedo}
    >
      {renderView()}
    </Layout>
  )
}
