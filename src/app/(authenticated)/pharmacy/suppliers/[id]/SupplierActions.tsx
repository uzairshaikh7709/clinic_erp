'use client'

import { useState } from 'react'
import { toggleSupplierActive } from '../../purchase-actions'
import type { Supplier } from '@/types/database'

export default function SupplierActions({ supplier }: { supplier: Supplier }) {
    const [loading, setLoading] = useState(false)

    async function handleToggle() {
        setLoading(true)
        await toggleSupplierActive(supplier.id, !supplier.is_active)
        setLoading(false)
    }

    return (
        <button
            onClick={handleToggle}
            disabled={loading}
            className={`btn text-sm ${supplier.is_active ? 'btn-secondary' : 'btn-primary'}`}
        >
            {loading ? 'Updating...' : (supplier.is_active ? 'Deactivate' : 'Activate')}
        </button>
    )
}
