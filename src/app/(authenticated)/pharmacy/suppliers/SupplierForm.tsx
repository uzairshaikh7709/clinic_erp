'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupplier, updateSupplier } from '../purchase-actions'
import type { Supplier } from '@/types/database'

const INDIAN_STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
    'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
    'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
    'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu & Kashmir', 'Ladakh',
    'Chandigarh', 'Puducherry', 'Lakshadweep', 'Andaman & Nicobar',
]

export default function SupplierForm({ supplier }: { supplier?: Supplier }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        setError('')

        const formData = new FormData(e.currentTarget)
        if (supplier) formData.set('id', supplier.id)

        const result = supplier ? await updateSupplier(formData) : await createSupplier(formData)

        if (result.error) {
            setError(result.error)
            setLoading(false)
        } else {
            router.push('/pharmacy/suppliers')
        }
    }

    return (
        <form onSubmit={handleSubmit} className="card p-6 space-y-6">
            {error && (
                <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm font-medium">{error}</div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                    <label className="label">Supplier Name *</label>
                    <input name="name" defaultValue={supplier?.name} required className="input w-full" placeholder="e.g. ABC Pharmaceuticals" />
                </div>

                <div>
                    <label className="label">Contact Person</label>
                    <input name="contact_person" defaultValue={supplier?.contact_person || ''} className="input w-full" placeholder="Primary contact name" />
                </div>
                <div>
                    <label className="label">Phone</label>
                    <input name="phone" defaultValue={supplier?.phone || ''} className="input w-full" placeholder="+91 XXXXX XXXXX" />
                </div>
                <div>
                    <label className="label">Email</label>
                    <input name="email" type="email" defaultValue={supplier?.email || ''} className="input w-full" placeholder="supplier@email.com" />
                </div>
                <div>
                    <label className="label">GSTIN</label>
                    <input name="gstin" defaultValue={supplier?.gstin || ''} className="input w-full font-mono" placeholder="22AAAAA0000A1Z5" maxLength={15} />
                </div>
                <div>
                    <label className="label">Drug License No.</label>
                    <input name="drug_license_no" defaultValue={supplier?.drug_license_no || ''} className="input w-full" placeholder="DL-XX-XXXXXXX" />
                </div>
                <div>
                    <label className="label">Payment Terms</label>
                    <select name="payment_terms" defaultValue={supplier?.payment_terms || '30 days'} className="select w-full">
                        <option value="COD">Cash on Delivery</option>
                        <option value="7 days">Net 7</option>
                        <option value="15 days">Net 15</option>
                        <option value="30 days">Net 30</option>
                        <option value="60 days">Net 60</option>
                        <option value="90 days">Net 90</option>
                    </select>
                </div>
            </div>

            <hr className="border-slate-100" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                    <label className="label">Address</label>
                    <textarea name="address" defaultValue={supplier?.address || ''} className="input w-full" rows={2} placeholder="Street address" />
                </div>
                <div>
                    <label className="label">City</label>
                    <input name="city" defaultValue={supplier?.city || ''} className="input w-full" />
                </div>
                <div>
                    <label className="label">State</label>
                    <select name="state" defaultValue={supplier?.state || ''} className="select w-full">
                        <option value="">Select state</option>
                        {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div>
                    <label className="label">Pincode</label>
                    <input name="pincode" defaultValue={supplier?.pincode || ''} className="input w-full" maxLength={6} placeholder="XXXXXX" />
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => router.back()} className="btn btn-secondary text-sm">
                    Cancel
                </button>
                <button type="submit" disabled={loading} className="btn btn-primary text-sm">
                    {loading ? 'Saving...' : (supplier ? 'Update Supplier' : 'Add Supplier')}
                </button>
            </div>
        </form>
    )
}
