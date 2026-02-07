'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/utils/supabase/client'
import { Clock, Loader2, Calendar } from 'lucide-react'

export default function SlotPicker({ doctorId, userFullName }: { doctorId: string, userFullName: string }) {
    const router = useRouter()
    const supabase = createBrowserClient()
    const [booking, setBooking] = useState(false)
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [availableSlots, setAvailableSlots] = useState<string[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (date && doctorId) {
            fetchSlots()
        }
    }, [date, doctorId])

    const fetchSlots = async () => {
        setLoading(true)
        try {
            const selectedDate = new Date(date)
            const dayOfWeek = selectedDate.getDay()

            // Fetch doctor's availability for this day
            const { data: slots } = await supabase
                .from('doctor_slots')
                .select('*')
                .eq('doctor_id', doctorId)
                .eq('day_of_week', dayOfWeek)
                .eq('is_active', true)
                .single()

            if (!slots) {
                setAvailableSlots([])
                setLoading(false)
                return
            }

            // Generate time slots
            const generatedSlots: string[] = []
            const [startH, startM] = slots.start_time.split(':').map(Number)
            const [endH, endM] = slots.end_time.split(':').map(Number)

            let currentTime = startH * 60 + startM
            const endTime = endH * 60 + endM

            while (currentTime < endTime) {
                const hours = Math.floor(currentTime / 60)
                const mins = currentTime % 60
                const timeStr = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
                generatedSlots.push(timeStr)
                currentTime += slots.slot_duration
            }

            // Fetch booked appointments for this date
            const startOfDay = `${date}T00:00:00`
            const endOfDay = `${date}T23:59:59`

            const { data: appointments } = await supabase
                .from('appointments')
                .select('start_time')
                .eq('doctor_id', doctorId)
                .gte('start_time', startOfDay)
                .lte('start_time', endOfDay)
                .neq('status', 'cancelled')

            const bookedTimes = new Set(
                (appointments || []).map(apt => {
                    const time = new Date(apt.start_time)
                    return `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`
                })
            )

            // Filter out booked slots
            const freeSlots = generatedSlots.filter(slot => !bookedTimes.has(slot))
            setAvailableSlots(freeSlots)

        } catch (err) {
            console.error(err)
            setAvailableSlots([])
        } finally {
            setLoading(false)
        }
    }

    const handleBook = async (time: string) => {
        if (!confirm(`Confirm booking for ${date} at ${time}?`)) return

        setBooking(true)
        try {
            const user = (await supabase.auth.getUser()).data.user
            if (!user) throw new Error("Not logged in")

            let patientId: string = ''

            const { data: existingPatient } = await supabase
                .from('patients')
                .select('id')
                .eq('full_name', userFullName)
                .single()

            if (existingPatient) {
                patientId = existingPatient.id
            } else {
                const { data: newP, error: pErr } = await supabase.from('patients').insert({
                    full_name: userFullName,
                    dob: '1990-01-01',
                    gender: 'Other',
                    address: 'Online',
                    registration_number: 'P-' + Math.floor(Math.random() * 10000)
                }).select().single()
                if (pErr) throw pErr
                patientId = newP.id
            }

            // Fetch slot duration to calculate end time
            const selectedDate = new Date(date)
            const dayOfWeek = selectedDate.getDay()

            const { data: slotConfig } = await supabase
                .from('doctor_slots')
                .select('slot_duration')
                .eq('doctor_id', doctorId)
                .eq('day_of_week', dayOfWeek)
                .eq('is_active', true)
                .single()

            const duration = slotConfig?.slot_duration || 15

            const startTime = `${date}T${time}:00`
            const [hours, minutes] = time.split(':').map(Number)
            const endMinutes = hours * 60 + minutes + duration
            const endHours = Math.floor(endMinutes / 60)
            const endMins = endMinutes % 60
            const endTime = `${date}T${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}:00`

            const { error } = await supabase.from('appointments').insert({
                doctor_id: doctorId,
                patient_id: patientId,
                start_time: startTime,
                end_time: endTime,
                status: 'booked'
            })

            if (error) throw error

            router.push('/book?success=true')
            router.refresh()

        } catch (err: any) {
            alert('Booking failed: ' + err.message)
        } finally {
            setBooking(false)
        }
    }

    return (
        <div>
            <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1 max-w-xs">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="date"
                        className="input pl-10 h-10 w-full"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                    />
                </div>
                <span className="text-sm text-slate-500">Select Date</span>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-40 text-slate-400">
                    <Loader2 className="animate-spin mr-2" size={20} />
                    Loading slots...
                </div>
            ) : availableSlots.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-slate-400">
                    <p>No available slots for this date. Please select another day.</p>
                </div>
            ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {availableSlots.map(time => (
                        <button
                            key={time}
                            onClick={() => handleBook(time)}
                            disabled={booking}
                            className="group relative flex items-center justify-center py-2.5 rounded-lg border border-slate-200 bg-white hover:border-[#0077B6] hover:bg-blue-50 hover:text-[#0077B6] text-slate-600 font-medium text-sm transition-all focus:ring-2 focus:ring-blue-100 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {booking ? <Loader2 size={14} className="animate-spin" /> : time}
                        </button>
                    ))}
                </div>
            )}

            <p className="text-xs text-slate-400 mt-6 text-center">
                * Please arrive 10 minutes early for your appointment.
            </p>
        </div>
    )
}
