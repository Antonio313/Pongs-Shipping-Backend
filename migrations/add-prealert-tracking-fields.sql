-- Migration: Add tracking_number and carrier fields to prealerts table
-- Date: 2025-10-05
-- Description: Adds tracking_number and carrier fields to help identify packages

-- Step 1: Add tracking_number column
ALTER TABLE prealerts
ADD COLUMN tracking_number VARCHAR(255);

-- Step 2: Add carrier column
ALTER TABLE prealerts
ADD COLUMN carrier VARCHAR(50);

-- Step 3: Create an index on tracking_number for faster lookups
CREATE INDEX idx_prealerts_tracking_number ON prealerts(tracking_number);

-- Step 4: Add comments to the columns
COMMENT ON COLUMN prealerts.tracking_number IS 'Carrier tracking number provided by the customer';
COMMENT ON COLUMN prealerts.carrier IS 'Shipping carrier (e.g., Amazon, UPS, USPS, FedEx, DHL, Other)';

-- Verification: Check the updated table structure
SELECT column_name, data_type, character_maximum_length, is_nullable
FROM information_schema.columns
WHERE table_name = 'prealerts'
ORDER BY ordinal_position;

-- Sample query to see the new fields
SELECT
    prealert_id,
    user_id,
    description,
    price,
    tracking_number,
    carrier,
    status,
    created_at
FROM prealerts
LIMIT 5;
