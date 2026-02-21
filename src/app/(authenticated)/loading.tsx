export default function AuthenticatedLoading() {
    return (
        <div className="space-y-8 animate-enter">
            {/* Header skeleton */}
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <div className="skeleton h-7 w-48" />
                    <div className="skeleton h-4 w-32" />
                </div>
                <div className="flex gap-3">
                    <div className="skeleton h-10 w-36 rounded-lg" />
                </div>
            </div>

            {/* Stats row skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                    <div key={i} className="bg-white rounded-xl border border-slate-100 p-5 flex items-start justify-between" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                        <div className="space-y-3">
                            <div className="skeleton h-4 w-28" />
                            <div className="skeleton h-8 w-16" />
                        </div>
                        <div className="skeleton h-12 w-12 rounded-lg" />
                    </div>
                ))}
            </div>

            {/* Table skeleton */}
            <div className="bg-white rounded-xl border border-slate-100 overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="skeleton h-5 w-40" />
                </div>
                <div className="divide-y divide-slate-100">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="px-6 py-4 flex items-center gap-4">
                            <div className="skeleton h-10 w-10 rounded-full shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="skeleton h-4 w-40" />
                                <div className="skeleton h-3 w-24" />
                            </div>
                            <div className="skeleton h-6 w-16 rounded-full" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
