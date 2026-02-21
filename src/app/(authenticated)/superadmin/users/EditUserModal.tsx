'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, Loader2, Trash2, Shield, Stethoscope, User, Mail, Building2, KeyRound } from 'lucide-react'
import { updateUser, softDeleteUser, resetUserPassword } from './actions'

export default function EditUserModal({ user, onClose }: { user: any; onClose: () => void }) {
    const [loading, setLoading] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState(false)
    const [showResetPw, setShowResetPw] = useState(false)
    const [newPassword, setNewPassword] = useState('')
    const [resetLoading, setResetLoading] = useState(false)
    const [resetSuccess, setResetSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [fullName, setFullName] = useState(user.full_name || '')
    const [isActive, setIsActive] = useState(user.is_active)
    const backdropRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
        document.addEventListener('keydown', handler)
        return () => document.removeEventListener('keydown', handler)
    }, [onClose])

    useEffect(() => {
        document.body.style.overflow = 'hidden'
        return () => { document.body.style.overflow = '' }
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const formData = new FormData()
        formData.append('user_id', user.id)
        formData.append('full_name', fullName)
        formData.append('is_active', isActive.toString())

        const result = await updateUser(formData)
        if (result.error) setError(result.error)
        else onClose()
        setLoading(false)
    }

    const handleResetPassword = async () => {
        if (!newPassword || newPassword.length < 8) {
            setError('Password must be at least 8 characters')
            return
        }
        setResetLoading(true)
        setError(null)

        const formData = new FormData()
        formData.append('user_id', user.id)
        formData.append('new_password', newPassword)

        const result = await resetUserPassword(formData)
        setResetLoading(false)
        if (result.error) {
            setError(result.error)
        } else {
            setResetSuccess(true)
            setNewPassword('')
            setTimeout(() => { setShowResetPw(false); setResetSuccess(false) }, 2000)
        }
    }

    const handleDelete = async () => {
        setDeleting(true)
        setError(null)

        const formData = new FormData()
        formData.append('user_id', user.id)

        const result = await softDeleteUser(formData)
        if (result.error) { setError(result.error); setDeleting(false) }
        else onClose()
    }

    const roleBadge = user.role === 'doctor'
        ? { icon: Stethoscope, label: 'Doctor', cls: 'bg-blue-50 text-blue-700 border-blue-100' }
        : user.role === 'superadmin'
            ? { icon: Shield, label: 'Admin', cls: 'bg-purple-50 text-purple-700 border-purple-100' }
            : { icon: User, label: 'Assistant', cls: 'bg-slate-50 text-slate-700 border-slate-200' }

    const RoleIcon = roleBadge.icon
    const isProtected = user.email === 'sadik5780@gmail.com' || user.role === 'superadmin'

    return createPortal(
        <div
            ref={backdropRef}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === backdropRef.current) onClose() }}
            style={{ animation: 'fade-in 0.15s ease-out' }}
        >
            <div
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
                style={{ animation: 'slide-up 0.2s ease-out' }}
            >
                {/* Close button */}
                <button onClick={onClose} className="absolute right-3 top-3 p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors z-10">
                    <X size={16} />
                </button>

                {/* Profile header */}
                <div className="relative pt-6 pb-4 px-5 text-center">
                    <div className="w-14 h-14 rounded-full bg-indigo-50 border-2 border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg mx-auto mb-3">
                        {user.full_name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                    </div>
                    <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 mb-2">
                        <Mail size={12} />
                        <span>{user.email}</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${roleBadge.cls}`}>
                            <RoleIcon size={11} /> {roleBadge.label}
                        </span>
                        {user.organizations?.name && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-50 text-slate-500 border border-slate-200">
                                <Building2 size={11} /> {user.organizations.name}
                            </span>
                        )}
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="px-5 pb-4 space-y-3">
                    <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1 block">Full Name</label>
                        <input
                            type="text"
                            className="input h-10 text-sm"
                            value={fullName}
                            onChange={e => setFullName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="flex items-center justify-between py-2.5 px-3 rounded-lg border border-slate-100 bg-slate-50/50">
                        <div className="flex items-center gap-2.5">
                            <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-red-400'}`} />
                            <span className="text-sm font-medium text-slate-700">{isActive ? 'Active' : 'Inactive'}</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => !isProtected && setIsActive(!isActive)}
                            disabled={isProtected}
                            className={`relative w-10 h-[22px] rounded-full transition-colors disabled:opacity-40 ${isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}
                        >
                            <span className={`absolute top-[2px] left-[2px] w-[18px] h-[18px] bg-white rounded-full shadow-sm transition-transform ${isActive ? 'translate-x-[18px]' : 'translate-x-0'}`} />
                        </button>
                    </div>

                    {isProtected && <p className="text-xs text-amber-600 text-center">System admin account is protected and cannot be deactivated.</p>}

                    {error && (
                        <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
                    )}

                    <div className="flex gap-2 pt-1">
                        <button type="button" onClick={onClose} className="btn btn-secondary flex-1 h-9 text-sm" disabled={loading || deleting}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary flex-1 h-9 text-sm" disabled={loading || deleting}>
                            {loading ? <Loader2 className="animate-spin" size={15} /> : 'Save Changes'}
                        </button>
                    </div>
                </form>

                {/* Reset Password */}
                <div className="px-5 py-3 border-t border-slate-100">
                    {!showResetPw ? (
                        <button
                            type="button"
                            onClick={() => setShowResetPw(true)}
                            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-amber-600 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                        >
                            <KeyRound size={13} />
                            Reset Password
                        </button>
                    ) : resetSuccess ? (
                        <p className="text-xs text-center text-emerald-600 font-medium py-2">Password updated successfully!</p>
                    ) : (
                        <div className="space-y-2">
                            <input
                                type="password"
                                placeholder="New password (min 8 chars)"
                                className="input h-8 text-xs w-full"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                minLength={8}
                            />
                            <div className="flex gap-2">
                                <button type="button" onClick={() => { setShowResetPw(false); setNewPassword('') }} className="btn btn-secondary flex-1 h-7 text-xs">
                                    Cancel
                                </button>
                                <button type="button" onClick={handleResetPassword} disabled={resetLoading} className="btn btn-primary flex-1 h-7 text-xs">
                                    {resetLoading ? <Loader2 className="animate-spin" size={12} /> : 'Set Password'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Danger zone - hidden for protected system admin */}
                {!isProtected && <div className="px-5 py-3 border-t border-slate-100">
                    {!confirmDelete ? (
                        <button
                            type="button"
                            onClick={() => setConfirmDelete(true)}
                            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            disabled={loading || deleting}
                        >
                            <Trash2 size={13} />
                            Deactivate & Archive
                        </button>
                    ) : (
                        <div className="space-y-2">
                            <p className="text-xs text-center text-red-600">Deactivate this account? Data is preserved.</p>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setConfirmDelete(false)} className="btn btn-secondary flex-1 h-8 text-xs" disabled={deleting}>
                                    No
                                </button>
                                <button type="button" onClick={handleDelete} className="btn flex-1 h-8 text-xs bg-red-500 text-white hover:bg-red-600 border-transparent" disabled={deleting}>
                                    {deleting ? <Loader2 className="animate-spin" size={13} /> : 'Yes, Deactivate'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>}
            </div>
        </div>,
        document.body
    )
}
