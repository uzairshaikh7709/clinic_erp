'use client'

import { useState } from 'react'
import { Loader2, ArrowLeft, Building2 } from 'lucide-react'
import Link from 'next/link'

export default function CreateOrgForm({ doctors }: { doctors: any[] }) {
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')
    const [name, setName] = useState('')

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const form = e.currentTarget
        setLoading(true)
        setError('')
        setMessage('')

        const formData = new FormData(form)
        const { createOrganization } = await import('./actions')
        const result = await createOrganization(formData)

        setLoading(false)
        if (result.error) {
            setError(result.error)
        } else {
            setMessage('Organization created successfully.')
            form.reset()
            setName('')
        }
    }

    const generateSlug = (value: string) => {
        return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-enter">
            <div className="flex items-center gap-3 sm:gap-4">
                <Link href="/superadmin/organizations" className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors flex-shrink-0">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Create New Organization</h1>
                    <p className="text-slate-500 text-sm">Set up a new clinic or practice</p>
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
                    <Building2 size={18} className="text-slate-400" />
                    <h2 className="font-bold text-slate-800">Organization Details</h2>
                </div>
                <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
                    <div>
                        <label className="label">Organization Name</label>
                        <input
                            name="name"
                            required
                            className="input"
                            placeholder="e.g. Downtown Ortho Clinic"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="label">Slug (URL identifier)</label>
                        <input
                            name="slug"
                            required
                            className="input font-mono text-sm"
                            placeholder="e.g. downtown-ortho"
                            defaultValue={generateSlug(name)}
                            key={name}
                        />
                        <p className="text-xs text-slate-400 mt-1">Used in the public booking URL</p>
                    </div>
                    <div>
                        <label className="label">Address</label>
                        <textarea name="address" className="input" rows={2} placeholder="Street address, City, State" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="label">Phone</label>
                            <input name="phone" type="tel" className="input" placeholder="+1 234 567 890" />
                        </div>
                        <div>
                            <label className="label">Email</label>
                            <input name="email" type="email" className="input" placeholder="clinic@example.com" />
                        </div>
                    </div>
                    <div>
                        <label className="label">Owner (Doctor)</label>
                        <select name="owner_profile_id" className="select">
                            <option value="">No owner (assign later)</option>
                            {doctors.map(d => (
                                <option key={d.profile_id} value={d.profile_id}>
                                    {d.profiles?.full_name} ({d.specialization})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="pt-2">
                        <button disabled={loading} className="btn btn-primary w-full sm:w-auto min-w-[180px] justify-center">
                            {loading ? <><Loader2 size={16} className="animate-spin mr-2" /> Creating...</> : 'Create Organization'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    )
}
