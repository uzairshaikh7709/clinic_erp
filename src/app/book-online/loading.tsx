export default function BookOnlineLoading() {
    return (
        <div className="min-h-screen bg-white">
            {/* Header skeleton */}
            <div className="border-b border-slate-100 px-6 py-4">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="skeleton h-8 w-28" />
                    <div className="skeleton h-9 w-24 rounded-lg" />
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
                <div className="text-center space-y-3">
                    <div className="skeleton h-9 w-72 mx-auto" />
                    <div className="skeleton h-5 w-96 mx-auto" />
                </div>

                {/* Doctor cards skeleton */}
                <div className="grid md:grid-cols-2 gap-6">
                    {[1, 2].map(i => (
                        <div key={i} className="bg-white rounded-xl border border-slate-100 p-6 space-y-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                            <div className="flex items-center gap-4">
                                <div className="skeleton h-14 w-14 rounded-full shrink-0" />
                                <div className="space-y-2 flex-1">
                                    <div className="skeleton h-5 w-40" />
                                    <div className="skeleton h-3 w-28" />
                                </div>
                            </div>
                            <div className="skeleton h-10 w-full rounded-lg" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
