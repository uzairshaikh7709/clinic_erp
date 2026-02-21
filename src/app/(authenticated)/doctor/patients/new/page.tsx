'use client'

import { useState } from 'react'
import { registerPatient } from '../actions'
import { useRouter } from 'next/navigation'
import { User, Calendar, MapPin, Phone, Save, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewPatientPage() {
    const router = useRouter()

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        full_name: '',
        dob: '',
        gender: 'Male',
        phone: '',
        address: ''
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const payload = new FormData()
            payload.append('full_name', formData.full_name)
            payload.append('dob', formData.dob)
            payload.append('gender', formData.gender)
            payload.append('address', formData.address)
            payload.append('phone', formData.phone)

            const result = await registerPatient(null, payload)

            if (result?.error) throw new Error(result.error)

            router.push(`/doctor/patients`)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-enter">
            <div className="flex items-center gap-3 sm:gap-4">
                <Link href="/doctor/patients" className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors flex-shrink-0">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Register New Patient</h1>
                    <p className="text-slate-500 text-sm">Create a new patient record</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 sm:p-8 space-y-5 sm:space-y-6">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                required
                                type="text"
                                className="input pl-10 w-full"
                                placeholder="John Doe"
                                value={formData.full_name}
                                onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Gender</label>
                        <select
                            className="input w-full"
                            value={formData.gender}
                            onChange={e => setFormData({ ...formData, gender: e.target.value })}
                        >
                            <option>Male</option>
                            <option>Female</option>
                            <option>Other</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Date of Birth</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                required
                                type="date"
                                className="input pl-10 w-full"
                                value={formData.dob}
                                onChange={e => setFormData({ ...formData, dob: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Phone Number</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="tel"
                                className="input pl-10 w-full"
                                placeholder="+1 234 567 890"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Address</label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-3 text-slate-400" size={18} />
                        <textarea
                            className="input pl-10 w-full min-h-[100px] py-3"
                            placeholder="Street address, City..."
                            value={formData.address}
                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                        ></textarea>
                    </div>
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}

                <div className="pt-4 flex justify-end">
                    <button type="submit" disabled={loading} className="btn btn-primary w-full sm:w-auto min-w-[150px] justify-center">
                        {loading ? 'Saving...' : <><Save size={18} className="mr-2" /> Register Patient</>}
                    </button>
                </div>

            </form>
        </div>
    )
}
