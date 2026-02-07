import { createAdminClient } from '@/utils/supabase/admin'
import Link from 'next/link'
import { Calendar, Clock, User, CheckCircle, ChevronRight, Stethoscope } from 'lucide-react'
import { redirect } from 'next/navigation'

export default async function BookingPage({ searchParams }: { searchParams: Promise<{ doctorId?: string; date?: string; success?: string }> }) {
    const resolvedSearchParams = await searchParams
    const admin = createAdminClient()
    const supabase = admin

    // Check Auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Get user profile
    const { data: profile } = await admin
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()

    const userFullName = profile?.full_name || 'Guest'

    // 1. Fetch Doctors
    const { data: doctors } = await admin
        .from('doctors')
        .select(`
            id,
            specialization,
            registration_number,
            profiles (full_name)
        `)

    const selectedDoctorId = resolvedSearchParams.doctorId
    const isSuccess = resolvedSearchParams.success === 'true'

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            <div className="text-center max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold text-slate-900">Book an Appointment</h1>
                <p className="text-slate-500 mt-2">Select a specialist and find a time that works for you.</p>
            </div>

            {isSuccess ? (
                <div className="p-8 bg-emerald-50 border border-emerald-100 rounded-2xl text-center max-w-md mx-auto">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-emerald-800 mb-2">Booking Confirmed!</h2>
                    <p className="text-emerald-600 mb-6">Your appointment has been scheduled successfully.</p>
                    <Link href="/dashboard" className="btn btn-primary w-full justify-center">
                        Go to Dashboard
                    </Link>
                </div>
            ) : (
                <div className="grid md:grid-cols-12 gap-8">

                    {/* Doctor Selection */}
                    <div className="md:col-span-4 space-y-4">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-100 text-[#0077B6] flex items-center justify-center text-xs">1</div>
                            Select Doctor
                        </h3>
                        <div className="space-y-3">
                            {(doctors || []).map((doc: any) => (
                                <Link
                                    key={doc.id}
                                    href={`/book?doctorId=${doc.id}`}
                                    className={`block p-4 rounded-xl border transition-all ${selectedDoctorId === doc.id ? 'border-[#0077B6] bg-blue-50 ring-1 ring-[#0077B6]' : 'border-slate-200 bg-white hover:border-[#0077B6] hover:shadow-md'}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-[#0077B6]">
                                            <Stethoscope size={20} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900">{doc.profiles?.full_name}</p>
                                            <p className="text-xs text-slate-500">{doc.specialization}</p>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Slot Selection */}
                    <div className="md:col-span-8">
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 min-h-[400px]">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-6">
                                <div className="w-6 h-6 rounded-full bg-blue-100 text-[#0077B6] flex items-center justify-center text-xs">2</div>
                                Available Slots
                            </h3>

                            {!selectedDoctorId ? (
                                <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                                    <User size={48} className="mb-4 opacity-20" />
                                    <p>Please select a doctor to view availability.</p>
                                </div>
                            ) : (
                                <SlotPicker doctorId={selectedDoctorId} userFullName={userFullName} />
                            )}
                        </div>
                    </div>

                </div>
            )}
        </div>
    )
}

// Client Component for Slots to handle Interaction & Booking Action
import SlotPicker from './SlotPicker'
