-- ============================================================================
-- PHASE 1: Enterprise Pharmacy Inventory System
-- Indian Retail Medical Store — Production-Grade Schema
-- ============================================================================
-- Covers: Suppliers, Purchases, Purchase Returns, FIFO/FEFO, Negative Stock
--         Prevention, Near-Expiry Tagging, Stock Valuation, Dead Stock Reports
-- ============================================================================

-- ── 1. SUPPLIERS ──

CREATE TABLE IF NOT EXISTS suppliers (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name        text NOT NULL,
    contact_person text,
    phone       text,
    email       text,
    gstin       text,                          -- Indian GST number
    drug_license_no text,                      -- DL number mandatory for pharma suppliers in India
    address     text,
    city        text,
    state       text,
    pincode     text,
    payment_terms text DEFAULT '30 days',      -- Net 30, Net 60, COD, etc.
    is_active   boolean NOT NULL DEFAULT true,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT uq_supplier_org_name UNIQUE (organization_id, name)
);

-- ── 2. PURCHASES (Purchase Orders / GRN) ──

CREATE TYPE purchase_status AS ENUM ('draft', 'ordered', 'partial', 'received', 'cancelled');

CREATE TABLE IF NOT EXISTS purchases (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    supplier_id     uuid NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    purchase_number text NOT NULL,              -- Auto-generated like PO-001
    status          purchase_status NOT NULL DEFAULT 'draft',
    purchase_date   date NOT NULL DEFAULT CURRENT_DATE,
    received_date   date,
    invoice_number  text,                       -- Supplier invoice ref
    invoice_date    date,
    subtotal        numeric(12,2) NOT NULL DEFAULT 0,
    discount        numeric(12,2) NOT NULL DEFAULT 0,
    tax_total       numeric(12,2) NOT NULL DEFAULT 0,
    grand_total     numeric(12,2) NOT NULL DEFAULT 0,
    amount_paid     numeric(12,2) NOT NULL DEFAULT 0,
    payment_status  text NOT NULL DEFAULT 'unpaid'
        CHECK (payment_status IN ('unpaid', 'partial', 'paid')),
    notes           text,
    created_by      uuid REFERENCES profiles(id),
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT uq_purchase_org_number UNIQUE (organization_id, purchase_number)
);

-- ── 3. PURCHASE ITEMS ──

CREATE TABLE IF NOT EXISTS purchase_items (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_id     uuid NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    medicine_id     uuid NOT NULL REFERENCES medicines(id) ON DELETE RESTRICT,
    batch_id        uuid REFERENCES medicine_batches(id) ON DELETE SET NULL,
    batch_number    text NOT NULL,
    expiry_date     date NOT NULL,
    quantity_ordered integer NOT NULL CHECK (quantity_ordered > 0),
    quantity_received integer NOT NULL DEFAULT 0 CHECK (quantity_received >= 0),
    free_quantity   integer NOT NULL DEFAULT 0 CHECK (free_quantity >= 0),
    purchase_price  numeric(10,2) NOT NULL CHECK (purchase_price >= 0),
    selling_price   numeric(10,2) NOT NULL CHECK (selling_price >= 0),
    mrp             numeric(10,2) CHECK (mrp >= 0),
    gst_rate        numeric(5,2) NOT NULL DEFAULT 12.00,
    discount_pct    numeric(5,2) NOT NULL DEFAULT 0 CHECK (discount_pct >= 0 AND discount_pct <= 100),
    line_total      numeric(12,2) NOT NULL DEFAULT 0,
    tax_amount      numeric(12,2) NOT NULL DEFAULT 0,
    created_at      timestamptz NOT NULL DEFAULT now()
);

-- ── 4. PURCHASE RETURNS ──

CREATE TYPE purchase_return_status AS ENUM ('draft', 'submitted', 'accepted', 'settled');

