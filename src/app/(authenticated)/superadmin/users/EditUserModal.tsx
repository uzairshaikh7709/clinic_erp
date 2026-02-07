'use client'

import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { updateUser } from './actions'

export default function EditUserModal({ user, onClose }: { user: any; onClose: () => void }) {
    const [loading, setLoading] = useState(false)
    const [fullName, setFullName] = useState(user.full_name || '')
    const [isActive, setIsActive] = useState(user.is_active)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData()
        formData.append('user_id', user.id)
        formData.append('full_name', fullName)
        formData.append('is_active', isActive.toString())

        const result = await updateUser(formData)

        if (result.error) {
            alert('Error: ' + result.error)
        } else {
            alert('User updated successfully!')
            onClose()
        }

        setLoading(false)
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                    <h2 className="text-xl font-bold text-slate-800">Edit User</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg cursor-pointer">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="label">Full Name</label>
                        <input
                            type="text"
                            className="input"
                            value={fullName}
                            onChange={e => setFullName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="label">Email</label>
                        <input
                            type="email"
                            className="input bg-slate-50"
                            value={user.email}
                            disabled
                        />
                        <p className="text-xs text-slate-500">Email cannot be changed</p>
                    </div>

                    <div className="space-y-2">
                        <label className="label">Role</label>
                        <input
                            type="text"
                            className="input bg-slate-50 capitalize"
                            value={user.role}
                            disabled
                        />
                        <p className="text-xs text-slate-500">Role cannot be changed</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="isActive"
                            checked={isActive}
                            onChange={e => setIsActive(e.target.checked)}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        <label htmlFor="isActive" className="text-sm font-medium text-slate-700 cursor-pointer">
                            Account is active
                        </label>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn btn-ghost flex-1"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary flex-1"
                            disabled={loading}
                        >
                            {loading ? <><Loader2 className="animate-spin mr-2" size={16} /> Saving...</> : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
