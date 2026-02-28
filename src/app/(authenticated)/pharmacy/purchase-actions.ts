'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { getUserProfile } from '@/utils/auth'
import { revalidatePath } from 'next/cache'

const PAGE_SIZE = 20

// ── Guard (reuse pattern from actions.ts) ──

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

// ══════════════════════════════════════════════
// ── SUPPLIER CRUD ──
// ══════════════════════════════════════════════

export async function createSupplier(formData: FormData) {
    const { clinicId, admin, profile } = await requirePharmacyAccess()

    const name = (formData.get('name') as string)?.trim()
    if (!name) return { error: 'Supplier name is required.' }

    const data = {
        organization_id: clinicId,
        name,
        contact_person: (formData.get('contact_person') as string)?.trim() || null,
        phone: (formData.get('phone') as string)?.trim() || null,
        email: (formData.get('email') as string)?.trim() || null,
        gstin: (formData.get('gstin') as string)?.trim().toUpperCase() || null,
        drug_license_no: (formData.get('drug_license_no') as string)?.trim() || null,
        address: (formData.get('address') as string)?.trim() || null,
        city: (formData.get('city') as string)?.trim() || null,
        state: (formData.get('state') as string)?.trim() || null,
        pincode: (formData.get('pincode') as string)?.trim() || null,
        payment_terms: (formData.get('payment_terms') as string)?.trim() || '30 days',
    }

    try {
        const { data: supplier, error } = await admin
            .from('suppliers')
            .insert(data)
            .select('id')
            .single()

        if (error) {
            if (error.code === '23505') return { error: 'A supplier with this name already exists.' }
            throw error
        }

        await logAudit(admin, clinicId, 'supplier_create', 'supplier', supplier.id, { name }, profile.id)

        revalidatePath('/pharmacy/suppliers')
        return { success: true, supplierId: supplier.id }
    } catch (error: any) {
        return { error: error.message || 'Failed to create supplier.' }
    }
}

