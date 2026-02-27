'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { dispensePrescription } from '../../actions'
import { Loader2, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'

const STATUS_CONFIG = {
    matched: { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Matched' },
    partial: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', label: 'Partial' },
    insufficient: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'Insufficient' },
    unmatched: { icon: XCircle, color: 'text-slate-400', bg: 'bg-slate-50', label: 'Not Found' },
}

export default function DispensePreview({ prescriptionId, preview }: {
    prescriptionId: string
    preview: any[]
}) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [result, setResult] = useState<any>(null)

    const canDispense = preview.some(p => p.status === 'matched' || p.status === 'partial')

    const handleDispense = async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await dispensePrescription(prescriptionId)
            if (res.error) {
                setError(res.error)
                return
            }
            setResult(res)
            // Redirect to invoice after short delay
            setTimeout(() => {
                router.push(`/pharmacy/invoices/${res.invoiceId}`)
                router.refresh()
            }, 1500)
        } catch {
            setError('Something went wrong.')
        } finally {
            setLoading(false)
        }
    }

    if (result) {
        return (
            <div className="card p-8 text-center max-w-2xl">
                <CheckCircle size={40} className="mx-auto mb-3 text-emerald-500" />
                <p className="font-bold text-slate-800 text-lg">Dispensed Successfully!</p>
                <p className="text-sm text-slate-500 mt-1">
                    {result.matched?.length || 0} medicines dispensed.
                    {result.unmatched?.length > 0 && ` ${result.unmatched.length} not found.`}
                    {result.insufficient?.length > 0 && ` ${result.insufficient.length} insufficient stock.`}
                </p>
                <p className="text-sm text-indigo-600 mt-3">Redirecting to invoice...</p>
            </div>
        )
    }

    return (
        <div className="space-y-4 max-w-4xl">
            {/* Desktop table */}
            <div className="card overflow-hidden">
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                                <th className="text-left px-4 py-3 font-semibold text-slate-600">Medicine</th>
                                <th className="text-center px-4 py-3 font-semibold text-slate-600">Qty Required</th>
                                <th className="text-center px-4 py-3 font-semibold text-slate-600">Available</th>
                                <th className="text-left px-4 py-3 font-semibold text-slate-600">Batches (FIFO)</th>
                                <th className="text-center px-4 py-3 font-semibold text-slate-600">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {preview.map((item: any, i: number) => {
                                const cfg = STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG]
                                const Icon = cfg.icon
                                return (
                                    <tr key={i} className="hover:bg-slate-50/50">
                                        <td className="px-4 py-3 font-medium text-slate-800">{item.name}</td>
                                        <td className="px-4 py-3 text-center font-bold text-slate-700">{item.qtyRequired}</td>
                                        <td className="px-4 py-3 text-center text-slate-600">{item.available}</td>
                                        <td className="px-4 py-3 text-xs text-slate-500">
                                            {item.batches.length > 0 ? (
                                                item.batches.map((b: any, j: number) => (
                                                    <span key={j} className="inline-block mr-2">
                                                        {b.batch_number} ({b.quantity}) Exp: {b.expiry_date}
                                                    </span>
                                                ))
                                            ) : '—'}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                                                <Icon size={12} /> {cfg.label}
                                            </span>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Mobile */}
                <div className="md:hidden divide-y divide-slate-100">
                    {preview.map((item: any, i: number) => {
                        const cfg = STATUS_CONFIG[item.status as keyof typeof STATUS_CONFIG]
                        const Icon = cfg.icon
                        return (
                            <div key={i} className="p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="font-medium text-slate-800 truncate">{item.name}</p>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            Qty: {item.qtyRequired} &middot; Available: {item.available}
                                        </p>
                                        {item.batches.length > 0 && (
                                            <p className="text-xs text-slate-400 mt-0.5">
                                                {item.batches.map((b: any) => b.batch_number).join(', ')}
                                            </p>
                                        )}
                                    </div>
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${cfg.bg} ${cfg.color}`}>
                                        <Icon size={12} /> {cfg.label}
                                    </span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
            )}

            <div className="flex gap-3">
                <button
                    onClick={handleDispense}
                    disabled={loading || !canDispense}
                    className="btn btn-primary"
                >
                    {loading && <Loader2 size={16} className="animate-spin mr-1.5" />}
                    Confirm Dispense
                </button>
                <button onClick={() => router.back()} className="btn btn-secondary">
                    Cancel
                </button>
            </div>

            {!canDispense && (
                <p className="text-sm text-amber-600">No medicines can be dispensed. Check stock availability and medicine names.</p>
            )}
        </div>
    )
}
