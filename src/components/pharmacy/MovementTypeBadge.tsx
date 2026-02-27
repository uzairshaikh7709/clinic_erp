import type { StockMovementType } from '@/types/database'

const config: Record<StockMovementType, { label: string; className: string }> = {
    stock_in: { label: 'Stock In', className: 'bg-emerald-50 text-emerald-700' },
    stock_out: { label: 'Stock Out', className: 'bg-blue-50 text-blue-700' },
    adjustment: { label: 'Adjustment', className: 'bg-violet-50 text-violet-700' },
    expired: { label: 'Expired', className: 'bg-red-50 text-red-700' },
    returned: { label: 'Returned', className: 'bg-amber-50 text-amber-700' },
}

export function MovementTypeBadge({ type }: { type: StockMovementType }) {
    const c = config[type] || { label: type, className: 'bg-slate-50 text-slate-700' }
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${c.className}`}>
            {c.label}
        </span>
    )
}
