-- Add signature_url column to doctors table
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS signature_url text;
