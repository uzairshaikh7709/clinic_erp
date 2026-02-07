'use client'

import { useState } from 'react'
import { createUser } from './actions' // We need to move actions up or import correctly
import { Loader2 } from 'lucide-react'

export default function CreateUserForm({ doctors }: { doctors: any[] }) {
    const [role, setRole] = useState('doctor')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        setMessage('')
        const formData = new FormData(e.currentTarget)

        // We import server action from separate file.
        // NOTE: Need to fix import path in real file if structured differently.
        const { createUser } = await import('./actions')

        const result = await createUser(formData)
        setLoading(false)

        if (result.error) {
            setError(result.error)
        } else {
            setMessage('User created successfully.')
            e.currentTarget.reset()
        }
    }

    return (
        <div className="max-w-xl mx-auto space-y-6">
            <h2 className="text-xl font-bold">Register New User</h2>

            {message && <div className="bg-green-100 text-green-700 p-3 rounded">{message}</div>}
            {error && <div className="bg-red-100 text-red-700 p-3 rounded">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4 card">
                <div>
                    <label className="label">Full Name</label>
                    <input name="full_name" required className="input" />
                </div>
                <div>
                    <label className="label">Email</label>
                    <input name="email" type="email" required className="input" />
                </div>
                <div>
                    <label className="label">Password</label>
                    <input name="password" type="password" required className="input" />
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

                {role === 'doctor' && (
                    <>
                        <div>
                            <label className="label">Registration Number</label>
                            <input name="registration_number" required className="input" />
                        </div>
                        <div>
                            <label className="label">Specialization</label>
                            <input name="specialization" required className="input" />
                        </div>
                    </>
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

                <button disabled={loading} className="btn btn-primary w-full">
                    {loading ? <Loader2 className="animate-spin" /> : 'Create Account'}
                </button>
            </form>
        </div>
    )
}
