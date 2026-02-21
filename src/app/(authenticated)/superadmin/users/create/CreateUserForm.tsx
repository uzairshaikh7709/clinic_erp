'use client'

import { useState } from 'react'
import { Loader2, ArrowLeft, UserPlus } from 'lucide-react'
import Link from 'next/link'

export default function CreateUserForm({ doctors, organizations }: { doctors: any[]; organizations: any[] }) {
    const [role, setRole] = useState('doctor')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const form = e.currentTarget
        setLoading(true)
        setError('')
        setMessage('')
        const formData = new FormData(form)

        const { createUser } = await import('./actions')
        const result = await createUser(formData)
        setLoading(false)

        if (result.error) {
            setError(result.error)
        } else {
            setMessage('User created successfully.')
            form.reset()
            setRole('doctor')
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-enter">
            <div className="flex items-center gap-3 sm:gap-4">
                <Link href="/superadmin/users" className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors flex-shrink-0">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Register New User</h1>
                    <p className="text-slate-500 text-sm">Create a new account for a doctor, assistant, or admin</p>
                </div>
            </div>

            {message && (
                <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 p-3 sm:p-4 rounded-lg text-sm">
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    {message}
                </div>
            )}
            {error && (
                <div className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 p-3 sm:p-4 rounded-lg text-sm">
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="card">
                <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center gap-2">
                    <UserPlus size={18} className="text-slate-400" />
                    <h2 className="font-bold text-slate-800">Account Details</h2>
                </div>
                <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="label">Full Name</label>
                            <input name="full_name" required className="input" placeholder="Dr. John Smith" />
                        </div>
                        <div>
                            <label className="label">Email</label>
                            <input name="email" type="email" required className="input" placeholder="john@example.com" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="label">Password</label>
                            <input name="password" type="password" required className="input" placeholder="Min 6 characters" />
                        </div>
                        <div>
                            <label className="label">Role</label>
                            <select
                                name="role"
                                className="select"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                            >
                                <option value="doctor">Doctor</option>
                                <option value="assistant">Assistant</option>
                                <option value="superadmin">Superadmin</option>
                            </select>
                        </div>
                    </div>

                    {role !== 'superadmin' && (
                        <div>
                            <label className="label">Organization</label>
                            <select name="clinic_id" className="select" required>
                                <option value="">Select Organization...</option>
                                {organizations.map(org => (
                                    <option key={org.id} value={org.id}>{org.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {role === 'doctor' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="label">Registration Number</label>
                                <input name="registration_number" required className="input" placeholder="e.g. MED-12345" />
                            </div>
                            <div>
                                <label className="label">Specialization</label>
                                <input name="specialization" required className="input" placeholder="e.g. Orthopedics" />
                            </div>
                        </div>
                    )}

                    {role === 'assistant' && (
                        <div>
                            <label className="label">Assign to Doctor</label>
                            <select name="assigned_doctor_id" className="select" required>
                                <option value="">Select Doctor...</option>
                                {doctors.map(d => (
                                    <option key={d.id} value={d.id}>{d.profiles?.full_name} ({d.specialization})</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="pt-2">
                        <button disabled={loading} className="btn btn-primary w-full sm:w-auto min-w-[180px] justify-center">
                            {loading ? <><Loader2 size={16} className="animate-spin mr-2" /> Creating...</> : 'Create Account'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    )
}
