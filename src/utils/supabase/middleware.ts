import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        request.cookies.set(name, value)
                        supabaseResponse.cookies.set(name, value, options)
                    })
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    const path = request.nextUrl.pathname

    // Public Routes
    if (path === '/' || path.startsWith('/login') || path.startsWith('/auth') || path.startsWith('/book-online')
        || path.startsWith('/clinic') || path.startsWith('/privacy-policy') || path.startsWith('/terms')
        || path.startsWith('/contact') || path.startsWith('/reset-password')) {
        // Redirect logged-in users away from login pages (and homepage for org staff)
        // Skip redirect if there's an error param (prevents loop when JWT metadata is stale)
        if (user && !request.nextUrl.searchParams.has('error')) {
            const role = user.user_metadata.role
            const isOrgStaff = user.user_metadata.clinic_id && (role === 'doctor' || role === 'assistant')
            const isLoginPage = path === '/login' || /^\/clinic\/[^/]+\/login$/.test(path)

            // Org staff should not access the main site homepage or login pages
            if (isLoginPage || (path === '/' && isOrgStaff)) {
                if (role === 'superadmin') return NextResponse.redirect(new URL('/superadmin/dashboard', request.url))
                if (role === 'doctor') return NextResponse.redirect(new URL('/doctor/dashboard', request.url))
                if (role === 'assistant') return NextResponse.redirect(new URL('/assistant/dashboard', request.url))
            }
        }
        return supabaseResponse
    }

    // Helper: build login redirect URL based on JWT metadata
    const getLoginUrl = (u?: { user_metadata?: Record<string, any> } | null, error?: string) => {
        const meta = u?.user_metadata
        const slug = meta?.clinic_slug
        if (slug && (meta?.role === 'doctor' || meta?.role === 'assistant')) {
            const base = `/clinic/${slug}/login`
            return error ? `${base}?error=${error}` : base
        }
        return error ? `/login?error=${error}` : '/login'
    }

    // Auth Check
    if (!user) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // Role Protection via verified user metadata
    const role = user.user_metadata.role

    if (!role) return supabaseResponse

    if (path.startsWith('/superadmin') && role !== 'superadmin') {
        return NextResponse.redirect(new URL(getLoginUrl(user, 'unauthorized'), request.url))
    }
    if (path.startsWith('/doctor') && role !== 'doctor') {
        return NextResponse.redirect(new URL(getLoginUrl(user, 'unauthorized'), request.url))
    }
    if (path.startsWith('/assistant') && role !== 'assistant') {
        return NextResponse.redirect(new URL(getLoginUrl(user, 'unauthorized'), request.url))
    }

    return supabaseResponse
}
