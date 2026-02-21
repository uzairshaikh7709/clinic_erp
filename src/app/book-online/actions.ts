'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath, unstable_noStore } from 'next/cache'

const DEFAULT_START = '10:00'
const DEFAULT_END = '17:00'
const DEFAULT_DURATION = 30

// Existing: fetch slots for a single doctor
export async function getAvailableSlots(doctorId: string, dateStr: string) {
    unstable_noStore()
    const supabase = createAdminClient()

    try {
        const { data: doctor } = await supabase
            .from('doctors')
            .select('clinic_id')
            .eq('id', doctorId)
            .single()

        const clinicId = doctor?.clinic_id
        const selectedDate = new Date(dateStr)
        const dayOfWeek = selectedDate.getDay()

        const { data: slotConfig } = await supabase
            .from('doctor_slots')
            .select('*')
            .eq('doctor_id', doctorId)
            .eq('day_of_week', dayOfWeek)
            .eq('clinic_id', clinicId)
            .single()

        if (slotConfig && !slotConfig.is_active) return []

        let startStr = DEFAULT_START
        let endStr = DEFAULT_END
        let duration = DEFAULT_DURATION

        if (slotConfig) {
            startStr = slotConfig.start_time
            endStr = slotConfig.end_time
            duration = slotConfig.slot_duration
        }

        const generatedSlots: string[] = []
        const [startH, startM] = startStr.split(':').map(Number)
        const [endH, endM] = endStr.split(':').map(Number)
        let currentMins = startH * 60 + startM
        const endMins = endH * 60 + endM

        while (currentMins < endMins) {
            const h = Math.floor(currentMins / 60)
            const m = currentMins % 60
            generatedSlots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`)
            currentMins += duration
        }

        const startOfDay = `${dateStr}T00:00:00`
        const endOfDay = `${dateStr}T23:59:59`

        const { data: appointments } = await supabase
            .from('appointments')
            .select('start_time')
            .eq('doctor_id', doctorId)
            .eq('clinic_id', clinicId)
            .gte('start_time', startOfDay)
            .lte('start_time', endOfDay)
            .neq('status', 'cancelled')

        const bookedTimes = new Set(
            (appointments || []).map((apt: any) => {
                const d = new Date(apt.start_time)
                return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
            })
        )

        const now = new Date()
        const todayStr = now.toISOString().split('T')[0]
        const currentTotalMins = now.getHours() * 60 + now.getMinutes()

        return generatedSlots.filter(slot => {
            if (bookedTimes.has(slot)) return false
            if (dateStr === todayStr) {
                const [h, m] = slot.split(':').map(Number)
                if (h * 60 + m <= currentTotalMins) return false
            }
            return true
        })
    } catch (error) {
        console.error('Error fetching slots:', error)
        return []
    }
}

// New: fetch combined available slots across ALL doctors in a clinic
export async function getAvailableSlotsForClinic(clinicId: string, dateStr: string) {
    unstable_noStore()
    const supabase = createAdminClient()

    try {
        // 1. Get all active doctors in one query
        const { data: doctors } = await supabase
            .from('doctors')
            .select('id')
            .eq('clinic_id', clinicId)

        if (!doctors || doctors.length === 0) return []

        const doctorIds = doctors.map(d => d.id)
        const selectedDate = new Date(dateStr)
        const dayOfWeek = selectedDate.getDay()

        // 2. Batch fetch all slot configs for this day of week (1 query instead of N)
        const { data: slotConfigs } = await supabase
            .from('doctor_slots')
            .select('*')
            .in('doctor_id', doctorIds)
            .eq('day_of_week', dayOfWeek)
            .eq('clinic_id', clinicId)

        const slotConfigMap = new Map(
            (slotConfigs || []).map(sc => [sc.doctor_id, sc])
        )

        // 3. Batch fetch all appointments for these doctors on this date (1 query instead of N)
        const startOfDay = `${dateStr}T00:00:00`
        const endOfDay = `${dateStr}T23:59:59`

        const { data: appointments } = await supabase
            .from('appointments')
            .select('doctor_id, start_time')
            .in('doctor_id', doctorIds)
            .eq('clinic_id', clinicId)
            .gte('start_time', startOfDay)
            .lte('start_time', endOfDay)
            .neq('status', 'cancelled')

        // Group appointments by doctor
        const appointmentsByDoctor = new Map<string, Set<string>>()
        for (const apt of (appointments || [])) {
            const d = new Date(apt.start_time)
            const timeStr = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
            if (!appointmentsByDoctor.has(apt.doctor_id)) {
                appointmentsByDoctor.set(apt.doctor_id, new Set())
            }
            appointmentsByDoctor.get(apt.doctor_id)!.add(timeStr)
        }

        const now = new Date()
        const todayStr = now.toISOString().split('T')[0]
        const currentTotalMins = now.getHours() * 60 + now.getMinutes()

        const allSlots: { time: string; doctorId: string }[] = []

        for (const doc of doctors) {
            const slotConfig = slotConfigMap.get(doc.id)

            if (slotConfig && !slotConfig.is_active) continue

            let startStr = DEFAULT_START
            let endStr = DEFAULT_END
            let duration = DEFAULT_DURATION

            if (slotConfig) {
                startStr = slotConfig.start_time
                endStr = slotConfig.end_time
                duration = slotConfig.slot_duration
            }

            const [startH, startM] = startStr.split(':').map(Number)
            const [endH, endM] = endStr.split(':').map(Number)
            let currentMins = startH * 60 + startM
            const endMins = endH * 60 + endM

            const bookedTimes = appointmentsByDoctor.get(doc.id) || new Set()

            while (currentMins < endMins) {
                const h = Math.floor(currentMins / 60)
                const m = currentMins % 60
                const slot = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
                currentMins += duration

                if (bookedTimes.has(slot)) continue
                if (dateStr === todayStr && h * 60 + m <= currentTotalMins) continue

                allSlots.push({ time: slot, doctorId: doc.id })
            }
        }

        // Sort by time, deduplicate (keep first doctor for each time)
        allSlots.sort((a, b) => a.time.localeCompare(b.time))

        const seen = new Set<string>()
        const uniqueSlots: { time: string; doctorId: string }[] = []
        for (const slot of allSlots) {
            if (!seen.has(slot.time)) {
                seen.add(slot.time)
                uniqueSlots.push(slot)
            }
        }

        return uniqueSlots
    } catch (error) {
        console.error('Error fetching clinic slots:', error)
        return []
    }
}

export async function submitBooking(formData: {
    doctorId: string
    date: string
    time: string
    patientName: string
    patientPhone: string
    patientDob: string
    patientGender: string
    patientAddress?: string
}) {
    const supabase = createAdminClient()
    const { doctorId, date, time, patientName, patientPhone, patientDob, patientGender, patientAddress } = formData

    // Validate phone number
    if (patientPhone) {
        const digits = patientPhone.replace(/[^0-9]/g, '')
        if (digits.length < 10 || digits.length > 15) {
            return { error: 'Phone number must be between 10 and 15 digits' }
        }
    }

    try {
        const { data: doctorRecord } = await supabase
            .from('doctors')
            .select('clinic_id')
            .eq('id', doctorId)
            .single()

        const clinicId = doctorRecord?.clinic_id

        // 1. Find or Create Patient
        let patientId

        const { data: existingPatient } = await supabase
            .from('patients')
            .select('id, phone')
            .eq('full_name', patientName)
            .eq('clinic_id', clinicId)
            .single()

        if (existingPatient) {
            patientId = existingPatient.id
            if (patientPhone && patientPhone !== existingPatient.phone) {
                await supabase.from('patients').update({ phone: patientPhone }).eq('id', patientId)
            }
        } else {
            const { data: newP, error: pErr } = await supabase.from('patients').insert({
                full_name: patientName,
                phone: patientPhone || null,
                dob: patientDob || '1990-01-01',
                gender: patientGender || 'Other',
                address: patientAddress || '',
                registration_number: 'WEB-' + Math.floor(Math.random() * 100000),
                clinic_id: clinicId
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
            .eq('clinic_id', clinicId)
            .single()

        const duration = slotConfig?.slot_duration || DEFAULT_DURATION

        const startTime = `${date}T${time}:00`
        const [hours, minutes] = time.split(':').map(Number)
        const endMinutes = hours * 60 + minutes + duration
        const endHours = Math.floor(endMinutes / 60)
        const endMins = endMinutes % 60
        const endTime = `${date}T${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}:00`

        // 3. Create Appointment (online type)
        const { error } = await supabase.from('appointments').insert({
            doctor_id: doctorId,
            patient_id: patientId,
            start_time: startTime,
            end_time: endTime,
            status: 'booked',
            appointment_type: 'online',
            clinic_id: clinicId
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
