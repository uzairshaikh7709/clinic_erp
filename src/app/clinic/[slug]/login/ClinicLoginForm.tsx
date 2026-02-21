'use client'

import { useState, Suspense } from 'react'
import { login, forgotPassword } from '@/app/login/actions'
import { Loader2, ArrowRight, ArrowLeft, CheckCircle, Building2 } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function LoginFormInner({ clinicName, clinicSlug, logoUrl }: { clinicName: string; clinicSlug: string; logoUrl: string | null }) {
    const searchParams = useSearchParams()
    const errorMsg = searchParams.get('error')
    const resetSuccess = searchParams.get('reset') === 'success'

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(errorMsg)
    const [mode, setMode] = useState<'login' | 'forgot'>('login')
    const [forgotLoading, setForgotLoading] = useState(false)
    const [forgotSent, setForgotSent] = useState(false)
    const [forgotError, setForgotError] = useState<string | null>(null)

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setLoading(true)
        setError(null)
        const formData = new FormData(event.currentTarget)
        const result = await login(formData)
        if (result?.error) {
            setError(result.error)
            setLoading(false)
        }
    }

    const handleForgot = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setForgotLoading(true)
        setForgotError(null)
        const formData = new FormData(event.currentTarget)
        const result = await forgotPassword(formData)
        setForgotLoading(false)
        if (result.error) {
            setForgotError(result.error)
        } else {
            setForgotSent(true)
        }
    }

    return (
        <div className="min-h-screen bg-[#F0F4F8] flex items-center justify-center p-4">
            <div className="w-full max-w-[400px]">

                {/* Clinic Logo Header */}
                <div className="text-center mb-8">
                    <Link href={`/clinic/${clinicSlug}`} className="inline-flex items-center gap-2.5 mb-2">
                        {logoUrl ? (
                            <img src={logoUrl} alt={clinicName} className="w-10 h-10 rounded-xl object-cover shadow-lg shadow-blue-500/20" />
                        ) : (
                            <div className="w-10 h-10 rounded-xl bg-[#0077B6] flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                                <Building2 size={20} strokeWidth={2.5} />
                            </div>
                        )}
                        <span className="font-bold text-2xl tracking-tight text-slate-800">{clinicName}</span>
                    </Link>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100 overflow-hidden">

                    {mode === 'login' ? (
                        <>
                            <div className="p-8 pb-6 border-b border-slate-50">
                                <h2 className="text-xl font-bold text-slate-800 text-center">Welcome Back</h2>
                                <p className="text-sm text-slate-500 text-center mt-1">Sign in to {clinicName}</p>
                            </div>

                            <div className="p-8 pt-6">
                                <form className="space-y-5" onSubmit={handleSubmit}>
                                    <input type="hidden" name="clinic_login" value="true" />
                                    {resetSuccess && (
                                        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-medium text-center flex items-center justify-center gap-2">
                                            <CheckCircle size={16} /> Password updated! Please sign in.
                                        </div>
                                    )}

                                    {error && (
                                        <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm font-medium text-center flex items-center justify-center gap-2">
                                            {error}
                                        </div>
                                    )}

                                    <div className="space-y-1.5">
                                        <label className="text-sm font-semibold text-slate-700">Email Address</label>
                                        <input
                                            name="email"
                                            type="email"
                                            required
                                            className="input h-12 px-4 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                                            placeholder="doctor@clinic.com"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-semibold text-slate-700">Password</label>
                                            <button
                                                type="button"
                                                onClick={() => { setMode('forgot'); setError(null) }}
                                                className="text-xs text-[#0077B6] hover:text-[#023e8a] font-medium transition-colors"
                                            >
                                                Forgot Password?
                                            </button>
                                        </div>
                                        <input
                                            name="password"
                                            type="password"
                                            required
                                            className="input h-12 px-4 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                                            placeholder="••••••••"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="btn btn-primary w-full h-12 text-base font-semibold shadow-md shadow-blue-500/10 mt-2"
                                    >
                                        {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Secure Login'}
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="p-8 pb-6 border-b border-slate-50">
                                <h2 className="text-xl font-bold text-slate-800 text-center">Reset Password</h2>
                                <p className="text-sm text-slate-500 text-center mt-1">
                                    {forgotSent ? 'Check your email for a reset link' : 'Enter your email to receive a reset link'}
                                </p>
                            </div>

                            <div className="p-8 pt-6">
                                {forgotSent ? (
                                    <div className="text-center space-y-4">
                                        <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                                            <CheckCircle size={28} />
                                        </div>
                                        <p className="text-sm text-slate-600">
                                            We&apos;ve sent a password reset link to your email. Please check your inbox and follow the instructions.
                                        </p>
                                        <button
                                            onClick={() => { setMode('login'); setForgotSent(false) }}
                                            className="btn btn-secondary w-full h-10 text-sm"
                                        >
                                            <ArrowLeft size={14} className="mr-1.5" /> Back to Login
                                        </button>
                                    </div>
                                ) : (
                                    <form className="space-y-5" onSubmit={handleForgot}>
                                        {forgotError && (
                                            <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm font-medium text-center">
                                                {forgotError}
                                            </div>
                                        )}

                                        <div className="space-y-1.5">
                                            <label className="text-sm font-semibold text-slate-700">Email Address</label>
                                            <input
                                                name="email"
                                                type="email"
                                                required
                                                className="input h-12 px-4 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                                                placeholder="doctor@clinic.com"
                                                autoFocus
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={forgotLoading}
                                            className="btn btn-primary w-full h-12 text-base font-semibold shadow-md shadow-blue-500/10"
                                        >
                                            {forgotLoading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Send Reset Link'}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => { setMode('login'); setForgotError(null) }}
                                            className="w-full text-sm text-slate-500 hover:text-slate-700 flex items-center justify-center gap-1"
                                        >
                                            <ArrowLeft size={14} /> Back to Login
                                        </button>
                                    </form>
                                )}
                            </div>
                        </>
                    )}

                    <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 text-center">
                        <p className="text-xs text-slate-400">
                            Protected by industry standard encryption.
                        </p>
                    </div>
                </div>

                <div className="text-center mt-6">
                    <Link href={`/clinic/${clinicSlug}`} className="text-sm text-slate-500 hover:text-slate-700 flex items-center justify-center gap-1">
                        <ArrowRight size={14} className="rotate-180" /> Back to {clinicName}
                    </Link>
                </div>

            </div>
        </div>
    )
}

export default function ClinicLoginForm({ clinicName, clinicSlug, logoUrl }: { clinicName: string; clinicSlug: string; logoUrl: string | null }) {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#F0F4F8]"><Loader2 className="animate-spin text-slate-400" /></div>}>
            <LoginFormInner clinicName={clinicName} clinicSlug={clinicSlug} logoUrl={logoUrl} />
        </Suspense>
    )
}
