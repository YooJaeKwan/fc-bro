
import { createClient } from '@supabase/supabase-js'

// Build time check needed because Next.js tries to run this during build
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NODE_ENV !== 'production') {
    console.warn('Supabase environment variables are missing. Some features may not work.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
