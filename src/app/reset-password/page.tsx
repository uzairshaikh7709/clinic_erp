'use client'

import { useState } from 'react'
import { createBrowserClient } from '@/utils/supabase/client'
import { Loader2, Lock, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function ResetPasswordPage() {
    const router = useRouter()
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (password.length < 8) {
            setError('Password must be at least 8 characters')
            return
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match')
            return
        }

        setLoading(true)

        const supabase = createBrowserClient()
        const { error } = await supabase.auth.updateUser({ password })

        setLoading(false)

        if (error) {
            setError(error.message)
        } else {
            setSuccess(true)
            setTimeout(() => {
                router.push('/login?reset=success')
            }, 2000)
        }
    }

    return (
        <div className="min-h-screen bg-[#F0F4F8] flex items-center justify-center p-4">
            <div className="w-full max-w-[400px]">
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2.5 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-[#0077B6] flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                            <Lock size={20} strokeWidth={2.5} />
                        </div>
                        <span className="font-bold text-2xl tracking-tight text-slate-800">DrEase</span>
                    </Link>
                </div>

                <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100 overflow-hidden">
                    <div className="p-8 pb-6 border-b border-slate-50">
                        <h2 className="text-xl font-bold text-slate-800 text-center">
                            {success ? 'Password Updated' : 'Set New Password'}
                        </h2>
                        <p className="text-sm text-slate-500 text-center mt-1">
                            {success ? 'Redirecting to login...' : 'Enter your new password below'}
                        </p>
                    </div>

                    <div className="p-8 pt-6">
                        {success ? (
                            <div className="text-center space-y-4">
                                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                                    <CheckCircle size={28} />
                                </div>
                                <p className="text-sm text-slate-600">
                                    Your password has been updated successfully. Redirecting to login...
                                </p>
                            </div>
                        ) : (
                            <form className="space-y-5" onSubmit={handleSubmit}>
                                {error && (
                                    <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm font-medium text-center">
                                        {error}
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-slate-700">New Password</label>
                                    <input
                                        type="password"
                                        required
                                        minLength={8}
                                        className="input h-12 px-4 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                                        placeholder="Min 8 characters"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        autoFocus
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-slate-700">Confirm Password</label>
                                    <input
                                        type="password"
                                        required
                                        minLength={8}
                                        className="input h-12 px-4 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                                        placeholder="Repeat your password"
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn btn-primary w-full h-12 text-base font-semibold shadow-md shadow-blue-500/10"
                                >
                                    {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Update Password'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
