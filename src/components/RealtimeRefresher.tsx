'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/utils/supabase/client'

interface Props {
    /** Supabase table(s) to watch. Defaults to appointments. */
    tables?: string[]
    /** Optional: show a small live badge. Defaults to true. */
    showBadge?: boolean
}

export default function RealtimeRefresher({ tables = ['appointments'], showBadge = true }: Props) {
    const router = useRouter()
    const supabase = createBrowserClient()
    const channelsRef = useRef<any[]>([])
    const [connected, setConnected] = useState(false)

    useEffect(() => {
        const channels = tables.map(table => {
            const channel = supabase
                .channel(`rt_${table}_${Math.random().toString(36).slice(2)}`)
                .on(
                    'postgres_changes' as any,
                    { event: '*', schema: 'public', table },
                    () => { router.refresh() }
                )
                .subscribe((status: string) => {
                    if (status === 'SUBSCRIBED') setConnected(true)
                    if (status === 'CLOSED' || status === 'CHANNEL_ERROR') setConnected(false)
                })
            return channel
        })

        channelsRef.current = channels

        return () => {
            channels.forEach(ch => supabase.removeChannel(ch))
        }
    }, [])

    if (!showBadge) return null

    return (
        <span
            title={connected ? 'Live updates active' : 'Connecting...'}
            className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full select-none transition-colors ${connected ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}
        >
            <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
            {connected ? 'Live' : '...'}
        </span>
    )
}
