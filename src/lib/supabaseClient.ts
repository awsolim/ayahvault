// src/lib/supabaseClient.ts

import { createClient } from '@supabase/supabase-js'

// ← Pull in your URL and key from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// ← Initialize and export a singleton client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
