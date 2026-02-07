'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    Calendar, User, Phone, CheckCircle, Stethoscope,
    ChevronRight, ChevronLeft, Clock, Loader2
} from 'lucide-react'
import { getAvailableSlots, submitBooking } from './actions'

export default function BookingWizard({ doctors }: { doctors: any[] }) {
    const router = useRouter()

    // Wizard State
    const [step, setStep] = useState(1)
    const [direction, setDirection] = useState('forward')

    // Data State
    const [selectedDoctor, setSelectedDoctor] = useState<any>(null)
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [availableSlots, setAvailableSlots] = useState<string[]>([])
    const [selectedTime, setSelectedTime] = useState<string | null>(null)
    const [guestName, setGuestName] = useState('')
    const [guestPhone, setGuestPhone] = useState('')

    // Loading States
    const [loadingSlots, setLoadingSlots] = useState(false)
    const [booking, setBooking] = useState(false)
    const [success, setSuccess] = useState(false)

    // Load slots when date or doctor changes
    useEffect(() => {
        if (selectedDoctor && date) {
            loadSlots()
        }
    }, [selectedDoctor, date])

    const loadSlots = async () => {
        setLoadingSlots(true)
        setSelectedTime(null)
        try {
            const slots = await getAvailableSlots(selectedDoctor.id, date)
            setAvailableSlots(slots)
        } catch (error) {
            console.error(error)
        } finally {
            setLoadingSlots(false)
        }
    }

    const handleNext = () => {
        setDirection('forward')
        setStep(prev => prev + 1)
    }

    const handleBack = () => {
        setDirection('backward')
        setStep(prev => prev - 1)
    }

    const handleBook = async () => {
        if (!selectedTime || !guestName) return

        setBooking(true)
        try {
            const result = await submitBooking({
                doctorId: selectedDoctor.id,
                date,
                time: selectedTime,
                patientName: guestName,
                patientPhone: guestPhone
            })

            if (result.error) throw new Error(result.error)

            setSuccess(true)
            setStep(4)
        } catch (error: any) {
            alert('Booking failed: ' + error.message)
        } finally {
            setBooking(false)
        }
    }

    // Animation Classes
    const slideClass = direction === 'forward'
        ? 'animate-in slide-in-from-right fade-in duration-300'
        : 'animate-in slide-in-from-left fade-in duration-300'

    if (success) {
        return (
            <div className={`max-w-md mx-auto text-center p-8 bg-white rounded-2xl shadow-lg border border-emerald-100 ${slideClass}`}>
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle size={40} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Booking Confirmed!</h2>
                <p className="text-slate-500 mb-8">
                    Your appointment with <span className="font-semibold text-slate-800">{selectedDoctor?.profiles?.full_name}</span> is set for <span className="font-semibold text-slate-800">{date}</span> at <span className="font-semibold text-slate-800">{selectedTime}</span>.
                </p>
                <button onClick={() => router.push('/')} className="btn btn-primary w-full justify-center">
                    Return Home
                </button>
            </div>
        )
    }

    return (
        <div className="max-w-3xl mx-auto">
            {/* Progress Steps */}
            <div className="flex items-center justify-center mb-8 gap-2 md:gap-4">
                {[1, 2, 3].map((s) => (
                    <div key={s} className="flex items-center">
                        <div className={`
                            w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all
                            ${step >= s ? 'bg-[#0077B6] text-white' : 'bg-slate-100 text-slate-400 border border-slate-200'}
                        `}>
                            {s}
                        </div>
                        {s < 3 && (
                            <div className={`w-8 md:w-16 h-1 mx-2 rounded-full transition-all ${step > s ? 'bg-[#0077B6]' : 'bg-slate-100'}`} />
                        )}
                    </div>
                ))}
            </div>

            {/* Step 1: Select Doctor */}
            {step === 1 && (
                <div className={slideClass}>
                    <h2 className="text-2xl font-bold text-center mb-2">Select a Specialist</h2>
                    <p className="text-slate-500 text-center mb-8">Choose a doctor to check availability</p>

                    <div className="grid md:grid-cols-2 gap-4">
                        {doctors.map((doc: any) => (
                            <button
                                key={doc.id}
                                onClick={() => {
                                    setSelectedDoctor(doc)
                                    handleNext()
                                }}
                                className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-white hover:border-[#0077B6] hover:shadow-md transition-all text-left"
                            >
                                <div className="w-12 h-12 rounded-full bg-blue-50 text-[#0077B6] flex items-center justify-center flex-shrink-0">
                                    <Stethoscope size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">{doc.profiles?.full_name}</h3>
                                    <p className="text-sm text-slate-500">{doc.specialization}</p>
                                </div>
                                <ChevronRight className="ml-auto text-slate-300" size={20} />
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Step 2: Select Date & Time */}
            {step === 2 && (
                <div className={slideClass}>
                    <button
                        onClick={handleBack}
                        className="mb-6 flex items-center text-sm text-slate-500 hover:text-slate-800 transition-colors"
                    >
                        <ChevronLeft size={16} /> Back to Doctors
                    </button>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[#0077B6]">
                                <Stethoscope size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900">{selectedDoctor?.profiles?.full_name}</h3>
                                <p className="text-xs text-slate-500">{selectedDoctor?.specialization}</p>
                            </div>
                        </div>

                        <div className="p-6 md:p-8">
                            {/* Date Picker */}
                            <div className="mb-8">
                                <label className="block text-sm font-medium text-slate-700 mb-2">Select Date</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="date"
                                        className="input pl-10 w-full md:w-auto"
                                        value={date}
                                        onChange={e => setDate(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                </div>
                            </div>

                            {/* Slots */}
                            {loadingSlots ? (
                                <div className="h-40 flex flex-col items-center justify-center text-slate-400">
                                    <Loader2 className="animate-spin mb-2" size={24} />
                                    <p>Checking availability...</p>
                                </div>
                            ) : availableSlots.length === 0 ? (
                                <div className="h-40 flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                    <Clock size={32} className="mb-2 opacity-50" />
                                    <p>No slots available on this date.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                    {availableSlots.map(time => (
                                        <button
                                            key={time}
                                            onClick={() => {
                                                setSelectedTime(time)
                                                handleNext()
                                            }}
                                            className={`
                                                flex items-center justify-center py-3 rounded-lg border text-sm font-medium transition-all
                                                ${selectedTime === time
                                                    ? 'border-[#0077B6] bg-[#0077B6] text-white shadow-md transform scale-105'
                                                    : 'border-slate-200 bg-white hover:border-[#0077B6] hover:bg-blue-50 text-slate-600'
                                                }
                                            `}
                                        >
                                            {time}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Step 3: Guest Details */}
            {step === 3 && (
                <div className={slideClass}>
                    <button
                        onClick={handleBack}
                        className="mb-6 flex items-center text-sm text-slate-500 hover:text-slate-800 transition-colors"
                    >
                        <ChevronLeft size={16} /> Back to Slots
                    </button>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-slate-900">Final Details</h2>
                            <p className="text-slate-500 mt-1">
                                Appointment with <span className="font-semibold text-slate-800">{selectedDoctor?.profiles?.full_name}</span><br />
                                on <span className="font-semibold text-slate-800">{date}</span> at <span className="font-semibold text-slate-800">{selectedTime}</span>
                            </p>
                        </div>

                        <div className="max-w-md mx-auto space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                    <User size={16} className="text-[#0077B6]" /> Full Name
                                </label>
                                <input
                                    type="text"
                                    className="input w-full h-12"
                                    placeholder="Enter your full name"
                                    value={guestName}
                                    onChange={e => setGuestName(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                    <Phone size={16} className="text-[#0077B6]" /> Phone Number
                                </label>
                                <input
                                    type="tel"
                                    className="input w-full h-12"
                                    placeholder="Enter your phone number"
                                    value={guestPhone}
                                    onChange={e => setGuestPhone(e.target.value)}
                                />
                            </div>

                            <button
                                onClick={handleBook}
                                disabled={!guestName || booking}
                                className="btn btn-primary w-full h-12 text-base shadow-lg shadow-blue-500/20 mt-4"
                            >
                                {booking ? <Loader2 className="animate-spin mr-2" /> : 'Confirm Booking'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
