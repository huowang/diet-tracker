import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://srobsioswbvfnenbqmfp.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_FJxOB_ngXcrFZC_Yz3eoTA_jLG__F7s'

export const supabase = createClient(supabaseUrl, supabaseKey)
