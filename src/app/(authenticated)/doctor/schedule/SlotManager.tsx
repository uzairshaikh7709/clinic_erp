'use client'

import { useState } from 'react'
import { saveDoctorSlots } from './actions'
import { Loader2, Save, Clock } from 'lucide-react'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function SlotManager({ doctorId, initialSlots }: { doctorId: string, initialSlots: any[] }) {
    // Merge initial slots with defaults for missing days
    const merged = DAYS.map((day, index) => {
        const existing = initialSlots.find(s => s.day_of_week === index)
        return existing || {
            day_of_week: index,
            start_time: '10:00:00',
            end_time: '17:00:00',
            slot_duration: 30,
            is_active: false // Default inactive for safety
        }
    })

    const [slots, setSlots] = useState(merged)
    const [saving, setSaving] = useState(false)

    const handleChange = (index: number, field: string, value: any) => {
        const newSlots = [...slots]
        newSlots[index] = { ...newSlots[index], [field]: value }
        setSlots(newSlots)
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const res = await saveDoctorSlots(doctorId, slots)
            if (res.error) alert('Error saving: ' + res.error)
            else alert('Schedule saved successfully!')
        } catch (e: any) {
            alert('Error: ' + e.message)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                    <h2 className="font-bold text-lg text-slate-800">Weekly Schedule</h2>
                    <p className="text-sm text-slate-500">Configure your availability for each day.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="btn btn-primary"
                >
                    {saving ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save className="mr-2" size={18} />}
                    Save Changes
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4 w-40">Day</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Start Time</th>
                            <th className="px-6 py-4">End Time</th>
                            <th className="px-6 py-4">Duration (min)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {slots.map((slot, i) => (
                            <tr key={i} className={`hover:bg-slate-50 transition-colors ${!slot.is_active ? 'opacity-60 bg-slate-50/50' : ''}`}>
                                <td className="px-6 py-4 font-bold text-slate-700">
                                    {DAYS[i]}
                                </td>
                                <td className="px-6 py-4">
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
                                <td className="px-6 py-4">
                                    <input
                                        type="time"
                                        className="input input-sm input-bordered w-32"
                                        value={slot.start_time?.slice(0, 5)}
                                        onChange={e => handleChange(i, 'start_time', e.target.value + ':00')}
                                        disabled={!slot.is_active}
                                    />
                                </td>
                                <td className="px-6 py-4">
                                    <input
                                        type="time"
                                        className="input input-sm input-bordered w-32"
                                        value={slot.end_time?.slice(0, 5)}
                                        onChange={e => handleChange(i, 'end_time', e.target.value + ':00')}
                                        disabled={!slot.is_active}
                                    />
                                </td>
                                <td className="px-6 py-4">
                                    <select
                                        className="select select-sm select-bordered w-32"
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
