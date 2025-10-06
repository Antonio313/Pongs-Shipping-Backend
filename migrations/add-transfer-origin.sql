-- Migration: Add origin column to transfers table
-- This allows tracking where packages are coming from in addition to where they're going

-- Add origin column to transfers table
ALTER TABLE transfers
ADD COLUMN origin VARCHAR(50);

-- Update existing transfers with a default origin value if needed
-- You can update this based on your business logic
-- For example, setting a default origin for existing transfers:
-- UPDATE transfers SET origin = 'overseas-warehouse' WHERE origin IS NULL;

-- Add a comment to document the column
COMMENT ON COLUMN transfers.origin IS 'Location where packages are being transferred from';
