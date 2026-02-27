export default function PharmacyLoading() {
    return (
        <div className="space-y-6 md:space-y-8 animate-enter">
            <div className="h-8 w-48 skeleton rounded" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="card p-4 sm:p-5 space-y-3">
                        <div className="h-4 w-24 skeleton rounded" />
                        <div className="h-8 w-16 skeleton rounded" />
                    </div>
                ))}
            </div>
            <div className="card p-4 sm:p-5 space-y-4">
                <div className="h-5 w-40 skeleton rounded" />
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-12 skeleton rounded" />
                ))}
            </div>
        </div>
    )
}
