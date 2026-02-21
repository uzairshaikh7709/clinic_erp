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

    // Use getSession() instead of getUser() — reads JWT from cookie locally
    // without making a network round-trip to Supabase auth servers.
    // Actual token validation happens in getUserProfile() on the server component.
    const {
        data: { session },
    } = await supabase.auth.getSession()

    const path = request.nextUrl.pathname

    // Public Routes
    if (path === '/' || path.startsWith('/login') || path.startsWith('/auth') || path.startsWith('/book-online')
        || path.startsWith('/clinic') || path.startsWith('/privacy-policy') || path.startsWith('/terms')
        || path.startsWith('/contact') || path.startsWith('/reset-password')) {
        // Redirect logged-in users away from login pages
        // Skip redirect if there's an error param (prevents loop when JWT metadata is stale)
        if (session?.user && !request.nextUrl.searchParams.has('error')
            && (path === '/login' || /^\/clinic\/[^/]+\/login$/.test(path))) {
            const role = session.user.user_metadata.role
            if (role === 'superadmin') return NextResponse.redirect(new URL('/superadmin/dashboard', request.url))
            if (role === 'doctor') return NextResponse.redirect(new URL('/doctor/dashboard', request.url))
            if (role === 'assistant') return NextResponse.redirect(new URL('/assistant/dashboard', request.url))
        }
        return supabaseResponse
    }

    // Auth Check
    if (!session) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // Role Protection via JWT metadata (fast, no DB call)
    const role = session.user.user_metadata.role

    if (!role) return supabaseResponse

    if (path.startsWith('/superadmin') && role !== 'superadmin') {
        return NextResponse.redirect(new URL('/login?error=unauthorized', request.url))
    }
    if (path.startsWith('/doctor') && role !== 'doctor') {
        return NextResponse.redirect(new URL('/login?error=unauthorized', request.url))
    }
    if (path.startsWith('/assistant') && role !== 'assistant') {
        return NextResponse.redirect(new URL('/login?error=unauthorized', request.url))
    }

    return supabaseResponse
}
