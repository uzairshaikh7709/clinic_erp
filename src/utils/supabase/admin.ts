import { createClient } from '@supabase/supabase-js'
import { cache } from 'react'

// Cached admin client - reused within a single request to avoid redundant instantiations
export const createAdminClient = cache(() => {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )
})
