'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import PrintControls from '@/app/(authenticated)/doctor/prescriptions/[id]/PrintButton'

export default function InvoicePrint({ invoice, items, payments, org }: {
    invoice: any; items: any[]; payments: any[]; org: any
}) {
    const [headerMargin, setHeaderMargin] = useState(120)
    const onMarginChange = useCallback((px: number) => setHeaderMargin(px), [])

    const totalPaid = payments.reduce((s: number, p: any) => s + Number(p.amount), 0)

    // Group tax by rate for summary
    const taxByRate: Record<string, number> = {}
    items.forEach((item: any) => {
        const rate = Number(item.gst_rate)
        if (rate > 0) {
            const key = rate.toString()
            taxByRate[key] = (taxByRate[key] || 0) + Number(item.tax_amount)
        }
    })

    return (
        <div className="max-w-4xl mx-auto space-y-4 pb-12">
            {/* Controls - hidden on print */}
            <div className="print:hidden flex items-center justify-between gap-4">
                <Link href={`/pharmacy/invoices/${invoice.id}`} className="text-slate-500 hover:text-slate-800 flex items-center gap-2 text-sm">
                    <ArrowLeft size={16} /> Back to Invoice
                </Link>
            </div>

            <PrintControls onMarginChange={onMarginChange} />

            {/* Printable Invoice */}
            <div className="rx-printable bg-white shadow-xl shadow-slate-200 print:shadow-none print:border-none border border-slate-100 mx-auto w-full sm:max-w-[210mm]">
                {/* Adjustable header margin for letterhead */}
                <div className="rx-header-space" style={{ height: `${headerMargin}px` }} />

                {/* Invoice Title + Number */}
                <div className="px-6 sm:px-10 flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">INVOICE</h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Date: {new Date(invoice.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-lg font-bold text-indigo-700">{invoice.invoice_number}</p>
                        <p className={`text-xs font-medium capitalize mt-1 ${
                            invoice.payment_status === 'paid' ? 'text-emerald-600' :
                            invoice.payment_status === 'partial' ? 'text-amber-600' : 'text-red-600'
                        }`}>{invoice.payment_status}</p>
                    </div>
                </div>

                {/* Patient / Doctor Details */}
                <div className="px-6 sm:px-10 mt-5">
                    <div className="border border-slate-300 rounded text-sm">
                        <div className="grid grid-cols-1 sm:grid-cols-2">
                            <div className="p-3 space-y-1.5 sm:border-r border-slate-300">
                                <p>
                                    <span className="font-semibold text-slate-600 inline-block w-20">Patient:</span>
                                    <span className="font-bold text-slate-900">{invoice.patient_name}</span>
                                </p>
                                {invoice.doctor_name && (
                                    <p>
                                        <span className="font-semibold text-slate-600 inline-block w-20">Doctor:</span>
                                        <span>{invoice.doctor_name}</span>
                                    </p>
                                )}
                            </div>
                            <div className="p-3 space-y-1.5 border-t sm:border-t-0 border-slate-300">
                                <p>
                                    <span className="font-semibold text-slate-600 inline-block w-20">Invoice #:</span>
                                    <span>{invoice.invoice_number}</span>
                                </p>
                                <p>
                                    <span className="font-semibold text-slate-600 inline-block w-20">Date:</span>
                                    <span>{new Date(invoice.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <div className="px-6 sm:px-10 mt-5">
                    <div className="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
                        <table className="rx-table w-full border-collapse text-sm min-w-[500px]">
                            <thead>
                                <tr className="bg-slate-50">
                                    <th className="border border-slate-300 px-2 py-1.5 text-left font-bold text-slate-700 w-8">#</th>
                                    <th className="border border-slate-300 px-2 py-1.5 text-left font-bold text-slate-700">Medicine</th>
                                    <th className="border border-slate-300 px-2 py-1.5 text-center font-bold text-slate-700 w-12">Qty</th>
                                    <th className="border border-slate-300 px-2 py-1.5 text-right font-bold text-slate-700 w-20">Rate</th>
                                    <th className="border border-slate-300 px-2 py-1.5 text-right font-bold text-slate-700 w-16">GST%</th>
                                    <th className="border border-slate-300 px-2 py-1.5 text-right font-bold text-slate-700 w-24">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item: any, i: number) => (
                                    <tr key={item.id}>
                                        <td className="border border-slate-300 px-2 py-2 text-slate-600">{i + 1}</td>
                                        <td className="border border-slate-300 px-2 py-2">
                                            <span className="font-medium text-slate-900">{item.medicine_name}</span>
                                            {item.batch_number && (
                                                <span className="block text-xs text-slate-400">
                                                    B: {item.batch_number}{item.expiry_date ? ` · E: ${item.expiry_date}` : ''}
                                                </span>
                                            )}
                                        </td>
                                        <td className="border border-slate-300 px-2 py-2 text-center text-slate-700">{item.quantity}</td>
                                        <td className="border border-slate-300 px-2 py-2 text-right text-slate-700">₹{Number(item.unit_price).toFixed(2)}</td>
                                        <td className="border border-slate-300 px-2 py-2 text-right text-slate-500">{Number(item.gst_rate)}%</td>
                                        <td className="border border-slate-300 px-2 py-2 text-right font-medium text-slate-900">₹{Number(item.line_total).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Totals */}
                <div className="px-6 sm:px-10 mt-4">
                    <div className="flex justify-end">
                        <div className="w-64 text-sm space-y-1">
                            <div className="flex justify-between">
                                <span className="text-slate-600">Subtotal:</span>
                                <span className="text-slate-800">₹{Number(invoice.subtotal).toFixed(2)}</span>
                            </div>
                            {Object.entries(taxByRate).map(([rate, amount]) => (
                                <div key={rate} className="flex justify-between">
                                    <span className="text-slate-600">CGST ({Number(rate) / 2}%):</span>
                                    <span className="text-slate-800">₹{(Number(amount) / 2).toFixed(2)}</span>
                                </div>
                            ))}
                            {Object.entries(taxByRate).map(([rate, amount]) => (
                                <div key={`sgst-${rate}`} className="flex justify-between">
                                    <span className="text-slate-600">SGST ({Number(rate) / 2}%):</span>
                                    <span className="text-slate-800">₹{(Number(amount) / 2).toFixed(2)}</span>
                                </div>
                            ))}
                            {Number(invoice.discount) > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Discount:</span>
                                    <span className="text-red-600">-₹{Number(invoice.discount).toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between pt-2 border-t border-slate-400 font-bold text-base">
                                <span className="text-slate-800">Grand Total:</span>
                                <span className="text-slate-900">₹{Number(invoice.grand_total).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Payment Info */}
                {payments.length > 0 && (
                    <div className="px-6 sm:px-10 mt-5 text-sm">
                        <p className="font-bold text-slate-700 mb-1">Payment:</p>
                        {payments.map((p: any) => (
                            <p key={p.id} className="text-slate-600">
                                ₹{Number(p.amount).toFixed(2)} via {p.payment_method.replace('_', ' ')}
                                {p.reference_number && ` (Ref: ${p.reference_number})`}
                                {' · '}{new Date(p.created_at).toLocaleDateString('en-IN')}
                            </p>
                        ))}
                        {(Number(invoice.grand_total) - totalPaid) > 0.01 && (
                            <p className="text-red-600 font-medium mt-1">Balance Due: ₹{(Number(invoice.grand_total) - totalPaid).toFixed(2)}</p>
                        )}
                    </div>
                )}

                {/* Signature */}
                <div className="px-6 sm:px-10 mt-16 mb-8 flex justify-end">
                    <div className="text-center">
                        <div className="w-48 border-b border-slate-400 mb-1" />
                        <p className="text-sm text-slate-500">Authorized Signature</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
