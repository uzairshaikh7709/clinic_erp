'use client'

import { useState } from 'react'
import { saveDoctorSlots } from './actions'
import { Loader2, Save, Clock } from 'lucide-react'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function SlotManager({ doctorId, initialSlots }: { doctorId: string, initialSlots: any[] }) {
    const merged = DAYS.map((day, index) => {
        const existing = initialSlots.find(s => s.day_of_week === index)
        return existing || {
            day_of_week: index,
            start_time: '10:00:00',
            end_time: '17:00:00',
            slot_duration: 30,
            is_active: false
        }
    })

    const [slots, setSlots] = useState(merged)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [saved, setSaved] = useState(false)

    const handleChange = (index: number, field: string, value: any) => {
        const newSlots = [...slots]
        newSlots[index] = { ...newSlots[index], [field]: value }
        setSlots(newSlots)
    }

    const handleSave = async () => {
        setSaving(true)
        setError(null)
        setSaved(false)
        try {
            const res = await saveDoctorSlots(doctorId, slots)
            if (res.error) {
                setError(res.error)
            } else {
                setSaved(true)
            }
        } catch (e: any) {
            setError(e.message)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/50">
                <div>
                    <h2 className="font-bold text-base sm:text-lg text-slate-800">Weekly Schedule</h2>
                    <p className="text-xs sm:text-sm text-slate-500">Configure your availability for each day.</p>
                    {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
                    {saved && <p className="text-sm text-emerald-600 mt-1">Schedule saved successfully!</p>}
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="btn btn-primary text-sm w-full sm:w-auto"
                >
                    {saving ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save className="mr-2" size={16} />}
                    Save Changes
                </button>
            </div>

            {/* Mobile: card layout */}
            <div className="md:hidden divide-y divide-slate-100">
                {slots.map((slot, i) => (
                    <div key={i} className={`p-4 space-y-3 ${!slot.is_active ? 'opacity-60 bg-slate-50/50' : ''}`}>
                        <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-700">{DAYS[i]}</span>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="toggle toggle-primary toggle-sm"
                                    checked={slot.is_active}
                                    onChange={e => handleChange(i, 'is_active', e.target.checked)}
                                />
                                <span className="text-xs font-medium text-slate-600">{slot.is_active ? 'Active' : 'Off'}</span>
                            </label>
                        </div>
                        {slot.is_active && (
                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <label className="text-[10px] font-medium text-slate-400 uppercase">Start</label>
                                    <input
                                        type="time"
                                        className="input h-9 w-full text-sm"
                                        value={slot.start_time?.slice(0, 5)}
                                        onChange={e => handleChange(i, 'start_time', e.target.value + ':00')}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-medium text-slate-400 uppercase">End</label>
                                    <input
                                        type="time"
                                        className="input h-9 w-full text-sm"
                                        value={slot.end_time?.slice(0, 5)}
                                        onChange={e => handleChange(i, 'end_time', e.target.value + ':00')}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-medium text-slate-400 uppercase">Duration</label>
                                    <select
                                        className="input h-9 w-full text-sm"
                                        value={slot.slot_duration}
                                        onChange={e => handleChange(i, 'slot_duration', parseInt(e.target.value))}
                                    >
                                        <option value={15}>15m</option>
                                        <option value={30}>30m</option>
                                        <option value={45}>45m</option>
                                        <option value={60}>60m</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Desktop: table layout */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                        <tr>
                            <th className="px-4 lg:px-6 py-3">Day</th>
                            <th className="px-4 lg:px-6 py-3">Status</th>
                            <th className="px-4 lg:px-6 py-3">Start Time</th>
                            <th className="px-4 lg:px-6 py-3">End Time</th>
                            <th className="px-4 lg:px-6 py-3">Duration (min)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {slots.map((slot, i) => (
                            <tr key={i} className={`hover:bg-slate-50 transition-colors ${!slot.is_active ? 'opacity-60 bg-slate-50/50' : ''}`}>
                                <td className="px-4 lg:px-6 py-3 font-bold text-slate-700">
                                    {DAYS[i]}
                                </td>
                                <td className="px-4 lg:px-6 py-3">
                                    <label className="toggle-switch flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="toggle toggle-primary toggle-sm"
                                            checked={slot.is_active}
                                            onChange={e => handleChange(i, 'is_active', e.target.checked)}
                                        />
                                        <span className="text-xs font-medium text-slate-600">{slot.is_active ? 'Active' : 'Off'}</span>
                                    </label>
                                </td>
                                <td className="px-4 lg:px-6 py-3">
                                    <input
                                        type="time"
                                        className="input h-9 w-28"
                                        value={slot.start_time?.slice(0, 5)}
                                        onChange={e => handleChange(i, 'start_time', e.target.value + ':00')}
                                        disabled={!slot.is_active}
                                    />
                                </td>
                                <td className="px-4 lg:px-6 py-3">
                                    <input
                                        type="time"
                                        className="input h-9 w-28"
                                        value={slot.end_time?.slice(0, 5)}
                                        onChange={e => handleChange(i, 'end_time', e.target.value + ':00')}
                                        disabled={!slot.is_active}
                                    />
                                </td>
                                <td className="px-4 lg:px-6 py-3">
                                    <select
                                        className="input h-9 w-28"
                                        value={slot.slot_duration}
                                        onChange={e => handleChange(i, 'slot_duration', parseInt(e.target.value))}
                                        disabled={!slot.is_active}
                                    >
                                        <option value={15}>15 mins</option>
                                        <option value={30}>30 mins</option>
                                        <option value={45}>45 mins</option>
                                        <option value={60}>60 mins</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
