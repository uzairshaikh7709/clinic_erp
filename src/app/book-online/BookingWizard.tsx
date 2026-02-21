'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    Calendar, User, Phone, CheckCircle, MapPin,
    ChevronLeft, Clock, Loader2
} from 'lucide-react'
import { getAvailableSlotsForClinic, submitBooking } from './actions'

type SlotInfo = { time: string; doctorId: string }

export default function BookingWizard({ clinicId, clinicName }: { clinicId: string; clinicName: string }) {
    const router = useRouter()

    const [step, setStep] = useState(1)
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [availableSlots, setAvailableSlots] = useState<SlotInfo[]>([])
    const [selectedSlot, setSelectedSlot] = useState<SlotInfo | null>(null)

    // Patient fields
    const [fullName, setFullName] = useState('')
    const [phone, setPhone] = useState('')
    const [dob, setDob] = useState('')
    const [gender, setGender] = useState('')
    const [address, setAddress] = useState('')

    const [phoneError, setPhoneError] = useState<string | null>(null)

    const [loadingSlots, setLoadingSlots] = useState(false)
    const [booking, setBooking] = useState(false)
    const [success, setSuccess] = useState(false)
    const [bookingError, setBookingError] = useState<string | null>(null)

    const validatePhone = (value: string): boolean => {
        const digits = value.replace(/[^0-9]/g, '')
        if (digits.length < 10) {
            setPhoneError('Phone number must be at least 10 digits')
            return false
        }
        if (digits.length > 15) {
            setPhoneError('Phone number is too long')
            return false
        }
        setPhoneError(null)
        return true
    }

    useEffect(() => {
        if (clinicId && date) loadSlots()
    }, [clinicId, date])

    const loadSlots = async () => {
        setLoadingSlots(true)
        setSelectedSlot(null)
        try {
            const slots = await getAvailableSlotsForClinic(clinicId, date)
            setAvailableSlots(slots)
        } catch (error) {
            console.error(error)
        } finally {
            setLoadingSlots(false)
        }
    }

    const handleNext = () => setStep(prev => prev + 1)
    const handleBack = () => setStep(prev => prev - 1)

    const handleBook = async () => {
        if (!selectedSlot || !fullName || !phone || !dob || !gender) return

        setBooking(true)
        setBookingError(null)
        try {
            const result = await submitBooking({
                doctorId: selectedSlot.doctorId,
                date,
                time: selectedSlot.time,
                patientName: fullName,
                patientPhone: phone,
                patientDob: dob,
                patientGender: gender,
                patientAddress: address || undefined
            })

            if (result.error) throw new Error(result.error)
            setSuccess(true)
            setStep(4)
        } catch (error: any) {
            setBookingError(error.message)
        } finally {
            setBooking(false)
        }
    }

    const slideClass = 'animate-enter'

    if (success) {
        return (
            <div className={`max-w-md mx-auto text-center p-8 bg-white rounded-2xl shadow-lg border border-emerald-100 ${slideClass}`}>
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle size={40} />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">Booking Confirmed!</h2>
                <p className="text-slate-500 mb-8">
                    Your appointment at <span className="font-semibold text-slate-800">{clinicName}</span> is set for <span className="font-semibold text-slate-800">{date}</span> at <span className="font-semibold text-slate-800">{selectedSlot?.time}</span>.
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

            {/* Step 1: Select Date & Time */}
            {step === 1 && (
                <div className={slideClass}>
                    <h2 className="text-xl sm:text-2xl font-bold text-center mb-1">
                        Book at {clinicName}
                    </h2>
                    <p className="text-slate-500 text-center mb-8">Pick a date and time for your appointment</p>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
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
                                    {availableSlots.map(slot => (
                                        <button
                                            key={slot.time}
                                            onClick={() => {
                                                setSelectedSlot(slot)
                                                handleNext()
                                            }}
                                            className="flex items-center justify-center py-3 rounded-lg border text-sm font-medium transition-all border-slate-200 bg-white hover:border-[#0077B6] hover:bg-blue-50 text-slate-600"
                                        >
                                            {slot.time}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Step 2: Patient Details */}
            {step === 2 && (
                <div className={slideClass}>
                    <button
                        onClick={handleBack}
                        className="mb-6 flex items-center text-sm text-slate-500 hover:text-slate-800 transition-colors"
                    >
                        <ChevronLeft size={16} /> Back to Slots
                    </button>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
                        <div className="text-center mb-6">
                            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Your Details</h2>
                            <p className="text-slate-500 mt-1 text-sm">
                                {clinicName} &mdash; {date} at {selectedSlot?.time}
                            </p>
                        </div>

                        <div className="max-w-md mx-auto space-y-4">
                            <div>
                                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-1.5">
                                    <User size={15} className="text-[#0077B6]" /> Full Name *
                                </label>
                                <input
                                    type="text"
                                    className="input w-full"
                                    placeholder="Enter your full name"
                                    value={fullName}
                                    onChange={e => setFullName(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-1.5">
                                    <Phone size={15} className="text-[#0077B6]" /> Phone Number *
                                </label>
                                <input
                                    type="tel"
                                    className={`input w-full ${phoneError ? 'border-red-300 focus:border-red-400' : ''}`}
                                    placeholder="e.g. +91 98765 43210"
                                    value={phone}
                                    onChange={e => {
                                        setPhone(e.target.value)
                                        if (phoneError) validatePhone(e.target.value)
                                    }}
                                    onBlur={() => phone && validatePhone(phone)}
                                    required
                                />
                                {phoneError && (
                                    <p className="text-xs text-red-500 mt-1">{phoneError}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Date of Birth *</label>
                                    <input
                                        type="date"
                                        className="input w-full"
                                        value={dob}
                                        onChange={e => setDob(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Gender *</label>
                                    <select
                                        className="select w-full"
                                        value={gender}
                                        onChange={e => setGender(e.target.value)}
                                        required
                                    >
                                        <option value="">Select...</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-1.5">
                                    <MapPin size={15} className="text-[#0077B6]" /> Address
                                </label>
                                <input
                                    type="text"
                                    className="input w-full"
                                    placeholder="Your address"
                                    required
                                    value={address}
                                    onChange={e => setAddress(e.target.value)}
                                />
                            </div>

                            <button
                                onClick={() => {
                                    if (!validatePhone(phone)) return
                                    handleNext()
                                }}
                                disabled={!fullName || !phone || !dob || !gender || !address || !!phoneError}
                                className="btn btn-primary w-full h-11 text-sm mt-2"
                            >
                                Review & Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Step 3: Confirm */}
            {step === 3 && (
                <div className={slideClass}>
                    <button
                        onClick={handleBack}
                        className="mb-6 flex items-center text-sm text-slate-500 hover:text-slate-800 transition-colors"
                    >
                        <ChevronLeft size={16} /> Back to Details
                    </button>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
                        <div className="text-center mb-6">
                            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Confirm Booking</h2>
                            <p className="text-slate-500 mt-1 text-sm">Please review your appointment details</p>
                        </div>

                        <div className="max-w-md mx-auto space-y-4">
                            {/* Appointment summary */}
                            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Clinic</span>
                                    <span className="font-semibold text-slate-800">{clinicName}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Date</span>
                                    <span className="font-semibold text-slate-800">{date}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Time</span>
                                    <span className="font-semibold text-slate-800">{selectedSlot?.time}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Type</span>
                                    <span className="font-semibold text-blue-700">Online Appointment</span>
                                </div>
                            </div>

                            {/* Patient summary */}
                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Name</span>
                                    <span className="font-semibold text-slate-800">{fullName}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Phone</span>
                                    <span className="font-semibold text-slate-800">{phone}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">DOB</span>
                                    <span className="font-semibold text-slate-800">{dob}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Gender</span>
                                    <span className="font-semibold text-slate-800">{gender}</span>
                                </div>
                                {address && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Address</span>
                                        <span className="font-semibold text-slate-800">{address}</span>
                                    </div>
                                )}
                            </div>

                            {bookingError && (
                                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{bookingError}</p>
                            )}

                            <button
                                onClick={handleBook}
                                disabled={booking}
                                className="btn btn-primary w-full h-12 text-base shadow-lg shadow-blue-500/20"
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
