export function StockBadge({ stock, threshold }: { stock: number; threshold: number }) {
    if (stock === 0) {
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700">Out of Stock</span>
    }
    if (stock < threshold) {
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700">Low Stock</span>
    }
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">In Stock</span>
}

export function ExpiryBadge({ expiryDate }: { expiryDate: string }) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const expiry = new Date(expiryDate + 'T00:00:00')
    const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700">Expired</span>
    }
    if (diffDays <= 30) {
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700">Expiring Soon</span>
    }
    if (diffDays <= 90) {
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700">{diffDays}d left</span>
    }
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">Good</span>
}
