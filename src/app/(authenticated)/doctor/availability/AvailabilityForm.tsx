'use client'

import { useState } from 'react'
import { Clock, Save, Loader2 } from 'lucide-react'
import { saveAvailability } from './actions'
import { useRouter } from 'next/navigation'

export default function AvailabilityForm({ existingDays, existingStartTime, existingEndTime, existingDuration }: any) {
    const router = useRouter()
    const [selectedDays, setSelectedDays] = useState<number[]>(existingDays)
    const [startTime, setStartTime] = useState(existingStartTime)
    const [endTime, setEndTime] = useState(existingEndTime)
    const [duration, setDuration] = useState(existingDuration)
    const [saving, setSaving] = useState(false)

    const days = [
        { name: 'Mon', value: 1 },
        { name: 'Tue', value: 2 },
        { name: 'Wed', value: 3 },
        { name: 'Thu', value: 4 },
        { name: 'Fri', value: 5 },
        { name: 'Sat', value: 6 },
        { name: 'Sun', value: 0 }
    ]

    const toggleDay = (day: number) => {
        if (selectedDays.includes(day)) {
            setSelectedDays(selectedDays.filter(d => d !== day))
        } else {
            setSelectedDays([...selectedDays, day])
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        const formData = new FormData()
        selectedDays.forEach(day => formData.append('days', day.toString()))
        formData.append('start_time', startTime)
        formData.append('end_time', endTime)
        formData.append('slot_duration', duration.toString())

        const result = await saveAvailability(formData)

        if (result.error) {
            alert('Error saving: ' + result.error)
        } else {
            alert('Availability saved successfully!')
            router.refresh()
        }

        setSaving(false)
    }

    return (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 max-w-2xl">
            <div className="space-y-6">
                <div className="flex items-start gap-4">
                    <div className="w-32 font-medium text-slate-700 pt-2">Working Days</div>
                    <div className="flex gap-2 flex-wrap">
                        {days.map(day => (
                            <button
                                key={day.value}
                                type="button"
                                onClick={() => toggleDay(day.value)}
                                className={`w-10 h-10 rounded-full text-sm font-medium transition-colors ${selectedDays.includes(day.value)
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-100 text-slate-400'
                                    }`}
                            >
                                {day.name[0]}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="w-32 font-medium text-slate-700">Working Hours</div>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="time"
                                value={startTime}
                                onChange={e => setStartTime(e.target.value)}
                                className="input pl-10 w-32"
                                required
                            />
                        </div>
                        <span className="text-slate-400">to</span>
                        <div className="relative">
                            <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="time"
                                value={endTime}
                                onChange={e => setEndTime(e.target.value)}
                                className="input pl-10 w-32"
                                required
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="w-32 font-medium text-slate-700">Slot Duration</div>
                    <select
                        className="input w-48"
                        value={duration}
                        onChange={e => setDuration(parseInt(e.target.value))}
                        required
                    >
                        <option value="10">10 minutes</option>
                        <option value="15">15 minutes</option>
                        <option value="20">20 minutes</option>
                        <option value="30">30 minutes</option>
                    </select>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <button
                        type="submit"
                        disabled={saving || selectedDays.length === 0}
                        className="btn btn-primary shadow-lg shadow-blue-500/20"
                    >
                        {saving ? (
                            <><Loader2 size={18} className="mr-2 animate-spin" /> Saving...</>
                        ) : (
                            <><Save size={18} className="mr-2" /> Save Changes</>
                        )}
                    </button>
                </div>
            </div>
        </form>
    )
}
