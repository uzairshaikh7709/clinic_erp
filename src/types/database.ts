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

export type OrgType = 'clinic' | 'pharmacy'

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
    pharmacy_enabled: boolean
    org_type: OrgType
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
    pharmacy_enabled: boolean
    org_type: OrgType
}

// ── Pharmacy Module Types ──

export type Pharmacy = {
    id: string
    organization_id: string
    name: string
    license_number: string | null
    created_at: string
    updated_at: string
}

export type Medicine = {
    id: string
    organization_id: string
    name: string
    generic_name: string | null
    category: string | null
    manufacturer: string | null
    unit: string
    low_stock_threshold: number
    gst_rate: number
    hsn_code: string | null
    is_active: boolean
    created_at: string
    updated_at: string
}

export type MedicineBatch = {
    id: string
    medicine_id: string
    organization_id: string
    batch_number: string
    expiry_date: string
    quantity_received: number
    quantity_remaining: number
    purchase_price: number | null
    selling_price: number | null
    mrp: number | null
    supplier_id: string | null
    purchase_item_id: string | null
    received_at: string
    created_at: string
}

export type StockMovementType = 'stock_in' | 'stock_out' | 'adjustment' | 'expired' | 'returned'

export type StockMovement = {
    id: string
    organization_id: string
    medicine_id: string
    batch_id: string | null
    movement_type: StockMovementType
    quantity: number
    reason: string | null
    performed_by: string | null
    reference_type: string | null
    reference_id: string | null
    created_at: string
}

export type MedicineWithStock = Medicine & {
    total_stock: number
    earliest_expiry: string | null
    batch_count: number
}

export type StockMovementWithDetails = StockMovement & {
    medicine_name?: string
    batch_number?: string
    performed_by_name?: string
}

// ── Phase 2: Invoice & Dispensing Types ──

export type DispensingStatus = 'pending' | 'dispensed' | 'partial' | 'cancelled'

export type Invoice = {
    id: string
    organization_id: string
    prescription_id: string | null
    invoice_number: string
    patient_name: string
    patient_id: string | null
    doctor_name: string | null
    subtotal: number
    discount: number
    tax_total: number
    grand_total: number
    payment_status: 'unpaid' | 'paid' | 'partial'
    notes: string | null
    created_by: string | null
    created_at: string
}

export type InvoiceItem = {
    id: string
    invoice_id: string
    medicine_id: string | null
    medicine_name: string
    batch_number: string | null
    expiry_date: string | null
    quantity: number
    unit_price: number
    gst_rate: number
    line_total: number
    tax_amount: number
    created_at: string
}

export type PaymentMethod = 'cash' | 'card' | 'upi' | 'bank_transfer' | 'other'

export type Payment = {
    id: string
    invoice_id: string
    organization_id: string
    amount: number
    payment_method: PaymentMethod
    reference_number: string | null
    received_by: string | null
    created_at: string
}

export type PharmacyAuditLog = {
    id: string
    organization_id: string
    action: string
    entity_type: string
    entity_id: string | null
    details: any
    performed_by: string | null
    created_at: string
}

// ── Phase 1 Enterprise: Suppliers, Purchases, Returns ──

export type Supplier = {
    id: string
    organization_id: string
    name: string
    contact_person: string | null
    phone: string | null
    email: string | null
    gstin: string | null
    drug_license_no: string | null
    address: string | null
    city: string | null
    state: string | null
    pincode: string | null
    payment_terms: string
    is_active: boolean
    created_at: string
    updated_at: string
}

export type PurchaseStatus = 'draft' | 'ordered' | 'partial' | 'received' | 'cancelled'

export type Purchase = {
    id: string
    organization_id: string
    supplier_id: string
    purchase_number: string
    status: PurchaseStatus
    purchase_date: string
    received_date: string | null
    invoice_number: string | null
    invoice_date: string | null
    subtotal: number
    discount: number
    tax_total: number
    grand_total: number
    amount_paid: number
    payment_status: 'unpaid' | 'partial' | 'paid'
    notes: string | null
    created_by: string | null
    created_at: string
    updated_at: string
}

export type PurchaseItem = {
    id: string
    purchase_id: string
    organization_id: string
    medicine_id: string
    batch_id: string | null
    batch_number: string
    expiry_date: string
    quantity_ordered: number
    quantity_received: number
    free_quantity: number
    purchase_price: number
    selling_price: number
    mrp: number | null
    gst_rate: number
    discount_pct: number
    line_total: number
    tax_amount: number
    created_at: string
}

export type PurchaseReturnStatus = 'draft' | 'submitted' | 'accepted' | 'settled'

export type PurchaseReturn = {
    id: string
    organization_id: string
    purchase_id: string | null
    supplier_id: string
    return_number: string
    status: PurchaseReturnStatus
    return_date: string
    reason: string
    subtotal: number
    tax_total: number
    grand_total: number
    credit_note_number: string | null
    notes: string | null
    created_by: string | null
    created_at: string
    updated_at: string
}

export type PurchaseReturnItem = {
    id: string
    return_id: string
    organization_id: string
    medicine_id: string
    batch_id: string
    quantity: number
    purchase_price: number
    gst_rate: number
    line_total: number
    tax_amount: number
    reason: string | null
    created_at: string
}

export type SupplierLedger = {
    supplier_id: string
    organization_id: string
    supplier_name: string
    gstin: string | null
    phone: string | null
    total_purchases: number
    total_purchase_amount: number
    total_paid: number
    outstanding_balance: number
    total_return_amount: number
    last_purchase_date: string | null
}

export type ExpiryReportItem = {
    medicine_id: string
    medicine_name: string
    generic_name: string | null
    batch_id: string
    batch_number: string
    expiry_date: string
    days_to_expiry: number
    quantity_remaining: number
    purchase_price: number | null
    selling_price: number | null
    cost_value: number
    expiry_band: string
}

export type DeadStockItem = {
    medicine_id: string
    medicine_name: string
    generic_name: string | null
    category: string | null
    total_stock: number
    batch_count: number
    last_movement_date: string | null
    days_since_movement: number
    stock_cost_value: number
    stock_selling_value: number
}

export type MovementAnalysisItem = {
    medicine_id: string
    medicine_name: string
    generic_name: string | null
    category: string | null
    current_stock: number
    total_sold: number
    total_purchased: number
    movement_velocity: number
    classification: 'fast' | 'moderate' | 'slow' | 'dead'
}

export type StockValuationSummary = {
    total_cost_value: number
    total_selling_value: number
    total_mrp_value: number
    total_items: number
    total_batches: number
    expired_cost_value: number
    expiring_30_cost_value: number
}
