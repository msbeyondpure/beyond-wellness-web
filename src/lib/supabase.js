import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// true only when real credentials are provided
export const isConfigured = Boolean(
  url && key &&
  url !== 'https://your-project.supabase.co' &&
  key !== 'your-anon-key-here'
)

export const supabase = isConfigured
  ? createClient(url, key)
  : null
