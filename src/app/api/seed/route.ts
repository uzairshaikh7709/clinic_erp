import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const DEFAULT_CLINIC_ID = '00000000-0000-0000-0000-000000000001'

export async function GET() {
    // Block in production — seed endpoint is for development only
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
    }

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const users = [
        { email: 'admin@drease.com', password: 'password123', role: 'superadmin', name: 'System Admin' },
        { email: 'dr.steve@drease.com', password: 'password123', role: 'doctor', name: 'Dr. Steve Rogers', specialization: 'Orthopedic Surgeon', reg: 'DRE-001' },
        { email: 'nurse.sarah@drease.com', password: 'password123', role: 'assistant', name: 'Sarah Connor', assigned_email: 'dr.steve@drease.com' }
    ]

    const results = []

    for (const u of users) {
        // 1. Create Auth User
        const { data: auth, error: createError } = await supabase.auth.admin.createUser({
            email: u.email,
            password: u.password,
            email_confirm: true,
            user_metadata: { role: u.role }
        })

        if (createError) {
            results.push({ email: u.email, status: 'Failed: ' + createError.message })
            continue
        }

        if (!auth.user) continue

        // 2. Create Profile
        const { error: profileError } = await supabase.from('profiles').upsert({
            id: auth.user.id,
            email: u.email,
            role: u.role,
            full_name: u.name,
            is_active: true,
            clinic_id: DEFAULT_CLINIC_ID
        })

        if (profileError) {
            results.push({ email: u.email, status: 'Profile Failed: ' + profileError.message })
            continue
        }

        // 3. Create Role Specific Entry
        if (u.role === 'doctor') {
            await supabase.from('doctors').insert({
                profile_id: auth.user.id,
                specialization: u.specialization,
                registration_number: u.reg,
                clinic_id: DEFAULT_CLINIC_ID
            })
        } else if (u.role === 'assistant') {
            // Find doctor to assign
            const { data: dr } = await supabase.from('profiles').select('id').eq('email', u.assigned_email).single()
            if (dr) {
                const { data: drRecord } = await supabase.from('doctors').select('id').eq('profile_id', dr.id).single()
                if (drRecord) {
                    await supabase.from('assistants').insert({
                        profile_id: auth.user.id,
                        assigned_doctor_id: drRecord.id,
                        clinic_id: DEFAULT_CLINIC_ID
                    })
                }
            }
        }

        results.push({ email: u.email, status: 'Created' })
    }

    return NextResponse.json(results)
}
