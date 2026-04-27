import { useState } from 'react'
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

  if (loading) return <LoadingScreen />
  if (!user) return <Auth />

  // Tapping the active tab resets it; tapping a different tab switches to it
  const handleTabPress = (v) => {
    if (v === activeView) {
      setResetKeys(k => ({ ...k, [v]: k[v] + 1 }))
    } else {
      setActiveView(v)
    }
  }

  const activeContent = {
    tasks: <Tasks userId={user.id} onStatsChange={setTaskStats} resetKey={resetKeys.tasks} />,
    formulas: <Formulas userId={user.id} resetKey={resetKeys.formulas} />,
    affiliates: <Affiliates userId={user.id} resetKey={resetKeys.affiliates} />,
    sheets: <Sheets userId={user.id} resetKey={resetKeys.sheets} />,
    editor: <Editor userId={user.id} resetKey={resetKeys.editor} />,
  }[activeView]

  return (
    <Layout user={user} activeView={activeView} setActiveView={handleTabPress} taskStats={taskStats}>
      {activeContent}
    </Layout>
  )
}
