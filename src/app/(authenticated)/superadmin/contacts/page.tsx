import { requireRole } from '@/utils/auth'
import { createAdminClient } from '@/utils/supabase/admin'
import Link from 'next/link'
import { Mail, ArrowLeft, Clock, Trash2 } from 'lucide-react'
import DeleteContactButton from './DeleteContactButton'

export default async function ContactSubmissionsPage() {
    await requireRole(['superadmin'])
    const admin = createAdminClient()

    const { data: submissions } = await admin
        .from('contact_submissions')
        .select('*')
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6 animate-enter">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Contact Messages</h1>
                    <p className="text-slate-500 text-sm">Messages from the public contact form</p>
                </div>
                <span className="text-sm text-slate-400">{submissions?.length || 0} message{submissions?.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Mobile: card layout */}
            <div className="md:hidden space-y-3">
                {(!submissions || submissions.length === 0) ? (
                    <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400">
                        <Mail size={32} className="mx-auto mb-2 opacity-30" />
                        <p>No contact messages yet.</p>
                    </div>
                ) : (
                    submissions.map((msg: any) => (
                        <div key={msg.id} className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <p className="font-semibold text-slate-900 text-sm">{msg.name}</p>
                                    <a href={`mailto:${msg.email}`} className="text-xs text-[#0077B6] hover:underline">{msg.email}</a>
                                </div>
                                <DeleteContactButton id={msg.id} />
                            </div>
                            {msg.subject && (
                                <p className="text-xs font-medium text-slate-700">{msg.subject}</p>
                            )}
                            <p className="text-sm text-slate-600 whitespace-pre-wrap">{msg.message}</p>
                            <div className="flex items-center gap-1 text-[11px] text-slate-400">
                                <Clock size={11} />
                                {new Date(msg.created_at).toLocaleString()}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Desktop: table layout */}
            <div className="hidden md:block bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                            <tr>
                                <th className="px-4 lg:px-6 py-3">From</th>
                                <th className="px-4 lg:px-6 py-3">Subject</th>
                                <th className="px-4 lg:px-6 py-3">Message</th>
                                <th className="px-4 lg:px-6 py-3">Date</th>
                                <th className="px-4 lg:px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {(!submissions || submissions.length === 0) ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                        <Mail size={32} className="mx-auto mb-2 opacity-30" />
                                        No contact messages yet.
                                    </td>
                                </tr>
                            ) : (
                                submissions.map((msg: any) => (
                                    <tr key={msg.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 lg:px-6 py-3">
                                            <div>
                                                <p className="font-semibold text-slate-900">{msg.name}</p>
                                                <a href={`mailto:${msg.email}`} className="text-xs text-[#0077B6] hover:underline">{msg.email}</a>
                                            </div>
                                        </td>
                                        <td className="px-4 lg:px-6 py-3 text-slate-600">
                                            {msg.subject || <span className="text-slate-300">—</span>}
                                        </td>
                                        <td className="px-4 lg:px-6 py-3 text-slate-600 max-w-xs">
                                            <p className="truncate">{msg.message}</p>
                                        </td>
                                        <td className="px-4 lg:px-6 py-3 text-slate-500 whitespace-nowrap text-xs">
                                            {new Date(msg.created_at).toLocaleDateString()}<br />
                                            <span className="text-slate-400">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </td>
                                        <td className="px-4 lg:px-6 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <a
                                                    href={`mailto:${msg.email}?subject=Re: ${msg.subject || 'Your message on DrEase'}`}
                                                    className="px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-[#0077B6] hover:bg-blue-100 transition-colors"
                                                >
                                                    Reply
                                                </a>
                                                <DeleteContactButton id={msg.id} />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