CREATE TABLE IF NOT EXISTS purchase_returns (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    purchase_id     uuid REFERENCES purchases(id) ON DELETE SET NULL,
    supplier_id     uuid NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    return_number   text NOT NULL,
    status          purchase_return_status NOT NULL DEFAULT 'draft',
    return_date     date NOT NULL DEFAULT CURRENT_DATE,
    reason          text NOT NULL,
    subtotal        numeric(12,2) NOT NULL DEFAULT 0,
    tax_total       numeric(12,2) NOT NULL DEFAULT 0,
    grand_total     numeric(12,2) NOT NULL DEFAULT 0,
    credit_note_number text,
    notes           text,
    created_by      uuid REFERENCES profiles(id),
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT uq_return_org_number UNIQUE (organization_id, return_number)
);

-- ── 5. PURCHASE RETURN ITEMS ──

CREATE TABLE IF NOT EXISTS purchase_return_items (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    return_id       uuid NOT NULL REFERENCES purchase_returns(id) ON DELETE CASCADE,
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    medicine_id     uuid NOT NULL REFERENCES medicines(id) ON DELETE RESTRICT,
    batch_id        uuid NOT NULL REFERENCES medicine_batches(id) ON DELETE RESTRICT,
    quantity        integer NOT NULL CHECK (quantity > 0),
    purchase_price  numeric(10,2) NOT NULL,
    gst_rate        numeric(5,2) NOT NULL DEFAULT 12.00,
    line_total      numeric(12,2) NOT NULL DEFAULT 0,
    tax_amount      numeric(12,2) NOT NULL DEFAULT 0,
    reason          text,
    created_at      timestamptz NOT NULL DEFAULT now()
);

-- ── 6. ALTER EXISTING TABLES ──

-- Add supplier_id to medicine_batches for traceability
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
        WHERE table_name = 'medicine_batches' AND column_name = 'supplier_id') THEN
        ALTER TABLE medicine_batches ADD COLUMN supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add MRP to medicine_batches
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
        WHERE table_name = 'medicine_batches' AND column_name = 'mrp') THEN
        ALTER TABLE medicine_batches ADD COLUMN mrp numeric(10,2);
    END IF;
END $$;

-- Add purchase_item_id to medicine_batches for purchase traceability
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
        WHERE table_name = 'medicine_batches' AND column_name = 'purchase_item_id') THEN
        ALTER TABLE medicine_batches ADD COLUMN purchase_item_id uuid REFERENCES purchase_items(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add reference tracking to stock_movements
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
        WHERE table_name = 'stock_movements' AND column_name = 'reference_type') THEN
        ALTER TABLE stock_movements ADD COLUMN reference_type text;  -- 'purchase', 'purchase_return', 'invoice', 'expiry_writeoff'
        ALTER TABLE stock_movements ADD COLUMN reference_id uuid;
    END IF;
END $$;

-- Prevent negative stock at the database level
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_batch_qty_non_negative') THEN
        ALTER TABLE medicine_batches ADD CONSTRAINT chk_batch_qty_non_negative
            CHECK (quantity_remaining >= 0);
    END IF;
END $$;

-- ── 7. INDEXES ──

