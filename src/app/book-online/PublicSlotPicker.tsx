'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, Loader2, Calendar, User, Phone } from 'lucide-react'
import { getAvailableSlots, submitBooking } from './actions'

export default function PublicSlotPicker({ doctorId }: { doctorId: string }) {
    const router = useRouter()
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [availableSlots, setAvailableSlots] = useState<string[]>([])
    const [loading, setLoading] = useState(false)
    const [booking, setBooking] = useState(false)

    // Guest Details
    const [selectedTime, setSelectedTime] = useState<string | null>(null)
    const [guestName, setGuestName] = useState('')
    const [guestPhone, setGuestPhone] = useState('')

    useEffect(() => {
        if (date && doctorId) {
            loadSlots()
        }
    }, [date, doctorId])

    const loadSlots = async () => {
        setLoading(true)
        setSelectedTime(null) // Reset selection on date change
        try {
            const slots = await getAvailableSlots(doctorId, date)
            setAvailableSlots(slots)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleBook = async () => {
        if (!selectedTime || !guestName) return

        setBooking(true)
        try {
            const result = await submitBooking({
                doctorId,
                date,
                time: selectedTime,
                patientName: guestName,
                patientPhone: guestPhone
            })

            if (result.error) throw new Error(result.error)

            router.push('/book-online?success=true')
            router.refresh()

        } catch (error: any) {
            alert('Booking failed: ' + error.message)
        } finally {
            setBooking(false)
        }
    }

    return (
        <div>
            {/* Date Selection */}
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

            {/* Slots Grid */}
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
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mb-8">
                    {availableSlots.map(time => (
                        <button
                            key={time}
                            onClick={() => setSelectedTime(time)}
                            className={`
                                flex items-center justify-center py-2.5 rounded-lg border text-sm font-medium transition-all
                                ${selectedTime === time
                                    ? 'border-[#0077B6] bg-[#0077B6] text-white shadow-md'
                                    : 'border-slate-200 bg-white hover:border-[#0077B6] hover:bg-blue-50 text-slate-600'
                                }
                            `}
                        >
                            {time}
                        </button>
                    ))}
                </div>
            )}

            {/* Guest Details Form - Only shown when slot is selected */}
            {selectedTime && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 bg-slate-50 border border-slate-100 p-6 rounded-2xl">
                    <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <User size={18} className="text-[#0077B6]" />
                        Enter Your Details
                    </h4>

                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500">Full Name *</label>
                            <input
                                type="text"
                                className="input input-bordered w-full bg-white text-slate-900 focus:outline-[#0077B6]"
                                placeholder="e.g. John Doe"
                                value={guestName}
                                onChange={e => setGuestName(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500">Phone Number</label>
                            <input
                                type="tel"
                                className="input input-bordered w-full bg-white text-slate-900 focus:outline-[#0077B6]"
                                placeholder="e.g. +1 234 567 890"
                                value={guestPhone}
                                onChange={e => setGuestPhone(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                        <p className="text-xs text-slate-400 mr-auto">
                            Booking for <span className="font-semibold text-slate-600">{date}</span> at <span className="font-semibold text-slate-600">{selectedTime}</span>
                        </p>
                        <button
                            onClick={() => setSelectedTime(null)}
                            className="btn btn-ghost text-slate-500"
                            disabled={booking}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleBook}
                            disabled={!guestName || booking}
                            className="btn btn-primary px-6"
                        >
                            {booking ? <Loader2 className="animate-spin" size={18} /> : 'Confirm Booking'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
