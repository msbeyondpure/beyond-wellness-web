import { useState } from 'react'
import { useUser } from './hooks/useUser'
import Auth from './views/Auth'
import Tasks from './views/Tasks'
import Formulas from './views/Formulas'
import Affiliates from './views/Affiliates'
import Editor from './views/Editor'
import Layout from './components/Layout'
import LoadingScreen from './components/LoadingScreen'

export default function App() {
  const { user, loading } = useUser()
  const [activeView, setActiveView] = useState('tasks')
  const [taskStats, setTaskStats] = useState(null)

  if (loading) return <LoadingScreen />
  if (!user) return <Auth />

  const views = {
    tasks: <Tasks userId={user.id} onStatsChange={setTaskStats} />,
    formulas: <Formulas userId={user.id} />,
    affiliates: <Affiliates userId={user.id} />,
    editor: <Editor userId={user.id} />,
  }

  return (
    <Layout user={user} activeView={activeView} setActiveView={setActiveView} taskStats={taskStats}>
      {views[activeView]}
    </Layout>
  )
}
