'use client'

import { useState, Suspense } from 'react'
import { login } from './actions'
import { Loader2, ArrowRight, Lock } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function LoginForm() {
    const searchParams = useSearchParams()
    const errorMsg = searchParams.get('error')

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(errorMsg)

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

    return (
        <div className="min-h-screen bg-[#F0F4F8] flex items-center justify-center p-4">
            {/* Container restricted width for focus */}
            <div className="w-full max-w-[400px]">

                {/* Logo Header */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2.5 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-[#0077B6] flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                            <Lock size={20} strokeWidth={2.5} />
                        </div>
                        <span className="font-bold text-2xl tracking-tight text-slate-800">OrthoClinic</span>
                    </Link>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100 overflow-hidden">
                    <div className="p-8 pb-6 border-b border-slate-50">
                        <h2 className="text-xl font-bold text-slate-800 text-center">Welcome Back</h2>
                        <p className="text-sm text-slate-500 text-center mt-1">Please sign in to your dashboard</p>
                    </div>

                    <div className="p-8 pt-6">
                        <form className="space-y-5" onSubmit={handleSubmit}>
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
                                    <a href="#" className="text-xs font-medium text-[#0077B6] hover:underline">Forgot?</a>
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

                    <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 text-center">
                        <p className="text-xs text-slate-400">
                            Protected by industry standard encryption.
                            <br /> By logging in, you agree to our <a href="#" className="underline">policies</a>.
                        </p>
                    </div>
                </div>

                <div className="text-center mt-6">
                    <Link href="/" className="text-sm text-slate-500 hover:text-slate-700 flex items-center justify-center gap-1">
                        <ArrowRight size={14} className="rotate-180" /> Back to Home
                    </Link>
                </div>

            </div>
        </div>
    )
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#F0F4F8]"><Loader2 className="animate-spin text-slate-400" /></div>}>
            <LoginForm />
        </Suspense>
    )
}
