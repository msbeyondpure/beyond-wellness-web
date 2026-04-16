import { useState, useEffect } from 'react'
import { supabase, isConfigured } from '../lib/supabase'

const LOCAL_USER = { id: 'local', email: 'local@device' }

export function useUser() {
  const [user, setUser] = useState(isConfigured ? null : LOCAL_USER)
  const [loading, setLoading] = useState(isConfigured)

  useEffect(() => {
    if (!isConfigured) return

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  return { user, loading }
}
