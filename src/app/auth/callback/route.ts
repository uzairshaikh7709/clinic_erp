import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function AuthCallbackPage({
    searchParams,
}: {
    searchParams: { code: string; next?: string }
}) {
    const code = searchParams.code
    const next = searchParams.next ?? '/dashboard'

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            return redirect(next)
        }
    }

    return redirect('/login?error=auth-code-error')
}
