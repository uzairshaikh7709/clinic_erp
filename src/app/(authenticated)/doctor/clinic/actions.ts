'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { requireDoctorWithClinic } from '@/utils/auth'
import { revalidatePath } from 'next/cache'
import type { ClinicPageData } from '@/types/database'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

export async function updateOrgDetails(formData: FormData) {
    const doctor = await requireDoctorWithClinic()
    const admin = createAdminClient()

    const orgId = formData.get('org_id') as string
    const name = (formData.get('name') as string)?.trim()

    if (!name) throw new Error('Organization name is required')
    if (orgId !== doctor.clinic_id) throw new Error('Unauthorized')

    const { error } = await admin
        .from('organizations')
        .update({
            name,
            address: (formData.get('address') as string)?.trim() || null,
            phone: (formData.get('phone') as string)?.trim() || null,
            email: (formData.get('email') as string)?.trim() || null,
        })
        .eq('id', doctor.clinic_id)

    if (error) throw new Error('Failed to update organization')

    revalidatePath('/doctor/clinic')
}

export async function uploadClinicImage(formData: FormData) {
    const doctor = await requireDoctorWithClinic()
    const admin = createAdminClient()

    const file = formData.get('file') as File
    if (!file || !(file instanceof File)) return { error: 'No file provided' }

    if (!ALLOWED_TYPES.includes(file.type)) return { error: 'Only JPEG, PNG, and WebP images are allowed' }
    if (file.size > MAX_SIZE) return { error: 'Image must be under 5MB' }

    const ext = file.name.split('.').pop() || 'jpg'
    const path = `${doctor.clinic_id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const buffer = Buffer.from(await file.arrayBuffer())

    const { error } = await admin.storage
        .from('clinic-images')
        .upload(path, buffer, { contentType: file.type, upsert: false })

    if (error) return { error: 'Failed to upload image' }

    const { data: urlData } = admin.storage
        .from('clinic-images')
        .getPublicUrl(path)

    return { url: urlData.publicUrl }
}

export async function deleteClinicImage(formData: FormData) {
    const doctor = await requireDoctorWithClinic()
    const admin = createAdminClient()

    const url = formData.get('url') as string
    if (!url) return { error: 'No URL provided' }

    // Extract path from public URL — format: .../clinic-images/clinicId/filename
    const match = url.match(/clinic-images\/(.+)$/)
    if (!match) return { error: 'Invalid image URL' }

    const path = match[1]

    // Ensure the image belongs to this clinic
    if (!path.startsWith(doctor.clinic_id)) return { error: 'Unauthorized' }

    await admin.storage.from('clinic-images').remove([path])
    return { success: true }
}

export async function saveClinicPageData(formData: FormData) {
    const doctor = await requireDoctorWithClinic()
    const admin = createAdminClient()

    // Save logo_url directly on the organizations table
    const logoUrl = (formData.get('logo_url') as string)?.trim() || null
    await admin
        .from('organizations')
        .update({ logo_url: logoUrl })
        .eq('id', doctor.clinic_id)

    const pageData: ClinicPageData = {
        tagline: formData.get('tagline') as string || undefined,
        description_html: formData.get('description_html') as string || undefined,
        services: JSON.parse(formData.get('services') as string || '[]'),
        working_hours: formData.get('working_hours') as string || undefined,
        hero_image_url: formData.get('hero_image_url') as string || undefined,
        hero_image_position: (formData.get('hero_image_position') as ClinicPageData['hero_image_position']) || undefined,
        about_image_url: formData.get('about_image_url') as string || undefined,
        about_image_position: (formData.get('about_image_position') as ClinicPageData['about_image_position']) || undefined,
        gallery_images: JSON.parse(formData.get('gallery_images') as string || '[]'),
    }

    // Clean up empty values
    if (!pageData.tagline) delete pageData.tagline
    if (!pageData.description_html) delete pageData.description_html
    if (!pageData.services?.length) delete pageData.services
    if (!pageData.working_hours) delete pageData.working_hours
    if (!pageData.hero_image_url) delete pageData.hero_image_url
    if (!pageData.hero_image_position) delete pageData.hero_image_position
    if (!pageData.about_image_url) delete pageData.about_image_url
    if (!pageData.about_image_position) delete pageData.about_image_position
    if (!pageData.gallery_images?.length) delete pageData.gallery_images

    const { error } = await admin
        .from('organizations')
        .update({ page_data: pageData })
        .eq('id', doctor.clinic_id)

    if (error) return { error: 'Failed to save clinic page data' }

    revalidatePath('/doctor/clinic')
    revalidatePath(`/clinic/`)
    return { success: true }
}
