'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { getUserProfile } from '@/utils/auth'
import { revalidatePath } from 'next/cache'

const PAGE_SIZE = 20

// ── Guard ──

async function requirePharmacyAccess() {
    const profile = await getUserProfile()
    if (!profile) throw new Error('Not authenticated')

    const isAssistant = profile.role === 'assistant'
    const isOwnerDoctor = profile.role === 'doctor' && profile.is_clinic_owner

    if (!isAssistant && !isOwnerDoctor) {
        throw new Error('Unauthorized')
    }

    const clinicId = profile.clinic_id
    if (!clinicId) throw new Error('No clinic assigned')

    const admin = createAdminClient()
    const { data: org } = await admin
        .from('organizations')
        .select('pharmacy_enabled')
        .eq('id', clinicId)
        .single()

    if (!org?.pharmacy_enabled) {
        throw new Error('Pharmacy module is not enabled for this organization.')
    }

    return { profile, clinicId, admin }
}

// ── Medicine CRUD ──

export async function createMedicine(formData: FormData) {
    const { clinicId, admin } = await requirePharmacyAccess()

    const name = (formData.get('name') as string)?.trim()
    const generic_name = (formData.get('generic_name') as string)?.trim() || null
    const category = (formData.get('category') as string) || null
    const manufacturer = (formData.get('manufacturer') as string)?.trim() || null
    const unit = (formData.get('unit') as string) || 'pcs'
    const low_stock_threshold = parseInt(formData.get('low_stock_threshold') as string) || 10

    if (!name) return { error: 'Medicine name is required.' }

    try {
        const { data, error } = await admin
            .from('medicines')
            .insert({
                organization_id: clinicId,
                name,
                generic_name,
                category,
                manufacturer,
                unit,
                low_stock_threshold,
            })
            .select('id')
            .single()

        if (error) throw error

        revalidatePath('/pharmacy/medicines')
        return { success: true, medicineId: data.id }
    } catch (error: any) {
        return { error: error.message || 'Failed to create medicine.' }
    }
}

