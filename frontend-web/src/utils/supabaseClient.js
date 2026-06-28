import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ""
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ""

let supabase = null

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey)
    console.log("Supabase Client initialized successfully.")
  } catch (err) {
    console.error("Supabase connection failed:", err)
  }
} else {
  console.warn("Supabase credentials missing. App running in Local Offline Fallback Mode.")
}

export { supabase }
