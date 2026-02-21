export default function LoginLoading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F0F4F8]">
            <div className="w-full max-w-md mx-auto p-8 space-y-6">
                <div className="text-center space-y-2">
                    <div className="skeleton h-8 w-32 mx-auto" />
                    <div className="skeleton h-4 w-48 mx-auto" />
                </div>
                <div className="bg-white rounded-xl border border-slate-100 p-6 space-y-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                    <div className="space-y-2">
                        <div className="skeleton h-4 w-16" />
                        <div className="skeleton h-10 w-full rounded-lg" />
                    </div>
                    <div className="space-y-2">
                        <div className="skeleton h-4 w-20" />
                        <div className="skeleton h-10 w-full rounded-lg" />
                    </div>
                    <div className="skeleton h-10 w-full rounded-lg" />
                </div>
            </div>
        </div>
    )
}
