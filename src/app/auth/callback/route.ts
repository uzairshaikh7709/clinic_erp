import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const token_hash = searchParams.get('token_hash')
    const type = searchParams.get('type') as 'recovery' | 'email' | 'signup' | null
    const next = searchParams.get('next') ?? '/dashboard'

    const supabase = await createClient()

    // Try code exchange first (PKCE flow)
    if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            return NextResponse.redirect(`${origin}${next}`)
        }
        console.error('Code exchange failed:', error.message)
    }

    // Fallback: try token_hash verification (email link flow)
    if (token_hash && type) {
        const { error } = await supabase.auth.verifyOtp({ token_hash, type })
        if (!error) {
            return NextResponse.redirect(`${origin}${next}`)
        }
        console.error('Token hash verification failed:', error.message)
    }

    return NextResponse.redirect(`${origin}/login?error=auth-code-error`)
}
