import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://gbgbtbzrcsqmyckrcehe.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdiZ2J0YnpyY3NxbXlja3JjZWhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5OTkxNzEsImV4cCI6MjA4ODU3NTE3MX0.RNcfqqFCndPp100NLsr_nZCTJlRmkfQmxmMLPAxoA4Q'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
