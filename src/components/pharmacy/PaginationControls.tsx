import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
    currentPage: number
    totalCount: number
    pageSize: number
    basePath: string
    searchParams?: Record<string, string>
}

export function PaginationControls({ currentPage, totalCount, pageSize, basePath, searchParams = {} }: PaginationProps) {
    const totalPages = Math.ceil(totalCount / pageSize)
    if (totalPages <= 1) return null

    const buildUrl = (page: number) => {
        const params = new URLSearchParams({ ...searchParams, page: String(page) })
        return `${basePath}?${params.toString()}`
    }

    return (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <p className="text-sm text-slate-500">
                Page {currentPage} of {totalPages} <span className="hidden sm:inline">({totalCount} items)</span>
            </p>
            <div className="flex gap-2">
                {currentPage > 1 && (
                    <Link href={buildUrl(currentPage - 1)} className="btn btn-secondary text-sm">
                        <ChevronLeft size={16} className="mr-1" /> Prev
                    </Link>
                )}
                {currentPage < totalPages && (
                    <Link href={buildUrl(currentPage + 1)} className="btn btn-secondary text-sm">
                        Next <ChevronRight size={16} className="ml-1" />
                    </Link>
                )}
            </div>
        </div>
    )
}
