'use client'

import { useActionState } from 'react'
import { submitContactForm } from './actions'
import { Loader2, CheckCircle, Send } from 'lucide-react'

export default function ContactForm() {
    const [state, formAction, pending] = useActionState(submitContactForm, null)

    if (state?.success) {
        return (
            <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-8 text-center">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Message Sent!</h3>
                <p className="text-slate-500 text-sm">Thank you for reaching out. We&apos;ll get back to you within 24 hours.</p>
            </div>
        )
    }

    return (
        <form action={formAction} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
                <div>
                    <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Name *</label>
                    <input
                        name="name"
                        type="text"
                        required
                        className="input w-full"
                        placeholder="Your full name"
                    />
                </div>
                <div>
                    <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Email *</label>
                    <input
                        name="email"
                        type="email"
                        required
                        className="input w-full"
                        placeholder="you@example.com"
                    />
                </div>
            </div>

            <div>
                <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Subject</label>
                <input
                    name="subject"
                    type="text"
                    className="input w-full"
                    placeholder="What is this about?"
                />
            </div>

            <div>
                <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Message *</label>
                <textarea
                    name="message"
                    required
                    rows={5}
                    minLength={10}
                    className="input w-full resize-none"
                    placeholder="Tell us how we can help..."
                />
            </div>

            {state?.error && (
                <div className="flex items-center gap-2 bg-red-50 text-red-700 border border-red-200 p-3 rounded-lg text-sm">
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                    {state.error}
                </div>
            )}

            <button
                type="submit"
                disabled={pending}
                className="btn btn-primary w-full h-11 text-sm justify-center"
            >
                {pending ? (
                    <Loader2 size={16} className="animate-spin mr-2" />
                ) : (
                    <Send size={16} className="mr-2" />
                )}
                {pending ? 'Sending...' : 'Send Message'}
            </button>
        </form>
    )
}