export async function updateMedicine(formData: FormData) {
    const { clinicId, admin } = await requirePharmacyAccess()

    const id = formData.get('id') as string
    const name = (formData.get('name') as string)?.trim()
    const generic_name = (formData.get('generic_name') as string)?.trim() || null
    const category = (formData.get('category') as string) || null
    const manufacturer = (formData.get('manufacturer') as string)?.trim() || null
    const unit = (formData.get('unit') as string) || 'pcs'
    const low_stock_threshold = parseInt(formData.get('low_stock_threshold') as string) || 10

    if (!id || !name) return { error: 'Medicine ID and name are required.' }

    try {
        const { error } = await admin
            .from('medicines')
            .update({
                name,
                generic_name,
                category,
                manufacturer,
                unit,
                low_stock_threshold,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .eq('organization_id', clinicId)

        if (error) throw error

        revalidatePath('/pharmacy/medicines')
        revalidatePath(`/pharmacy/medicines/${id}`)
        return { success: true }
    } catch (error: any) {
        return { error: error.message || 'Failed to update medicine.' }
    }
}

export async function deleteMedicine(medicineId: string) {
    const { clinicId, admin, profile } = await requirePharmacyAccess()

    try {
        // Check for remaining stock
        const { data: batches } = await admin
            .from('medicine_batches')
            .select('quantity_remaining')
            .eq('medicine_id', medicineId)
            .eq('organization_id', clinicId)
            .gt('quantity_remaining', 0)
            .limit(1)

        if (batches && batches.length > 0) {
            return { error: 'Cannot delete medicine with remaining stock. Adjust stock to zero first.' }
        }

        const { error } = await admin
            .from('medicines')
            .delete()
            .eq('id', medicineId)
            .eq('organization_id', clinicId)

        if (error) throw error

        // Audit
        await logAudit(admin, clinicId, 'medicine_delete', 'medicine', medicineId, {}, profile.id)

        revalidatePath('/pharmacy/medicines')
        revalidatePath('/pharmacy/dashboard')
        return { success: true }
    } catch (error: any) {
        return { error: error.message || 'Failed to delete medicine.' }
    }
}

export async function toggleMedicineActive(medicineId: string, isActive: boolean) {
    const { clinicId, admin } = await requirePharmacyAccess()

    try {
        const { error } = await admin
            .from('medicines')
            .update({ is_active: isActive, updated_at: new Date().toISOString() })
            .eq('id', medicineId)
            .eq('organization_id', clinicId)

        if (error) throw error

        revalidatePath('/pharmacy/medicines')
        revalidatePath(`/pharmacy/medicines/${medicineId}`)
        return { success: true }
    } catch (error: any) {
        return { error: error.message || 'Failed to update medicine.' }
    }
}

// ── Stock In ──

export async function stockIn(formData: FormData) {
    const { clinicId, admin, profile } = await requirePharmacyAccess()

    const medicine_id = formData.get('medicine_id') as string
    const batch_number = (formData.get('batch_number') as string)?.trim()
    const expiry_date = formData.get('expiry_date') as string
    const quantity = parseInt(formData.get('quantity') as string)
    const purchase_price = formData.get('purchase_price') ? parseFloat(formData.get('purchase_price') as string) : null
    const selling_price = formData.get('selling_price') ? parseFloat(formData.get('selling_price') as string) : null

    if (!medicine_id || !batch_number || !expiry_date || !quantity || quantity <= 0) {
        return { error: 'All fields are required. Quantity must be positive.' }
    }

    try {
        // Create batch
        const { data: batch, error: batchError } = await admin
            .from('medicine_batches')
            .insert({
                medicine_id,
                organization_id: clinicId,
                batch_number,
                expiry_date,
                quantity_received: quantity,
                quantity_remaining: quantity,
                purchase_price,
                selling_price,
            })
            .select('id')
            .single()

        if (batchError) throw batchError

        // Create movement record
        const { error: moveError } = await admin
            .from('stock_movements')
            .insert({
                organization_id: clinicId,
                medicine_id,
                batch_id: batch.id,
                movement_type: 'stock_in',
                quantity,
                reason: `Received batch ${batch_number}`,
                performed_by: profile.id,
            })

        if (moveError) throw moveError

        // Audit
        await logAudit(admin, clinicId, 'stock_in', 'batch', batch.id, {
            medicine_id, batch_number, quantity, expiry_date,
        }, profile.id)

        revalidatePath('/pharmacy')
        revalidatePath('/pharmacy/dashboard')
        revalidatePath(`/pharmacy/medicines/${medicine_id}`)
        revalidatePath('/pharmacy/movements')
        return { success: true }
    } catch (error: any) {
        return { error: error.message || 'Failed to stock in.' }
    }
}

// ── Stock Out ──

export async function stockOut(formData: FormData) {
    const { clinicId, admin, profile } = await requirePharmacyAccess()

    const medicine_id = formData.get('medicine_id') as string
    const batch_id = formData.get('batch_id') as string
    const quantity = parseInt(formData.get('quantity') as string)
    const reason = (formData.get('reason') as string)?.trim() || null

    if (!medicine_id || !batch_id || !quantity || quantity <= 0) {
        return { error: 'All fields are required. Quantity must be positive.' }
    }

    try {
        // Get current batch stock
        const { data: batch } = await admin
            .from('medicine_batches')
            .select('quantity_remaining, batch_number')
            .eq('id', batch_id)
            .eq('organization_id', clinicId)
            .single()

        if (!batch) return { error: 'Batch not found.' }
        if (batch.quantity_remaining < quantity) {
            return { error: `Insufficient stock. Only ${batch.quantity_remaining} units remaining in this batch.` }
        }

        // Deduct from batch
        const { error: updateError } = await admin
            .from('medicine_batches')
            .update({ quantity_remaining: batch.quantity_remaining - quantity })
            .eq('id', batch_id)
            .eq('organization_id', clinicId)

        if (updateError) throw updateError

        // Create movement record
        const { error: moveError } = await admin
            .from('stock_movements')
            .insert({
                organization_id: clinicId,
                medicine_id,
                batch_id,
                movement_type: 'stock_out',
                quantity: -quantity,
                reason: reason || `Dispensed from batch ${batch.batch_number}`,
                performed_by: profile.id,
            })

        if (moveError) throw moveError

        // Audit
        await logAudit(admin, clinicId, 'stock_out', 'batch', batch_id, {
            medicine_id, batch_number: batch.batch_number, quantity, reason,
        }, profile.id)

        revalidatePath('/pharmacy')
        revalidatePath('/pharmacy/dashboard')
        revalidatePath(`/pharmacy/medicines/${medicine_id}`)
        revalidatePath('/pharmacy/movements')
        return { success: true }
    } catch (error: any) {
        return { error: error.message || 'Failed to stock out.' }
    }
}

// ── Adjust Stock ──

export async function adjustStock(formData: FormData) {
    const { clinicId, admin, profile } = await requirePharmacyAccess()

    const batch_id = formData.get('batch_id') as string
    const medicine_id = formData.get('medicine_id') as string
    const new_quantity = parseInt(formData.get('new_quantity') as string)
    const reason = (formData.get('reason') as string)?.trim()

    if (!batch_id || !medicine_id || isNaN(new_quantity) || new_quantity < 0) {
        return { error: 'Valid batch, medicine, and non-negative quantity are required.' }
    }
    if (!reason) return { error: 'Reason is required for stock adjustments.' }

    try {
        const { data: batch } = await admin
            .from('medicine_batches')
            .select('quantity_remaining, batch_number')
            .eq('id', batch_id)
            .eq('organization_id', clinicId)
            .single()

        if (!batch) return { error: 'Batch not found.' }

        const diff = new_quantity - batch.quantity_remaining

        const { error: updateError } = await admin
            .from('medicine_batches')
            .update({ quantity_remaining: new_quantity })
            .eq('id', batch_id)
            .eq('organization_id', clinicId)

        if (updateError) throw updateError

        const { error: moveError } = await admin
            .from('stock_movements')
            .insert({
                organization_id: clinicId,
                medicine_id,
                batch_id,
                movement_type: 'adjustment',
                quantity: diff,
                reason,
                performed_by: profile.id,
            })

        if (moveError) throw moveError

        // Audit
        await logAudit(admin, clinicId, 'stock_adjust', 'batch', batch_id, {
            medicine_id, batch_number: batch.batch_number, old_qty: batch.quantity_remaining, new_qty: new_quantity, diff, reason,
        }, profile.id)

        revalidatePath('/pharmacy')
        revalidatePath(`/pharmacy/medicines/${medicine_id}`)
        revalidatePath('/pharmacy/movements')
        return { success: true }
    } catch (error: any) {
        return { error: error.message || 'Failed to adjust stock.' }
    }
}

// ── Mark Batch Expired ──

export async function markBatchExpired(batchId: string, medicineId: string) {
    const { clinicId, admin, profile } = await requirePharmacyAccess()

    try {
        const { data: batch } = await admin
            .from('medicine_batches')
            .select('quantity_remaining, batch_number')
            .eq('id', batchId)
            .eq('organization_id', clinicId)
            .single()

        if (!batch) return { error: 'Batch not found.' }
        if (batch.quantity_remaining === 0) return { error: 'Batch already has zero stock.' }

        const { error: updateError } = await admin
            .from('medicine_batches')
            .update({ quantity_remaining: 0 })
            .eq('id', batchId)
            .eq('organization_id', clinicId)

        if (updateError) throw updateError

        const { error: moveError } = await admin
            .from('stock_movements')
            .insert({
                organization_id: clinicId,
                medicine_id: medicineId,
                batch_id: batchId,
                movement_type: 'expired',
                quantity: -batch.quantity_remaining,
                reason: `Batch ${batch.batch_number} marked as expired`,
                performed_by: profile.id,
            })

        if (moveError) throw moveError

        // Audit
        await logAudit(admin, clinicId, 'batch_expired', 'batch', batchId, {
            medicine_id: medicineId, batch_number: batch.batch_number, qty_removed: batch.quantity_remaining,
        }, profile.id)

        revalidatePath('/pharmacy')
        revalidatePath(`/pharmacy/medicines/${medicineId}`)
        revalidatePath('/pharmacy/batches')
        revalidatePath('/pharmacy/movements')
        return { success: true }
    } catch (error: any) {
        return { error: error.message || 'Failed to mark batch as expired.' }
    }
}

// ── Audit Helper ──

async function logAudit(
    admin: ReturnType<typeof createAdminClient>,
    clinicId: string,
    action: string,
    entityType: string,
    entityId: string | null,
    details: any,
    userId: string
) {
    await admin.from('pharmacy_audit_logs').insert({
        organization_id: clinicId,
        action,
        entity_type: entityType,
        entity_id: entityId,
        details,
        performed_by: userId,
    })
}

// ── Dashboard Stats ──

export async function getPharmacyDashboardStats(clinicId: string) {
    const admin = createAdminClient()

    const today = new Date().toISOString().split('T')[0]
    const todayStart = `${today}T00:00:00.000Z`
    const todayEnd = `${today}T23:59:59.999Z`
    const thirtyDaysOut = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]

    const [
        { count: totalMedicines },
        { data: lowStockMeds },
        { data: expiringBatches },
        { data: expiredBatches },
        { data: recentMovements },
        { count: pendingDispenseCount },
        { data: todayInvoices },
        { count: unpaidInvoiceCount },
        { data: pendingPrescriptions },
    ] = await Promise.all([
        admin.from('medicines')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', clinicId)
            .eq('is_active', true),
        admin.rpc('get_low_stock_medicines', { org_id: clinicId }),
        admin.from('medicine_batches')
            .select('id')
            .eq('organization_id', clinicId)
            .gt('quantity_remaining', 0)
            .gte('expiry_date', today)
            .lte('expiry_date', thirtyDaysOut),
        admin.from('medicine_batches')
            .select('id')
            .eq('organization_id', clinicId)
            .gt('quantity_remaining', 0)
            .lt('expiry_date', today),
        admin.from('stock_movements')
            .select('id, medicine_id, batch_id, movement_type, quantity, reason, created_at, medicines(name)')
            .eq('organization_id', clinicId)
            .order('created_at', { ascending: false })
            .limit(10),
        admin.from('prescriptions')
            .select('*', { count: 'exact', head: true })
            .eq('clinic_id', clinicId)
            .eq('dispensing_status', 'pending'),
        admin.from('invoices')
            .select('grand_total')
            .eq('organization_id', clinicId)
            .eq('payment_status', 'paid')
            .gte('created_at', todayStart)
            .lte('created_at', todayEnd),
        admin.from('invoices')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', clinicId)
            .in('payment_status', ['unpaid', 'partial']),
        admin.from('prescriptions')
            .select('id, created_at, patients(full_name), doctors!prescriptions_doctor_id_fkey(profiles(full_name))')
            .eq('clinic_id', clinicId)
            .eq('dispensing_status', 'pending')
            .order('created_at', { ascending: false })
            .limit(5),
    ])

    const todayRevenue = (todayInvoices || []).reduce((sum: number, inv: any) => sum + Number(inv.grand_total || 0), 0)

    return {
        totalMedicines: totalMedicines ?? 0,
        lowStockCount: lowStockMeds?.length ?? 0,
        expiringSoonCount: expiringBatches?.length ?? 0,
        expiredCount: expiredBatches?.length ?? 0,
        recentMovements: (recentMovements ?? []) as any[],
        pendingDispenseCount: pendingDispenseCount ?? 0,
        todayRevenue,
        unpaidInvoiceCount: unpaidInvoiceCount ?? 0,
        pendingPrescriptions: (pendingPrescriptions ?? []) as any[],
    }
}

// ── Dispensing ──

export async function getPendingPrescriptions(clinicId: string, page: number) {
    const admin = createAdminClient()
    const offset = (page - 1) * PAGE_SIZE

    const { data, count, error } = await admin
        .from('prescriptions')
        .select('id, medications, created_at, dispensing_status, patients(id, full_name), doctors!prescriptions_doctor_id_fkey(profiles(full_name))', { count: 'exact' })
        .eq('clinic_id', clinicId)
        .eq('dispensing_status', 'pending')
        .order('created_at', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1)

    if (error) {
        console.error('Error fetching pending prescriptions:', error)
        return { prescriptions: [], totalCount: 0 }
    }

    return { prescriptions: data || [], totalCount: count ?? 0 }
}

export async function getDispensePreview(clinicId: string, prescriptionId: string) {
    const admin = createAdminClient()

    // Get prescription
    const { data: rx } = await admin
        .from('prescriptions')
        .select('id, medications, dispensing_status, patients(id, full_name), doctors!prescriptions_doctor_id_fkey(profiles(full_name))')
        .eq('id', prescriptionId)
        .eq('clinic_id', clinicId)
        .single()

    if (!rx) return { error: 'Prescription not found.' }
    if (rx.dispensing_status !== 'pending') return { error: 'Prescription already dispensed.' }

    const medications: any[] = rx.medications || []
    const preview: any[] = []

    // Get all active medicines for this org (for matching)
    const { data: allMedicines } = await admin
        .from('medicines')
        .select('id, name, gst_rate')
        .eq('organization_id', clinicId)
        .eq('is_active', true)

    const medicineMap = new Map((allMedicines || []).map((m: any) => [m.name.toLowerCase(), m]))

    for (const med of medications) {
        const medName = (med.name || '').trim()
        const qtyRequired = parseInt(med.qty) || 0
        const match = medicineMap.get(medName.toLowerCase())

        if (!match) {
            preview.push({ name: medName, qtyRequired, status: 'unmatched', medicine_id: null, batches: [], available: 0 })
            continue
        }

        // Get FIFO batches for this medicine
        const { data: batches } = await admin
            .from('medicine_batches')
            .select('id, batch_number, expiry_date, quantity_remaining, selling_price')
            .eq('medicine_id', match.id)
            .eq('organization_id', clinicId)
            .gt('quantity_remaining', 0)
            .order('expiry_date', { ascending: true })

        const available = (batches || []).reduce((sum: number, b: any) => sum + b.quantity_remaining, 0)

        let remaining = qtyRequired
        const allocatedBatches: any[] = []
        for (const batch of (batches || [])) {
            if (remaining <= 0) break
            const take = Math.min(remaining, batch.quantity_remaining)
            allocatedBatches.push({
                batch_id: batch.id,
                batch_number: batch.batch_number,
                expiry_date: batch.expiry_date,
                quantity: take,
                selling_price: batch.selling_price || 0,
            })
            remaining -= take
        }

        const status = remaining === 0 ? 'matched' : remaining < qtyRequired ? 'partial' : 'insufficient'

        preview.push({
            name: medName,
            qtyRequired,
            status,
            medicine_id: match.id,
            gst_rate: match.gst_rate || 0,
            batches: allocatedBatches,
            available,
        })
    }

    return {
        prescription: rx,
        preview,
    }
}

export async function dispensePrescription(prescriptionId: string) {
    const { clinicId, admin, profile } = await requirePharmacyAccess()

    // Verify prescription
    const { data: rx } = await admin
        .from('prescriptions')
        .select('id, medications, dispensing_status, patient_id, patients(full_name), doctors!prescriptions_doctor_id_fkey(profiles(full_name))')
        .eq('id', prescriptionId)
        .eq('clinic_id', clinicId)
        .single()

    if (!rx) return { error: 'Prescription not found.' }
    if (rx.dispensing_status !== 'pending') return { error: 'Prescription already dispensed.' }

    const medications: any[] = rx.medications || []
    const { data: allMedicines } = await admin
        .from('medicines')
        .select('id, name, gst_rate')
        .eq('organization_id', clinicId)
        .eq('is_active', true)

    const medicineMap = new Map((allMedicines || []).map((m: any) => [m.name.toLowerCase(), m]))

    const invoiceItems: any[] = []
    const matched: string[] = []
    const unmatched: string[] = []
    const insufficient: string[] = []

    for (const med of medications) {
        const medName = (med.name || '').trim()
        const qtyRequired = parseInt(med.qty) || 0
        if (!medName || qtyRequired <= 0) continue

        const match = medicineMap.get(medName.toLowerCase())
        if (!match) {
            unmatched.push(medName)
            continue
        }

        // Get FIFO batches
        const { data: batches } = await admin
            .from('medicine_batches')
            .select('id, batch_number, expiry_date, quantity_remaining, selling_price')
            .eq('medicine_id', match.id)
            .eq('organization_id', clinicId)
            .gt('quantity_remaining', 0)
            .order('expiry_date', { ascending: true })

        let remaining = qtyRequired
        let dispensedAny = false

        for (const batch of (batches || [])) {
            if (remaining <= 0) break
            const take = Math.min(remaining, batch.quantity_remaining)

            // Deduct from batch
            const { error: updateErr } = await admin
                .from('medicine_batches')
                .update({ quantity_remaining: batch.quantity_remaining - take })
                .eq('id', batch.id)
                .eq('organization_id', clinicId)

            if (updateErr) continue

            // Create stock movement
            await admin.from('stock_movements').insert({
                organization_id: clinicId,
                medicine_id: match.id,
                batch_id: batch.id,
                movement_type: 'stock_out',
                quantity: -take,
                reason: `Dispensed for Rx ${prescriptionId.slice(0, 8)}`,
                performed_by: profile.id,
            })

            const unitPrice = Number(batch.selling_price || 0)
            const lineTotal = take * unitPrice
            const gstRate = Number(match.gst_rate || 0)
            const taxAmount = lineTotal * gstRate / 100

            invoiceItems.push({
                medicine_id: match.id,
                medicine_name: medName,
                batch_number: batch.batch_number,
                expiry_date: batch.expiry_date,
                quantity: take,
                unit_price: unitPrice,
                gst_rate: gstRate,
                line_total: lineTotal,
                tax_amount: taxAmount,
            })

            remaining -= take
            dispensedAny = true
        }

        if (remaining > 0 && !dispensedAny) {
            insufficient.push(medName)
        } else if (remaining > 0) {
            insufficient.push(`${medName} (partial: ${qtyRequired - remaining}/${qtyRequired})`)
            matched.push(medName)
        } else {
            matched.push(medName)
        }
    }

    if (invoiceItems.length === 0) {
        return { error: 'No medicines could be dispensed. Check stock availability and medicine names.' }
    }

    // Generate invoice number
    const { data: invoiceNumber } = await admin.rpc('generate_invoice_number', { org_id: clinicId })

    const subtotal = invoiceItems.reduce((s: number, i: any) => s + i.line_total, 0)
    const taxTotal = invoiceItems.reduce((s: number, i: any) => s + i.tax_amount, 0)
    const grandTotal = subtotal + taxTotal

    const patientName = (rx.patients as any)?.full_name || 'Unknown'
    const doctorName = (rx.doctors as any)?.profiles?.full_name || ''

    // Create invoice
    const { data: invoice, error: invErr } = await admin
        .from('invoices')
        .insert({
            organization_id: clinicId,
            prescription_id: prescriptionId,
            invoice_number: invoiceNumber,
            patient_name: patientName,
            patient_id: rx.patient_id,
            doctor_name: doctorName,
            subtotal: Math.round(subtotal * 100) / 100,
            tax_total: Math.round(taxTotal * 100) / 100,
            grand_total: Math.round(grandTotal * 100) / 100,
            created_by: profile.id,
        })
        .select('id')
        .single()

    if (invErr) return { error: 'Failed to create invoice: ' + invErr.message }

    // Create invoice items
    await admin.from('invoice_items').insert(
        invoiceItems.map((item: any) => ({
            invoice_id: invoice.id,
            ...item,
        }))
    )

    // Update prescription status
    const newStatus = unmatched.length > 0 || insufficient.length > 0 ? 'partial' : 'dispensed'
    await admin
        .from('prescriptions')
        .update({ dispensing_status: newStatus })
        .eq('id', prescriptionId)

    // Audit log
    await logAudit(admin, clinicId, 'dispense', 'prescription', prescriptionId, {
        invoice_id: invoice.id,
        items_dispensed: invoiceItems.length,
        matched,
        unmatched,
        insufficient,
    }, profile.id)

    revalidatePath('/pharmacy')
    revalidatePath('/pharmacy/dashboard')
    revalidatePath('/pharmacy/dispense')
    revalidatePath('/pharmacy/invoices')
    revalidatePath('/pharmacy/movements')

    return { success: true, invoiceId: invoice.id, matched, unmatched, insufficient }
}

// ── Invoices ──

export async function getInvoicesPaginated(clinicId: string, page: number, status?: string) {
    const admin = createAdminClient()
    const offset = (page - 1) * PAGE_SIZE

    let query = admin
        .from('invoices')
        .select('*', { count: 'exact' })
        .eq('organization_id', clinicId)
        .order('created_at', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1)

    if (status && status !== 'all') {
        query = query.eq('payment_status', status)
    }

    const { data, count, error } = await query

    if (error) {
        console.error('Error fetching invoices:', error)
        return { invoices: [], totalCount: 0 }
    }

    return { invoices: data || [], totalCount: count ?? 0 }
}

export async function getInvoiceDetail(clinicId: string, invoiceId: string) {
    const admin = createAdminClient()

    const [{ data: invoice }, { data: items }, { data: payments }] = await Promise.all([
        admin.from('invoices')
            .select('*, profiles:created_by(full_name)')
            .eq('id', invoiceId)
            .eq('organization_id', clinicId)
            .single(),
        admin.from('invoice_items')
            .select('*')
            .eq('invoice_id', invoiceId)
            .order('created_at'),
        admin.from('payments')
            .select('*, profiles:received_by(full_name)')
            .eq('invoice_id', invoiceId)
            .order('created_at'),
    ])

    return { invoice, items: items || [], payments: payments || [] }
}

export async function createManualInvoice(formData: FormData) {
    const { clinicId, admin, profile } = await requirePharmacyAccess()

    const patientName = (formData.get('patient_name') as string)?.trim()
    const doctorName = (formData.get('doctor_name') as string)?.trim() || null
    const notes = (formData.get('notes') as string)?.trim() || null
    const itemsJson = formData.get('items') as string

    if (!patientName) return { error: 'Patient name is required.' }

    let items: any[]
    try {
        items = JSON.parse(itemsJson)
    } catch {
        return { error: 'Invalid items data.' }
    }

    if (!items || items.length === 0) return { error: 'At least one item is required.' }

    const { data: allMedicines } = await admin
        .from('medicines')
        .select('id, name, gst_rate')
        .eq('organization_id', clinicId)
        .eq('is_active', true)

    const medicineMap = new Map((allMedicines || []).map((m: any) => [m.name.toLowerCase(), m]))

    const invoiceItems: any[] = []

    for (const item of items) {
        const medName = (item.name || '').trim()
        const qty = parseInt(item.quantity) || 0
        if (!medName || qty <= 0) continue

        const match = medicineMap.get(medName.toLowerCase())
        if (!match) {
            // Add as a non-stock item (no batch deduction)
            invoiceItems.push({
                medicine_id: null,
                medicine_name: medName,
                batch_number: null,
                expiry_date: null,
                quantity: qty,
                unit_price: Number(item.unit_price) || 0,
                gst_rate: Number(item.gst_rate) || 0,
                line_total: qty * (Number(item.unit_price) || 0),
                tax_amount: qty * (Number(item.unit_price) || 0) * (Number(item.gst_rate) || 0) / 100,
            })
            continue
        }

        // FIFO deduction
        const { data: batches } = await admin
            .from('medicine_batches')
            .select('id, batch_number, expiry_date, quantity_remaining, selling_price')
            .eq('medicine_id', match.id)
            .eq('organization_id', clinicId)
            .gt('quantity_remaining', 0)
            .order('expiry_date', { ascending: true })

        let remaining = qty
        for (const batch of (batches || [])) {
            if (remaining <= 0) break
            const take = Math.min(remaining, batch.quantity_remaining)

            await admin.from('medicine_batches')
                .update({ quantity_remaining: batch.quantity_remaining - take })
                .eq('id', batch.id)
                .eq('organization_id', clinicId)

            await admin.from('stock_movements').insert({
                organization_id: clinicId,
                medicine_id: match.id,
                batch_id: batch.id,
                movement_type: 'stock_out',
                quantity: -take,
                reason: 'Manual invoice sale',
                performed_by: profile.id,
            })

            const unitPrice = Number(batch.selling_price || item.unit_price || 0)
            const lineTotal = take * unitPrice
            const gstRate = Number(match.gst_rate || 0)

            invoiceItems.push({
                medicine_id: match.id,
                medicine_name: medName,
                batch_number: batch.batch_number,
                expiry_date: batch.expiry_date,
                quantity: take,
                unit_price: unitPrice,
                gst_rate: gstRate,
                line_total: lineTotal,
                tax_amount: lineTotal * gstRate / 100,
            })

            remaining -= take
        }
    }

    if (invoiceItems.length === 0) return { error: 'No items could be added to invoice.' }

    const { data: invoiceNumber } = await admin.rpc('generate_invoice_number', { org_id: clinicId })

    const subtotal = invoiceItems.reduce((s: number, i: any) => s + i.line_total, 0)
    const taxTotal = invoiceItems.reduce((s: number, i: any) => s + i.tax_amount, 0)
    const grandTotal = subtotal + taxTotal

    const { data: invoice, error: invErr } = await admin
        .from('invoices')
        .insert({
            organization_id: clinicId,
            invoice_number: invoiceNumber,
            patient_name: patientName,
            doctor_name: doctorName,
            subtotal: Math.round(subtotal * 100) / 100,
            tax_total: Math.round(taxTotal * 100) / 100,
            grand_total: Math.round(grandTotal * 100) / 100,
            notes,
            created_by: profile.id,
        })
        .select('id')
        .single()

    if (invErr) return { error: 'Failed to create invoice: ' + invErr.message }

    await admin.from('invoice_items').insert(
        invoiceItems.map((item: any) => ({ invoice_id: invoice.id, ...item }))
    )

    await logAudit(admin, clinicId, 'invoice_create', 'invoice', invoice.id, {
        type: 'manual',
        items: invoiceItems.length,
        total: grandTotal,
    }, profile.id)

    revalidatePath('/pharmacy')
    revalidatePath('/pharmacy/invoices')
    revalidatePath('/pharmacy/dashboard')
    revalidatePath('/pharmacy/movements')

    return { success: true, invoiceId: invoice.id }
}

export async function applyDiscount(invoiceId: string, discount: number) {
    const { clinicId, admin, profile } = await requirePharmacyAccess()

    const { data: invoice } = await admin
        .from('invoices')
        .select('subtotal, tax_total')
        .eq('id', invoiceId)
        .eq('organization_id', clinicId)
        .single()

    if (!invoice) return { error: 'Invoice not found.' }

    const grandTotal = Number(invoice.subtotal) + Number(invoice.tax_total) - discount

    const { error } = await admin
        .from('invoices')
        .update({
            discount: Math.round(discount * 100) / 100,
            grand_total: Math.round(Math.max(0, grandTotal) * 100) / 100,
        })
        .eq('id', invoiceId)
        .eq('organization_id', clinicId)

    if (error) return { error: error.message }

    revalidatePath(`/pharmacy/invoices/${invoiceId}`)
    return { success: true }
}

// ── Payments ──

export async function recordPayment(formData: FormData) {
    const { clinicId, admin, profile } = await requirePharmacyAccess()

    const invoice_id = formData.get('invoice_id') as string
    const amount = parseFloat(formData.get('amount') as string)
    const payment_method = (formData.get('payment_method') as string) || 'cash'
    const reference_number = (formData.get('reference_number') as string)?.trim() || null

    if (!invoice_id || !amount || amount <= 0) {
        return { error: 'Invoice ID and positive amount are required.' }
    }

    try {
        // Get invoice and existing payments
        const { data: invoice } = await admin
            .from('invoices')
            .select('grand_total, payment_status')
            .eq('id', invoice_id)
            .eq('organization_id', clinicId)
            .single()

        if (!invoice) return { error: 'Invoice not found.' }
        if (invoice.payment_status === 'paid') return { error: 'Invoice is already fully paid.' }

        const { data: existingPayments } = await admin
            .from('payments')
            .select('amount')
            .eq('invoice_id', invoice_id)

        const totalPaid = (existingPayments || []).reduce((s: number, p: any) => s + Number(p.amount), 0)
        const remaining = Number(invoice.grand_total) - totalPaid

        if (amount > remaining + 0.01) {
            return { error: `Payment exceeds remaining balance of ₹${remaining.toFixed(2)}` }
        }

        // Record payment
        const { error: payErr } = await admin.from('payments').insert({
            invoice_id,
            organization_id: clinicId,
            amount: Math.round(amount * 100) / 100,
            payment_method,
            reference_number,
            received_by: profile.id,
        })

        if (payErr) throw payErr

        // Update invoice payment status
        const newTotalPaid = totalPaid + amount
        const newStatus = newTotalPaid >= Number(invoice.grand_total) - 0.01 ? 'paid' : 'partial'

        await admin.from('invoices')
            .update({ payment_status: newStatus })
            .eq('id', invoice_id)
            .eq('organization_id', clinicId)

        // Audit log
        await logAudit(admin, clinicId, 'payment', 'invoice', invoice_id, {
            amount,
            method: payment_method,
            new_status: newStatus,
        }, profile.id)

        revalidatePath(`/pharmacy/invoices/${invoice_id}`)
        revalidatePath('/pharmacy/invoices')
        revalidatePath('/pharmacy/dashboard')
        return { success: true }
    } catch (error: any) {
        return { error: error.message || 'Failed to record payment.' }
    }
}

// ── Audit Logs ──

export async function getAuditLogs(clinicId: string, page: number, entityType?: string) {
    const admin = createAdminClient()
    const offset = (page - 1) * PAGE_SIZE

    let query = admin
        .from('pharmacy_audit_logs')
        .select('*, profiles:performed_by(full_name)', { count: 'exact' })
        .eq('organization_id', clinicId)
        .order('created_at', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1)

    if (entityType) {
        query = query.eq('entity_type', entityType)
    }

    const { data, count, error } = await query

    if (error) {
        console.error('Error fetching audit logs:', error)
        return { logs: [], totalCount: 0 }
    }

    return { logs: data || [], totalCount: count ?? 0 }
}

// ── Owner Doctor Stats (read-only) ──

export async function getPharmacyOwnerStats(clinicId: string) {
    const admin = createAdminClient()
    const today = new Date().toISOString().split('T')[0]
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

    const [
        { count: totalMedicines },
        { count: totalInvoices },
        { data: todayInvoices },
        { data: monthInvoices },
        { count: unpaidCount },
        { count: lowStockCount },
        { data: recentInvoices },
        { data: topItems },
    ] = await Promise.all([
        admin.from('medicines').select('*', { count: 'exact', head: true }).eq('organization_id', clinicId).eq('is_active', true),
        admin.from('invoices').select('*', { count: 'exact', head: true }).eq('organization_id', clinicId),
        admin.from('invoices').select('grand_total').eq('organization_id', clinicId).eq('payment_status', 'paid').gte('created_at', today + 'T00:00:00Z'),
        admin.from('invoices').select('grand_total').eq('organization_id', clinicId).eq('payment_status', 'paid').gte('created_at', monthStart),
        admin.from('invoices').select('*', { count: 'exact', head: true }).eq('organization_id', clinicId).eq('payment_status', 'unpaid'),
        admin.from('medicines')
            .select('id, low_stock_threshold, medicine_batches(quantity_remaining)')
            .eq('organization_id', clinicId).eq('is_active', true),
        admin.from('invoices')
            .select('id, invoice_number, patient_name, grand_total, payment_status, created_at')
            .eq('organization_id', clinicId)
            .order('created_at', { ascending: false })
            .limit(10),
        admin.from('invoice_items')
            .select('medicine_name, quantity, invoices!inner(organization_id)')
            .eq('invoices.organization_id', clinicId),
    ])

    const todayRevenue = (todayInvoices || []).reduce((s: number, inv: any) => s + Number(inv.grand_total || 0), 0)
    const monthRevenue = (monthInvoices || []).reduce((s: number, inv: any) => s + Number(inv.grand_total || 0), 0)

    // Count low stock medicines
    const lowStockMeds = (lowStockCount as any || []).filter((m: any) => {
        const stock = (m.medicine_batches || []).reduce((s: number, b: any) => s + (b.quantity_remaining || 0), 0)
        return stock <= m.low_stock_threshold
    })

    // Aggregate top selling medicines
    const medQtyMap: Record<string, number> = {}
    ;(topItems || []).forEach((item: any) => {
        medQtyMap[item.medicine_name] = (medQtyMap[item.medicine_name] || 0) + item.quantity
    })
    const topMedicines = Object.entries(medQtyMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, qty]) => ({ name, quantity: qty }))

    // Monthly revenue (last 6 months)
    const monthlyRevenue: { month: string; revenue: number }[] = []
    for (let i = 5; i >= 0; i--) {
        const d = new Date()
        d.setMonth(d.getMonth() - i)
        const mStart = new Date(d.getFullYear(), d.getMonth(), 1).toISOString()
        const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).toISOString()
        const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })

        const { data: mInvoices } = await admin
            .from('invoices')
            .select('grand_total')
            .eq('organization_id', clinicId)
            .eq('payment_status', 'paid')
            .gte('created_at', mStart)
            .lte('created_at', mEnd)

        const rev = (mInvoices || []).reduce((s: number, inv: any) => s + Number(inv.grand_total || 0), 0)
        monthlyRevenue.push({ month: label, revenue: rev })
    }

    return {
        totalMedicines: totalMedicines ?? 0,
        totalInvoices: totalInvoices ?? 0,
        todayRevenue,
        monthRevenue,
        unpaidCount: unpaidCount ?? 0,
        lowStockCount: lowStockMeds.length,
        recentInvoices: recentInvoices || [],
        topMedicines,
        monthlyRevenue,
    }
}

