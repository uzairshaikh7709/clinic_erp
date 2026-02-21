import { requireRole } from '@/utils/auth'
import { createAdminClient } from '@/utils/supabase/admin'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import PatientList from './PatientList'

export default async function PatientsPage() {
    const profile = await requireRole(['doctor'])
    const clinicId = profile.clinic_id!
    const doctorId = profile.doctor_id!
    const admin = createAdminClient()

    if (!doctorId) return <div>Doctor profile not found.</div>

    // Fetch all clinic patients + visit stats in parallel
    const [{ data: allPatients }, { data: appts }, { data: rx }, { data: apptTypes }] = await Promise.all([
        admin
            .from('patients')
            .select('id, full_name, dob, gender, phone, address, registration_number, created_at')
            .eq('clinic_id', clinicId)
            .order('created_at', { ascending: false }),
        admin
            .from('appointments')
            .select('patient_id')
            .eq('doctor_id', doctorId)
            .eq('clinic_id', clinicId),
        admin
            .from('prescriptions')
            .select('patient_id, created_at')
            .eq('doctor_id', doctorId)
            .eq('clinic_id', clinicId)
            .order('created_at', { ascending: false }),
        admin
            .from('appointments')
            .select('patient_id, appointment_type')
            .eq('doctor_id', doctorId)
            .eq('clinic_id', clinicId),
    ])

    // Build stats map
    const statsMap: Record<string, { visitCount: number; lastVisitDate: string | null; appointmentTypes: string[] }> = {}
    const visitData = rx || []
    const apptData = apptTypes || []

    for (const p of allPatients || []) {
        const pVisits = visitData.filter(v => v.patient_id === p.id)
        const pAppts = apptData.filter(a => a.patient_id === p.id)
        const types = Array.from(new Set(pAppts.map(a => a.appointment_type).filter(Boolean)))
        statsMap[p.id] = {
            visitCount: pVisits.length,
            lastVisitDate: pVisits.length > 0 ? pVisits[0].created_at : null,
            appointmentTypes: types,
        }
    }

    const patients = (allPatients || []).map(p => ({
        ...p,
        visit_count: statsMap[p.id]?.visitCount || 0,
        last_visit_date: statsMap[p.id]?.lastVisitDate || null,
        appointment_types: statsMap[p.id]?.appointmentTypes || [],
    }))

    return (
        <div className="space-y-6 animate-enter">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800">My Patients</h1>
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
