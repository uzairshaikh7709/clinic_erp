'use client'

export default function AuthenticatedError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center px-4 text-center">
            <h2 className="text-xl font-bold text-slate-800 mb-2">Something went wrong</h2>
            <p className="text-slate-500 mb-6 max-w-md">
                An unexpected error occurred. Please try again.
            </p>
            <button onClick={reset} className="btn btn-primary">
                Try Again
            </button>
        </div>
    )
}