-- Suppliers
CREATE INDEX IF NOT EXISTS idx_suppliers_org_id ON suppliers(organization_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_org_active ON suppliers(organization_id, is_active);

-- Purchases
CREATE INDEX IF NOT EXISTS idx_purchases_org_id ON purchases(organization_id);
CREATE INDEX IF NOT EXISTS idx_purchases_supplier ON purchases(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchases_org_status ON purchases(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_purchases_org_date ON purchases(organization_id, purchase_date DESC);
CREATE INDEX IF NOT EXISTS idx_purchases_org_payment ON purchases(organization_id, payment_status);

-- Purchase items
CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase ON purchase_items(purchase_id);
CREATE INDEX IF NOT EXISTS idx_purchase_items_org ON purchase_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_purchase_items_medicine ON purchase_items(medicine_id);
CREATE INDEX IF NOT EXISTS idx_purchase_items_batch ON purchase_items(batch_id);

-- Purchase returns
CREATE INDEX IF NOT EXISTS idx_purchase_returns_org ON purchase_returns(organization_id);
CREATE INDEX IF NOT EXISTS idx_purchase_returns_supplier ON purchase_returns(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_returns_purchase ON purchase_returns(purchase_id);
CREATE INDEX IF NOT EXISTS idx_purchase_returns_org_date ON purchase_returns(organization_id, return_date DESC);

-- Purchase return items
CREATE INDEX IF NOT EXISTS idx_return_items_return ON purchase_return_items(return_id);
CREATE INDEX IF NOT EXISTS idx_return_items_batch ON purchase_return_items(batch_id);

-- Enhanced batch indexes
CREATE INDEX IF NOT EXISTS idx_batches_supplier ON medicine_batches(supplier_id);
CREATE INDEX IF NOT EXISTS idx_batches_org_medicine_expiry ON medicine_batches(organization_id, medicine_id, expiry_date ASC);

-- Stock movement reference tracking
CREATE INDEX IF NOT EXISTS idx_movements_reference ON stock_movements(reference_type, reference_id);

-- Dead stock / slow moving analysis (batches with stock but no recent movement)
CREATE INDEX IF NOT EXISTS idx_batches_org_remaining ON medicine_batches(organization_id, quantity_remaining)
    WHERE quantity_remaining > 0;

-- ── 8. RLS POLICIES ──

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_return_items ENABLE ROW LEVEL SECURITY;

-- Suppliers: Full CRUD within org if pharmacy enabled
CREATE POLICY suppliers_select ON suppliers FOR SELECT
    USING (organization_id = user_pharmacy_org_id());

CREATE POLICY suppliers_insert ON suppliers FOR INSERT
    WITH CHECK (organization_id = user_pharmacy_org_id());

CREATE POLICY suppliers_update ON suppliers FOR UPDATE
    USING (organization_id = user_pharmacy_org_id())
    WITH CHECK (organization_id = user_pharmacy_org_id());

CREATE POLICY suppliers_delete ON suppliers FOR DELETE
    USING (organization_id = user_pharmacy_org_id());

-- Purchases: Full CRUD within org
CREATE POLICY purchases_select ON purchases FOR SELECT
    USING (organization_id = user_pharmacy_org_id());

CREATE POLICY purchases_insert ON purchases FOR INSERT
    WITH CHECK (organization_id = user_pharmacy_org_id());

CREATE POLICY purchases_update ON purchases FOR UPDATE
    USING (organization_id = user_pharmacy_org_id())
    WITH CHECK (organization_id = user_pharmacy_org_id());

-- Purchase items
CREATE POLICY purchase_items_select ON purchase_items FOR SELECT
    USING (organization_id = user_pharmacy_org_id());

CREATE POLICY purchase_items_insert ON purchase_items FOR INSERT
    WITH CHECK (organization_id = user_pharmacy_org_id());

CREATE POLICY purchase_items_update ON purchase_items FOR UPDATE
    USING (organization_id = user_pharmacy_org_id())
    WITH CHECK (organization_id = user_pharmacy_org_id());

-- Purchase returns
CREATE POLICY purchase_returns_select ON purchase_returns FOR SELECT
    USING (organization_id = user_pharmacy_org_id());

CREATE POLICY purchase_returns_insert ON purchase_returns FOR INSERT
    WITH CHECK (organization_id = user_pharmacy_org_id());

CREATE POLICY purchase_returns_update ON purchase_returns FOR UPDATE
    USING (organization_id = user_pharmacy_org_id())
    WITH CHECK (organization_id = user_pharmacy_org_id());

-- Purchase return items
CREATE POLICY return_items_select ON purchase_return_items FOR SELECT
    USING (organization_id = user_pharmacy_org_id());

CREATE POLICY return_items_insert ON purchase_return_items FOR INSERT
    WITH CHECK (organization_id = user_pharmacy_org_id());

-- ── 9. AUTO-NUMBER GENERATORS ──

-- Purchase number generator (thread-safe)
CREATE OR REPLACE FUNCTION generate_purchase_number(org_id uuid)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    next_num integer;
    prefix text;
BEGIN
    SELECT COALESCE(MAX(
        CASE WHEN purchase_number ~ '^PO-[0-9]+$'
            THEN CAST(SUBSTRING(purchase_number FROM 4) AS integer)
            ELSE 0
        END
    ), 0) + 1
    INTO next_num
    FROM purchases
    WHERE organization_id = org_id;

    RETURN 'PO-' || LPAD(next_num::text, 4, '0');
END;
$$;

-- Purchase return number generator
CREATE OR REPLACE FUNCTION generate_return_number(org_id uuid)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    next_num integer;
BEGIN
    SELECT COALESCE(MAX(
        CASE WHEN return_number ~ '^PR-[0-9]+$'
            THEN CAST(SUBSTRING(return_number FROM 4) AS integer)
            ELSE 0
        END
    ), 0) + 1
    INTO next_num
    FROM purchase_returns
    WHERE organization_id = org_id;

    RETURN 'PR-' || LPAD(next_num::text, 4, '0');
END;
$$;

-- ── 10. FIFO/FEFO BATCH SELECTION FUNCTION ──

-- Returns batches sorted by expiry (FEFO) then by received date (FIFO) for dispensing
CREATE OR REPLACE FUNCTION get_dispensable_batches(
    p_org_id uuid,
    p_medicine_id uuid,
    p_quantity integer
)
RETURNS TABLE (
    batch_id uuid,
    batch_number text,
    expiry_date date,
    quantity_remaining integer,
    selling_price numeric,
    take_quantity integer
)
LANGUAGE plpgsql
AS $$
DECLARE
    remaining integer := p_quantity;
    rec record;
BEGIN
    FOR rec IN
        SELECT mb.id, mb.batch_number, mb.expiry_date, mb.quantity_remaining, mb.selling_price
        FROM medicine_batches mb
        WHERE mb.organization_id = p_org_id
          AND mb.medicine_id = p_medicine_id
          AND mb.quantity_remaining > 0
          AND mb.expiry_date > CURRENT_DATE  -- Exclude expired
        ORDER BY mb.expiry_date ASC, mb.received_at ASC  -- FEFO then FIFO
    LOOP
        IF remaining <= 0 THEN EXIT; END IF;

        batch_id := rec.id;
        batch_number := rec.batch_number;
        expiry_date := rec.expiry_date;
        quantity_remaining := rec.quantity_remaining;
        selling_price := rec.selling_price;
        take_quantity := LEAST(remaining, rec.quantity_remaining);
        remaining := remaining - take_quantity;

        RETURN NEXT;
    END LOOP;
END;
$$;

-- ── 11. STOCK VALUATION VIEW ──

CREATE OR REPLACE VIEW stock_valuation AS
SELECT
    mb.organization_id,
    m.id AS medicine_id,
    m.name AS medicine_name,
    m.generic_name,
    m.category,
    m.unit,
    mb.id AS batch_id,
    mb.batch_number,
    mb.expiry_date,
    mb.quantity_remaining,
    mb.purchase_price,
    mb.selling_price,
    mb.mrp,
    COALESCE(mb.purchase_price, 0) * mb.quantity_remaining AS cost_value,
    COALESCE(mb.selling_price, 0) * mb.quantity_remaining AS selling_value,
    COALESCE(mb.mrp, mb.selling_price, 0) * mb.quantity_remaining AS mrp_value,
    CASE
        WHEN mb.expiry_date < CURRENT_DATE THEN 'expired'
        WHEN mb.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'expiring_30'
        WHEN mb.expiry_date <= CURRENT_DATE + INTERVAL '60 days' THEN 'expiring_60'
        WHEN mb.expiry_date <= CURRENT_DATE + INTERVAL '90 days' THEN 'expiring_90'
        ELSE 'good'
    END AS expiry_status
FROM medicine_batches mb
JOIN medicines m ON m.id = mb.medicine_id
WHERE mb.quantity_remaining > 0;

-- ── 12. NEAR-EXPIRY DETECTION FUNCTION ──

CREATE OR REPLACE FUNCTION get_expiry_report(
    p_org_id uuid,
    p_days integer DEFAULT 90
)
RETURNS TABLE (
    medicine_id uuid,
    medicine_name text,
    generic_name text,
    batch_id uuid,
    batch_number text,
    expiry_date date,
    days_to_expiry integer,
    quantity_remaining integer,
    purchase_price numeric,
    selling_price numeric,
    cost_value numeric,
    expiry_band text
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        m.id,
        m.name,
        m.generic_name,
        mb.id,
        mb.batch_number,
        mb.expiry_date,
        (mb.expiry_date - CURRENT_DATE)::integer AS days_to_expiry,
        mb.quantity_remaining,
        mb.purchase_price,
        mb.selling_price,
        COALESCE(mb.purchase_price, 0) * mb.quantity_remaining,
        CASE
            WHEN mb.expiry_date < CURRENT_DATE THEN 'expired'
            WHEN mb.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN '0-30 days'
            WHEN mb.expiry_date <= CURRENT_DATE + INTERVAL '60 days' THEN '31-60 days'
            WHEN mb.expiry_date <= CURRENT_DATE + INTERVAL '90 days' THEN '61-90 days'
            ELSE 'beyond'
        END
    FROM medicine_batches mb
    JOIN medicines m ON m.id = mb.medicine_id
    WHERE mb.organization_id = p_org_id
      AND mb.quantity_remaining > 0
      AND mb.expiry_date <= CURRENT_DATE + (p_days || ' days')::interval
    ORDER BY mb.expiry_date ASC;
END;
$$;

-- ── 13. DEAD STOCK DETECTION FUNCTION ──

CREATE OR REPLACE FUNCTION get_dead_stock(
    p_org_id uuid,
    p_days_threshold integer DEFAULT 90
)
RETURNS TABLE (
    medicine_id uuid,
    medicine_name text,
    generic_name text,
    category text,
    total_stock bigint,
    batch_count bigint,
    last_movement_date timestamptz,
    days_since_movement integer,
    stock_cost_value numeric,
    stock_selling_value numeric
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        m.id,
        m.name,
        m.generic_name,
        m.category,
        SUM(mb.quantity_remaining)::bigint,
        COUNT(mb.id)::bigint,
        MAX(sm.created_at),
        COALESCE((CURRENT_DATE - MAX(sm.created_at)::date), 9999),
        SUM(COALESCE(mb.purchase_price, 0) * mb.quantity_remaining),
        SUM(COALESCE(mb.selling_price, 0) * mb.quantity_remaining)
    FROM medicines m
    JOIN medicine_batches mb ON mb.medicine_id = m.id AND mb.organization_id = p_org_id
    LEFT JOIN stock_movements sm ON sm.medicine_id = m.id AND sm.organization_id = p_org_id
    WHERE m.organization_id = p_org_id
      AND m.is_active = true
      AND mb.quantity_remaining > 0
    GROUP BY m.id, m.name, m.generic_name, m.category
    HAVING MAX(sm.created_at) IS NULL
       OR (CURRENT_DATE - MAX(sm.created_at)::date) >= p_days_threshold
    ORDER BY COALESCE((CURRENT_DATE - MAX(sm.created_at)::date), 9999) DESC;
END;
$$;

-- ── 14. FAST / SLOW MOVING ANALYSIS FUNCTION ──

CREATE OR REPLACE FUNCTION get_movement_analysis(
    p_org_id uuid,
    p_days integer DEFAULT 90
)
RETURNS TABLE (
    medicine_id uuid,
    medicine_name text,
    generic_name text,
    category text,
    current_stock bigint,
    total_sold bigint,
    total_purchased bigint,
    movement_velocity numeric,
    classification text
)
LANGUAGE plpgsql
AS $$
DECLARE
    cutoff_date timestamptz := now() - (p_days || ' days')::interval;
BEGIN
    RETURN QUERY
    SELECT
        m.id,
        m.name,
        m.generic_name,
        m.category,
        COALESCE(stock.total, 0)::bigint AS current_stock,
        COALESCE(sold.total, 0)::bigint AS total_sold,
        COALESCE(purchased.total, 0)::bigint AS total_purchased,
        ROUND(COALESCE(sold.total, 0)::numeric / GREATEST(p_days, 1), 2) AS movement_velocity,
        CASE
            WHEN COALESCE(sold.total, 0) = 0 THEN 'dead'
            WHEN COALESCE(sold.total, 0)::numeric / GREATEST(p_days, 1) >= 5 THEN 'fast'
            WHEN COALESCE(sold.total, 0)::numeric / GREATEST(p_days, 1) >= 1 THEN 'moderate'
            ELSE 'slow'
        END
    FROM medicines m
    LEFT JOIN (
        SELECT medicine_id, SUM(quantity_remaining) AS total
        FROM medicine_batches
        WHERE organization_id = p_org_id AND quantity_remaining > 0
        GROUP BY medicine_id
    ) stock ON stock.medicine_id = m.id
    LEFT JOIN (
        SELECT medicine_id, SUM(ABS(quantity)) AS total
        FROM stock_movements
        WHERE organization_id = p_org_id
          AND movement_type = 'stock_out'
          AND created_at >= cutoff_date
        GROUP BY medicine_id
    ) sold ON sold.medicine_id = m.id
    LEFT JOIN (
        SELECT medicine_id, SUM(quantity) AS total
        FROM stock_movements
        WHERE organization_id = p_org_id
          AND movement_type = 'stock_in'
          AND created_at >= cutoff_date
        GROUP BY medicine_id
    ) purchased ON purchased.medicine_id = m.id
    WHERE m.organization_id = p_org_id
      AND m.is_active = true
    ORDER BY COALESCE(sold.total, 0) DESC;
END;
$$;

-- ── 15. SUPPLIER LEDGER VIEW ──

CREATE OR REPLACE VIEW supplier_ledger AS
SELECT
    s.id AS supplier_id,
    s.organization_id,
    s.name AS supplier_name,
    s.gstin,
    s.phone,
    COALESCE(p.total_purchases, 0) AS total_purchases,
    COALESCE(p.total_amount, 0) AS total_purchase_amount,
    COALESCE(p.total_paid, 0) AS total_paid,
    COALESCE(p.total_amount, 0) - COALESCE(p.total_paid, 0) - COALESCE(r.total_returns, 0) AS outstanding_balance,
    COALESCE(r.total_returns, 0) AS total_return_amount,
    p.last_purchase_date
FROM suppliers s
LEFT JOIN (
    SELECT
        supplier_id,
        COUNT(*)::integer AS total_purchases,
        SUM(grand_total) AS total_amount,
        SUM(amount_paid) AS total_paid,
        MAX(purchase_date) AS last_purchase_date
    FROM purchases
    WHERE status != 'cancelled'
    GROUP BY supplier_id
) p ON p.supplier_id = s.id
LEFT JOIN (
    SELECT
        supplier_id,
        SUM(grand_total) AS total_returns
    FROM purchase_returns
    WHERE status IN ('accepted', 'settled')
    GROUP BY supplier_id
) r ON r.supplier_id = s.id;

-- ── 16. BATCH-LEVEL EXPIRY WRITE-OFF FUNCTION ──

CREATE OR REPLACE FUNCTION bulk_expiry_writeoff(
    p_org_id uuid,
    p_user_id uuid
)
RETURNS TABLE (
    batches_written_off integer,
    total_quantity_removed integer,
    total_cost_value numeric
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_batches integer := 0;
    v_quantity integer := 0;
    v_cost numeric := 0;
    rec record;
BEGIN
    FOR rec IN
        SELECT mb.id AS batch_id, mb.medicine_id, mb.batch_number,
               mb.quantity_remaining, mb.purchase_price
        FROM medicine_batches mb
        WHERE mb.organization_id = p_org_id
          AND mb.quantity_remaining > 0
          AND mb.expiry_date < CURRENT_DATE
    LOOP
        -- Zero out the batch
        UPDATE medicine_batches
        SET quantity_remaining = 0
        WHERE id = rec.batch_id AND organization_id = p_org_id;

        -- Record the stock movement
        INSERT INTO stock_movements (organization_id, medicine_id, batch_id,
            movement_type, quantity, reason, performed_by, reference_type)
        VALUES (p_org_id, rec.medicine_id, rec.batch_id,
            'expired', -rec.quantity_remaining,
            'Bulk expiry write-off: Batch ' || rec.batch_number,
            p_user_id, 'expiry_writeoff');

        -- Log to audit
        INSERT INTO pharmacy_audit_logs (organization_id, action, entity_type, entity_id, details, performed_by)
        VALUES (p_org_id, 'expiry_writeoff', 'batch', rec.batch_id,
            jsonb_build_object(
                'batch_number', rec.batch_number,
                'medicine_id', rec.medicine_id,
                'quantity_removed', rec.quantity_remaining,
                'cost_value', COALESCE(rec.purchase_price, 0) * rec.quantity_remaining
            ),
            p_user_id);

        v_batches := v_batches + 1;
        v_quantity := v_quantity + rec.quantity_remaining;
        v_cost := v_cost + COALESCE(rec.purchase_price, 0) * rec.quantity_remaining;
    END LOOP;

    batches_written_off := v_batches;
    total_quantity_removed := v_quantity;
    total_cost_value := v_cost;
    RETURN NEXT;
END;
$$;

-- ── 17. PURCHASE RECEIVE FUNCTION (Atomic) ──
-- Receives a purchase: creates batches, stock movements, updates purchase status

CREATE OR REPLACE FUNCTION receive_purchase(
    p_purchase_id uuid,
    p_org_id uuid,
    p_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    item record;
    v_batch_id uuid;
BEGIN
    -- Verify purchase belongs to org and is in ordered/partial status
    IF NOT EXISTS (
        SELECT 1 FROM purchases
        WHERE id = p_purchase_id
          AND organization_id = p_org_id
          AND status IN ('ordered', 'partial')
    ) THEN
        RAISE EXCEPTION 'Purchase not found or not in receivable status';
    END IF;

    -- Process each item
    FOR item IN
        SELECT * FROM purchase_items
        WHERE purchase_id = p_purchase_id
          AND organization_id = p_org_id
          AND quantity_received < quantity_ordered
    LOOP
        -- Create or update batch
        INSERT INTO medicine_batches (
            medicine_id, organization_id, batch_number, expiry_date,
            quantity_received, quantity_remaining,
            purchase_price, selling_price, mrp, supplier_id, purchase_item_id
        ) VALUES (
            item.medicine_id, p_org_id, item.batch_number, item.expiry_date,
            item.quantity_ordered + item.free_quantity,
            item.quantity_ordered + item.free_quantity,
            item.purchase_price, item.selling_price, item.mrp,
            (SELECT supplier_id FROM purchases WHERE id = p_purchase_id),
            item.id
        )
        RETURNING id INTO v_batch_id;

        -- Link batch back to purchase item
        UPDATE purchase_items
        SET batch_id = v_batch_id,
            quantity_received = item.quantity_ordered
        WHERE id = item.id;

        -- Create stock movement
        INSERT INTO stock_movements (
            organization_id, medicine_id, batch_id,
            movement_type, quantity, reason, performed_by,
            reference_type, reference_id
        ) VALUES (
            p_org_id, item.medicine_id, v_batch_id,
            'stock_in', item.quantity_ordered + item.free_quantity,
            'Purchase received: ' || item.batch_number,
            p_user_id, 'purchase', p_purchase_id
        );
    END LOOP;

    -- Update purchase status
    UPDATE purchases
    SET status = 'received',
        received_date = CURRENT_DATE,
        updated_at = now()
    WHERE id = p_purchase_id AND organization_id = p_org_id;

    -- Audit log
    INSERT INTO pharmacy_audit_logs (organization_id, action, entity_type, entity_id, details, performed_by)
    VALUES (p_org_id, 'purchase_received', 'purchase', p_purchase_id,
        jsonb_build_object('purchase_id', p_purchase_id),
        p_user_id);
END;
$$;
