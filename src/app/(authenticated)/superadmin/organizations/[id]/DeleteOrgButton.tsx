'use client'

import { useState } from 'react'
import { Trash2, Loader2 } from 'lucide-react'
import { deleteOrganization } from './actions'
import { useRouter } from 'next/navigation'

export default function DeleteOrgButton({ orgId, orgName }: { orgId: string; orgName: string }) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    const handleDelete = async () => {
        if (!confirm(`Are you sure you want to permanently delete "${orgName}"? This cannot be undone.`)) return

        setLoading(true)
        setError(null)
        const res = await deleteOrganization(orgId)
        if (res.error) {
            setError(res.error)
            setLoading(false)
        } else {
            router.push('/superadmin/organizations')
        }
    }

    return (
        <div>
            <button
                onClick={handleDelete}
                disabled={loading}
                className="btn btn-sm bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors"
            >
                {loading ? <Loader2 size={14} className="animate-spin mr-1" /> : <Trash2 size={14} className="mr-1" />}
                Delete Organization
            </button>
            {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
        </div>
    )
}
