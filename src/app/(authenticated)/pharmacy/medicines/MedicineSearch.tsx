'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useCallback } from 'react'
import { Search } from 'lucide-react'

export default function MedicineSearch({ defaultSearch, defaultCategory, categories }: {
    defaultSearch: string
    defaultCategory: string
    categories: string[]
}) {
    const router = useRouter()
    const [search, setSearch] = useState(defaultSearch)
    const [category, setCategory] = useState(defaultCategory)
    const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null)

    const navigate = useCallback((s: string, c: string) => {
        const params = new URLSearchParams()
        if (s) params.set('search', s)
        if (c) params.set('category', c)
        params.set('page', '1')
        router.push(`/pharmacy/medicines?${params.toString()}`)
    }, [router])

    const handleSearchChange = (value: string) => {
        setSearch(value)
        if (debounceTimer) clearTimeout(debounceTimer)
        setDebounceTimer(setTimeout(() => navigate(value, category), 400))
    }

    const handleCategoryChange = (value: string) => {
        setCategory(value)
        navigate(search, value)
    }

    return (
        <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                    type="text"
                    className="input pl-9 w-full"
                    placeholder="Search medicines..."
                    value={search}
                    onChange={e => handleSearchChange(e.target.value)}
                />
            </div>
            <select
                className="select w-full sm:w-auto"
                value={category}
                onChange={e => handleCategoryChange(e.target.value)}
            >
                <option value="">All Categories</option>
                {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                ))}
            </select>
        </div>
    )
}
