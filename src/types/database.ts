export type ClinicPageData = {
    tagline?: string
    description?: string
    description_html?: string
    services?: string[]
    working_hours?: string
    hero_image_url?: string
    hero_image_position?: 'top' | 'center' | 'bottom'
    about_image_url?: string
    about_image_position?: 'left' | 'right'
    gallery_images?: string[]
}

export type Organization = {
    id: string
    name: string
    slug: string
    address: string | null
    phone: string | null
    email: string | null
    logo_url: string | null
    owner_profile_id: string | null
    is_active: boolean
    page_data: ClinicPageData
    created_at: string
    updated_at: string
}

export type UserProfile = {
    id: string
    email: string
    role: 'superadmin' | 'doctor' | 'assistant'
    full_name: string | null
    is_active: boolean
    clinic_id: string | null
    clinic_name: string | null
    created_at: string
    // Enriched: resolved from doctors/assistants table to avoid extra queries
    doctor_id: string | null
    assistant_id: string | null
    assigned_doctor_id: string | null  // for assistants: the doctor they're assigned to
    is_clinic_owner: boolean
}