// ── Paginated Queries ──

export async function getMedicinesPaginated(clinicId: string, page: number, search?: string, category?: string) {
    const admin = createAdminClient()
    const offset = (page - 1) * PAGE_SIZE

    let query = admin
        .from('medicines')
        .select('*, medicine_batches(quantity_remaining)', { count: 'exact' })
        .eq('organization_id', clinicId)
        .order('name')
        .range(offset, offset + PAGE_SIZE - 1)

    if (search) {
        query = query.or(`name.ilike.%${search}%,generic_name.ilike.%${search}%`)
    }
    if (category) {
        query = query.eq('category', category)
    }

    const { data, count, error } = await query

    if (error) {
        console.error('Error fetching medicines:', error)
        return { medicines: [], totalCount: 0 }
    }

    const medicines = (data || []).map((m: any) => {
        const batches = m.medicine_batches || []
        const total_stock = batches.reduce((sum: number, b: any) => sum + (b.quantity_remaining || 0), 0)
        const { medicine_batches, ...rest } = m
        return { ...rest, total_stock }
    })

    return { medicines, totalCount: count ?? 0 }
}

export async function getMovementsPaginated(clinicId: string, page: number, type?: string) {
    const admin = createAdminClient()
    const offset = (page - 1) * PAGE_SIZE

    let query = admin
        .from('stock_movements')
        .select('*, medicines(name), medicine_batches(batch_number), profiles:performed_by(full_name)', { count: 'exact' })
        .eq('organization_id', clinicId)
        .order('created_at', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1)

    if (type && type !== 'all') {
        query = query.eq('movement_type', type)
    }

    const { data, count, error } = await query

    if (error) {
        console.error('Error fetching movements:', error)
        return { movements: [], totalCount: 0 }
    }

    return { movements: data || [], totalCount: count ?? 0 }
}

export async function getBatchesPaginated(clinicId: string, page: number, filter?: string) {
    const admin = createAdminClient()
    const offset = (page - 1) * PAGE_SIZE
    const today = new Date().toISOString().split('T')[0]
    const thirtyDaysOut = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]

    let query = admin
        .from('medicine_batches')
        .select('*, medicines(name)', { count: 'exact' })
        .eq('organization_id', clinicId)
        .gt('quantity_remaining', 0)
        .order('expiry_date', { ascending: true })
        .range(offset, offset + PAGE_SIZE - 1)

    if (filter === 'expiring') {
        query = query.gte('expiry_date', today).lte('expiry_date', thirtyDaysOut)
    } else if (filter === 'expired') {
        query = query.lt('expiry_date', today)
    }

    const { data, count, error } = await query

    if (error) {
        console.error('Error fetching batches:', error)
        return { batches: [], totalCount: 0 }
    }

    return { batches: data || [], totalCount: count ?? 0 }
}
