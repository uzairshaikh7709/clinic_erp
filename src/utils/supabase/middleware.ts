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

    // 1. Protected Routes (e.g. /dashboard) logic?
    // The user wants: /superadmin/*, /doctor/*, /assistant/*

    const path = request.nextUrl.pathname

    // Public Routes
    if (path === '/' || path.startsWith('/login') || path.startsWith('/auth') || path.startsWith('/book-online')) {
        if (user && path === '/login') {
            // If user is logged in and hits login, redirect to their dashboard
            // We need to know their role. This requires a DB fetch?
            // Storing role in metadata is faster for middleware!
            // Let's assume metadata has role, but verify with DB if critical. 
            // For Redirect convenience, metadata is okay.
            const role = user.user_metadata.role
            if (role === 'superadmin') return NextResponse.redirect(new URL('/superadmin/dashboard', request.url))
            if (role === 'doctor') return NextResponse.redirect(new URL('/doctor/dashboard', request.url))
            if (role === 'assistant') return NextResponse.redirect(new URL('/assistant/dashboard', request.url))
        }
        return supabaseResponse
    }

    // Auth Check
    if (!user) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // Role Protection
    // We should ideally fetch strict role from DB if security is paramount, 
    // but doing a DB call in Middleware on every navigation is expensive.
    // Strategy: Trust metadata for routing, enforce RLS/ServerComponent checks for data.
    // OR: Cookie-based claim? 
    // Let's use user_metadata which is inside the JWT (fast).
    const role = user.user_metadata.role

    // If role is missing from metadata, we can't perform pre-emptive redirection.
    // We let the Server Component's `requireRole` handle it.
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