export async function updateSupplier(formData: FormData) {
    const { clinicId, admin, profile } = await requirePharmacyAccess()

    const id = formData.get('id') as string
    const name = (formData.get('name') as string)?.trim()
    if (!id || !name) return { error: 'Supplier ID and name are required.' }

    try {
        const { error } = await admin
            .from('suppliers')
            .update({
                name,
                contact_person: (formData.get('contact_person') as string)?.trim() || null,
                phone: (formData.get('phone') as string)?.trim() || null,
                email: (formData.get('email') as string)?.trim() || null,
                gstin: (formData.get('gstin') as string)?.trim().toUpperCase() || null,
                drug_license_no: (formData.get('drug_license_no') as string)?.trim() || null,
                address: (formData.get('address') as string)?.trim() || null,
                city: (formData.get('city') as string)?.trim() || null,
                state: (formData.get('state') as string)?.trim() || null,
                pincode: (formData.get('pincode') as string)?.trim() || null,
                payment_terms: (formData.get('payment_terms') as string)?.trim() || '30 days',
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .eq('organization_id', clinicId)

        if (error) {
            if (error.code === '23505') return { error: 'A supplier with this name already exists.' }
            throw error
        }

        revalidatePath('/pharmacy/suppliers')
        revalidatePath(`/pharmacy/suppliers/${id}`)
        return { success: true }
    } catch (error: any) {
        return { error: error.message || 'Failed to update supplier.' }
    }
}

export async function toggleSupplierActive(supplierId: string, isActive: boolean) {
    const { clinicId, admin } = await requirePharmacyAccess()

    try {
        const { error } = await admin
            .from('suppliers')
            .update({ is_active: isActive, updated_at: new Date().toISOString() })
            .eq('id', supplierId)
            .eq('organization_id', clinicId)

        if (error) throw error

        revalidatePath('/pharmacy/suppliers')
        return { success: true }
    } catch (error: any) {
        return { error: error.message || 'Failed to update supplier.' }
    }
}

export async function getSuppliersPaginated(clinicId: string, page: number, search?: string) {
    const admin = createAdminClient()
    const offset = (page - 1) * PAGE_SIZE

    let query = admin
        .from('suppliers')
        .select('*', { count: 'exact' })
        .eq('organization_id', clinicId)
        .order('name')
        .range(offset, offset + PAGE_SIZE - 1)

    if (search) {
        query = query.or(`name.ilike.%${search}%,contact_person.ilike.%${search}%,gstin.ilike.%${search}%`)
    }

    const { data, count, error } = await query

    if (error) {
        console.error('Error fetching suppliers:', error)
        return { suppliers: [], totalCount: 0 }
    }

    return { suppliers: data || [], totalCount: count ?? 0 }
}

export async function getActiveSuppliers(clinicId: string) {
    const admin = createAdminClient()

    const { data } = await admin
        .from('suppliers')
        .select('id, name')
        .eq('organization_id', clinicId)
        .eq('is_active', true)
        .order('name')

    return data || []
}

export async function getSupplierDetail(clinicId: string, supplierId: string) {
    const admin = createAdminClient()

    const [{ data: supplier }, { data: purchases }, { data: returns }] = await Promise.all([
        admin.from('suppliers')
            .select('*')
            .eq('id', supplierId)
            .eq('organization_id', clinicId)
            .single(),
        admin.from('purchases')
            .select('id, purchase_number, status, purchase_date, grand_total, amount_paid, payment_status')
            .eq('supplier_id', supplierId)
            .eq('organization_id', clinicId)
            .order('purchase_date', { ascending: false })
            .limit(20),
        admin.from('purchase_returns')
            .select('id, return_number, status, return_date, grand_total, reason')
            .eq('supplier_id', supplierId)
            .eq('organization_id', clinicId)
            .order('return_date', { ascending: false })
            .limit(10),
    ])

    // Calculate ledger summary
    const totalPurchased = (purchases || [])
        .filter((p: any) => p.status !== 'cancelled')
        .reduce((sum: number, p: any) => sum + Number(p.grand_total || 0), 0)
    const totalPaid = (purchases || [])
        .filter((p: any) => p.status !== 'cancelled')
        .reduce((sum: number, p: any) => sum + Number(p.amount_paid || 0), 0)
    const totalReturned = (returns || [])
        .filter((r: any) => ['accepted', 'settled'].includes(r.status))
        .reduce((sum: number, r: any) => sum + Number(r.grand_total || 0), 0)

    return {
        supplier,
        purchases: purchases || [],
        returns: returns || [],
        ledger: {
            total_purchased: totalPurchased,
            total_paid: totalPaid,
            total_returned: totalReturned,
            outstanding: totalPurchased - totalPaid - totalReturned,
        },
    }
}

// ══════════════════════════════════════════════
// ── PURCHASE CRUD ──
// ══════════════════════════════════════════════

export async function createPurchase(formData: FormData) {
    const { clinicId, admin, profile } = await requirePharmacyAccess()

    const supplier_id = formData.get('supplier_id') as string
    const purchase_date = formData.get('purchase_date') as string
    const invoice_number = (formData.get('invoice_number') as string)?.trim() || null
    const invoice_date = (formData.get('invoice_date') as string) || null
    const notes = (formData.get('notes') as string)?.trim() || null
    const itemsJson = formData.get('items') as string

    if (!supplier_id) return { error: 'Supplier is required.' }

    let items: any[]
    try {
        items = JSON.parse(itemsJson)
    } catch {
        return { error: 'Invalid items data.' }
    }

    if (!items || items.length === 0) return { error: 'At least one item is required.' }

    try {
        // Generate purchase number
        const { data: purchaseNumber } = await admin.rpc('generate_purchase_number', { org_id: clinicId })

        // Calculate totals
        let subtotal = 0
        let taxTotal = 0
        const processedItems: any[] = []

        for (const item of items) {
            const qty = parseInt(item.quantity_ordered) || 0
            const price = parseFloat(item.purchase_price) || 0
            const gstRate = parseFloat(item.gst_rate) || 12
            const discountPct = parseFloat(item.discount_pct) || 0
            const freeQty = parseInt(item.free_quantity) || 0

            if (qty <= 0 || !item.medicine_id || !item.batch_number || !item.expiry_date) continue

            const grossAmount = qty * price
            const discountAmount = grossAmount * discountPct / 100
            const taxableAmount = grossAmount - discountAmount
            const taxAmount = taxableAmount * gstRate / 100
            const lineTotal = taxableAmount + taxAmount

            subtotal += taxableAmount
            taxTotal += taxAmount

            processedItems.push({
                organization_id: clinicId,
                medicine_id: item.medicine_id,
                batch_number: item.batch_number.trim(),
                expiry_date: item.expiry_date,
                quantity_ordered: qty,
                free_quantity: freeQty,
                purchase_price: price,
                selling_price: parseFloat(item.selling_price) || 0,
                mrp: item.mrp ? parseFloat(item.mrp) : null,
                gst_rate: gstRate,
                discount_pct: discountPct,
                line_total: Math.round(lineTotal * 100) / 100,
                tax_amount: Math.round(taxAmount * 100) / 100,
            })
        }

        if (processedItems.length === 0) return { error: 'No valid items in purchase.' }

        const discount = parseFloat(formData.get('discount') as string) || 0
        const grandTotal = subtotal + taxTotal - discount

        // Create purchase
        const { data: purchase, error: purchErr } = await admin
            .from('purchases')
            .insert({
                organization_id: clinicId,
                supplier_id,
                purchase_number: purchaseNumber,
                status: 'draft',
                purchase_date: purchase_date || new Date().toISOString().split('T')[0],
                invoice_number,
                invoice_date,
                subtotal: Math.round(subtotal * 100) / 100,
                discount: Math.round(discount * 100) / 100,
                tax_total: Math.round(taxTotal * 100) / 100,
                grand_total: Math.round(grandTotal * 100) / 100,
                notes,
                created_by: profile.id,
            })
            .select('id')
            .single()

        if (purchErr) throw purchErr

        // Create purchase items
        const { error: itemsErr } = await admin
            .from('purchase_items')
            .insert(processedItems.map(item => ({ purchase_id: purchase.id, ...item })))

        if (itemsErr) throw itemsErr

        await logAudit(admin, clinicId, 'purchase_create', 'purchase', purchase.id, {
            purchase_number: purchaseNumber, supplier_id, items_count: processedItems.length, grand_total: grandTotal,
        }, profile.id)

        revalidatePath('/pharmacy/purchases')
        return { success: true, purchaseId: purchase.id }
    } catch (error: any) {
        return { error: error.message || 'Failed to create purchase.' }
    }
}

export async function updatePurchaseStatus(purchaseId: string, newStatus: string) {
    const { clinicId, admin, profile } = await requirePharmacyAccess()

    try {
        // If receiving, use the atomic function
        if (newStatus === 'received') {
            const { error } = await admin.rpc('receive_purchase', {
                p_purchase_id: purchaseId,
                p_org_id: clinicId,
                p_user_id: profile.id,
            })

            if (error) throw error

            revalidatePath('/pharmacy')
            revalidatePath('/pharmacy/purchases')
            revalidatePath(`/pharmacy/purchases/${purchaseId}`)
            revalidatePath('/pharmacy/medicines')
            revalidatePath('/pharmacy/batches')
            revalidatePath('/pharmacy/movements')
            revalidatePath('/pharmacy/dashboard')
            return { success: true }
        }

        // For other status changes (draft → ordered, etc.)
        const validTransitions: Record<string, string[]> = {
            draft: ['ordered', 'cancelled'],
            ordered: ['received', 'partial', 'cancelled'],
            partial: ['received', 'cancelled'],
        }

        const { data: purchase } = await admin
            .from('purchases')
            .select('status')
            .eq('id', purchaseId)
            .eq('organization_id', clinicId)
            .single()

        if (!purchase) return { error: 'Purchase not found.' }

        const allowed = validTransitions[purchase.status] || []
        if (!allowed.includes(newStatus)) {
            return { error: `Cannot change status from '${purchase.status}' to '${newStatus}'.` }
        }

        const { error } = await admin
            .from('purchases')
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq('id', purchaseId)
            .eq('organization_id', clinicId)

        if (error) throw error

        await logAudit(admin, clinicId, 'purchase_status_update', 'purchase', purchaseId, {
            old_status: purchase.status, new_status: newStatus,
        }, profile.id)

        revalidatePath('/pharmacy/purchases')
        revalidatePath(`/pharmacy/purchases/${purchaseId}`)
        return { success: true }
    } catch (error: any) {
        return { error: error.message || 'Failed to update purchase status.' }
    }
}

export async function recordPurchasePayment(formData: FormData) {
    const { clinicId, admin, profile } = await requirePharmacyAccess()

    const purchaseId = formData.get('purchase_id') as string
    const amount = parseFloat(formData.get('amount') as string)

    if (!purchaseId || !amount || amount <= 0) {
        return { error: 'Purchase ID and positive amount are required.' }
    }

    try {
        const { data: purchase } = await admin
            .from('purchases')
            .select('grand_total, amount_paid')
            .eq('id', purchaseId)
            .eq('organization_id', clinicId)
            .single()

        if (!purchase) return { error: 'Purchase not found.' }

        const remaining = Number(purchase.grand_total) - Number(purchase.amount_paid)
        if (amount > remaining + 0.01) {
            return { error: `Payment exceeds remaining balance of ₹${remaining.toFixed(2)}` }
        }

        const newAmountPaid = Number(purchase.amount_paid) + amount
        const paymentStatus = newAmountPaid >= Number(purchase.grand_total) - 0.01 ? 'paid' : 'partial'

        const { error } = await admin
            .from('purchases')
            .update({
                amount_paid: Math.round(newAmountPaid * 100) / 100,
                payment_status: paymentStatus,
                updated_at: new Date().toISOString(),
            })
            .eq('id', purchaseId)
            .eq('organization_id', clinicId)

        if (error) throw error

        await logAudit(admin, clinicId, 'purchase_payment', 'purchase', purchaseId, {
            amount, new_total_paid: newAmountPaid, payment_status: paymentStatus,
        }, profile.id)

        revalidatePath('/pharmacy/purchases')
        revalidatePath(`/pharmacy/purchases/${purchaseId}`)
        revalidatePath('/pharmacy/suppliers')
        return { success: true }
    } catch (error: any) {
        return { error: error.message || 'Failed to record payment.' }
    }
}

export async function getPurchasesPaginated(clinicId: string, page: number, status?: string, supplierId?: string) {
    const admin = createAdminClient()
    const offset = (page - 1) * PAGE_SIZE

    let query = admin
        .from('purchases')
        .select('*, suppliers(name)', { count: 'exact' })
        .eq('organization_id', clinicId)
        .order('created_at', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1)

    if (status && status !== 'all') {
        query = query.eq('status', status)
    }
    if (supplierId) {
        query = query.eq('supplier_id', supplierId)
    }

    const { data, count, error } = await query

    if (error) {
        console.error('Error fetching purchases:', error)
        return { purchases: [], totalCount: 0 }
    }

    return { purchases: data || [], totalCount: count ?? 0 }
}

export async function getPurchaseDetail(clinicId: string, purchaseId: string) {
    const admin = createAdminClient()

    const [{ data: purchase }, { data: items }] = await Promise.all([
        admin.from('purchases')
            .select('*, suppliers(name, gstin, phone, drug_license_no), profiles:created_by(full_name)')
            .eq('id', purchaseId)
            .eq('organization_id', clinicId)
            .single(),
        admin.from('purchase_items')
            .select('*, medicines(name, unit, generic_name)')
            .eq('purchase_id', purchaseId)
            .eq('organization_id', clinicId)
            .order('created_at'),
    ])

    return { purchase, items: items || [] }
}

// ══════════════════════════════════════════════
// ── PURCHASE RETURNS ──
// ══════════════════════════════════════════════

export async function createPurchaseReturn(formData: FormData) {
    const { clinicId, admin, profile } = await requirePharmacyAccess()

    const supplier_id = formData.get('supplier_id') as string
    const purchase_id = (formData.get('purchase_id') as string) || null
    const reason = (formData.get('reason') as string)?.trim()
    const notes = (formData.get('notes') as string)?.trim() || null
    const itemsJson = formData.get('items') as string

    if (!supplier_id) return { error: 'Supplier is required.' }
    if (!reason) return { error: 'Return reason is required.' }

    let items: any[]
    try {
        items = JSON.parse(itemsJson)
    } catch {
        return { error: 'Invalid items data.' }
    }

    if (!items || items.length === 0) return { error: 'At least one item is required.' }

    try {
        const { data: returnNumber } = await admin.rpc('generate_return_number', { org_id: clinicId })

        let subtotal = 0
        let taxTotal = 0
        const processedItems: any[] = []

        for (const item of items) {
            const qty = parseInt(item.quantity) || 0
            if (qty <= 0 || !item.medicine_id || !item.batch_id) continue

            // Verify batch has enough stock
            const { data: batch } = await admin
                .from('medicine_batches')
                .select('quantity_remaining, purchase_price, batch_number')
                .eq('id', item.batch_id)
                .eq('organization_id', clinicId)
                .single()

            if (!batch) continue
            if (batch.quantity_remaining < qty) {
                return { error: `Batch ${batch.batch_number}: only ${batch.quantity_remaining} remaining, cannot return ${qty}.` }
            }

            const price = Number(batch.purchase_price || 0)
            const gstRate = parseFloat(item.gst_rate) || 12
            const lineTotal = qty * price
            const taxAmount = lineTotal * gstRate / 100

            subtotal += lineTotal
            taxTotal += taxAmount

            processedItems.push({
                organization_id: clinicId,
                medicine_id: item.medicine_id,
                batch_id: item.batch_id,
                quantity: qty,
                purchase_price: price,
                gst_rate: gstRate,
                line_total: Math.round(lineTotal * 100) / 100,
                tax_amount: Math.round(taxAmount * 100) / 100,
                reason: item.reason || null,
            })
        }

        if (processedItems.length === 0) return { error: 'No valid items in return.' }

        const grandTotal = subtotal + taxTotal

        // Create return
        const { data: purchaseReturn, error: retErr } = await admin
            .from('purchase_returns')
            .insert({
                organization_id: clinicId,
                purchase_id,
                supplier_id,
                return_number: returnNumber,
                reason,
                subtotal: Math.round(subtotal * 100) / 100,
                tax_total: Math.round(taxTotal * 100) / 100,
                grand_total: Math.round(grandTotal * 100) / 100,
                notes,
                created_by: profile.id,
            })
            .select('id')
            .single()

        if (retErr) throw retErr

        // Create return items
        await admin.from('purchase_return_items').insert(
            processedItems.map(item => ({ return_id: purchaseReturn.id, ...item }))
        )

        // Deduct stock from batches and create stock movements
        for (const item of processedItems) {
            const { data: batch } = await admin
                .from('medicine_batches')
                .select('quantity_remaining, batch_number')
                .eq('id', item.batch_id)
                .eq('organization_id', clinicId)
                .single()

            if (!batch) continue

            await admin
                .from('medicine_batches')
                .update({ quantity_remaining: batch.quantity_remaining - item.quantity })
                .eq('id', item.batch_id)
                .eq('organization_id', clinicId)

            await admin.from('stock_movements').insert({
                organization_id: clinicId,
                medicine_id: item.medicine_id,
                batch_id: item.batch_id,
                movement_type: 'returned',
                quantity: -item.quantity,
                reason: `Purchase return ${returnNumber}: ${reason}`,
                performed_by: profile.id,
                reference_type: 'purchase_return',
                reference_id: purchaseReturn.id,
            })
        }

        await logAudit(admin, clinicId, 'purchase_return_create', 'purchase_return', purchaseReturn.id, {
            return_number: returnNumber, supplier_id, items_count: processedItems.length, grand_total: grandTotal,
        }, profile.id)

        revalidatePath('/pharmacy')
        revalidatePath('/pharmacy/purchases')
        revalidatePath('/pharmacy/purchase-returns')
        revalidatePath('/pharmacy/movements')
        revalidatePath('/pharmacy/batches')
        revalidatePath('/pharmacy/dashboard')
        return { success: true, returnId: purchaseReturn.id }
    } catch (error: any) {
        return { error: error.message || 'Failed to create purchase return.' }
    }
}

export async function updatePurchaseReturnStatus(returnId: string, newStatus: string) {
    const { clinicId, admin, profile } = await requirePharmacyAccess()

    try {
        const { data: ret } = await admin
            .from('purchase_returns')
            .select('status')
            .eq('id', returnId)
            .eq('organization_id', clinicId)
            .single()

        if (!ret) return { error: 'Return not found.' }

        const validTransitions: Record<string, string[]> = {
            draft: ['submitted'],
            submitted: ['accepted', 'draft'],
            accepted: ['settled'],
        }

        const allowed = validTransitions[ret.status] || []
        if (!allowed.includes(newStatus)) {
            return { error: `Cannot change status from '${ret.status}' to '${newStatus}'.` }
        }

        const { error } = await admin
            .from('purchase_returns')
            .update({ status: newStatus, updated_at: new Date().toISOString() })
            .eq('id', returnId)
            .eq('organization_id', clinicId)

        if (error) throw error

        revalidatePath('/pharmacy/purchase-returns')
        revalidatePath(`/pharmacy/purchase-returns/${returnId}`)
        return { success: true }
    } catch (error: any) {
        return { error: error.message || 'Failed to update return status.' }
    }
}

export async function getPurchaseReturnsPaginated(clinicId: string, page: number, status?: string) {
    const admin = createAdminClient()
    const offset = (page - 1) * PAGE_SIZE

    let query = admin
        .from('purchase_returns')
        .select('*, suppliers(name)', { count: 'exact' })
        .eq('organization_id', clinicId)
        .order('created_at', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1)

    if (status && status !== 'all') {
        query = query.eq('status', status)
    }

    const { data, count, error } = await query

    if (error) {
        console.error('Error fetching purchase returns:', error)
        return { returns: [], totalCount: 0 }
    }

    return { returns: data || [], totalCount: count ?? 0 }
}

export async function getPurchaseReturnDetail(clinicId: string, returnId: string) {
    const admin = createAdminClient()

    const [{ data: ret }, { data: items }] = await Promise.all([
        admin.from('purchase_returns')
            .select('*, suppliers(name, gstin, phone), profiles:created_by(full_name)')
            .eq('id', returnId)
            .eq('organization_id', clinicId)
            .single(),
        admin.from('purchase_return_items')
            .select('*, medicines(name, unit), medicine_batches(batch_number, expiry_date)')
            .eq('return_id', returnId)
            .eq('organization_id', clinicId)
            .order('created_at'),
    ])

    return { return: ret, items: items || [] }
}

// ══════════════════════════════════════════════
// ── EXPIRY MANAGEMENT ──
// ══════════════════════════════════════════════

export async function getExpiryReport(clinicId: string, days: number = 90) {
    const admin = createAdminClient()
    const today = new Date().toISOString().split('T')[0]
    const cutoffDate = new Date(Date.now() + days * 86400000).toISOString().split('T')[0]

    // Get all batches within the expiry window (including expired)
    const { data, error } = await admin
        .from('medicine_batches')
        .select('id, medicine_id, batch_number, expiry_date, quantity_remaining, purchase_price, selling_price, medicines(name, generic_name, unit)')
        .eq('organization_id', clinicId)
        .gt('quantity_remaining', 0)
        .lte('expiry_date', cutoffDate)
        .order('expiry_date', { ascending: true })

    if (error) {
        console.error('Error fetching expiry report:', error)
        return { items: [], summary: { expired: 0, expiring_30: 0, expiring_60: 0, expiring_90: 0, total_cost_at_risk: 0 } }
    }

    let expired = 0, expiring_30 = 0, expiring_60 = 0, expiring_90 = 0, totalCostAtRisk = 0

    const items = (data || []).map((b: any) => {
        const expiryDate = new Date(b.expiry_date + 'T00:00:00')
        const todayDate = new Date(today + 'T00:00:00')
        const diffDays = Math.ceil((expiryDate.getTime() - todayDate.getTime()) / 86400000)
        const costValue = (Number(b.purchase_price) || 0) * b.quantity_remaining

        if (diffDays < 0) expired++
        else if (diffDays <= 30) expiring_30++
        else if (diffDays <= 60) expiring_60++
        else expiring_90++

        totalCostAtRisk += costValue

        return {
            ...b,
            medicine_name: (b.medicines as any)?.name || 'Unknown',
            generic_name: (b.medicines as any)?.generic_name,
            unit: (b.medicines as any)?.unit,
            days_to_expiry: diffDays,
            cost_value: costValue,
            expiry_band: diffDays < 0 ? 'expired' : diffDays <= 30 ? '0-30 days' : diffDays <= 60 ? '31-60 days' : '61-90 days',
        }
    })

    return {
        items,
        summary: { expired, expiring_30, expiring_60, expiring_90, total_cost_at_risk: totalCostAtRisk },
    }
}

export async function bulkExpiryWriteOff() {
    const { clinicId, admin, profile } = await requirePharmacyAccess()

    try {
        const today = new Date().toISOString().split('T')[0]

        // Get all expired batches with stock
        const { data: expiredBatches } = await admin
            .from('medicine_batches')
            .select('id, medicine_id, batch_number, quantity_remaining, purchase_price')
            .eq('organization_id', clinicId)
            .gt('quantity_remaining', 0)
            .lt('expiry_date', today)

        if (!expiredBatches || expiredBatches.length === 0) {
            return { error: 'No expired batches with remaining stock found.' }
        }

        let totalRemoved = 0
        let totalCostValue = 0

        for (const batch of expiredBatches) {
            await admin
                .from('medicine_batches')
                .update({ quantity_remaining: 0 })
                .eq('id', batch.id)
                .eq('organization_id', clinicId)

            await admin.from('stock_movements').insert({
                organization_id: clinicId,
                medicine_id: batch.medicine_id,
                batch_id: batch.id,
                movement_type: 'expired',
                quantity: -batch.quantity_remaining,
                reason: `Bulk expiry write-off: Batch ${batch.batch_number}`,
                performed_by: profile.id,
                reference_type: 'expiry_writeoff',
            })

            totalRemoved += batch.quantity_remaining
            totalCostValue += (Number(batch.purchase_price) || 0) * batch.quantity_remaining
        }

        await logAudit(admin, clinicId, 'bulk_expiry_writeoff', 'batch', null, {
            batches_count: expiredBatches.length,
            total_quantity_removed: totalRemoved,
            total_cost_value: totalCostValue,
        }, profile.id)

        revalidatePath('/pharmacy')
        revalidatePath('/pharmacy/expiry')
        revalidatePath('/pharmacy/batches')
        revalidatePath('/pharmacy/movements')
        revalidatePath('/pharmacy/dashboard')

        return {
            success: true,
            batchesWrittenOff: expiredBatches.length,
            totalQuantityRemoved: totalRemoved,
            totalCostValue: Math.round(totalCostValue * 100) / 100,
        }
    } catch (error: any) {
        return { error: error.message || 'Failed to process expiry write-off.' }
    }
}

// ══════════════════════════════════════════════
// ── INVENTORY REPORTS ──
// ══════════════════════════════════════════════

export async function getStockValuation(clinicId: string) {
    const admin = createAdminClient()
    const today = new Date().toISOString().split('T')[0]
    const thirtyDaysOut = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]

    const { data: batches } = await admin
        .from('medicine_batches')
        .select('id, medicine_id, batch_number, expiry_date, quantity_remaining, purchase_price, selling_price, mrp, medicines(name, generic_name, category, unit)')
        .eq('organization_id', clinicId)
        .gt('quantity_remaining', 0)
        .order('expiry_date', { ascending: true })

    if (!batches || batches.length === 0) {
        return {
            items: [],
            summary: { total_cost_value: 0, total_selling_value: 0, total_mrp_value: 0, total_items: 0, total_batches: 0, expired_cost_value: 0, expiring_30_cost_value: 0 },
        }
    }

    let totalCost = 0, totalSelling = 0, totalMrp = 0, expiredCost = 0, expiring30Cost = 0

    // Group by medicine
    const medicineMap = new Map<string, any>()

    for (const b of batches) {
        const costVal = (Number(b.purchase_price) || 0) * b.quantity_remaining
        const sellVal = (Number(b.selling_price) || 0) * b.quantity_remaining
        const mrpVal = (Number(b.mrp) || Number(b.selling_price) || 0) * b.quantity_remaining

        totalCost += costVal
        totalSelling += sellVal
        totalMrp += mrpVal

        if (b.expiry_date < today) expiredCost += costVal
        else if (b.expiry_date <= thirtyDaysOut) expiring30Cost += costVal

        const key = b.medicine_id
        if (!medicineMap.has(key)) {
            medicineMap.set(key, {
                medicine_id: b.medicine_id,
                medicine_name: (b.medicines as any)?.name || 'Unknown',
                generic_name: (b.medicines as any)?.generic_name,
                category: (b.medicines as any)?.category,
                unit: (b.medicines as any)?.unit,
                total_stock: 0,
                batch_count: 0,
                cost_value: 0,
                selling_value: 0,
                mrp_value: 0,
            })
        }

        const med = medicineMap.get(key)!
        med.total_stock += b.quantity_remaining
        med.batch_count += 1
        med.cost_value += costVal
        med.selling_value += sellVal
        med.mrp_value += mrpVal
    }

    const medicines = Array.from(medicineMap.values())
        .sort((a, b) => b.cost_value - a.cost_value) // Sort by value, highest first

    const uniqueMedicineIds = new Set(batches.map(b => b.medicine_id))

    return {
        items: medicines,
        summary: {
            total_cost_value: Math.round(totalCost * 100) / 100,
            total_selling_value: Math.round(totalSelling * 100) / 100,
            total_mrp_value: Math.round(totalMrp * 100) / 100,
            total_items: uniqueMedicineIds.size,
            total_batches: batches.length,
            expired_cost_value: Math.round(expiredCost * 100) / 100,
            expiring_30_cost_value: Math.round(expiring30Cost * 100) / 100,
        },
    }
}

export async function getDeadStockReport(clinicId: string, daysThreshold: number = 90) {
    const admin = createAdminClient()
    const cutoffDate = new Date(Date.now() - daysThreshold * 86400000).toISOString()

    // Get all medicines with stock
    const { data: medicines } = await admin
        .from('medicines')
        .select('id, name, generic_name, category, unit, medicine_batches(id, quantity_remaining, purchase_price, selling_price)')
        .eq('organization_id', clinicId)
        .eq('is_active', true)

    if (!medicines) return { items: [], summary: { total_dead_items: 0, total_dead_value: 0 } }

    // Get last movement date for each medicine
    const { data: movements } = await admin
        .from('stock_movements')
        .select('medicine_id, created_at')
        .eq('organization_id', clinicId)
        .order('created_at', { ascending: false })

    // Build movement date map (latest movement per medicine)
    const lastMovementMap = new Map<string, string>()
    for (const m of (movements || [])) {
        if (!lastMovementMap.has(m.medicine_id)) {
            lastMovementMap.set(m.medicine_id, m.created_at)
        }
    }

    const deadItems: any[] = []
    let totalDeadValue = 0

    for (const med of medicines) {
        const batches = (med.medicine_batches as any[]) || []
        const totalStock = batches.reduce((sum: number, b: any) => sum + (b.quantity_remaining || 0), 0)

        if (totalStock === 0) continue

        const lastMovement = lastMovementMap.get(med.id) || null
        const daysSince = lastMovement
            ? Math.floor((Date.now() - new Date(lastMovement).getTime()) / 86400000)
            : 9999

        if (daysSince < daysThreshold) continue

        const costValue = batches.reduce((sum: number, b: any) => sum + (Number(b.purchase_price) || 0) * (b.quantity_remaining || 0), 0)
        const sellingValue = batches.reduce((sum: number, b: any) => sum + (Number(b.selling_price) || 0) * (b.quantity_remaining || 0), 0)

        totalDeadValue += costValue

        deadItems.push({
            medicine_id: med.id,
            medicine_name: med.name,
            generic_name: med.generic_name,
            category: med.category,
            total_stock: totalStock,
            batch_count: batches.filter((b: any) => b.quantity_remaining > 0).length,
            last_movement_date: lastMovement,
            days_since_movement: daysSince,
            stock_cost_value: Math.round(costValue * 100) / 100,
            stock_selling_value: Math.round(sellingValue * 100) / 100,
        })
    }

    deadItems.sort((a, b) => b.days_since_movement - a.days_since_movement)

    return {
        items: deadItems,
        summary: {
            total_dead_items: deadItems.length,
            total_dead_value: Math.round(totalDeadValue * 100) / 100,
        },
    }
}

export async function getMovementAnalysis(clinicId: string, days: number = 90) {
    const admin = createAdminClient()
    const cutoffDate = new Date(Date.now() - days * 86400000).toISOString()

    // Get all active medicines with stock
    const { data: medicines } = await admin
        .from('medicines')
        .select('id, name, generic_name, category, unit, medicine_batches(quantity_remaining)')
        .eq('organization_id', clinicId)
        .eq('is_active', true)

    if (!medicines) return { items: [], summary: { fast: 0, moderate: 0, slow: 0, dead: 0 } }

    // Get stock_out movements in the period
    const { data: soldMovements } = await admin
        .from('stock_movements')
        .select('medicine_id, quantity')
        .eq('organization_id', clinicId)
        .eq('movement_type', 'stock_out')
        .gte('created_at', cutoffDate)

    // Get stock_in movements in the period
    const { data: purchasedMovements } = await admin
        .from('stock_movements')
        .select('medicine_id, quantity')
        .eq('organization_id', clinicId)
        .eq('movement_type', 'stock_in')
        .gte('created_at', cutoffDate)

    // Aggregate sold per medicine
    const soldMap = new Map<string, number>()
    for (const m of (soldMovements || [])) {
        soldMap.set(m.medicine_id, (soldMap.get(m.medicine_id) || 0) + Math.abs(m.quantity))
    }

    const purchasedMap = new Map<string, number>()
    for (const m of (purchasedMovements || [])) {
        purchasedMap.set(m.medicine_id, (purchasedMap.get(m.medicine_id) || 0) + m.quantity)
    }

    let fast = 0, moderate = 0, slow = 0, dead = 0

    const items = medicines.map((med: any) => {
        const batches = (med.medicine_batches as any[]) || []
        const currentStock = batches.reduce((sum: number, b: any) => sum + (b.quantity_remaining || 0), 0)
        const totalSold = soldMap.get(med.id) || 0
        const totalPurchased = purchasedMap.get(med.id) || 0
        const velocity = Math.round((totalSold / Math.max(days, 1)) * 100) / 100

        let classification: string
        if (totalSold === 0) { classification = 'dead'; dead++ }
        else if (velocity >= 5) { classification = 'fast'; fast++ }
        else if (velocity >= 1) { classification = 'moderate'; moderate++ }
        else { classification = 'slow'; slow++ }

        return {
            medicine_id: med.id,
            medicine_name: med.name,
            generic_name: med.generic_name,
            category: med.category,
            current_stock: currentStock,
            total_sold: totalSold,
            total_purchased: totalPurchased,
            movement_velocity: velocity,
            classification,
        }
    })

    items.sort((a: any, b: any) => b.total_sold - a.total_sold)

    return {
        items,
        summary: { fast, moderate, slow, dead },
    }
}

// ── Medicine suggestions for purchase form ──

export async function getActiveMedicines(clinicId: string) {
    const admin = createAdminClient()

    const { data } = await admin
        .from('medicines')
        .select('id, name, generic_name, unit, gst_rate')
        .eq('organization_id', clinicId)
        .eq('is_active', true)
        .order('name')

    return data || []
}

// ── Batches for a specific medicine (for returns) ──

export async function getMedicineBatchesWithStock(clinicId: string, medicineId: string) {
    const admin = createAdminClient()

    const { data } = await admin
        .from('medicine_batches')
        .select('id, batch_number, expiry_date, quantity_remaining, purchase_price, selling_price, supplier_id')
        .eq('organization_id', clinicId)
        .eq('medicine_id', medicineId)
        .gt('quantity_remaining', 0)
        .order('expiry_date', { ascending: true })

    return data || []
}
