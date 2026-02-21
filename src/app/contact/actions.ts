'use server'

import { createAdminClient } from '@/utils/supabase/admin'

export async function submitContactForm(prevState: any, formData: FormData) {
    const name = (formData.get('name') as string)?.trim()
    const email = (formData.get('email') as string)?.trim()
    const subject = (formData.get('subject') as string)?.trim()
    const message = (formData.get('message') as string)?.trim()

    if (!name || !email || !message) {
        return { error: 'Name, email, and message are required.' }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
        return { error: 'Please enter a valid email address.' }
    }

    if (message.length < 10) {
        return { error: 'Message must be at least 10 characters.' }
    }

    try {
        const admin = createAdminClient()

        const { error } = await admin.from('contact_submissions').insert({
            name,
            email,
            subject: subject || null,
            message,
        })

        if (error) throw error

        return { success: true }
    } catch (error: any) {
        console.error('Contact form error:', error)
        return { error: 'Failed to send message. Please try again or email us directly at sadik5780@gmail.com' }
    }
}
