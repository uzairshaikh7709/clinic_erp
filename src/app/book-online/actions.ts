'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath, unstable_noStore } from 'next/cache'

const DEFAULT_START = '10:00'
const DEFAULT_END = '17:00'
const DEFAULT_DURATION = 30

export async function getAvailableSlots(doctorId: string, dateStr: string) {
    unstable_noStore()
    const supabase = createAdminClient()

    try {
        const selectedDate = new Date(dateStr)
        const dayOfWeek = selectedDate.getDay() // 0 = Sunday, 1 = Monday...

        // 1. Fetch Doctor's Schedule Configuration
        // Default to inactive if no specific slot config found?
        // Or default to 10-5 if no config? The user implies "if doctor did not activated... make it visible" 
        // Wait, "if doctor did not activated ... make it visible" -> This usually means "Show default if nothing set".
        // But the previous logic was: if `slots` found use it, else default.
        // Let's stick to: Use config if exists, else Default.

        const { data: slotConfig } = await supabase
            .from('doctor_slots')
            .select('*')
            .eq('doctor_id', doctorId)
            .eq('day_of_week', dayOfWeek)
            .single()

        // If config exists and is NOT active, return empty
        if (slotConfig && !slotConfig.is_active) {
            return []
        }

        let startStr = DEFAULT_START
        let endStr = DEFAULT_END
        let duration = DEFAULT_DURATION

        if (slotConfig) {
            startStr = slotConfig.start_time
            endStr = slotConfig.end_time
            duration = slotConfig.slot_duration
        }

        // 2. Generate Candidate Slots
        const generatedSlots: string[] = []
        const [startH, startM] = startStr.split(':').map(Number)
        const [endH, endM] = endStr.split(':').map(Number)

        let currentMins = startH * 60 + startM
        const endMins = endH * 60 + endM

        // Generate until slot start + duration <= end time? or just start < end?
        // Usually start < end.
        while (currentMins < endMins) {
            const h = Math.floor(currentMins / 60)
            const m = currentMins % 60
            const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
            generatedSlots.push(timeStr)
            currentMins += duration
        }

        // 3. Filter Booked Appointments
        const startOfDay = `${dateStr}T00:00:00`
        const endOfDay = `${dateStr}T23:59:59`

        const { data: appointments } = await supabase
            .from('appointments')
            .select('start_time')
            .eq('doctor_id', doctorId)
            .gte('start_time', startOfDay)
            .lte('start_time', endOfDay)
            .neq('status', 'cancelled') // Cancelled slots should probably be free again

        const bookedTimes = new Set(
            (appointments || []).map((apt: any) => {
                const d = new Date(apt.start_time)
                return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
            })
        )

        // 4. Filter Past Slots (if Today)
        const now = new Date()
        const todayStr = now.toISOString().split('T')[0]
        const currentTotalMins = now.getHours() * 60 + now.getMinutes()

        return generatedSlots.filter(slot => {
            // Check if booked
            if (bookedTimes.has(slot)) return false

            // Check if past (only if selecting today)
            if (dateStr === todayStr) {
                const [h, m] = slot.split(':').map(Number)
                const slotMins = h * 60 + m
                // Ensure there's a small buffer? (e.g. can't book 1 min ago). 
                // Simple < is fine.
                if (slotMins <= currentTotalMins) return false
            }

            return true
        })

    } catch (error) {
        console.error('Error fetching slots:', error)
        return []
    }
}

export async function submitBooking(formData: any) {
    const supabase = createAdminClient()
    const { doctorId, date, time, patientName, patientPhone } = formData

    try {
        // 1. Find or Create Patient
        let patientId

        const { data: existingPatient } = await supabase
            .from('patients')
            .select('id')
            .eq('full_name', patientName)
            .single()

        if (existingPatient) {
            patientId = existingPatient.id
        } else {
            const { data: newP, error: pErr } = await supabase.from('patients').insert({
                full_name: patientName,
                dob: '1990-01-01', // Default
                gender: 'Other', // Default
                address: 'Online Booking',
                registration_number: 'WEB-' + Math.floor(Math.random() * 100000)
            }).select().single()

            if (pErr) throw pErr
            patientId = newP.id
        }

        // 2. Calculate End Time
        const selectedDate = new Date(date)
        const dayOfWeek = selectedDate.getDay()

        const { data: slotConfig } = await supabase
            .from('doctor_slots')
            .select('slot_duration')
            .eq('doctor_id', doctorId)
            .eq('day_of_week', dayOfWeek)
            .eq('is_active', true)
            .single()

        const duration = slotConfig?.slot_duration || DEFAULT_DURATION

        const startTime = `${date}T${time}:00`
        const [hours, minutes] = time.split(':').map(Number)
        const endMinutes = hours * 60 + minutes + duration
        const endHours = Math.floor(endMinutes / 60)
        const endMins = endMinutes % 60
        const endTime = `${date}T${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}:00`

        // 3. Create Appointment
        const { error } = await supabase.from('appointments').insert({
            doctor_id: doctorId,
            patient_id: patientId,
            start_time: startTime,
            end_time: endTime,
            status: 'booked'
        })

        if (error) throw error

        revalidatePath('/doctor/appointments')
        revalidatePath('/doctor/dashboard')
        return { success: true }

    } catch (error: any) {
        console.error('Booking error:', error)
        return { error: error.message || 'Failed to book appointment' }
    }
}
