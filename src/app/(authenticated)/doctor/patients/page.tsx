import { requireRole } from '@/utils/auth'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import PatientList from './PatientList'

export default async function PatientsPage() {
    const profile = await requireRole(['doctor'])
    const admin = createAdminClient()

    const { data: doctor } = await admin
        .from('doctors')
        .select('id')
        .eq('profile_id', profile.id)
        .single()

    if (!doctor) return <div>Doctor profile not found.</div>

    // 2. Fetch Patients linked to this doctor via Appointments or Prescriptions
    const { data: appts } = await admin
        .from('appointments')
        .select('patient_id')
        .eq('doctor_id', doctor.id)

    const { data: rx } = await admin
        .from('prescriptions')
        .select('patient_id')
        .eq('doctor_id', doctor.id)

    const patientIds = Array.from(new Set([
        ...(appts?.map(a => a.patient_id) || []),
        ...(rx?.map(r => r.patient_id) || [])
    ]))

    let patients: any[] = []

    if (patientIds.length > 0) {
        const { data: myPatients } = await admin
            .from('patients')
            .select('id, full_name, dob, gender, address, registration_number, created_at')
            .in('id', patientIds)
            .order('created_at', { ascending: false })

        patients = myPatients || []
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">My Patients</h1>
                    <p className="text-slate-500 text-sm">Registry of all treated patients</p>
                </div>
                <Link href="/doctor/patients/new" className="btn btn-primary shadow-lg shadow-blue-500/20">
                    <Plus size={18} className="mr-2" /> Add Patient
                </Link>
            </div>

            <PatientList patients={patients} />
        </div>
    )
}
